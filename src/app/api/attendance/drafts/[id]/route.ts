import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getProfileBySession } from '@/lib/auth';
import { validateAttendanceMarks, validateOverallDraftStatus } from '@/lib/attendance-validation';

/**
 * GET /api/attendance/drafts/[id]
 * Retrieves a single attendance draft.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const profile = await getProfileBySession();
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const draftId = params.id;
    const doc = await adminDb.collection('attendanceDrafts').doc(draftId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const draft = { id: doc.id, ...doc.data() } as any;

    // Authorization Check
    if (profile.role === 'super_admin') {
      // Full access
    } else if (profile.role === 'campus_admin') {
      if (draft.institutionId !== profile.institutionId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (profile.role === 'facilitator') {
      // Allow access if it's assigned to them OR if it's currently unassigned
      if (draft.facilitatorId !== profile.uid && draft.facilitatorId !== 'unassigned') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/attendance/drafts/[id]
 * Facilitators call this to mark & submit attendance.
 * Admins call this to reassign or confirm drafts.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const profile = await getProfileBySession();
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const draftId = params.id;
    const draftRef = adminDb.collection('attendanceDrafts').doc(draftId);
    const draftSnapshot = await draftRef.get();

    if (!draftSnapshot.exists) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const existingDraft = draftSnapshot.data() as any;
    const now = new Date().toISOString();
    const updateData: Record<string, any> = { updatedAt: now };
    const requestBody = await req.json();

    if (profile.role === 'facilitator') {
      // Facilitator can interact if assigned or if the draft is unassigned
      if (existingDraft.facilitatorId !== profile.uid && existingDraft.facilitatorId !== 'unassigned') {
        return NextResponse.json({ error: 'Forbidden: Not assigned to this draft' }, { status: 403 });
      }

      const { members, status } = requestBody;

      // Scenario 1: Facilitator is SUBMITTING attendance
      if (status === 'submitted') {
        if (existingDraft.status !== 'draft') {
          return NextResponse.json({ error: 'Forbidden: Draft already submitted or confirmed' }, { status: 403 });
        }
        if (!members || !Array.isArray(members) || members.length === 0) {
          return NextResponse.json({ error: 'Bad Request: Members list is required for submission' }, { status: 400 });
        }
        try {
          validateAttendanceMarks(members);
        } catch (validationError: any) {
          return NextResponse.json({ error: `Validation Error: ${validationError.message}` }, { status: 400 });
        }

        updateData.members = members;
        updateData.status = 'submitted';
        updateData.submittedAt = now;

        // If the draft was unassigned, the facilitator who submits it also claims it.
        if (existingDraft.facilitatorId === 'unassigned') {
          updateData.facilitatorId = profile.uid;
          updateData.facilitatorEmail = profile.email || null;
        }

        const adminProfileSnapshot = await adminDb.collection('users').doc(existingDraft.createdBy).get();
        const adminProfile = adminProfileSnapshot.data() as any;
        if (adminProfile && adminProfile.email) {
          const { sendAttendanceSubmissionEmail } = await import('@/lib/email-utils');
          await sendAttendanceSubmissionEmail(
            adminProfile.email,
            profile.name || profile.email || profile.uid,
            existingDraft.title,
            draftId
          );
        }
      // Scenario 2: Facilitator is CLAIMING an unassigned draft
      } else if (existingDraft.facilitatorId === 'unassigned' && status === 'draft') {
        updateData.facilitatorId = profile.uid;
        updateData.facilitatorEmail = profile.email || null;
        // The status remains 'draft', we are just changing ownership.
        updateData.status = 'draft';
      } else {
        // Any other facilitator PATCH request is invalid.
        return NextResponse.json({
          error: 'Bad Request: Invalid action. Facilitators can only submit attendance or claim unassigned drafts.'
        }, { status: 400 });
      }

    } else if (profile.role === 'campus_admin' || profile.role === 'super_admin') {
      if (profile.role === 'campus_admin' && existingDraft.institutionId !== profile.institutionId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { facilitatorId, status } = requestBody;

      if (facilitatorId !== undefined) {
        if (typeof facilitatorId !== 'string' || facilitatorId.trim() === '') {
          return NextResponse.json({ error: 'Bad Request: Invalid facilitatorId' }, { status: 400 });
        }
        updateData.facilitatorId = facilitatorId;
      }

      if (status !== undefined) {
        validateOverallDraftStatus(status);
        updateData.status = status;
        if (status === 'submitted' && existingDraft.status !== 'submitted') {
          updateData.submittedAt = now;
        }
      }

      if (Object.keys(requestBody).length === 0) {
        return NextResponse.json({ error: 'Bad Request: No valid fields provided' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await draftRef.update(updateData);
    return NextResponse.json({ success: true, id: draftId, updatedDraft: { ...existingDraft, ...updateData } });

  } catch (error: any) {
    console.error('Error updating draft:', error);
    if (error.message && error.message.startsWith('Invalid')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}