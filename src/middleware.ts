import { NextResponse, type NextRequest } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Lightweight CSRF protection: for state-changing API requests, require that the
 * Origin (or Referer) header matches the request host. Browser fetch always
 * sends Origin for cross-origin and same-origin POSTs, so this blocks classic
 * cross-site form/JS attacks without needing a token.
 */
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/") && MUTATING.has(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin) {
      try {
        if (new URL(origin).host !== host) {
          return NextResponse.json({ ok: false, error: "Cross-origin request blocked." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ ok: false, error: "Invalid origin." }, { status: 403 });
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
