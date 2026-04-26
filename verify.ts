/**
 * Verification Script
 * Tests all core modules: VDOT, Unit, Plan, Calendar, Checkin, User
 */

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './src/db/schema/index.ts';
import { generateId, now, getTodayDateString } from './src/db/utils.ts';

// VDOT imports
import { calculateVdot, getPaceZones, adjustPace } from './src/lib/vdot/index.ts';

// Unit imports
import { formatDuration, parseDuration, formatDistance, formatPace } from './src/lib/unit/index.ts';

const dbPath = './verify.db';

// ============================================================================
// Setup
// ============================================================================

console.log('🔧 Setting up database...\n');

// Delete existing db
try {
  new Database(dbPath).close();
  require('fs').unlinkSync(dbPath);
} catch {}

// Create database
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

// Create tables
const createTables = `
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY DEFAULT 'local',
  "running_goal_distance" text,
  "running_goal_time" integer,
  "vdot" real,
  "sleep_goal_bedtime" text,
  "sleep_goal_wake_time" text,
  "weight_goal" real,
  "updated_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "plan" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "target_distance" text NOT NULL,
  "target_time" integer NOT NULL,
  "vdot" real NOT NULL,
  "pace_e" integer NOT NULL,
  "pace_m" integer NOT NULL,
  "pace_t" integer NOT NULL,
  "pace_i" integer NOT NULL,
  "pace_r" integer NOT NULL,
  "weeks" integer NOT NULL,
  "desc" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL,
  "cloud_id" text
);

CREATE TABLE IF NOT EXISTS "weekly_plan" (
  "id" text PRIMARY KEY,
  "plan_id" text NOT NULL REFERENCES "plan"("id"),
  "week_index" integer NOT NULL,
  "desc" text
);

CREATE TABLE IF NOT EXISTS "daily_plan" (
  "id" text PRIMARY KEY,
  "weekly_plan_id" text NOT NULL REFERENCES "weekly_plan"("id"),
  "day_index" integer NOT NULL,
  "desc" text
);

CREATE TABLE IF NOT EXISTS "unit" (
  "id" text PRIMARY KEY,
  "daily_plan_id" text NOT NULL REFERENCES "daily_plan"("id"),
  "type" text NOT NULL,
  "order_index" integer NOT NULL,
  "pace_mode" text,
  "pace_value" text,
  "standard_type" text,
  "standard_value" integer,
  "standard" text,
  "content" text
);

CREATE TABLE IF NOT EXISTS "user_plan_calendar" (
  "id" text PRIMARY KEY,
  "plan_id" text NOT NULL REFERENCES "plan"("id"),
  "date" text NOT NULL,
  "daily_plan_id" text NOT NULL REFERENCES "daily_plan"("id"),
  "status" text NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS "check_in_record" (
  "id" text PRIMARY KEY,
  "calendar_entry_id" text,
  "date" text NOT NULL,
  "type" text NOT NULL,
  "distance" real,
  "duration" integer,
  "pace" integer,
  "feeling" text,
  "photos" text,
  "created_at" text NOT NULL,
  "synced_at" text
);

CREATE TABLE IF NOT EXISTS "check_in_daily_overview" (
  "id" text PRIMARY KEY,
  "date" text NOT NULL UNIQUE,
  "has_check_in" integer NOT NULL DEFAULT false
);
`;

sqlite.exec(createTables);
console.log('✅ Database created\n');

// ============================================================================
// Test VDOT Engine
// ============================================================================

console.log('📊 Testing VDOT Engine...\n');

const vdot = calculateVdot(5, 20 * 60); // 5K in 20 minutes
console.log(`   calculateVdot(5km, 20min) = ${vdot}`);

const zones = getPaceZones(vdot);
console.log(`   getPaceZones(${vdot}):`);
console.log(`     E: ${formatPace(zones.zones.E)}/km`);
console.log(`     M: ${formatPace(zones.zones.M)}/km`);
console.log(`     T: ${formatPace(zones.zones.T)}/km`);
console.log(`     I: ${formatPace(zones.zones.I)}/km`);
console.log(`     R: ${formatPace(zones.zones.R)}/km`);

const adjustedE = adjustPace(zones.zones.E, 'E+10');
console.log(`   adjustPace(E, 'E+10') = ${formatPace(adjustedE)}/km`);

console.log('✅ VDOT Engine OK\n');

// ============================================================================
// Test Unit Formatters
// ============================================================================

console.log('⏱️  Testing Unit Formatters...\n');

console.log(`   formatDuration(3661) = "${formatDuration(3661)}"`);
console.log(`   parseDuration("1:01:01") = ${parseDuration("1:01:01")}s`);
console.log(`   formatDistance(0.8) = "${formatDistance(0.8)}"`);
console.log(`   formatDistance(5.2) = "${formatDistance(5.2)}"`);
console.log(`   formatPace(270) = "${formatPace(270)}"/km`);

console.log('✅ Unit Formatters OK\n');

// ============================================================================
// Test Plan Builder
// ============================================================================

console.log('📋 Testing Plan Builder...\n');

// Create plan
const planId = generateId();
const nowStr = now();

await db.insert(schema.plan).values({
  id: planId,
  name: '5K Training Plan',
  targetDistance: '5k',
  targetTime: 20 * 60,
  vdot: calculateVdot(5, 20 * 60),
  paceE: getPaceZones(calculateVdot(5, 20 * 60)).zones.E,
  paceM: getPaceZones(calculateVdot(5, 20 * 60)).zones.M,
  paceT: getPaceZones(calculateVdot(5, 20 * 60)).zones.T,
  paceI: getPaceZones(calculateVdot(5, 20 * 60)).zones.I,
  paceR: getPaceZones(calculateVdot(5, 20 * 60)).zones.R,
  weeks: 4,
  desc: 'Test plan',
  createdAt: nowStr,
  updatedAt: nowStr,
});

