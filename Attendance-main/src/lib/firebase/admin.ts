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

export async function getProfileBySession(cookies: { get(name: string): { value: string } | undefined }) {
  const auth = await getFirebaseAdminAuth();
  const db = await getFirebaseAdminDb();
  const token = cookies.get(FIREBASE_SESSION_COOKIE)?.value;

  if (!auth || !db || !token) return null;

  const decoded = await auth.verifyIdToken(token);
  const snapshot = await db.collection("profiles").doc(decoded.uid).get();
  const data = snapshot.data() as Omit<FirebaseProfile, "id"> | undefined;

  if (!data?.role) return null;

  return {
    id: decoded.uid,
    email: decoded.email ?? data.email,
    name: data.name ?? decoded.name ?? decoded.email ?? "Campus User",
    role: data.role,
    department: data.department,
    avatarColor: data.avatarColor ?? "#c52a58",
    forcePasswordReset: Boolean(data.forcePasswordReset),
  } satisfies Person & { forcePasswordReset: boolean };
}
