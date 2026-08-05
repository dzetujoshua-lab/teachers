import {
  FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY,
  FIREBASE_CONFIG,
  FIREBASE_SESSION_COOKIE,
} from "./config";
import type { Role } from "@/lib/types";

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

const profileCache = new Map<
  string,
  { profile: FirebaseProfile | null; expiresAt: number }
>();

const quotaExhaustedUntil = { value: 0 };
const QUOTA_COOLDOWN_MS = 2 * 60_000; // longer cooldown to absorb bursts

function isQuotaExhausted(): boolean {
  return Date.now() < quotaExhaustedUntil.value;
}

function markQuotaExhausted(): void {
  quotaExhaustedUntil.value = Date.now() + QUOTA_COOLDOWN_MS;
}

function isQuotaError(err: any): boolean {
  const code = String(err?.code ?? "").toUpperCase();
  return code === "RESOURCE_EXHAUSTED" || err?.code === 8;
}

const PROFILE_CACHE_TTL_MS = 5 * 60_000; // 5 minutes

// Prevent request stampedes: one in-flight lookup per token.
// Also bounds memory growth by trimming cache after insertions.
const inFlightByToken = new Map<string, Promise<FirebaseProfile | null>>();
const MAX_PROFILE_CACHE_ENTRIES = 10_000;

function trimProfileCacheIfNeeded() {
  if (profileCache.size <= MAX_PROFILE_CACHE_ENTRIES) return;
  // Simple LRU-ish trim: Map keeps insertion order.
  const excess = profileCache.size - MAX_PROFILE_CACHE_ENTRIES;
  let remaining = excess;
  for (const key of profileCache.keys()) {
    profileCache.delete(key);
    remaining -= 1;
    if (remaining <= 0) break;
  }
}

export async function getProfileBySession(
  cookies: { get(name: string): { value: string } | undefined }
): Promise<FirebaseProfile | null> {
  const token = cookies.get(FIREBASE_SESSION_COOKIE)?.value;
  if (!token) return null;

  // If we've recently hit Firebase quota limits, skip expensive work.
  if (isQuotaExhausted()) {
    return null;
  }

  // Reuse cached profile for this token (avoids verification + Firestore read).
  const cached = profileCache.get(token);
  if (cached?.expiresAt && Date.now() < cached.expiresAt) {
    return cached.profile;
  }

  // If a refresh is already in-flight for this token, await it.
  const existing = inFlightByToken.get(token);
  if (existing) return existing;

  const lookupPromise = (async () => {
    const auth = await getFirebaseAdminAuth();
    const db = await getFirebaseAdminDb();
    if (!auth || !db) return null;

    let decoded: any;

    // Determine token type by decoding JWT payload (unverified) and checking `iss` claim.
    // ID tokens:  https://securetoken.google.com/<PROJECT_ID>
    // Session cookies: https://session.firebase.google.com/<PROJECT_ID>
    try {
      const parts = token.split(".");

      // JWT payload is base64url encoded, not base64.
      // base64url -> base64 conversion with padding.
      const decodeBase64Url = (base64Url: string) => {
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(
          base64.length + ((4 - (base64.length % 4)) % 4),
          "="
        );
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

      if (iss.startsWith("https://session.firebase.google.com/")) {
        try {
          decoded = await verifySession();
        } catch (e: any) {
          if (isQuotaError(e)) markQuotaExhausted();
          console.debug(
            "verifySessionCookie failed:",
            (e as Error)?.message ?? e
          );
          return null;
        }
      } else if (iss.startsWith("https://securetoken.google.com/")) {
        try {
          decoded = await verifyIdToken();
        } catch (e: any) {
          if (isQuotaError(e)) markQuotaExhausted();
          console.warn(
            "verifyIdToken failed:",
            (e as Error)?.message ?? e
          );
          return null;
        }
      } else {
        console.warn("Unknown Firebase token issuer detected:", iss);
        try {
          decoded = await verifySession();
        } catch (e: any) {
          if (isQuotaError(e)) markQuotaExhausted();
          try {
            decoded = await verifyIdToken();
          } catch (e2: any) {
            if (isQuotaError(e2)) markQuotaExhausted();
            console.warn(
              "Token verification failed (unknown issuer):",
              (e2 as Error)?.message ?? e2
            );
            return null;
          }
        }
      }
    } catch (err: any) {
      if (isQuotaError(err)) markQuotaExhausted();
      console.error("Firebase token verification failed:", err);
      return null;
    }

    if (!decoded) return null;

    let snapshot;
    try {
      snapshot = await db.collection("profiles").doc(decoded.uid).get();
    } catch (err: any) {
      if (isQuotaError(err)) {
        console.error("Firebase quota exceeded:", err);
        markQuotaExhausted();
        return null;
      }
      throw err;
    }

    const data = snapshot.data() as Omit<FirebaseProfile, "id"> | undefined;

    if (!data?.role) {
      // Cache negative lookups too; prevents hammering Firestore.
      profileCache.set(token, {
        profile: null,
        expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
      });
      return null;
    }

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

    profileCache.set(token, {
      profile,
      expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
    });
    trimProfileCacheIfNeeded();

    return profile;
  })();

  inFlightByToken.set(token, lookupPromise);

  try {
    return await lookupPromise;
  } finally {
    inFlightByToken.delete(token);
  }
}

