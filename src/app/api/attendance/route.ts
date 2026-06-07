import { NextResponse } from 'next/server';
import { getFirebaseAdminDb, getProfileBySession } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import type { AttendanceEvent } from '@/lib/types';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const sessionId = url.searchParams.get('sessionId');
  const studentId = url.searchParams.get('studentId');

  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const snapshot = await db.collection('attendance').get();
const events = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as AttendanceEvent & Record<string, unknown>)
        .filter((event) => {
          if (sessionId && String(event.sessionId || event.course) !== sessionId) return false;
          if (studentId && event.studentId !== studentId) return false;
          return true;
        });

    return NextResponse.json({
      data: events.slice(offset, offset + limit),
      total: events.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, studentId, method, metadata } = body;

    if (!sessionId || !studentId || !method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const attendanceId = `${sessionId}-${studentId}`;
    const existing = await db.collection('attendance').doc(attendanceId).get();
    if (existing.exists) {
      return NextResponse.json({ error: 'Attendance has already been recorded for this session.' }, { status: 409 });
    }

    const record = {
      id: attendanceId,
      sessionId,
      studentId,
      method,
      status: metadata?.status || 'present',
      metadata: metadata || {},
      time: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await db.collection('attendance').doc(attendanceId).set(record);
    await db.collection('sessions').doc(sessionId).set(
      { updatedAt: new Date().toISOString() },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      attendanceId,
      timestamp: record.time,
    });
  } catch (error) {
    console.error('Attendance recording error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
