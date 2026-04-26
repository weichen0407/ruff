// Training Component
let stagedUnits = [];
let currentVdot = null;
let vdotZones = null;
let selectedZone = null;
let zoneAdjustment = 0;

function renderTrainingTab() {
  const el = document.getElementById('tab-training');
  el.innerHTML = `
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
  `;
}

async function loadCurrentVdot() {
  const data = await api('GET', '/api/current-vdot');
  const el = document.getElementById('training-current-vdot');
  if (!el) return;
  if (data.vdot) {
    currentVdot = data.vdot;
    const sourceText = data.source === 'plan' ? '(来自计划: ' + data.planName + ')' : '(来自用户设置)';
    el.innerHTML = '<strong>VDOT: ' + data.vdot.toFixed(1) + '</strong> ' + sourceText;
    el.className = 'result success';

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

  var paceValue = selectedZone + (zoneAdjustment > 0 ? '+' + zoneAdjustment : (zoneAdjustment < 0 ? zoneAdjustment : ''));
  document.getElementById('training-unit-pace-value').value = paceValue;
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
  if (!listEl || !countEl) return;
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

async function loadAllDailyPlans() {
  const result = await api('GET', '/api/dailyplans');
  const listEl = document.getElementById('training-all-list');
  if (!listEl) return;
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
