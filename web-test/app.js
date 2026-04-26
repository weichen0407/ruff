// Main App
const componentRenderers = {
  vdot: renderVdotTab,
  plan: renderPlanTab,
  calendar: renderCalendarTab,
  training: renderTrainingTab,
  checkin: renderCheckinTab,
  user: renderUserTab,
  history: renderHistoryTab,
  data: renderDataTab,
};

const tabLoadHandlers = {
  training: () => { loadCurrentVdot(); loadAllDailyPlans(); },
  data: queryAllData,
};

function initApp() {
  // Tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => showTab(tab.dataset.tab));
  });

  // Show first tab
  showTab('vdot');
}

function showTab(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

  const tabEl = document.getElementById('tab-' + name);
  const activeTab = document.querySelector('.tab[data-tab="' + name + '"]');

  if (tabEl) tabEl.classList.remove('hidden');
  if (activeTab) activeTab.classList.add('active');

  // Render component if not already rendered
  if (componentRenderers[name] && !tabEl.innerHTML.trim()) {
    componentRenderers[name]();
  }

  // Load data for specific tabs
  if (tabLoadHandlers[name]) {
    tabLoadHandlers[name]();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
