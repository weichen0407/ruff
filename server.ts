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
  `);
}

initDb();

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
