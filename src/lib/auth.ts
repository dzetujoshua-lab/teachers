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

export async function getProfileBySession(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) return null;

    // Verify the Firebase session cookie.
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    if (!decodedClaims || !decodedClaims.uid) return null;

    // Look for the user profile in Firestore
    const userDoc = await adminDb.collection("profiles").doc(decodedClaims.uid).get();
    
    if (!userDoc.exists) {
      return {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        role: "facilitator",
      } as UserProfile;
    }

    const data = userDoc.data();
    return { uid: decodedClaims.uid, ...data } as UserProfile;
  } catch (error) {
    console.error("Auth Error:", error);
    return null;
  }
}