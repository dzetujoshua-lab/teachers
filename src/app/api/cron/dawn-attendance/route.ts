import { NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";

interface ClassData {
  id: string;
  code?: string;
  name?: string;
  facilitatorId?: string;
  facilitatorEmail?: string;
  members?: any[];
  institutionId?: string;
  campusId?: string;
  status?: string;
  archived?: boolean;
}

async function sendEmailNotification({ to, subject, html }: { to: string; subject: string; html: string }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "noreply@smartcampus.local",
      to,
      subject,
      html,
    }),
  }).catch((err) => console.error("Email send error:", err));
}

export async function GET(request: Request) {
  try {
    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });

    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");

    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nowIso = new Date().toISOString();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const classesSnapshot = await db.collection("classes").get();
    const classes = classesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ClassData[];

    let generatedCount = 0;
    let notifiedCount = 0;

    for (const cls of classes) {
      const classId = cls.id;
      const classCode = cls.code || "CLS";
      const className = cls.name || "Class";
      const facilitatorId = cls.facilitatorId;
      const members = cls.members || [];

      if (!facilitatorId || members.length === 0) continue;
      if (cls.status === "inactive" || cls.archived) continue;

      const existingSnapshot = await db.collection("attendanceDrafts")
        .where("classId", "==", classId)
        .where("scheduledFor", "==", todayStr)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) continue;

      const validMembers = members
        .filter((m: any) => m && typeof m === "object")
        .map((m: any) => ({
          studentId: String(m.studentId ?? m.id ?? "").trim(),
          name: String(m.name ?? "Student").trim(),
        }))
        .filter((m: any) => m.studentId.length > 0 && m.name.length > 0);

      if (validMembers.length === 0) continue;

      const draft = {
        title: `${classCode} - ${className} Daily Attendance`,
        classId,
        facilitatorId,
        members: validMembers.map((m: any) => ({
          studentId: m.studentId,
          name: m.name,
          status: "absent" as const,
        })),
        status: "draft" as const,
        institutionId: cls.institutionId || null,
        campusId: cls.campusId || null,
        createdAt: nowIso,
        updatedAt: nowIso,
        scheduledFor: todayStr,
      };

      const ref = await db.collection("attendanceDrafts").add(draft);
      generatedCount++;

      const facilitatorDoc = await db.collection("profiles").doc(facilitatorId).get();
      const facilitatorData = facilitatorDoc.data() as any;

      if (facilitatorData?.email) {
        await sendEmailNotification({
          to: facilitatorData.email,
          subject: `Daily Attendance Ready: ${classCode}`,
          html: `
            <h2>Daily Attendance Generated</h2>
            <p>Hi ${facilitatorData.name || "Facilitator"},</p>
            <p>A daily attendance draft has been automatically created for <strong>${className}</strong> on ${today.toLocaleDateString()}.</p>
            <p><strong>Students:</strong> ${validMembers.length} enrolled</p>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/facilitator/drafts">
              View Attendance Draft
            </a></p>
            <p>This draft will be available for marking until submission.</p>
          `,
        });
        notifiedCount++;
      }

      await db.collection("notifications").add({
        title: "Daily attendance draft generated",
        body: `Auto-generated draft for ${classCode} - ${validMembers.length} students. Ready for marking.`,
        type: "attendance",
        time: nowIso,
        read: false,
        audienceRole: "facilitator",
        audienceId: facilitatorId,
        attendanceDraftId: ref.id,
        createdAt: nowIso,
      });
    }

    console.log(`Dawn attendance cron: Generated ${generatedCount} drafts, notified ${notifiedCount} facilitators`);

    return NextResponse.json({
      success: true,
      generated: generatedCount,
      notified: notifiedCount,
      date: todayStr,
      timestamp: nowIso,
    });
  } catch (error) {
    console.error("Dawn attendance cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}