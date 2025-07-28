// ======================
// Global Configuration
// ======================

let currentFilters = {
    search: '',
    genre: '',
    sort: 'popular',
    yearFrom: '',
    yearTo: '',
    rating: '',
    duration: '',
    director: '',
    cast: ''
};
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let allMovies = [];

// ======================
// Helper Functions
// ======================

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    } : {
        'Content-Type': 'application/json'
    };
};

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

window.debounce = debounce;
// ======================
// Movie Loading Functions
// ======================

const loadMovies = async (filters = {}, page = 1, append = false) => {
    console.log('loadMovies called with:', filters, page, append);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    if (isLoading) return;
    isLoading = true;

    try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.genre) queryParams.append('genre', filters.genre);
        if (filters.sort) queryParams.append('sort', filters.sort);
        if (filters.yearFrom) queryParams.append('yearFrom', filters.yearFrom);
        if (filters.yearTo) queryParams.append('yearTo', filters.yearTo);
        if (filters.rating) queryParams.append('minRating', filters.rating);
        if (filters.director) queryParams.append('director', filters.director);
        if (filters.cast) queryParams.append('cast', filters.cast);
        if (page > 1) queryParams.append('page', page);

        const url = `${API_BASE_URL}/movies${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const { data } = await axios.get(url);
        
        console.log('API Response:', data);
        console.log('Movies found:', data.data.movies?.length || 0);

        const movies = data.data.movies || [];
        totalPages = data.data.totalPages || 1;
        currentPage = page;

        if (append) {
            allMovies = [...allMovies, ...movies];
        } else {
            allMovies = movies;
        }

        renderMovies(allMovies);
        updateResultsCount(data.data.totalResults || movies.length);
        updateLoadMoreButton();
        updateNoResultsMessage();

    } catch (err) {
        console.error('Failed to load movies:', err);
        showNoResults();
    } finally {
        isLoading = false;
    }
    
};

const renderMovies = (movies) => {
    const container = document.getElementById('movies-grid');
    if (!container) return;

    if (movies.length === 0) {
        showNoResults();
        return;
    }

    container.innerHTML = movies.map(movie => `
        <div class="movie-card group cursor-pointer" onclick="goToMovieDetails('${movie._id}')">
            <div class="relative overflow-hidden rounded-lg aspect-[2/3] bg-gray-200 dark:bg-gray-700">
                <img src="${movie.poster}" 
                     alt="${movie.title}" 
                     class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                     onerror="this.src='/assets/images/no-poster.jpg'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h3 class="text-white text-lg font-bold mb-2 line-clamp-2">${movie.title}</h3>
                    <div class="flex items-center mb-2">
                        <div class="flex text-yellow-400 mr-2">
                            ${Array(5).fill().map((_, i) => 
                                `<i class="fas fa-star ${i < Math.floor((movie.averageRating || 0) / 2) ? 'text-yellow-400' : 'text-gray-400'} text-sm"></i>`
                            ).join('')}
                        </div>
                        <span class="text-white text-sm font-medium">${movie.averageRating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div class="flex flex-wrap gap-1 mb-2">
                        ${(movie.genre || []).slice(0, 2).map(g => 
                            `<span class="px-2 py-1 bg-primary/30 text-white text-xs rounded-full">${g}</span>`
                        ).join('')}
                        ${movie.genre && movie.genre.length > 2 ? `<span class="text-white text-xs">+${movie.genre.length - 2}</span>` : ''}
                    </div>
                    <p class="text-gray-300 text-sm line-clamp-2">${movie.description || ''}</p>
                </div>
            </div>
            <div class="mt-3">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">${movie.title}</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm">${movie.year} • ${movie.director}</p>
                <div class="flex items-center mt-1">
                    <div class="flex text-yellow-400 mr-2">
                        ${Array(5).fill().map((_, i) => 
                            `<i class="fas fa-star ${i < Math.floor((movie.averageRating || 0) / 2) ? 'text-yellow-400' : 'text-gray-300'} text-xs"></i>`
                        ).join('')}
                    </div>
                    <span class="text-gray-500 dark:text-gray-400 text-sm">${movie.averageRating?.toFixed(1) || 'N/A'}</span>
                </div>
            </div>
        </div>
    `).join('');
};

const goToMovieDetails = (movieId) => {
    window.location.href = `/pages/movies/details.html?id=${movieId}`;
};

// ======================
// Filter Functionality
// ======================

const initGenreFilter = () => {
    const genreSelect = document.getElementById('genre-filter');
    if (genreSelect) {
        genreSelect.addEventListener('change', (e) => {
            handleGenreFilter(e.target.value);
        });
    }

    // Genre chips
    document.querySelectorAll('.genre-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const genre = chip.dataset.genre;
            handleGenreFilter(genre);
            updateGenreChips(genre);
        });
    });
};

const handleGenreFilter = (genre) => {
    currentFilters.genre = genre;
    currentPage = 1;
    loadMovies(currentFilters, 1);
    updateActiveFilters();
    
    // Update genre select
    const genreSelect = document.getElementById('genre-filter');
    if (genreSelect) {
        genreSelect.value = genre;
    }
    
    // Update URL
    const urlParams = new URLSearchParams(window.location.search);
    if (genre) {
        urlParams.set('genre', genre);
    } else {
        urlParams.delete('genre');
    }
    window.history.pushState({}, '', `?${urlParams.toString()}`);
};

const updateGenreChips = (activeGenre) => {
    document.querySelectorAll('.genre-chip').forEach(chip => {
        const isActive = chip.dataset.genre === activeGenre;
        chip.classList.remove('active', 'bg-primary', 'text-white', 'bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
        
        if (isActive) {
            chip.classList.add('active', 'bg-primary', 'text-white');
        } else {
            chip.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
        }
    });
};

const initSortFilter = () => {
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentFilters.sort = e.target.value;
            currentPage = 1;
            loadMovies(currentFilters, 1);
            updateActiveFilters();
            
            // Update URL
            const urlParams = new URLSearchParams(window.location.search);
            if (e.target.value && e.target.value !== 'popular') {
                urlParams.set('sort', e.target.value);
            } else {
                urlParams.delete('sort');
            }
            window.history.pushState({}, '', `?${urlParams.toString()}`);
        });
    }
};

// ======================
// Advanced Search
// ======================

const initAdvancedSearch = () => {
    const advancedBtn = document.getElementById('advanced-search');
    const modal = document.getElementById('advanced-search-modal');
    const closeBtn = document.getElementById('close-advanced-search');
    const form = document.getElementById('advanced-search-form');
    const clearBtn = document.getElementById('clear-advanced');
    const ratingSlider = document.getElementById('adv-rating');
    const ratingValue = document.getElementById('rating-value');

    if (advancedBtn && modal) {
        advancedBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    }

    if (ratingSlider && ratingValue) {
        ratingSlider.addEventListener('input', (e) => {
            ratingValue.textContent = parseFloat(e.target.value).toFixed(1);
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAdvancedSearch();
        });
    }

    if (clearBtn && form) {
        clearBtn.addEventListener('click', () => {
            form.reset();
            if (ratingSlider) ratingSlider.value = 5;
            if (ratingValue) ratingValue.textContent = '5.0';
        });
    }
};

const handleAdvancedSearch = () => {
    const getFieldValue = (id) => document.getElementById(id)?.value || '';
    
    currentFilters = {
        ...currentFilters,
        search: getFieldValue('adv-title'),
        director: getFieldValue('adv-director'),
        yearFrom: getFieldValue('adv-year-from'),
        yearTo: getFieldValue('adv-year-to'),
        rating: getFieldValue('adv-rating'),
        duration: getFieldValue('adv-duration'),
        cast: getFieldValue('adv-cast')
    };

    // Update main search input
    const searchInput = document.getElementById('search-input');
    if (searchInput && currentFilters.search) {
        searchInput.value = currentFilters.search;
    }

    currentPage = 1;
    loadMovies(currentFilters, 1);
    updateActiveFilters();

    // Close modal
    const modal = document.getElementById('advanced-search-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// ======================
// UI Update Functions
// ======================

const updateActiveFilters = () => {
    const container = document.getElementById('active-filters');
    const clearBtn = document.getElementById('clear-filters');
    
    if (!container) return;

    const filters = [];

    if (currentFilters.search) {
        filters.push({
            label: `Search: "${currentFilters.search}"`,
            key: 'search'
        });
    }

    if (currentFilters.genre) {
        filters.push({
            label: `Genre: ${currentFilters.genre}`,
            key: 'genre'
        });
    }

    if (currentFilters.sort && currentFilters.sort !== 'popular') {
        const sortLabels = {
            'rating': 'Highest Rated',
            'newest': 'Newest First',
            'oldest': 'Oldest First',
            'title': 'A-Z'
        };
        filters.push({
            label: `Sort: ${sortLabels[currentFilters.sort]}`,
            key: 'sort'
        });
    }

    if (currentFilters.director) {
        filters.push({
            label: `Director: ${currentFilters.director}`,
            key: 'director'
        });
    }

    if (currentFilters.yearFrom || currentFilters.yearTo) {
        const yearRange = currentFilters.yearFrom && currentFilters.yearTo 
            ? `${currentFilters.yearFrom}-${currentFilters.yearTo}`
            : currentFilters.yearFrom ? `From ${currentFilters.yearFrom}`
            : `Until ${currentFilters.yearTo}`;
        filters.push({
            label: `Year: ${yearRange}`,
            key: 'year'
        });
    }

    container.innerHTML = filters.map(filter => `
        <span class="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            ${filter.label}
            <button class="ml-2 text-primary/70 hover:text-primary" onclick="removeFilter('${filter.key}')">
                <i class="fas fa-times text-xs"></i>
            </button>
        </span>
    `).join('');

    if (clearBtn) {
        clearBtn.style.display = filters.length > 0 ? 'inline-block' : 'none';
        clearBtn.addEventListener('click', clearAllFilters);
    }
};

const removeFilter = (key) => {
    switch (key) {
        case 'search':
            currentFilters.search = '';
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = '';
            break;
        case 'genre':
            currentFilters.genre = '';
            const genreSelect = document.getElementById('genre-filter');
            if (genreSelect) genreSelect.value = '';
            updateGenreChips('');
            break;
        case 'sort':
            currentFilters.sort = 'popular';
            const sortSelect = document.getElementById('sort-by');
            if (sortSelect) sortSelect.value = 'popular';
            break;
        case 'director':
            currentFilters.director = '';
            break;
        case 'year':
            currentFilters.yearFrom = '';
            currentFilters.yearTo = '';
            break;
    }

    currentPage = 1;
    loadMovies(currentFilters, 1);
    updateActiveFilters();
};

const clearAllFilters = () => {
    currentFilters = {
        search: '',
        genre: '',
        sort: 'popular',
        yearFrom: '',
        yearTo: '',
        rating: '',
        duration: '',
        director: '',
        cast: ''
    };

    // Reset UI elements
    const searchInput = document.getElementById('search-input');
    const genreSelect = document.getElementById('genre-filter');
    const sortSelect = document.getElementById('sort-by');

    if (searchInput) searchInput.value = '';
    if (genreSelect) genreSelect.value = '';
    if (sortSelect) sortSelect.value = 'popular';

    updateGenreChips('');
    currentPage = 1;
    loadMovies(currentFilters, 1);
    updateActiveFilters();
    
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname);
};

const updateResultsCount = (count) => {
    const resultCount = document.getElementById('results-count');
    if (resultCount) {
        resultCount.textContent = `${count} movie${count !== 1 ? 's' : ''} found`;
    }
};

const updateLoadMoreButton = () => {
    const loadMoreBtn = document.getElementById('load-more');
    if (loadMoreBtn) {
        if (currentPage < totalPages) {
            loadMoreBtn.classList.remove('hidden');
            loadMoreBtn.onclick = () => loadMovies(currentFilters, currentPage + 1, true);
        } else {
            loadMoreBtn.classList.add('hidden');
        }
    }
};

const showNoResults = () => {
    const container = document.getElementById('movies-grid');
    const noResults = document.getElementById('no-results');
    
    if (container) {
        container.innerHTML = '';
    }
    
    if (noResults) {
        noResults.classList.remove('hidden');
    }
    
    updateResultsCount(0);
};

const updateNoResultsMessage = () => {
    const noResults = document.getElementById('no-results');
    if (noResults) {
        if (allMovies.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }
    }
};

// ======================
// Movie Details Functions
// ======================

const loadMovieDetails = async () => {
    const movieId = new URLSearchParams(window.location.search).get('id');
    if (!movieId) return (window.location.href = '/pages/movies/');

    try {
        const { data } = await axios.get(`${API_BASE_URL}/movies/${movieId}`);
        const movie = data.data.movie;

        // Utilities
        const updateElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        const updateSrc = (id, src) => {
            const el = document.getElementById(id);
            if (el) el.src = src;
        };

        // Basic Info
        updateElement('movie-title', movie.title);
        updateElement('movie-year', movie.year);
        updateElement('movie-rating', `${movie.averageRating?.toFixed(1) || 'N/A'}/10`);
        updateElement('avg-rating', `${movie.averageRating?.toFixed(1) || 'N/A'}/10`);
        updateElement('total-reviews', movie.reviewCount || 0);
        updateElement('release-year', movie.year);

        // Duration
        const formattedDuration = `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`;
        updateElement('movie-duration', formattedDuration);
        updateElement('movie-duration-sidebar', formattedDuration);

        // Description and Director
        updateElement('movie-description', movie.description);
        updateElement('movie-director', movie.director);

        // Cast
        const castList = document.getElementById('movie-cast-list');
        if (castList && movie.cast) {
            castList.innerHTML = Array.isArray(movie.cast)
                ? movie.cast.map(actor => `<p class="text-sm dark:text-white">${actor}</p>`).join('')
                : `<p class="text-sm dark:text-white">${movie.cast}</p>`;
        } else {
            updateElement('movie-cast', movie.cast?.join(', '));
        }

        // Images
        updateSrc('movie-poster', movie.poster);
        updateSrc('movie-backdrop', movie.backdrop);

        // Rating bar
        const ratingBar = document.getElementById('rating-bar');
        if (ratingBar) {
            const width = movie.averageRating ? `${(movie.averageRating / 10) * 100}%` : '0%';
            ratingBar.style.width = width;
        }

        // Genres
        const genresContainer = document.getElementById('movie-genres');
        if (genresContainer && movie.genre) {
            genresContainer.innerHTML = movie.genre.map(genre =>
                `<span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">${genre}</span>`
            ).join('');
        }

        // Watchlist Button
        const watchlistBtn = document.getElementById('watchlist-btn');
        if (watchlistBtn) {
            watchlistBtn.addEventListener('click', () => toggleWatchlist(movieId));
            await updateWatchlistButton(movieId);
        }

        // Write Review Button
        const heroReviewBtn = document.getElementById('write-review-btn');
        if (heroReviewBtn) {
            heroReviewBtn.addEventListener('click', () => initReviewModal());
        }

        // Add Review Button
        const addReviewBtn = document.getElementById('add-review-btn');
        if (addReviewBtn) {
            addReviewBtn.addEventListener('click', () => initReviewModal());
        }

        // Trailer Button
        const trailerBtn = document.getElementById('watch-trailer-btn');
        if (trailerBtn) {
            if (movie.trailer) {
                trailerBtn.addEventListener('click', () => {
                    window.open(movie.trailer, '_blank');
                });
            } else {
                trailerBtn.disabled = true;
                trailerBtn.classList.add('opacity-50', 'cursor-not-allowed');
                const trailerText = trailerBtn.querySelector('span');
                if (trailerText) trailerText.textContent = 'No Trailer Available';
            }
        }

        // Load Reviews
        await loadReviews(movieId);

    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Failed to load movie',
            text: err.response?.data?.message || 'Movie not found',
        }).then(() => {
            window.location.href = '/pages/movies/';
        });
    }
};


