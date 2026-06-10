import { NextResponse } from 'next/server';
import { getFirebaseAdminDb, getProfileBySession } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function DELETE(request: Request) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { classId } = body;

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required.' }, { status: 400 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    await db.collection('classes').doc(classId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Class deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const facilitatorId = url.searchParams.get('facilitatorId');
  const search = url.searchParams.get('search');

  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const snapshot = await db.collection('classes').get();
    const classes = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((cls: any) => {
        if (facilitatorId && cls.facilitatorId !== facilitatorId) return false;
        if (search) {
          const text = [cls.name, cls.code, cls.facilitator, cls.facilitatorId].join(' ').toLowerCase();
          if (!text.includes(search.toLowerCase())) return false;
        }
        return true;
      });

    return NextResponse.json({
      data: classes,
      total: classes.length,
    });
  } catch (error) {
    console.error('Classes fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, facilitatorId, facilitatorEmail, members, campusId, campusName } = body;

    if (!code || !name || !facilitatorId) {
      return NextResponse.json({ error: 'Code, name, and facilitatorId are required.' }, { status: 400 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const clsId = `cls-${Date.now()}`;
    const cls = {
      id: clsId,
      code: String(code).trim(),
      name: String(name).trim(),
      facilitatorId: String(facilitatorId),
      facilitatorEmail: String(facilitatorEmail || ''),
      campusId: campusId || profile.institutionId || 'accra-main-campus',
      campusName: campusName || null,
      members: Array.isArray(members) ? members : [],
      institutionId: profile.institutionId || 'accra-main-campus',
      createdBy: profile.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('classes').doc(clsId).set(cls);
    return NextResponse.json({ success: true, class: cls });
  } catch (error) {
    console.error('Class creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}