import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Vercel + Supabase integration typically provides POSTGRES_URL
// We prefer POSTGRES_URL, then DATABASE_URL, and fallback to local dev
const connectionString = 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL || 
  'postgres://localhost:5432/postgres';

if (!connectionString.startsWith('postgres') && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  Database connection string is missing or invalid in production');
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
