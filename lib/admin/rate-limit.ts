// Brute-force damping for the admin login.
//
// Deliberately simple: a per-instance in-memory counter plus a fixed delay on
// every failed attempt. On serverless this is per-instance, so it is a speed
// bump rather than a hard limit — an attacker spread across many cold starts
// sees a weaker ceiling. It still removes the "unlimited free guesses at one
// shared password" property, and the constant delay applies unconditionally.
//
// If this ever needs to be authoritative, it wants a shared store
// (Upstash Redis / Vercel Edge Config), which is a dependency decision.

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const FAILED_ATTEMPT_DELAY_MS = 400;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
}

export function isRateLimited(key: string, now = Date.now()): boolean {
  const b = buckets.get(key);
  if (!b || now > b.resetAt) return false;
  return b.count >= MAX_FAILURES;
}

export function recordFailure(key: string, now = Date.now()): void {
  sweep(now);
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  b.count += 1;
}

export function clearFailures(key: string): void {
  buckets.delete(key);
}

/** Applied to every rejected login so guessing is never free. */
export function failedAttemptDelay(): Promise<void> {
  return new Promise((r) => setTimeout(r, FAILED_ATTEMPT_DELAY_MS));
}
