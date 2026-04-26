// Checkin Component
function renderCheckinTab() {
  const el = document.getElementById('tab-checkin');
  el.innerHTML = `
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
  `;

  // Set default date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('checkin-date').value = today;
  loadCheckinForm();
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

  if (!statusEl) return;

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
