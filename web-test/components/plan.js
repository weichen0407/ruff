// Plan Component
function renderPlanTab() {
  const el = document.getElementById('tab-plan');
  el.innerHTML = `
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
  `;
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

async function testFormat() {
  const duration = parseInt(document.getElementById('fmt-duration').value);
  const distance = parseFloat(document.getElementById('fmt-distance').value);
  const pace = parseInt(document.getElementById('fmt-pace').value);
  const data = await api('POST', '/api/unit/format', { duration, distance, pace });
  showResult('fmt-result', data, 'success');
}
