const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const adminMain = document.getElementById('admin-main');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

function requireSupabase() {
  if (!window.supabaseClient) {
    loginError.textContent = 'The dashboard is not connected to a backend yet. Update js/supabase-config.js with your Supabase project details.';
    loginError.classList.add('visible');
    return false;
  }
  return true;
}

function showDashboard() {
  loginView.style.display = 'none';
  dashboardView.style.display = 'block';
  adminMain.classList.add('visible');
  loadDashboardData();
}

function showLogin() {
  loginView.style.display = 'flex';
  dashboardView.style.display = 'none';
  adminMain.classList.remove('visible');
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.remove('visible');
    if (!requireSupabase()) return;

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      loginError.textContent = 'Incorrect email or password.';
      loginError.classList.add('visible');
      return;
    }
    showDashboard();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    if (window.supabaseClient) await window.supabaseClient.auth.signOut();
    showLogin();
  });
}

function formatDate(iso) {
  if (!iso) return '&ndash;';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadDashboardData() {
  await Promise.all([loadAppointments(), loadLeads(), loadStats()]);
}

async function loadStats() {
  const { count: leadCount } = await window.supabaseClient
    .from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new');
  const { count: aptCount } = await window.supabaseClient
    .from('appointment_requests').select('id', { count: 'exact', head: true }).eq('status', 'new');

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: viewCount } = await window.supabaseClient
    .from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo);

  document.getElementById('stat-leads').textContent = leadCount ?? '0';
  document.getElementById('stat-appointments').textContent = aptCount ?? '0';
  document.getElementById('stat-views').textContent = viewCount ?? '0';
}

async function loadAppointments() {
  const tbody = document.getElementById('appointments-table-body');
  const { data, error } = await window.supabaseClient
    .from('appointment_requests').select('*').order('created_at', { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">Failed to load: ${escapeHtml(error.message)}</td></tr>`;
    return;
  }
  if (!data.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No appointment requests yet.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((row) => `
    <tr data-id="${row.id}" data-table="appointment_requests">
      <td>${formatDate(row.created_at)}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.phone)}<br>${escapeHtml(row.email)}</td>
      <td>${escapeHtml(row.requested_service) || '&ndash;'}</td>
      <td>${escapeHtml(row.preferred_date) || '&ndash;'} ${escapeHtml(row.preferred_time) || ''}</td>
      <td>${escapeHtml(row.notes) || '&ndash;'}</td>
      <td>
        <select class="status-select" data-id="${row.id}" data-table="appointment_requests">
          ${['new', 'contacted', 'scheduled', 'closed'].map((s) =>
            `<option value="${s}" ${row.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button class="row-delete" data-id="${row.id}" data-table="appointment_requests">Delete</button></td>
    </tr>
  `).join('');

  bindRowControls();
}

async function loadLeads() {
  const tbody = document.getElementById('leads-table-body');
  const { data, error } = await window.supabaseClient
    .from('leads').select('*').order('created_at', { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Failed to load: ${escapeHtml(error.message)}</td></tr>`;
    return;
  }
  if (!data.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No leads yet.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((row) => `
    <tr data-id="${row.id}" data-table="leads">
      <td>${formatDate(row.created_at)}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.phone)}<br>${escapeHtml(row.email)}</td>
      <td>${escapeHtml(row.message) || '&ndash;'}</td>
      <td>
        <select class="status-select" data-id="${row.id}" data-table="leads">
          ${['new', 'contacted', 'closed'].map((s) =>
            `<option value="${s}" ${row.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button class="row-delete" data-id="${row.id}" data-table="leads">Delete</button></td>
    </tr>
  `).join('');

  bindRowControls();
}

function bindRowControls() {
  document.querySelectorAll('.status-select').forEach((select) => {
    select.onchange = async () => {
      const { id, table } = select.dataset;
      const { error } = await window.supabaseClient.from(table).update({ status: select.value }).eq('id', id);
      if (error) alert('Failed to update status: ' + error.message);
      else loadStats();
    };
  });

  document.querySelectorAll('.row-delete').forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm('Delete this entry? This cannot be undone.')) return;
      const { id, table } = btn.dataset;
      const { error } = await window.supabaseClient.from(table).delete().eq('id', id);
      if (error) {
        alert('Failed to delete: ' + error.message);
        return;
      }
      table === 'leads' ? loadLeads() : loadAppointments();
      loadStats();
    };
  });
}

// On load, check for an existing session
(async function init() {
  if (!window.supabaseClient) {
    showLogin();
    requireSupabase();
    return;
  }
  const { data } = await window.supabaseClient.auth.getSession();
  if (data.session) {
    showDashboard();
  } else {
    showLogin();
  }
})();
