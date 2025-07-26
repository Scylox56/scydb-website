// ======================
// Global Variables & Config
// ======================

let currentTab = 'users';
let isLoading = false;

// ======================
// Authentication & Authorization
// ======================

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        withCredentials: true
    };
}

function checkAdminAccess() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user?.role || !['admin', 'super-admin'].includes(user.role)) {
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You need admin privileges to access this page.',
            showConfirmButton: false,
            timer: 2000
        }).then(() => {
            window.location.href = '/pages/index.html';
        });
        return false;
    }
    
    return user;
}

// ======================
// Statistics Functions
// ======================

async function loadStats() {
    try {
        console.log('Loading dashboard statistics...');
        
        const [moviesRes, usersRes] = await Promise.all([
    axios.get(`${API_BASE_URL}/movies`, getAuthHeaders()),
    axios.get(`${API_BASE_URL}/users`, getAuthHeaders())
]);

        // Update statistics cards
        const totalMoviesEl = document.getElementById('total-movies');
        const totalUsersEl = document.getElementById('total-users');
        const totalReviewsEl = document.getElementById('total-reviews');

        if (totalMoviesEl) {
    const movieCount = moviesRes.data.results || 
                      moviesRes.data.total || 
                      moviesRes.data.data?.movies?.length || 
                      (Array.isArray(moviesRes.data.data) ? moviesRes.data.data.length : 0) ||
                      (Array.isArray(moviesRes.data) ? moviesRes.data.length : 0) || 0;
    totalMoviesEl.textContent = movieCount;
    console.log('Movies response:', moviesRes.data, 'Count:', movieCount);
}

if (totalUsersEl) {
    const userCount = usersRes.data.results || 
                     usersRes.data.total || 
                     usersRes.data.data?.users?.length || 
                     (Array.isArray(usersRes.data.data) ? usersRes.data.data.length : 0) ||
                     (Array.isArray(usersRes.data) ? usersRes.data.length : 0) || 0;
    totalUsersEl.textContent = userCount;
    console.log('Users response:', usersRes.data, 'Count:', userCount);
}
        

        // Update last updated timestamp
        const lastUpdatedElements = document.querySelectorAll('[id$="-last-updated"]');
        lastUpdatedElements.forEach(el => {
            el.textContent = `Last updated ${new Date().toLocaleTimeString()}`;
        });

        console.log('Statistics loaded successfully');

    } catch (err) {
        console.error('Error fetching stats:', err);
        
        // Show error in stats cards
        ['total-movies', 'total-users'].forEach(id =>  {
            const el = document.getElementById(id);
            if (el) el.textContent = 'Error';
        });
        
        Swal.fire({
            icon: 'warning',
            title: 'Failed to load statistics',
            text: err.response?.data?.message || 'Please refresh the page',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// ======================
// Tab Management
// ======================

function initTabSystem() {
    const usersTab = document.getElementById('users-tab');
    const moviesTab = document.getElementById('movies-tab');
    const usersContent = document.getElementById('users-content');
    const moviesContent = document.getElementById('movies-content');

    if (!usersTab || !moviesTab || !usersContent || !moviesContent) {
        console.error('Tab elements not found');
        return;
    }

    // Tab switching logic
    usersTab.addEventListener('click', () => switchTab('users'));
    moviesTab.addEventListener('click', () => switchTab('movies'));
    
    // Initialize with users tab
    switchTab('users');
}

function switchTab(tabName) {
    if (isLoading) return;
    
    currentTab = tabName;
    
    // Update tab buttons
    const usersTab = document.getElementById('users-tab');
    const moviesTab = document.getElementById('movies-tab');
    const usersContent = document.getElementById('users-content');
    const moviesContent = document.getElementById('movies-content');

    // Reset tab styles
    [usersTab, moviesTab].forEach(tab => {
        if (tab) {
            tab.classList.remove('active', 'text-primary', 'border-primary');
            tab.classList.add('text-gray-500', 'hover:text-primary');
        }
    });

    // Hide all content
    [usersContent, moviesContent].forEach(content => {
        if (content) content.classList.add('hidden');
    });

   // Show active tab
if (tabName === 'users') {
    usersTab?.classList.add('active', 'text-primary', 'border-primary');
    usersTab?.classList.remove('text-gray-500');
    usersContent?.classList.remove('hidden');
    console.log('Loading users table...'); // debug
    loadUsersTable();
} else if (tabName === 'movies') {
    moviesTab?.classList.add('active', 'text-primary', 'border-primary');
    moviesTab?.classList.remove('text-gray-500');
    moviesContent?.classList.remove('hidden');
    console.log('Loading movies table...'); // debug
    loadMoviesTable();
}
}

// ======================
// User Management
// ======================

async function loadUsersTable() {
    if (isLoading) return;
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = currentUser.role === 'super-admin';
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    isLoading = true;
    console.log('Current user:', currentUser); // Add this debug line
    console.log('Is super admin:', isSuperAdmin); // Add this debug line
    try {
        // Show loading state
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-8 text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
                    <span class="text-gray-500 dark:text-gray-400">Loading users...</span>
                </td>
            </tr>
        `;

        const response = await axios.get(`${API_BASE_URL}/users`, getAuthHeaders());
       const users = response.data.data?.users || response.data.data || response.data || [];
        console.log('Users data:', users);// for debugging
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="py-8 text-center text-gray-500 dark:text-gray-400">
                        No users found
                    </td>
                </tr>
            `;
            return;
        }

        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isSuperAdmin = currentUser.role === 'super-admin';

        tbody.innerHTML = users.map(user => {
    const isTargetSuperAdmin = user.role === 'super-admin';
    const canManage = isSuperAdmin && !isTargetSuperAdmin && user._id !== currentUser._id;
    
    console.log('Processing user:', user.name, 'Role:', user.role, 'Can manage:', canManage); // Add this debug line
    
    return `
        <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td class="py-3 px-4">
                <div class="flex items-center space-x-3">
                    <img src="${user.photo || '/assets/images/default-avatar.jpg'}" 
                         alt="${user.name || 'User'}" 
                         class="w-8 h-8 rounded-full object-cover">
                    <div>
                        <p class="font-medium text-gray-900 dark:text-white">${user.name || 'Unknown'}</p>
                        ${user._id === currentUser._id ? '<span class="text-xs text-blue-500">You</span>' : ''}
                    </div>
                </div>
            </td>
            <td class="py-3 px-4 text-gray-900 dark:text-white">${user.email || 'No email'}</td>
            <td class="py-3 px-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${user.role === 'super-admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}">
                    ${user.role === 'super-admin' ? 'Super Admin' : 
                      user.role === 'admin' ? 'Admin' : 'Client'}
                </span>
            </td>
            <td class="py-3 px-4">
                <div class="flex items-center space-x-2">
                    ${canManage ? `
                        <button class="btn btn-xs btn-warning toggle-role-btn" 
                                data-user-id="${user._id}" 
                                data-current-role="${user.role}"
                                title="${user.role === 'client' ? 'Promote to Admin' : 'Demote to Client'}">
                            <i class="fas fa-${user.role === 'client' ? 'arrow-up' : 'arrow-down'} mr-1"></i>
                            ${user.role === 'client' ? 'Promote' : 'Demote'}
                        </button>
                        <button class="btn btn-xs btn-error delete-user-btn" 
                                data-user-id="${user._id}" 
                                data-user-name="${user.name}"
                                title="Delete User">
                            <i class="fas fa-trash mr-1"></i>
                            Delete
                        </button>
                    ` : `
                        <span class="text-gray-400 text-sm">
                            ${isTargetSuperAdmin ? 'Super Admin' : 
                              user._id === currentUser._id ? 'You' : 'No actions'}
                        </span>
                    `}
                </div>
            </td>
        </tr>
    `;
}).join('');

console.log('Generated HTML length:', tbody.innerHTML.length);

        // Attach event listeners
        attachUserEventListeners();

    } catch (err) {
        console.error('Error loading users:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-8 text-center">
                    <div class="text-red-500 mb-2">
                        <i class="fas fa-exclamation-triangle text-2xl"></i>
                    </div>
                    <p class="text-red-600 dark:text-red-400 mb-2">Failed to load users</p>
                    <button onclick="loadUsersTable()" class="btn btn-sm btn-primary">
                        <i class="fas fa-redo mr-1"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    } finally {
        isLoading = false;
    }
}

function attachUserEventListeners() {
    // Delete user buttons  
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = e.target.closest('button').dataset.userId;
            const userName = e.target.closest('button').dataset.userName;
            
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
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'User Deleted!',
                        text: `${userName} has been deleted successfully.`,
                        showConfirmButton: false,
                        timer: 2000
                    });
                    
                    await loadUsersTable();
                    await loadStats();
                    
                } catch (err) {
                    console.error('Delete user error:', err);
                    Swal.fire({
                        icon: 'error',
                        title: 'Delete Failed',
                        text: err.response?.data?.message || 'Failed to delete user. Please try again.'
                    });
                }
            }
        });
    });

    // Role toggle buttons
    document.querySelectorAll('.toggle-role-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = e.target.closest('button').dataset.userId;
            const currentRole = e.target.closest('button').dataset.currentRole;
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
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Role Updated!',
                        text: `User has been ${action}d successfully.`,
                        showConfirmButton: false,
                        timer: 2000
                    });
                    
                    await loadUsersTable();
                    
                } catch (err) {
                    console.error('Role toggle error:', err);
                    Swal.fire({
                        icon: 'error',
                        title: 'Update Failed',
                        text: err.response?.data?.message || 'Failed to update user role. Please try again.'
                    });
                }
            }
        });
    });
}

