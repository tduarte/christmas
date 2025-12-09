import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  pin: text('pin').notNull(), // Stored as text per requirements
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const eventTypeEnum = pgEnum('event_type', ['dinner', 'outing']);

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  location: text('location').notNull(),
  locationUrl: text('location_url'),
  description: text('description'),
  hostId: integer('host_id').references(() => users.id).notNull(),
  type: eventTypeEnum('type').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const attendeeStatusEnum = pgEnum('attendee_status', ['confirmed', 'maybe', 'no']);

export const attendees = pgTable('attendees', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  status: attendeeStatusEnum('status').notNull().default('confirmed'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const gifts = pgTable('gifts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  hostedEvents: many(events),
  attendees: many(attendees),
  gifts: many(gifts),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  host: one(users, {
    fields: [events.hostId],
    references: [users.id],
  }),
  attendees: many(attendees),
}));

export const attendeesRelations = relations(attendees, ({ one }) => ({
  event: one(events, {
    fields: [attendees.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [attendees.userId],
    references: [users.id],
  }),
}));

export const giftsRelations = relations(gifts, ({ one }) => ({
  user: one(users, {
    fields: [gifts.userId],
    references: [users.id],
  }),
}));

