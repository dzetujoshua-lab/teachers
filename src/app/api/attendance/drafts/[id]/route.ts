import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFirebaseAdminDb, getProfileBySession } from "@/lib/firebase/admin";
import type { AttendanceStatus } from "@/lib/types";

type DraftStatus = "draft" | "submitted" | "approved" | "sent_to_kitchen";

type DraftMember = {
  studentId: string;
  name: string;
  status?: AttendanceStatus;
  email?: string;
};

type DraftRecord = {
  id: string;
  title: string;
  classId?: string | null;
  facilitatorId?: string | null;
  facilitatorEmail?: string;
  members: DraftMember[];
  status: DraftStatus;
  createdBy?: string;
  submittedBy?: string;
  approvedBy?: string;
  sentBy?: string;
  institutionId?: string | null;
  campusId?: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  sentToKitchenAt?: string;
  scheduledFor?: string;
  [key: string]: unknown;
};

function normalizeMembers(value: unknown): DraftMember[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((member: any) => {
      const studentId = String(member?.studentId ?? member?.id ?? "").trim();
      const name = String(member?.name ?? "Student").trim();
      const status = member?.status as AttendanceStatus | undefined;
      const email = member?.email ? String(member.email).trim() : undefined;

      return {
        studentId,
        name,
        status: status || "absent",
        ...(email ? { email } : {}),
      };
    })
    .filter((member) => member.studentId.length > 0 && member.name.length > 0);
}

function normalizeStatus(value: unknown, fallback: DraftStatus = "draft"): DraftStatus {
  const status = String(value || fallback);

  if (["draft", "submitted", "approved", "sent_to_kitchen"].includes(status)) {
    return status as DraftStatus;
  }

  return fallback;
}

async function getProfileCache(db: FirebaseFirestore.Firestore) {
  const cache = new Map<string, any>();
  const snapshot = await db.collection("profiles").get();

  snapshot.docs.forEach((doc) => {
    cache.set(doc.id, doc.data());
  });

  return cache;
}

async function serializeDraft(doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>, db: FirebaseFirestore.Firestore) {
  const profiles = await getProfileCache(db);
  const data = doc.data() as DraftRecord;
  const draft = { ...data, id: doc.id };
  const facilitatorId = String(draft.facilitatorId || "");
  const profile = facilitatorId && facilitatorId !== "null" && facilitatorId !== "unassigned"
    ? profiles.get(facilitatorId)
    : null;

  return {
    ...draft,
    members: Array.isArray(draft.members) ? draft.members : [],
    status: normalizeStatus(draft.status, "draft"),
    facilitatorEmail: profile?.email,
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });

    const docRef = db.collection("attendanceDrafts").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const draft = doc.data() as DraftRecord;
    const canRead = profile.role === "super_admin"
      || (profile.role === "facilitator" && draft.facilitatorId === profile.id)
      || (profile.role === "kitchen_manager" && draft.status === "sent_to_kitchen");

    if (!canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const serialized = await serializeDraft(doc, db);

    return NextResponse.json({ draft: serialized });
  } catch (error: any) {
    const code = (error?.code || "").toUpperCase();
    if (code === "RESOURCE_EXHAUSTED" || error?.code === 8) {
      return NextResponse.json({ error: "Quota exceeded. Please try again later." }, { status: 429 });
    }

    console.error("Attendance draft fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const profile = await getProfileBySession(await cookies());

    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });

    const docRef = db.collection("attendanceDrafts").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const current = doc.data() as DraftRecord;

    if (profile.role === "facilitator" && current.facilitatorId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!["super_admin", "facilitator"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates: Partial<DraftRecord> = {};
    const nextStatus = body.status ? normalizeStatus(body.status, current.status || "draft") : current.status;

    if (Array.isArray(body.members)) {
      updates.members = normalizeMembers(body.members);
    }

    if (body.status) {
      updates.status = nextStatus;
    }

    if (profile.role === "super_admin" && body.facilitatorId !== undefined) {
      updates.facilitatorId = body.facilitatorId === null ? null : String(body.facilitatorId);
    }

    if (nextStatus === "submitted") {
      updates.submittedAt = new Date().toISOString();
      updates.submittedBy = profile.id;
    }

    if (profile.role === "super_admin" && nextStatus === "approved") {
      updates.approvedAt = new Date().toISOString();
      updates.approvedBy = profile.id;
    }

    if (profile.role === "super_admin" && nextStatus === "sent_to_kitchen") {
      updates.sentToKitchenAt = new Date().toISOString();
      updates.sentBy = profile.id;
    }

    updates.updatedAt = new Date().toISOString();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await docRef.set(updates, { merge: true });

    const updatedDoc = await docRef.get();
    const draft = await serializeDraft(updatedDoc, db);

    return NextResponse.json({ success: true, draft });
  } catch (error: any) {
    const code = (error?.code || "").toUpperCase();
    if (code === "RESOURCE_EXHAUSTED" || error?.code === 8) {
      return NextResponse.json({ error: "Quota exceeded. Please try again later." }, { status: 429 });
    }

    console.error("Attendance draft update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const profile = await getProfileBySession(await cookies());

    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (profile.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });

    await db.collection("attendanceDrafts").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Attendance draft delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
