// lib/rate-limit.ts

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000;  // 1 minute
const MAX_REQUESTS = 10;

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = store.get(identifier) || { timestamps: [] };

  const recent = entry.timestamps.filter(ts => now - ts < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    return false;
  }

  recent.push(now);
  store.set(identifier, { timestamps: recent });

  return true;
}

// For testing
export function resetRateLimit(identifier?: string): void {
  if (identifier) {
    store.delete(identifier);
  } else {
    store.clear();
  }
}
