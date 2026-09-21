import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "./session";

/**
 * Authorisation gate for every mutating admin Server Action.
 *
 * `proxy.ts` is NOT sufficient on its own. A Server Action is a public HTTP
 * endpoint that POSTs to whatever path the caller happens to be on, and its
 * id is compiled into public client chunks under /_next/static. An
 * unauthenticated POST to "/" therefore never reaches the proxy's
 * /controlpanel matcher, so any action without its own check is callable by
 * anyone. Every action must call this first.
 */
export async function requireAdmin(): Promise<void> {
  const jar = await cookies();
  const ok = await verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
  if (!ok) redirect("/controlpanel/login");
}
