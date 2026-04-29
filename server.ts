/**
 * Ruff API Server
 * Serves API endpoints and web UI for testing
 */

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq } from 'drizzle-orm';
import * as schema from './src/db/schema/index.ts';
import { generateId, now } from './src/db/utils.ts';
import { calculateVdot, getPaceZones, adjustPace } from './src/lib/vdot/index.ts';
import { formatDuration, formatDistance, formatPace } from './src/lib/unit/index.ts';

const dbPath = './ruff-web.db';
const PORT = 3000;
const DIST_DIR = './web-test';

// ============================================================================
// Neon PostgreSQL (Plan Square)
// ============================================================================

// ============================================================================
// Database Setup
// ============================================================================

let sqlite = new Database(dbPath);
let db = drizzle(sqlite, { schema });

function initDb() {
  sqlite.exec(`
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
      "plan_id" text NOT NULL,
      "week_index" integer NOT NULL,
      "desc" text
    );

    CREATE TABLE IF NOT EXISTS "daily_plan" (
      "id" text PRIMARY KEY,
      "weekly_plan_id" text NOT NULL,
      "day_index" integer NOT NULL,
      "desc" text
    );

    CREATE TABLE IF NOT EXISTS "unit" (
      "id" text PRIMARY KEY,
      "daily_plan_id" text NOT NULL,
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
      "plan_id" text NOT NULL,
      "date" text NOT NULL,
      "daily_plan_id" text NOT NULL,
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
      "has_check_in" integer NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS "template" (
      "id" text PRIMARY KEY,
      "name" text NOT NULL,
      "daily_plan_id" text NOT NULL,
      "usage_count" integer NOT NULL DEFAULT 0,
      "created_at" text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "user_favorite" (
      "id" text PRIMARY KEY,
      "name" text NOT NULL,
      "units" text NOT NULL,
      "created_at" text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "cloud_user" (
      "id" text PRIMARY KEY,
      "apple_user_id" text UNIQUE,
      "email" text,
      "created_at" text NOT NULL,
      "updated_at" text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "backup" (
      "id" text PRIMARY KEY,
      "user_id" text NOT NULL,
      "data" text NOT NULL,
      "created_at" text NOT NULL,
      "updated_at" text NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "plan_square" (
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
      "plan_desc" text,
      "created_at" text NOT NULL,
      "updated_at" text NOT NULL,
      "is_active" integer NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS "plan_square_weekly" (
      "id" text PRIMARY KEY,
      "plan_id" text NOT NULL,
      "week_index" integer NOT NULL,
      "week_desc" text
    );

    CREATE TABLE IF NOT EXISTS "plan_square_daily" (
      "id" text PRIMARY KEY,
      "weekly_plan_id" text NOT NULL,
      "day_index" integer NOT NULL,
      "day_desc" text
    );

    CREATE TABLE IF NOT EXISTS "plan_square_unit" (
      "id" text PRIMARY KEY,
      "daily_plan_id" text NOT NULL,
      "type" text NOT NULL,
      "order_index" integer NOT NULL,
      "pace_mode" text,
      "pace_value" text,
      "standard_type" text,
      "standard_value" integer,
      "standard" text,
      "content" text
    );
  `);
}

initDb();

// Seed plan_square if empty
/**
 * 统一插入一条 unit
 */
