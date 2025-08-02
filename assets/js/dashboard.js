// ======================
// Dashboard Specific Functionality
// ======================

let dashboardData = {
  movies: [],
  users: [],
  genres: [],
  roles: [],
  reviews: [],
  stats: {}
};

let currentUser = null;
let charts = {};

// ======================
// Initialization
// ======================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Dashboard initializing...');
  
  // Check admin access
  currentUser = checkAdminAccess();
  if (!currentUser) return;

  // Initialize dashboard
  await initializeDashboard();
});

async function initializeDashboard() {
  try {
    // Update admin profile info
    updateAdminProfile();
    
    // Initialize time updates
    initializeTimeUpdates();
    
    // Initialize sidebar navigation
    initializeSidebarNavigation();
    
    // Load initial data
    await loadAllData();
    
    // Initialize charts
    initializeCharts();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup auto-refresh
    setupAutoRefresh();
    
    console.log('Dashboard initialized successfully');
    
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showNotification('error', 'Initialization Failed', 'Could not load dashboard properly');
  }
}

// ======================
// Admin Profile Management
// ======================

function updateAdminProfile() {
  const adminNameEl = document.getElementById('admin-name');
  const adminRoleEl = document.getElementById('admin-role');
  
  if (adminNameEl && currentUser) {
    adminNameEl.textContent = currentUser.name || 'Admin';
  }
  
  if (adminRoleEl && currentUser) {
    const roleText = currentUser.role === 'super-admin' ? 'Super Administrator' : 'Administrator';
    adminRoleEl.textContent = roleText;
  }
}

// ======================
// Time Management
// ======================

function initializeTimeUpdates() {
  updateTime();
  setInterval(updateTime, 1000);
  
  updateLastRefresh();
}

function updateTime() {
  const timeEl = document.getElementById('current-time');
  if (timeEl) {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}

function updateLastRefresh() {
  const lastRefreshEl = document.getElementById('last-refresh');
  const footerLastUpdatedEl = document.getElementById('footer-last-updated');
  const currentTime = new Date().toLocaleString();
  
  if (lastRefreshEl) lastRefreshEl.textContent = 'Just now';
  if (footerLastUpdatedEl) footerLastUpdatedEl.textContent = currentTime;
}

// ======================
// Sidebar Navigation
// ======================

function initializeSidebarNavigation() {
  const sidebarBtns = document.querySelectorAll('.sidebar-btn');
  
  // Add click listeners for all tabs
  document.getElementById('overview-tab')?.addEventListener('click', () => switchDashboardTab('overview'));
  document.getElementById('users-tab')?.addEventListener('click', () => switchDashboardTab('users'));
  document.getElementById('movies-tab')?.addEventListener('click', () => switchDashboardTab('movies'));
  document.getElementById('genres-tab')?.addEventListener('click', () => switchDashboardTab('genres'));
  document.getElementById('roles-tab')?.addEventListener('click', () => switchDashboardTab('roles'));
  document.getElementById('reviews-tab')?.addEventListener('click', () => switchDashboardTab('reviews'));
  
  // Initialize with overview tab
  switchDashboardTab('overview');
}

function switchDashboardTab(tabName) {
  console.log('Switching to tab:', tabName);
  
  const allSidebarButtons = document.querySelectorAll('.sidebar-btn, #users-tab, #movies-tab, #overview-tab, #genres-tab, #roles-tab, #reviews-tab');
  
  allSidebarButtons.forEach(btn => {
    btn.classList.remove('sidebar-item-active');
    console.log('Removed active from:', btn.id);
  });
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  const activeBtn = document.getElementById(`${tabName}-tab`);
  if (activeBtn) {
    activeBtn.classList.add('sidebar-item-active');
    console.log('Added active to:', activeBtn.id);
  }
  
  const targetContent = document.getElementById(`${tabName}-content`);
  if (targetContent) {
    targetContent.classList.remove('hidden');
  }
  
  if (typeof loadTabData === 'function') {
    loadTabData(tabName);
  }
}

function initializeSidebarNavigation() {
  const buttonIds = ['overview-tab', 'users-tab', 'movies-tab', 'genres-tab', 'roles-tab', 'reviews-tab'];
  
  buttonIds.forEach(buttonId => {
    const btn = document.getElementById(buttonId);
    if (btn) {
      const tabName = buttonId.replace('-tab', '');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Button clicked:', tabName);
        switchDashboardTab(tabName);
      });
    }
  });
  
  switchDashboardTab('overview');
}

// ======================
// Data Loading Functions
// ======================

async function loadAllData() {
  try {
    await Promise.all([
      loadStats(),
      loadMovies(),
      loadUsers(),
      loadGenres(),
      loadRoles(),
      loadReviews()
    ]);
    
    updateLastRefresh();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showNotification('error', 'Data Loading Failed', 'Could not load some dashboard data');
  }
}

