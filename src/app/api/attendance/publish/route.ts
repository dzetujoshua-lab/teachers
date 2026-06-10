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

    const sessionRef = db.collection("sessions").doc();
    const sessionId = sessionRef.id;

    const sessionRecord: Record<string, unknown> = {
      id: sessionId,
      course: sessionTitle,
      method: "manual",
      facilitatorId: profile.id,
      facilitator: profile.name || profile.id,
      institutionId: profile.institutionId || "accra-main-campus",
      status: "completed",
      roster: roster.map((student: any) => ({
        studentId: student.studentId,
        name: student.name,
        status: student.status || "absent",
      })),
      present: roster.filter((s: any) => s.status === "present").length,
      total: roster.length,
      flagged: 0,
      startedAt: nowIso,
      completedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await sessionRef.set(sessionRecord);

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

    for (const student of roster) {
      const eventId = `${sessionId}-${student.studentId}`;
      await db.collection("attendance").doc(eventId).set({
        id: eventId,
        sessionId,
        studentId: student.studentId,
        student: student.name,
        course: sessionTitle,
        status: student.status || "absent",
        method: "manual",
        time: nowIso,
        createdAt: nowIso,
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
