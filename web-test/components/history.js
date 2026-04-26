// History Component
function renderHistoryTab() {
  const el = document.getElementById('tab-history');
  el.innerHTML = `
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
  `;
}

async function getMonthlyStats() {
  const year = parseInt(document.getElementById('hist-year').value);
  const month = parseInt(document.getElementById('hist-month').value);
  const data = await api('GET', '/api/history/' + year + '/' + month);
  showResult('hist-result', data, 'success');
}
