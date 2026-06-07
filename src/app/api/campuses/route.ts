import { NextResponse } from 'next/server';
import { getFirebaseAdminDb, getProfileBySession } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const snapshot = await db.collection('campuses').get();
    const campuses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ data: campuses, total: campuses.length });
  } catch (error) {
    console.error('Campuses fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, location } = body;

    if (!name) {
      return NextResponse.json({ error: 'Campus name is required.' }, { status: 400 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const campusId = `campus-${Date.now()}`;
    const campus = {
      id: campusId,
      name: String(name).trim(),
      location: String(location || '').trim(),
      institutionId: profile.institutionId || campusId,
      createdBy: profile.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('campuses').doc(campusId).set(campus);
    return NextResponse.json({ success: true, campus });
  } catch (error) {
    console.error('Campus creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
