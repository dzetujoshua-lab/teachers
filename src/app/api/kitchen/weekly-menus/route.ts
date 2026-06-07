import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFirebaseAdminDb, getProfileBySession } from '@/lib/firebase/admin';

type WeeklyMenuItem = {
  id?: string;
  meal: string;
  preference: string;
  estimated: number;
  prepared?: number;
  served?: number;
  name?: string;
};

type WeeklyMenuDoc = {
  id?: string;
  weekLabel: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  status?: 'draft' | 'published';
  items: WeeklyMenuItem[];
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const weekLabel = url.searchParams.get('weekLabel');

  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    let query: FirebaseFirestore.Query = db.collection('weeklyMenus');
    if (weekLabel) query = query.where('weekLabel', '==', weekLabel);

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const rows: WeeklyMenuDoc[] = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as WeeklyMenuDoc) }));


    return NextResponse.json({ rows });
  } catch (error) {
    console.error('weekly-menus GET error:', error);

    const message = error instanceof Error ? error.message : String(error);
    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json(
      { error: 'Internal server error', details: isDev ? message : undefined },
      { status: 500 }
    );
  }
}




export async function POST(request: Request) {

  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile || profile.role !== 'kitchen_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as { weekLabel?: string; items?: WeeklyMenuItem[] };

    const weekLabel = body.weekLabel?.trim();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!weekLabel) return NextResponse.json({ error: 'weekLabel is required' }, { status: 400 });
    if (items.length === 0) return NextResponse.json({ error: 'items is required' }, { status: 400 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const now = new Date().toISOString();
    const docRef = db.collection('weeklyMenus').doc();

    const normalizedItems = items.map((it) => ({
      meal: String(it.meal || '').trim(),
      preference: String(it.preference || '').trim(),
      estimated: Number(it.estimated || 0),
      prepared: Number(it.prepared || 0),
      served: Number(it.served || 0),
      name: it.name ? String(it.name) : undefined,
      id: it.id,
    }));

    const doc: WeeklyMenuDoc = {
      weekLabel,
      items: normalizedItems,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      createdBy: profile.id,
      updatedBy: profile.id,
    };

    await docRef.set(doc);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('weekly-menus POST error:', error);

    const message = error instanceof Error ? error.message : String(error);
    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json(
      { error: 'Internal server error', details: isDev ? message : undefined },
      { status: 500 }
    );
  }
}


