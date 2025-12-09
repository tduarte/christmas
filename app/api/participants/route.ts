import { db } from '@/lib/db';
import { participants } from '@/lib/schema';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is participating
    const participant = await db
      .select()
      .from(participants)
      .where(eq(participants.userId, session.userId))
      .limit(1);

    return NextResponse.json({ isParticipating: participant.length > 0 });
  } catch (error) {
    console.error('Error checking participation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add user as participant (ignore if already exists due to unique constraint)
    try {
      const [newParticipant] = await db
        .insert(participants)
        .values({
          userId: session.userId,
        })
        .returning();

      return NextResponse.json({ success: true, participant: newParticipant });
    } catch (error: any) {
      // If unique constraint violation, user is already participating
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Already participating' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove user from participants
    await db
      .delete(participants)
      .where(eq(participants.userId, session.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing participant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