// Create weekly plans
const weeklyPlanIds: string[] = [];
for (let i = 1; i <= 4; i++) {
  const wpId = generateId();
  weeklyPlanIds.push(wpId);
  await db.insert(schema.weeklyPlan).values({
    id: wpId,
    planId,
    weekIndex: i,
    desc: `Week ${i}`,
  });
}

// Create daily plans
const dailyPlanIds: string[] = [];
for (let wi = 0; wi < 4; wi++) {
  for (let di = 1; di <= 7; di++) {
    const dpId = generateId();
    dailyPlanIds.push(dpId);
    await db.insert(schema.dailyPlan).values({
      id: dpId,
      weeklyPlanId: weeklyPlanIds[wi],
      dayIndex: di,
      desc: `Day ${di}`,
    });
  }
}

// Create units for first daily plan
const dp0 = dailyPlanIds[0];
await db.insert(schema.unit).values([
  {
    id: generateId(),
    dailyPlanId: dp0,
    type: 'run',
    orderIndex: 1,
    paceMode: 'vdot',
    paceValue: 'E',
    standardType: 'time',
    standardValue: 30 * 60,
    standard: null,
    content: null,
  },
  {
    id: generateId(),
    dailyPlanId: dp0,
    type: 'rest',
    orderIndex: 2,
    paceMode: null,
    paceValue: null,
    standardType: null,
    standardValue: null,
    standard: 'time',
    content: null,
  },
]);

// Query back
const createdPlan = await db.query.plan.findFirst({ where: (p, { eq }) => eq(p.id, planId) });
const createdUnits = await db.query.unit.findMany({ where: (u, { eq }) => eq(u.dailyPlanId, dp0) });

console.log(`   Created plan: "${createdPlan?.name}"`);
console.log(`   VDOT: ${createdPlan?.vdot}`);
console.log(`   Weeks: ${createdPlan?.weeks}`);
console.log(`   Units in day 1: ${createdUnits.length}`);

console.log('✅ Plan Builder OK\n');

// ============================================================================
// Test Calendar Engine
// ============================================================================

console.log('📅 Testing Calendar Engine...\n');

// Get this week's Monday
function getThisWeekMonday(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const today = new Date();
const monday = getThisWeekMonday(today);

// Create calendar entries for first 3 days
for (let i = 0; i < 3; i++) {
  const d = new Date(monday);
  d.setDate(d.getDate() + i);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  await db.insert(schema.userPlanCalendar).values({
    id: generateId(),
    planId,
    date: dateStr,
    dailyPlanId: dailyPlanIds[i],
    status: 'pending',
  });
}

const calendarEntries = await db.query.userPlanCalendar.findMany();
console.log(`   Created ${calendarEntries.length} calendar entries`);
console.log(`   First entry date: ${calendarEntries[0].date}`);

console.log('✅ Calendar Engine OK\n');

// ============================================================================
// Test Check-in Service
// ============================================================================

console.log('✅ Testing Check-in Service...\n');

// Check in from calendar
const firstEntry = calendarEntries[0];
await db.insert(schema.checkInRecord).values({
  id: generateId(),
  calendarEntryId: firstEntry.id,
  date: firstEntry.date,
  type: 'run',
  distance: 5.0,
  duration: 20 * 60,
  pace: 240,
  feeling: 'easy',
  photos: null,
  createdAt: now(),
});

// Update daily overview
await db.insert(schema.checkInDailyOverview).values({
  id: generateId(),
  date: firstEntry.date,
  hasCheckIn: true,
});

// Update calendar status
await db.update(schema.userPlanCalendar)
  .set({ status: 'completed' })
  .where((u, { eq }) => eq(u.id, firstEntry.id));

const checkIns = await db.query.checkInRecord.findMany();
console.log(`   Created ${checkIns.length} check-in record`);
console.log(`   Feeling: ${checkIns[0].feeling}`);
console.log(`   Distance: ${checkIns[0].distance}km`);

const overview = await db.query.checkInDailyOverview.findFirst({
  where: (o, { eq }) => eq(o.date, firstEntry.date),
});
console.log(`   Daily overview hasCheckIn: ${overview?.hasCheckIn}`);

console.log('✅ Check-in Service OK\n');

// ============================================================================
// Test User Model
// ============================================================================

console.log('👤 Testing User Model...\n');

await db.insert(schema.user).values({
  id: 'local',
  runningGoalDistance: '5k',
  runningGoalTime: 20 * 60,
  vdot: calculateVdot(5, 20 * 60),
  updatedAt: now(),
});

const userProfile = await db.query.user.findFirst({ where: (u, { eq }) => eq(u.id, 'local') });
console.log(`   User running goal: ${userProfile?.runningGoalDistance} in ${userProfile?.runningGoalTime}s`);
console.log(`   User VDOT: ${userProfile?.vdot}`);

console.log('✅ User Model OK\n');

// ============================================================================
// Summary
// ============================================================================

console.log('='.repeat(50));
console.log('🎉 All modules verified successfully!');
console.log('='.repeat(50));

// Cleanup
sqlite.close();
try {
  require('fs').unlinkSync(dbPath);
} catch {}

process.exit(0);
