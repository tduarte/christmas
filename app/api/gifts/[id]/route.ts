import { db } from '@/lib/db';
import { gifts } from '@/lib/schema';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const giftId = parseInt(id);

    if (isNaN(giftId)) {
      return NextResponse.json({ error: 'Invalid gift ID' }, { status: 400 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Gift name is required' }, { status: 400 });
    }

    // Verify the gift belongs to the current user
    const existingGift = await db
      .select()
      .from(gifts)
      .where(and(eq(gifts.id, giftId), eq(gifts.userId, session.userId)))
      .limit(1);

    if (existingGift.length === 0) {
      return NextResponse.json({ error: 'Gift not found or unauthorized' }, { status: 404 });
    }

    // Update the gift
    const [updatedGift] = await db
      .update(gifts)
      .set({
        name,
        description: description || null,
        updatedAt: new Date(),
      })
      .where(eq(gifts.id, giftId))
      .returning();

    return NextResponse.json({ success: true, gift: updatedGift });
  } catch (error) {
    console.error('Error updating gift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const giftId = parseInt(id);

    if (isNaN(giftId)) {
      return NextResponse.json({ error: 'Invalid gift ID' }, { status: 400 });
    }

    // Verify the gift belongs to the current user before deleting
    const existingGift = await db
      .select()
      .from(gifts)
      .where(and(eq(gifts.id, giftId), eq(gifts.userId, session.userId)))
      .limit(1);

    if (existingGift.length === 0) {
      return NextResponse.json({ error: 'Gift not found or unauthorized' }, { status: 404 });
    }

    // Delete the gift
    await db.delete(gifts).where(eq(gifts.id, giftId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
