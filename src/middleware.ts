import { NextResponse, type NextRequest } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Lightweight CSRF protection: for state-changing API requests, require that the
 * Origin (or Referer) header matches the request host. Browser fetch always
 * sends Origin for cross-origin and same-origin POSTs, so this blocks classic
 * cross-site form/JS attacks without needing a token.
 */
export function middleware(req: NextRequest) {
  // Raw uploaded files are never served statically — they go through
  // /api/files/[id], which enforces per-file access control.
  if (req.nextUrl.pathname.startsWith("/uploads/")) {
    return NextResponse.json(
      { ok: false, error: "Accès direct interdit. Utilisez le lien de la console." },
      { status: 403 },
    );
  }

  if (req.nextUrl.pathname.startsWith("/api/") && MUTATING.has(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin) {
      try {
        if (new URL(origin).host !== host) {
          return NextResponse.json({ ok: false, error: "Requête cross-origin bloquée." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ ok: false, error: "Origine invalide." }, { status: 403 });
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/uploads/:path*"],
};
