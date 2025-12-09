import { db } from '@/lib/db';
import { gifts } from '@/lib/schema';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch all gifts
    const allGifts = await db.select().from(gifts);

    if (allGifts.length === 0) {
      return NextResponse.json({ message: 'No gifts to shuffle' });
    }

    // 2. Generate numbers 1 to N
    const numbers = Array.from({ length: allGifts.length }, (_, i) => i + 1);

    // 3. Shuffle numbers (Fisher-Yates shuffle)
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // 4. Assign numbers to gifts
    // We'll update them one by one or in a transaction
    await db.transaction(async (tx) => {
      for (let i = 0; i < allGifts.length; i++) {
        await tx
          .update(gifts)
          .set({ turnOrder: numbers[i] })
          .where(eq(gifts.id, allGifts[i].id));
      }
    });

    return NextResponse.json({ success: true, count: allGifts.length });
  } catch (error) {
    console.error('Error shuffling gifts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

