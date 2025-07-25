document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const headers = {
    headers: {
      Authorization: `Bearer ${token}`
    },
    withCredentials: true
    
  };
    await loadStats();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!user?.role || !['admin', 'super-admin'].includes(user.role)) {
    window.location.href = '/pages/index.html';
    return;
  }

  const isSuperAdmin = user.role === 'super-admin';

  // ========== FETCH STATS ==========
  async function loadStats() {
  try {
    const [moviesRes, usersRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/movies`, headers),
      axios.get(`${API_BASE_URL}/users`, headers)
    ]);

    document.getElementById('total-movies').textContent = moviesRes.data.results || '-';
    document.getElementById('total-users').textContent = usersRes.data.results || '-';

    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = `Last updated ${new Date().toLocaleTimeString()}`;
    }

  } catch (err) {
    console.error('Error fetching stats:', err.response?.data?.message || err.message);
  }
}

  // ========== LOAD USERS TABLE ==========
  try {
    const res = await axios.get(`${API_BASE_URL}/users`, headers);
    const users = res.data.data.users;
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    users.forEach(u => {
      const tr = document.createElement('tr');

      const isTargetSuperAdmin = u.role === 'super-admin';
      const actions = [];

      if (isSuperAdmin && !isTargetSuperAdmin) {
        actions.push(`
          <button class="btn btn-xs btn-warning toggle-role" data-id="${u._id}" data-role="${u.role}">
            ${u.role === 'client' ? 'Promote' : 'Demote'}
          </button>
        `);
        actions.push(`
          <button class="btn btn-xs btn-error delete-user" data-id="${u._id}">
            Delete
          </button>
        `);
      }

      tr.innerHTML = `
        <td class="py-3 px-4 text-white">${u.name}</td>
        <td class="py-3 px-4 text-white">${u.email}</td>
        <td class="py-3 px-4 text-white capitalize">${u.role}</td>
        <td class="py-3 px-4 text-white space-x-2">${actions.join('') || '-'}</td>
      `;

      tbody.appendChild(tr);
    });

    // Attach delete button listeners
    document.querySelectorAll('.delete-user').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.dataset.id;
        if (confirm('Are you sure you want to delete this user?')) {
          try {
            await axios.delete(`${API_BASE_URL}/users/${userId}`, headers);
            location.reload();
          } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete user');
          }
        }
      });
    });

    // Attach role toggle listeners
    document.querySelectorAll('.toggle-role').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.dataset.id;
        const currentRole = btn.dataset.role;
        const action = currentRole === 'client' ? 'promote' : 'demote';

        if (confirm(`Are you sure you want to ${action} this user?`)) {
          try {
            await axios.patch(`${API_BASE_URL}/users/${userId}/role`, {}, headers);
            location.reload();
          } catch (err) {
            alert(err.response?.data?.message || 'Failed to toggle user role');
          }
        }
      });
    });

  } catch (err) {
    console.error('Error fetching users:', err.response?.data?.message || err.message);
  }

  // ========== Refresh Button ==========
  const refreshBtn = document.getElementById('refresh-users');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      location.reload();
    });
  }
});

setInterval(() => {
  loadStats(); 
}, 60000); // 60,000 ms = 60 seconds