async function loadStats() {
  try {
    console.log('Loading dashboard statistics...');
    
    const requests = [
      axios.get(`${API_BASE_URL}/movies`, getAuthHeaders()).catch(() => ({ data: [] })),
      axios.get(`${API_BASE_URL}/users`, getAuthHeaders()).catch(() => ({ data: [] })),
      axios.get(`${API_BASE_URL}/genres`, getAuthHeaders()).catch(() => ({ data: [] })),
      axios.get(`${API_BASE_URL}/roles`, getAuthHeaders()).catch(() => ({ data: [] })),
      axios.get(`${API_BASE_URL}/reviews/admin`, getAuthHeaders()).catch(() => ({ data: [] }))
    ];

    const [moviesRes, usersRes, genresRes, rolesRes, reviewsRes] = await Promise.all(requests);

    // Extract counts with multiple fallback strategies
    const getCount = (response) => {
      const data = response.data;
      
      // Try different response structures
      if (typeof data.results === 'number') return data.results;
      if (typeof data.total === 'number') return data.total;
      if (data.data) {
        if (Array.isArray(data.data)) return data.data.length;
        if (data.data.movies && Array.isArray(data.data.movies)) return data.data.movies.length;
        if (data.data.users && Array.isArray(data.data.users)) return data.data.users.length;
        if (data.data.genres && Array.isArray(data.data.genres)) return data.data.genres.length;
        if (data.data.roles && Array.isArray(data.data.roles)) return data.data.roles.length;
        if (data.data.reviews && Array.isArray(data.data.reviews)) return data.data.reviews.length;
      }
      if (Array.isArray(data)) return data.length;
      
      return 0;
    };

    const stats = {
      movies: getCount(moviesRes),
      users: getCount(usersRes),
      genres: getCount(genresRes),
      roles: getCount(rolesRes),
      reviews: getCount(reviewsRes)
    };

    // Calculate average rating if reviews exist
    const reviewsData = reviewsRes.data.data?.reviews || reviewsRes.data.data || reviewsRes.data || [];
    if (Array.isArray(reviewsData) && reviewsData.length > 0) {
      const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
      stats.avgRating = (totalRating / reviewsData.length).toFixed(1);
    } else {
      stats.avgRating = '0.0';
    }

    console.log('Calculated stats:', stats);

    // Store in global data
    dashboardData.stats = stats;
    
    // Update DOM elements
    updateStatsDisplay(stats);

  } catch (error) {
    console.error('Error loading stats:', error);
    showStatsError();
  }
}

function updateStatsDisplay(stats) {
  document.getElementById('total-movies').textContent = stats.movies;
  document.getElementById('total-users').textContent = stats.users;
  document.getElementById('total-reviews').textContent = stats.reviews;
  document.getElementById('total-genres').textContent = stats.genres;
  document.getElementById('user-notification').textContent = stats.users;
  
  if (stats.avgRating) {
    document.getElementById('avg-rating').textContent = `Avg: ${stats.avgRating}`;
  }
  
  // Update trend indicators (placeholder for now)
  document.getElementById('movies-trend').textContent = 'All movies';
  document.getElementById('users-trend').textContent = 'All users';
  document.getElementById('active-genres').textContent = `Active: ${stats.genres}`;
}

function showStatsError() {
  ['total-movies', 'total-users', 'total-reviews', 'total-genres'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = 'Error';
  });
}

