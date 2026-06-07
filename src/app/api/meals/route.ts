import { NextResponse } from 'next/server';
import { getFirebaseAdminDb, getProfileBySession } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const campusId = url.searchParams.get('campusId');

  try {
    const profile = await getProfileBySession(await cookies());
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const snapshot = await db.collection('meals').get();
    const meals = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((meal: any) => {
        if (date && meal.date !== date) return false;
        if (campusId && meal.campusId !== campusId && meal.institutionId !== campusId) return false;
        return true;
      });
    const stats = meals.reduce(
      (acc: any, meal: any) => ({
        totalOrdered: acc.totalOrdered + Number(meal.estimated || meal.totalOrdered || 0),
        prepared: acc.prepared + Number(meal.prepared || 0),
        served: acc.served + Number(meal.served || 0),
        remaining: acc.remaining + Math.max(0, Number(meal.prepared || 0) - Number(meal.served || 0)),
      }),
      { totalOrdered: 0, prepared: 0, served: 0, remaining: 0 }
    );

    return NextResponse.json({ meals, stats });
  } catch (error) {
    console.error('Meals fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, mealType, preference } = body;

    const profile = await getProfileBySession(await cookies());
    if (!profile || profile.role !== 'kitchen_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!studentId || !mealType) {
      return NextResponse.json({ error: 'Student and meal type are required.' }, { status: 400 });
    }

    const db = await getFirebaseAdminDb();
    if (!db) return NextResponse.json({ error: 'Firebase Admin is not configured.' }, { status: 500 });

    const mealId = `meal-${Date.now()}`;
    const mealRecord = {
      id: mealId,
      studentId,
      mealType,
      preference: preference || 'no_meal',
      servedBy: profile.id,
      institutionId: profile.institutionId || 'accra-main-campus',
      servedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await db.collection('mealService').doc(mealId).set(mealRecord);

    return NextResponse.json({
      success: true,
      mealId,
      timestamp: mealRecord.servedAt,
    });
  } catch (error) {
    console.error('Meal recording error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
