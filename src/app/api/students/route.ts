import { NextResponse } from 'next/server';
import { getFirebaseAdminDb, getProfileBySession } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const departmentId = url.searchParams.get('departmentId');
  const campusId = url.searchParams.get('campusId');
  const search = url.searchParams.get('search');

  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const snapshot = await db.collection('students').get();
    const students = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((student: any) => {
        if (campusId && student.campusId !== campusId && student.institutionId !== campusId) return false;
        if (departmentId && student.departmentId !== departmentId && student.department !== departmentId) return false;
        if (search) {
          const text = [student.name, student.email, student.studentId, student.department].join(' ').toLowerCase();
          if (!text.includes(search.toLowerCase())) return false;
        }
        return true;
      });

    return NextResponse.json({
      data: students,
      total: students.length,
    });
  } catch (error) {
    console.error('Students fetch error:', error);
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
    const { studentId, name, email, departmentId, mealPreference } = body;
    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const id = String(studentId || `STU-${Date.now()}`);
    const student = {
      id,
      studentId: id,
      name: String(name || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      departmentId: departmentId || null,
      mealPreference: mealPreference || 'no_meal',
      institutionId: profile.institutionId || 'accra-main-campus',
      createdBy: profile.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!student.name || !student.email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }

    await db.collection('students').doc(id).set(student, { merge: true });
    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error('Student creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
