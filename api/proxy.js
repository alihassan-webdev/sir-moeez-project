export default async function handler(req, res) {
  const EXTERNAL = "https://api-va5v.onrender.com/generate-questions";
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Read body safely
    const body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });

    // Forward headers safely
    const fwdHeaders = {};
    for (const [k, v] of Object.entries(req.headers)) {
      const key = k.toLowerCase();
      if (
        key === "host" ||
        key === "content-length" ||
        key === "connection" ||
        key === "accept-encoding"
      )
        continue;
      fwdHeaders[key] = Array.isArray(v) ? v.join(", ") : String(v);
    }

    // Forward request to external API
    const upstream = await fetch(EXTERNAL, {
      method: "POST",
      headers: {
        ...fwdHeaders,
        "Content-Type": "application/json",
      },
      body,
    });

    // Forward headers back
    for (const [k, v] of upstream.headers.entries()) {
      res.setHeader(k, v);
    }
    res.setHeader("Access-Control-Allow-Origin", "*");

    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.status(upstream.status).send(buf);
  } catch (err) {
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
    return res.status(502).json({
      error: "Proxy error",
      message: String((err && err.message) || err),
    });
  }
}
