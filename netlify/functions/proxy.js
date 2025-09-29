const crypto = require("crypto");

// In-memory cache (per-function instance)
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 15 * 60_000);
const cache = new Map(); // key -> { ts, status, headers, body, isBase64 }

function hashBody(b) {
  try {
    if (!b) return "";
    if (Buffer.isBuffer(b)) return crypto.createHash("sha256").update(b).digest("hex");
    return crypto.createHash("sha256").update(String(b)).digest("hex");
  } catch {
    return "";
  }
}

exports.handler = async function (event) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
      body: "",
    };
  }

  const BASE = process.env.PREDICT_ENDPOINT || "https://api-va5v.onrender.com";
  const EXTERNAL = (() => {
    try {
      const u = new URL(BASE);
      const path = u.pathname.replace(/\/+$/, "");
      if (!/\/generate-questions$/.test(path)) u.pathname = `${path}/generate-questions`;
      return u.toString();
    } catch {
      const b = String(BASE).replace(/\/+$/, "");
      return `${b}/generate-questions`;
    }
  })();

  // Build upstream URL including query string
  const url = new URL(EXTERNAL);
  if (event.queryStringParameters) {
    for (const [k, v] of Object.entries(event.queryStringParameters)) {
      if (v != null) url.searchParams.set(k, String(v));
    }
  }

  // Reconstruct headers
  const headers = { ...(event.headers || {}) };
  delete headers.host;
  // Inject API key from env if provided
  const apiKey = process.env.PREDICT_API_KEY;
  const authHeader = process.env.PREDICT_AUTH_HEADER || "authorization";
  if (apiKey) headers[authHeader] = apiKey;
  headers["accept"] = headers["accept"] || "application/json";

  // Decode body if base64 encoded
  let body = event.body || null;
  if (event.isBase64Encoded && body) body = Buffer.from(body, "base64");

  // Build cache key
  const keyBase = `${event.httpMethod || "GET"}|${url.toString()}|${hashBody(body)}`;
  const cached = cache.get(keyBase);
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return {
      statusCode: cached.status,
      headers: {
        ...cached.headers,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
      body: cached.body,
      isBase64Encoded: cached.isBase64,
    };
  }

  // Retry policy
  const attempts = Number(process.env.PROXY_RETRIES || 3);
  const baseTimeout = Number(process.env.PROXY_TIMEOUT_MS || 25_000);

  const tryOnce = async (timeoutMs) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url.toString(), {
        method: event.httpMethod || "GET",
        headers,
        body,
        signal: controller.signal,
      });
      const contentType = resp.headers.get("content-type") || "application/octet-stream";
      const arrayBuffer = await resp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const isText = contentType.includes("application/json") || contentType.startsWith("text/");
      const responseBody = isText ? buffer.toString("utf-8") : buffer.toString("base64");
      const responseHeaders = {
        "Content-Type": contentType,
        "Cache-Control": isText ? "no-store" : "no-store",
      };
      return { status: resp.status, headers: responseHeaders, body: responseBody, isBase64: !isText };
    } finally {
      clearTimeout(t);
    }
  };

  let lastError = null;
  for (let i = 0; i < attempts; i++) {
    const timeoutMs = baseTimeout + i * 8000; // incremental backoff
    try {
      const res = await tryOnce(timeoutMs);
      // Cache success
      cache.set(keyBase, { ts: Date.now(), ...res });
      return {
        statusCode: res.status,
        headers: {
          ...res.headers,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
        body: res.body,
        isBase64Encoded: res.isBase64,
      };
    } catch (e) {
      lastError = e;
    }
  }

  // Fallback to last cached value even if stale
  if (cached) {
    return {
      statusCode: 200,
      headers: {
        ...cached.headers,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
      body: cached.body,
      isBase64Encoded: cached.isBase64,
    };
  }

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ result: "" }),
  };
};
