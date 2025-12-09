import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const fileName = `avatars/${session.userId}-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('static-assets')
      .upload(fileName, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('static-assets').getPublicUrl(fileName);
    const avatarUrl = publicUrlData.publicUrl;

    await db.update(users).set({ avatarUrl }).where(eq(users.id, session.userId));

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error('Avatar upload exception:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}
