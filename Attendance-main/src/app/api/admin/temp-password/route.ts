import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  getProfileBySession,
} from "@/lib/firebase/admin";

import { USE_MOCK } from "@/lib/firebase/config";
import { ALL_ROLES } from "@/lib/roles";
import type { Role } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const role = String(body.role || "").trim() as Role;

    const temporaryPassword = String(
      body.temporaryPassword || ""
    ).trim();

    const name = String(body.name || "").trim();

    const department = String(
      body.department || ""
    ).trim();

    const institutionId = String(
      body.institutionId || ""
    ).trim();

    // Validation
    if (!email || !role || !temporaryPassword) {
      return NextResponse.json(
        {
          error:
            "Email, role, and temporary password are required.",
        },
        { status: 400 }
      );
    }

    if (!ALL_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error: "Invalid role selected.",
        },
        { status: 400 }
      );
    }

    // Prevent creation of super admins
    if (role === "super_admin") {
      return NextResponse.json(
        {
          error:
            "Super admin accounts cannot be created from this endpoint.",
        },
        { status: 403 }
      );
    }

    if (temporaryPassword.length < 8) {
      return NextResponse.json(
        {
          error:
            "Temporary password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // Mock mode
    if (USE_MOCK) {
      return NextResponse.json({
        success: true,
        demo: true,
      });
    }

    // Verify current user
    const cookieStore = await cookies();

    const currentProfile =
      await getProfileBySession(cookieStore);

    if (!currentProfile) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (currentProfile.role !== "super_admin") {
      return NextResponse.json(
        {
          error: "Forbidden.",
        },
        { status: 403 }
      );
    }

    const auth = await getFirebaseAdminAuth();
    const db = await getFirebaseAdminDb();

    if (!auth || !db) {
      return NextResponse.json(
        {
          error:
            "Firebase Admin is not configured.",
        },
        { status: 500 }
      );
    }

    let user = null;
    let isNewUser = false;

    try {
      user = await auth.getUserByEmail(email);
    } catch {
      user = null;
    }

    if (user) {
      user = await auth.updateUser(user.uid, {
        email,
        password: temporaryPassword,
        displayName: name || undefined,
        emailVerified: true,
      });
    } else {
      user = await auth.createUser({
        email,
        password: temporaryPassword,
        displayName: name || undefined,
        emailVerified: true,
      });

      isNewUser = true;
    }

    // Set role claim
    await auth.setCustomUserClaims(user.uid, {
      role,
    });

    // Force token refresh
    await auth.revokeRefreshTokens(user.uid);

    // Save profile
    await db
      .collection("profiles")
      .doc(user.uid)
      .set(
        {
          email,
          name,
          role,
          department,
          institutionId,
          avatarColor: "#c52a58",

          forcePasswordReset: true,

          createdBy: currentProfile.id,

          updatedAt: new Date().toISOString(),

          ...(isNewUser && {
            createdAt:
              new Date().toISOString(),
          }),
        },
        { merge: true }
      );

    return NextResponse.json({
      success: true,
      uid: user.uid,
      email,
      role,
    });
  } catch (error) {
    console.error(
      "Create user error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while creating the user.",
      },
      {
        status: 500,
      }
    );
  }
}