const toggleWatchlist = async (movieId) => {
    const btn = document.getElementById('watchlist-btn');
    
    try {
        const token = localStorage.getItem('token');
        if (!token) return window.location.href = '/pages/auth/login.html';

        // First get current user data to check watchlist status
        const userResponse = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const isCurrentlyInWatchlist = userResponse.data.data.user.watchLater?.includes(movieId);
        console.log('Currently in watchlist:', isCurrentlyInWatchlist);
        
        // Use the correct endpoint based on current status
        if (isCurrentlyInWatchlist) {
            // Remove from watchlist
            await axios.delete(`${API_BASE_URL}/users/watchlist/${movieId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } else {
            // Add to watchlist
            await axios.post(`${API_BASE_URL}/users/watchlist/${movieId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
        
        // Update UI
        if (btn) {
            const iconEl = btn.querySelector('i');
            const textEl = btn.querySelector('span');
            
            if (!isCurrentlyInWatchlist) {
                // Just added to watchlist
                iconEl.className = 'fas fa-bookmark';
                textEl.textContent = 'In Watchlist';
                btn.classList.remove('glass-effect');
                btn.classList.add('bg-green-600', 'hover:bg-green-700');
            } else {
                // Just removed from watchlist
                iconEl.className = 'far fa-bookmark';
                textEl.textContent = 'Add to Watchlist';
                btn.classList.add('glass-effect');
                btn.classList.remove('bg-green-600', 'hover:bg-green-700');
            }
        }
        
        // Show success message
        Swal.fire({
            icon: 'success',
            title: !isCurrentlyInWatchlist ? 'Added to Watchlist!' : 'Removed from Watchlist!',
            showConfirmButton: false,
            timer: 1500
        });
        
    } catch (err) {
        console.error('Watchlist toggle error:', err);
        console.error('Error response:', err.response);
        Swal.fire({
            icon: 'error',
            title: 'Failed to update watchlist',
            text: err.response?.data?.message || 'Please try again'
        });
    }
};

const updateWatchlistButton = async (movieId) => {
    const token = localStorage.getItem('token');
    const btn = document.getElementById('watchlist-btn');
    
    if (!token || !btn) return;

    try {
        const { data } = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const isInWatchlist = data.data.user.watchLater?.includes(movieId);
        const iconEl = btn.querySelector('i');
        const textEl = btn.querySelector('span');
        
        if (isInWatchlist) {
            iconEl.className = 'fas fa-bookmark';
            textEl.textContent = 'In Watchlist';
            btn.classList.remove('glass-effect');
            btn.classList.add('bg-green-600', 'hover:bg-green-700');
        } else {
            iconEl.className = 'far fa-bookmark';
            textEl.textContent = 'Add to Watchlist';
            btn.classList.add('glass-effect');
            btn.classList.remove('bg-green-600', 'hover:bg-green-700');
        }
    } catch (err) {
        console.error('Failed to check watchlist status:', err);
    }
};

// ======================
// Review System
// ======================

const handleDeleteReview = async (e) => {
    const reviewId = e.target.closest('[data-review-id]').dataset.reviewId;
    const movieId = new URLSearchParams(window.location.search).get('id');
    
    Swal.fire({
        title: 'Delete Review?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // CORRECTED: Use the proper nested endpoint
                await axios.delete(`${API_BASE_URL}/movies/${movieId}/reviews/${reviewId}`, {
                    headers: { 
                        Authorization: `Bearer ${localStorage.getItem('token')}` 
                    }
                });
                await loadReviews();
                Swal.fire('Deleted!', 'Your review has been deleted.', 'success');
            } catch (err) {
                console.error('Delete review error:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: err.response?.data?.message || 'Please try again'
                });
            }
        }
    });
};

