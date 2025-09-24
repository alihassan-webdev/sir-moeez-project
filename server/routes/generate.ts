import type { RequestHandler } from "express";
import multer from "multer";
import { createHash } from "node:crypto";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

const EXTERNAL_API =
  "https://api-va5v.onrender.com/generate-questions" as const;

const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map<string, { ts: number; json?: any; text?: string }>();

// Middleware stack: multer first to parse multipart with single PDF file named "pdf" (we also accept "file")
export const uploadPdf = upload.fields([
  { name: "pdf", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

export const handleGenerate: RequestHandler = async (req, res) => {
  try {
    const body = req.body as Record<string, string>;

    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;
    const file: Express.Multer.File | undefined =
      files?.pdf?.[0] || files?.file?.[0];

    if (!file) {
      return res
        .status(400)
        .json({ error: "Missing PDF file. Use 'pdf' field." });
    }

    const query = (body?.query ?? body?.q ?? "").toString();

    const key = createHash("sha256")
      .update(file.buffer)
      .update("|")
      .update(query)
      .digest("hex");
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      if (cached.json !== undefined) {
        return res.status(200).json(cached.json);
      }
      return res.status(200).json({ result: cached.text ?? "" });
    }
    const form = new FormData();
    const uint8 = new Uint8Array(file.buffer);
    const blob = new Blob([uint8], {
      type: file.mimetype || "application/pdf",
    });
    // Append only once to avoid duplicating payload size
    form.append("pdf", blob, file.originalname || "document.pdf");
    if (query) form.append("query", query);

    // Also support query as URL search param for target API if they expect it there
    const url = new URL(EXTERNAL_API);
    if (query) url.searchParams.set("query", query);

    // Abort if upstream is too slow to respond (bump to 60s for public proxies)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    const upstream = await fetch(url, {
      method: "POST",
      body: form,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const contentType = upstream.headers.get("content-type") || "";

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => upstream.statusText);
      return res.status(upstream.status).json({ error: true, message: errText || "Upstream error" });
    }

    if (contentType.includes("application/json")) {
      const json = await upstream.json();
      cache.set(key, { ts: Date.now(), json });
      return res.status(200).json(json);
    }

    // Fallback: return text result under a consistent shape
    const text = await upstream.text();
    cache.set(key, { ts: Date.now(), text });
    return res.status(200).json({ result: text });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return res.status(504).json({ error: true, message: "Upstream timeout" });
    }
    return res.status(500).json({ error: true, message: err?.message || "Internal Server Error" });
  }
};
