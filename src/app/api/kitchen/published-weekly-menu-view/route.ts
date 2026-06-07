import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFirebaseAdminDb, getProfileBySession } from '@/lib/firebase/admin';

// Returns the latest published weekly menu plus the weekLabel.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const weekLabel = url.searchParams.get('weekLabel');

    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const query = db.collection('publishedWeeklyMenus');

    if (weekLabel) {
      const doc = await query.doc(weekLabel).get();
      if (!doc.exists) return NextResponse.json({ items: [], id: weekLabel });
      return NextResponse.json({ id: doc.id, ...(doc.data() as any) });
    }

    const snapshot = await query.orderBy('updatedAt', 'desc').limit(1).get();
    if (snapshot.empty) return NextResponse.json({ items: [] });

    const doc = snapshot.docs[0];
    return NextResponse.json({ id: doc.id, ...(doc.data() as any) });
  } catch (error) {
    console.error('published-weekly-menu-view GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

