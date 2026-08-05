import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { Role } from "@/lib/types";

export interface UserProfile {
  uid: string;
  email?: string;
  role: Role;
  name?: string;
  institutionId?: string;
}

function decodeBase64Url(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  return Buffer.from(padded, "base64").toString("utf8");
}

export async function getProfileBySession(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) return null;

    let decoded: any;

    const parts = sessionCookie.split(".");
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(decodeBase64Url(parts[1]));
        const iss = String(payload?.iss || "");
        if (iss.startsWith("https://session.firebase.google.com/")) {
          decoded = await adminAuth.verifySessionCookie(sessionCookie);
        } else if (iss.startsWith("https://securetoken.google.com/")) {
          decoded = await adminAuth.verifyIdToken(sessionCookie);
        } else {
          decoded = await adminAuth.verifySessionCookie(sessionCookie);
        }
      } catch {
        decoded = await adminAuth.verifySessionCookie(sessionCookie).catch(() => null);
      }
    } else {
      decoded = await adminAuth.verifySessionCookie(sessionCookie).catch(() => null);
    }

    if (!decoded || !decoded.uid) return null;

    const userDoc = await adminDb.collection("profiles").doc(decoded.uid).get();
    if (!userDoc.exists) {
      return {
        uid: decoded.uid,
        email: decoded.email,
        role: "facilitator",
      } as UserProfile;
    }

    const data = userDoc.data();
    return { uid: decoded.uid, ...data } as UserProfile;
  } catch (error) {
    console.error("Auth Error:", error);
    return null;
  }
}
