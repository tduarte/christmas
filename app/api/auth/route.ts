import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { createSession, setSessionCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, pin, name } = body;

    if (!email || !pin) {
      return NextResponse.json({ error: 'Email and PIN are required' }, { status: 400 });
    }

    // Validate PIN is 4 digits
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      // Login
      if (existingUser[0].pin !== pin) {
        return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
      }

      const session = await createSession({
        userId: existingUser[0].id,
        email: existingUser[0].email,
        name: existingUser[0].name,
      });

      await setSessionCookie(session);

      return NextResponse.json({ success: true, user: { id: existingUser[0].id, email: existingUser[0].email, name: existingUser[0].name } });
    } else {
      // Register
      if (!name) {
        return NextResponse.json({ error: 'Name is required for registration' }, { status: 400 });
      }

      const [newUser] = await db.insert(users).values({
        email,
        pin,
        name,
      }).returning();

      const session = await createSession({
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
      });

      await setSessionCookie(session);

      return NextResponse.json({ success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

