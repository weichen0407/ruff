import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate, useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from './schema';

const DATABASE_NAME = 'ruff.db';

// Migration SQL
const migrations = {
  '0000_init': `-- Migration: 0000_init
CREATE TABLE IF NOT EXISTS \`user\` (
  \`id\` text PRIMARY KEY DEFAULT 'local',
  \`running_goal_distance\` text,
  \`running_goal_time\` integer,
  \`vdot\` real,
  \`sleep_goal_bedtime\` text,
  \`sleep_goal_wake_time\` text,
  \`weight_goal\` real,
  \`updated_at\` text NOT NULL
);

CREATE TABLE IF NOT EXISTS \`plan\` (
  \`id\` text PRIMARY KEY,
  \`name\` text NOT NULL,
  \`target_distance\` text NOT NULL,
  \`target_time\` integer NOT NULL,
  \`vdot\` real NOT NULL,
  \`pace_e\` integer NOT NULL,
  \`pace_m\` integer NOT NULL,
  \`pace_t\` integer NOT NULL,
  \`pace_i\` integer NOT NULL,
  \`pace_r\` integer NOT NULL,
  \`weeks\` integer NOT NULL,
  \`desc\` text,
  \`created_at\` text NOT NULL,
  \`updated_at\` text NOT NULL,
  \`cloud_id\` text
);

CREATE TABLE IF NOT EXISTS \`weekly_plan\` (
  \`id\` text PRIMARY KEY,
  \`plan_id\` text NOT NULL REFERENCES \`plan\`(\`id\`),
  \`week_index\` integer NOT NULL,
  \`desc\` text
);

CREATE TABLE IF NOT EXISTS \`daily_plan\` (
  \`id\` text PRIMARY KEY,
  \`weekly_plan_id\` text NOT NULL REFERENCES \`weekly_plan\`(\`id\`),
  \`day_index\` integer NOT NULL,
  \`desc\` text
);

CREATE TABLE IF NOT EXISTS \`unit\` (
  \`id\` text PRIMARY KEY,
  \`daily_plan_id\` text NOT NULL REFERENCES \`daily_plan\`(\`id\`),
  \`type\` text NOT NULL,
  \`order_index\` integer NOT NULL,
  \`pace_mode\` text,
  \`pace_value\` text,
  \`standard_type\` text,
  \`standard_value\` integer,
  \`standard\` text,
  \`content\` text
);

CREATE TABLE IF NOT EXISTS \`user_plan_calendar\` (
  \`id\` text PRIMARY KEY,
  \`plan_id\` text NOT NULL REFERENCES \`plan\`(\`id\`),
  \`date\` text NOT NULL,
  \`daily_plan_id\` text NOT NULL REFERENCES \`daily_plan\`(\`id\`),
  \`status\` text NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS \`check_in_record\` (
  \`id\` text PRIMARY KEY,
  \`calendar_entry_id\` text REFERENCES \`user_plan_calendar\`(\`id\`),
  \`date\` text NOT NULL,
  \`type\` text NOT NULL,
  \`distance\` real,
  \`duration\` integer,
  \`pace\` integer,
  \`feeling\` text,
  \`photos\` text,
  \`created_at\` text NOT NULL,
  \`synced_at\` text
);

CREATE TABLE IF NOT EXISTS \`check_in_daily_overview\` (
  \`id\` text PRIMARY KEY,
  \`date\` text NOT NULL UNIQUE,
  \`has_check_in\` integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS \`idx_weekly_plan_plan_id\` ON \`weekly_plan\`(\`plan_id\`);
CREATE INDEX IF NOT EXISTS \`idx_daily_plan_weekly_plan_id\` ON \`daily_plan\`(\`weekly_plan_id\`);
CREATE INDEX IF NOT EXISTS \`idx_unit_daily_plan_id\` ON \`unit\`(\`daily_plan_id\`);
CREATE INDEX IF NOT EXISTS \`idx_user_plan_calendar_plan_id\` ON \`user_plan_calendar\`(\`plan_id\`);
CREATE INDEX IF NOT EXISTS \`idx_user_plan_calendar_date\` ON \`user_plan_calendar\`(\`date\`);
CREATE INDEX IF NOT EXISTS \`idx_check_in_record_date\` ON \`check_in_record\`(\`date\`);
CREATE INDEX IF NOT EXISTS \`idx_check_in_record_calendar_entry_id\` ON \`check_in_record\`(\`calendar_entry_id\`);
`,
};

const journal = {
  entries: [
    {
      idx: 0,
      version: '7' as const,
      when: 1745529600000,
      tag: '0000_init',
      breakpoints: true,
    },
  ],
};

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get or create the database instance
 * This should be called once at app startup
 */
export async function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const sqlite = SQLite.openDatabaseSync(DATABASE_NAME);
  dbInstance = drizzle(sqlite, { schema });

  // Run migrations on first open
  await runMigrations(dbInstance);

  return dbInstance;
}

/**
 * Run database migrations
 */
async function runMigrations(db: ReturnType<typeof drizzle<typeof schema>>) {
  // Use useMigrations for expo-sqlite
  const { success, error } = useMigrations(db, { journal, migrations });

  if (error) {
    console.error('Migration failed:', error);
    throw error;
  }

  if (success) {
    console.log('Database migrations applied successfully');
  }
}

/**
 * Close database connection
 * Should be called when app is shutting down
 */
export async function closeDatabase() {
  if (dbInstance) {
    // expo-sqlite doesn't require explicit close
    dbInstance = null;
  }
}

// Re-export db getter for use in other modules
export { getDatabase as db };
