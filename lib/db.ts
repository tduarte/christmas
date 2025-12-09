import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/postgres';

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  DATABASE_URL is missing in production environment');
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
