import { db } from '@/lib/db';
import { gifts, users } from '@/lib/schema';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const giftList = await db
      .select({
        id: gifts.id,
        userId: gifts.userId,
        name: gifts.name,
        description: gifts.description,
        userName: users.name,
        userEmail: users.email,
        createdAt: gifts.createdAt,
        updatedAt: gifts.updatedAt,
      })
      .from(gifts)
      .innerJoin(users, eq(gifts.userId, users.id));

    return NextResponse.json(giftList);
  } catch (error) {
    console.error('Error fetching gifts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Gift name is required' }, { status: 400 });
    }

    // Check if user already has a gift
    const existing = await db
      .select()
      .from(gifts)
      .where(eq(gifts.userId, session.userId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      const [updated] = await db
        .update(gifts)
        .set({
          name,
          description: description || null,
          updatedAt: new Date(),
        })
        .where(eq(gifts.id, existing[0].id))
        .returning();

      return NextResponse.json({ success: true, gift: updated });
    } else {
      // Create new
      const [newGift] = await db
        .insert(gifts)
        .values({
          userId: session.userId,
          name,
          description: description || null,
        })
        .returning();

      return NextResponse.json({ success: true, gift: newGift });
    }
  } catch (error) {
    console.error('Error creating/updating gift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user's gift (opting out)
    await db
      .delete(gifts)
      .where(eq(gifts.userId, session.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