const handleEditReview = (e) => {
    const reviewData = JSON.parse(e.target.closest('.edit-review-btn').dataset.review);
    initReviewModal(reviewData);
};

const loadReviews = async (movieId) => {
    if (!movieId) {
        movieId = new URLSearchParams(window.location.search).get('id');
    }
    if (!movieId) return;

    try {
        const endpoint = `${API_BASE_URL}/movies/${movieId}/reviews`;
        
        let headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('token');
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const { data } = await axios.get(endpoint, { headers });
        const reviews = data.data.reviews || [];
        
        const container = document.getElementById('reviews-container');
        const noReviewsElement = document.getElementById('no-reviews');
        const reviewCountElement = document.getElementById('review-count');
        const totalReviewsElement = document.getElementById('total-reviews');
        
        // Get current user data - FIXED user ID comparison
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isLoggedIn = !!token && !!currentUser._id;
        
        console.log('Current user from localStorage:', currentUser);
        console.log('Is logged in:', isLoggedIn);

        if (!container) return;
        
        // Update review count
        if (reviewCountElement) {
            reviewCountElement.textContent = `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`;
        }
        if (totalReviewsElement) {
            totalReviewsElement.textContent = reviews.length;
        }

        if (reviews.length === 0) {
            container.classList.add('hidden');
            if (noReviewsElement) {
                noReviewsElement.classList.remove('hidden');
            }
            return;
        }

        container.classList.remove('hidden');
        if (noReviewsElement) {
            noReviewsElement.classList.add('hidden');
        }

        container.innerHTML = reviews.map(review => {
            // FIXED: Compare user IDs as strings and check populated user object
            const reviewUserId = review.user?._id || review.user;
            const currentUserId = currentUser._id;
            
            const canModifyReview = isLoggedIn && (
                reviewUserId === currentUserId || 
                ['admin', 'super-admin'].includes(currentUser.role)
            );

            console.log('Review user ID:', reviewUserId);
            console.log('Current user ID:', currentUserId);
            console.log('Current user role:', currentUser.role);
            console.log('Can modify review:', canModifyReview);

            return `
                <div class="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl shadow-md border-l-4 border-purple-500 relative group hover:shadow-xl transition-all duration-300" data-review-id="${review._id}">
                    <div class="flex items-start gap-4 mb-4">
                        <div class="flex-shrink-0">
                            <img src="${review.user?.photo || '/assets/images/default-avatar.jpg'}" 
                                 alt="${review.user?.name || 'Anonymous'}" 
                                 class="w-12 h-12 rounded-full object-cover border-2 border-purple-200 dark:border-purple-700"
                                 onerror="this.src='/assets/images/default-avatar.jpg'">
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-bold text-lg dark:text-white">${review.user?.name || 'Anonymous'}</h3>
                                <div class="flex items-center gap-2">
                                    <div class="flex text-yellow-400">
                                        ${Array(10).fill().map((_, i) => 
                                            `<i class="fas fa-star ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'} text-sm"></i>`
                                        ).join('')}
                                    </div>
                                    <span class="text-sm font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">${review.rating}/10</span>
                                </div>
                            </div>
                            <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">${review.review}</p>
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                    <i class="far fa-calendar-alt mr-1"></i>
                                    ${new Date(review.createdAt).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </span>
                                ${canModifyReview ? `
                                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button class="edit-review-btn p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-full transition-all duration-200" data-review='${JSON.stringify(review).replace(/'/g, "&apos;")}' title="Edit Review">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="delete-review-btn p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-full transition-all duration-200" title="Delete Review">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for delete and edit buttons
        container.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteReview);
        });

        container.querySelectorAll('.edit-review-btn').forEach(btn => {
            btn.addEventListener('click', handleEditReview);
        });

    } catch (err) {
        console.error('Failed to load reviews:', err);
        console.error('Error details:', err.response);
        
        const container = document.getElementById('reviews-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <p class="text-gray-500 dark:text-gray-400">Failed to load reviews. Please try again later.</p>
                </div>
            `;
        }
    }
};


const initReviewModal = (reviewToEdit = null) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 class="text-xl font-bold mb-4 dark:text-white">
                ${reviewToEdit ? 'Edit Review' : 'Write Review'}
            </h3>
            <form id="review-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1 dark:text-gray-300">Rating (1-10)</label>
                    <input type="number" id="review-rating" min="1" max="10" required 
                           class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                           placeholder="Your rating"
                           value="${reviewToEdit?.rating || ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 dark:text-gray-300">Review</label>
                    <textarea id="review-text" rows="4" required 
                              class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                              placeholder="Share your thoughts...">${reviewToEdit?.review || ''}</textarea>
                </div>
                <div class="flex justify-end gap-3">
                    <button type="button" id="cancel-review" class="btn btn-outline">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        ${reviewToEdit ? 'Update' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Form submission with correct endpoints
    modal.querySelector('#review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const movieId = new URLSearchParams(window.location.search).get('id');
        const token = localStorage.getItem('token');
        
        if (!token) {
            window.location.href = '/pages/auth/login.html';
            return;
        }

        try {
            const reviewData = {
                rating: parseInt(document.getElementById('review-rating').value),
                review: document.getElementById('review-text').value
            };

            if (reviewToEdit) {
                // PATCH request to update existing review
                await axios.patch(`${API_BASE_URL}/movies/${movieId}/reviews/${reviewToEdit._id}`, reviewData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // POST request to create new review
                await axios.post(`${API_BASE_URL}/movies/${movieId}/reviews`, reviewData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            modal.remove();
            await loadReviews(movieId);
            Swal.fire({
                icon: 'success',
                title: reviewToEdit ? 'Review Updated!' : 'Review Added!',
                showConfirmButton: false,
                timer: 1500
            });
        } catch (err) {
            console.error('Review submission error:', err);
            Swal.fire({
                icon: 'error',
                title: 'Failed to submit review',
                text: err.response?.data?.message || 'Please try again'
            });
        }
    });

    // Cancel and backdrop click handlers
    modal.querySelector('#cancel-review').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// ======================
// Admin Functions
// ======================

const checkAdminStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const { data } = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        if (['admin', 'super-admin'].includes(data.data.user.role)) {
            const addMovieBtn = document.getElementById('add-movie-btn');
            if (addMovieBtn) {
                addMovieBtn.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Admin check failed:', err);
    }
};

// ======================
// Featured Movies (for main index)
// ======================

const loadFeaturedMovies = async (filter = 'top-rated') => {
    try {
        // Show loading spinner
        const container = document.getElementById('movies-grid');
        if (!container) return;
        
        container.innerHTML = `
            <div class="flex justify-center items-center col-span-full">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F76F53]"></div>
            </div>
        `;

        // Determine API endpoint based on filter
        let apiUrl;
        switch(filter) {
            case 'new':
                apiUrl = `${API_BASE_URL}/movies?limit=10&sort=-createdAt`; // Sort by newest first
                break;
            case 'top-rated':
            default:
                apiUrl = `${API_BASE_URL}/movies?limit=10&sort=-averageRating`; // Sort by highest rating
                break;
        }

        const { data } = await axios.get(apiUrl);
        const movies = data.data.movies || [];
        
        container.innerHTML = movies.map(movie => `
            <div class="movie-card group cursor-pointer bg-[#F2F0E3] dark:bg-[#2E2E2E] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#e0ddd0] dark:border-[#3E3E3E]" onclick="goToMovieDetails('${movie._id}')">
                <!-- Poster Section -->
                <div class="relative overflow-hidden h-80 bg-[#e8e6d9] dark:bg-[#1F1F1F]">
                    <img src="${movie.poster}" 
                         alt="${movie.title}" 
                         class="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                         onerror="this.src='/assets/images/no-poster.jpg'">
                    
                    <!-- Hover Overlay -->
                    <div class="absolute inset-0 bg-gradient-to-t from-[#2E2E2E]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                        <div class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <!-- Rating -->
                            <div class="flex items-center mb-3">
                                <span class="text-[#F76F53] text-lg font-bold mr-2">★</span>
                                <span class="text-[#F2F0E3] text-sm font-medium">${movie.averageRating?.toFixed(1) || 'N/A'}</span>
                                <span class="text-[#F2F0E3]/60 text-xs ml-1">/10</span>
                            </div>
                            
                            <!-- Genres -->
                            ${(movie.genre || []).length > 0 ? `
                            <div class="flex flex-wrap gap-1 mb-2">
                                ${(movie.genre || []).slice(0, 2).map(g => 
                                    `<span class="px-2 py-1 bg-[#F2F0E3]/20 text-[#F2F0E3] text-xs rounded-md font-medium">${g}</span>`
                                ).join('')}
                            </div>
                            ` : ''}
                            
                            <!-- Quick Info -->
                            <p class="text-[#F2F0E3]/80 text-xs line-clamp-2">${movie.plot || 'No description available'}</p>
                        </div>
                    </div>
                    
                    <!-- Rating Badge -->
                    <div class="absolute top-3 right-3 bg-[#F76F53] text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                        ${movie.averageRating?.toFixed(1) || 'N/A'}
                    </div>
                </div>
                
                <!-- Content Section -->
                <div class="p-4">
                    <h3 class="text-[#2E2E2E] dark:text-[#F2F0E3] font-semibold text-base mb-1 line-clamp-1 group-hover:text-[#F76F53] transition-colors duration-200">${movie.title}</h3>
                    
                    <div class="flex items-center justify-between">
                        <p class="text-[#2E2E2E]/60 dark:text-[#F2F0E3]/60 text-sm">${movie.year}</p>
                        
                        <!-- Genre Pills -->
                        ${(movie.genre || []).length > 0 ? `
                        <div class="flex gap-1">
                            ${(movie.genre || []).slice(0, 1).map(g => 
                                `<span class="px-2 py-1 bg-[#F76F53]/10 text-[#F76F53] text-xs rounded-md font-medium">${g}</span>`
                            ).join('')}
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Bottom Stats -->
                    <div class="flex items-center justify-between mt-3 pt-3 border-t border-[#e0ddd0] dark:border-[#3E3E3E]">
                        <div class="flex items-center">
                            <span class="text-[#F76F53] mr-1">★</span>
                            <span class="text-[#2E2E2E]/60 dark:text-[#F2F0E3]/60 text-xs">${movie.averageRating?.toFixed(1) || 'N/A'}/10</span>
                        </div>
                        
                        ${movie.duration ? `
                        <div class="flex items-center">
                            <i class="fas fa-clock text-[#2E2E2E]/40 dark:text-[#F2F0E3]/40 text-xs mr-1"></i>
                            <span class="text-[#2E2E2E]/60 dark:text-[#F2F0E3]/60 text-xs">${movie.duration} min</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Failed to load featured movies:', err);
        const container = document.getElementById('movies-grid');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-[#2E2E2E]/60 dark:text-[#F2F0E3]/60">Failed to load movies. Please try again.</p>
                </div>
            `;
        }
    }
};

// Initialize filter functionality
const initializeFilters = () => {
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            // Remove active class from all chips
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked chip
            this.classList.add('active');
            
            // Get filter type and load movies
            const filter = this.getAttribute('data-filter');
            loadFeaturedMovies(filter);
        });
    });
    
    // Load default movies (top-rated)
    loadFeaturedMovies('top-rated');
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
});

// ======================
// Featured Movie Filters (for main index)
// ======================

const initFeaturedFilters = () => {
    const filterButtons = document.querySelectorAll('section .btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Remove active class from all buttons
            filterButtons.forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-outline');
            });
            
            // Add active class to clicked button
            btn.classList.remove('btn-outline');
            btn.classList.add('btn-primary');
            
            // Load movies based on filter
            const filterText = btn.textContent.toLowerCase();
            let sortParam = 'popular';
            
            if (filterText.includes('popular')) {
                sortParam = 'popular';
            } else if (filterText.includes('rated')) {
                sortParam = 'rating';
            } else if (filterText.includes('soon')) {
                sortParam = 'newest';
            }
            
            try {
                const { data } = await axios.get(`${API_BASE_URL}/movies?limit=10&sort=${sortParam}`);
                const movies = data.data.movies || [];
                
                const container = document.getElementById('movies-grid');
                if (container) {
                    container.innerHTML = movies.map(movie => `
                        <div class="movie-card group cursor-pointer" onclick="goToMovieDetails('${movie._id}')">
                            <div class="relative overflow-hidden rounded-lg aspect-[2/3] bg-gray-200 dark:bg-gray-700">
                                <img src="${movie.poster}" 
                                     alt="${movie.title}" 
                                     class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                     onerror="this.src='/assets/images/no-poster.jpg'">
                                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                    <h3 class="text-white text-sm font-bold mb-1 line-clamp-2">${movie.title}</h3>
                                    <div class="flex items-center mb-1">
                                        <div class="flex text-yellow-400 mr-1">
                                            ${Array(5).fill().map((_, i) => 
                                                `<i class="fas fa-star ${i < Math.floor((movie.averageRating || 0) / 2) ? 'text-yellow-400' : 'text-gray-400'} text-xs"></i>`
                                            ).join('')}
                                        </div>
                                        <span class="text-white text-xs">${movie.averageRating?.toFixed(1) || 'N/A'}</span>
                                    </div>
                                    <div class="flex flex-wrap gap-1">
                                        ${(movie.genre || []).slice(0, 2).map(g => 
                                            `<span class="px-1 py-0.5 bg-primary/30 text-white text-xs rounded">${g}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                            <div class="mt-2">
                                <h3 class="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">${movie.title}</h3>
                                <p class="text-gray-600 dark:text-gray-300 text-xs">${movie.year}</p>
                            </div>
                        </div>
                    `).join('');
                }
            } catch (err) {
                console.error('Failed to load filtered movies:', err);
            }
        });
    });
};

