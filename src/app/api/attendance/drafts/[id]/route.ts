import { NextResponse } from "next/server";
import { getFirebaseAdminDb, getProfileBySession } from "@/lib/firebase/admin";
import { validateAttendanceMarks } from "@/lib/attendance-validation";
import { cookies } from "next/headers";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });
    const doc = await db.collection("attendanceDrafts").doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: any = { id: doc.id, ...(doc.data() as any) };

    // Facilitator can only access drafts assigned to them
    if (profile.role === "facilitator" && data.facilitatorId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ draft: data });
  } catch (error) {
    console.error("Get draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 500 });
    const docRef = db.collection("attendanceDrafts").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: any = doc.data();

    const body = await request.json();

    // Facilitators can update members (mark attendance) and submit (change status to 'submitted')
    if (profile.role === "facilitator") {
      if (data.facilitatorId !== profile.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const updates: any = {};
      if (Array.isArray(body.members)) {
        const validation = validateAttendanceMarks(body.members);
        if (!validation.valid) {
          return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
        }
        updates.members = body.members.map((m: any) => ({ studentId: String(m.studentId), name: String(m.name || ""), status: String(m.status || "absent") }));
      }
      if (body.status === "submitted") {
        updates.status = "submitted";
        updates.submittedAt = new Date().toISOString();
      }

      updates.updatedAt = new Date().toISOString();
      await docRef.set(updates, { merge: true });

      if (body.status === "submitted") {
        // Create notification for admin when facilitator submits
        const nowIso = new Date().toISOString();
        await db.collection("notifications").add({
          title: "Attendance draft submitted",
          body: `${profile.name || "Facilitator"} submitted draft "${data.title}" with ${data.members?.length || 0} members.`,
          type: "attendance",
          time: nowIso,
          read: false,
          audienceRole: "super_admin",
          attendanceDraftId: id,
          facilitatorId: profile.id,
          createdAt: nowIso,
        });
        // Send email notification
        try {
          const adminSnapshot = await db.collection("profiles").where("role", "==", "super_admin").limit(1).get();
          if (!adminSnapshot.empty) {
            const adminDoc = adminSnapshot.docs[0];
            const adminData = adminDoc.data() as any;
            if (adminData?.email) {
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
                    to: adminData.email,
                    subject: `Attendance Draft Submitted: ${data.title}`,
                    html: `
                      <h2>Attendance Draft Submitted</h2>
                      <p>Hi Admin,</p>
                      <p><strong>${profile.name || "Facilitator"}</strong> has submitted an attendance draft:</p>
                      <p><strong>Title:</strong> ${data.title}</p>
                      <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard/super_admin">
                        View in Dashboard
                      </a></p>
                      <p>Please review and confirm.</p>
                    `,
                  }),
                }).catch((err) => console.error("Email send error:", err));
              }
            }
          }
        } catch (emailErr) {
          console.error("Failed to send notification email:", emailErr);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (profile.role === "super_admin") {
      const updates: any = {};
      if (Array.isArray(body.members)) {
        updates.members = body.members.map((m: any) => ({ 
          studentId: String(m.studentId), 
          name: String(m.name || ""), 
          status: String(m.status || "absent") 
        }));
      }
      if (body.status) {
        updates.status = body.status;
        if (body.status === "approved") {
          updates.approvedAt = new Date().toISOString();
          updates.approvedBy = profile.id;
        }
        if (body.status === "sent_to_kitchen") {
          updates.sentToKitchenAt = new Date().toISOString();
        }
        // Create notification for facilitator when admin approves
        if (body.status === "approved" && data.facilitatorId) {
          const nowIso = new Date().toISOString();
          await db.collection("notifications").add({
            title: "Draft approved",
            body: `Admin approved your draft "${data.title}". Ready for kitchen.`,
            type: "attendance",
            time: nowIso,
            read: false,
            audienceRole: "facilitator",
            audienceId: data.facilitatorId,
            attendanceDraftId: id,
            createdAt: nowIso,
          });
        }
      }

      updates.updatedAt = new Date().toISOString();
      await docRef.set(updates, { merge: true });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("Update draft error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}