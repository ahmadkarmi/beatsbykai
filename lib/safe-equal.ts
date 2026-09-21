/**
 * Constant-time string comparison for secrets.
 *
 * `a !== b` short-circuits on the first differing byte, which leaks the length
 * of a correct prefix. Hashing first equalises length so the comparison loop
 * is always the same width, and the loop itself never branches on content.
 *
 * Web Crypto so it runs unchanged in Node and Edge runtimes.
 */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}
