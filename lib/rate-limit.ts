// In-memory: достаточно для одного инстанса. Для serverless/мульти-инстанса замените на Upstash/Redis.
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max = 30, windowMs = 60_000) {
  const now = Date.now(), h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return true; }
  return ++h.n <= max;
}
