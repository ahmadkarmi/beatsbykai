import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect old /admin path away
  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/controlpanel") && pathname !== "/controlpanel/login") {
    const token = request.cookies.get("admin_token")?.value;
    const expected = process.env.WORKER_ADMIN_SECRET;
    if (!token || token !== expected) {
      return NextResponse.redirect(new URL("/controlpanel/login", request.url));
    }
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/controlpanel/:path*", "/admin", "/admin/:path*"],
};
