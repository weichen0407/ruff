// Data Component
function renderDataTab() {
  const el = document.getElementById('tab-data');
  el.innerHTML = `
    <div class="card">
      <h2>数据库内容</h2>
      <button onclick="queryAllData()" style="margin-bottom: 12px;">刷新</button>
      <div id="data-result" class="result info"></div>
    </div>
  `;
}

async function queryAllData() {
  const data = await api('GET', '/api/data');
  document.getElementById('data-result').textContent = JSON.stringify(data, null, 2);
}