// ======================
// Movie Management
// ======================

async function loadMoviesTable() {
    if (isLoading) return;
    
    const tbody = document.getElementById('movies-table-body');
    if (!tbody) return;

    isLoading = true;

    try {
        // Show loading state
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
                    <span class="text-gray-500 dark:text-gray-400">Loading movies...</span>
                </td>
            </tr>
        `;

        const response = await axios.get(`${API_BASE_URL}/movies`, getAuthHeaders());
        const movies = response.data.data?.movies || response.data.data || response.data || [];
        console.log('Movies data:', movies); // also for debugging like many other console.log
        console.log('Number of movies:', movies.length);//u get the idea
        if (movies.length === 0) {
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="py-8 text-center">
                <div class="text-gray-400 mb-4">
                    <i class="fas fa-film text-4xl"></i>
                </div>
                <p class="text-gray-500 dark:text-gray-400 mb-4">No movies found</p>
                <a href="/pages/movies/create.html" class="btn btn-primary">
                    <i class="fas fa-plus mr-2"></i> Add First Movie
                </a>
            </td>
        </tr>
    `;
    return;
}

console.log('Generating movie rows...');

        tbody.innerHTML = movies.map(movie => `
            <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="py-3 px-4">
                    <div class="flex items-center space-x-3">
                        <img src="${movie.poster}" 
                             alt="${movie.title}" 
                             class="w-12 h-16 object-cover rounded shadow-sm"
                             onerror="this.src='/assets/images/movie-placeholder.jpg'">
                        <div>
                            <p class="font-medium text-gray-900 dark:text-white line-clamp-1">${movie.title}</p>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${movie.genre.slice(0, 2).map(g => 
                                    `<span class="inline-block px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">${g}</span>`
                                ).join('')}
                                ${movie.genre.length > 2 ? `<span class="text-xs text-gray-500">+${movie.genre.length - 2}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-4 text-gray-900 dark:text-white">${movie.year}</td>
                <td class="py-3 px-4 text-gray-900 dark:text-white">${movie.director}</td>
                <td class="py-3 px-4">
                    <div class="flex items-center space-x-2">
                        <div class="flex items-center">
                            <i class="fas fa-star text-yellow-400 text-sm mr-1"></i>
                            <span class="text-gray-900 dark:text-white font-medium">
                                ${movie.averageRating ? movie.averageRating.toFixed(1) : 'N/A'}
                            </span>
                        </div>
                        <span class="text-gray-500 text-sm">
                            (${movie.reviewCount || 0} reviews)
                        </span>
                    </div>
                </td>
                <td class="py-3 px-4">
                    <div class="flex items-center space-x-2">
                        <a href="/pages/movies/details.html?id=${movie._id}" 
                           class="btn btn-xs btn-info" title="View Details">
                            <i class="fas fa-eye mr-1"></i>
                            View
                        </a>
                        <a href="/pages/movies/edit.html?id=${movie._id}" 
                           class="btn btn-xs btn-warning" title="Edit Movie">
                            <i class="fas fa-edit mr-1"></i>
                            Edit
                        </a>
                        <button class="btn btn-xs btn-error delete-movie-btn" 
                                data-movie-id="${movie._id}" 
                                data-movie-title="${movie.title}"
                                title="Delete Movie">
                            <i class="fas fa-trash mr-1"></i>
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Attach event listeners
        attachMovieEventListeners();

    } catch (err) {
        console.error('Error loading movies:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center">
                    <div class="text-red-500 mb-2">
                        <i class="fas fa-exclamation-triangle text-2xl"></i>
                    </div>
                    <p class="text-red-600 dark:text-red-400 mb-2">Failed to load movies</p>
                    <button onclick="loadMoviesTable()" class="btn btn-sm btn-primary">
                        <i class="fas fa-redo mr-1"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    } finally {
        isLoading = false;
    }
}

function attachMovieEventListeners() {
    // Delete movie buttons
    document.querySelectorAll('.delete-movie-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const movieId = e.target.closest('button').dataset.movieId;
            const movieTitle = e.target.closest('button').dataset.movieTitle;
            
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
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Movie Deleted!',
                        text: `"${movieTitle}" has been deleted successfully.`,
                        showConfirmButton: false,
                        timer: 2000
                    });
                    
                    await loadMoviesTable();
                    await loadStats();
                    
                } catch (err) {
                    console.error('Delete movie error:', err);
                    Swal.fire({
                        icon: 'error',
                        title: 'Delete Failed',
                        text: err.response?.data?.message || 'Failed to delete movie. Please try again.'
                    });
                }
            }
        });
    });
}

