import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFirebaseAdminDb, getProfileBySession } from '@/lib/firebase/admin';

async function sendEmailNotification({ to, subject, html }: { to: string; subject: string; html: string }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@smartcampus.local',
      to,
      subject,
      html,
    }),
  }).catch((err) => console.error('Resend email error:', err));
}

export async function POST(request: Request) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (profile.role !== 'facilitator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const body = await request.json();
    const { sessionId } = body as { sessionId?: string };

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    if (!sessionDoc.exists) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const session = sessionDoc.data() as any;

    // Ensure the facilitator owns the session
    if (String(session.facilitatorId || '') !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const facilitatorName = profile.name || 'Facilitator';
    const sessionTitle = session.course || session.courseId || 'Attendance Session';

    // Notify all three roles: admin, kitchen manager, and security officer
    const adminSnap = await db.collection('profiles').where('role', '==', 'super_admin').limit(1).get();
    const kitchenSnap = await db.collection('profiles').where('role', '==', 'kitchen_manager').limit(1).get();
    const securitySnap = await db.collection('profiles').where('role', '==', 'security_officer').limit(1).get();

    const nowIso = new Date().toISOString();

    // Notify admin
    if (!adminSnap.empty) {
      const adminData = adminSnap.docs[0].data() as any;
      if (adminData?.email) {
        await sendEmailNotification({
          to: adminData.email,
          subject: `Facilitator started attendance: ${sessionTitle}`,
          html: `
            <h2>Attendance session started</h2>
            <p>Hi Admin,</p>
            <p><strong>${facilitatorName}</strong> has started taking attendance.</p>
            <p><strong>Session:</strong> ${sessionTitle}</p>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/super_admin/drafts">View Session</a></p>
          `,
        });
      }
    }

    // Notify kitchen manager
    if (!kitchenSnap.empty) {
      const kitchenData = kitchenSnap.docs[0].data() as any;
      if (kitchenData?.email) {
        await sendEmailNotification({
          to: kitchenData.email,
          subject: `Attendance Session Started: ${sessionTitle}`,
          html: `
            <h2>Attendance Session Started</h2>
            <p>Hi Kitchen Manager,</p>
            <p><strong>${facilitatorName}</strong> has started attendance for <strong>${sessionTitle}</strong>.</p>
            <p>Meal preparation may be required based on session attendance.</p>
          `,
        });
      }
    }

    // Notify security officer
    if (!securitySnap.empty) {
      const securityData = securitySnap.docs[0].data() as any;
      if (securityData?.email) {
        await sendEmailNotification({
          to: securityData.email,
          subject: `Attendance Session Started: ${sessionTitle}`,
          html: `
            <h2>Attendance Session Started</h2>
            <p>Hi Security Officer,</p>
            <p><strong>${facilitatorName}</strong> has started an attendance session.</p>
            <p><strong>Session:</strong> ${sessionTitle}</p>
            <p>Monitor for any security-related events.</p>
          `,
        });
      }
    }

    // Create in-app notifications for all roles
    await db.collection('notifications').add({
      title: "Attendance session started",
      body: `${facilitatorName} started session "${sessionTitle}".`,
      type: "attendance",
      time: nowIso,
      read: false,
      audienceRole: "super_admin",
      sessionId,
      createdAt: nowIso,
    });

    await db.collection('notifications').add({
      title: "Attendance session in progress",
      body: `${facilitatorName} started session "${sessionTitle}". Meal prep may be needed.`,
      type: "meal",
      time: nowIso,
      read: false,
      audienceRole: "kitchen_manager",
      sessionId,
      createdAt: nowIso,
    });

    await db.collection('notifications').add({
      title: "Attendance session started",
      body: `${facilitatorName} started attendance session "${sessionTitle}".`,
      type: "security",
      time: nowIso,
      read: false,
      audienceRole: "security_officer",
      sessionId,
      createdAt: nowIso,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('notify-admin-on-start error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

