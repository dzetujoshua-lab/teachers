import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getFirebaseAdminDb, getProfileBySession } from "@/lib/firebase/admin";

const ALLOWED_COLLECTIONS = new Set([
  "sessions",
  "attendance",
  "auditLogs",
  "meals",
  "students",
  "aiInsights",
  "campuses",
  "departments",
  "buildings",
  "notifications",
  "weeklyAttendance",
  "hourlyOccupancy",
  "mealSplit",
  "departmentTrend",
  "profiles",
  "loginEvents",
  "signupEvents",
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const collectionName = url.searchParams.get("collection")?.trim() ?? "";

  if (!ALLOWED_COLLECTIONS.has(collectionName)) {
    return NextResponse.json(
      { error: "Invalid collection request." },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const profile = await getProfileBySession(cookieStore);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = await getFirebaseAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firebase Admin is not configured." },
      { status: 500 }
    );
  }

  const snapshot = await db.collection(collectionName).get();
  const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json({ rows });
}

export async function POST(request: Request) {
  const body = await request.json();
  const collectionName = String(body.collection || "").trim();
  const data = body.data;
  const documentId = body.id ? String(body.id).trim() : undefined;

  if (!ALLOWED_COLLECTIONS.has(collectionName)) {
    return NextResponse.json(
      { error: "Invalid collection request." },
      { status: 400 }
    );
  }

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "Request body must include a data object." },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const profile = await getProfileBySession(cookieStore);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = await getFirebaseAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firebase Admin is not configured." },
      { status: 500 }
    );
  }

  const collectionRef = db.collection(collectionName);
  const docRef = documentId
    ? collectionRef.doc(documentId)
    : collectionRef.doc();

  await docRef.set({
    ...data,
    createdAt: new Date().toISOString(),
  }, { merge: true });

  return NextResponse.json({ success: true, id: docRef.id });
}