// ======================
// Refresh Functions
// ======================

function initRefreshButtons() {
    const refreshUsersBtn = document.getElementById('refresh-users');
    const refreshMoviesBtn = document.getElementById('refresh-movies');

    if (refreshUsersBtn) {
        refreshUsersBtn.addEventListener('click', async () => {
            if (isLoading) return;
            
            refreshUsersBtn.disabled = true;
            refreshUsersBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Refreshing...';
            
            try {
                await loadUsersTable();
                await loadStats();
            } finally {
                refreshUsersBtn.disabled = false;
                refreshUsersBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> Refresh';
            }
        });
    }

    if (refreshMoviesBtn) {
        refreshMoviesBtn.addEventListener('click', async () => {
            if (isLoading) return;
            
            refreshMoviesBtn.disabled = true;
            refreshMoviesBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Refreshing...';
            
            try {
                await loadMoviesTable();
                await loadStats();
            } finally {
                refreshMoviesBtn.disabled = false;
                refreshMoviesBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> Refresh';
            }
        });
    }
}

// ======================
// Auto-refresh Functions
// ======================

let refreshInterval;

function startAutoRefresh() {
    // Refresh stats every 60 seconds
    refreshInterval = setInterval(async () => {
        if (!document.hidden && !isLoading) {
            await loadStats();
        }
    }, 60000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// ======================
// Search and Filter Functions
// ======================

function initSearchAndFilter() {
    // Users search
    const usersSearchInput = document.getElementById('users-search');
    if (usersSearchInput) {
        usersSearchInput.addEventListener('input', debounce(filterUsers, 300));
    }

    // Movies search
    const moviesSearchInput = document.getElementById('movies-search');
    if (moviesSearchInput) {
        moviesSearchInput.addEventListener('input', debounce(filterMovies, 300));
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function filterUsers() {
    const searchInput = document.getElementById('users-search');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();
    const rows = document.querySelectorAll('#users-table-body tr');

    rows.forEach(row => {
        if (row.querySelector('.animate-spin')) return; // Skip loading row
        
        const nameCell = row.querySelector('td:first-child');
        const emailCell = row.querySelector('td:nth-child(2)');
        const roleCell = row.querySelector('td:nth-child(3)');
        
        if (nameCell && emailCell && roleCell) {
            const name = nameCell.textContent.toLowerCase();
            const email = emailCell.textContent.toLowerCase();
            const role = roleCell.textContent.toLowerCase();
            
            const matches = name.includes(searchTerm) || 
                          email.includes(searchTerm) || 
                          role.includes(searchTerm);
            
            row.style.display = matches ? '' : 'none';
        }
    });
}

function filterMovies() {
    const searchInput = document.getElementById('movies-search');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();
    const rows = document.querySelectorAll('#movies-table-body tr');

    rows.forEach(row => {
        if (row.querySelector('.animate-spin')) return; // Skip loading row
        
        const titleCell = row.querySelector('td:first-child');
        const yearCell = row.querySelector('td:nth-child(2)');
        const directorCell = row.querySelector('td:nth-child(3)');
        
        if (titleCell && yearCell && directorCell) {
            const title = titleCell.textContent.toLowerCase();
            const year = yearCell.textContent.toLowerCase();
            const director = directorCell.textContent.toLowerCase();
            
            const matches = title.includes(searchTerm) || 
                          year.includes(searchTerm) || 
                          director.includes(searchTerm);
            
            row.style.display = matches ? '' : 'none';
        }
    });
}

// ======================
// Error Handling & Notifications
// ======================

function showNotification(type, title, message, duration = 3000) {
    Swal.fire({
        icon: type,
        title: title,
        text: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: duration,
        timerProgressBar: true
    });
}

function handleError(error, context = 'Operation') {
    console.error(`${context} error:`, error);
    
    const message = error.response?.data?.message || 
                   error.message || 
                   'An unexpected error occurred';
                   
    showNotification('error', `${context} Failed`, message, 5000);
}

// ======================
// Keyboard Shortcuts
// ======================

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt + U for Users tab
        if (e.altKey && e.key === 'u') {
            e.preventDefault();
            switchTab('users');
        }
        
        // Alt + M for Movies tab
        if (e.altKey && e.key === 'm') {
            e.preventDefault();
            switchTab('movies');
        }
        
        // Alt + R for Refresh
        if (e.altKey && e.key === 'r') {
            e.preventDefault();
            if (currentTab === 'users') {
                loadUsersTable();
            } else if (currentTab === 'movies') {
                loadMoviesTable();
            }
        }
        
        // Escape to close any open modals
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.swal2-container');
            modals.forEach(modal => {
                if (modal && modal.style.display !== 'none') {
                    Swal.close();
                }
            });
        }
    });
}

