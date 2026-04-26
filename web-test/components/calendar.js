// Calendar Component
function renderCalendarTab() {
  const el = document.getElementById('tab-calendar');
  el.innerHTML = `
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
  `;
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
