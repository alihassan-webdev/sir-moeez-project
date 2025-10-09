import type { RequestHandler } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

const DEFAULT_API = "https://api-va5v.onrender.com/generate-questions" as const;

// Middleware stack: multer first to parse multipart with single PDF file named "pdf" (we also accept "file")
export const uploadPdf = upload.fields([
  { name: "pdf", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

export const handleGenerate: RequestHandler = async (req, res) => {
  try {
    const body = req.body as Record<string, string>;

    const files = req.files as Record<string, any[]> | undefined;
    const file: any | undefined = files?.pdf?.[0] || files?.file?.[0];

    if (!file) {
      return res
        .status(400)
        .json({ error: "Missing PDF file. Use 'pdf' field." });
    }

    const query = (body?.query ?? body?.q ?? "").toString();

    // Note: Previously responses were cached. Caching is disabled to always generate fresh output.
    const form = new FormData();
    const uint8 = new Uint8Array(file.buffer);
    const blob = new Blob([uint8], {
      type: file.mimetype || "application/pdf",
    });
    // Append only once to avoid duplicating payload size
    form.append("pdf", blob, file.originalname || "document.pdf");
    if (query) form.append("query", query);
    // Optional expected count for validation (provided by client)
    const expectedStr = (body?.expected ?? body?.expectedCount ?? body?.count ?? "").toString();
    const expected = Number.isFinite(Number(expectedStr)) ? Number(expectedStr) : undefined;
    if (expected && expected > 0) form.append("expected", String(expected));
    // Unique request id to enforce freshness
    const reqId = (body?.requestId ?? Date.now()).toString();
    form.append("requestId", reqId);

    // Build list of upstreams to try: env -> default -> Netlify proxy on same host
    const upstreams: string[] = [];
    const envBase = process.env.PREDICT_ENDPOINT;
    const normalize = (base: string) => {
      try {
        const u = new URL(base);
        const path = u.pathname.replace(/\/+$/, "");
        if (!/\/generate-questions$/.test(path))
          u.pathname = `${path}/generate-questions`;
        if (query) u.searchParams.set("query", query);
        return u.toString();
      } catch {
        const b = String(base).replace(/\/+$/, "");
        const url = new URL(`${b}/generate-questions`);
        if (query) url.searchParams.set("query", query);
        return url.toString();
      }
    };
    if (envBase && envBase.trim()) upstreams.push(normalize(envBase));
    upstreams.push(normalize(DEFAULT_API));

    // Same-host Netlify proxy fallback
    const host = String(
      req.headers["x-forwarded-host"] || req.headers.host || "",
    );
    const proto = String(req.headers["x-forwarded-proto"] || "https");
    if (host)
      upstreams.push(
        `${proto}://${host}/api/proxy${query ? `?query=${encodeURIComponent(query)}` : ""}`,
      );

    let finalResp: Response | null = null;
    for (const target of upstreams) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);
        const resp = await fetch(target, {
          method: "POST",
          body: form,
          signal: controller.signal,
          cache: "no-store",
          headers: {
            "x-request-id": reqId,
            Accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
          },
        }).finally(() => clearTimeout(timeout));
        if (resp && resp.ok) {
          finalResp = resp;
          break;
        }
        // If not ok, continue trying next
      } catch {
        // network error -> try next
      }
    }

    if (!finalResp) {
      return res
        .status(502)
        .json({ error: true, message: "All upstreams failed" });
    }

    const contentType = finalResp.headers.get("content-type") || "";

    if (!finalResp.ok) {
      const errText = await finalResp.text().catch(() => finalResp.statusText);
      return res
        .status(finalResp.status)
        .json({ error: true, message: errText || "Upstream error" });
    }

    // Helper to extract text content from upstream response
    const extractText = async (r: Response): Promise<string> => {
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await r.json().catch(async () => await r.text());
        const got =
          typeof j === "string"
            ? j
            : (j?.questions ?? j?.result ?? j?.message ?? JSON.stringify(j));
        return String(got ?? "").trim();
      }
      return String((await r.text()) ?? "").trim();
    };

    const validateCount = (txt: string, exp?: number): boolean => {
      if (!exp || exp <= 0) return true; // nothing to validate
      // Count lines that start with Q<number> followed by . or ) or :
      let matches = txt.match(/^\s*Q\s*\d+\s*[\.)\:]/gim) || [];
      let count = matches.length;
      if (count === 0) {
        // Fallback: lines that start with <number> followed by . or ) or :
        matches = txt.match(/^\s*\d+\s*[\.)\:]/gim) || [];
        count = matches.length;
      }
      return count === exp;
    };

    let text = await extractText(finalResp);
    if (!validateCount(text, expected)) {
      // retry once with a new request id
      const retryForm = new FormData();
      retryForm.append("pdf", blob, file.originalname || "document.pdf");
      if (query) retryForm.append("query", query);
      if (expected && expected > 0) retryForm.append("expected", String(expected));
      const newReqId = String(Date.now());
      retryForm.append("requestId", newReqId);

      let retried = false;
      for (const target of upstreams) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 60_000);
          const resp2 = await fetch(target, {
            method: "POST",
            body: retryForm,
            signal: controller.signal,
            cache: "no-store",
            headers: { "x-request-id": newReqId, Accept: "application/json, text/plain;q=0.9,*/*;q=0.8" },
          }).finally(() => clearTimeout(timeout));
          if (resp2 && resp2.ok) {
            text = await extractText(resp2);
            retried = true;
            break;
          }
        } catch {}
      }
      if (!validateCount(text, expected)) {
        return res
          .status(422)
          .json({ error: true, message: "Could not generate the exact requested number of questions.", result: text, expected });
      }
    }

    return res.status(200).json({ result: text });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return res.status(504).json({ error: true, message: "Upstream timeout" });
    }
    return res
      .status(500)
      .json({ error: true, message: err?.message || "Internal Server Error" });
  }
};
