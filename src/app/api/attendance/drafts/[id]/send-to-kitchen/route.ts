import { NextResponse } from "next/server";
import { getFirebaseAdminDb, getProfileBySession } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (profile.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });

    const id = params.id;
    const docRef = db.collection("attendanceDrafts").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: any = doc.data();
    if (data.status !== "submitted") {
      return NextResponse.json({ error: "Draft must be submitted before sending to kitchen" }, { status: 400 });
    }

    const updates: any = {
      status: "sent_to_kitchen",
      sentToKitchenAt: new Date().toISOString(),
      sentBy: profile.id,
    };

    await docRef.set(updates, { merge: true });

    const kitchenSnapshot = await db.collection("profiles").where("role", "==", "kitchen_manager").get();
    if (!kitchenSnapshot.empty) {
      const kitchenDoc = kitchenSnapshot.docs[0];
      const kitchenData = kitchenDoc.data() as any;
      if (kitchenData?.email) {
        const { RESEND_API_KEY } = process.env;
        if (RESEND_API_KEY) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "noreply@smartcampus.local",
              to: kitchenData.email,
              subject: `Attendance Ready: ${data.title}`,
              html: `
                <h2>Attendance Submitted to Kitchen</h2>
                <p>Hi Kitchen Manager,</p>
                <p>An attendance record has been approved and sent to you:</p>
                <p><strong>Title:</strong> ${data.title}</p>
                <p><strong>Members:</strong> ${data.members.length} students</p>
                <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/kitchen_manager/demand">
                  View Meal Demand
                </a></p>
              `,
            }),
          }).catch((err) => console.error("Email send error:", err));
        }
      }
    }

    // Create notification for kitchen manager
    const nowIso = new Date().toISOString();
    await db.collection("notifications").add({
      title: "Attendance sent to kitchen",
      body: `Draft "${data.title}" has been sent to kitchen manager. ${data.members.length} students expected.`,
      type: "meal",
      time: nowIso,
      read: false,
      audienceRole: "kitchen_manager",
      attendanceDraftId: id,
      createdAt: nowIso,
    });

    // Also notify security officer when attendance is sent to kitchen
    const securitySnap = await db.collection("profiles").where("role", "==", "security_officer").get();
    if (!securitySnap.empty) {
      const securityDoc = securitySnap.docs[0];
      const securityData = securityDoc.data() as any;
      if (securityData?.email) {
        await sendEmailNotification({
          to: securityData.email,
          subject: `Attendance Session Completed: ${data.title}`,
          html: `
            <h2>Attendance Session Completed</h2>
            <p>Hi Security Officer,</p>
            <p>Attendance for <strong>${data.title}</strong> has been finalized and sent to kitchen.</p>
            <p><strong>Students:</strong> ${data.members.length}</p>
            <p>You may review related security logs for this session.</p>
          `,
        });
      }
      await db.collection("notifications").add({
        title: "Attendance session completed",
        body: `Draft "${data.title}" finalized with ${data.members.length} students. Check security logs.`,
        type: "security",
        time: nowIso,
        read: false,
        audienceRole: "security_officer",
        attendanceDraftId: id,
        createdAt: nowIso,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send to kitchen error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}