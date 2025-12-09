import { db } from '@/lib/db';
import { gifts, users } from '@/lib/schema';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

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
        turnOrder: gifts.turnOrder,
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

    // Always create a new gift (allow multiple gifts per user)
    const [newGift] = await db
      .insert(gifts)
      .values({
        userId: session.userId,
        name,
        description: description || null,
      })
      .returning();

    return NextResponse.json({ success: true, gift: newGift });
  } catch (error) {
    console.error('Error creating gift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { giftId } = body;

    if (!giftId) {
      return NextResponse.json({ error: 'Gift ID is required' }, { status: 400 });
    }

    // Delete specific gift (verify ownership)
    await db
      .delete(gifts)
      .where(and(eq(gifts.id, giftId), eq(gifts.userId, session.userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

