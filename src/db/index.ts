import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';

const sqlite = SQLite.openDatabaseSync('ruff.db');

export const db = drizzle(sqlite, { schema });

// Export schema for convenience
export { schema };
export * from './schema';
export * from './schema/types';
