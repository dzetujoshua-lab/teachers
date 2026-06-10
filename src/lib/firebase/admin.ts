import {
  FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY,
  FIREBASE_CONFIG,
  FIREBASE_SESSION_COOKIE,
  USE_MOCK,
} from "./config";
import type { Person, Role } from "@/lib/types";

export interface FirebaseProfile {
  id: string;
  uid: string;
  platformUserId?: string;
  email: string;
  name?: string;
  role: Role;
  department?: string;
  institutionId?: string;
  avatarColor?: string;
  forcePasswordReset?: boolean;
}

export async function getFirebaseAdminApp() {
  if (USE_MOCK) return null;

  const appModule = await import("firebase-admin/app");
  const { getApps, initializeApp, cert } = appModule;

  if (getApps().length) {
    return getApps()[0];
  }

  if (
    !FIREBASE_CONFIG.projectId ||
    !FIREBASE_ADMIN_CLIENT_EMAIL ||
    !FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    return null;
  }

  return initializeApp({
    credential: cert({
      projectId: FIREBASE_CONFIG.projectId,
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY,
    }),
  });
}

export async function getFirebaseAdminAuth() {
  const app = await getFirebaseAdminApp();
  if (!app) return null;
  const authModule = await import("firebase-admin/auth");
  return authModule.getAuth(app);
}

export async function getFirebaseAdminDb() {
  const app = await getFirebaseAdminApp();
  if (!app) return null;
  const firestoreModule = await import("firebase-admin/firestore");
  return firestoreModule.getFirestore(app);
}

const profileCache = new Map<string, { profile: FirebaseProfile | null; expiresAt: number }>();

export async function getProfileBySession(cookies: { get(name: string): { value: string } | undefined }): Promise<FirebaseProfile | null> {
  const auth = await getFirebaseAdminAuth();
  const db = await getFirebaseAdminDb();
  const token = cookies.get(FIREBASE_SESSION_COOKIE)?.value;

  if (!auth || !db || !token) return null;

  const cached = profileCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.profile;
  }

  let decoded;

  // Determine token type by decoding JWT payload (unverified) and checking `iss` claim.
  // ID tokens:  https://securetoken.google.com/<PROJECT_ID>
  // Session cookies: https://session.firebase.google.com/<PROJECT_ID>
  try {
    const parts = token.split(".");

    // JWT payload is base64url encoded, not base64.
    // base64url -> base64 conversion with padding.
    const decodeBase64Url = (base64Url: string) => {
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
      return Buffer.from(padded, "base64").toString("utf8");
    };

    let iss = "";
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(decodeBase64Url(parts[1]));
        iss = String(payload?.iss || "");
      } catch {
        iss = "";
      }
    }

    const verifyIdToken = () => auth.verifyIdToken(token);
    const verifySession = () => auth.verifySessionCookie(token, true);

    // IMPORTANT: Do not fall back from session-cookie verification to ID-token verification.
    // If `iss` indicates a session cookie, the token will always have session issuer and
    // verifyIdToken will fail with an issuer mismatch.
    if (iss.startsWith("https://session.firebase.google.com/")) {
      try {
        decoded = await verifySession();
      } catch (e) {
        console.debug("verifySessionCookie failed:", (e as Error)?.message ?? e);
        return null;
      }
    } else if (iss.startsWith("https://securetoken.google.com/")) {
      try {
        decoded = await verifyIdToken();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("verifyIdToken failed:", (e as Error)?.message ?? e);
        return null;
      }
    } else {
      // Unknown issuer: try session cookie first, then ID token (last resort)
      // eslint-disable-next-line no-console
      console.warn("Unknown Firebase token issuer detected:", iss);
      try {
        decoded = await verifySession();
      } catch {
        try {
          decoded = await verifyIdToken();
        } catch (e2) {
          // eslint-disable-next-line no-console
          console.warn("Token verification failed (unknown issuer):", (e2 as Error)?.message ?? e2);
          return null;
        }
      }
    }
  } catch (err) {
    // If verification failed for both methods, log and return null so callers can handle unauthenticated state
    // eslint-disable-next-line no-console
    console.error("Firebase token verification failed:", err);
    return null;
  }

  if (!decoded) return null;

  let snapshot;
  try {
    snapshot = await db.collection("profiles").doc(decoded.uid).get();
  } catch (err: any) {
    const code = (err?.code || "").toUpperCase();
    if (code === "RESOURCE_EXHAUSTED" || err?.code === 8) {
      console.error("Firebase quota exceeded:", err);
      return null;
    }
    throw err;
  }

  const data = snapshot.data() as Omit<FirebaseProfile, "id"> | undefined;

  if (!data?.role) return null;

  const profile = {
    id: decoded.uid,
    uid: data.uid ?? decoded.uid,
    platformUserId: data.platformUserId,
    email: decoded.email ?? data.email,
    name: data.name ?? decoded.name ?? decoded.email ?? "Campus User",
    role: data.role,
    department: data.department,
    institutionId: data.institutionId,
    avatarColor: data.avatarColor ?? "#c52a58",
    forcePasswordReset: Boolean(data.forcePasswordReset),
  } satisfies FirebaseProfile;

  profileCache.set(token, { profile, expiresAt: Date.now() + 60000 });
  return profile;
}

