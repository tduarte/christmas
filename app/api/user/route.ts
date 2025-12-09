import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      themePreference: users.themePreference,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return NextResponse.json({
    id: user?.id ?? session.userId,
    email: user?.email ?? session.email,
    name: user?.name ?? session.name,
    themePreference: user?.themePreference ?? 'system',
    avatarUrl: user?.avatarUrl ?? null,
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { themePreference, avatarUrl } = await request.json();
  const allowed = ['light', 'dark', 'system'];
  if (themePreference && !allowed.includes(themePreference)) {
    return NextResponse.json({ error: 'Invalid theme preference' }, { status: 400 });
  }

  await db
    .update(users)
    .set({
      ...(themePreference ? { themePreference } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    })
    .where(eq(users.id, session.userId));

  return NextResponse.json({ ok: true, themePreference, avatarUrl });
}
