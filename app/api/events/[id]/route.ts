import { db } from '@/lib/db';
import { events, attendees, users } from '@/lib/schema';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const eventId = parseInt(id);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const [event] = await db
      .select({
        id: events.id,
        title: events.title,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        locationUrl: events.locationUrl,
        description: events.description,
        hostId: events.hostId,
        type: events.type,
        createdAt: events.createdAt,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get host info
    const [host] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, event.hostId))
      .limit(1);

    // Get attendees
    const eventAttendees = await db
      .select({
        id: attendees.id,
        userId: attendees.userId,
        status: attendees.status,
        userName: users.name,
        userEmail: users.email,
      })
      .from(attendees)
      .innerJoin(users, eq(attendees.userId, users.id))
      .where(eq(attendees.eventId, eventId));

    return NextResponse.json({
      ...event,
      host,
      attendees: eventAttendees,
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

