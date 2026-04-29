import { db, getDatabase } from '@/db';
import { schema } from '@/db';
import { generateId, now } from '@/db/utils';
import type { SquarePlan } from './square';

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// ============================================================================
// Local seed — mirrors server seedPlanSquare, writes to expo-sqlite
// ============================================================================

function localUnit(dailyId: string, idx: number, type: string, orderIndex: number, paceMode: string | null, paceValue: string | null, standardType: string | null, standardValue: number | null, standard: string | null, content: string | null) {
  return {
    id: `${dailyId}-u${idx}`,
    type: type as 'run' | 'rest' | 'other',
    orderIndex,
    paceMode,
    paceValue,
    standardType,
    standardValue,
    standard,
    content,
  };
}

function localDay(id: string, weekId: string, dayIndex: number, dayDesc: string, units: ReturnType<typeof localUnit>[]) {
  return {
    id,
    dayIndex,
    dayDesc,
    units,
  };
}

function localWeek(id: string, planId: string, weekIndex: number, weekDesc: string, days: ReturnType<typeof localDay>[]) {
  return {
    id,
    weekIndex,
    weekDesc,
    days,
  };
}

export async function seedLocalDatabase(): Promise<void> {
  await getDatabase();

  const planId = 'plan-5k-001';

  // Build weeksData matching server seed structure
  const weeksData: SquarePlan['weeksData'] = [
    // Week 1
    localWeek('ps-w1', planId, 1, '第1周：适应期', [
      localDay('ps-w1d1', 'ps-w1', 1, '周一：休息', []),
      localDay('ps-w1d2', 'ps-w1', 2, '周二：E跑40分钟', [
        localUnit('ps-w1d2', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w1d2', 2, 'run', 2, 'E', '5:30', 'time', 1500, '主训练', null),
        localUnit('ps-w1d2', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w1d3', 'ps-w1', 3, '周三：休息', []),
      localDay('ps-w1d4', 'ps-w1', 4, '周四：E跑40分钟', [
        localUnit('ps-w1d4', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w1d4', 2, 'run', 2, 'E', '5:30', 'time', 1500, '主训练', null),
        localUnit('ps-w1d4', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w1d5', 'ps-w1', 5, '周五：休息', []),
      localDay('ps-w1d6', 'ps-w1', 6, '周六：E跑50分钟', [
        localUnit('ps-w1d6', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w1d6', 2, 'run', 2, 'E', '5:30', 'time', 2100, '主训练', null),
        localUnit('ps-w1d6', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w1d7', 'ps-w1', 7, '周日：休息', []),
    ]),
    // Week 2
    localWeek('ps-w2', planId, 2, '第2周：基础期', [
      localDay('ps-w2d1', 'ps-w2', 1, '周一：休息', []),
      localDay('ps-w2d2', 'ps-w2', 2, '周二：E跑45分钟', [
        localUnit('ps-w2d2', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w2d2', 2, 'run', 2, 'E', '5:30', 'time', 1800, '主训练', null),
        localUnit('ps-w2d2', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w2d3', 'ps-w2', 3, '周三：休息', []),
      localDay('ps-w2d4', 'ps-w2', 4, '周四：E跑45分钟', [
        localUnit('ps-w2d4', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w2d4', 2, 'run', 2, 'E', '5:30', 'time', 1800, '主训练', null),
        localUnit('ps-w2d4', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w2d5', 'ps-w2', 5, '周五：休息', []),
      localDay('ps-w2d6', 'ps-w2', 6, '周六：E跑60分钟', [
        localUnit('ps-w2d6', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w2d6', 2, 'run', 2, 'E', '5:30', 'time', 2700, '主训练', null),
        localUnit('ps-w2d6', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w2d7', 'ps-w2', 7, '周日：休息', []),
    ]),
    // Week 3
    localWeek('ps-w3', planId, 3, '第3周：提升期', [
      localDay('ps-w3d1', 'ps-w3', 1, '周一：休息', []),
      localDay('ps-w3d2', 'ps-w3', 2, '周二：E跑50分钟', [
        localUnit('ps-w3d2', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w3d2', 2, 'run', 2, 'E', '5:20', 'time', 2100, '主训练', null),
        localUnit('ps-w3d2', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w3d3', 'ps-w3', 3, '周三：T跑25分钟', [
        localUnit('ps-w3d3', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w3d3', 2, 'run', 2, 'T', '5:00', 'time', 1500, 'T训练', null),
        localUnit('ps-w3d3', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w3d4', 'ps-w3', 4, '周四：E跑50分钟', [
        localUnit('ps-w3d4', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w3d4', 2, 'run', 2, 'E', '5:20', 'time', 2100, '主训练', null),
        localUnit('ps-w3d4', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w3d5', 'ps-w3', 5, '周五：休息', []),
      localDay('ps-w3d6', 'ps-w3', 6, '周六：E跑65分钟', [
        localUnit('ps-w3d6', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w3d6', 2, 'run', 2, 'E', '5:20', 'time', 3000, '主训练', null),
        localUnit('ps-w3d6', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w3d7', 'ps-w3', 7, '周日：休息', []),
    ]),
    // Week 4
    localWeek('ps-w4', planId, 4, '第4周：巩固期', [
      localDay('ps-w4d1', 'ps-w4', 1, '周一：休息', []),
      localDay('ps-w4d2', 'ps-w4', 2, '周二：E跑55分钟', [
        localUnit('ps-w4d2', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w4d2', 2, 'run', 2, 'E', '5:20', 'time', 2400, '主训练', null),
        localUnit('ps-w4d2', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w4d3', 'ps-w4', 3, '周三：T跑30分钟', [
        localUnit('ps-w4d3', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w4d3', 2, 'run', 2, 'T', '5:00', 'time', 1800, 'T训练', null),
        localUnit('ps-w4d3', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w4d4', 'ps-w4', 4, '周四：E跑55分钟', [
        localUnit('ps-w4d4', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w4d4', 2, 'run', 2, 'E', '5:20', 'time', 2400, '主训练', null),
        localUnit('ps-w4d4', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w4d5', 'ps-w4', 5, '周五：休息', []),
      localDay('ps-w4d6', 'ps-w4', 6, '周六：E跑70分钟', [
        localUnit('ps-w4d6', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w4d6', 2, 'run', 2, 'E', '5:20', 'time', 3300, '主训练', null),
        localUnit('ps-w4d6', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w4d7', 'ps-w4', 7, '周日：休息', []),
    ]),
    // Week 5
    localWeek('ps-w5', planId, 5, '第5周：强化期', [
      localDay('ps-w5d1', 'ps-w5', 1, '周一：休息', []),
      localDay('ps-w5d2', 'ps-w5', 2, '周二：E跑60分钟', [
        localUnit('ps-w5d2', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w5d2', 2, 'run', 2, 'E', '5:15', 'time', 2700, '主训练', null),
        localUnit('ps-w5d2', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w5d3', 'ps-w5', 3, '周三：T跑30分钟', [
        localUnit('ps-w5d3', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w5d3', 2, 'run', 2, 'T', '5:00', 'time', 1800, 'T训练', null),
        localUnit('ps-w5d3', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w5d4', 'ps-w5', 4, '周四：E跑60分钟', [
        localUnit('ps-w5d4', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w5d4', 2, 'run', 2, 'E', '5:15', 'time', 2700, '主训练', null),
        localUnit('ps-w5d4', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w5d5', 'ps-w5', 5, '周五：休息', []),
      localDay('ps-w5d6', 'ps-w5', 6, '周六：E跑75分钟', [
        localUnit('ps-w5d6', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w5d6', 2, 'run', 2, 'E', '5:15', 'time', 3600, '主训练', null),
        localUnit('ps-w5d6', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w5d7', 'ps-w5', 7, '周日：休息', []),
    ]),
    // Week 6
    localWeek('ps-w6', planId, 6, '第6周：巅峰期', [
      localDay('ps-w6d1', 'ps-w6', 1, '周一：休息', []),
      localDay('ps-w6d2', 'ps-w6', 2, '周二：E跑65分钟', [
        localUnit('ps-w6d2', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w6d2', 2, 'run', 2, 'E', '5:15', 'time', 3000, '主训练', null),
        localUnit('ps-w6d2', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w6d3', 'ps-w6', 3, '周三：T跑35分钟', [
        localUnit('ps-w6d3', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w6d3', 2, 'run', 2, 'T', '5:00', 'time', 2100, 'T训练', null),
        localUnit('ps-w6d3', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w6d4', 'ps-w6', 4, '周四：E跑65分钟', [
        localUnit('ps-w6d4', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w6d4', 2, 'run', 2, 'E', '5:15', 'time', 3000, '主训练', null),
        localUnit('ps-w6d4', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w6d5', 'ps-w6', 5, '周五：休息', []),
      localDay('ps-w6d6', 'ps-w6', 6, '周六：E跑80分钟', [
        localUnit('ps-w6d6', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w6d6', 2, 'run', 2, 'E', '5:15', 'time', 3900, '主训练', null),
        localUnit('ps-w6d6', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w6d7', 'ps-w6', 7, '周日：休息', []),
    ]),
    // Week 7
    localWeek('ps-w7', planId, 7, '第7周：减量期', [
      localDay('ps-w7d1', 'ps-w7', 1, '周一：休息', []),
      localDay('ps-w7d2', 'ps-w7', 2, '周二：E跑50分钟', [
        localUnit('ps-w7d2', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w7d2', 2, 'run', 2, 'E', '5:30', 'time', 2100, '主训练', null),
        localUnit('ps-w7d2', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w7d3', 'ps-w7', 3, '周三：T跑20分钟', [
        localUnit('ps-w7d3', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w7d3', 2, 'run', 2, 'T', '5:00', 'time', 1200, 'T训练', null),
        localUnit('ps-w7d3', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w7d4', 'ps-w7', 4, '周四：E跑50分钟', [
        localUnit('ps-w7d4', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w7d4', 2, 'run', 2, 'E', '5:30', 'time', 2100, '主训练', null),
        localUnit('ps-w7d4', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w7d5', 'ps-w7', 5, '周五：休息', []),
      localDay('ps-w7d6', 'ps-w7', 6, '周六：E跑60分钟', [
        localUnit('ps-w7d6', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w7d6', 2, 'run', 2, 'E', '5:30', 'time', 2700, '主训练', null),
        localUnit('ps-w7d6', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w7d7', 'ps-w7', 7, '周日：休息', []),
    ]),
    // Week 8
    localWeek('ps-w8', planId, 8, '第8周：比赛周', [
      localDay('ps-w8d1', 'ps-w8', 1, '周一：休息', []),
      localDay('ps-w8d2', 'ps-w8', 2, '周二：E跑40分钟', [
        localUnit('ps-w8d2', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w8d2', 2, 'run', 2, 'E', '5:30', 'time', 1500, '主训练', null),
        localUnit('ps-w8d2', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w8d3', 'ps-w8', 3, '周三：休息', []),
      localDay('ps-w8d4', 'ps-w8', 4, '周四：E跑30分钟', [
        localUnit('ps-w8d4', 1, 'run', 1, 'E', '6:00', 'time', 600, '热身', '轻松跑热身'),
        localUnit('ps-w8d4', 2, 'run', 2, 'E', '5:30', 'time', 900, '主训练', null),
        localUnit('ps-w8d4', 3, 'other', 3, null, null, 'time', 300, '冷身', '拉伸放松'),
      ]),
      localDay('ps-w8d5', 'ps-w8', 5, '周五：休息', []),
      localDay('ps-w8d6', 'ps-w8', 6, '周六：比赛日！', [
        localUnit('ps-w8d6', 1, 'run', 1, null, null, 'distance', 5000, '比赛', '5K比赛日！全力以赴！'),
      ]),
      localDay('ps-w8d7', 'ps-w8', 7, '周日：休息恢复', []),
    ]),
  ];

  const seedPlan: SquarePlan = {
    id: planId,
    name: '8周5K训练计划',
    targetDistance: '5k',
    targetTime: 1800,
    vdot: 45.0,
    paceE: 330,
    paceM: 300,
    paceT: 275,
    paceI: 255,
    paceR: 240,
    weeks: 8,
    planDesc: '适合初学者的8周5K训练计划，每周3-4次训练',
    weeksData,
  };

  await savePlanToLocal(seedPlan);
  console.log('[Seed] Local database seeded');
}

// ============================================================================
// savePlanToLocal
// ============================================================================

export async function savePlanToLocal(squarePlan: SquarePlan): Promise<void> {
  await getDatabase();

  // 1. Insert plan
  await db.insert(schema.plan).values({
    id: squarePlan.id,
    name: squarePlan.name,
    targetDistance: squarePlan.targetDistance as '5k' | '10k' | 'half' | 'full',
    targetTime: squarePlan.targetTime,
    vdot: squarePlan.vdot,
    paceE: squarePlan.paceE,
    paceM: squarePlan.paceM,
    paceT: squarePlan.paceT,
    paceI: squarePlan.paceI,
    paceR: squarePlan.paceR,
    weeks: squarePlan.weeks,
    desc: squarePlan.planDesc,
    createdAt: now(),
    updatedAt: now(),
  }).onConflictDoNothing();

  // 2. Insert weekly plans, daily plans, units
  for (const week of squarePlan.weeksData) {
    await db.insert(schema.weeklyPlan).values({
      id: week.id,
      planId: squarePlan.id,
      weekIndex: week.weekIndex,
      desc: week.weekDesc,
    }).onConflictDoNothing();

    for (const day of week.days) {
      await db.insert(schema.dailyPlan).values({
        id: day.id,
        weeklyPlanId: week.id,
        dayIndex: day.dayIndex,
        desc: day.dayDesc,
      }).onConflictDoNothing();

      for (const unit of day.units) {
        await db.insert(schema.unit).values({
          id: unit.id,
          dailyPlanId: day.id,
          type: unit.type,
          orderIndex: unit.orderIndex,
          paceMode: unit.paceMode as 'vdot' | 'custom' | null,
          paceValue: unit.paceValue,
          standardType: unit.standardType as 'time' | 'distance' | null,
          standardValue: unit.standardValue,
          standard: unit.standard as 'time' | 'distance' | null,
          content: unit.content,
        }).onConflictDoNothing();
      }
    }
  }

  // 3. Create calendar entries starting from this Monday
  const startDate = getMonday(new Date());
  for (let weekOffset = 0; weekOffset < squarePlan.weeks; weekOffset++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + weekOffset * 7);

    const week = squarePlan.weeksData[weekOffset];
    if (!week) continue;

    for (const day of week.days) {
      const entryDate = new Date(weekStart);
      entryDate.setDate(entryDate.getDate() + day.dayIndex - 1);

      const dateStr =
        entryDate.getFullYear() + '-' +
        String(entryDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(entryDate.getDate()).padStart(2, '0');

      await db.insert(schema.userPlanCalendar).values({
        id: generateId(),
        planId: squarePlan.id,
        date: dateStr,
        dailyPlanId: day.id,
        status: 'pending',
      }).onConflictDoNothing();
    }
  }
}
