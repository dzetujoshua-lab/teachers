import { type NextRequest, NextResponse } from "next/server";
import { FIREBASE_SESSION_COOKIE } from "@/lib/firebase/config";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(FIREBASE_SESSION_COOKIE)?.value;

  // Middleware runs in the Edge runtime where Node built-ins are unavailable.
  // Avoid importing `firebase-admin` here to prevent Webpack from bundling
  // server-only modules (node:crypto, node:fs, etc.). Only check for the
  // presence of the session cookie; full verification happens server-side
  // in API routes or server components where `firebase-admin` may be used.
  const user = Boolean(token);

  const isAuthPage = request.nextUrl.pathname === "/login";
  const isProtected = request.nextUrl.pathname.startsWith("/dashboard");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
