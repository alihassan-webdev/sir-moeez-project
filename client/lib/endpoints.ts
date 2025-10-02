// Centralized API endpoint and helper (no env, no proxies)
const EXTERNAL_API = "https://api-va5v.onrender.com/generate-questions" as const;
const LOCAL_PROXY = "/api/proxy" as const; // available in dev server (`server/index.ts`)

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
  // Prefer local proxy only on localhost to avoid CORS during development
  const isLocal = typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(window.location.host);
  const baseUrl = isLocal ? LOCAL_PROXY : EXTERNAL_API;
  const url = `${baseUrl}?t=${ts}`;

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
