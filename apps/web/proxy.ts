import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin/session";

// Gate for admin *pages*. This is defence in depth only — it cannot protect
// Server Actions, which POST to whatever path the caller is on and so never
// hit this matcher. Every mutating action calls requireAdmin() itself.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect old /admin path away
  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/controlpanel") && pathname !== "/controlpanel/login") {
    const ok = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
    if (!ok) {
      return NextResponse.redirect(new URL("/controlpanel/login", request.url));
    }
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/controlpanel/:path*", "/admin", "/admin/:path*"],
};
