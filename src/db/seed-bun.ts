/**
 * Seed script for Ruff database
 * Uses bun:sqlite for Bun runtime
 * Run with: bun run src/db/seed-bun.ts
 */

const DATABASE_NAME = 'ruff.db';

// Open database using bun:sqlite
const db = await Bun.file(DATABASE_NAME).exists()
  ? undefined
  : undefined;

// Use Bun.sqlite
const sqlite = new (require('bun:sqlite').Database)(DATABASE_NAME);

console.log(`Opened database: ${DATABASE_NAME}`);

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

  // Run migrations
  console.log('Creating tables...');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id text PRIMARY KEY DEFAULT 'local',
      running_goal_distance text,
      running_goal_time integer,
      vdot real,
      sleep_goal_bedtime text,
      sleep_goal_wake_time text,
      weight_goal real,
      updated_at text NOT NULL
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS plan (
      id text PRIMARY KEY,
      name text NOT NULL,
      target_distance text NOT NULL,
      target_time integer NOT NULL,
      vdot real NOT NULL,
      pace_e integer NOT NULL,
      pace_m integer NOT NULL,
      pace_t integer NOT NULL,
      pace_i integer NOT NULL,
      pace_r integer NOT NULL,
      weeks integer NOT NULL,
      desc text,
      created_at text NOT NULL,
      updated_at text NOT NULL,
      cloud_id text
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS weekly_plan (
      id text PRIMARY KEY,
      plan_id text NOT NULL REFERENCES plan(id),
      week_index integer NOT NULL,
      desc text
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS daily_plan (
      id text PRIMARY KEY,
      weekly_plan_id text NOT NULL REFERENCES weekly_plan(id),
      day_index integer NOT NULL,
      desc text
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS unit (
      id text PRIMARY KEY,
      daily_plan_id text NOT NULL REFERENCES daily_plan(id),
      type text NOT NULL,
      order_index integer NOT NULL,
      pace_mode text,
      pace_value text,
      standard_type text,
      standard_value integer,
      standard text,
      content text
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_plan_calendar (
      id text PRIMARY KEY,
      plan_id text NOT NULL REFERENCES plan(id),
      date text NOT NULL,
      daily_plan_id text NOT NULL REFERENCES daily_plan(id),
      status text NOT NULL DEFAULT 'pending'
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS check_in_record (
      id text PRIMARY KEY,
      calendar_entry_id text REFERENCES user_plan_calendar(id),
      date text NOT NULL,
      type text NOT NULL,
      distance real,
      duration integer,
      pace integer,
      feeling text,
      photos text,
      created_at text NOT NULL,
      synced_at text
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS check_in_daily_overview (
      id text PRIMARY KEY,
      date text NOT NULL UNIQUE,
      has_check_in integer NOT NULL DEFAULT 0
    )
  `);

  // Create indexes
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_weekly_plan_plan_id ON weekly_plan(plan_id)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_daily_plan_weekly_plan_id ON daily_plan(weekly_plan_id)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_unit_daily_plan_id ON unit(daily_plan_id)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_user_plan_calendar_plan_id ON user_plan_calendar(plan_id)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_user_plan_calendar_date ON user_plan_calendar(date)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_check_in_record_date ON check_in_record(date)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_check_in_record_calendar_entry_id ON check_in_record(calendar_entry_id)`);

  console.log('Tables created');

  // ============================================================================
  // Seed User
  // ============================================================================
  console.log('\nSeeding user...');

  const insertUser = sqlite.prepare(`
    INSERT OR IGNORE INTO user (id, running_goal_distance, running_goal_time, vdot, updated_at)
    VALUES ('local', '5k', 1200, 49.5, ?)
  `);
  insertUser.run(now());
  console.log('User seeded');

  // ============================================================================
  // Seed Plan
  // ============================================================================
  console.log('\nSeeding plan...');
  const planId = generateId();

  const insertPlan = sqlite.prepare(`
    INSERT INTO plan (id, name, target_distance, target_time, vdot, pace_e, pace_m, pace_t, pace_i, pace_r, weeks, desc, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPlan.run(planId, '5K 训练计划', '5k', 1200, 49.5, 386, 340, 313, 286, 259, 8, '8周5K训练计划', now(), now());
  console.log(`Plan created: ${planId}`);

  // ============================================================================
  // Seed WeeklyPlan and DailyPlan
  // ============================================================================
  console.log('\nSeeding weekly and daily plans...');
  const weeklyPlanIds: string[] = [];

  const insertWeeklyPlan = sqlite.prepare(`INSERT INTO weekly_plan (id, plan_id, week_index, desc) VALUES (?, ?, ?, ?)`);
  const insertDailyPlan = sqlite.prepare(`INSERT INTO daily_plan (id, weekly_plan_id, day_index, desc) VALUES (?, ?, ?, ?)`);
  const insertUnit = sqlite.prepare(`
    INSERT INTO unit (id, daily_plan_id, type, order_index, pace_mode, pace_value, standard_type, standard_value, standard, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let week = 1; week <= 8; week++) {
    const weeklyPlanId = generateId();
    weeklyPlanIds.push(weeklyPlanId);

    insertWeeklyPlan.run(weeklyPlanId, planId, week, `第${week}周`);

    for (let day = 1; day <= 7; day++) {
      const dailyPlanId = generateId();

      insertDailyPlan.run(dailyPlanId, weeklyPlanId, day, `第${week}周 第${day}天`);

      // Determine unit type based on day of week
      let type = 'run';
      let paceMode: string | null = null;
      let paceValue: string | null = null;
      let standardType: string | null = null;
      let standardValue: number | null = null;
      let standard: string | null = null;
      let content: string | null = null;
      const orderIndex = 1;

      if (day === 1) {
        // 周一: E跑
        paceMode = 'vdot';
        paceValue = 'E';
        standardType = 'distance';
        standardValue = 5000;
      } else if (day === 2) {
        // 周二: 休息
        type = 'rest';
        standard = 'time';
        standardValue = 0;
      } else if (day === 3) {
        // 周三: T跑
        paceMode = 'vdot';
        paceValue = 'T';
        standardType = 'time';
        standardValue = 30 * 60;
      } else if (day === 4) {
        // 周四: 休息
        type = 'rest';
        standard = 'time';
        standardValue = 0;
      } else if (day === 5) {
        // 周五: E跑
        paceMode = 'vdot';
        paceValue = 'E';
        standardType = 'distance';
        standardValue = 3000;
      } else if (day === 6) {
        // 周六: 力量
        type = 'other';
        content = '核心力量训练 30分钟';
      } else {
        // 周日: 长距离E跑
        paceMode = 'vdot';
        paceValue = 'E';
        standardType = 'distance';
        standardValue = 8000;
      }

      insertUnit.run(
        generateId(),
        dailyPlanId,
        type,
        orderIndex,
        paceMode,
        paceValue,
        standardType,
        standardValue,
        standard,
        content
      );
    }
  }
  console.log('Weekly and daily plans seeded');

  // ============================================================================
  // Seed Calendar
  // ============================================================================
  console.log('\nSeeding calendar...');
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() + mondayOffset);
  const mondayStr = thisMonday.toISOString().split('T')[0];

  const insertCalendar = sqlite.prepare(`
    INSERT INTO user_plan_calendar (id, plan_id, date, daily_plan_id, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Get week 1 daily plans
  const week1DailyPlans = sqlite.prepare('SELECT * FROM daily_plan WHERE weekly_plan_id = ?').all(weeklyPlanIds[0]);

  for (const dp of week1DailyPlans) {
    const dpObj = dp as any;
    const date = new Date(thisMonday);
    date.setDate(thisMonday.getDate() + dpObj.day_index - 1);
    const dateStr = date.toISOString().split('T')[0];
    const status = dateStr < mondayStr ? 'completed' : 'pending';

    insertCalendar.run(generateId(), planId, dateStr, dpObj.id, status);
  }
  console.log('Calendar seeded');

  // ============================================================================
  // Seed Check-in Records
  // ============================================================================
  console.log('\nSeeding check-in records...');

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const insertCheckIn = sqlite.prepare(`
    INSERT INTO check_in_record (id, calendar_entry_id, date, type, distance, duration, pace, feeling, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertCheckIn.run(generateId(), null, yesterdayStr, 'run', 5.2, 1680, 323, 'easy', now());

  const insertOverview = sqlite.prepare(`
    INSERT OR IGNORE INTO check_in_daily_overview (id, date, has_check_in)
    VALUES (?, ?, ?)
  `);
  insertOverview.run(generateId(), yesterdayStr, 1);

  const todayStr = today.toISOString().split('T')[0];
  insertOverview.run(generateId(), todayStr, 0);

  console.log('Check-in records seeded');

  // ============================================================================
  // Verification
  // ============================================================================
  console.log('\n=== Verification ===');

  const userData = sqlite.prepare('SELECT * FROM user WHERE id = ?').get('local');
  console.log('User:', userData);

  const plans = sqlite.prepare('SELECT * FROM plan').all();
  console.log('Plans count:', plans.length);

  const weeklyPlans = sqlite.prepare('SELECT * FROM weekly_plan').all();
  console.log('Weekly plans count:', weeklyPlans.length);

  const dailyPlans = sqlite.prepare('SELECT * FROM daily_plan').all();
  console.log('Daily plans count:', dailyPlans.length);

  const units = sqlite.prepare('SELECT * FROM unit').all();
  console.log('Units count:', units.length);

  const calendarEntries = sqlite.prepare('SELECT * FROM user_plan_calendar').all();
  console.log('Calendar entries count:', calendarEntries.length);

  const checkInRecords = sqlite.prepare('SELECT * FROM check_in_record').all();
  console.log('Check-in records count:', checkInRecords.length);

  const dailyOverviews = sqlite.prepare('SELECT * FROM check_in_daily_overview').all();
  console.log('Daily overviews count:', dailyOverviews.length);

  console.log('\n✅ Database seed completed successfully!');
  console.log(`Database file: ${DATABASE_NAME}`);

  // Close database
  sqlite.close();
}

seed().catch(console.error);
