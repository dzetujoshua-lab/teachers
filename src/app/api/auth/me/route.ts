import { NextResponse } from 'next/server';
import { getProfileBySession } from '@/lib/auth';

/**
 * GET /api/auth/me
 * Retrieves the profile of the currently authenticated user.
 */
export async function GET() {
  try {
    const profile = await getProfileBySession();

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}