exports.handler = async (event) => {
  const target = process.env.VITE_API_URL || process.env.PREDICT_ENDPOINT;
  const baseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
  };

  if (!target) {
    return {
      statusCode: 500,
      headers: { ...baseHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Server busy, try again." }),
    };
  }

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: baseHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...baseHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
    };
  }

  // Copy incoming headers, preserve content-type boundary
  const incoming = { ...(event.headers || {}) };
  const headers = {};
  for (const [k, v] of Object.entries(incoming)) {
    if (!v) continue;
    const key = k.toLowerCase();
    if (key === "host" || key === "content-length" || key === "connection") continue;
    headers[key] = Array.isArray(v) ? v.join(", ") : String(v);
  }

  // Body: forward as Buffer when base64-encoded (e.g., multipart/form-data)
  let body;
  if (event.body) {
    if (event.isBase64Encoded) {
      body = Buffer.from(event.body, "base64");
    } else {
      body = event.body;
    }
  }

  // If no explicit content-type, do not force JSON. Let upstream infer or set generic octet-stream.
  if (!headers["content-type"]) {
    headers["content-type"] = "application/octet-stream";
  }

  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 60000);
    const upstream = await fetch(target, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(to);

    // Pass-through JSON when possible, otherwise return text
    const ct = upstream.headers.get("content-type") || "";
    const statusCode = upstream.status;
    const common = { ...baseHeaders };

    if (ct.includes("application/json")) {
      const data = await upstream.json().catch(async () => ({ result: await upstream.text() }));
      return {
        statusCode,
        headers: { ...common, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };
    }

    const text = await upstream.text();
    return {
      statusCode,
      headers: { ...common, "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, result: text }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { ...baseHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Server busy, try again." }),
    };
  }
};
