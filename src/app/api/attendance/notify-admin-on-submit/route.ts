import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFirebaseAdminDb, getProfileBySession } from '@/lib/firebase/admin';

const { RESEND_API_KEY } = process.env;

async function notifyByEmail({
  adminEmail,
  facilitatorName,
  sessionTitle,
  sessionId,
}: {
  adminEmail: string;
  facilitatorName: string;
  sessionTitle: string;
  sessionId: string;
}) {
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
      to: adminEmail,
      subject: `Facilitator submitted attendance: ${sessionTitle}`,
      html: `
        <h2>Attendance submitted</h2>
        <p>Hi Admin,</p>
        <p><strong>${facilitatorName}</strong> has submitted an attendance draft.</p>
        <p><strong>Session:</strong> ${sessionTitle}</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/super_admin/drafts/${sessionId}">Review Submission</a></p>
      `,
    }),
  }).catch((err) => console.error('Resend email error:', err));
}

async function notifyKitchenByEmail({
  kitchenEmail,
  facilitatorName,
  sessionTitle,
  memberCount,
}: {
  kitchenEmail: string;
  facilitatorName: string;
  sessionTitle: string;
  memberCount: number;
}) {
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
      to: kitchenEmail,
      subject: `Attendance Submitted: Meal Preparation Required`,
      html: `
        <h2>Attendance Submitted - Meal Preparation</h2>
        <p>Hi Kitchen Manager,</p>
        <p><strong>${facilitatorName}</strong> has submitted attendance for <strong>${sessionTitle}</strong>.</p>
        <p><strong>Students enrolled:</strong> ${memberCount}</p>
        <p>Review meal preferences in the kitchen dashboard to prepare accordingly.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/kitchen_manager/demand">
          View Meal Demand
        </a></p>
      `,
    }),
  }).catch((err) => console.error('Kitchen email error:', err));
}

async function notifySecurityByEmail({
  securityEmail,
  facilitatorName,
  sessionTitle,
}: {
  securityEmail: string;
  facilitatorName: string;
  sessionTitle: string;
}) {
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
      to: securityEmail,
      subject: `Attendance Session Completed`,
      html: `
        <h2>Attendance Session Completed</h2>
        <p>Hi Security Officer,</p>
        <p><strong>${facilitatorName}</strong> has completed an attendance session.</p>
        <p><strong>Session:</strong> ${sessionTitle}</p>
        <p>You may review security logs related to this session.</p>
      `,
    }),
  }).catch((err) => console.error('Security email error:', err));
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

    // Ensure facilitator owns session
    if (String(session.facilitatorId || '') !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const facilitatorName = profile.name || 'Facilitator';
    const sessionTitle = session.course || session.courseId || 'Attendance Session';
    const memberCount = session.roster?.length || session.total || 0;

    // Notify admin
    const adminSnap = await db
      .collection('profiles')
      .where('role', '==', 'super_admin')
      .limit(1)
      .get();

    if (!adminSnap.empty) {
      const adminData = adminSnap.docs[0].data() as any;
      const adminEmail = adminData?.email;
      if (adminEmail) {
        await notifyByEmail({
          adminEmail,
          facilitatorName,
          sessionTitle,
          sessionId,
        });
      }
    }

    // Notify kitchen manager
    const kitchenSnap = await db
      .collection('profiles')
      .where('role', '==', 'kitchen_manager')
      .limit(1)
      .get();

    if (!kitchenSnap.empty) {
      const kitchenData = kitchenSnap.docs[0].data() as any;
      if (kitchenData?.email) {
        await notifyKitchenByEmail({
          kitchenEmail: kitchenData.email,
          facilitatorName,
          sessionTitle,
          memberCount,
        });
      }
    }

    // Notify security officer
    const securitySnap = await db
      .collection('profiles')
      .where('role', '==', 'security_officer')
      .limit(1)
      .get();

    if (!securitySnap.empty) {
      const securityData = securitySnap.docs[0].data() as any;
      if (securityData?.email) {
        await notifySecurityByEmail({
          securityEmail: securityData.email,
          facilitatorName,
          sessionTitle,
        });
      }
    }

    // Create notification for all three roles
    const nowIso = new Date().toISOString();
    await db.collection('notifications').add({
      title: 'Attendance session completed',
      body: `${facilitatorName} completed attendance for "${sessionTitle}" with ${memberCount} students.`,
      type: 'attendance',
      time: nowIso,
      read: false,
      audienceRole: 'super_admin',
      sessionId,
      createdAt: nowIso,
    });

    await db.collection('notifications').add({
      title: 'Attendance submitted - meal prep',
      body: `Session "${sessionTitle}" completed. ${memberCount} students enrolled. Check preferences.`,
      type: 'meal',
      time: nowIso,
      read: false,
      audienceRole: 'kitchen_manager',
      sessionId,
      createdAt: nowIso,
    });

    await db.collection('notifications').add({
      title: 'Attendance session completed',
      body: `Facilitator ${facilitatorName} completed session "${sessionTitle}".`,
      type: 'security',
      time: nowIso,
      read: false,
      audienceRole: 'security_officer',
      sessionId,
      createdAt: nowIso,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('notify-admin-on-submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

