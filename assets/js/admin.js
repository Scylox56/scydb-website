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
        
        const [moviesRes, usersRes, genresRes, rolesRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/movies`, getAuthHeaders()),
            axios.get(`${API_BASE_URL}/users`, getAuthHeaders()),
            axios.get(`${API_BASE_URL}/genres`, getAuthHeaders()).catch(() => ({ data: { results: 0 } })),
            axios.get(`${API_BASE_URL}/roles`, getAuthHeaders()).catch(() => ({ data: { results: 0 } }))
        ]);

        // Update statistics cards
        const movieCount = moviesRes.data.results || 
                          moviesRes.data.total || 
                          moviesRes.data.data?.movies?.length || 
                          (Array.isArray(moviesRes.data.data) ? moviesRes.data.data.length : 0) ||
                          (Array.isArray(moviesRes.data) ? moviesRes.data.length : 0) || 0;
        
        const userCount = usersRes.data.results || 
                         usersRes.data.total || 
                         usersRes.data.data?.users?.length || 
                         (Array.isArray(usersRes.data.data) ? usersRes.data.data.length : 0) ||
                         (Array.isArray(usersRes.data) ? usersRes.data.length : 0) || 0;

        const genreCount = genresRes.data.results || 
                          genresRes.data.data?.genres?.length || 
                          (Array.isArray(genresRes.data.data) ? genresRes.data.data.length : 0) || 0;

        const roleCount = rolesRes.data.results || 
                         rolesRes.data.data?.roles?.length || 
                         (Array.isArray(rolesRes.data.data) ? rolesRes.data.data.length : 0) || 0;

        document.getElementById('total-movies').textContent = movieCount;
        document.getElementById('total-users').textContent = userCount;
        document.getElementById('total-genres').textContent = genreCount;
        document.getElementById('total-roles').textContent = roleCount;

        console.log('Statistics loaded successfully');

    } catch (err) {
        console.error('Error fetching stats:', err);
        
        // Show error in stats cards
        ['total-movies', 'total-users', 'total-genres', 'total-roles'].forEach(id => {
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

    // Reset tab styles - using minimal button style
    [usersTab, moviesTab].forEach(tab => {
        if (tab) {
            tab.className = 'tab-btn flex-1 px-6 py-4 font-medium text-[#2E2E2E] dark:text-[#F2F0E3] opacity-80 hover:opacity-100 transition-all';
        }
    });

    // Hide all content
    [usersContent, moviesContent].forEach(content => {
        if (content) content.classList.add('hidden');
    });

    // Show active tab
    if (tabName === 'users') {
        loadUsersTable();
    } else if (tabName === 'movies') {
        loadMoviesTable();
    } else if (tabName === 'genres') {
        loadGenresTable();
    } else if (tabName === 'roles') {
        loadRolesTable();
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
        // Show loading state with index.html styling
        tbody.innerHTML = `
            <tr class="bg-[#F2F0E3] dark:bg-[#1F1F1F]">
                <td colspan="4" class="py-16 text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F76F53] mx-auto mb-4"></div>
                    <span class="text-[#2E2E2E] dark:text-[#F2F0E3] opacity-80 text-lg">Loading users...</span>
                </td>
            </tr>
        `;

        const response = await axios.get(`${API_BASE_URL}/users`, getAuthHeaders());
        const users = response.data.data?.users || response.data.data || response.data || [];
        console.log('Users data:', users);// for debugging
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr class="bg-[#F2F0E3] dark:bg-[#1F1F1F]">
                    <td colspan="4" class="py-16 text-center">
                        <div class="text-[#2E2E2E] dark:text-[#F2F0E3] opacity-80 mb-4">
                            <i class="fas fa-users text-6xl mb-4 text-[#F76F53]"></i>
                        </div>
                        <p class="text-[#2E2E2E] dark:text-[#F2F0E3] text-xl">No users found</p>
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
                <tr class="border-b border-[#e0ddd0] dark:border-[#2E2E2E] hover:bg-[#e8e6d9] dark:hover:bg-[#2E2E2E] transition-colors">
                    <td class="py-4 px-6">
                        <div class="flex items-center space-x-3">
                            <img src="${user.photo || '/assets/images/default-avatar.jpg'}" 
                                 alt="${user.name || 'User'}" 
                                 class="w-10 h-10 rounded-full object-cover">
                            <div>
                                <p class="font-medium text-[#2E2E2E] dark:text-[#F2F0E3]">${user.name || 'Unknown'}</p>
                                ${user._id === currentUser._id ? '<span class="text-xs text-[#F76F53]">You</span>' : ''}
                            </div>
                        </div>
                    </td>
                    <td class="py-4 px-6 text-[#2E2E2E] dark:text-[#F2F0E3]">${user.email || 'No email'}</td>
                    <td class="py-4 px-6">
                        <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium
                            ${user.role === 'super-admin' ? 'bg-[#F76F53]  dark:text-black' :
                              user.role === 'admin' ? 'bg-[#e8e6d9] text-[#2E2E2E] dark:bg-[#2E2E2E] dark:text-[#F2F0E3]' :
                              'bg-[#e0ddd0] text-[#2E2E2E] dark:bg-[#1F1F1F] dark:text-[#F2F0E3]'}">
                            ${user.role === 'super-admin' ? 'Super Admin' : 
                              user.role === 'admin' ? 'Admin' : 'Client'}
                        </span>
                    </td>
                    <td class="py-4 px-6">
                        <div class="flex items-center space-x-2">
                            ${canManage ? `
                                <button class="px-2 py-1 text-xs bg-[#F76F53] hover:bg-[#F76F53]/90 rounded transition-colors toggle-role-btn" 
                                        data-user-id="${user._id}" 
                                        data-current-role="${user.role}"
                                        title="${user.role === 'client' ? 'Promote to Admin' : 'Demote to Client'}">
                                    <i class="fas fa-${user.role === 'client' ? 'arrow-up' : 'arrow-down'} mr-1"></i>
                                    ${user.role === 'client' ? 'Promote' : 'Demote'}
                                </button>
                                <button class="px-2 py-1 text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors delete-user-btn" 
                                        data-user-id="${user._id}" 
                                        data-user-name="${user.name}"
                                        title="Delete User">
                                    <i class="fas fa-trash mr-1"></i>
                                    Delete
                                </button>
                            ` : `
                                <span class="text-[#2E2E2E] dark:text-[#F2F0E3] opacity-60 text-xs">
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
            <tr class="bg-[#F2F0E3] dark:bg-[#1F1F1F]">
                <td colspan="4" class="py-16 text-center">
                    <div class="text-[#F76F53] mb-4">
                        <i class="fas fa-exclamation-triangle text-4xl"></i>
                    </div>
                    <p class="text-[#2E2E2E] dark:text-[#F2F0E3] mb-4 text-lg">Failed to load users</p>
                    <button onclick="loadUsersTable()" class="btn btn-primary bg-[#F76F53] hover:bg-[#F76F53]/90 border-[#F76F53] text-white">
                        <i class="fas fa-redo mr-2"></i> Retry
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
        // Show loading state with index.html styling
        tbody.innerHTML = `
            <tr class="bg-[#F2F0E3] dark:bg-[#1F1F1F]">
                <td colspan="5" class="py-16 text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F76F53] mx-auto mb-4"></div>
                    <span class="text-[#2E2E2E] dark:text-[#F2F0E3] opacity-80 text-lg">Loading movies...</span>
                </td>
            </tr>
        `;

        const response = await axios.get(`${API_BASE_URL}/movies`, getAuthHeaders());
        const movies = response.data.data?.movies || response.data.data || response.data || [];
        console.log('Movies data:', movies); // also for debugging like many other console.log
        console.log('Number of movies:', movies.length);//u get the idea
        
        if (movies.length === 0) {
            tbody.innerHTML = `
                <tr class="bg-[#F2F0E3] dark:bg-[#1F1F1F]">
                    <td colspan="5" class="py-16 text-center">
                        <div class="text-[#F76F53] mb-6">
                            <i class="fas fa-film text-6xl"></i>
                        </div>
                        <p class="text-[#2E2E2E] dark:text-[#F2F0E3] text-xl mb-6">No movies found</p>
                        <a href="/pages/movies/create.html" class="btn btn-primary bg-[#F76F53] hover:bg-[#F76F53]/90 border-[#F76F53] text-white text-lg">
                            <i class="fas fa-plus mr-2"></i> Add First Movie
                        </a>
                    </td>
                </tr>
            `;
            return;
        }

        console.log('Generating movie rows...');

        tbody.innerHTML = movies.map(movie => `
            <tr class="border-b border-[#e0ddd0] dark:border-[#2E2E2E] hover:bg-[#e8e6d9] dark:hover:bg-[#2E2E2E] transition-colors">
                <td class="py-4 px-6">
                    <div class="flex items-center space-x-3">
                        <img src="${movie.poster}" 
                             alt="${movie.title}" 
                             class="w-12 h-16 object-cover rounded shadow-sm"
                             onerror="this.src='/assets/images/movie-placeholder.jpg'">
                        <div class="flex-1">
                            <p class="font-medium text-[#2E2E2E] dark:text-[#F2F0E3] line-clamp-1">${movie.title}</p>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${movie.genre.slice(0, 2).map(g => 
                                    `<span class="inline-block px-1.5 py-0.5 bg-[#e8e6d9] dark:bg-[#2E2E2E] text-[#2E2E2E] dark:text-[#F2F0E3] text-xs rounded">${g}</span>`
                                ).join('')}
                                ${movie.genre.length > 2 ? `<span class="text-xs text-[#F76F53]">+${movie.genre.length - 2}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6 text-[#2E2E2E] dark:text-[#F2F0E3]">${movie.year}</td>
                <td class="py-4 px-6 text-[#2E2E2E] dark:text-[#F2F0E3]">${movie.director}</td>
                <td class="py-4 px-6">
                    <div class="flex items-center space-x-2">
                        <div class="flex items-center">
                            <i class="fas fa-star text-[#F76F53] text-sm mr-1"></i>
                            <span class="text-[#2E2E2E] dark:text-[#F2F0E3] font-medium">
                                ${movie.averageRating ? movie.averageRating.toFixed(1) : 'N/A'}
                            </span>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6">
                    <div class="flex items-center space-x-1">
                        <a href="/pages/movies/details.html?id=${movie._id}" 
                           class="px-2 py-1 text-xs bg-[#e8e6d9] hover:bg-[#e0ddd0] text-[#2E2E2E] rounded transition-colors dark:bg-[#2E2E2E] dark:hover:bg-[#1F1F1F] dark:text-[#F2F0E3]" 
                           title="View Details">
                            <i class="fas fa-eye mr-1"></i>View
                        </a>
                        <a href="/pages/movies/edit.html?id=${movie._id}" 
                           class="px-2 py-1 text-xs bg-[#F76F53] hover:bg-[#F76F53]/90 rounded transition-colors" 
                           title="Edit Movie">
                            <i class="fas fa-edit mr-1"></i>Edit
                        </a>
                        <button class="px-2 py-1 text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors delete-movie-btn" 
                                data-movie-id="${movie._id}" 
                                data-movie-title="${movie.title}"
                                title="Delete Movie">
                            <i class="fas fa-trash mr-1"></i>Delete
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
            <tr class="bg-[#F2F0E3] dark:bg-[#1F1F1F]">
                <td colspan="5" class="py-16 text-center">
                    <div class="text-[#F76F53] mb-4">
                        <i class="fas fa-exclamation-triangle text-4xl"></i>
                    </div>
                    <p class="text-[#2E2E2E] dark:text-[#F2F0E3] mb-4 text-lg">Failed to load movies</p>
                    <button onclick="loadMoviesTable()" class="btn btn-primary bg-[#F76F53] hover:bg-[#F76F53]/90 border-[#F76F53] text-white">
                        <i class="fas fa-redo mr-2"></i> Retry
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
                       class="pl-10 pr-4 py-2 border border-[#e0ddd0] dark:border-[#2E2E2E] rounded-lg bg-[#F2F0E3] dark:bg-[#1F1F1F] text-[#2E2E2E] dark:text-[#F2F0E3] placeholder-[#2E2E2E]/60 dark:placeholder-[#F2F0E3]/60 focus:outline-none focus:border-[#F76F53] transition-colors text-sm">
                <i class="fas fa-search absolute left-3 top-3 text-[#2E2E2E]/60 dark:text-[#F2F0E3]/60 text-sm"></i>
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
                       class="pl-10 pr-4 py-2 border border-[#e0ddd0] dark:border-[#2E2E2E] rounded-lg bg-[#F2F0E3] dark:bg-[#1F1F1F] text-[#2E2E2E] dark:text-[#F2F0E3] placeholder-[#2E2E2E]/60 dark:placeholder-[#F2F0E3]/60 focus:outline-none focus:border-[#F76F53] transition-colors text-sm">
                <i class="fas fa-search absolute left-3 top-3 text-[#2E2E2E]/60 dark:text-[#F2F0E3]/60 text-sm"></i>
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
        // Initialize sidebar navigation
        const sidebarBtns = document.querySelectorAll('.sidebar-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        function switchSidebarTab(activeBtn, targetId) {
            // Remove active class from all buttons
            sidebarBtns.forEach(btn => {
                btn.classList.remove('bg-[#F76F53]', 'text-white');
                btn.classList.add('text-[#2E2E2E]', 'dark:text-[#F2F0E3]');
            });
            
            // Hide all content
            tabContents.forEach(content => content.classList.add('hidden'));
            
            // Activate clicked button
            activeBtn.classList.add('bg-[#F76F53]', 'text-white');
            activeBtn.classList.remove('text-[#2E2E2E]', 'dark:text-[#F2F0E3]');
            
            // Show target content
            document.getElementById(targetId).classList.remove('hidden');
            
            // Load data for specific tabs
            const tabName = targetId.replace('-content', '');
            if (tabName !== 'overview') {
                switchTab(tabName);
            }
        }
        
        // Add click listeners
        document.getElementById('overview-tab')?.addEventListener('click', () => switchSidebarTab(document.getElementById('overview-tab'), 'overview-content'));
        document.getElementById('users-tab')?.addEventListener('click', () => switchSidebarTab(document.getElementById('users-tab'), 'users-content'));
        document.getElementById('movies-tab')?.addEventListener('click', () => switchSidebarTab(document.getElementById('movies-tab'), 'movies-content'));
        document.getElementById('genres-tab')?.addEventListener('click', () => switchSidebarTab(document.getElementById('genres-tab'), 'genres-content'));
        document.getElementById('roles-tab')?.addEventListener('click', () => switchSidebarTab(document.getElementById('roles-tab'), 'roles-content'));
        
        // Initialize other components
        initRefreshButtons();
        initKeyboardShortcuts();
        initPageVisibilityHandling();
        
        // Load initial data
        console.log('Loading initial stats...');
        await loadStats();
        
        // Initialize with overview tab active
        switchSidebarTab(document.getElementById('overview-tab'), 'overview-content');
        
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
// New Genre Management Functions
// ======================

async function loadGenresTable() {
    if (isLoading) return;
    
    const tbody = document.getElementById('genres-table-body');
    if (!tbody) return;

    isLoading = true;

    try {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F76F53] mx-auto mb-2"></div>
                    <span class="opacity-80">Loading genres...</span>
                </td>
            </tr>
        `;

        const response = await axios.get(`${API_BASE_URL}/genres`, getAuthHeaders());
        const genres = response.data.data?.genres || response.data.data || response.data || [];
        
        if (genres.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-8 text-center">
                        <p class="text-xl mb-4">No genres found</p>
                        <button id="add-first-genre" class="btn btn-primary">
                            <i class="fas fa-plus mr-2"></i> Add First Genre
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = genres.map(genre => `
            <tr class="hover:bg-[#e8e6d9] dark:hover:bg-[#2E2E2E] transition-colors">
                <td class="py-4 px-6">
                    <div class="flex items-center">
                        <div class="w-4 h-4 rounded mr-3" style="background-color: ${genre.color || '#3B82F6'}"></div>
                        <span class="font-medium">${genre.name}</span>
                    </div>
                </td>
                <td class="py-4 px-6">${genre.description || 'No description'}</td>
                <td class="py-4 px-6">${genre.movieCount || 0}</td>
                <td class="py-4 px-6">
                    <span class="inline-flex px-2 py-1 rounded text-xs font-medium ${genre.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${genre.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="py-4 px-6">
                    <div class="flex space-x-2">
                        <button class="px-2 py-1 text-xs bg-[#F76F53] hover:bg-[#F76F53]/90 rounded edit-genre-btn" 
                                data-genre='${JSON.stringify(genre)}'>
                            <i class="fas fa-edit mr-1"></i>Edit
                        </button>
                        <button class="px-2 py-1 text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded delete-genre-btn" 
                                data-genre-id="${genre._id}" data-genre-name="${genre.name}">
                            <i class="fas fa-trash mr-1"></i>Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        attachGenreEventListeners();

    } catch (err) {
        console.error('Error loading genres:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center">
                    <p class="text-lg mb-4">Failed to load genres</p>
                    <button onclick="loadGenresTable()" class="btn btn-primary">
                        <i class="fas fa-redo mr-2"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    } finally {
        isLoading = false;
    }
}

// ======================
// New Role Management Functions  
// ======================

async function loadRolesTable() {
    if (isLoading) return;
    
    const tbody = document.getElementById('roles-table-body');
    if (!tbody) return;

    isLoading = true;

    try {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-8 text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F76F53] mx-auto mb-2"></div>
                    <span class="opacity-80">Loading roles...</span>
                </td>
            </tr>
        `;

        const response = await axios.get(`${API_BASE_URL}/roles`, getAuthHeaders());
        const roles = response.data.data?.roles || response.data.data || response.data || [];
        tbody.innerHTML = roles.map(role => `
           <tr class="hover:bg-[#e8e6d9] dark:hover:bg-[#2E2E2E] transition-colors">
               <td class="py-4 px-6">
                   <span class="font-medium capitalize">${role.name}</span>
               </td>
               <td class="py-4 px-6">${role.description || 'No description'}</td>
               <td class="py-4 px-6">0</td>
               <td class="py-4 px-6">
                   <div class="flex space-x-2">
                       ${!['client', 'admin', 'super-admin'].includes(role.name) ? `
                           <button class="px-2 py-1 text-xs bg-[#F76F53] hover:bg-[#F76F53]/90 rounded edit-role-btn" 
                                   data-role='${JSON.stringify(role)}'>
                               <i class="fas fa-edit mr-1"></i>Edit
                           </button>
                           <button class="px-2 py-1 text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded delete-role-btn" 
                                   data-role-id="${role._id}" data-role-name="${role.name}">
                               <i class="fas fa-trash mr-1"></i>Delete
                           </button>
                       ` : `
                           <span class="text-xs text-gray-500">System Role</span>
                       `}
                   </div>
               </td>
           </tr>
       `).join('');

       attachRoleEventListeners();

   } catch (err) {
       console.error('Error loading roles:', err);
       tbody.innerHTML = `
           <tr>
               <td colspan="4" class="py-8 text-center">
                   <p class="text-lg mb-4">Failed to load roles</p>
                   <button onclick="loadRolesTable()" class="btn btn-primary">
                       <i class="fas fa-redo mr-2"></i> Retry
                   </button>
               </td>
           </tr>
       `;
   } finally {
       isLoading = false;
   }
}

// ======================
// Event Listeners for New Features
// ======================

function attachGenreEventListeners() {
   // Add/Edit genre buttons
   document.querySelectorAll('.edit-genre-btn, #add-genre-btn').forEach(btn => {
       btn.addEventListener('click', showGenreModal);
   });

   // Delete genre buttons
   document.querySelectorAll('.delete-genre-btn').forEach(btn => {
       btn.addEventListener('click', async (e) => {
           const genreId = e.target.closest('button').dataset.genreId;
           const genreName = e.target.closest('button').dataset.genreName;
           
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
                   Swal.fire('Deleted!', 'Genre has been deleted.', 'success');
                   loadGenresTable();
                   loadStats();
               } catch (err) {
                   Swal.fire('Error', err.response?.data?.message || 'Failed to delete genre', 'error');
               }
           }
       });
   });
}

function attachRoleEventListeners() {
   // Add/Edit role buttons
   document.querySelectorAll('.edit-role-btn, #add-role-btn').forEach(btn => {
       btn.addEventListener('click', showRoleModal);
   });

   // Delete role buttons
   document.querySelectorAll('.delete-role-btn').forEach(btn => {
       btn.addEventListener('click', async (e) => {
           const roleId = e.target.closest('button').dataset.roleId;
           const roleName = e.target.closest('button').dataset.roleName;
           
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
                   Swal.fire('Deleted!', 'Role has been deleted.', 'success');
                   loadRolesTable();
                   loadStats();
               } catch (err) {
                   Swal.fire('Error', err.response?.data?.message || 'Failed to delete role', 'error');
               }
           }
       });
   });
}

// ======================
// Modal Functions
// ======================

async function showGenreModal(e) {
   const isEdit = e.target.closest('button').classList.contains('edit-genre-btn');
   const genre = isEdit ? JSON.parse(e.target.closest('button').dataset.genre) : null;

   const { value: formValues } = await Swal.fire({
       title: isEdit ? 'Edit Genre' : 'Add New Genre',
       html: `
           <div class="space-y-4">
               <input id="genre-name" class="swal2-input" placeholder="Genre Name" value="${genre?.name || ''}">
               <textarea id="genre-description" class="swal2-textarea" placeholder="Description (optional)">${genre?.description || ''}</textarea>
               <input id="genre-color" type="color" class="swal2-input" value="${genre?.color || '#3B82F6'}">
               <div class="flex items-center">
                   <input id="genre-active" type="checkbox" ${genre?.isActive !== false ? 'checked' : ''}>
                   <label for="genre-active" class="ml-2">Active</label>
               </div>
           </div>
       `,
       showCancelButton: true,
       confirmButtonText: isEdit ? 'Update' : 'Create',
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
           if (isEdit) {
               await axios.patch(`${API_BASE_URL}/genres/${genre._id}`, formValues, getAuthHeaders());
               Swal.fire('Success!', 'Genre updated successfully', 'success');
           } else {
               await axios.post(`${API_BASE_URL}/genres`, formValues, getAuthHeaders());
               Swal.fire('Success!', 'Genre created successfully', 'success');
           }
           loadGenresTable();
           loadStats();
       } catch (err) {
           Swal.fire('Error', err.response?.data?.message || 'Operation failed', 'error');
       }
   }
}

async function showRoleModal(e) {
   const isEdit = e.target.closest('button').classList.contains('edit-role-btn');
   const role = isEdit ? JSON.parse(e.target.closest('button').dataset.role) : null;

   const { value: formValues } = await Swal.fire({
       title: isEdit ? 'Edit Role' : 'Add New Role',
       html: `
           <div class="space-y-4">
               <input id="role-name" class="swal2-input" placeholder="Role Name" value="${role?.name || ''}">
               <textarea id="role-description" class="swal2-textarea" placeholder="Description (optional)">${role?.description || ''}</textarea>
           </div>
       `,
       showCancelButton: true,
       confirmButtonText: isEdit ? 'Update' : 'Create',
       preConfirm: () => {
           const name = document.getElementById('role-name').value;
           if (!name) {
               Swal.showValidationMessage('Please enter a role name');
               return false;
           }
           return {
               name,
               description: document.getElementById('role-description').value,
               permissions: ['read'] // Default permission
           };
       }
   });

   if (formValues) {
       try {
           if (isEdit) {
               await axios.patch(`${API_BASE_URL}/roles/${role._id}`, formValues, getAuthHeaders());
               Swal.fire('Success!', 'Role updated successfully', 'success');
           } else {
               await axios.post(`${API_BASE_URL}/roles`, formValues, getAuthHeaders());
               Swal.fire('Success!', 'Role created successfully', 'success');
           }
           loadRolesTable();
           loadStats();
       } catch (err) {
           Swal.fire('Error', err.response?.data?.message || 'Operation failed', 'error');
       }
   }
}

// ======================
// Export Functions for Global Access
// ======================

// Make functions available globally if needed
window.loadUsersTable = loadUsersTable;
window.loadMoviesTable = loadMoviesTable;
window.loadStats = loadStats;
window.switchTab = switchTab;