import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDb, getProfileBySession } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'campus_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const classId = params.id;
    const body = await request.json();
    const { members, ...updates } = body;

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const classRef = db.collection('classes').doc(classId);
    const classDoc = await classRef.get();

    if (!classDoc.exists) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (members !== undefined) {
      updateData.members = Array.isArray(members) ? members : [];
    }

    await classRef.update(updateData);
    return NextResponse.json({ success: true, class: { id: classId, ...updateData } });
  } catch (error) {
    console.error('Class update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}