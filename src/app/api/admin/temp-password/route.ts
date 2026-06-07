import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb, getProfileBySession } from "@/lib/firebase/admin";
import { ALL_ROLES } from "@/lib/roles";
import { createPlatformUserId } from "@/lib/user-ids";
import type { Role } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const role = String(body.role || "").trim() as Role;
  const temporaryPassword = String(body.temporaryPassword || "").trim();

  if (!email || !role || !temporaryPassword) {
    return NextResponse.json({ error: "Email, role, and temporary password are required." }, { status: 400 });
  }

  if (!ALL_ROLES.includes(role) || role === "super_admin") {
    return NextResponse.json({ error: "Choose a supported non-admin role." }, { status: 400 });
  }

  if (temporaryPassword.length < 8) {
    return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 });
  }

  const currentProfile = await getProfileBySession(await cookies());
  if (!currentProfile) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (currentProfile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const auth = await getFirebaseAdminAuth();
  const db = await getFirebaseAdminDb();
  if (!auth || !db) {
    return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });
  }

  let user = await auth.getUserByEmail(email).catch(() => null);

  if (user) {
    user = await auth.updateUser(user.uid, {
      password: temporaryPassword,
      emailVerified: true,
    });
  } else {
    user = await auth.createUser({
      email,
      password: temporaryPassword,
      emailVerified: true,
    });
  }

  const platformUserId = createPlatformUserId(role, user.uid);

  await auth.setCustomUserClaims(user.uid, { role, platformUserId });
  await db.collection("profiles").doc(user.uid).set(
    {
      uid: user.uid,
      platformUserId,
      email,
      role,
      forcePasswordReset: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  await db.collection("roleUsers").doc(role).collection("users").doc(user.uid).set(
    {
      uid: user.uid,
      platformUserId,
      email,
      role,
      forcePasswordReset: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return NextResponse.json({ success: true, platformUserId });
}
