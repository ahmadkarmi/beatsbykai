// Admin session token.
//
// The cookie carries an HMAC-signed expiry, never a secret. Previously its
// value WAS `WORKER_ADMIN_SECRET`, which put the Worker's admin credential in
// every admin's browser and meant rotating it signed everyone out.
//
// Stateless by design: there is no session store to add, and the signature is
// verified with a key that never leaves the server. Uses Web Crypto so the
// same code runs in `proxy.ts` (Edge or Node) and in Server Actions.

export const ADMIN_COOKIE = "admin_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function secret(): string {
  const value = process.env.WORKER_ADMIN_SECRET;
  if (!value) throw new Error("WORKER_ADMIN_SECRET is not configured");
  return value;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** `<expiryMs>.<hmac>` */
export async function createSessionToken(now = Date.now()): Promise<string> {
  const exp = String(now + SESSION_TTL_MS);
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(exp));
  return `${exp}.${toHex(sig)}`;
}

/** Verifies signature and expiry. `crypto.subtle.verify` compares in constant time. */
export async function verifySessionToken(
  token: string | undefined | null,
  now = Date.now()
): Promise<boolean> {
  if (!token) return false;

  const sep = token.indexOf(".");
  if (sep <= 0) return false;

  const exp = token.slice(0, sep);
  const sig = fromHex(token.slice(sep + 1));
  if (!sig) return false;

  const expMs = Number(exp);
  if (!Number.isSafeInteger(expMs) || now > expMs) return false;

  try {
    return await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      sig as unknown as ArrayBuffer,
      encoder.encode(exp)
    );
  } catch {
    return false;
  }
}
