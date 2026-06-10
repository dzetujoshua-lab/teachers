import { NextResponse } from "next/server";
import { getFirebaseAdminDb, getProfileBySession } from "@/lib/firebase/admin";
import { validateDraftInput } from "@/lib/attendance-validation";
import { cookies } from "next/headers";

export async function GET(request: Request) {
   try {
     const profile = await getProfileBySession(await cookies());
     if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

     const db = await getFirebaseAdminDb();
     if (!db) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });

     const url = new URL(request.url);
     const statusFilter = url.searchParams.get("status");
     const includeAll = url.searchParams.get("includeAll") === "true";

     let q: FirebaseFirestore.Query = db.collection("attendanceDrafts");

     if (profile.role === "facilitator") {
       q = q.where("facilitatorId", "==", profile.id);
       if (!statusFilter || statusFilter === "draft") {
         q = q.where("status", "==", "draft");
       }
     } else if (profile.role === "super_admin") {
       if (statusFilter) {
         q = q.where("status", "==", statusFilter);
       }
     } else if (profile.role === "kitchen_manager") {
       q = q.where("status", "==", "sent_to_kitchen");
     } else {
       if (!includeAll && profile.institutionId) {
         q = q.where("institutionId", "==", profile.institutionId);
       }
     }

     const snapshot = await q.get();
     const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

     return NextResponse.json({ rows });
   } catch (error: any) {
     if (error?.code === "resource-exhausted" || error?.code === 8) {
       return NextResponse.json({ error: "Quota exceeded. Please try again later." }, { status: 429 });
     }
     console.error("Attendance drafts list error:", error);
     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
   }
 }

export async function POST(request: Request) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Allow super admins and admins to create attendance drafts
    // (Admin dashboard users should not be blocked from sending to facilitators.)
    const allowedRoles = new Set(["super_admin", "admin", "institution_admin"]);
    if (!allowedRoles.has(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });

    const body = await request.json();

    // Debugging: helps identify which field triggers 400 validation
    console.log("Create attendance draft body:", body);

    const validation = validateDraftInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
    }

    const { title, classId, facilitatorId, members } = body;

    const doc = {
      title: String(title || "Attendance draft"),
      classId: classId || null,
      facilitatorId: facilitatorId || "unassigned",
      members: members.map((m: any) => ({ studentId: String(m.studentId), name: String(m.name || "") })),
      status: "draft",
      createdBy: profile.id,
      institutionId: profile.institutionId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await db.collection("attendanceDrafts").add(doc);

    // Create notification for facilitator (targeted by ID)
    if (facilitatorId && facilitatorId !== "unassigned") {
      await db.collection("notifications").add({
        title: "New class assignment",
        body: `Admin assigned you to take attendance for "${title}". Open your drafts to get started.`,
        type: "attendance",
        time: doc.createdAt,
        read: false,
        audienceRole: "facilitator",
        audienceId: facilitatorId,
        attendanceDraftId: ref.id,
        createdAt: doc.createdAt,
      });
    }

    return NextResponse.json({ success: true, id: ref.id, draft: { id: ref.id, ...doc } });
  } catch (error) {
    console.error("Create attendance draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}