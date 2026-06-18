import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getProfileBySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const profile = await getProfileBySession();
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draftId, members, classId, className, facilitatorId } = await req.json();

    if (!draftId || !Array.isArray(members) || members.length === 0 || !classId || !className || !facilitatorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const batch = adminDb.batch();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // 1. Update the attendance draft status to 'approved'
    const draftRef = adminDb.collection('attendanceDrafts').doc(draftId);
    batch.update(draftRef, {
      status: 'approved',
      updatedAt: new Date().toISOString(),
      verifiedBy: profile.uid, // Record who verified it
      verifiedAt: new Date().toISOString(),
    });

    // 2. Create/update attendance_records for each member
    for (const member of members) {
      // Generate a unique ID for daily attendance per student
      // This ensures only one record per student per day, and updates if exists
      const recordId = `${member.studentId}-${today}`;
      const recordRef = adminDb.collection('attendance_records').doc(recordId);

      batch.set(recordRef, {
        id: recordId,
        date: today,
        student_id: member.studentId,
        student_name: member.name,
        class_name: className,
        status: member.status || 'absent', // Default to absent if status is missing
        diet: member.diet || 'pepper', // Default to 'pepper' if diet is missing
        marked_by: facilitatorId,
        is_verified: true, // This is the key for distribution
      }, { merge: true }); // Use merge to update existing or create new
    }

    await batch.commit();

    return NextResponse.json({ success: true, message: 'Attendance verified and records created/updated.' });

  } catch (error) {
    console.error('Error verifying attendance:', error);
    return NextResponse.json({ error: 'Failed to verify attendance' }, { status: 500 });
  }
}