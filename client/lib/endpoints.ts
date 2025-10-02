// Centralized API endpoint and helper

// Prefer VITE_PREDICT_ENDPOINT (e.g., "/api/predict" -> Netlify redirect),
// fall back to local proxy for dev, then to generate-questions path.
const ENV_EP = (import.meta as any)?.env?.VITE_PREDICT_ENDPOINT as
  | string
  | undefined;
export const API_URL: string = (() => {
  const fromEnv = (ENV_EP || "").trim();
  if (fromEnv) return fromEnv;
  return "/api/proxy"; // local dev route registered in server/index.ts
})();

export type FetchOnceResult = any;

// fetchOnce accepts either a plain object (JSON) or FormData
export async function fetchOnce(payload: Record<string, any> | FormData): Promise<FetchOnceResult> {
  const isForm = typeof FormData !== "undefined" && payload instanceof FormData;

  try {
    // Append cache-busting timestamp and support absolute URL in preview/live
    const ts = Date.now();
    const netlifySite = (import.meta as any)?.env?.VITE_NETLIFY_SITE_URL as string | undefined;
    const isLocal = typeof window !== "undefined" && /localhost|127\.0\.0\.1/i.test(window.location.host);
    const base = !isLocal && netlifySite ? netlifySite.replace(/\/$/, "") : "";
    const url = `${base}${API_URL}?t=${ts}`;

    let res: Response;
    if (isForm) {
      // FormData: let the browser set proper multipart headers
      (payload as FormData).set("_ts", String(ts));
      res = await fetch(url, {
        method: "POST",
        body: payload as FormData,
        cache: "no-store",
      });
    } else {
      const body = JSON.stringify({ ...(payload as Record<string, any>), _ts: ts });
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        cache: "no-store",
      });
    }
    if (!res.ok) {
      // Try to parse error JSON; fall back to generic
      try {
        const j = await res.json();
        return j ?? { success: false, message: "⚠️ Server busy, please try again." };
      } catch {
        return { success: false, message: "⚠️ Server busy, please try again." };
      }
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      return await res.json();
    }
    // Normalize non-JSON text into a JSON shape
    const text = await res.text();
    return { success: true, result: text };
  } catch {
    return { success: false, message: "⚠️ Server busy, please try again." };
  }
}

// Single-retry wrapper with small backoff
export async function fetchWithRetry(
  payload: Record<string, any> | FormData,
  retryCount = 1,
): Promise<FetchOnceResult> {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let last: FetchOnceResult | null = null;
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    const res = await fetchOnce(payload);
    if (res && res.success !== false) return res;
    last = res;
    if (attempt < retryCount) await sleep(800);
  }
  return last ?? { success: false, message: "⚠️ Server busy, please try again." };
}
