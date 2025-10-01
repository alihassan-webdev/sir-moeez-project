export const handler = async (event) => {
  const target = process.env.VITE_API_URL || process.env.PREDICT_ENDPOINT;
  if (!target) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
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
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
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
        ? Buffer.from(event.body, "base64")
        : event.body
      : undefined;

    const upstream = await fetch(url, {
      method: "POST",
      headers,
      body,
    });
    const buf = Buffer.from(await upstream.arrayBuffer());
    const contentType = upstream.headers.get("content-type") || "application/json";
    return {
      statusCode: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
      body: buf.toString("utf8"),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ success: false, message: "Server busy, try again." }),
    };
  }
};