// ======================
// Page Visibility Handling
// ======================

function initPageVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoRefresh();
        } else {
            // Refresh data when page becomes visible
            loadStats();
            if (currentTab === 'users') {
                loadUsersTable();
            } else if (currentTab === 'movies') {
                loadMoviesTable();
            }
            startAutoRefresh();
        }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        stopAutoRefresh();
    });
}

// ======================
// Utility Functions
// ======================

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function truncateText(text, maxLength = 50) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// ======================
// Enhanced UI Functions
// ======================

function addSearchBars() {
    // Add search bar to users section
    const usersContent = document.getElementById('users-content');
    if (usersContent && !document.getElementById('users-search')) {
        const headerDiv = usersContent.querySelector('.flex.justify-between.items-center.mb-6');
        if (headerDiv) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'relative';
            searchContainer.innerHTML = `
                <input type="text" id="users-search" placeholder="Search users..." 
                       class="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            `;
            headerDiv.insertBefore(searchContainer, headerDiv.lastElementChild);
        }
    }

    // Add search bar to movies section
    const moviesContent = document.getElementById('movies-content');
    if (moviesContent && !document.getElementById('movies-search')) {
        const headerDiv = moviesContent.querySelector('.flex.justify-between.items-center.mb-6');
        if (headerDiv) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'relative';
            searchContainer.innerHTML = `
                <input type="text" id="movies-search" placeholder="Search movies..." 
                       class="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            `;
            headerDiv.insertBefore(searchContainer, headerDiv.querySelector('.flex.gap-3'));
        }
    }
}

