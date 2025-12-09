import { db } from '@/lib/db';
import { events, attendees } from '@/lib/schema';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '2024-12-20';
    const endDate = searchParams.get('endDate') || '2024-12-28';

    const eventList = await db
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
      .where(
        and(
          gte(events.startTime, new Date(startDate)),
          lte(events.startTime, new Date(endDate + 'T23:59:59'))
        )
      );

    // Get attendee counts for each event
    const eventIds = eventList.map(e => e.id);
    const attendeeCounts = await db
      .select({
        eventId: attendees.eventId,
        count: attendees.id,
      })
      .from(attendees)
      .where(eq(attendees.status, 'confirmed'));

    const countsMap = new Map<number, number>();
    attendeeCounts.forEach(a => {
      countsMap.set(a.eventId, (countsMap.get(a.eventId) || 0) + 1);
    });

    const eventsWithCounts = eventList.map(event => ({
      ...event,
      confirmedCount: countsMap.get(event.id) || 0,
    }));

    return NextResponse.json(eventsWithCounts);
  } catch (error) {
    console.error('Error fetching events:', error);
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
    const { title, startTime, endTime, location, locationUrl, description, type } = body;

    if (!title || !startTime || !location || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newEvent] = await db.insert(events).values({
      title,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      location,
      locationUrl: locationUrl || null,
      description: description || null,
      hostId: session.userId,
      type: type as 'dinner' | 'outing',
    }).returning();

    // Auto-add host as confirmed attendee
    await db.insert(attendees).values({
      eventId: newEvent.id,
      userId: session.userId,
      status: 'confirmed',
    });

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

