import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const DATABASE_NAME = 'ruff.db';

// Migration SQL
const migrations = {
  '0000_init': `CREATE TABLE IF NOT EXISTS \`user\` (
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
CREATE INDEX IF NOT EXISTS \`idx_check_in_record_calendar_entry_id\` ON \`check_in_record\`(\`calendar_entry_id\`);`,
};

// Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Get current timestamp
function now(): string {
  return new Date().toISOString();
}

async function seed() {
  console.log('Starting database seed...');

  // Open database
  const sqlite = SQLite.openDatabaseSync(DATABASE_NAME);
  console.log(`Opened database: ${DATABASE_NAME}`);

  // Run migrations manually using raw SQL
  console.log('Running migrations...');
  for (const migration of Object.values(migrations)) {
    sqlite.exec(migration);
  }
  console.log('Migrations completed');

  // Create drizzle instance
  const db = drizzle(sqlite, { schema });

  // ============================================================================
  // Seed User
  // ============================================================================
  console.log('\nSeeding user...');
  await db.insert(schema.user).values({
    id: 'local',
    runningGoalDistance: '5k',
    runningGoalTime: 20 * 60, // 20 minutes in seconds
    vdot: 49.5,
    updatedAt: now(),
  }).onConflictDoNothing();
  console.log('User seeded');

  // ============================================================================
  // Seed Plan
  // ============================================================================
  console.log('\nSeeding plan...');
  const planId = generateId();
  await db.insert(schema.plan).values({
    id: planId,
    name: '5K 训练计划',
    targetDistance: '5k',
    targetTime: 20 * 60,
    vdot: 49.5,
    paceE: 386, // ~6:26 min/km
    paceM: 340, // ~5:40 min/km
    paceT: 313, // ~5:13 min/km
    paceI: 286, // ~4:46 min/km
    paceR: 259, // ~4:19 min/km
    weeks: 8,
    desc: '8周5K训练计划，适合初学者',
    createdAt: now(),
    updatedAt: now(),
  });
  console.log(`Plan created: ${planId}`);

  // ============================================================================
  // Seed WeeklyPlan and DailyPlan
  // ============================================================================
  console.log('\nSeeding weekly and daily plans...');
  const weeklyPlanIds: string[] = [];

  for (let week = 1; week <= 8; week++) {
    const weeklyPlanId = generateId();
    weeklyPlanIds.push(weeklyPlanId);

    await db.insert(schema.weeklyPlan).values({
      id: weeklyPlanId,
      planId: planId,
      weekIndex: week,
      desc: `第${week}周`,
    });

    // Create 7 daily plans for each week
    for (let day = 1; day <= 7; day++) {
      const dailyPlanId = generateId();

      await db.insert(schema.dailyPlan).values({
        id: dailyPlanId,
        weeklyPlanId,
        dayIndex: day,
        desc: `第${week}周 第${day}天`,
      });

      // ============================================================================
      // Seed Units for each daily plan
      // ============================================================================
      // 周一: E跑 + 休息
      if (day === 1) {
        await db.insert(schema.unit).values({
          id: generateId(),
          dailyPlanId,
          type: 'run',
          orderIndex: 1,
          paceMode: 'vdot',
          paceValue: 'E',
          standardType: 'distance',
          standardValue: 5000, // 5km
        });
        await db.insert(schema.unit).values({
          id: generateId(),
          dailyPlanId,
          type: 'rest',
          orderIndex: 2,
          standard: 'time',
          standardValue: 0,
        });
      }
      // 周二: 休息
      else if (day === 2) {
        await db.insert(schema.unit).values({
          id: generateId(),
          dailyPlanId,
          type: 'rest',
          orderIndex: 1,
          standard: 'time',
          standardValue: 0,
        });
      }
      // 周三: T跑
      else if (day === 3) {
        await db.insert(schema.unit).values({
          id: generateId(),
          dailyPlanId,
          type: 'run',
          orderIndex: 1,
          paceMode: 'vdot',
          paceValue: 'T',
          standardType: 'time',
          standardValue: 30 * 60, // 30 minutes
        });
      }
      // 周四: 休息
      else if (day === 4) {
        await db.insert(schema.unit).values({
          id: generateId(),
          dailyPlanId,
          type: 'rest',
          orderIndex: 1,
          standard: 'time',
          standardValue: 0,
        });
      }
      // 周五: E跑
      else if (day === 5) {
        await db.insert(schema.unit).values({
          id: generateId(),
          dailyPlanId,
          type: 'run',
          orderIndex: 1,
          paceMode: 'vdot',
          paceValue: 'E',
          standardType: 'distance',
          standardValue: 3000, // 3km
        });
      }
      // 周六: 力量训练
      else if (day === 6) {
        await db.insert(schema.unit).values({
          id: generateId(),
          dailyPlanId,
          type: 'other',
          orderIndex: 1,
          content: '核心力量训练 30分钟',
        });
      }
      // 周日: 长距离E跑
      else {
        await db.insert(schema.unit).values({
          id: generateId(),
          dailyPlanId,
          type: 'run',
          orderIndex: 1,
          paceMode: 'vdot',
          paceValue: 'E',
          standardType: 'distance',
          standardValue: 8000, // 8km
        });
      }
    }
  }
  console.log('Weekly and daily plans seeded');

  // ============================================================================
  // Seed Calendar (activate the plan for this week)
  // ============================================================================
  console.log('\nSeeding calendar...');
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() + mondayOffset);
  const mondayStr = thisMonday.toISOString().split('T')[0];

  // Get all daily plans for week 1
  const week1DailyPlans = await db.query.dailyPlan.findMany({
    where: (dp, { eq }) => eq(dp.weeklyPlanId, weeklyPlanIds[0]),
  });

  for (const dp of week1DailyPlans) {
    const date = new Date(thisMonday);
    date.setDate(thisMonday.getDate() + dp.dayIndex - 1);
    const dateStr = date.toISOString().split('T')[0];

    await db.insert(schema.userPlanCalendar).values({
      id: generateId(),
      planId: planId,
      date: dateStr,
      dailyPlanId: dp.id,
      status: dateStr < mondayStr ? 'completed' : 'pending',
    });
  }
  console.log('Calendar seeded');

  // ============================================================================
  // Seed some check-in records
  // ============================================================================
  console.log('\nSeeding check-in records...');

  // Check-in for yesterday
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  await db.insert(schema.checkInRecord).values({
    id: generateId(),
    calendarEntryId: null, // custom check-in
    date: yesterdayStr,
    type: 'run',
    distance: 5.2,
    duration: 28 * 60, // 28 minutes
    pace: 323, // ~5:23 min/km
    feeling: 'easy',
    createdAt: now(),
  });

  await db.insert(schema.checkInDailyOverview).values({
    id: generateId(),
    date: yesterdayStr,
    hasCheckIn: true,
  }).onConflictDoNothing();

  // Check-in for today
  const todayStr = today.toISOString().split('T')[0];
  await db.insert(schema.checkInDailyOverview).values({
    id: generateId(),
    date: todayStr,
    hasCheckIn: false, // today hasn't checked in yet
  }).onConflictDoNothing();

  console.log('Check-in records seeded');

  // ============================================================================
  // Verify data
  // ============================================================================
  console.log('\n=== Verification ===');

  const userData = await db.query.user.findFirst();
  console.log('User:', userData);

  const plans = await db.query.plan.findMany();
  console.log('Plans count:', plans.length);

  const weeklyPlans = await db.query.weeklyPlan.findMany();
  console.log('Weekly plans count:', weeklyPlans.length);

  const dailyPlans = await db.query.dailyPlan.findMany();
  console.log('Daily plans count:', dailyPlans.length);

  const units = await db.query.unit.findMany();
  console.log('Units count:', units.length);

  const calendarEntries = await db.query.userPlanCalendar.findMany();
  console.log('Calendar entries count:', calendarEntries.length);

  const checkInRecords = await db.query.checkInRecord.findMany();
  console.log('Check-in records count:', checkInRecords.length);

  const dailyOverviews = await db.query.checkInDailyOverview.findMany();
  console.log('Daily overviews count:', dailyOverviews.length);

  console.log('\n✅ Database seed completed successfully!');
  console.log(`Database file: ${DATABASE_NAME}`);
}

seed().catch(console.error);
