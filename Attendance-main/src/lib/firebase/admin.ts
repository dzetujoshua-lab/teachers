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
  email: string;
  name?: string;
  role: Role;
  department?: string;
  avatarColor?: string;
  forcePasswordReset?: boolean;
}

export async function getFirebaseAdminApp() {
  if (USE_MOCK) return null;

  const appModule = await import("firebase-admin/app");
  const { getApps, initializeApp, cert } = appModule;

  if (getApps().length) return getApps()[0];
  if (!FIREBASE_CONFIG.projectId || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
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
const quotaExhaustedUntil = { value: 0 };
const QUOTA_COOLDOWN_MS = 30_000;

function isQuotaExhausted(): boolean {
  return Date.now() < quotaExhaustedUntil.value;
}

function markQuotaExhausted(): void {
  quotaExhaustedUntil.value = Date.now() + QUOTA_COOLDOWN_MS;
}

export async function getProfileBySession(cookies: { get(name: string): { value: string } | undefined }) {
  const auth = await getFirebaseAdminAuth();
  const db = await getFirebaseAdminDb();
  const token = cookies.get(FIREBASE_SESSION_COOKIE)?.value;

  if (!auth || !db || !token) return null;

  if (isQuotaExhausted()) return null;

  const cached = profileCache.get(token);
  if (cached && cached.expiresAt > Date.now()) return cached.profile;

  const decoded = await auth.verifyIdToken(token);
  try {
    const snapshot = await db.collection("profiles").doc(decoded.uid).get();
    const data = snapshot.data() as Omit<FirebaseProfile, "id"> | undefined;

    if (!data?.role) return null;

    const profile = {
      id: decoded.uid,
      email: decoded.email ?? data.email,
      name: data.name ?? decoded.name ?? decoded.email ?? "Campus User",
      role: data.role,
      department: data.department,
      avatarColor: data.avatarColor ?? "#c52a58",
      forcePasswordReset: Boolean(data.forcePasswordReset),
    } satisfies Person & { forcePasswordReset: boolean };

    profileCache.set(token, { profile, expiresAt: Date.now() + 60000 });
    return profile;
  } catch (err: any) {
    const code = String(err?.code ?? "").toUpperCase();
    if (code === "RESOURCE_EXHAUSTED" || err?.code === 8) {
      console.error("Firebase quota exceeded:", err);
      markQuotaExhausted();
      return null;
    }
    throw err;
  }
}
