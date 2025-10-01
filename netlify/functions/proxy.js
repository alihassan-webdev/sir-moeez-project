exports.handler = async (event) => {
  const target = process.env.VITE_API_URL || process.env.PREDICT_ENDPOINT;
  if (!target) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ success: false, message: "Server busy, try again." }),
    };
  }

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
      body: "",
    };
  }

  const headers = { ...(event.headers || {}) };
  delete headers.host;
  delete headers["content-length"];

  try {
    const url = target;
    const isBase64 = !!event.isBase64Encoded;
    const body = event.body
      ? isBase64
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body
      : undefined;

    // Always send JSON upstream. If body looks like form/multipart, try to pass raw.
    let upstreamHeaders = { ...headers };
    if (!upstreamHeaders["content-type"]) {
      upstreamHeaders["Content-Type"] = "application/json";
    }

    const upstream = await fetch(url, {
      method: "POST",
      headers: upstreamHeaders,
      body,
    });
    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: true, result: text };
    }
    return {
      statusCode: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
      body: JSON.stringify({ success: false, message: "Server busy, try again." }),
    };
  }
};
