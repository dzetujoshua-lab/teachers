import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFirebaseAdminDb, getProfileBySession } from "@/lib/firebase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getFirebaseAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured." },
        { status: 500 }
      );
    }

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const doc = await db.collection("notifications").doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: any = doc.data() || {};

    // Basic audience filtering (mirrors Topbar behavior)
    const audienceRole = String(data?.audienceRole ?? "").trim();
    if (audienceRole && String(profile.role).trim() !== audienceRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ notification: { id: doc.id, ...data } });
  } catch (error) {
    console.error("Notification detail fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const docRef = db.collection("notifications").doc(id);

    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: any = doc.data() || {};

    // Verify user has access to this notification
    const audienceRole = String(data?.audienceRole ?? "").trim();
    const audienceId = String(data?.facilitatorId ?? data?.audienceId ?? "").trim();
    const hasAccess =
      (!audienceRole || String(profile.role).trim() === audienceRole) ||
      (profile.role === "facilitator" && audienceId === profile.id);
    if (!hasAccess && audienceRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (body.read === true) {
      await docRef.set({ read: true }, { merge: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification mark read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

