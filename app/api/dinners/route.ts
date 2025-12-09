import { db } from '@/lib/db';
import { dinners } from '@/lib/schema';
import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db.select().from(dinners).orderBy(desc(dinners.date));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dinners:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    await db.insert(dinners).values({
      date: body.date,
      host: body.host,
      dish: body.dish
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding dinner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
