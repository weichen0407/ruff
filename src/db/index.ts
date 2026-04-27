/**
 * Database exports
 *
 * Use `db` for direct queries (lazy-loaded).
 * Call `getDatabase()` at app startup to run migrations.
 */

export { db, getDatabase, closeDatabase } from './database';

import * as schema from './schema';
export { schema };

export * from './schema';
export * from './schema/types';
