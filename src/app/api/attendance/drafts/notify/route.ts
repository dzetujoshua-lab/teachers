import { NextResponse } from "next/server";
import { getFirebaseAdminDb, getProfileBySession } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

const { RESEND_API_KEY } = process.env;

async function sendNotificationEmail(
  adminEmail: string,
  facilitatorName: string,
  draftTitle: string,
  draftId: string
) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured; email skipped");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@smartcampus.local",
        to: adminEmail,
        subject: `Attendance Draft Submitted: ${draftTitle}`,
        html: `
          <h2>Attendance Draft Submitted</h2>
          <p>Hi Admin,</p>
          <p><strong>${facilitatorName}</strong> has submitted an attendance draft:</p>
          <p><strong>Title:</strong> ${draftTitle}</p>
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/super_admin/drafts/${draftId}">
            View Draft
          </a></p>
          <p>Please review and confirm.</p>
        `,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send email:", await response.text());
    }
  } catch (err) {
    console.error("Error sending email:", err);
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only facilitators can notify admin of submission
    if (profile.role !== "facilitator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });

    const body = await request.json();
    const { draftId } = body;

    if (!draftId) {
      return NextResponse.json({ error: "draftId is required" }, { status: 400 });
    }

    const draftRef = db.collection("attendanceDrafts").doc(draftId);
    const draftDoc = await draftRef.get();

    if (!draftDoc.exists) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const draftData = draftDoc.data() as any;

    // Verify this draft is assigned to the current facilitator
    if (draftData.facilitatorId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get admin profile for email
    const adminDoc = await db.collection("profiles").doc(draftData.createdBy).get();
    const adminData = adminDoc.data() as any;

    if (adminData?.email) {
      await sendNotificationEmail(
        adminData.email,
        profile.name || "Facilitator",
        draftData.title,
        draftId
      );
    }

    return NextResponse.json({ success: true, message: "Notification sent" });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
