// User Component
function renderUserTab() {
  const el = document.getElementById('tab-user');
  el.innerHTML = `
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
  `;
}

async function updateUserGoal() {
  const distance = document.getElementById('user-distance').value;
  const time = parseInt(document.getElementById('user-time').value);
  const data = await api('POST', '/api/user', { distance, time });
  showResult('user-result', data, 'success');
}
