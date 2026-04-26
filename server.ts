/**
 * Ruff API & Web UI
 * Simple web interface to test all modules
 */

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './src/db/schema/index.ts';
import { generateId, now } from './src/db/utils.ts';
import { calculateVdot, getPaceZones, adjustPace } from './src/lib/vdot/index.ts';
import { formatDuration, formatDistance, formatPace } from './src/lib/unit/index.ts';

const dbPath = './ruff-web.db';
const PORT = 3000;

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
// HTML Page
// ============================================================================

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ruff API 测试</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #fff;
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 900px; margin: 0 auto; }
    h1 {
      font-size: 28px;
      margin-bottom: 8px;
      color: #FF6B00;
    }
    .subtitle { color: #888; margin-bottom: 24px; }
    .card {
      background: #1a1a1a;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .card h2 {
      font-size: 16px;
      color: #FF6B00;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section { margin-bottom: 24px; }
    .form-row {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    label {
      display: block;
      font-size: 12px;
      color: #888;
      margin-bottom: 4px;
    }
    input, select {
      background: #2a2a2a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 8px 12px;
      color: #fff;
      font-size: 14px;
      min-width: 120px;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #FF6B00;
    }
    button {
      background: #FF6B00;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      font-size: 14px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.8; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .result {
      background: #0f0f0f;
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
      white-space: pre-wrap;
      overflow-x: auto;
      max-height: 300px;
      overflow-y: auto;
    }
    .success { border-left: 3px solid #22C55E; }
    .error { border-left: 3px solid #EF4444; color: #EF4444; }
    .info { border-left: 3px solid #3B82F6; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid #333;
    }
    th { color: #888; font-weight: normal; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      background: #333;
    }
    .badge.pending { background: #F97316; }
    .badge.completed { background: #22C55E; }
    .badge.skipped { background: #6B7280; }
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      overflow-x: auto;
    }
    .tab {
      padding: 8px 16px;
      background: transparent;
      border: none;
      color: #888;
      cursor: pointer;
      border-radius: 8px;
      font-size: 14px;
      white-space: nowrap;
    }
    .tab.active {
      background: #FF6B00;
      color: #fff;
    }
    .tab:hover:not(.active) { background: #2a2a2a; }
    .hidden { display: none; }
    .unit-item {
      padding: 6px 10px;
      background: #1a1a1a;
      border-radius: 6px;
      margin-bottom: 4px;
      font-size: 13px;
    }
    .unit-item.run { border-left: 3px solid #3B82F6; }
    .unit-item.rest { border-left: 3px solid #22C55E; }
    .unit-item.other { border-left: 3px solid #6B7280; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Ruff API 测试</h1>
    <p class="subtitle">本地优先跑步训练追踪应用 - 模块验证</p>

    <div class="tabs">
      <button class="tab active" onclick="showTab('vdot')">VDOT</button>
      <button class="tab" onclick="showTab('plan')">计划</button>
      <button class="tab" onclick="showTab('calendar')">日历</button>
      <button class="tab" onclick="showTab('training')">训练</button>
      <button class="tab" onclick="showTab('checkin')">打卡</button>
      <button class="tab" onclick="showTab('user')">用户</button>
      <button class="tab" onclick="showTab('history')">历史</button>
      <button class="tab" onclick="showTab('data')">数据</button>
    </div>

    <!-- VDOT Section -->
    <div id="tab-vdot" class="section">
      <div class="card">
        <h2>VDOT 计算</h2>
        <div class="form-row">
          <div>
            <label>目标距离</label>
            <select id="vdot-distance">
              <option value="5">5K</option>
              <option value="10">10K</option>
              <option value="21.0975">半马</option>
              <option value="42.195">全马</option>
            </select>
          </div>
          <div>
            <label>目标时间 (分钟)</label>
            <input type="number" id="vdot-time" value="20" min="1" max="600">
          </div>
          <div style="align-self: flex-end;">
            <button onclick="calcVdot()">计算</button>
          </div>
        </div>
        <div id="vdot-result" class="result info hidden"></div>
      </div>

      <div class="card">
        <h2>配速微调</h2>
        <div class="form-row">
          <div>
            <label>基础配速 (秒/km)</label>
            <input type="number" id="adjust-base" value="300">
          </div>
          <div>
            <label>调整表达式</label>
            <input type="text" id="adjust-expr" value="E+10" placeholder="E+10, R-5, M+0">
          </div>
          <div style="align-self: flex-end;">
            <button onclick="calcAdjust()">调整</button>
          </div>
        </div>
        <div id="adjust-result" class="result info hidden"></div>
      </div>
    </div>

    <!-- Plan Section -->
    <div id="tab-plan" class="section hidden">
      <div class="card">
        <h2>创建训练计划</h2>
        <div class="form-row">
          <div>
            <label>计划名称</label>
            <input type="text" id="plan-name" value="我的5K训练计划">
          </div>
          <div>
            <label>目标</label>
            <select id="plan-distance">
              <option value="5k">5K</option>
              <option value="10k">10K</option>
              <option value="half">半马</option>
              <option value="full">全马</option>
            </select>
          </div>
          <div>
            <label>目标时间 (分钟)</label>
            <input type="number" id="plan-time" value="20">
          </div>
          <div>
            <label>周数</label>
            <input type="number" id="plan-weeks" value="8" min="1" max="52">
          </div>
          <div style="align-self: flex-end;">
            <button onclick="createPlan()">创建</button>
          </div>
        </div>
        <div id="plan-result" class="result hidden"></div>
      </div>

      <div class="card">
        <h2>格式化测试</h2>
        <div class="form-row">
          <div>
            <label>时长 (秒)</label>
            <input type="number" id="fmt-duration" value="3661">
          </div>
          <div>
            <label>距离 (km)</label>
            <input type="number" id="fmt-distance" value="0.8" step="0.1">
          </div>
          <div>
            <label>配速 (秒/km)</label>
            <input type="number" id="fmt-pace" value="270">
          </div>
          <div style="align-self: flex-end;">
            <button onclick="testFormat()">测试</button>
          </div>
        </div>
        <div id="fmt-result" class="result info hidden"></div>
      </div>
    </div>

    <!-- Calendar Section -->
    <div id="tab-calendar" class="section hidden">
      <div class="card">
        <h2>激活计划到日历</h2>
        <div class="form-row">
          <div>
            <label>计划 ID</label>
            <input type="text" id="cal-plan-id" placeholder="点击查询获取">
          </div>
          <div>
            <label>开始时间</label>
            <select id="cal-start">
              <option value="this_week">本周</option>
              <option value="next_week">下周</option>
            </select>
          </div>
          <div style="align-self: flex-end;">
            <button onclick="activatePlan()">激活</button>
          </div>
        </div>
        <div id="cal-result" class="result hidden"></div>
      </div>

      <div class="card">
        <h2>查询日程</h2>
        <div class="form-row">
          <div>
            <label>日期 (YYYY-MM-DD)</label>
            <input type="date" id="cal-query-date">
          </div>
          <div style="align-self: flex-end;">
            <button onclick="querySchedule()">查询</button>
          </div>
        </div>
        <div id="cal-query-result" class="result info hidden"></div>
      </div>
    </div>

    <!-- Training Section -->
    <div id="tab-training" class="section hidden">
      <div class="card">
        <h2>当前 VDOT</h2>
        <div id="training-current-vdot" class="result info">加载中...</div>
      </div>

      <div class="card">
        <h2>创建训练计划</h2>
        <div class="form-row">
          <div>
            <label>计划名称</label>
            <input type="text" id="training-name" placeholder="如：周三轻松跑">
          </div>
          <div style="align-self: flex-end; margin-left: 12px;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="training-is-template">
              存入个人模版库
            </label>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>添加训练单元</h2>
        <div class="form-row">
          <div>
            <label>类型</label>
            <select id="training-unit-type" onchange="onUnitTypeChange()">
              <option value="run">跑步</option>
              <option value="rest">休息</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div id="pace-mode-container">
            <label>配速模式</label>
            <select id="training-unit-pace-mode" onchange="onPaceModeChange()">
              <option value="">无</option>
              <option value="vdot">VDOT区</option>
              <option value="custom">自定义配速</option>
            </select>
          </div>
        </div>

        <!-- VDOT Zone Selector -->
        <div id="vdot-zone-container" style="display: none; margin-top: 12px;">
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <button class="vdot-zone-btn" data-zone="E" onclick="selectVdotZone('E')" style="background: #22C55E; color: white; border: none; border-radius: 8px; padding: 10px 16px; font-weight: bold; cursor: pointer;">E</button>
            <button class="vdot-zone-btn" data-zone="M" onclick="selectVdotZone('M')" style="background: #3B82F6; color: white; border: none; border-radius: 8px; padding: 10px 16px; font-weight: bold; cursor: pointer;">M</button>
            <button class="vdot-zone-btn" data-zone="T" onclick="selectVdotZone('T')" style="background: #F97316; color: white; border: none; border-radius: 8px; padding: 10px 16px; font-weight: bold; cursor: pointer;">T</button>
            <button class="vdot-zone-btn" data-zone="I" onclick="selectVdotZone('I')" style="background: #EF4444; color: white; border: none; border-radius: 8px; padding: 10px 16px; font-weight: bold; cursor: pointer;">I</button>
            <button class="vdot-zone-btn" data-zone="R" onclick="selectVdotZone('R')" style="background: #6B7280; color: white; border: none; border-radius: 8px; padding: 10px 16px; font-weight: bold; cursor: pointer;">R</button>
          </div>
          <div id="vdot-adjust-container" style="display: none; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="vdot-selected-zone" style="font-weight: bold; min-width: 30px;"></span>
              <span style="color: #888;">调整:</span>
              <button onclick="adjustVdot(-10)" style="padding: 4px 8px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">-10s</button>
              <button onclick="adjustVdot(-5)" style="padding: 4px 8px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">-5s</button>
              <button onclick="adjustVdot(5)" style="padding: 4px 8px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">+5s</button>
              <button onclick="adjustVdot(10)" style="padding: 4px 8px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">+10s</button>
            </div>
          </div>
          <div id="vdot-preview" style="color: #888; font-size: 13px; margin-top: 8px;"></div>
          <input type="hidden" id="training-unit-pace-value">
        </div>

        <!-- Custom Pace Input -->
        <div id="pace-value-container" style="display: none; margin-top: 12px;">
          <label>配速值</label>
          <input type="text" id="training-unit-pace-value" placeholder="mm:ss (如 4:30, 5:00)" style="margin-top: 4px;">
          <div id="pace-value-error" style="color: #EF4444; font-size: 11px; margin-top: 2px; display: none;"></div>
        </div>

        <div class="form-row" style="margin-top: 12px;">
          <div>
            <label>标准类型</label>
            <select id="training-unit-standard-type">
              <option value="">无</option>
              <option value="time">时间</option>
              <option value="distance">距离</option>
            </select>
          </div>
          <div>
            <label>标准值</label>
            <input type="number" id="training-unit-standard-value" placeholder="秒或米">
          </div>
          <div>
            <label>内容 (其他类型)</label>
            <input type="text" id="training-unit-content" placeholder="力量训练">
          </div>
        </div>
        <div style="margin-top: 12px;">
          <button onclick="addUnitToStaging()">添加到列表</button>
        </div>
      </div>

      <div class="card">
        <h2>待创建的单元 (<span id="training-staging-count">0</span>)</h2>
        <div id="training-staging-list" style="margin-bottom: 12px;">
          <div style="color: #888; font-size: 13px;">暂无单元，请添加</div>
        </div>
        <button onclick="createDailyPlanWithUnits()" style="background: #22C55E; font-size: 16px; padding: 12px 24px;">创建 DailyPlan</button>
        <div id="training-create-result" class="result hidden" style="margin-top: 12px;"></div>
      </div>

      <div class="card">
        <h2>所有 DailyPlans</h2>
        <button onclick="loadAllDailyPlans()" style="margin-bottom: 12px;">刷新</button>
        <div id="training-all-list" class="result info"></div>
      </div>
    </div>

    <!-- Checkin Section -->
    <div id="tab-checkin" class="section hidden">
      <div class="card">
        <h2>打卡</h2>
        <div class="form-row">
          <div>
            <label>日期</label>
            <input type="date" id="checkin-date" onchange="loadCheckinForm()">
          </div>
          <div style="align-self: flex-end;">
            <button onclick="loadCheckinForm()">加载</button>
          </div>
        </div>
        <div id="checkin-today-status" class="result info hidden"></div>
      </div>

      <div class="card" id="checkin-records-card" style="display: none;">
        <h2 id="checkin-records-title">今日打卡记录</h2>
        <div id="checkin-records-list"></div>
      </div>

      <div class="card" id="checkin-plan-card" style="display: none;">
        <h2>今日计划</h2>
        <div id="checkin-plan-info"></div>
        <div style="margin-top: 12px;">
          <button onclick="checkinFromPlan()" style="background: #22C55E;">按计划打卡</button>
        </div>
      </div>

      <div class="card" id="checkin-form-card">
        <h2 id="checkin-form-title">自定义打卡</h2>
        <div class="form-row">
          <div>
            <label>类型</label>
            <select id="checkin-type">
              <option value="run">跑步</option>
              <option value="rest">休息</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div>
            <label>距离 (km)</label>
            <input type="number" id="checkin-distance" value="5" step="0.1">
          </div>
          <div>
            <label>时长 (秒)</label>
            <input type="number" id="checkin-duration" value="1800">
          </div>
          <div>
            <label>感受</label>
            <select id="checkin-feeling">
              <option value="">无</option>
              <option value="easy">轻松</option>
              <option value="moderate">适中</option>
              <option value="hard">吃力</option>
              <option value="painful">痛苦</option>
            </select>
          </div>
        </div>
        <div style="margin-top: 12px;">
          <button onclick="doCustomCheckin()" id="checkin-submit-btn">打卡</button>
        </div>
        <input type="hidden" id="checkin-calendar-entry-id">
      </div>
      <div id="checkin-result" class="result hidden"></div>
    </div>

    <!-- User Section -->
    <div id="tab-user" class="section hidden">
      <div class="card">
        <h2>用户设置</h2>
        <div class="form-row">
          <div>
            <label>目标距离</label>
            <select id="user-distance">
              <option value="5k">5K</option>
              <option value="10k">10K</option>
              <option value="half">半马</option>
              <option value="full">全马</option>
            </select>
          </div>
          <div>
            <label>目标时间 (分钟)</label>
            <input type="number" id="user-time" value="20">
          </div>
          <div style="align-self: flex-end;">
            <button onclick="updateUserGoal()">保存</button>
          </div>
        </div>
        <div id="user-result" class="result info hidden"></div>
      </div>
    </div>

    <!-- History Section -->
    <div id="tab-history" class="section hidden">
      <div class="card">
        <h2>月度统计</h2>
        <div class="form-row">
          <div>
            <label>年份</label>
            <input type="number" id="hist-year" value="2026">
          </div>
          <div>
            <label>月份</label>
            <input type="number" id="hist-month" value="4" min="1" max="12">
          </div>
          <div style="align-self: flex-end;">
            <button onclick="getMonthlyStats()">查询</button>
          </div>
        </div>
        <div id="hist-result" class="result info hidden"></div>
      </div>
    </div>

    <!-- Data Section -->
    <div id="tab-data" class="section hidden">
      <div class="card">
        <h2>数据库内容</h2>
        <button onclick="queryAllData()" style="margin-bottom: 12px;">刷新</button>
        <div id="data-result" class="result info"></div>
      </div>
    </div>
  </div>

  <script>
    const API = '';

    function showTab(name) {
      document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById('tab-' + name).classList.remove('hidden');
      const tabs = ['vdot', 'plan', 'calendar', 'training', 'checkin', 'user', 'history', 'data'];
      const idx = tabs.indexOf(name) + 1;
      document.querySelector('.tab:nth-child(' + idx + ')').classList.add('active');
      if (name === 'data') queryAllData();
      if (name === 'training') {
        loadCurrentVdot();
        loadAllDailyPlans();
      }
    }

    // Training tab staging area
    let stagedUnits = [];
    let currentVdot = null;
    let vdotZones = null;
    let selectedZone = null;
    let zoneAdjustment = 0;

    async function loadCurrentVdot() {
      const data = await api('GET', '/api/current-vdot');
      const el = document.getElementById('training-current-vdot');
      if (data.vdot) {
        currentVdot = data.vdot;
        const sourceText = data.source === 'plan' ? '(来自计划: ' + data.planName + ')' : '(来自用户设置)';
        el.innerHTML = '<strong>VDOT: ' + data.vdot.toFixed(1) + '</strong> ' + sourceText;
        el.className = 'result success';

        // Fetch pace zones
        const zonesData = await api('POST', '/api/vdot', { distance: 5, time: 20 });
        if (zonesData.zones) {
          vdotZones = zonesData.zones;
        }
      } else {
        currentVdot = null;
        vdotZones = null;
        el.innerHTML = '暂无VDOT，请在"用户"页面设置目标或激活计划';
        el.className = 'result info';
      }
    }

    function onUnitTypeChange() {
      const type = document.getElementById('training-unit-type').value;
      const paceModeContainer = document.getElementById('pace-mode-container');
      const paceValueContainer = document.getElementById('pace-value-container');
      const vdotZoneContainer = document.getElementById('vdot-zone-container');

      if (type === 'rest') {
        paceModeContainer.style.display = 'none';
        paceValueContainer.style.display = 'none';
        vdotZoneContainer.style.display = 'none';
        document.getElementById('training-unit-pace-mode').value = '';
        document.getElementById('training-unit-pace-value').value = '';
      } else {
        paceModeContainer.style.display = 'block';
        onPaceModeChange();
      }
    }

    function onPaceModeChange() {
      const paceMode = document.getElementById('training-unit-pace-mode').value;
      const paceValueContainer = document.getElementById('pace-value-container');
      const vdotZoneContainer = document.getElementById('vdot-zone-container');

      if (paceMode === 'vdot') {
        paceValueContainer.style.display = 'none';
        vdotZoneContainer.style.display = 'block';
        selectedZone = null;
        zoneAdjustment = 0;
        updateVdotPreview();
      } else if (paceMode === 'custom') {
        paceValueContainer.style.display = 'block';
        vdotZoneContainer.style.display = 'none';
        document.getElementById('training-unit-pace-value').value = '';
        document.getElementById('training-unit-pace-value').placeholder = 'mm:ss (如 4:30, 5:00)';
      } else {
        paceValueContainer.style.display = 'none';
        vdotZoneContainer.style.display = 'none';
        document.getElementById('training-unit-pace-value').value = '';
      }
    }

    function selectVdotZone(zone) {
      selectedZone = zone;
      zoneAdjustment = 0;

      // Update button styles
      document.querySelectorAll('.vdot-zone-btn').forEach(function(btn) {
        btn.style.opacity = btn.dataset.zone === zone ? '1' : '0.5';
      });

      document.getElementById('vdot-adjust-container').style.display = 'flex';
      document.getElementById('vdot-selected-zone').textContent = zone + ': ';
      updateVdotPreview();
    }

    function adjustVdot(delta) {
      zoneAdjustment += delta;
      updateVdotPreview();
    }

    function updateVdotPreview() {
      const previewEl = document.getElementById('vdot-preview');
      const selectedZoneEl = document.getElementById('vdot-selected-zone');

      if (!selectedZone || !vdotZones) {
        previewEl.textContent = '';
        return;
      }

      const baseSeconds = vdotZones[selectedZone]?.seconds;
      if (!baseSeconds) {
        previewEl.textContent = '无法计算配速';
        return;
      }

      const adjustedSeconds = baseSeconds + zoneAdjustment;
      const paceStr = formatPaceToString(adjustedSeconds);
      const adjustedStr = zoneAdjustment > 0 ? '+' + zoneAdjustment + 's' : (zoneAdjustment < 0 ? zoneAdjustment + 's' : '');

      selectedZoneEl.textContent = selectedZone + (adjustedStr ? ' (' + adjustedStr + ')' : '') + ': ';

      // Show all zones with current adjustment
      var allZonesHtml = '';
      var zones = ['E', 'M', 'T', 'I', 'R'];
      var colors = { E: '#22C55E', M: '#3B82F6', T: '#F97316', I: '#EF4444', R: '#6B7280' };
      zones.forEach(function(z) {
        var base = vdotZones[z]?.seconds || 0;
        var adj = base + zoneAdjustment;
        var pace = formatPaceToString(adj);
        var marker = z === selectedZone ? ' *' : '';
        allZonesHtml += '<span style="display: inline-block; margin-right: 12px; color: ' + colors[z] + ';">' + z + ': ' + pace + marker + '</span>';
      });
      previewEl.innerHTML = allZonesHtml;

      // Set the pace value for submission
      var paceValue = selectedZone + (zoneAdjustment > 0 ? '+' + zoneAdjustment : (zoneAdjustment < 0 ? zoneAdjustment : ''));
      document.getElementById('training-unit-pace-value').value = paceValue;
    }

    function formatPaceToString(seconds) {
      var mins = Math.floor(seconds / 60);
      var secs = seconds % 60;
      return mins + ':' + String(secs).padStart(2, '0');
    }

    function validatePaceValue() {
      return true; // Now handled by zone selector
    }

    function addUnitToStaging() {
      const type = document.getElementById('training-unit-type').value;

      const paceMode = type === 'rest' ? null : (document.getElementById('training-unit-pace-mode').value || null);
      const paceValue = type === 'rest' ? null : (document.getElementById('training-unit-pace-value').value.trim() || null);
      const standardType = document.getElementById('training-unit-standard-type').value || null;
      const standardValue = document.getElementById('training-unit-standard-value').value ? parseInt(document.getElementById('training-unit-standard-value').value) : null;
      const content = document.getElementById('training-unit-content').value || null;

      if (!type) {
        alert('请选择类型');
        return;
      }

      if (type === 'run' && paceMode === 'vdot' && !paceValue) {
        alert('请选择VDOT配速区间');
        return;
      }

      stagedUnits.push({ type, paceMode, paceValue, standardType, standardValue, content });
      renderStagedUnits();

      // Clear inputs except type
      document.getElementById('training-unit-pace-mode').value = '';
      document.getElementById('training-unit-pace-value').value = '';
      document.getElementById('training-unit-standard-type').value = '';
      document.getElementById('training-unit-standard-value').value = '';
      document.getElementById('training-unit-content').value = '';
      document.getElementById('vdot-zone-container').style.display = 'none';
      document.querySelectorAll('.vdot-zone-btn').forEach(function(btn) { btn.style.opacity = '1'; });
      selectedZone = null;
      zoneAdjustment = 0;
    }

    function renderStagedUnits() {
      const listEl = document.getElementById('training-staging-list');
      const countEl = document.getElementById('training-staging-count');
      countEl.textContent = stagedUnits.length;

      if (stagedUnits.length === 0) {
        listEl.innerHTML = '<div style="color: #888; font-size: 13px;">暂无单元，请添加</div>';
        return;
      }

      var html = '<table style="width: 100%; font-size: 13px;"><tr><th>#</th><th>类型</th><th>配速</th><th>标准</th><th></th></tr>';
      stagedUnits.forEach(function(u, i) {
        var typeName = u.type === 'run' ? '跑步' : (u.type === 'rest' ? '休息' : '其他');
        var paceStr = u.paceMode === 'vdot' ? u.paceValue : (u.paceValue || '-');
        var stdStr = u.standardType === 'time' ? (u.standardValue ? u.standardValue + '秒' : '-') :
                     (u.standardType === 'distance' ? (u.standardValue ? u.standardValue + '米' : '-') : '-');
        html += '<tr><td>' + (i + 1) + '</td><td>' + typeName + '</td><td>' + paceStr + '</td><td>' + stdStr + '</td>';
        html += '<td><button onclick="removeStagedUnit(' + i + ')" style="padding: 2px 8px; font-size: 11px; background: #EF4444;">删除</button></td></tr>';
      });
      html += '</table>';
      listEl.innerHTML = html;
    }

    function removeStagedUnit(index) {
      stagedUnits.splice(index, 1);
      renderStagedUnits();
    }

    async function createDailyPlanWithUnits() {
      const name = document.getElementById('training-name').value;
      const isTemplate = document.getElementById('training-is-template').checked;

      if (!name) {
        alert('请输入计划名称');
        return;
      }
      if (stagedUnits.length === 0) {
        alert('请至少添加一个单元');
        return;
      }

      const data = await api('POST', '/api/dailyplan-with-units', { name: name, units: stagedUnits, isTemplate: isTemplate });
      if (data.error) {
        showResult('training-create-result', data, 'error');
      } else {
        showResult('training-create-result', data, 'success');
        stagedUnits = [];
        renderStagedUnits();
        document.getElementById('training-name').value = '';
        document.getElementById('training-is-template').checked = false;
        loadAllDailyPlans();
      }
    }

    async function api(method, path, body) {
      const res = await fetch(API + path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      return res.json();
    }

    function showResult(id, data, type) {
      type = type || 'info';
      const el = document.getElementById(id);
      el.className = 'result ' + type;
      el.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
      el.classList.remove('hidden');
    }

    async function calcVdot() {
      const distance = parseFloat(document.getElementById('vdot-distance').value);
      const time = parseInt(document.getElementById('vdot-time').value);
      const data = await api('POST', '/api/vdot', { distance, time });
      showResult('vdot-result', data, 'success');
    }

    async function calcAdjust() {
      const base = parseInt(document.getElementById('adjust-base').value);
      const expr = document.getElementById('adjust-expr').value;
      const data = await api('POST', '/api/vdot/adjust', { base, expr });
      showResult('adjust-result', data, 'success');
    }

    async function testFormat() {
      const duration = parseInt(document.getElementById('fmt-duration').value);
      const distance = parseFloat(document.getElementById('fmt-distance').value);
      const pace = parseInt(document.getElementById('fmt-pace').value);
      const data = await api('POST', '/api/unit/format', { duration, distance, pace });
      showResult('fmt-result', data, 'success');
    }

    async function createPlan() {
      const name = document.getElementById('plan-name').value;
      const distance = document.getElementById('plan-distance').value;
      const time = parseInt(document.getElementById('plan-time').value);
      const weeks = parseInt(document.getElementById('plan-weeks').value);
      const data = await api('POST', '/api/plan', { name, distance, time, weeks });
      showResult('plan-result', data, data.error ? 'error' : 'success');
      if (data.id) document.getElementById('cal-plan-id').value = data.id;
    }

    async function activatePlan() {
      const planId = document.getElementById('cal-plan-id').value;
      const start = document.getElementById('cal-start').value;
      const data = await api('POST', '/api/calendar/activate', { planId, start });
      showResult('cal-result', data, data.error ? 'error' : 'success');
    }

    async function querySchedule() {
      const date = document.getElementById('cal-query-date').value;
      const data = await api('GET', '/api/calendar/' + date);
      showResult('cal-query-result', data, 'success');
    }

    async function loadAllDailyPlans() {
      const result = await api('GET', '/api/dailyplans');
      const listEl = document.getElementById('training-all-list');
      if (result.dailyPlans && result.dailyPlans.length > 0) {
        var html = '<table style="width: 100%; font-size: 13px;"><tr><th>名称</th><th>Week</th><th>Day</th><th>Units</th></tr>';
        html += result.dailyPlans.slice(0, 20).map(function(dp) {
          return '<tr><td>' + (dp.desc || '-') + '</td><td>' + (dp.weekIndex || '-') + '</td><td>' + (dp.dayIndex || '-') + '</td><td>' + dp.units.length + '</td></tr>';
        }).join('');
        html += '</table>';
        listEl.innerHTML = html;
      } else {
        listEl.innerHTML = '<div style="color: #888;">暂无 DailyPlans</div>';
      }
    }

    async function doCustomCheckin() {
      const date = document.getElementById('checkin-date').value;
      if (!date) {
        alert('请选择日期');
        return;
      }
      const type = document.getElementById('checkin-type').value;
      const distance = parseFloat(document.getElementById('checkin-distance').value);
      const duration = parseInt(document.getElementById('checkin-duration').value);
      const feeling = document.getElementById('checkin-feeling').value || null;
      const calendarEntryId = document.getElementById('checkin-calendar-entry-id').value || null;
      const data = await api('POST', '/api/checkin', { date, type, distance, duration, feeling, calendarEntryId });
      showResult('checkin-result', data, data.error ? 'error' : 'success');
      if (!data.error) loadCheckinForm();
    }

    async function checkinFromPlan() {
      const calendarEntryId = document.getElementById('checkin-calendar-entry-id').value;
      const feeling = document.getElementById('checkin-feeling').value || null;
      const data = await api('POST', '/api/checkin/from-plan', { calendarEntryId, feeling });
      showResult('checkin-result', data, data.error ? 'error' : 'success');
      if (!data.error) loadCheckinForm();
    }

    async function loadCheckinForm() {
      const date = document.getElementById('checkin-date').value;
      if (!date) return;

      // Fetch schedule and check-in records in parallel
      const [schedule, checkinsData] = await Promise.all([
        api('GET', '/api/calendar/' + date),
        api('GET', '/api/checkins/' + date)
      ]);

      const statusEl = document.getElementById('checkin-today-status');
      const planCard = document.getElementById('checkin-plan-card');
      const planInfo = document.getElementById('checkin-plan-info');
      const formTitle = document.getElementById('checkin-form-title');
      const recordsCard = document.getElementById('checkin-records-card');
      const recordsList = document.getElementById('checkin-records-list');
      const recordsTitle = document.getElementById('checkin-records-title');

      planCard.style.display = 'none';
      document.getElementById('checkin-calendar-entry-id').value = '';

      // Show check-in records
      if (checkinsData.records && checkinsData.records.length > 0) {
        recordsCard.style.display = 'block';
        recordsTitle.textContent = date + ' 打卡记录 (' + checkinsData.records.length + ')';

        var html = checkinsData.records.map(function(r) {
          var typeIcon = r.type === 'run' ? 'run' : (r.type === 'rest' ? 'rest' : 'other');
          var typeName = r.type === 'run' ? '跑步' : (r.type === 'rest' ? '休息' : '其他');
          var details = [];
          if (r.distance) details.push(r.distance + 'km');
          if (r.durationFormatted) details.push(r.durationFormatted);
          if (r.paceFormatted) details.push(r.paceFormatted + '/km');
          var feelingStr = r.feelingLabel ? ' - ' + r.feelingLabel : '';
          return '<div class="unit-item ' + typeIcon + '">' +
            '<span style="font-weight: bold;">' + typeName + '</span>' +
            (details.length > 0 ? ' - ' + details.join(', ') : '') +
            feelingStr +
            '</div>';
        }).join('');
        recordsList.innerHTML = html;
      } else {
        recordsCard.style.display = 'none';
      }

      // Show plan info
      if (schedule.entries && schedule.entries.length > 0) {
        const entry = schedule.entries[0];
        const statusBadge = entry.status === 'completed' ? '<span class="badge completed">已完成</span>' :
                           entry.status === 'skipped' ? '<span class="badge skipped">已跳过</span>' :
                           '<span class="badge pending">待完成</span>';

        statusEl.innerHTML = entry.planName + ' - ' + (entry.dailyPlanDesc || '第' + entry.dayIndex + '天') + ' ' + statusBadge;
        statusEl.classList.remove('hidden');

        if (entry.status === 'pending') {
          planCard.style.display = 'block';

          if (entry.dailyPlanUnits && entry.dailyPlanUnits.length > 0) {
            planInfo.innerHTML = '<div style="margin-bottom: 8px; font-size: 13px; color: #888;">计划内容:</div>';
            planInfo.innerHTML += entry.dailyPlanUnits.map(function(u) {
              var cls = u.type;
              var desc = '';
              if (u.type === 'run') {
                desc = (u.paceValue || '') + ' - ' + (u.standardType === 'time' ? u.displayValue : u.displayValue);
              } else if (u.type === 'rest') {
                desc = '休息';
              } else {
                desc = u.content || '其他';
              }
              return '<div class="unit-item ' + cls + '">' + desc + '</div>';
            }).join('');
          } else {
            planInfo.innerHTML = '<p style="color: #888; font-size: 13px;">今日有计划训练，可以按计划打卡或自定义打卡。</p>';
          }

          document.getElementById('checkin-calendar-entry-id').value = entry.id;
          formTitle.innerHTML = '自定义打卡 <span style="font-size: 12px; color: #888;">(可选)</span>';
        } else {
          formTitle.innerHTML = '今日已' + (entry.status === 'completed' ? '完成' : '跳过');
        }
      } else {
        statusEl.innerHTML = '今日没有计划训练，可以创建自定义训练';
        statusEl.classList.remove('hidden');
        formTitle.innerHTML = '自定义打卡';
      }
    }

    async function updateUserGoal() {
      const distance = document.getElementById('user-distance').value;
      const time = parseInt(document.getElementById('user-time').value);
      const data = await api('POST', '/api/user', { distance, time });
      showResult('user-result', data, 'success');
    }

    async function getMonthlyStats() {
      const year = parseInt(document.getElementById('hist-year').value);
      const month = parseInt(document.getElementById('hist-month').value);
      const data = await api('GET', '/api/history/' + year + '/' + month);
      showResult('hist-result', data, 'success');
    }

    async function queryAllData() {
      const data = await api('GET', '/api/data');
      document.getElementById('data-result').textContent = JSON.stringify(data, null, 2);
    }

    // Set defaults
    var today = new Date().toISOString().split('T')[0];
    document.getElementById('checkin-date').value = today;
    document.getElementById('cal-query-date').value = today;
    loadCheckinForm();
  </script>
</body>
</html>`;

// ============================================================================
// API Routes
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (path === '/' || path === '/index.html') {
      return new Response(HTML, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    try {
      // VDOT Calculation
      if (path === '/api/vdot' && method === 'POST') {
        const { distance, time } = await req.json();
        const vdot = calculateVdot(distance, time * 60);
        const zones = getPaceZones(vdot);
        return new Response(JSON.stringify({
          vdot: Math.round(vdot * 100) / 100,
          zones: {
            E: { pace: formatPace(zones.zones.E), seconds: zones.zones.E },
            M: { pace: formatPace(zones.zones.M), seconds: zones.zones.M },
            T: { pace: formatPace(zones.zones.T), seconds: zones.zones.T },
            I: { pace: formatPace(zones.zones.I), seconds: zones.zones.I },
            R: { pace: formatPace(zones.zones.R), seconds: zones.zones.R },
          }
        }), { headers });
      }

      // VDOT Adjust
      if (path === '/api/vdot/adjust' && method === 'POST') {
        const { base, expr } = await req.json();
        const adjusted = adjustPace(base, expr);
        return new Response(JSON.stringify({
          original: base,
          expression: expr,
          adjusted: adjusted,
          formatted: formatPace(adjusted)
        }), { headers });
      }

      // Unit Format
      if (path === '/api/unit/format' && method === 'POST') {
        const { duration, distance, pace } = await req.json();
        return new Response(JSON.stringify({
          duration: { input: duration, formatted: formatDuration(duration) },
          distance: { input: distance, formatted: formatDistance(distance) },
          pace: { input: pace, formatted: formatPace(pace) }
        }), { headers });
      }

      // Create Plan
      if (path === '/api/plan' && method === 'POST') {
        const { name, distance, time, weeks } = await req.json();
        const targetDistance = distance;
        const targetTime = time * 60;
        const distanceKm = targetDistance === '5k' ? 5 : targetDistance === '10k' ? 10 : targetDistance === 'half' ? 21.0975 : 42.195;
        const vdot = calculateVdot(distanceKm, targetTime);
        const zones = getPaceZones(vdot);
        const planId = generateId();
        const nowStr = now();

        await db.insert(schema.plan).values({
          id: planId,
          name,
          targetDistance,
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

        return new Response(JSON.stringify({
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
        }), { headers });
      }

      // Activate Plan
      if (path === '/api/calendar/activate' && method === 'POST') {
        const { planId, start } = await req.json();

        const plan = await db.query.plan.findFirst({
          where: (p, { eq }) => eq(p.id, planId)
        });
        if (!plan) {
          return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404, headers });
        }

        const today = new Date();
        const getMonday = (d) => {
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

        return new Response(JSON.stringify({
          success: true,
          entriesCreated: count,
          startDate: startDate.getFullYear() + '-' +
            String(startDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(startDate.getDate()).padStart(2, '0')
        }), { headers });
      }

      // Query Calendar
      if (path.startsWith('/api/calendar/') && method === 'GET') {
        const date = path.split('/').pop();
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
              displayValue = (u.standardType === 'time' ? formatDuration(u.standardValue) : formatDistance((u.standardValue || 0) / 1000));
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

        return new Response(JSON.stringify({ date, entries: enriched }), { headers });
      }

      // Get check-ins for a date
      if (path.startsWith('/api/checkins/') && method === 'GET') {
        const date = path.split('/').pop();
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

        return new Response(JSON.stringify({ date, records: formatted }), { headers });
      }

      // Add Unit to DailyPlan
      if (path === '/api/unit' && method === 'POST') {
        const { dailyPlanId, type, paceMode, paceValue, standardType, standardValue, standard, content } = await req.json();

        // Get existing units to determine orderIndex
        const existingUnits = sqlite.query('SELECT * FROM unit WHERE daily_plan_id = ?').all(dailyPlanId) as Array<{ order_index: number }>;
        const orderIndex = existingUnits.length + 1;

        const id = generateId();

        sqlite.query(`
          INSERT INTO unit (id, daily_plan_id, type, order_index, pace_mode, pace_value, standard_type, standard_value, standard, content)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, dailyPlanId, type, orderIndex, paceMode || null, paceValue || null, standardType || null, standardValue || null, standard || null, content || null);

        return new Response(JSON.stringify({
          success: true,
          id,
          dailyPlanId,
          type,
          orderIndex
        }), { headers });
      }

      // Create DailyPlan
      if (path === '/api/dailyplan' && method === 'POST') {
        const { name, weekIndex, dayIndex } = await req.json();

        let weeklyPlanId = null;
        let dayIdx = dayIndex || 1;

        if (weekIndex && dayIndex) {
          // Try to find existing weekly plan for this week
          const weeklyPlans = await db.query.weeklyPlan.findMany({
            orderBy: (wp, { asc }) => asc(wp.weekIndex)
          });
          const wp = weeklyPlans.find(w => w.weekIndex === weekIndex);
          if (wp) {
            weeklyPlanId = wp.id;
          }
        }

        // If no weekly plan found, create a standalone one
        if (!weeklyPlanId) {
          const standaloneWpId = generateId();
          await db.insert(schema.weeklyPlan).values({
            id: standaloneWpId,
            planId: 'standalone', // dummy plan id
            weekIndex: 0, // 0 means standalone
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

        return new Response(JSON.stringify({
          success: true,
          id,
          name: desc,
          weeklyPlanId,
          dayIndex: dayIdx
        }), { headers });
      }

      // Get current VDOT (from active plan or user profile)
      if (path === '/api/current-vdot' && method === 'GET') {
        // Check for active plan with pending calendar entries
        const pendingEntry = sqlite.query(`
          SELECT upc.plan_id, p.vdot, p.name as plan_name
          FROM user_plan_calendar upc
          JOIN plan p ON upc.plan_id = p.id
          WHERE upc.status = 'pending'
          ORDER BY upc.date ASC
          LIMIT 1
        `).get() as { plan_id: string; vdot: number; plan_name: string } | undefined;

        if (pendingEntry) {
          return new Response(JSON.stringify({
            vdot: pendingEntry.vdot,
            source: 'plan',
            planName: pendingEntry.plan_name,
            planId: pendingEntry.plan_id
          }), { headers });
        }

        // Fall back to user profile VDOT
        const user = await db.query.user.findFirst({
          where: (u, { eq }) => eq(u.id, 'local')
        });

        return new Response(JSON.stringify({
          vdot: user?.vdot || null,
          source: 'user',
          planName: null,
          planId: null
        }), { headers });
      }

      // Create DailyPlan with Units at once
      if (path === '/api/dailyplan-with-units' && method === 'POST') {
        const { name, units, isTemplate } = await req.json();

        if (!name) {
          return new Response(JSON.stringify({ error: '名称不能为空' }), { status: 400, headers });
        }

        // Create standalone weekly plan
        const standaloneWpId = generateId();
        await db.insert(schema.weeklyPlan).values({
          id: standaloneWpId,
          planId: 'standalone',
          weekIndex: 0,
          desc: 'Standalone Daily Plans',
        });

        // Create DailyPlan
        const dailyPlanId = generateId();
        const desc = name || 'DailyPlan-' + dailyPlanId.slice(0, 8);

        await db.insert(schema.dailyPlan).values({
          id: dailyPlanId,
          weeklyPlanId: standaloneWpId,
          dayIndex: 1,
          desc,
        });

        // Create units
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

        // Create template if requested
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

        return new Response(JSON.stringify({
          success: true,
          id: dailyPlanId,
          name: desc,
          units: createdUnits,
          templateId: templateId
        }), { headers });
      }

      // Get all DailyPlans
      if (path === '/api/dailyplans' && method === 'GET') {
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

        // Get units for each daily plan
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
              displayValue: u.type === 'run' ? (u.standard_type === 'time' ? formatDuration(u.standard_value) : formatDistance((u.standard_value || 0) / 1000)) : (u.type === 'rest' ? '休息' : (u.content || ''))
            }))
          };
        });

        return new Response(JSON.stringify({ dailyPlans: result }), { headers });
      }

      // Delete Unit
      if (path.startsWith('/api/unit/') && method === 'DELETE') {
        const unitId = path.split('/').pop();
        sqlite.query('DELETE FROM unit WHERE id = ?').run(unitId);
        return new Response(JSON.stringify({ success: true, deletedId: unitId }), { headers });
      }

      // Get DailyPlan with Units
      if (path.startsWith('/api/dailyplan/') && method === 'GET') {
        const dailyPlanId = path.split('/').pop();
        const dailyPlan = sqlite.query('SELECT * FROM daily_plan WHERE id = ?').get(dailyPlanId);
        const units = sqlite.query('SELECT * FROM unit WHERE daily_plan_id = ? ORDER BY order_index').all(dailyPlanId);

        return new Response(JSON.stringify({
          dailyPlan,
          units
        }), { headers });
      }

      // Check-in (custom or from calendar)
      if (path === '/api/checkin' && method === 'POST') {
        const { date, type, distance, duration, feeling, calendarEntryId } = await req.json();

        const pace = duration && distance ? Math.round(duration / distance) : null;
        const id = generateId();
        const nowStr = now();

        // Insert check-in record using raw SQL
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

        return new Response(JSON.stringify({
          success: true,
          id,
          date,
          type,
          distance,
          duration,
          pace,
          feeling,
          fromPlan: !!calendarEntryId
        }), { headers });
      }

      // Check-in from plan
      if (path === '/api/checkin/from-plan' && method === 'POST') {
        const { calendarEntryId, feeling } = await req.json();

        // Get calendar entry directly via raw SQL to avoid drizzle type issues
        const entryRow = sqlite.query('SELECT * FROM user_plan_calendar WHERE id = ?').get(calendarEntryId);

        if (!entryRow) {
          return new Response(JSON.stringify({ error: 'Calendar entry not found' }), { status: 404, headers });
        }

        const entry = entryRow as { id: string; plan_id: string; date: string; daily_plan_id: string; status: string };

        // Get units
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

        // Insert check-in record using raw SQL
        sqlite.query(`
          INSERT INTO check_in_record (id, calendar_entry_id, date, type, distance, duration, pace, feeling, photos, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
        `).run(id, calendarEntryId, entry.date, type,
          totalDistance > 0 ? totalDistance : null,
          totalDuration > 0 ? totalDuration : null,
          totalDistance > 0 && totalDuration > 0 ? Math.round(totalDuration / totalDistance) : null,
          feeling, nowStr);

        // Update calendar entry status
        sqlite.query('UPDATE user_plan_calendar SET status = ? WHERE id = ?').run('completed', calendarEntryId);

        // Update or insert daily overview
        const existingOverview = sqlite.query('SELECT * FROM check_in_daily_overview WHERE date = ?').get(entry.date);
        if (existingOverview) {
          sqlite.query('UPDATE check_in_daily_overview SET has_check_in = 1 WHERE date = ?').run(entry.date);
        } else {
          sqlite.query('INSERT INTO check_in_daily_overview (id, date, has_check_in) VALUES (?, ?, 1)').run(generateId(), entry.date);
        }

        return new Response(JSON.stringify({
          success: true,
          id,
          date: entry.date,
          type,
          distance: totalDistance > 0 ? totalDistance : null,
          duration: totalDuration > 0 ? totalDuration : null,
          feeling,
          unitsIncluded: units.length
        }), { headers });
      }

      // User
      if (path === '/api/user' && method === 'POST') {
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
            .where((u, { eq }) => eq(u.id, 'local'));
        } else {
          await db.insert(schema.user).values({
            id: 'local',
            runningGoalDistance: distance,
            runningGoalTime: targetTime,
            vdot,
            updatedAt: now(),
          });
        }

        return new Response(JSON.stringify({
          success: true,
          runningGoalDistance: distance,
          runningGoalTime: targetTime,
          vdot: Math.round(vdot * 100) / 100
        }), { headers });
      }

      // History
      if (path.startsWith('/api/history/') && method === 'GET') {
        const parts = path.split('/');
        const year = parseInt(parts[2]);
        const month = parseInt(parts[3]);

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

        return new Response(JSON.stringify({
          year,
          month,
          trainingDays,
          totalDistance: Math.round(totalDistance * 100) / 100,
          totalDuration,
          totalDurationFormatted: formatDuration(totalDuration)
        }), { headers });
      }

      // Data
      if (path === '/api/data' && method === 'GET') {
        const plans = await db.query.plan.findMany();
        const weeklyPlans = await db.query.weeklyPlan.findMany();
        const dailyPlans = await db.query.dailyPlan.findMany();
        const units = await db.query.unit.findMany();
        const calendar = await db.query.userPlanCalendar.findMany();
        const checkins = await db.query.checkInRecord.findMany();
        const overviews = await db.query.checkInDailyOverview.findMany();
        const users = await db.query.user.findMany();

        return new Response(JSON.stringify({
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
        }), { headers });
      }

      // Get all templates
      if (path === '/api/templates' && method === 'GET') {
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

        return new Response(JSON.stringify({ templates }), { headers });
      }

      // Get template with units
      if (path.startsWith('/api/template/') && path.endsWith('/units') && method === 'GET') {
        const templateId = path.split('/')[3];
        const template = sqlite.query('SELECT * FROM template WHERE id = ?').get(templateId) as { id: string; name: string; daily_plan_id: string } | undefined;

        if (!template) {
          return new Response(JSON.stringify({ error: 'Template not found' }), { status: 404, headers });
        }

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

        return new Response(JSON.stringify({
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
        }), { headers });
      }

      // Use template to create new daily plan
      if (path.startsWith('/api/template/') && path.endsWith('/use') && method === 'POST') {
        const templateId = path.split('/')[3];
        const template = sqlite.query('SELECT * FROM template WHERE id = ?').get(templateId) as { id: string; name: string; daily_plan_id: string } | undefined;

        if (!template) {
          return new Response(JSON.stringify({ error: 'Template not found' }), { status: 404, headers });
        }

        // Get units from template's daily plan
        const originalUnits = sqlite.query('SELECT * FROM unit WHERE daily_plan_id = ? ORDER BY order_index').all(template.daily_plan_id) as Array<{
          id: string;
          type: string;
          pace_mode: string | null;
          pace_value: string | null;
          standard_type: string | null;
          standard_value: number | null;
          standard: string | null;
          content: string | null;
        }>;

        // Create standalone weekly plan
        const standaloneWpId = generateId();
        await db.insert(schema.weeklyPlan).values({
          id: standaloneWpId,
          planId: 'standalone',
          weekIndex: 0,
          desc: 'From Template: ' + template.name,
        });

        // Create new daily plan with new ID
        const newDailyPlanId = generateId();
        await db.insert(schema.dailyPlan).values({
          id: newDailyPlanId,
          weeklyPlanId: standaloneWpId,
          dayIndex: 1,
          desc: template.name + ' (副本)',
        });

        // Copy units with new IDs
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

        // Increment usage count
        sqlite.query('UPDATE template SET usage_count = usage_count + 1 WHERE id = ?').run(templateId);

        return new Response(JSON.stringify({
          success: true,
          id: newDailyPlanId,
          name: template.name + ' (副本)',
          units: newUnits,
          templateId: templateId
        }), { headers });
      }

      // Delete template
      if (path.startsWith('/api/template/') && !path.includes('/') && method === 'DELETE') {
        const templateId = path.split('/')[3];
        sqlite.query('DELETE FROM template WHERE id = ?').run(templateId);
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });

    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  },
});

console.log('Ruff API Server running at http://localhost:' + PORT);

export default server;