async function loadUsers() {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`, getAuthHeaders());
    dashboardData.users = response.data.data?.users || response.data.data || [];
    updateUsersTable();
  } catch (error) {
    console.error('Error loading users:', error);
    showUsersError();
  }
}

function updateUsersTable() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  if (dashboardData.users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center">
          <div class="text-[#F76F53] mb-4">
            <i class="fas fa-users text-4xl"></i>
          </div>
          <p class="text-xl opacity-80">No users found</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = dashboardData.users.map(user => {
    const isCurrentUser = user._id === currentUser._id;
    const isSuperAdmin = user.role === 'super-admin';
    const canManageUser = currentUser.role === 'super-admin' && !isSuperAdmin && !isCurrentUser;
    
    return `
      <tr class="table-row transition-colors border-b border-[#e0ddd0] dark:border-[#2E2E2E] hover:bg-[#e8e6d9] dark:hover:bg-[#2E2E2E]">
        <td class="py-4 px-6">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#F76F53] to-[#FF8A70] flex items-center justify-center">
              <span class="dark:text-white font-bold text-sm">${(user.name || 'U').charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p class="font-medium text-[#2E2E2E] dark:text-[#F2F0E3]">${user.name || 'Unknown User'}</p>
              ${isCurrentUser ? '<span class="text-xs text-[#F76F53]">You</span>' : ''}
            </div>
          </div>
        </td>
        <td class="py-4 px-6 text-[#2E2E2E] dark:text-[#F2F0E3]">${user.email || 'No email'}</td>
        <td class="py-4 px-6">
          <span class="px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}">
            ${capitalizeFirst(user.role || 'client')}
          </span>
        </td>
        <td class="py-4 px-6">
          <span class="text-sm opacity-80 text-[#2E2E2E] dark:text-[#F2F0E3]">${formatDate(user.createdAt || user.updatedAt)}</span>
        </td>
        <td class="py-4 px-6">
          <div class="flex space-x-2">
            ${canManageUser ? `
              <button onclick="toggleUserRole('${user._id}', '${user.role}')" 
                      class="px-2 py-1 text-xs bg-[#F76F53] hover:bg-[#F76F53]/90 dark:text-white rounded transition-colors">
                <i class="fas fa-${user.role === 'client' ? 'arrow-up' : 'arrow-down'} mr-1"></i>
                ${user.role === 'client' ? 'Promote' : 'Demote'}
              </button>
              <button onclick="deleteUser('${user._id}', '${user.name}')" 
                      class="px-2 py-1 text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors">
                <i class="fas fa-trash mr-1"></i>
                Delete
              </button>
            ` : `
              <span class="text-xs opacity-60 text-[#2E2E2E] dark:text-[#F2F0E3]">
                ${isSuperAdmin ? 'Super Admin' : isCurrentUser ? 'You' : 'No actions'}
              </span>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function showUsersError() {
  const tbody = document.getElementById('users-table-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center">
          <div class="text-red-500 mb-4">
            <i class="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <p class="text-xl mb-4">Failed to load users</p>
          <button onclick="loadUsers()" class="btn btn-primary">
            <i class="fas fa-redo mr-2"></i> Retry
          </button>
        </td>
      </tr>
    `;
  }
}

async function loadMovies() {
  try {
    const response = await axios.get(`${API_BASE_URL}/movies`, getAuthHeaders());
    dashboardData.movies = response.data.data?.movies || response.data.data || [];
    updateMoviesTable();
  } catch (error) {
    console.error('Error loading movies:', error);
    showMoviesError();
  }
}

function updateMoviesTable() {
  const tbody = document.getElementById('movies-table-body');
  if (!tbody) return;

  if (dashboardData.movies.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center">
          <div class="text-[#2196F3] mb-4">
            <i class="fas fa-film text-4xl"></i>
          </div>
          <p class="text-xl mb-4">No movies found</p>
          <a href="/pages/movies/create.html" class="btn btn-primary bg-gradient-to-r from-[#F76F53] to-[#FF8A70] border-none text-white">
            <i class="fas fa-plus mr-2"></i> Add First Movie
          </a>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = dashboardData.movies.map(movie => `
    <tr class="table-row transition-colors border-b border-[#e0ddd0] dark:border-[#2E2E2E] hover:bg-[#e8e6d9] dark:hover:bg-[#2E2E2E]">
      <td class="py-4 px-6">
        <div class="flex items-center space-x-3">
          <img src="${movie.poster || '/assets/images/movie-placeholder.jpg'}" 
               alt="${movie.title || 'Movie'}" 
               class="w-12 h-16 object-cover rounded-lg shadow-sm"
               onerror="this.src='/assets/images/movie-placeholder.jpg'">
          <div class="flex-1">
            <p class="font-medium line-clamp-1 text-[#2E2E2E] dark:text-[#F2F0E3]">${movie.title || 'Untitled Movie'}</p>
            <div class="flex flex-wrap gap-1 mt-1">
              ${(movie.genre || []).slice(0, 2).map(g => 
                `<span class="px-1.5 py-0.5 bg-[#e8e6d9] dark:bg-[#2E2E2E] text-[#2E2E2E] dark:text-[#F2F0E3] text-xs rounded">${g}</span>`
              ).join('')}
              ${(movie.genre || []).length > 2 ? `<span class="text-xs text-[#F76F53]">+${movie.genre.length - 2}</span>` : ''}
            </div>
          </div>
        </div>
      </td>
      <td class="py-4 px-6 text-[#2E2E2E] dark:text-[#F2F0E3]">${movie.year || 'N/A'}</td>
      <td class="py-4 px-6 text-[#2E2E2E] dark:text-[#F2F0E3]">${movie.director || 'Unknown'}</td>
      <td class="py-4 px-6 text-[#2E2E2E] dark:text-[#F2F0E3]">${movie.duration ? movie.duration + ' min' : 'N/A'}</td>
      <td class="py-4 px-6">
        <div class="flex items-center">
          <i class="fas fa-star text-yellow-400 mr-1"></i>
          <span class="font-medium text-[#2E2E2E] dark:text-[#F2F0E3]">${movie.averageRating ? movie.averageRating.toFixed(1) : 'N/A'}</span>
        </div>
      </td>
      <td class="py-4 px-6">
        <div class="flex space-x-1">
          <a href="/pages/movies/details.html?id=${movie._id}" 
             class="px-2 py-1 text-xs bg-[#e8e6d9] hover:bg-[#e0ddd0] text-[#2E2E2E] rounded transition-colors dark:bg-[#2E2E2E] dark:hover:bg-[#1F1F1F] dark:text-[#F2F0E3]">
            <i class="fas fa-eye mr-1"></i>View
          </a>
          <a href="/pages/movies/edit.html?id=${movie._id}" 
             class="px-2 py-1 text-xs bg-[#F76F53] hover:bg-[#F76F53]/90 dark:text-white rounded transition-colors">
            <i class="fas fa-edit mr-1"></i>Edit
          </a>
          <button onclick="deleteMovie('${movie._id}', '${movie.title}')" 
                  class="px-2 py-1 text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors">
            <i class="fas fa-trash mr-1"></i>Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function showMoviesError() {
  const tbody = document.getElementById('movies-table-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center">
          <div class="text-red-500 mb-4">
            <i class="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <p class="text-xl mb-4">Failed to load movies</p>
          <button onclick="loadMovies()" class="btn btn-primary">
            <i class="fas fa-redo mr-2"></i> Retry
          </button>
        </td>
      </tr>
    `;
  }
}

async function loadGenres() {
  try {
    const response = await axios.get(`${API_BASE_URL}/genres`, getAuthHeaders());
    dashboardData.genres = response.data.data?.genres || response.data.data || [];
    updateGenresTable();
  } catch (error) {
    console.error('Error loading genres:', error);
    showGenresError();
  }
}

function updateGenresTable() {
  const tbody = document.getElementById('genres-table-body');
  if (!tbody) return;

  if (dashboardData.genres.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center">
          <div class="text-[#FF9800] mb-4">
            <i class="fas fa-tags text-4xl"></i>
          </div>
          <p class="text-xl mb-4">No genres found</p>
          <button onclick="showGenreModal()" class="btn btn-primary">
            <i class="fas fa-plus mr-2"></i> Add First Genre
          </button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = dashboardData.genres.map(genre => `
    <tr class="table-row transition-colors">
      <td class="py-4 px-6">
        <div class="flex items-center space-x-3">
          <div class="w-4 h-4 rounded-full" style="background-color: ${genre.color || '#3B82F6'}"></div>
          <span class="font-medium">${genre.name}</span>
        </div>
      </td>
      <td class="py-4 px-6">
        <span class="opacity-80">${genre.description || 'No description'}</span>
      </td>
      <td class="py-4 px-6">
        <span class="font-medium">${genre.movieCount || '0'}</span>
      </td>
      <td class="py-4 px-6">
        <span class="px-2 py-1 rounded-full text-xs font-medium ${genre.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
          ${genre.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="py-4 px-6">
        <div class="flex space-x-2">
          <button onclick="editGenre('${genre._id}')" 
                  class="px-2 py-1 text-xs bg-[#FF9800] hover:bg-[#FF9800]/90 dark:text-white rounded transition-colors">
            <i class="fas fa-edit mr-1"></i>Edit
          </button>
          <button onclick="deleteGenre('${genre._id}', '${genre.name}')" 
                  class="px-2 py-1 text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors">
            <i class="fas fa-trash mr-1"></i>Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function showGenresError() {
  const tbody = document.getElementById('genres-table-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center">
          <div class="text-red-500 mb-4">
            <i class="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <p class="text-xl mb-4">Failed to load genres</p>
          <button onclick="loadGenres()" class="btn btn-primary">
            <i class="fas fa-redo mr-2"></i> Retry
          </button>
        </td>
      </tr>
    `;
  }
}

async function loadRoles() {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles/stats`, getAuthHeaders());
    dashboardData.roles = response.data.data.stats;
    updateRolesTable();
  } catch (error) {
    console.error('Error loading roles:', error);
    showRolesError();
  }
}

function updateRolesTable() {
  const tbody = document.getElementById('roles-table-body');
  if (!tbody) return;

  console.log('Roles data in updateRolesTable:', dashboardData.roles);

  if (dashboardData.roles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center">
          <div class="text-[#9C27B0] mb-4">
            <i class="fas fa-shield-alt text-4xl"></i>
          </div>
          <p class="text-xl mb-4">No roles found</p>
          <button onclick="showRoleModal()" class="btn btn-primary">
            <i class="fas fa-plus mr-2"></i> Add First Role
          </button>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = dashboardData.roles.map(role => `
    <tr class="table-row transition-colors">
      <td class="py-4 px-6">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-[#9C27B0] to-[#BA68C8] rounded-full flex items-center justify-center">
            <i class="fas fa-shield-alt text-white"></i>
          </div>
          <span class="font-medium capitalize">${role.name}</span>
        </div>
      </td>
      <td class="py-4 px-6">
        <span class="opacity-80">${role.description || 'No description'}</span>
      </td>
      <td class="py-4 px-6">
        <div class="flex flex-wrap gap-1">
          ${role.permissions ? role.permissions.map(perm => 
            `<span class="px-2 py-1 bg-[#9C27B0]/20 text-[#9C27B0] text-xs rounded">${perm}</span>`
          ).join('') : 'None'}
        </div>
      </td>
      <td class="py-4 px-6">
        <span class="font-medium">${role.userCount || 0}</span>
      </td>
      <td class="py-4 px-6">
        <div class="flex space-x-2">
          ${!['client', 'admin', 'super-admin'].includes(role.name) ? `
            <button onclick="editRole('${role._id}')" 
                    class="px-2 py-1 text-xs bg-[#9C27B0] hover:bg-[#9C27B0]/90 dark:text-white rounded transition-colors">
              <i class="fas fa-edit mr-1"></i>Edit
            </button>
            <button onclick="deleteRole('${role._id}', '${role.name}')" 
                    class="px-2 py-1 text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors">
              <i class="fas fa-trash mr-1"></i>Delete
            </button>
          ` : `
            <span class="text-xs opacity-60">System Role</span>
          `}
        </div>
      </td>
    </tr>
  `).join('');
}

function showRolesError() {
  const tbody = document.getElementById('roles-table-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center">
          <div class="text-red-500 mb-4">
            <i class="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <p class="text-xl mb-4">Failed to load roles</p>
          <button onclick="loadRoles()" class="btn btn-primary">
            <i class="fas fa-redo mr-2"></i> Retry
          </button>
        </td>
      </tr>
    `;
  }
}

async function loadReviews() {
  try {
    const response = await axios.get(`${API_BASE_URL}/reviews/admin`, getAuthHeaders());
    dashboardData.reviews = response.data.data?.reviews || response.data.data || [];
    updateReviewsTable();
  } catch (error) {
    console.error('Error loading reviews:', error);
    showReviewsError();
  }
}

function updateReviewsTable() {
  const tbody = document.getElementById('reviews-table-body');
  if (!tbody) return;

  if (dashboardData.reviews.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center">
          <div class="text-[#E91E63] mb-4">
            <i class="fas fa-star text-4xl"></i>
          </div>
          <p class="text-xl mb-4">No reviews found</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = dashboardData.reviews.map(review => `
    <tr class="table-row transition-colors">
      <td class="py-4 px-6">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#E91E63] to-[#F48FB1] flex items-center justify-center">
            <span class="dark:text-white font-bold text-xs">${review.user?.name?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <span class="font-medium">${review.user?.name || 'Unknown User'}</span>
        </div>
      </td>
      <td class="py-4 px-6">
        <span class="font-medium">${review.movie?.title || 'Unknown Movie'}</span>
      </td>
      <td class="py-4 px-6">
        <div class="flex items-center">
          <i class="fas fa-star text-yellow-400 mr-1"></i>
          <span class="font-medium">${review.rating}/10</span>
        </div>
      </td>
      <td class="py-4 px-6">
        <p class="line-clamp-2 text-sm opacity-80">${review.review || 'No review text'}</p>
      </td>
      <td class="py-4 px-6">
        <span class="text-sm opacity-80">${formatDate(review.createdAt)}</span>
      </td>
      <td class="py-4 px-6">
        <div class="flex space-x-2">
          <button onclick="viewReview('${review._id}')" 
                  class="px-2 py-1 text-xs bg-[#e8e6d9] hover:bg-[#e0ddd0] text-[#2E2E2E] rounded transition-colors dark:bg-[#2E2E2E] dark:hover:bg-[#1F1F1F] dark:text-[#F2F0E3]">
            <i class="fas fa-eye mr-1"></i>View
          </button>
          <button onclick="deleteReview('${review._id}')" 
                  class="px-2 py-1 text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors">
            <i class="fas fa-trash mr-1"></i>Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function showReviewsError() {
  const tbody = document.getElementById('reviews-table-body');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center">
          <div class="text-red-500 mb-4">
            <i class="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <p class="text-xl mb-4">Failed to load reviews</p>
          <button onclick="loadReviews()" class="btn btn-primary">
            <i class="fas fa-redo mr-2"></i> Retry
          </button>
        </td>
      </tr>
    `;
  }
}

// ======================
// Tab Data Loading
// ======================

function loadTabData(tabName) {
  switch(tabName) {
    case 'overview':
      updateChartsData();
      break;
    case 'users':
      // Always fetch fresh data, don't rely on cached data
      console.log('Loading users tab - fetching fresh data');
      loadUsers(); // This fetches fresh data and then calls updateUsersTable()
      break;
    case 'movies':
      // Always fetch fresh data, don't rely on cached data  
      console.log('Loading movies tab - fetching fresh data');
      loadMovies(); // This fetches fresh data and then calls updateMoviesTable()
      break;
    case 'genres':
      console.log('Loading genres tab - fetching fresh data');
      loadGenres(); // This fetches fresh data and then calls updateGenresTable()
      break;
    case 'roles':
      console.log('Loading roles tab - fetching fresh data');
      loadRoles(); // This fetches fresh data and then calls updateRolesTable()
      break;
    case 'reviews':
      console.log('Loading reviews tab - fetching fresh data');
      loadReviews(); // This fetches fresh data and then calls updateReviewsTable()
      break;
  }
}

// ======================
// Charts Initialization
// ======================

function initializeCharts() {
  setTimeout(() => {
    initializeGenreChart();
    initializeUserRolesChart();
  }, 500);
}

function initializeGenreChart() {
  const ctx = document.getElementById('genreChart');
  if (!ctx) return;

  const genreData = calculateGenreDistribution();
  
  if (charts.genreChart) {
    charts.genreChart.destroy();
  }

  charts.genreChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: genreData.labels,
      datasets: [{
        data: genreData.data,
        backgroundColor: genreData.colors,
        borderWidth: 2,
        borderColor: '#F2F0E3'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      }
    }
  });
}

function initializeUserRolesChart() {
  const ctx = document.getElementById('userRolesChart');
  if (!ctx) return;

  const rolesData = calculateUserRolesDistribution();
  
  if (charts.userRolesChart) {
    charts.userRolesChart.destroy();
  }

  charts.userRolesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: rolesData.labels,
      datasets: [{
        label: 'Users',
        data: rolesData.data,
        backgroundColor: ['#F76F53', '#4CAF50', '#9C27B0'],
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function calculateGenreDistribution() {
  const genreCounts = {};
  const colors = ['#F76F53', '#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#E91E63', '#795548', '#607D8B'];
  
  dashboardData.movies.forEach(movie => {
    movie.genre.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });

  const sortedGenres = Object.entries(genreCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8); // Top 8 genres

  return {
    labels: sortedGenres.map(([genre]) => genre),
    data: sortedGenres.map(([,count]) => count),
    colors: colors.slice(0, sortedGenres.length)
  };
}

function calculateUserRolesDistribution() {
  const roleCounts = { client: 0, admin: 0, 'super-admin': 0 };
  
  dashboardData.users.forEach(user => {
    roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
  });

  return {
    labels: ['Clients', 'Admins', 'Super Admins'],
    data: [roleCounts.client, roleCounts.admin, roleCounts['super-admin']]
  };
}

function updateChartsData() {
  if (charts.genreChart) {
    const genreData = calculateGenreDistribution();
    charts.genreChart.data.labels = genreData.labels;
    charts.genreChart.data.datasets[0].data = genreData.data;
    charts.genreChart.data.datasets[0].backgroundColor = genreData.colors;
    charts.genreChart.update();
  }

  if (charts.userRolesChart) {
    const rolesData = calculateUserRolesDistribution();
    charts.userRolesChart.data.datasets[0].data = rolesData.data;
    charts.userRolesChart.update();
  }
}

// ======================
// Action Functions
// ======================

async function toggleUserRole(userId, currentRole) {
  if (currentUser.role !== 'super-admin') {
    showNotification('error', 'Access Denied', 'Only super admins can modify user roles');
    return;
  }

  const action = currentRole === 'client' ? 'promote to admin' : 'demote to client';
  
  const result = await Swal.fire({
    title: `${action.charAt(0).toUpperCase() + action.slice(1)}?`,
    text: `Are you sure you want to ${action}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: currentRole === 'client' ? '#10b981' : '#f59e0b',
    cancelButtonColor: '#6b7280',
    confirmButtonText: `Yes, ${action}!`,
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    try {
      await axios.patch(`${API_BASE_URL}/users/${userId}/role`, {}, getAuthHeaders());
      
      showNotification('success', 'Role Updated!', `User has been ${action}d successfully.`);
      await loadUsers();
      await loadStats();
      
    } catch (err) {
      console.error('Role toggle error:', err);
      showNotification('error', 'Update Failed', err.response?.data?.message || 'Failed to update user role');
    }
  }
}

async function deleteUser(userId, userName) {
  if (currentUser.role !== 'super-admin') {
    showNotification('error', 'Access Denied', 'Only super admins can delete users');
    return;
  }

  const result = await Swal.fire({
    title: 'Delete User?',
    html: `Are you sure you want to delete <strong>${userName}</strong>?<br><small class="text-gray-500">This action cannot be undone.</small>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete user!',
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`, getAuthHeaders());
      
      showNotification('success', 'User Deleted!', `${userName} has been deleted successfully.`);
      await loadUsers();
      await loadStats();
      
    } catch (err) {
      console.error('Delete user error:', err);
      showNotification('error', 'Delete Failed', err.response?.data?.message || 'Failed to delete user');
    }
  }
}

async function deleteMovie(movieId, movieTitle) {
  const result = await Swal.fire({
    title: 'Delete Movie?',
    html: `Are you sure you want to delete <strong>"${movieTitle}"</strong>?<br><small class="text-gray-500">This will also delete all reviews for this movie.</small>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete movie!',
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`${API_BASE_URL}/movies/${movieId}`, getAuthHeaders());
      
      showNotification('success', 'Movie Deleted!', `"${movieTitle}" has been deleted successfully.`);
      await loadMovies();
      await loadStats();
      updateChartsData();
      
    } catch (err) {
      console.error('Delete movie error:', err);
      showNotification('error', 'Delete Failed', err.response?.data?.message || 'Failed to delete movie');
    }
  }
}

async function deleteGenre(genreId, genreName) {
  const result = await Swal.fire({
    title: 'Delete Genre?',
    text: `Are you sure you want to delete "${genreName}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`${API_BASE_URL}/genres/${genreId}`, getAuthHeaders());
      showNotification('success', 'Deleted!', 'Genre has been deleted.');
      await loadGenres();
      await loadStats();
      updateChartsData();
    } catch (err) {
      showNotification('error', 'Error', err.response?.data?.message || 'Failed to delete genre');
    }
  }
}

async function deleteRole(roleId, roleName) {
  const result = await Swal.fire({
    title: 'Delete Role?',
    text: `Are you sure you want to delete "${roleName}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`${API_BASE_URL}/roles/${roleId}`, getAuthHeaders());
      showNotification('success', 'Deleted!', 'Role has been deleted.');
      await loadRoles();
      await loadStats();
    } catch (err) {
      showNotification('error', 'Error', err.response?.data?.message || 'Failed to delete role');
    }
  }
}

async function deleteReview(reviewId) {
  const result = await Swal.fire({
    title: 'Delete Review?',
    text: 'Are you sure you want to delete this review?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`${API_BASE_URL}/reviews/${reviewId}`, getAuthHeaders());
      showNotification('success', 'Deleted!', 'Review has been deleted.');
      await loadReviews();
      await loadStats();
    } catch (err) {
      showNotification('error', 'Error', err.response?.data?.message || 'Failed to delete review');
    }
  }
}

// ======================
// Event Listeners Setup
// ======================

function setupEventListeners() {
  // Refresh buttons
  document.getElementById('refresh-all-data')?.addEventListener('click', async () => {
    await loadAllData();
    updateChartsData();
    showNotification('success', 'Refreshed', 'All data has been refreshed');
  });

  document.getElementById('refresh-users')?.addEventListener('click', loadUsers);
  document.getElementById('refresh-movies')?.addEventListener('click', loadMovies);
  document.getElementById('refresh-genres')?.addEventListener('click', loadGenres);
  document.getElementById('refresh-roles')?.addEventListener('click', loadRoles);
  document.getElementById('refresh-reviews')?.addEventListener('click', loadReviews);

  // Quick action buttons
  document.getElementById('quick-add-genre')?.addEventListener('click', () => showGenreModal());
  document.getElementById('quick-add-role')?.addEventListener('click', () => showRoleModal());
  document.getElementById('add-genre-btn')?.addEventListener('click', () => showGenreModal());
  document.getElementById('add-role-btn')?.addEventListener('click', () => showRoleModal());

  // Search functionality
  setupSearchListeners();
}

function setupSearchListeners() {
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Users search
  const usersSearch = document.getElementById('users-search');
  if (usersSearch) {
    usersSearch.addEventListener('input', debounce(filterUsers, 300));
  }

  // Movies search
  const moviesSearch = document.getElementById('movies-search');
  if (moviesSearch) {
    moviesSearch.addEventListener('input', debounce(filterMovies, 300));
  }

  // Reviews search
  const reviewsSearch = document.getElementById('reviews-search');
  if (reviewsSearch) {
    reviewsSearch.addEventListener('input', debounce(filterReviews, 300));
  }
}

function filterUsers() {
  const searchTerm = document.getElementById('users-search').value.toLowerCase().trim();
  const rows = document.querySelectorAll('#users-table-body tr');

  rows.forEach(row => {
    if (row.querySelector('.animate-spin')) return; // Skip loading row
    
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

function filterMovies() {
  const searchTerm = document.getElementById('movies-search').value.toLowerCase().trim();
  const rows = document.querySelectorAll('#movies-table-body tr');

  rows.forEach(row => {
    if (row.querySelector('.animate-spin')) return; // Skip loading row
    
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

function filterReviews() {
  const searchTerm = document.getElementById('reviews-search').value.toLowerCase().trim();
  const rows = document.querySelectorAll('#reviews-table-body tr');

  rows.forEach(row => {
    if (row.querySelector('.animate-spin')) return; // Skip loading row
    
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// ======================
// Auto Refresh Setup
// ======================

function setupAutoRefresh() {
  // Auto-refresh stats every 5 minutes
  setInterval(async () => {
    if (!document.hidden) {
      await loadStats();
      updateLastRefresh();
    }
  }, 300000); // 5 minutes
}

// ======================
// Utility Functions
// ======================

function getRoleColor(role) {
  switch(role) {
    case 'super-admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'client': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// ======================
// Modal Functions (from admin.js)
// ======================

async function showGenreModal(genreData = null) {
  const isEdit = genreData !== null;
  
  const { value: formValues } = await Swal.fire({
    title: isEdit ? 'Edit Genre' : 'Add New Genre',
    html: `
      <div class="space-y-4 text-left">
        <div>
          <label class="block text-sm font-medium mb-1">Genre Name</label>
          <input id="genre-name" class="swal2-input" placeholder="Genre Name" value="${genreData?.name || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Description</label>
          <textarea id="genre-description" class="swal2-textarea" placeholder="Description (optional)">${genreData?.description || ''}</textarea>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Color</label>
          <input id="genre-color" type="color" class="swal2-input" value="${genreData?.color || '#3B82F6'}">
        </div>
        <div class="flex items-center">
          <input id="genre-active" type="checkbox" ${genreData?.isActive !== false ? 'checked' : ''}>
          <label for="genre-active" class="ml-2 text-sm">Active</label>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: isEdit ? 'Update' : 'Create',
    confirmButtonColor: '#F76F53',
    preConfirm: () => {
      const name = document.getElementById('genre-name').value;
      if (!name) {
        Swal.showValidationMessage('Please enter a genre name');
        return false;
      }
      return {
        name,
        description: document.getElementById('genre-description').value,
        color: document.getElementById('genre-color').value,
        isActive: document.getElementById('genre-active').checked
      };
    }
  });

  if (formValues) {
  try {
    if (isEdit && genreData && genreData._id) {  
      await axios.patch(`${API_BASE_URL}/genres/${genreData._id}`, formValues, getAuthHeaders());
      showNotification('success', 'Success!', 'Genre updated successfully');
    } else {
      await axios.post(`${API_BASE_URL}/genres`, formValues, getAuthHeaders());
      showNotification('success', 'Success!', 'Genre created successfully');
    }
    await loadGenres();
    await loadStats();
    updateChartsData();
  } catch (err) {
    showNotification('error', 'Error', err.response?.data?.message || 'Operation failed');
  }
}
}

async function showRoleModal(roleData = null) {
  const isEdit = roleData !== null;
  
  const { value: formValues } = await Swal.fire({
    title: isEdit ? 'Edit Role' : 'Add New Role',
    html: `
      <div class="space-y-4 text-left">
        <div>
          <label class="block text-sm font-medium mb-1">Role Name</label>
          <input id="role-name" class="swal2-input" placeholder="Role Name" value="${roleData?.name || ''}" style="margin: 0; width: 100%;">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Description</label>
          <textarea id="role-description" class="swal2-textarea" placeholder="Description (optional)" style="margin: 0; width: 100%; min-height: 80px;">${roleData?.description || ''}</textarea>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Permissions</label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input type="checkbox" id="perm-read" value="read" ${roleData?.permissions?.includes('read') ? 'checked' : 'checked'}>
              <span class="ml-2 text-sm">Read - View content</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" id="perm-write" value="write" ${roleData?.permissions?.includes('write') ? 'checked' : ''}>
              <span class="ml-2 text-sm">Write - Create/Edit content</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" id="perm-delete" value="delete" ${roleData?.permissions?.includes('delete') ? 'checked' : ''}>
              <span class="ml-2 text-sm">Delete - Remove content</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" id="perm-admin" value="admin" ${roleData?.permissions?.includes('admin') ? 'checked' : ''}>
              <span class="ml-2 text-sm">Admin - Administrative access</span>
            </label>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: isEdit ? 'Update Role' : 'Create Role',
    confirmButtonColor: '#9C27B0',
    cancelButtonColor: '#6b7280',
    width: '500px',
    preConfirm: () => {
      const name = document.getElementById('role-name').value.trim();
      if (!name) {
        Swal.showValidationMessage('Please enter a role name');
        return false;
      }
      
      const permissions = [];
      if (document.getElementById('perm-read').checked) permissions.push('read');
      if (document.getElementById('perm-write').checked) permissions.push('write');
      if (document.getElementById('perm-delete').checked) permissions.push('delete');
      if (document.getElementById('perm-admin').checked) permissions.push('admin');
      
      if (permissions.length === 0) {
        Swal.showValidationMessage('Please select at least one permission');
        return false;
      }
      
      return {
        name: name.toLowerCase(),
        description: document.getElementById('role-description').value.trim(),
        permissions: permissions
      };
    }
  });

  if (formValues) {
    try {
      console.log('Submitting role data:', formValues);
      
      let response;
      if (isEdit && roleData && roleData._id) { 
        response = await axios.patch(`${API_BASE_URL}/roles/${roleData._id}`, formValues, getAuthHeaders());
        showNotification('success', 'Success!', 'Role updated successfully');
      } else {
        response = await axios.post(`${API_BASE_URL}/roles`, formValues, getAuthHeaders());
        showNotification('success', 'Success!', 'Role created successfully');
      }
      
      console.log('Role operation response:', response.data);
      
      // Reload data
      await loadRoles();
      await loadStats();
      
    } catch (err) {
      console.error('Role operation error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Operation failed';
      showNotification('error', 'Error', errorMessage);
    }
  }
}

async function editGenre(genreId) {
  const genre = dashboardData.genres.find(g => g._id === genreId);
  if (genre) {
    await showGenreModal(genre);
  }
}

async function editRole(roleId) {
  const role = dashboardData.roles.find(r => r._id === roleId);
  if (role) {
    await showRoleModal(role);
  }
}

async function viewReview(reviewId) {
  const review = dashboardData.reviews.find(r => r._id === reviewId);
  if (!review) return;

  await Swal.fire({
    title: 'Review Details',
    html: `
      <div class="text-left space-y-4">
        <div>
          <strong>User:</strong> ${review.user?.name || 'Unknown User'}
        </div>
        <div>
          <strong>Movie:</strong> ${review.movie?.title || 'Unknown Movie'}
        </div>
        <div>
          <strong>Rating:</strong> 
          <div class="flex items-center mt-1">
            ${Array.from({length: review.rating}, () => '<i class="fas fa-star text-yellow-400"></i>').join('')}
            ${Array.from({length: 10 - review.rating}, () => '<i class="far fa-star text-gray-300"></i>').join('')}
            <span class="ml-2">${review.rating}/10</span>
          </div>
        </div>
        <div>
          <strong>Review:</strong>
          <p class="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded">${review.review || 'No review text'}</p>
        </div>
        <div>
          <strong>Date:</strong> ${formatDate(review.createdAt)}
        </div>
      </div>
    `,
    confirmButtonText: 'Close',
    confirmButtonColor: '#F76F53'
  });
}

// ======================
// Export Functions
// ======================

async function exportAllData() {
  try {
    const data = {
      movies: dashboardData.movies,
      users: dashboardData.users.map(user => ({ ...user, password: undefined })),
      genres: dashboardData.genres,
      roles: dashboardData.roles,
      reviews: dashboardData.reviews,
      stats: dashboardData.stats,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scydb-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('success', 'Export Complete', 'Data has been exported successfully');
  } catch (error) {
    console.error('Export error:', error);
    showNotification('error', 'Export Failed', 'Could not export data');
  }
}

function hasPermission(permission) {
  if (!currentUser) return false;
  
  // Super admin has all permissions
  if (currentUser.role === 'super-admin') return true;
  
  // Admin has most permissions except user management
  if (currentUser.role === 'admin') {
    return ['read', 'write', 'delete'].includes(permission);
  }
  
  // Client has only read permission
  if (currentUser.role === 'client') {
    return permission === 'read';
  }
  
  return false;
}

// Enhanced user role toggle with proper role hierarchy
async function toggleUserRole(userId, currentRole) {
  if (!hasPermission('admin') || currentUser.role !== 'super-admin') {
    showNotification('error', 'Access Denied', 'Only super admins can modify user roles');
    return;
  }

  const targetUser = dashboardData.users.find(u => u._id === userId);
  if (!targetUser) {
    showNotification('error', 'Error', 'User not found');
    return;
  }

  // Prevent changing super-admin roles
  if (targetUser.role === 'super-admin') {
    showNotification('error', 'Access Denied', 'Cannot modify super admin roles');
    return;
  }

  // Prevent users from changing their own role
  if (targetUser._id === currentUser._id) {
    showNotification('error', 'Access Denied', 'You cannot change your own role');
    return;
  }

  let newRole;
  let actionText;
  
  if (currentRole === 'client') {
    newRole = 'admin';
    actionText = 'promote to admin';
  } else if (currentRole === 'admin') {
    newRole = 'client';
    actionText = 'demote to client';
  } else {
    showNotification('error', 'Error', 'Invalid role transition');
    return;
  }

  const result = await Swal.fire({
    title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)}?`,
    html: `
      <div class="text-left">
        <p>Are you sure you want to ${actionText}?</p>
        <div class="mt-4 p-3 bg-gray-100 rounded">
          <strong>User:</strong> ${targetUser.name}<br>
          <strong>Current Role:</strong> ${currentRole}<br>
          <strong>New Role:</strong> ${newRole}
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: currentRole === 'client' ? '#10b981' : '#f59e0b',
    cancelButtonColor: '#6b7280',
    confirmButtonText: `Yes, ${actionText}!`,
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/users/${userId}`, 
        { role: newRole }, 
        getAuthHeaders()
      );
      
      showNotification('success', 'Role Updated!', `User has been ${actionText}d successfully.`);
      await loadUsers();
      await loadStats();
      
    } catch (err) {
      console.error('Role toggle error:', err);
      showNotification('error', 'Update Failed', err.response?.data?.message || 'Failed to update user role');
    }
  }
}

// Update UI elements based on permissions
function updateUIBasedOnPermissions() {
  const hasWriteAccess = hasPermission('write');
  const hasDeleteAccess = hasPermission('delete');
  const hasAdminAccess = hasPermission('admin');

  // Hide/show buttons based on permissions
  document.querySelectorAll('[data-requires-write]').forEach(el => {
    el.style.display = hasWriteAccess ? '' : 'none';
  });

  document.querySelectorAll('[data-requires-delete]').forEach(el => {
    el.style.display = hasDeleteAccess ? '' : 'none';
  });

  document.querySelectorAll('[data-requires-admin]').forEach(el => {
    el.style.display = hasAdminAccess ? '' : 'none';
  });

  // Update sidebar based on role
  const restrictedTabs = ['users', 'roles'];
  restrictedTabs.forEach(tabName => {
    const tab = document.getElementById(`${tabName}-tab`);
    if (tab && !hasAdminAccess) {
      tab.style.opacity = '0.5';
      tab.style.pointerEvents = 'none';
    }
  });
}

// Initialize role-based UI on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(updateUIBasedOnPermissions, 1000);
});

// Setup export button listener
document.getElementById('export-all-data')?.addEventListener('click', exportAllData);

// ======================
// Global Functions for Window Access
// ======================

// Make functions available globally for onclick handlers
window.toggleUserRole = toggleUserRole;
window.deleteUser = deleteUser;
window.deleteMovie = deleteMovie;
window.deleteGenre = deleteGenre;
window.deleteRole = deleteRole;
window.deleteReview = deleteReview;
window.editGenre = editGenre;
window.editRole = editRole;
window.viewReview = viewReview;
window.showGenreModal = showGenreModal;
window.showRoleModal = showRoleModal;
window.loadUsers = loadUsers;
window.loadMovies = loadMovies;
window.loadGenres = loadGenres;
window.loadRoles = loadRoles;
window.loadReviews = loadReviews;
window.hasPermission = hasPermission