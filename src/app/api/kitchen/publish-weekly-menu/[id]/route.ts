import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFirebaseAdminDb, getProfileBySession } from '@/lib/firebase/admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile || profile.role !== 'kitchen_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { publishTo } = (await request.json().catch(() => ({}))) as {
      publishTo?: string[];
    };

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const resolvedParams = await params;
    const menuId = resolvedParams.id;

    const menuRef = db.collection('weeklyMenus').doc(menuId);

    const menuDoc = await menuRef.get();
    if (!menuDoc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const menu = menuDoc.data() as any;
    const weekLabel = menu?.weekLabel;
    const items = menu?.items;

    if (!weekLabel || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid menu payload' }, { status: 400 });
    }

    // Store a single "published" view used by other dashboards.
    const publishedRef = db.collection('publishedWeeklyMenus').doc(weekLabel);
    await publishedRef.set(
      {
        weekLabel,
        items,
        status: 'published',
        updatedAt: new Date().toISOString(),
        updatedBy: profile.id,
      },
      { merge: true }
    );

    // Store audit-ish publish record.
    if (Array.isArray(publishTo) && publishTo.length > 0) {
      await db.collection('menuPublishes').add({
        menuId,
        weekLabel,
        itemsCount: items.length,
        publishedTo: publishTo,
        publishedAt: new Date().toISOString(),
        publishedBy: profile.id,
      });
    }

    // Create notification entries for role dashboards.
    // Your UI currently reads from `notifications` via `useNotifications()`.
    if (Array.isArray(publishTo) && publishTo.length > 0) {
      const nowIso = new Date().toISOString();
      const rolesToNotify = publishTo.filter(Boolean);

      await Promise.all(
        rolesToNotify.map((role) =>
          db.collection('notifications').add({
            title: 'Weekly menu published',
            body: `Week: ${weekLabel}. You can now view today's service menu.`,
            type: 'meal',
            time: nowIso,
            read: false,
            audienceRole: role,
            weekLabel,
            createdAt: nowIso,
          })
        )
      );
    }

    // Also mark original menu as published.
    await menuRef.set(
      { status: 'published', updatedAt: new Date().toISOString(), updatedBy: profile.id },
      { merge: true }
    );


    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('publish-weekly-menu error:', error);

    const message = error instanceof Error ? error.message : String(error);
    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: isDev ? message : undefined,
        debug: isDev
          ? {
              id: (await params).id,
            }
          : undefined,
      },
      { status: 500 }
    );
  }
}



