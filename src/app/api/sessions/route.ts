import { NextResponse } from 'next/server';
import { getFirebaseAdminDb, getProfileBySession } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const courseId = url.searchParams.get('courseId');
  const facilitatorId = url.searchParams.get('facilitatorId');

  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    let query: any = db.collection('sessions');

    if (facilitatorId) {
      query = query.where('facilitatorId', '==', facilitatorId);
    } else if (profile.role === 'facilitator') {
      query = query.where('facilitatorId', '==', profile.id);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const sessions = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({
      data: sessions,
      total: sessions.length,
    });
  } catch (error: any) {
    const code = (error?.code || "").toUpperCase();
    if (code === "RESOURCE_EXHAUSTED" || error?.code === 8) {
      return NextResponse.json({ error: 'Quota exceeded. Please try again later.' }, { status: 429 });
    }
    console.error('Sessions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courseId, roomId, method, roster } = body;

    if (!courseId || !method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const profile = await getProfileBySession(await cookies());
    if (!profile || profile.role !== 'facilitator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const sessionId = `sess-${Date.now()}`;
    const pin = Math.random().toString().slice(2, 8);
    const session = {
      id: sessionId,
      courseId,
      course: String(body.course || courseId),
      roomId: roomId || null,
      room: String(body.room || roomId || 'Unassigned'),
      method,
      roster: Array.isArray(roster) ? roster : [],
      facilitatorId: profile.id,
      facilitator: profile.name,
      institutionId: profile.institutionId || 'accra-main-campus',
      status: 'live',
      present: 0,
      total: Array.isArray(roster) ? roster.length : 0,
      flagged: 0,
      pin,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('sessions').doc(sessionId).set(session);

    return NextResponse.json({
      success: true,
      sessionId,
      qrCode: 'data:image/png;base64,...',
      pin,
      status: 'live',
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
