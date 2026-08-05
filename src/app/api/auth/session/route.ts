import { NextResponse } from "next/server";
import { FIREBASE_SESSION_COOKIE } from "@/lib/firebase/config";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 5;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const idToken = String(body.idToken || "");

  if (!idToken) {
    return NextResponse.json({ error: "ID token is required." }, { status: 400 });
  }

  try {
    console.debug("[auth/session] POST received; creating session cookie");
    const response = NextResponse.json({ success: true });

    const auth = await getFirebaseAdminAuth();
    if (auth) {
      try {
        const sessionCookie = await auth.createSessionCookie(idToken, {
          expiresIn: COOKIE_MAX_AGE * 1000,
        });
        response.cookies.set(FIREBASE_SESSION_COOKIE, sessionCookie, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: COOKIE_MAX_AGE,
          path: "/",
        });
        console.debug("[auth/session] session cookie set via admin.createSessionCookie");
        return response;
      } catch (e) {
        console.error("[auth/session] createSessionCookie failed:", e);
        // Fall back to setting the raw idToken cookie for non-admin environments
      }
    }

    response.cookies.set(FIREBASE_SESSION_COOKIE, idToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    console.debug("[auth/session] session cookie set with raw idToken");
    return response;
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error));
    console.error("[auth/session] Error:", error);
    return NextResponse.json(
      { error: message || "Unable to create session cookie." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(FIREBASE_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}