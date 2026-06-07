import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFirebaseAdminDb, getProfileBySession } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "facilitator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });
    }

    const body = await request.json();
    const sessionTitle = String(body.sessionTitle || "Attendance session");
    const roster = Array.isArray(body.roster) ? body.roster : [];
    const summary = String(body.summary || "Attendance has been published.");

    const nowIso = new Date().toISOString();
    const notificationBase = {
      title: `Attendance published: ${sessionTitle}`,
      body: `${profile.name || "A facilitator"} published attendance for ${sessionTitle}. ${roster.length} student(s) were included.`,
      type: "attendance",
      time: nowIso,
      read: false,
      details: {
        facilitatorId: profile.id,
        sessionTitle,
        rosterCount: roster.length,
        summary,
      },
      createdAt: nowIso,
    };

    const roles = ["super_admin", "security_officer", "kitchen_manager"] as const;
    for (const audienceRole of roles) {
      await db.collection("notifications").add({
        ...notificationBase,
        audienceRole,
      });
    }

    const draftId = String(body.draftId || "").trim();
    if (draftId) {
      try {
        const draftRef = db.collection("attendanceDrafts").doc(draftId);
        const draftDoc = await draftRef.get();
if (draftDoc.exists) {
            const draftData = draftDoc.data() as any;
            if (draftData.facilitatorId === profile.id) {
              await draftRef.set(
                {
                  status: "submitted",
                  submittedAt: nowIso,
                  updatedAt: nowIso,
                  members: roster.map((student: any) => ({
                    studentId: student.studentId,
                    name: student.name,
                    status: student.status || "absent",
                  })),
                },
                { merge: true }
              );
            }
          }
      } catch (draftError) {
        console.error("Failed to update attendance draft status:", draftError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Attendance publish error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
