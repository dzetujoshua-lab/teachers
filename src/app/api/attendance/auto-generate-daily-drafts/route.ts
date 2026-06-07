import { NextResponse } from "next/server";
import { getFirebaseAdminDb, getProfileBySession } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

interface ClassData {
  id: string;
  code?: string;
  name?: string;
  facilitatorId?: string;
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

export async function POST(request: Request) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });

    const body = await request.json();
    const { date } = body;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get all active classes
    const classesSnapshot = await db.collection("classes").get();
    const classes = classesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ClassData[];

    const nowIso = new Date().toISOString();
    const generatedDrafts = [];

    for (const cls of classes) {
      const classId = cls.id;
      const classCode = cls.code || "CLS";
      const className = cls.name || "Class";
      const facilitatorId = cls.facilitatorId;
      const members = cls.members || [];

      if (!facilitatorId || members.length === 0) continue;

      // Check if class is active
      if (cls.status === "inactive" || cls.archived) continue;

      // Check if a draft already exists for this class today
      const todayStr = targetDate.toISOString().split("T")[0];

      const existingSnapshot = await db.collection("attendanceDrafts")
        .where("classId", "==", classId)
        .where("scheduledFor", "==", todayStr)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        console.log(`Draft already exists for class ${classId} today`);
        continue;
      }

      const draft = {
        title: `${classCode} - ${className} Daily Attendance`,
        classId,
        facilitatorId,
        members: members.map((m: any) => ({
          studentId: m.studentId || m.id,
          name: m.name || "Student",
          status: "absent" as const,
        })),
        status: "draft" as const,
        institutionId: cls.institutionId || null,
        campusId: cls.campusId || null,
        createdAt: nowIso,
        updatedAt: nowIso,
        scheduledFor: targetDate.toISOString().split("T")[0],
      };

      const ref = await db.collection("attendanceDrafts").add(draft);

      // Notify facilitator
      const facilitatorDoc = await db.collection("profiles").doc(facilitatorId).get();
      const facilitatorData = facilitatorDoc.data() as any;

      if (facilitatorData?.email) {
        await sendEmailNotification({
          to: facilitatorData.email,
          subject: `Daily Attendance Ready: ${classCode}`,
          html: `
            <h2>Daily Attendance Generated</h2>
            <p>Hi ${facilitatorData.name || "Facilitator"},</p>
            <p>A daily attendance draft has been automatically created for <strong>${className}</strong>.</p>
            <p><strong>Date:</strong> ${targetDate.toLocaleDateString()}</p>
            <p><strong>Students:</strong> ${members.length} enrolled</p>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/facilitator/drafts">
              View Attendance Draft
            </a></p>
          `,
        });
      }

      // Create notification for facilitator
      await db.collection("notifications").add({
        title: "Daily attendance draft generated",
        body: `Auto-generated draft for ${classCode} - ${members.length} students. Ready for marking.`,
        type: "attendance",
        time: nowIso,
        read: false,
        audienceRole: "facilitator",
        audienceId: facilitatorId,
        attendanceDraftId: ref.id,
        createdAt: nowIso,
      });

      generatedDrafts.push({ id: ref.id, classId, classCode });
    }

    return NextResponse.json({
      success: true,
      generated: generatedDrafts.length,
      drafts: generatedDrafts,
    });
  } catch (error) {
    console.error("Auto-generate daily drafts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}