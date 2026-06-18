import { NextRequest, NextResponse } from 'next/server';
import { Filter } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { getProfileBySession } from '@/lib/auth';

function cleanForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cleanForFirestore(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, fieldValue]) => fieldValue !== undefined)
        .map(([key, fieldValue]) => [key, cleanForFirestore(fieldValue)])
    ) as T;
  }

  return value;
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed !== 'unassigned' ? trimmed : null;
}

async function resolveFacilitatorId(facilitatorId: unknown, classId: unknown) {
  const requestedFacilitatorId = nonEmptyString(facilitatorId);
  const requestedClassId = nonEmptyString(classId);

  if (requestedFacilitatorId) return requestedFacilitatorId;
  if (!requestedClassId) return null;

  const classDoc = await adminDb.collection('classes').doc(requestedClassId).get();
  if (!classDoc.exists) return null;

  return nonEmptyString(classDoc.data()?.facilitatorId);
}

/**
 * GET /api/attendance/drafts
 * Facilitators call this to see templates assigned to them.
 */
export async function GET(req: NextRequest) {
  try {
    const profile = await getProfileBySession();
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'draft';
    const includeAll = searchParams.get('includeAll') === 'true';

    // Query the attendanceDrafts collection
    let draftsQuery: FirebaseFirestore.Query = adminDb.collection('attendanceDrafts');

    // If not including all, filter by the requested status (default 'draft')
    if (!includeAll) {
      draftsQuery = draftsQuery.where('status', '==', status);
    }

    // If the requester is a facilitator, filter specifically by their Firebase UID
    if (profile.role === 'facilitator') {
      // Facilitators see drafts assigned to them OR unassigned drafts in the pool
      draftsQuery = draftsQuery.where(
        Filter.or(
          Filter.where('facilitatorId', '==', profile.uid),
          Filter.where('facilitatorId', '==', 'unassigned')
        )
      );
    }

    const snapshot = await draftsQuery.get();
    const drafts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ rows: drafts });
  } catch (error) {
    console.error('Error fetching attendance drafts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/attendance/drafts
 * Admins call this to create a student list and assign it to a facilitator.
 */
export async function POST(req: NextRequest) {
  try {
    const profile = await getProfileBySession();
    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'campus_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, facilitatorId, members, classId, institutionId } = await req.json();
    const resolvedFacilitatorId = await resolveFacilitatorId(facilitatorId, classId);
    const resolvedClassId = nonEmptyString(classId);
    const normalizedMembers = Array.isArray(members) ? members : [];
    const validMembers = normalizedMembers
      .map((member: any) => ({
        studentId: typeof member?.studentId === 'string' ? member.studentId.trim() : '',
        name: typeof member?.name === 'string' ? member.name.trim() : '',
        email: typeof member?.email === 'string' && member.email.trim() ? member.email.trim() : undefined,
        status: member?.status,
        diet: member?.diet,
      }))
      .filter((member) => member.studentId && member.name);

    if (validMembers.length === 0) {
      return NextResponse.json({ error: 'At least one valid student member is required.' }, { status: 400 });
    }

    // If a facilitator is selected, verify they exist. Otherwise, mark as unassigned.
    let facilitatorEmail = undefined;
    if (resolvedFacilitatorId) {
      const facilitatorDoc = await adminDb.collection('profiles').doc(resolvedFacilitatorId).get();
      if (facilitatorDoc.exists) {
        facilitatorEmail = facilitatorDoc.data()?.email;
      }
    }

    const draftRef = adminDb.collection('attendanceDrafts').doc();
    const now = new Date().toISOString();
    const draft = cleanForFirestore({
      id: draftRef.id,
      title: typeof title === 'string' && title.trim() ? title.trim() : 'Attendance draft',
      facilitatorId: resolvedFacilitatorId || 'unassigned',
      facilitatorEmail: facilitatorEmail,
      members: validMembers,
      classId: resolvedClassId,
      status: 'draft',
      createdBy: profile.uid,
      institutionId: nonEmptyString(institutionId) || profile.institutionId,
      createdAt: now,
      updatedAt: now,
    });

    // facilitatorId MUST be the Firebase UID of the target facilitator
    // This ensures the facilitator's GET request (which filters by UID) finds the record.
    await draftRef.set(draft);

    return NextResponse.json({ success: true, id: draftRef.id });
  } catch (error) {
    // Add detailed logging for the POST request
    console.error('Error creating attendance draft:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}