function unit(id: string, dailyId: string, type: string, orderIndex: number, paceMode: string | null, paceValue: string | null, standardType: string | null, standardValue: number | null, standard: string | null, content: string | null) {
  sqlite.query(`INSERT INTO plan_square_unit (id, daily_plan_id, type, order_index, pace_mode, pace_value, standard_type, standard_value, standard, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, dailyId, type, orderIndex, paceMode, paceValue, standardType, standardValue, standard, content);
}

/**
 * 统一插入一条 daily，不插 unit（休息日）
 */
function day(id: string, weeklyId: string, dayIndex: number, dayDesc: string) {
  sqlite.query(`INSERT INTO plan_square_daily (id, weekly_plan_id, day_index, day_desc) VALUES (?, ?, ?, ?)`).run(id, weeklyId, dayIndex, dayDesc);
}

/**
 * 训练日：热身 + 主训练 + 冷身/拉伸
 */
function runDay(id: string, weeklyId: string, dayIndex: number, dayDesc: string, warmupMin: number, mainMin: number, paceMode: string, paceValue: string, restMin: number) {
  day(id, weeklyId, dayIndex, dayDesc);
  const mainSec = mainMin * 60;
  const warmupSec = warmupMin * 60;
  const restSec = restMin * 60;
  unit(id + '-u1', id, 'run', 1, 'E', '6:00', 'time', warmupSec, '热身', '轻松跑热身');
  unit(id + '-u2', id, 'run', 2, paceMode, paceValue, 'time', mainSec, '主训练', null);
  unit(id + '-u3', id, 'other', 3, null, null, 'time', restSec, '冷身', '拉伸放松');
}

/**
 * T跑日（无热身冷身）
 */
function tDay(id: string, weeklyId: string, dayIndex: number, dayDesc: string, mainMin: number) {
  day(id, weeklyId, dayIndex, dayDesc);
  const mainSec = mainMin * 60;
  unit(id + '-u1', id, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身');
  unit(id + '-u2', id, 'run', 2, 'T', '5:00', 'time', mainSec, 'T训练', null);
  unit(id + '-u3', id, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松');
}

/**
 * 比赛日
 */
function raceDay(id: string, weeklyId: string, dayIndex: number, dayDesc: string, distance: number) {
  day(id, weeklyId, dayIndex, dayDesc);
  unit(id + '-u1', id, 'run', 1, null, null, 'distance', distance, '比赛', '5K比赛日！全力以赴！');
}

function seedPlanSquare() {
  const existing = sqlite.query('SELECT COUNT(*) as cnt FROM plan_square').get() as { cnt: number };
  if (existing.cnt > 0) return;

  const nowStr = now();
  sqlite.query(`
    INSERT INTO plan_square (id, name, target_distance, target_time, vdot, pace_e, pace_m, pace_t, pace_i, pace_r, weeks, plan_desc, created_at, updated_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('plan-5k-001', '8周5K训练计划', '5k', 1800, 45.0, 330, 300, 275, 255, 240, 8, '适合初学者的8周5K训练计划，每周3-4次训练', nowStr, nowStr, 1);

  // Week 1 - 适应期
  sqlite.query(`INSERT INTO plan_square_weekly (id, plan_id, week_index, week_desc) VALUES (?, ?, ?, ?)`).run('ps-w1', 'plan-5k-001', 1, '第1周：适应期');
  day('ps-w1d1', 'ps-w1', 1, '周一：休息');
  runDay('ps-w1d2', 'ps-w1', 2, '周二：E跑40分钟', 10, 25, 'E', '5:30', 5);
  day('ps-w1d3', 'ps-w1', 3, '周三：休息');
  runDay('ps-w1d4', 'ps-w1', 4, '周四：E跑40分钟', 10, 25, 'E', '5:30', 5);
  day('ps-w1d5', 'ps-w1', 5, '周五：休息');
  runDay('ps-w1d6', 'ps-w1', 6, '周六：E跑50分钟', 10, 35, 'E', '5:30', 5);
  day('ps-w1d7', 'ps-w1', 7, '周日：休息');

  // Week 2 - 基础期
  sqlite.query(`INSERT INTO plan_square_weekly (id, plan_id, week_index, week_desc) VALUES (?, ?, ?, ?)`).run('ps-w2', 'plan-5k-001', 2, '第2周：基础期');
  day('ps-w2d1', 'ps-w2', 1, '周一：休息');
  runDay('ps-w2d2', 'ps-w2', 2, '周二：E跑45分钟', 10, 30, 'E', '5:30', 5);
  day('ps-w2d3', 'ps-w2', 3, '周三：休息');
  runDay('ps-w2d4', 'ps-w2', 4, '周四：E跑45分钟', 10, 30, 'E', '5:30', 5);
  day('ps-w2d5', 'ps-w2', 5, '周五：休息');
  runDay('ps-w2d6', 'ps-w2', 6, '周六：E跑60分钟', 10, 45, 'E', '5:30', 5);
  day('ps-w2d7', 'ps-w2', 7, '周日：休息');

  // Week 3 - 提升期
  sqlite.query(`INSERT INTO plan_square_weekly (id, plan_id, week_index, week_desc) VALUES (?, ?, ?, ?)`).run('ps-w3', 'plan-5k-001', 3, '第3周：提升期');
  day('ps-w3d1', 'ps-w3', 1, '周一：休息');
  runDay('ps-w3d2', 'ps-w3', 2, '周二：E跑50分钟', 10, 35, 'E', '5:20', 5);
  tDay('ps-w3d3', 'ps-w3', 3, '周三：T跑25分钟', 25);
  runDay('ps-w3d4', 'ps-w3', 4, '周四：E跑50分钟', 10, 35, 'E', '5:20', 5);
  day('ps-w3d5', 'ps-w3', 5, '周五：休息');
  runDay('ps-w3d6', 'ps-w3', 6, '周六：E跑65分钟', 10, 50, 'E', '5:20', 5);
  day('ps-w3d7', 'ps-w3', 7, '周日：休息');

  // Week 4 - 巩固期
  sqlite.query(`INSERT INTO plan_square_weekly (id, plan_id, week_index, week_desc) VALUES (?, ?, ?, ?)`).run('ps-w4', 'plan-5k-001', 4, '第4周：巩固期');
  day('ps-w4d1', 'ps-w4', 1, '周一：休息');
  runDay('ps-w4d2', 'ps-w4', 2, '周二：E跑55分钟', 10, 40, 'E', '5:20', 5);
  tDay('ps-w4d3', 'ps-w4', 3, '周三：T跑30分钟', 30);
  runDay('ps-w4d4', 'ps-w4', 4, '周四：E跑55分钟', 10, 40, 'E', '5:20', 5);
  day('ps-w4d5', 'ps-w4', 5, '周五：休息');
  runDay('ps-w4d6', 'ps-w4', 6, '周六：E跑70分钟', 10, 55, 'E', '5:20', 5);
  day('ps-w4d7', 'ps-w4', 7, '周日：休息');

  // Week 5 - 强化期
  sqlite.query(`INSERT INTO plan_square_weekly (id, plan_id, week_index, week_desc) VALUES (?, ?, ?, ?)`).run('ps-w5', 'plan-5k-001', 5, '第5周：强化期');
  day('ps-w5d1', 'ps-w5', 1, '周一：休息');
  runDay('ps-w5d2', 'ps-w5', 2, '周二：E跑60分钟', 10, 45, 'E', '5:15', 5);
  tDay('ps-w5d3', 'ps-w5', 3, '周三：T跑30分钟', 30);
  runDay('ps-w5d4', 'ps-w5', 4, '周四：E跑60分钟', 10, 45, 'E', '5:15', 5);
  day('ps-w5d5', 'ps-w5', 5, '周五：休息');
  runDay('ps-w5d6', 'ps-w5', 6, '周六：E跑75分钟', 10, 60, 'E', '5:15', 5);
  day('ps-w5d7', 'ps-w5', 7, '周日：休息');

  // Week 6 - 巅峰期
  sqlite.query(`INSERT INTO plan_square_weekly (id, plan_id, week_index, week_desc) VALUES (?, ?, ?, ?)`).run('ps-w6', 'plan-5k-001', 6, '第6周：巅峰期');
  day('ps-w6d1', 'ps-w6', 1, '周一：休息');
  runDay('ps-w6d2', 'ps-w6', 2, '周二：E跑65分钟', 10, 50, 'E', '5:15', 5);
  tDay('ps-w6d3', 'ps-w6', 3, '周三：T跑35分钟', 35);
  runDay('ps-w6d4', 'ps-w6', 4, '周四：E跑65分钟', 10, 50, 'E', '5:15', 5);
  day('ps-w6d5', 'ps-w6', 5, '周五：休息');
  runDay('ps-w6d6', 'ps-w6', 6, '周六：E跑80分钟', 10, 65, 'E', '5:15', 5);
  day('ps-w6d7', 'ps-w6', 7, '周日：休息');

  // Week 7 - 减量期
  sqlite.query(`INSERT INTO plan_square_weekly (id, plan_id, week_index, week_desc) VALUES (?, ?, ?, ?)`).run('ps-w7', 'plan-5k-001', 7, '第7周：减量期');
  day('ps-w7d1', 'ps-w7', 1, '周一：休息');
  runDay('ps-w7d2', 'ps-w7', 2, '周二：E跑50分钟', 10, 35, 'E', '5:30', 5);
  tDay('ps-w7d3', 'ps-w7', 3, '周三：T跑20分钟', 20);
  runDay('ps-w7d4', 'ps-w7', 4, '周四：E跑50分钟', 10, 35, 'E', '5:30', 5);
  day('ps-w7d5', 'ps-w7', 5, '周五：休息');
  runDay('ps-w7d6', 'ps-w7', 6, '周六：E跑60分钟', 10, 45, 'E', '5:30', 5);
  day('ps-w7d7', 'ps-w7', 7, '周日：休息');

  // Week 8 - 比赛周
  sqlite.query(`INSERT INTO plan_square_weekly (id, plan_id, week_index, week_desc) VALUES (?, ?, ?, ?)`).run('ps-w8', 'plan-5k-001', 8, '第8周：比赛周');
  day('ps-w8d1', 'ps-w8', 1, '周一：休息');
  runDay('ps-w8d2', 'ps-w8', 2, '周二：E跑40分钟', 10, 25, 'E', '5:30', 5);
  day('ps-w8d3', 'ps-w8', 3, '周三：休息');
  runDay('ps-w8d4', 'ps-w8', 4, '周四：E跑30分钟', 10, 15, 'E', '5:30', 5);
  day('ps-w8d5', 'ps-w8', 5, '周五：休息');
  raceDay('ps-w8d6', 'ps-w8', 6, '周六：比赛日！', 5000);
  day('ps-w8d7', 'ps-w8', 7, '周日：休息恢复');

  console.log('[Seed] plan_square seeded successfully');
}

seedPlanSquare();

// ============================================================================
// Route Handlers
// ============================================================================

type RouteHandler = (req: Request, url: URL) => Promise<Response> | Response | null;

const routes: Record<string, RouteHandler> = {
  // VDOT Calculation
  'POST /api/vdot': async (req) => {
    const { distance, time } = await req.json();
    const vdot = calculateVdot(distance, time * 60);
    const zones = getPaceZones(vdot);
    return Response.json({
      vdot: Math.round(vdot * 100) / 100,
      zones: {
        E: { pace: formatPace(zones.zones.E), seconds: zones.zones.E },
        M: { pace: formatPace(zones.zones.M), seconds: zones.zones.M },
        T: { pace: formatPace(zones.zones.T), seconds: zones.zones.T },
        I: { pace: formatPace(zones.zones.I), seconds: zones.zones.I },
        R: { pace: formatPace(zones.zones.R), seconds: zones.zones.R },
      }
    });
  },

  'POST /api/vdot/adjust': async (req) => {
    const { base, expr } = await req.json();
    const adjusted = adjustPace(base, expr);
    return Response.json({
      original: base,
      expression: expr,
      adjusted,
      formatted: formatPace(adjusted)
    });
  },

  'POST /api/unit/format': async (req) => {
    const { duration, distance, pace } = await req.json();
    return Response.json({
      duration: { input: duration, formatted: formatDuration(duration) },
      distance: { input: distance, formatted: formatDistance(distance) },
      pace: { input: pace, formatted: formatPace(pace) }
    });
  },

  // Create Plan
  'POST /api/plan': async (req) => {
    const { name, distance, time, weeks } = await req.json();
    const targetTime = time * 60;
    const distanceKm = distance === '5k' ? 5 : distance === '10k' ? 10 : distance === 'half' ? 21.0975 : 42.195;
    const vdot = calculateVdot(distanceKm, targetTime);
    const zones = getPaceZones(vdot);
    const planId = generateId();
    const nowStr = now();

    await db.insert(schema.plan).values({
      id: planId,
      name,
      targetDistance: distance,
      targetTime,
      vdot,
      paceE: zones.zones.E,
      paceM: zones.zones.M,
      paceT: zones.zones.T,
      paceI: zones.zones.I,
      paceR: zones.zones.R,
      weeks,
      desc: null,
      createdAt: nowStr,
      updatedAt: nowStr,
    });

    for (let i = 1; i <= weeks; i++) {
      const wpId = generateId();
      await db.insert(schema.weeklyPlan).values({
        id: wpId,
        planId,
        weekIndex: i,
        desc: "第" + i + "周",
      });

      for (let d = 1; d <= 7; d++) {
        await db.insert(schema.dailyPlan).values({
          id: generateId(),
          weeklyPlanId: wpId,
          dayIndex: d,
          desc: "第" + i + "周 第" + d + "天",
        });
      }
    }

    return Response.json({
      success: true,
      id: planId,
      name,
      vdot: Math.round(vdot * 100) / 100,
      weeks,
      paces: {
        E: formatPace(zones.zones.E),
        M: formatPace(zones.zones.M),
        T: formatPace(zones.zones.T),
        I: formatPace(zones.zones.I),
        R: formatPace(zones.zones.R),
      }
    });
  },

  // Activate Plan
  'POST /api/calendar/activate': async (req) => {
    const { planId, start } = await req.json();

    const plan = await db.query.plan.findFirst({
      where: (p, { eq }) => eq(p.id, planId)
    });
    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    const today = new Date();
    const getMonday = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      date.setDate(diff);
      date.setHours(0, 0, 0, 0);
      return date;
    };

    let startDate = getMonday(today);
    if (start === 'next_week') {
      startDate.setDate(startDate.getDate() + 7);
    }

    const weeklyPlans = await db.query.weeklyPlan.findMany({
      where: (wp, { eq }) => eq(wp.planId, planId),
      orderBy: (wp, { asc }) => asc(wp.weekIndex)
    });

    let count = 0;
    for (let weekOffset = 0; weekOffset < plan.weeks; weekOffset++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + weekOffset * 7);

      const weeklyPlan = weeklyPlans.find(wp => wp.weekIndex === weekOffset + 1);
      if (!weeklyPlan) continue;

      const dailyPlans = await db.query.dailyPlan.findMany({
        where: (dp, { eq }) => eq(dp.weeklyPlanId, weeklyPlan.id),
        orderBy: (dp, { asc }) => asc(dp.dayIndex)
      });

      for (const dp of dailyPlans) {
        const entryDate = new Date(weekStart);
        entryDate.setDate(entryDate.getDate() + dp.dayIndex - 1);

        const dateStr = entryDate.getFullYear() + '-' +
          String(entryDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(entryDate.getDate()).padStart(2, '0');

        await db.insert(schema.userPlanCalendar).values({
          id: generateId(),
          planId,
          date: dateStr,
          dailyPlanId: dp.id,
          status: 'pending',
        });
        count++;
      }
    }

    return Response.json({
      success: true,
      entriesCreated: count,
      startDate: startDate.getFullYear() + '-' +
        String(startDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(startDate.getDate()).padStart(2, '0')
    });
  },

  // Query Calendar
  'GET /api/calendar': async (req, url) => {
    const date = url.searchParams.get('date');
    if (!date) return Response.json({ error: 'date required' }, { status: 400 });

    const entries = await db.query.userPlanCalendar.findMany({
      where: (u, { eq }) => eq(u.date, date)
    });

    const enriched = await Promise.all(entries.map(async (entry) => {
      const plan = await db.query.plan.findFirst({ where: (p, { eq }) => eq(p.id, entry.planId) });
      const dailyPlan = await db.query.dailyPlan.findFirst({ where: (dp, { eq }) => eq(dp.id, entry.dailyPlanId) });

      const units = await db.query.unit.findMany({
        where: (u, { eq }) => eq(u.dailyPlanId, entry.dailyPlanId),
        orderBy: (u, { asc }) => asc(u.orderIndex)
      });

      const formattedUnits = units.map(u => {
        let displayValue = '';
        if (u.type === 'run') {
          displayValue = (u.standardType === 'time' ? formatDuration(u.standardValue ?? 0) : formatDistance((u.standardValue ?? 0) / 1000));
        } else if (u.type === 'rest') {
          displayValue = '休息';
        } else {
          displayValue = u.content || '其他';
        }
        return { ...u, displayValue };
      });

      return {
        ...entry,
        planName: plan?.name,
        dailyPlanDesc: dailyPlan?.desc,
        dayIndex: dailyPlan?.dayIndex,
        dailyPlanUnits: formattedUnits
      };
    }));

    return Response.json({ date, entries: enriched });
  },

  // Get check-ins for a date
  'GET /api/checkins': async (req, url) => {
    const date = url.searchParams.get('date');
    if (!date) return Response.json({ error: 'date required' }, { status: 400 });

    const records = sqlite.query('SELECT * FROM check_in_record WHERE date = ? ORDER BY created_at').all(date) as Array<{
      id: string;
      calendar_entry_id: string | null;
      date: string;
      type: string;
      distance: number | null;
      duration: number | null;
      pace: number | null;
      feeling: string | null;
      created_at: string;
    }>;

    const formatted = records.map(r => ({
      id: r.id,
      calendarEntryId: r.calendar_entry_id,
      date: r.date,
      type: r.type,
      distance: r.distance,
      duration: r.duration,
      durationFormatted: r.duration ? formatDuration(r.duration) : null,
      pace: r.pace,
      paceFormatted: r.pace ? formatPace(r.pace) : null,
      feeling: r.feeling,
      feelingLabel: r.feeling === 'easy' ? '轻松' : r.feeling === 'moderate' ? '适中' : r.feeling === 'hard' ? '吃力' : r.feeling === 'painful' ? '痛苦' : null,
      createdAt: r.created_at
    }));

    return Response.json({ date, records: formatted });
  },

  // Add Unit to DailyPlan
  'POST /api/unit': async (req) => {
    const { dailyPlanId, type, paceMode, paceValue, standardType, standardValue, standard, content } = await req.json();

    const existingUnits = sqlite.query('SELECT * FROM unit WHERE daily_plan_id = ?').all(dailyPlanId) as Array<{ order_index: number }>;
    const orderIndex = existingUnits.length + 1;

    const id = generateId();

    sqlite.query(`
      INSERT INTO unit (id, daily_plan_id, type, order_index, pace_mode, pace_value, standard_type, standard_value, standard, content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, dailyPlanId, type, orderIndex, paceMode || null, paceValue || null, standardType || null, standardValue || null, standard || null, content || null);

    return Response.json({
      success: true,
      id,
      dailyPlanId,
      type,
      orderIndex
    });
  },

  // Create DailyPlan
  'POST /api/dailyplan': async (req) => {
    const { name, weekIndex, dayIndex } = await req.json();

    let weeklyPlanId = null;
    let dayIdx = dayIndex || 1;

    if (weekIndex && dayIndex) {
      const weeklyPlans = await db.query.weeklyPlan.findMany({
        orderBy: (wp, { asc }) => asc(wp.weekIndex)
      });
      const wp = weeklyPlans.find(w => w.weekIndex === weekIndex);
      if (wp) weeklyPlanId = wp.id;
    }

    if (!weeklyPlanId) {
      const standaloneWpId = generateId();
      await db.insert(schema.weeklyPlan).values({
        id: standaloneWpId,
        planId: 'standalone',
        weekIndex: 0,
        desc: 'Standalone Daily Plans',
      });
      weeklyPlanId = standaloneWpId;
      dayIdx = 1;
    }

    const id = generateId();
    const desc = name || 'DailyPlan-' + id.slice(0, 8);

    await db.insert(schema.dailyPlan).values({
      id,
      weeklyPlanId,
      dayIndex: dayIdx,
      desc,
    });

    return Response.json({
      success: true,
      id,
      name: desc,
      weeklyPlanId,
      dayIndex: dayIdx
    });
  },

  // Get current VDOT
  'GET /api/current-vdot': async () => {
    const pendingEntry = sqlite.query(`
      SELECT upc.plan_id, p.vdot, p.name as plan_name
      FROM user_plan_calendar upc
      JOIN plan p ON upc.plan_id = p.id
      WHERE upc.status = 'pending'
      ORDER BY upc.date ASC
      LIMIT 1
    `).get() as { plan_id: string; vdot: number; plan_name: string } | undefined;

    if (pendingEntry) {
      return Response.json({
        vdot: pendingEntry.vdot,
        source: 'plan',
        planName: pendingEntry.plan_name,
        planId: pendingEntry.plan_id
      });
    }

    const user = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, 'local')
    });

    return Response.json({
      vdot: user?.vdot || null,
      source: 'user',
      planName: null,
      planId: null
    });
  },

  // Create DailyPlan with Units
  'POST /api/dailyplan-with-units': async (req) => {
    const { name, units, isTemplate } = await req.json();

    if (!name) {
      return Response.json({ error: '名称不能为空' }, { status: 400 });
    }

    const standaloneWpId = generateId();
    await db.insert(schema.weeklyPlan).values({
      id: standaloneWpId,
      planId: 'standalone',
      weekIndex: 0,
      desc: 'Standalone Daily Plans',
    });

    const dailyPlanId = generateId();
    const desc = name || 'DailyPlan-' + dailyPlanId.slice(0, 8);

    await db.insert(schema.dailyPlan).values({
      id: dailyPlanId,
      weeklyPlanId: standaloneWpId,
      dayIndex: 1,
      desc,
    });

    const createdUnits = [];
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      const unitId = generateId();
      sqlite.query(`
        INSERT INTO unit (id, daily_plan_id, type, order_index, pace_mode, pace_value, standard_type, standard_value, standard, content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        unitId,
        dailyPlanId,
        u.type,
        i + 1,
        u.paceMode || null,
        u.paceValue || null,
        u.standardType || null,
        u.standardValue || null,
        u.standard || null,
        u.content || null
      );
      createdUnits.push({
        id: unitId,
        type: u.type,
        orderIndex: i + 1,
        paceMode: u.paceMode,
        paceValue: u.paceValue,
        standardType: u.standardType,
        standardValue: u.standardValue
      });
    }

    let templateId = null;
    if (isTemplate) {
      templateId = generateId();
      await db.insert(schema.template).values({
        id: templateId,
        name: desc,
        dailyPlanId: dailyPlanId,
        usageCount: 0,
        createdAt: now(),
      });
    }

    return Response.json({
      success: true,
      id: dailyPlanId,
      name: desc,
      units: createdUnits,
      templateId
    });
  },

  // Get all DailyPlans
  'GET /api/dailyplans': async () => {
    const dailyPlans = sqlite.query(`
      SELECT dp.*, wp.week_index, wp.plan_id, p.name as plan_name
      FROM daily_plan dp
      LEFT JOIN weekly_plan wp ON dp.weekly_plan_id = wp.id
      LEFT JOIN plan p ON wp.plan_id = p.id
      ORDER BY dp.id DESC
    `).all() as Array<{
      id: string;
      weekly_plan_id: string | null;
      day_index: number;
      desc: string | null;
      week_index: number | null;
      plan_id: string | null;
      plan_name: string | null;
    }>;

    const result = dailyPlans.map(dp => {
      const units = sqlite.query('SELECT * FROM unit WHERE daily_plan_id = ? ORDER BY order_index').all(dp.id) as Array<{
        id: string;
        type: string;
        pace_mode: string | null;
        pace_value: string | null;
        standard_type: string | null;
        standard_value: number | null;
        content: string | null;
        order_index: number;
      }>;
      return {
        id: dp.id,
        desc: dp.desc,
        weekIndex: dp.week_index,
        dayIndex: dp.day_index,
        planName: dp.plan_name,
        units: units.map(u => ({
          id: u.id,
          type: u.type,
          paceMode: u.pace_mode,
          paceValue: u.pace_value,
          standardType: u.standard_type,
          standardValue: u.standard_value,
          content: u.content,
          orderIndex: u.order_index,
          displayValue: u.type === 'run' ? (u.standard_type === 'time' ? formatDuration(u.standard_value ?? 0) : formatDistance((u.standard_value ?? 0) / 1000)) : (u.type === 'rest' ? '休息' : (u.content || ''))
        }))
      };
    });

    return Response.json({ dailyPlans: result });
  },

  // Delete Unit
  'DELETE /api/unit': async (req, url) => {
    const unitId = url.searchParams.get('id');
    if (!unitId) return Response.json({ error: 'id required' }, { status: 400 });
    sqlite.query('DELETE FROM unit WHERE id = ?').run(unitId);
    return Response.json({ success: true, deletedId: unitId });
  },

  // Get DailyPlan with Units
  'GET /api/dailyplan': async (req, url) => {
    const dailyPlanId = url.searchParams.get('id');
    if (!dailyPlanId) return Response.json({ error: 'id required' }, { status: 400 });
    const dailyPlan = sqlite.query('SELECT * FROM daily_plan WHERE id = ?').get(dailyPlanId);
    const units = sqlite.query('SELECT * FROM unit WHERE daily_plan_id = ? ORDER BY order_index').all(dailyPlanId);
    return Response.json({ dailyPlan, units });
  },

  // Check-in
  'POST /api/checkin': async (req) => {
    const { date, type, distance, duration, feeling, calendarEntryId } = await req.json();

    const pace = duration && distance ? Math.round(duration / distance) : null;
    const id = generateId();
    const nowStr = now();

    sqlite.query(`
      INSERT INTO check_in_record (id, calendar_entry_id, date, type, distance, duration, pace, feeling, photos, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
    `).run(id, calendarEntryId || null, date, type, distance, duration, pace, feeling, nowStr);

    if (calendarEntryId) {
      sqlite.query('UPDATE user_plan_calendar SET status = ? WHERE id = ?').run('completed', calendarEntryId);
    }

    const existing = sqlite.query('SELECT * FROM check_in_daily_overview WHERE date = ?').get(date);
    if (existing) {
      sqlite.query('UPDATE check_in_daily_overview SET has_check_in = 1 WHERE date = ?').run(date);
    } else {
      sqlite.query('INSERT INTO check_in_daily_overview (id, date, has_check_in) VALUES (?, ?, 1)').run(generateId(), date);
    }

    return Response.json({
      success: true,
      id,
      date,
      type,
      distance,
      duration,
      pace,
      feeling,
      fromPlan: !!calendarEntryId
    });
  },

  // Check-in from plan
  'POST /api/checkin/from-plan': async (req) => {
    const { calendarEntryId, feeling } = await req.json();

    const entryRow = sqlite.query('SELECT * FROM user_plan_calendar WHERE id = ?').get(calendarEntryId);
    if (!entryRow) {
      return Response.json({ error: 'Calendar entry not found' }, { status: 404 });
    }

    const entry = entryRow as { id: string; plan_id: string; date: string; daily_plan_id: string; status: string };

    const units = sqlite.query('SELECT * FROM unit WHERE daily_plan_id = ? ORDER BY order_index').all(entry.daily_plan_id) as Array<{
      id: string;
      type: string;
      standard_type: string | null;
      standard_value: number | null;
      content: string | null;
    }>;

    let totalDistance = 0;
    let totalDuration = 0;
    let type = 'run';

    for (const unit of units) {
      if (unit.type === 'run') {
        if (unit.standard_type === 'distance') {
          totalDistance += (unit.standard_value || 0) / 1000;
        } else if (unit.standard_type === 'time') {
          totalDuration += unit.standard_value || 0;
        }
        type = 'run';
      } else if (unit.type === 'rest') {
        type = 'rest';
      } else {
        type = 'other';
      }
    }

    const id = generateId();
    const nowStr = now();

    sqlite.query(`
      INSERT INTO check_in_record (id, calendar_entry_id, date, type, distance, duration, pace, feeling, photos, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
    `).run(id, calendarEntryId, entry.date, type,
      totalDistance > 0 ? totalDistance : null,
      totalDuration > 0 ? totalDuration : null,
      totalDistance > 0 && totalDuration > 0 ? Math.round(totalDuration / totalDistance) : null,
      feeling, nowStr);

    sqlite.query('UPDATE user_plan_calendar SET status = ? WHERE id = ?').run('completed', calendarEntryId);

    const existingOverview = sqlite.query('SELECT * FROM check_in_daily_overview WHERE date = ?').get(entry.date);
    if (existingOverview) {
      sqlite.query('UPDATE check_in_daily_overview SET has_check_in = 1 WHERE date = ?').run(entry.date);
    } else {
      sqlite.query('INSERT INTO check_in_daily_overview (id, date, has_check_in) VALUES (?, ?, 1)').run(generateId(), entry.date);
    }

    return Response.json({
      success: true,
      id,
      date: entry.date,
      type,
      distance: totalDistance > 0 ? totalDistance : null,
      duration: totalDuration > 0 ? totalDuration : null,
      feeling,
      unitsIncluded: units.length
    });
  },

  // User
  'POST /api/user': async (req) => {
    const { distance, time } = await req.json();
    const targetTime = time * 60;
    const distanceKm = distance === '5k' ? 5 : distance === '10k' ? 10 : distance === 'half' ? 21.0975 : 42.195;
    const vdot = calculateVdot(distanceKm, targetTime);

    const existing = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, 'local')
    });

    if (existing) {
      await db.update(schema.user)
        .set({
          runningGoalDistance: distance,
          runningGoalTime: targetTime,
          vdot,
          updatedAt: now()
        })
        .where(eq(schema.user.id, 'local'));
    } else {
      await db.insert(schema.user).values({
        id: 'local',
        runningGoalDistance: distance,
        runningGoalTime: targetTime,
        vdot,
        updatedAt: now(),
      });
    }

    return Response.json({
      success: true,
      runningGoalDistance: distance,
      runningGoalTime: targetTime,
      vdot: Math.round(vdot * 100) / 100
    });
  },

  // History
  'GET /api/history': async (req, url) => {
    const year = parseInt(url.searchParams.get('year') || '0');
    const month = parseInt(url.searchParams.get('month') || '0');

    if (!year || !month) {
      return Response.json({ error: 'year and month required' }, { status: 400 });
    }

    const startDate = year + '-' + String(month).padStart(2, '0') + '-01';
    const endDate = year + '-' + String(month).padStart(2, '0') + '-31';

    const overviews = await db.query.checkInDailyOverview.findMany({
      where: (o, { and, gte, lte }) => and(gte(o.date, startDate), lte(o.date, endDate))
    });

    let totalDistance = 0;
    let totalDuration = 0;
    let trainingDays = 0;

    for (const overview of overviews) {
      if (overview.hasCheckIn) {
        trainingDays++;
        const records = await db.query.checkInRecord.findMany({
          where: (r, { eq }) => eq(r.date, overview.date)
        });
        for (const r of records) {
          totalDistance += r.distance || 0;
          totalDuration += r.duration || 0;
        }
      }
    }

    return Response.json({
      year,
      month,
      trainingDays,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalDuration,
      totalDurationFormatted: formatDuration(totalDuration)
    });
  },

  // Data
  'GET /api/data': async () => {
    const plans = await db.query.plan.findMany();
    const weeklyPlans = await db.query.weeklyPlan.findMany();
    const dailyPlans = await db.query.dailyPlan.findMany();
    const units = await db.query.unit.findMany();
    const calendar = await db.query.userPlanCalendar.findMany();
    const checkins = await db.query.checkInRecord.findMany();
    const overviews = await db.query.checkInDailyOverview.findMany();
    const users = await db.query.user.findMany();

    return Response.json({
      tables: {
        user: users.length,
        plan: plans.length,
        weekly_plan: weeklyPlans.length,
        daily_plan: dailyPlans.length,
        unit: units.length,
        user_plan_calendar: calendar.length,
        check_in_record: checkins.length,
        check_in_daily_overview: overviews.length,
      },
      plans: plans.map(p => ({
        id: p.id,
        name: p.name,
        target: p.targetDistance + ' / ' + (p.targetTime / 60) + 'min',
        vdot: p.vdot,
        weeks: p.weeks
      })),
      recentCheckins: checkins.slice(-5).map(c => ({
        date: c.date,
        type: c.type,
        distance: c.distance,
        duration: c.duration,
        feeling: c.feeling
      }))
    });
  },

  // Templates
  'GET /api/templates': async () => {
    const templates = sqlite.query(`
      SELECT t.*, dp.desc as daily_plan_name,
        (SELECT COUNT(*) FROM unit WHERE daily_plan_id = t.daily_plan_id) as unit_count
      FROM template t
      JOIN daily_plan dp ON t.daily_plan_id = dp.id
      ORDER BY t.created_at DESC
    `).all() as Array<{
      id: string;
      name: string;
      daily_plan_id: string;
      usage_count: number;
      created_at: string;
      daily_plan_name: string;
      unit_count: number;
    }>;

    return Response.json({ templates });
  },

  'GET /api/template': async (req, url) => {
    const templateId = url.searchParams.get('id');
    const unitsOnly = url.searchParams.get('units') === 'true';

    if (!templateId) return Response.json({ error: 'id required' }, { status: 400 });

    const template = sqlite.query('SELECT * FROM template WHERE id = ?').get(templateId) as { id: string; name: string; daily_plan_id: string } | undefined;

    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    if (unitsOnly) {
      const units = sqlite.query('SELECT * FROM unit WHERE daily_plan_id = ? ORDER BY order_index').all(template.daily_plan_id) as Array<{
        id: string;
        type: string;
        pace_mode: string | null;
        pace_value: string | null;
        standard_type: string | null;
        standard_value: number | null;
        content: string | null;
        order_index: number;
      }>;

      return Response.json({
        template: {
          id: template.id,
          name: template.name,
          dailyPlanId: template.daily_plan_id
        },
        units: units.map(u => ({
          id: u.id,
          type: u.type,
          paceMode: u.pace_mode,
          paceValue: u.pace_value,
          standardType: u.standard_type,
          standardValue: u.standard_value,
          content: u.content,
          orderIndex: u.order_index
        }))
      });
    }

    return Response.json({ template });
  },

  'POST /api/template/use': async (req, url) => {
    const templateId = url.searchParams.get('id');
    if (!templateId) return Response.json({ error: 'id required' }, { status: 400 });

    const template = sqlite.query('SELECT * FROM template WHERE id = ?').get(templateId) as { id: string; name: string; daily_plan_id: string } | undefined;

    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    const originalUnits = sqlite.query('SELECT * FROM unit WHERE daily_plan_id = ? ORDER BY order_index').all(template.daily_plan_id) as Array<{
      id: string;
      type: string;
      pace_mode: string | null;
      pace_value: string | null;
      standard_type: string | null;
      standard_value: number | null;
      standard: string | null;
      content: string | null;
      order_index: number;
    }>;

    const standaloneWpId = generateId();
    await db.insert(schema.weeklyPlan).values({
      id: standaloneWpId,
      planId: 'standalone',
      weekIndex: 0,
      desc: 'From Template: ' + template.name,
    });

    const newDailyPlanId = generateId();
    await db.insert(schema.dailyPlan).values({
      id: newDailyPlanId,
      weeklyPlanId: standaloneWpId,
      dayIndex: 1,
      desc: template.name + ' (副本)',
    });

    const newUnits = [];
    for (const u of originalUnits) {
      const unitId = generateId();
      sqlite.query(`
        INSERT INTO unit (id, daily_plan_id, type, order_index, pace_mode, pace_value, standard_type, standard_value, standard, content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        unitId,
        newDailyPlanId,
        u.type,
        u.order_index,
        u.pace_mode,
        u.pace_value,
        u.standard_type,
        u.standard_value,
        u.standard,
        u.content
      );
      newUnits.push({
        id: unitId,
        type: u.type,
        orderIndex: u.order_index,
        paceMode: u.pace_mode,
        paceValue: u.pace_value,
        standardType: u.standard_type,
        standardValue: u.standard_value
      });
    }

    sqlite.query('UPDATE template SET usage_count = usage_count + 1 WHERE id = ?').run(templateId);

    return Response.json({
      success: true,
      id: newDailyPlanId,
      name: template.name + ' (副本)',
      units: newUnits,
      templateId
    });
  },

  'DELETE /api/template': async (req, url) => {
    const templateId = url.searchParams.get('id');
    if (!templateId) return Response.json({ error: 'id required' }, { status: 400 });
    sqlite.query('DELETE FROM template WHERE id = ?').run(templateId);
    return Response.json({ success: true });
  },

  // User Favorites
  'GET /api/user-favorites': async () => {
    const favorites = sqlite.query('SELECT * FROM user_favorite ORDER BY created_at DESC').all();
    return Response.json({ favorites });
  },

  'POST /api/user-favorite': async (req) => {
    const { name, units } = await req.json();
    const id = generateId();
    const nowStr = now();
    sqlite.query('INSERT INTO user_favorite (id, name, units, created_at) VALUES (?, ?, ?, ?)').run(id, name, JSON.stringify(units), nowStr);
    return Response.json({ success: true, id, name, units });
  },

  'DELETE /api/user-favorite': async (_req, url) => {
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    sqlite.query('DELETE FROM user_favorite WHERE id = ?').run(id);
    return Response.json({ success: true });
  },

  // Apple Sign In - Get or create cloud user
  'POST /api/auth/apple': async (req) => {
    const { appleUserId, email } = await req.json();

    if (!appleUserId) {
      return Response.json({ error: 'appleUserId required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = sqlite.query('SELECT * FROM cloud_user WHERE apple_user_id = ?').get(appleUserId) as {
      id: string;
      apple_user_id: string;
      email: string | null;
      created_at: string;
    } | undefined;

    if (existingUser) {
      return Response.json({
        success: true,
        userId: existingUser.id,
        isNew: false,
        email: existingUser.email
      });
    }

    // Create new user
    const userId = generateId();
    const nowStr = now();
    sqlite.query(`
      INSERT INTO cloud_user (id, apple_user_id, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, appleUserId, email || null, nowStr, nowStr);

    return Response.json({
      success: true,
      userId,
      isNew: true,
      email: email || null
    });
  },

  // Upload backup to cloud
  'POST /api/backup': async (req) => {
    const { userId, plans, weeklyPlans, dailyPlans, units, userPlanCalendar, checkInRecords, favorites } = await req.json();

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    const nowStr = now();
    const backupData = JSON.stringify({
      plans,
      weeklyPlans,
      dailyPlans,
      units,
      userPlanCalendar,
      checkInRecords,
      favorites,
      exportedAt: nowStr
    });

    // Check if backup exists for this user
    const existingBackup = sqlite.query('SELECT * FROM backup WHERE user_id = ?').get(userId) as { id: string } | undefined;

    if (existingBackup) {
      sqlite.query('UPDATE backup SET data = ?, updated_at = ? WHERE user_id = ?').run(backupData, nowStr, userId);
      return Response.json({
        success: true,
        backupId: existingBackup.id,
        updated: true,
        exportedAt: nowStr
      });
    }

    // Create new backup
    const backupId = generateId();
    sqlite.query(`
      INSERT INTO backup (id, user_id, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(backupId, userId, backupData, nowStr, nowStr);

    return Response.json({
      success: true,
      backupId,
      updated: false,
      exportedAt: nowStr
    });
  },

  // Download backup from cloud
  'GET /api/backup': async (req, url) => {
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    const backup = sqlite.query('SELECT * FROM backup WHERE user_id = ?').get(userId) as {
      id: string;
      user_id: string;
      data: string;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!backup) {
      return Response.json({ error: 'Backup not found' }, { status: 404 });
    }

    const data = JSON.parse(backup.data);

    return Response.json({
      success: true,
      backupId: backup.id,
      createdAt: backup.created_at,
      updatedAt: backup.updated_at,
      ...data
    });
  },

  // Plan Square - Get all plans from local SQLite
  'GET /api/plan-square': async () => {
    try {
      const plans = sqlite.query(`
        SELECT id, name, target_distance, target_time, vdot, pace_e, pace_m, pace_t, pace_i, pace_r, weeks, plan_desc, is_active, created_at, updated_at
        FROM plan_square
        ORDER BY created_at DESC
      `).all() as Array<{
        id: string;
        name: string;
        target_distance: string;
        target_time: number;
        vdot: number;
        pace_e: number;
        pace_m: number;
        pace_t: number;
        pace_i: number;
        pace_r: number;
        weeks: number;
        plan_desc: string | null;
        is_active: number;
        created_at: string;
        updated_at: string;
      }>;

      const enrichedPlans = plans.map((plan) => {
        const weeks = sqlite.query(`
          SELECT id, week_index, week_desc FROM plan_square_weekly
          WHERE plan_id = ? ORDER BY week_index
        `).all(plan.id) as Array<{
          id: string;
          week_index: number;
          week_desc: string | null;
        }>;

        const enrichedWeeks = weeks.map((week) => {
          const days = sqlite.query(`
            SELECT id, day_index, day_desc FROM plan_square_daily
            WHERE weekly_plan_id = ? ORDER BY day_index
          `).all(week.id) as Array<{
            id: string;
            day_index: number;
            day_desc: string | null;
          }>;

          const enrichedDays = days.map((day) => {
            const units = sqlite.query(`
              SELECT id, type, order_index, pace_mode, pace_value, standard_type, standard_value, standard, content
              FROM plan_square_unit WHERE daily_plan_id = ? ORDER BY order_index
            `).all(day.id) as Array<{
              id: string;
              type: string;
              order_index: number;
              pace_mode: string | null;
              pace_value: string | null;
              standard_type: string | null;
              standard_value: number | null;
              standard: string | null;
              content: string | null;
            }>;

            return {
              id: day.id,
              dayIndex: day.day_index,
              dayDesc: day.day_desc,
              units: units.map((u) => ({
                id: u.id,
                type: u.type,
                orderIndex: u.order_index,
                paceMode: u.pace_mode,
                paceValue: u.pace_value,
                standardType: u.standard_type,
                standardValue: u.standard_value,
                standard: u.standard,
                content: u.content,
              })),
            };
          });

          return {
            id: week.id,
            weekIndex: week.week_index,
            weekDesc: week.week_desc,
            days: enrichedDays,
          };
        });

        return {
          id: plan.id,
          name: plan.name,
          targetDistance: plan.target_distance,
          targetTime: plan.target_time,
          vdot: plan.vdot,
          paceE: plan.pace_e,
          paceM: plan.pace_m,
          paceT: plan.pace_t,
          paceI: plan.pace_i,
          paceR: plan.pace_r,
          weeks: plan.weeks,
          planDesc: plan.plan_desc,
          isActive: !!plan.is_active,
          createdAt: plan.created_at,
          updatedAt: plan.updated_at,
          weeksData: enrichedWeeks,
        };
      });

      return Response.json({ success: true, plans: enrichedPlans });
    } catch (e) {
      console.error('Plan Square error:', e);
      return Response.json({ error: (e as Error).message }, { status: 500 });
    }
  },

  // Plan Square - Activate (execute) a plan for this week or next week
  'POST /api/plan-square/activate': async (req) => {
    try {
      const { planId, startWeek } = await req.json();

      if (!planId) {
        return Response.json({ error: 'planId required' }, { status: 400 });
      }

      const plan = sqlite.query('SELECT * FROM plan_square WHERE id = ?').get(planId) as {
        id: string;
        name: string;
        target_distance: string;
        target_time: number;
        vdot: number;
        pace_e: number;
        pace_m: number;
        pace_t: number;
        pace_i: number;
        pace_r: number;
        weeks: number;
        plan_desc: string | null;
      } | undefined;

      if (!plan) {
        return Response.json({ error: 'Plan not found' }, { status: 404 });
      }

      const weeksResult = sqlite.query(`
        SELECT id, week_index FROM plan_square_weekly WHERE plan_id = ? ORDER BY week_index
      `).all(planId) as Array<{ id: string; week_index: number }>;

      const today = new Date();
      const getMonday = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        date.setHours(0, 0, 0, 0);
        return date;
      };

      let startDate = getMonday(today);
      if (startWeek === 'next_week') {
        startDate.setDate(startDate.getDate() + 7);
      }

      const calendarEntries = [];

      for (let weekOffset = 0; weekOffset < plan.weeks; weekOffset++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + weekOffset * 7);

        const weeklyPlan = weeksResult.find((w) => w.week_index === weekOffset + 1);
        if (!weeklyPlan) continue;

        const daysResult = sqlite.query(`
          SELECT id, day_index, day_desc FROM plan_square_daily
          WHERE weekly_plan_id = ? ORDER BY day_index
        `).all(weeklyPlan.id) as Array<{ id: string; day_index: number; day_desc: string | null }>;

        for (const day of daysResult) {
          const entryDate = new Date(weekStart);
          entryDate.setDate(entryDate.getDate() + day.day_index - 1);

          const dateStr = entryDate.getFullYear() + '-' +
            String(entryDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(entryDate.getDate()).padStart(2, '0');

          calendarEntries.push({
            date: dateStr,
            dailyPlanId: day.id,
            dayDesc: day.day_desc,
          });
        }
      }

      return Response.json({
        success: true,
        plan: {
          id: plan.id,
          name: plan.name,
          targetDistance: plan.target_distance,
          targetTime: plan.target_time,
          vdot: plan.vdot,
          paceE: plan.pace_e,
          paceM: plan.pace_m,
          paceT: plan.pace_t,
          paceI: plan.pace_i,
          paceR: plan.pace_r,
          weeks: plan.weeks,
          planDesc: plan.plan_desc,
        },
        calendarEntries,
        startWeek,
      });
    } catch (e) {
      console.error('Activate error:', e);
      return Response.json({ error: (e as Error).message }, { status: 500 });
    }
  },
};

// ============================================================================
// Static File Handler
// ============================================================================

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function serveStatic(url: URL) {
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  const fullPath = DIST_DIR + filePath;

  try {
    const file = Bun.file(fullPath);
    if (file.size > 0) {
      const ext = filePath.substring(filePath.lastIndexOf('.'));
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      return new Response(file, {
        headers: { 'Content-Type': contentType },
      });
    }
  } catch {
    // File not found or error
  }
  return null;
}

// ============================================================================
// Server
// ============================================================================

const server = Bun.serve({
  port: PORT,
  idleTimeout: 60,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Serve static files from web-test directory
    if (method === 'GET' && !path.startsWith('/api')) {
      const staticResponse = serveStatic(url);
      if (staticResponse) return staticResponse;
    }

    // API Routes
    try {
      // Dynamic route matching
      if (path === '/api/vdot' && method === 'POST') {
        return routes['POST /api/vdot'](req, url);
      }
      if (path === '/api/vdot/adjust' && method === 'POST') {
        return routes['POST /api/vdot/adjust'](req, url);
      }
      if (path === '/api/unit/format' && method === 'POST') {
        return routes['POST /api/unit/format'](req, url);
      }
      if (path === '/api/plan' && method === 'POST') {
        return routes['POST /api/plan'](req, url);
      }
      if (path === '/api/calendar/activate' && method === 'POST') {
        return routes['POST /api/calendar/activate'](req, url);
      }
      if (path.startsWith('/api/calendar/') && method === 'GET') {
        const date = path.split('/').pop();
        url.searchParams.set('date', date!);
        return routes['GET /api/calendar'](req, url);
      }
      if (path.startsWith('/api/checkins/') && method === 'GET') {
        const date = path.split('/').pop();
        url.searchParams.set('date', date!);
        return routes['GET /api/checkins'](req, url);
      }
      if (path === '/api/unit' && method === 'POST') {
        return routes['POST /api/unit'](req, url);
      }
      if (path === '/api/dailyplan' && method === 'POST') {
        return routes['POST /api/dailyplan'](req, url);
      }
      if (path === '/api/current-vdot' && method === 'GET') {
        return routes['GET /api/current-vdot'](req, url);
      }
      if (path === '/api/dailyplan-with-units' && method === 'POST') {
        return routes['POST /api/dailyplan-with-units'](req, url);
      }
      if (path === '/api/dailyplans' && method === 'GET') {
        return routes['GET /api/dailyplans'](req, url);
      }
      if (path.startsWith('/api/unit/') && method === 'DELETE') {
        const unitId = path.split('/').pop();
        url.searchParams.set('id', unitId!);
        return routes['DELETE /api/unit'](req, url);
      }
      if (path.startsWith('/api/dailyplan/') && method === 'GET') {
        const dailyPlanId = path.split('/').pop();
        url.searchParams.set('id', dailyPlanId!);
        return routes['GET /api/dailyplan'](req, url);
      }
      if (path === '/api/checkin' && method === 'POST') {
        return routes['POST /api/checkin'](req, url);
      }
      if (path === '/api/checkin/from-plan' && method === 'POST') {
        return routes['POST /api/checkin/from-plan'](req, url);
      }
      if (path === '/api/user' && method === 'POST') {
        return routes['POST /api/user'](req, url);
      }
      if (path.startsWith('/api/history/') && method === 'GET') {
        const parts = path.split('/');
        url.searchParams.set('year', parts[2]);
        url.searchParams.set('month', parts[3]);
        return routes['GET /api/history'](req, url);
      }
      if (path === '/api/data' && method === 'GET') {
        return routes['GET /api/data'](req, url);
      }
      if (path === '/api/templates' && method === 'GET') {
        return routes['GET /api/templates'](req, url);
      }
      if (path.startsWith('/api/template/') && path.endsWith('/units') && method === 'GET') {
        const templateId = path.split('/')[3];
        url.searchParams.set('id', templateId);
        url.searchParams.set('units', 'true');
        return routes['GET /api/template'](req, url);
      }
      if (path.startsWith('/api/template/') && path.endsWith('/use') && method === 'POST') {
        const templateId = path.split('/')[3];
        url.searchParams.set('id', templateId);
        return routes['POST /api/template/use'](req, url);
      }
      if (path.startsWith('/api/template/') && !path.includes('/') && method === 'DELETE') {
        const templateId = path.split('/')[3];
        url.searchParams.set('id', templateId);
        return routes['DELETE /api/template'](req, url);
      }
      if (path.startsWith('/api/template/') && method === 'GET') {
        const templateId = path.split('/')[3];
        url.searchParams.set('id', templateId);
        return routes['GET /api/template'](req, url);
      }
      if (path === '/api/user-favorites' && method === 'GET') {
        return routes['GET /api/user-favorites'](req, url);
      }
      if (path === '/api/user-favorite' && method === 'POST') {
        return routes['POST /api/user-favorite'](req, url);
      }
      if (path.startsWith('/api/user-favorite/') && method === 'DELETE') {
        const id = path.split('/')[3];
        url.searchParams.set('id', id);
        return routes['DELETE /api/user-favorite'](req, url);
      }
      if (path === '/api/auth/apple' && method === 'POST') {
        return routes['POST /api/auth/apple'](req, url);
      }
      if (path === '/api/backup' && method === 'POST') {
        return routes['POST /api/backup'](req, url);
      }
      if (path === '/api/backup' && method === 'GET') {
        return routes['GET /api/backup'](req, url);
      }
      if (path === '/api/plan-square' && method === 'GET') {
        return routes['GET /api/plan-square'](req, url);
      }
      if (path === '/api/plan-square/activate' && method === 'POST') {
        return routes['POST /api/plan-square/activate'](req, url);
      }

      return Response.json({ error: 'Not found' }, { status: 404, headers });

    } catch (e) {
      console.error(e);
      return Response.json({ error: (e as Error).message }, { status: 500, headers });
    }
  },
});

console.log('Ruff API Server running at http://localhost:' + PORT);
console.log('Web UI available at http://localhost:' + PORT);

export default server;
