/**
 * Query script to view Ruff database
 * Run with: bun run src/db/query.ts
 */

const sqlite = new (require('bun:sqlite').Database)('ruff.db');

console.log('=== Ruff Database Query ===\n');

// User
console.log('--- User ---');
const user = sqlite.prepare('SELECT * FROM user WHERE id = ?').get('local');
console.log(user);

// Plan
console.log('\n--- Plan ---');
const plans = sqlite.prepare('SELECT * FROM plan').all();
for (const p of plans) {
  console.log(p);
}

// Weekly Plans
console.log('\n--- Weekly Plans (first 3) ---');
const weeklyPlans = sqlite.prepare('SELECT * FROM weekly_plan LIMIT 3').all();
for (const w of weeklyPlans) {
  console.log(w);
}

// Daily Plans for Week 1
console.log('\n--- Daily Plans for Week 1 ---');
const week1Id = sqlite.prepare('SELECT id FROM weekly_plan WHERE week_index = ?').get(1) as any;
if (week1Id) {
  const dailyPlans = sqlite.prepare('SELECT * FROM daily_plan WHERE weekly_plan_id = ?').all(week1Id.id);
  for (const d of dailyPlans) {
    console.log(d);
  }
}

// Units for first day of Week 1
console.log('\n--- Units for Monday of Week 1 ---');
const mondayId = sqlite.prepare('SELECT id FROM daily_plan WHERE weekly_plan_id = ? AND day_index = ?').get(week1Id?.id, 1) as any;
if (mondayId) {
  const units = sqlite.prepare('SELECT * FROM unit WHERE daily_plan_id = ?').all(mondayId.id);
  for (const u of units) {
    console.log(u);
  }
}

// Calendar
console.log('\n--- Calendar Entries ---');
const calendarEntries = sqlite.prepare('SELECT * FROM user_plan_calendar ORDER BY date LIMIT 10').all();
for (const c of calendarEntries) {
  console.log(c);
}

// Check-in Records
console.log('\n--- Check-in Records ---');
const checkIns = sqlite.prepare('SELECT * FROM check_in_record').all();
for (const ci of checkIns) {
  console.log(ci);
}

// Daily Overviews
console.log('\n--- Daily Overviews ---');
const overviews = sqlite.prepare('SELECT * FROM check_in_daily_overview').all();
for (const o of overviews) {
  console.log(o);
}

sqlite.close();
