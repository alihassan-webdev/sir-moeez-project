// Centralized API endpoint and helper (no env, no proxies)
const PROXY_URL = "/api/proxy" as const; // served by Express in dev and Netlify function in prod

export type FetchOnceResult = any;

// fetchOnce accepts either a plain object (JSON) or FormData
// Rules:
// - Always add ?t=Date.now() to bust cache
// - Use cache: "no-store"
// - Inject requestId = Date.now() into payload
// - On any failure, return { success: false, message: "Server busy, please try again." }
export async function fetchOnce(payload: Record<string, any> | FormData): Promise<FetchOnceResult> {
  const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
  const ts = Date.now();
  const url = `${PROXY_URL}?t=${ts}`;

  try {
    let res: Response;
    if (isForm) {
      const form = payload as FormData;
      form.set("requestId", String(ts));
      res = await fetch(url, {
        method: "POST",
        body: form,
        cache: "no-store",
      });
    } else {
      const body = JSON.stringify({ ...(payload as Record<string, any>), requestId: ts });
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        cache: "no-store",
      });
    }

    if (!res.ok) {
      return { success: false, message: "Server busy, please try again." };
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      return await res.json();
    }
    const text = await res.text();
    return { success: true, result: text };
  } catch {
    return { success: false, message: "Server busy, please try again." };
  }
}
