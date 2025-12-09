import { db } from '@/lib/db';
import { events } from '@/lib/schema';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db
      .select()
      .from(events)
      .where(eq(events.type, 'dinner'))
      .orderBy(desc(events.startTime));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dinners:', error);
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
    const { title, startTime, endTime, location, locationUrl, description } = body;
    
    if (!title || !startTime || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newDinner] = await db.insert(events).values({
      title,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      location,
      locationUrl: locationUrl || null,
      description: description || null,
      hostId: session.userId,
      type: 'dinner',
    }).returning();

    return NextResponse.json({ success: true, dinner: newDinner });
  } catch (error) {
    console.error('Error adding dinner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
