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

// (Currently unused by PATCH, kept for future normalization)
const normalizeMenuItem = (it: any): WeeklyMenuItem => ({
  id: it?.id,
  meal: String(it?.meal || '').trim(),
  preference: String(it?.preference || '').trim(),
  estimated: Number(it?.estimated || 0),
  prepared: Number(it?.prepared || 0),
  served: Number(it?.served || 0),
  name: it?.name ? String(it.name).trim() : undefined,
});




type WeeklyMenuDoc = {
  weekLabel: string;
  items: WeeklyMenuItem[];
  status?: 'draft' | 'published';
  updatedAt?: string;
  updatedBy?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile || profile.role !== 'kitchen_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as {
      weekLabel?: string;
      items?: WeeklyMenuItem[];
    };

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const resolvedParams = await params;
    const docRef = db.collection('weeklyMenus').doc(resolvedParams.id);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const current = doc.data() as any;
    if (current?.status === 'published') {
      // allow editing published by creating a draft update; for now block.
      return NextResponse.json({ error: 'Published menu is locked. Create a new draft to update.' }, { status: 400 });
    }

    const next: WeeklyMenuDoc = {
      weekLabel: (body.weekLabel ?? current.weekLabel ?? '').trim(),
      items: Array.isArray(body.items) ? body.items : current.items ?? [],
      status: current.status ?? 'draft',
      updatedAt: new Date().toISOString(),
      updatedBy: profile.id,
    };

    if (!next.weekLabel) return NextResponse.json({ error: 'weekLabel is required' }, { status: 400 });
    if (!next.items || next.items.length === 0) return NextResponse.json({ error: 'items is required' }, { status: 400 });

    await docRef.set(next, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('weekly-menus PATCH error:', error);

    const message = error instanceof Error ? error.message : String(error);
    const isDev = process.env.NODE_ENV !== 'production';
    const resolvedParams = await params;

    return NextResponse.json(
      { error: 'Internal server error', details: isDev ? message : undefined, debug: isDev ? { id: resolvedParams.id } : undefined },
      { status: 500 }
    );
  }
}


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const resolvedParams = await params;
    const doc = await db.collection('weeklyMenus').doc(resolvedParams.id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ id: doc.id, ...(doc.data() as any) });
  } catch (error) {
    console.error('weekly-menus GET(id) error:', error);

    const message = error instanceof Error ? error.message : String(error);
    const isDev = process.env.NODE_ENV !== 'production';
    const resolvedParams = await params;

    return NextResponse.json(
      { error: 'Internal server error', details: isDev ? message : undefined, debug: isDev ? { id: resolvedParams.id } : undefined },
      { status: 500 }
    );
  }
}


