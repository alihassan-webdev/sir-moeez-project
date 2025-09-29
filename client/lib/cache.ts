const PREFIX = "papergen:gen-cache:";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type CacheEntry = { ts: number; value: string };

export function makeKey(parts: (string | number | null | undefined)[]): string {
  return (
    PREFIX +
    parts
      .map((p) => String(p ?? "").trim())
      .join("|")
      .toLowerCase()
  );
}

export function getCached(key: string, maxAgeMs = DEFAULT_TTL_MS): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw) as CacheEntry;
    if (!obj || typeof obj.ts !== "number") return null;
    if (Date.now() - obj.ts > maxAgeMs) return null;
    return typeof obj.value === "string" ? obj.value : null;
  } catch {
    return null;
  }
}

export function setCached(key: string, value: string): void {
  try {
    const obj: CacheEntry = { ts: Date.now(), value };
    localStorage.setItem(key, JSON.stringify(obj));
  } catch {}
}
