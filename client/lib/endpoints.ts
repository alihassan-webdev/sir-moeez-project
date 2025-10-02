// Direct API helper (no proxy, no retries, no env)

export const DIRECT_API = "https://api-va5v.onrender.com/generate-questions" as const;

export type DirectResult = any;

// Always one attempt, cache disabled, requestId included.
export async function fetchDirect(payload: Record<string, any> | FormData): Promise<DirectResult> {
  const ts = Date.now();
  const url = `${DIRECT_API}?t=${ts}`;
  const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
  try {
    let res: Response;
    if (isForm) {
      (payload as FormData).set("requestId", String(ts));
      res = await fetch(url, {
        method: "POST",
        body: payload as FormData,
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
