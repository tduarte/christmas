import { db } from '@/lib/db';
import { attendees } from '@/lib/schema';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, status } = body;

    if (!eventId || !status) {
      return NextResponse.json({ error: 'Event ID and status are required' }, { status: 400 });
    }

    // Check if attendee already exists
    const existing = await db
      .select()
      .from(attendees)
      .where(
        and(
          eq(attendees.eventId, eventId),
          eq(attendees.userId, session.userId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      const [updated] = await db
        .update(attendees)
        .set({ status: status as 'confirmed' | 'maybe' | 'no' })
        .where(eq(attendees.id, existing[0].id))
        .returning();

      return NextResponse.json({ success: true, attendee: updated });
    } else {
      // Create new
      const [newAttendee] = await db
        .insert(attendees)
        .values({
          eventId,
          userId: session.userId,
          status: status as 'confirmed' | 'maybe' | 'no',
        })
        .returning();

      return NextResponse.json({ success: true, attendee: newAttendee });
    }
  } catch (error) {
    console.error('Error updating attendee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

