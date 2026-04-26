// VDOT Component
function renderVdotTab() {
  const el = document.getElementById('tab-vdot');
  el.innerHTML = `
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
  `;
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
