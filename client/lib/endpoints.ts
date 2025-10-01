// Centralized API endpoint and helper

// Use direct API endpoint everywhere (localhost and production)
export const API_URL = "https://api-va5v.onrender.com/generate-questions" as const;

export type FetchOnceResult = any;

// fetchOnce accepts either a plain object (JSON) or FormData
export async function fetchOnce(payload: Record<string, any> | FormData): Promise<FetchOnceResult> {
  const isForm = typeof FormData !== "undefined" && payload instanceof FormData;

  try {
    // Append cache-busting timestamp and always use direct API (no proxy)
    const ts = Date.now();
    const url = `${API_URL}?t=${ts}`;

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
        return j ?? { success: false, message: "Server busy, please try again." };
      } catch {
        return { success: false, message: "Server busy, please try again." };
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
    return { success: false, message: "Server busy, please try again." };
  }
}

// Single-retry wrapper with small backoff
// Single-attempt wrapper (no auto-retries)
export async function fetchWithRetry(
  payload: Record<string, any> | FormData,
  _retryCount = 0,
): Promise<FetchOnceResult> {
  const res = await fetchOnce(payload);
  return res ?? { success: false, message: "Server busy, please try again." };
}
