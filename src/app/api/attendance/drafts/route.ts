import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getProfileBySession } from '@/lib/auth';

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
      draftsQuery = draftsQuery.where('facilitatorId', '==', profile.uid);
    }

    const snapshot = await draftsQuery.get();
    const drafts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

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
    const draftRef = adminDb.collection('attendanceDrafts').doc();
    const now = new Date().toISOString();

    // facilitatorId MUST be the Firebase UID of the target facilitator
    // This ensures the facilitator's GET request (which filters by UID) finds the record.
    await draftRef.set({
      id: draftRef.id, title, facilitatorId, members, classId,
      status: 'draft', createdBy: profile.uid, institutionId, createdAt: now, updatedAt: now
    });

    return NextResponse.json({ success: true, id: draftRef.id });
  } catch (error) {
    // Add detailed logging for the POST request
    console.error('Error creating attendance draft:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}