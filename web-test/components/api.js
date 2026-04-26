// API utilities
const API = '';

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
  if (!el) return;
  el.className = 'result ' + type;
  el.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
  el.classList.remove('hidden');
}

function formatPaceToString(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ':' + String(secs).padStart(2, '0');
}
