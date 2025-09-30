export const handler = async (event, context) => {
  // Netlify function proxy to forward requests to a configured backend API
  // Environment variables:
  // - TARGET_API_URL (required): full URL to forward requests to
  // - TARGET_API_KEY (optional): API key to include in Authorization header

  const TARGET_API_URL = process.env.TARGET_API_URL || process.env.GENERATE_API_URL || "http://localhost:8080/api/generate-questions";
  const TARGET_API_KEY = process.env.TARGET_API_KEY || null;

  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 5000; // per attempt

  const makeRequest = async (attempt) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      // Reconstruct fetch options from incoming Netlify event
      const headers = {};
      // Forward JSON content-type or accept
      if (event.headers) {
        for (const k of Object.keys(event.headers)) {
          headers[k] = event.headers[k];
        }
      }
      // Overwrite host related headers
      delete headers.host;

      // Add server-side API key if configured
      if (TARGET_API_KEY) {
        headers["Authorization"] = `Bearer ${TARGET_API_KEY}`;
      }

      const isBase64 = !!event.isBase64Encoded;
      let body = null;
      let fetchOptions = { method: event.httpMethod || "POST", headers, signal: controller.signal };

      if (event.body) {
        if (isBase64) {
          // Pass through binary body as-is; convert to Buffer
          body = Buffer.from(event.body, "base64");
          fetchOptions.body = body;
        } else {
          // If content-type is application/json, pass JSON string
          fetchOptions.body = event.body;
        }
      }

      const res = await fetch(TARGET_API_URL, fetchOptions);
      clearTimeout(id);
      const contentType = res.headers.get("content-type") || "";
      const status = res.status;
      let payload;
      if (contentType.includes("application/json")) {
        payload = await res.json();
      } else {
        payload = await res.text();
      }
      return { ok: res.ok, status, payload, contentType };
    } catch (err) {
      clearTimeout(id);
      return { ok: false, error: String(err) };
    }
  };

  // Try up to MAX_RETRIES attempts
  let lastError = null;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const res = await makeRequest(i + 1);
    if (res.ok) {
      // Successful response -> return it
      const isJson = res.contentType && res.contentType.includes("application/json");
      return {
        statusCode: 200,
        headers: { "Content-Type": isJson ? "application/json" : "text/plain" },
        body: isJson ? JSON.stringify(res.payload) : String(res.payload),
      };
    }
    lastError = res.error || `status:${res.status}`;
    // silent retry immediately
  }

  // All attempts failed
  return {
    statusCode: 502,
    body: JSON.stringify({ error: true, message: "Upstream request failed", detail: lastError }),
  };
};
