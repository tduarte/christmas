import { db } from '@/lib/db';
import { events, attendees, users } from '@/lib/schema';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

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
        organizerId: events.organizerId,
        imageUrl: events.imageUrl,
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
    const eventId = parseInt(id);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    // Check if user is the host
    const [existingEvent] = await db
      .select({ hostId: events.hostId })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (existingEvent.hostId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden: Only the host can edit this event' }, { status: 403 });
    }

    const body = await req.json();
    const { title, startTime, endTime, location, locationUrl, description, type, organizerId } = body;

    if (!title || !startTime || !location || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let imageUrl = null;

    // Regenerate image with new data
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const eventTypeText = type === 'dinner' ? 'a cozy family dinner' : 'a festive outing';
        const prompt = `A festive and artistic Christmas-themed illustration for ${eventTypeText} titled "${title}" at ${location}. ${description ? `Additional context: ${description}.` : ''} Style: warm, inviting, holiday atmosphere with Christmas decorations and festive colors.`;
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        });
        imageUrl = response.data?.[0]?.url || null;
        console.log('Regenerated image URL:', imageUrl);
      } catch (aiError) {
        console.error('Error regenerating image:', aiError);
        // Continue without regenerating image if AI fails
      }
    } else {
      console.log('OPENAI_API_KEY not found, skipping image regeneration');
    }

    const [updatedEvent] = await db
      .update(events)
      .set({
        title,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        location,
        locationUrl: locationUrl || null,
        description: description || null,
        organizerId: organizerId || session.userId,
        imageUrl: imageUrl || null,
        type: type as 'dinner' | 'outing',
      })
      .where(eq(events.id, eventId))
      .returning();

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
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
    const eventId = parseInt(id);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    // Check if user is the host
    const [existingEvent] = await db
      .select({ hostId: events.hostId })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (existingEvent.hostId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden: Only the host can delete this event' }, { status: 403 });
    }

    // Delete attendees first (foreign key constraint)
    await db.delete(attendees).where(eq(attendees.eventId, eventId));

    // Delete the event
    await db.delete(events).where(eq(events.id, eventId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

