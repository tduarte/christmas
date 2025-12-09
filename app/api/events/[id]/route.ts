import { db } from '@/lib/db';
import { events, attendees, users } from '@/lib/schema';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';

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
        avatarUrl: users.avatarUrl,
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
        userAvatarUrl: users.avatarUrl,
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
    const { title, startTime, endTime, location, locationUrl, description, type, organizerId, regenerateImage, hostId } = body;

    if (!title || !startTime || !location || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current image URL first
    const [currentEvent] = await db
      .select({ imageUrl: events.imageUrl })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    // Validate host if provided
    let nextHostId = existingEvent.hostId;
    if (hostId) {
      const parsedHost = parseInt(hostId, 10);
      if (!isNaN(parsedHost)) {
        const [hostUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, parsedHost)).limit(1);
        if (hostUser) {
          nextHostId = parsedHost;
        }
      }
    }

    // Save event immediately (keep old image or set to null if regenerating)
    const updateData: any = {
      title,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      location,
      locationUrl: locationUrl || null,
      description: description || null,
      organizerId: organizerId || session.userId,
      type: type as 'dinner' | 'outing',
      hostId: nextHostId,
    };

    // If regenerating, set imageUrl to null to trigger loading state
    if (regenerateImage) {
      updateData.imageUrl = null;
    }

    const [updatedEvent] = await db.update(events).set(updateData).where(eq(events.id, eventId)).returning();

    // Ensure host is an attendee
    const [existingHostAttendee] = await db
      .select({ id: attendees.id })
      .from(attendees)
      .where(and(eq(attendees.eventId, eventId), eq(attendees.userId, nextHostId)))
      .limit(1);
    if (!existingHostAttendee) {
      await db.insert(attendees).values({
        eventId,
        userId: nextHostId,
        status: 'confirmed',
      });
    }

    // Return immediately so UI doesn't wait
    const response = NextResponse.json({ success: true, event: updatedEvent });

    // Generate image in background if requested (after response is sent)
    if (regenerateImage && process.env.OPENAI_API_KEY) {
      // Note: This will still block in Next.js API routes, but we return the response first
      // For true async, you'd need a job queue. This is a compromise.
      (async () => {
        try {
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });

          const eventTypeText = type === 'dinner' ? 'a cozy family dinner' : 'a festive outing';
          
          // Step 1: Generate a creative prompt using GPT-5 Nano
          const promptGenerationResponse = await openai.chat.completions.create({
            model: "gpt-5-nano",
            messages: [
              {
                role: "system",
                content: "You are a creative assistant helping to generate detailed prompts for image generation. The style should be 'Japanese Anime Style'. The image should be holiday themed. No text, multiple panels, or split screens."
              },
              {
                role: "user",
                content: `Generate a DALL-E 3 prompt for a Christmas event image with the following details:
                Title: ${title}
                Type: ${eventTypeText}
                Location: ${location}
                ${description ? `Description: ${description}` : ''}
                
                The style must be Japanese Anime art style. Make it atmospheric, detailed, and strongly emphasize the Christmas vibe. Ensure it is a single cohesive illustration, not a manga page.`
              }
            ],
            max_completion_tokens: 200,
          });

          const generatedPrompt = promptGenerationResponse.choices[0].message.content || `A Christmas-themed illustration for ${eventTypeText} titled "${title}" at ${location} in Japanese Anime style.`;
          console.log('Regenerated DALL-E Prompt:', generatedPrompt);

          // Step 2: Generate image using the generated prompt
          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: generatedPrompt,
            n: 1,
            size: "1024x1024",
          });
          const temporaryImageUrl = imageResponse.data?.[0]?.url || null;
          console.log('Regenerated temporary image URL:', temporaryImageUrl);

          // Download and upload to Supabase Storage
          if (temporaryImageUrl) {
            try {
              // Download the image from OpenAI
              const imageDownloadResponse = await fetch(temporaryImageUrl);
              const imageBuffer = await imageDownloadResponse.arrayBuffer();
              
              // Generate a unique filename
              const fileName = `event-${eventId}-${Date.now()}.png`;
              
              // Upload to Supabase Storage
              const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('event-images')
                .upload(fileName, imageBuffer, {
                  contentType: 'image/png',
                  upsert: false,
                });

              if (uploadError) {
                console.error('Error uploading to Supabase:', uploadError);
                throw uploadError;
              }

              // Get the public URL
              const { data: publicUrlData } = supabaseAdmin.storage
                .from('event-images')
                .getPublicUrl(fileName);

              const permanentImageUrl = publicUrlData.publicUrl;
              console.log('Uploaded regenerated image to Supabase:', permanentImageUrl);

              // Update event with permanent Supabase URL
              await db
                .update(events)
                .set({ imageUrl: permanentImageUrl })
                .where(eq(events.id, eventId));
            } catch (uploadError) {
              console.error('Error uploading regenerated image to Supabase:', uploadError);
              // Fallback to temporary URL if upload fails
              await db
                .update(events)
                .set({ imageUrl: temporaryImageUrl })
                .where(eq(events.id, eventId));
            }
          }
        } catch (aiError) {
          console.error('Error regenerating image:', aiError);
        }
      })();
    }

    return response;
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