// ======================
// Main Initialization
// ======================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Admin dashboard initializing...');
    
    // Check admin access first
    const currentUser = checkAdminAccess();
    if (!currentUser) return;

    try {
        // Initialize all components
        console.log('Initializing tab system...'); // Add this
        initTabSystem();
        initRefreshButtons();
        initKeyboardShortcuts();
        initPageVisibilityHandling();
        
        // Load initial data
        console.log('Loading initial stats...'); // Add this
        await loadStats();
        
        // Add enhanced UI features
        addSearchBars();
        
        // Initialize search after adding search bars
        setTimeout(() => {
            initSearchAndFilter();
        }, 100);
        
        // Start auto-refresh
        startAutoRefresh();
        
        console.log('Admin dashboard initialized successfully');
        
        // Show welcome notification
        showNotification('success', 'Welcome!', `Dashboard loaded successfully. Welcome back, ${currentUser.name}!`);
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        handleError(error, 'Dashboard initialization');
    }
});

// ======================
// Global Error Handler
// ======================

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    handleError(event.error, 'Application');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    handleError(event.reason, 'Promise');
});

// ======================
// Export Functions for Global Access
// ======================

// Make functions available globally if needed
window.loadUsersTable = loadUsersTable;
window.loadMoviesTable = loadMoviesTable;
window.loadStats = loadStats;
window.switchTab = switchTab;