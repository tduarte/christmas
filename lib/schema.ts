import { pgTable, serial, text, date, timestamp } from 'drizzle-orm/pg-core';

export const dinners = pgTable('dinners', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  host: text('host').notNull(),
  dish: text('dish').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const whiteElephant = pgTable('white_elephant', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  spouse: text('spouse'), // To avoid matching them
  drawnName: text('drawn_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

