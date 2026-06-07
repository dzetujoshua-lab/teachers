import { NextResponse } from "next/server";
import { FIREBASE_SESSION_COOKIE, USE_MOCK } from "@/lib/firebase/config";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 5;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const idToken = String(body.idToken || "");

  if (!idToken) {
    return NextResponse.json({ error: "ID token is required." }, { status: 400 });
  }

  try {
    const response = NextResponse.json({ success: true });

    if (USE_MOCK) {
      response.cookies.set(FIREBASE_SESSION_COOKIE, idToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
      return response;
    }

    const auth = await getFirebaseAdminAuth();

    if (auth) {
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
      return response;
    }

    response.cookies.set(FIREBASE_SESSION_COOKIE, idToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
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