// ======================
// Initialization Functions
// ======================

const initMoviesPage = () => {
    // Check if we're on the movies listing page
    if (document.getElementById('movies-grid') && window.location.pathname.includes('/movies/') && !window.location.pathname.includes('details.html')) {
        initGenreFilter();
        initSortFilter();
        initAdvancedSearch();
        checkAdminStatus();
        loadMovies(currentFilters, 1);
        updateActiveFilters();
    }
    
    // Check if we're on the movie details page
    if (window.location.pathname.includes('details.html')) {
        loadMovieDetails();
    }
    
    // Check if we're on the main index page
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        loadFeaturedMovies();
        initFeaturedFilters();
    }
};

// Make functions globally available
window.updateActiveFilters = updateActiveFilters;
window.removeFilter = removeFilter;
window.clearAllFilters = clearAllFilters;
window.handleAdvancedSearch = handleAdvancedSearch;
window.goToMovieDetails = goToMovieDetails;
window.handleGenreFilter = handleGenreFilter;
window.updateGenreChips = updateGenreChips;
window.currentFilters = currentFilters;
window.currentPage = currentPage;
window.loadMovies = loadMovies;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initMoviesPage);

// Also export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadMovies,
        renderMovies,
        initGenreFilter,
        loadMovieDetails,
        toggleWatchlist,
        loadReviews,
        initReviewModal,
        checkAdminStatus,
        loadFeaturedMovies
    };
}