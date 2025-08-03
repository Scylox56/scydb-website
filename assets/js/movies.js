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
        
        // Set limit for pagination
        queryParams.append('limit', 10); // Load 10 movies at a time

        const url = `${API_BASE_URL}/movies${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const { data } = await axios.get(url);
        
        console.log('API Response:', data);
        console.log('Movies found:', data.data.movies?.length || 0);

        const movies = data.data.movies || [];
        const pagination = {
            totalResults: data.data.totalResults || 0,
            totalPages: data.data.totalPages || 1,
            currentPage: data.data.currentPage || page,
            hasNextPage: data.data.hasNextPage || false
        };

        totalPages = pagination.totalPages;
        currentPage = pagination.currentPage;

        if (append) {
            allMovies = [...allMovies, ...movies];
        } else {
            allMovies = movies;
        }

        renderMovies(allMovies);
        updateResultsCount(pagination.totalResults);
        updateLoadMoreButton(pagination.hasNextPage, pagination.totalResults);
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
        <div class="movie-card-enhanced group" onclick="goToMovieDetails('${movie._id}')">
            <div class="movie-poster-container">
                <img src="${movie.poster}" 
                     alt="${movie.title}" 
                     class="w-full h-full object-cover"
                     onerror="this.src='/assets/images/no-poster.jpg'">
                
                <!-- Rating Badge -->
                <div class="movie-rating-badge">
                    ${movie.averageRating?.toFixed(1) || 'N/A'}
                </div>
                
                <!-- Hover Overlay -->
                <div class="movie-overlay">
                    <div class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 class="text-white text-lg font-bold mb-2 line-clamp-2">${movie.title}</h3>
                        <div class="movie-genres mb-2">
                            ${(movie.genre || []).slice(0, 2).map(g => 
                                `<span class="px-2 py-1 bg-white/20 text-white text-xs rounded-full">${g}</span>`
                            ).join('')}
                        </div>
                        <p class="text-desc text-sm line-clamp-2">${movie.description || ''}</p>
                    </div>
                </div>
            </div>
            
            <div class="movie-content">
                <h3 class="movie-title line-clamp-1">${movie.title}</h3>
                <div class="movie-meta">
                    <span>${movie.year}</span>
                    <span>${movie.director}</span>
                </div>
                
                <div class="movie-genres">
                    ${(movie.genre || []).slice(0, 2).map(g => 
                        `<span class="movie-genre-tag">${g}</span>`
                    ).join('')}
                </div>
                
                <div class="movie-stats">
                    <div class="movie-rating-display">
                        <span class="text-[#F76F53]">★</span>
                        <span class="font-medium">${movie.averageRating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    
                    ${movie.duration ? `
                    <div class="movie-duration">
                        <i class="fas fa-clock"></i>
                        <span>${movie.duration} min</span>
                    </div>
                    ` : ''}
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

    // Open modal
    if (advancedBtn && modal) {
        advancedBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';
            
            // Focus trap
            const firstInput = modal.querySelector('input, select, button');
            if (firstInput) firstInput.focus();
        });
    }

    // Close modal function
    const closeModal = () => {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }
    };

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Click outside to close
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Rating slider
    if (ratingSlider && ratingValue) {
        ratingSlider.addEventListener('input', (e) => {
            ratingValue.textContent = parseFloat(e.target.value).toFixed(1);
        });
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAdvancedSearch();
            closeModal();
        });
    }

    // Clear form
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
            label: `"${currentFilters.search}"`,
            key: 'search'
        });
    }

    if (currentFilters.genre) {
        filters.push({
            label: currentFilters.genre,
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
            label: sortLabels[currentFilters.sort],
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
        <span class="active-filter-tag">
            ${filter.label}
            <button onclick="removeFilter('${filter.key}')">
                <i class="fas fa-times"></i>
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

const updateLoadMoreButton = (hasNextPage = false, totalResults = 0) => {
    const loadMoreBtn = document.getElementById('load-more');
    if (!loadMoreBtn) {
        console.log('Movies page load more button not found');
        return;
    }
    
    console.log('Movies load more check:', {
        hasNextPage,
        totalResults,
        currentMoviesShowing: allMovies.length,
        shouldShow: hasNextPage && totalResults > allMovies.length && totalResults > 10
    });
    
    // Show button only if:
    // 1. There are more pages available (hasNextPage = true)
    // 2. We have more total results than currently showing
    // 3. We have a reasonable number of movies (more than 10 to justify pagination)
    const shouldShow = hasNextPage && totalResults > allMovies.length && totalResults > 10;
    
    // FORCE HIDE - be more aggressive
    if (!shouldShow) {
        console.log('FORCING MOVIES LOAD MORE BUTTON TO HIDE');
        loadMoreBtn.style.display = 'none';
        loadMoreBtn.classList.add('hidden');
        return; // Exit early
    }
    
    // Only show if conditions are met
    if (shouldShow) {
        console.log('SHOWING MOVIES LOAD MORE BUTTON');
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.classList.remove('hidden');
        const remaining = totalResults - allMovies.length;
        loadMoreBtn.innerHTML = `
            <i class="fas fa-plus mr-2"></i> 
            Load More Movies (${remaining} remaining)
        `;
        
        // Remove any existing event listeners and add new one
        loadMoreBtn.replaceWith(loadMoreBtn.cloneNode(true));
        const newBtn = document.getElementById('load-more');
        newBtn.onclick = () => loadMovies(currentFilters, currentPage + 1, true);
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

        // Update browser title with movie name
        document.title = `${movie.title} (${movie.year}) - ScyDB`;

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
                ? movie.cast.map(actor => `
                    <div class="cast-member flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-[#2E2E2E]/10 dark:border-[#F2F0E3]/10 hover:border-[#F76F53]/30 transition-all duration-300">
                        <i class="fas fa-user text-[#F76F53]"></i>
                        <span class="font-medium text-[#2E2E2E] dark:text-[#F2F0E3]">${actor}</span>
                    </div>
                `).join('')
                : `<div class="cast-member flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-[#2E2E2E]/10 dark:border-[#F2F0E3]/10">
                    <i class="fas fa-user text-[#F76F53]"></i>
                    <span class="font-medium text-[#2E2E2E] dark:text-[#F2F0E3]">${movie.cast}</span>
                </div>`;
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
                `<span class="genre-tag">${genre}</span>`
            ).join('');
        }

        updateElement('sidebar-director', movie.director);

        // Update sidebar genres
        const sidebarGenres = document.getElementById('sidebar-genres');
        if (sidebarGenres && movie.genre) {
            sidebarGenres.innerHTML = movie.genre.map(genre =>
                `<span class="sidebar-genre-tag">${genre}</span>`
            ).join('');
        }

        // Update cast count
        const castCount = document.getElementById('cast-count');
        if (castCount && movie.cast) {
            const count = Array.isArray(movie.cast) ? movie.cast.length : 1;
            castCount.textContent = `${count} actors`;
        }

        // Handle same genre button
        const sameGenreBtn = document.getElementById('same-genre-btn');
        if (sameGenreBtn && movie.genre && movie.genre.length > 0) {
            sameGenreBtn.addEventListener('click', () => {
                const firstGenre = movie.genre[0];
                window.location.href = `/pages/movies/?genre=${encodeURIComponent(firstGenre)}`;
            });
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
    try {
        const reviewDataStr = e.target.closest('.edit-review-btn').dataset.review;
        console.log('Raw review data:', reviewDataStr);
        
        // Clean up the JSON string - replace HTML entities
        const cleanedStr = reviewDataStr.replace(/&apos;/g, "'").replace(/&quot;/g, '"');
        console.log('Cleaned review data:', cleanedStr);
        
        const reviewData = JSON.parse(cleanedStr);
        console.log('Parsed review data:', reviewData);
        
        initReviewModal(reviewData);
    } catch (err) {
        console.error('Error parsing review data:', err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load review data for editing'
        });
    }
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
            const reviewUserId = review.user?._id || review.user;
            const currentUserId = currentUser._id;
            
            const canModifyReview = isLoggedIn && (
                reviewUserId === currentUserId || 
                ['admin', 'super-admin'].includes(currentUser.role)
            );

            return `
                <div class="card rounded-2xl p-4 md:p-8 border-l-4 border-[#F76F53] hover:shadow-xl transition-all duration-300 group" data-review-id="${review._id}">
                    <div class="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                        <div class="flex-shrink-0 flex md:flex-col items-center md:items-start gap-4">
                            <img src="${review.user?.photo || '/assets/images/default-avatar.jpg'}" 
                                alt="${review.user?.name || 'Anonymous'}" 
                                class="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-4 border-[#F76F53]/20 shadow-lg"
                                onerror="this.src='/assets/images/default-avatar.jpg'">
                            
                            <!-- Mobile: Show rating next to avatar -->
                            <div class="md:hidden flex items-center gap-2">
                                <div class="flex text-sm">
                                    ${Array(10).fill().map((_, i) => 
                                        `<i class="fas fa-star ${i < review.rating ? 'review-star-active' : 'text-[#2E2E2E]/20 dark:text-[#F2F0E3]/20'}"></i>`
                                    ).join('')}
                                </div>
                                <span class="text-sm font-bold bg-gradient-to-r from-[#F76F53] to-[#FF8A70] text-white px-2 py-1 rounded-full shadow-lg">${review.rating}/10</span>
                            </div>
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <div class="flex flex-col md:flex-row md:items-center justify-between mb-3 md:mb-4 gap-2">
                                <h3 class="font-bold text-lg md:text-xl text-[#2E2E2E] dark:text-[#F2F0E3] truncate">${review.user?.name || 'Anonymous'}</h3>
                                
                                <!-- Desktop: Show rating in header -->
                                <div class="hidden md:flex items-center gap-3">
                                    <div class="flex text-lg">
                                        ${Array(10).fill().map((_, i) => 
                                            `<i class="fas fa-star ${i < review.rating ? 'review-star-active' : 'text-[#2E2E2E]/20 dark:text-[#F2F0E3]/20'}"></i>`
                                        ).join('')}
                                    </div>
                                    <span class="text-lg font-bold bg-gradient-to-r from-[#F76F53] to-[#FF8A70] text-white px-4 py-2 rounded-full shadow-lg">${review.rating}/10</span>
                                </div>
                            </div>
                            
                            <p class="text-base md:text-lg leading-relaxed text-[#2E2E2E] dark:text-[#F2F0E3] mb-4 break-words">${review.review}</p>
                            
                            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <span class="text-sm text-[#2E2E2E]/60 dark:text-[#F2F0E3]/60 flex items-center gap-2">
                                    <i class="far fa-calendar-alt text-[#F76F53]"></i>
                                    ${new Date(review.createdAt).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </span>
                                
                                ${canModifyReview ? `
                                <div class="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-300 self-end md:self-auto">
                                    ${reviewUserId === currentUserId ? `
                                    <button class="edit-review-btn p-2 md:p-3 text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-all duration-200 shadow-md hover:shadow-lg" data-review='${JSON.stringify(review).replace(/'/g, "&apos;")}' title="Edit Review">
                                        <i class="fas fa-edit text-sm md:text-lg"></i>
                                    </button>
                                    ` : ''}
                                    <button class="delete-review-btn p-2 md:p-3 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-all duration-200 shadow-md hover:shadow-lg" title="Delete Review">
                                        <i class="fas fa-trash text-sm md:text-lg"></i>
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
    modal.className = 'review-modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="review-modal-content rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <!-- Modal Header -->
            <div class="modal-header bg-gradient-to-r from-[#F76F53] to-[#FF8A70] p-6 dark:text-white">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-white/20 text-orange-400 rounded-full flex items-center justify-center">
                        <i class="fas fa-star"></i>
                    </div>
                    <h3 class="text-xl font-semibold">
                        ${reviewToEdit ? 'Edit Your Review' : 'Write a Review'}
                    </h3>
                </div>
            </div>
            
            <!-- Modal Body -->
            <div class="review-modal-body p-6">
                <form id="review-form" class="space-y-6">
                    <!-- Rating Input -->
                    <div class="rating-section">
                        <label class="flex items-center gap-2 text-sm font-semibold mb-3 review-modal-text">
                            <i class="fas fa-star text-[#F76F53]"></i>
                            Rating (1-10)
                        </label>
                        <div class="rating-input-container relative">
                            <input type="number" id="review-rating" min="1" max="10" required 
                                   class="review-modal-input w-full border-2 rounded-xl px-4 py-3 focus:border-[#F76F53] focus:outline-none focus:ring-2 focus:ring-[#F76F53]/20 transition-all duration-300" 
                                   placeholder="Rate this movie (1-10)"
                                   value="${reviewToEdit?.rating || ''}">
                        </div>
                    </div>
                    
                    <!-- Review Text -->
                    <div class="review-section">
                        <label class="flex items-center gap-2 text-sm font-semibold mb-3 review-modal-text">
                            <i class="fas fa-pen text-[#F76F53]"></i>
                            Your Review
                        </label>
                        <textarea id="review-text" rows="4" required 
                                  class="review-modal-input w-full border-2 rounded-xl px-4 py-3 focus:border-[#F76F53] focus:outline-none focus:ring-2 focus:ring-[#F76F53]/20 transition-all duration-300 resize-none" 
                                  placeholder="Share your thoughts about this movie...">${reviewToEdit?.review || ''}</textarea>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex justify-end gap-3 pt-4 review-modal-border-top">
                        <button type="button" id="cancel-review" class="btn btn-outline px-6 py-3 font-medium transition-all duration-300 hover:scale-105">
                            <i class="fas fa-times mr-2"></i>
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary px-6 py-3 font-medium transition-all duration-300 hover:scale-105">
                            <i class="fas fa-check mr-2"></i>
                            ${reviewToEdit ? 'Update Review' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Force the correct theme styling
    const isDarkMode = document.documentElement.classList.contains('dark');
    const modalContent = modal.querySelector('.review-modal-content');
    const modalBody = modal.querySelector('.review-modal-body');
    const inputs = modal.querySelectorAll('.review-modal-input');
    const texts = modal.querySelectorAll('.review-modal-text');
    const borderTop = modal.querySelector('.review-modal-border-top');

    if (isDarkMode) {
        modalContent.style.backgroundColor = '#2E2E2E';
        modalContent.style.borderColor = '#3E3E3E';
        modalBody.style.backgroundColor = '#2E2E2E';
        inputs.forEach(input => {
            input.style.backgroundColor = '#1F1F1F';
            input.style.borderColor = '#3E3E3E';
            input.style.color = '#F2F0E3';
        });
        texts.forEach(text => {
            text.style.color = '#F2F0E3';
        });
        borderTop.style.borderTopColor = '#3E3E3E';
    } else {
        modalContent.style.backgroundColor = '#F2F0E3';
        modalContent.style.borderColor = '#e0ddd0';
        modalBody.style.backgroundColor = '#F2F0E3';
        inputs.forEach(input => {
            input.style.backgroundColor = '#ffffff';
            input.style.borderColor = '#e0ddd0';
            input.style.color = '#2E2E2E';
        });
        texts.forEach(text => {
            text.style.color = '#2E2E2E';
        });
        borderTop.style.borderTopColor = '#e0ddd0';
    }

    // Add border to modal content
    modalContent.style.border = '1px solid';

    // Add modal animation
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    });


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

        let response;
        if (reviewToEdit) {
            // PATCH request to update existing review - FIXED URL
            console.log('Updating review:', reviewToEdit._id, 'for movie:', movieId);
            response = await axios.patch(`${API_BASE_URL}/movies/${movieId}/reviews/${reviewToEdit._id}`, reviewData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } else {
            // POST request to create new review
            console.log('Creating new review for movie:', movieId);
            response = await axios.post(`${API_BASE_URL}/movies/${movieId}/reviews`, reviewData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
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
        console.error('Error response:', err.response);
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

        // For small datasets, load fewer movies initially
        const limit = 5; // Reduced from 10 since you only have 3 movies
        
        // Determine API endpoint based on filter
        let apiUrl;
        switch(filter) {
            case 'new':
                apiUrl = `${API_BASE_URL}/movies?limit=${limit}&sort=-createdAt`;
                break;
            case 'top-rated':
            default:
                apiUrl = `${API_BASE_URL}/movies?limit=${limit}&sort=-averageRating`;
                break;
        }

        const { data } = await axios.get(apiUrl);
        const movies = data.data.movies || [];
        const totalResults = data.data.totalResults || movies.length;
        const hasMore = data.data.hasNextPage || false;
        
        console.log('Featured movies loaded:', {
            movies: movies.length,
            totalResults,
            hasMore,
            filter
        });
        
        // Store current state for load more
        window.featuredMoviesState = {
            filter,
            currentPage: 1,
            allMovies: movies,
            totalResults,
            hasMore
        };
        
        renderFeaturedMovies(movies);
        updateFeaturedLoadMore(hasMore, totalResults, movies.length);
        
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

const renderFeaturedMovies = (movies) => {
    const container = document.getElementById('movies-grid');
    if (!container) return;

    container.innerHTML = movies.map(movie => `
        <div class="movie-card-enhanced group cursor-pointer" onclick="goToMovieDetails('${movie._id}')">
            <div class="movie-poster-container">
                <img src="${movie.poster}" 
                     alt="${movie.title}" 
                     class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                     onerror="this.src='/assets/images/no-poster.jpg'">
                
                <div class="movie-rating-badge">
                    ${movie.averageRating?.toFixed(1) || 'N/A'}
                </div>
                
                <div class="movie-overlay">
                    <div class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 class="text-white text-lg font-bold mb-2 line-clamp-2">${movie.title}</h3>
                        <div class="movie-genres mb-2">
                            ${(movie.genre || []).slice(0, 2).map(g => 
                                `<span class="px-2 py-1 bg-white/20 text-white text-xs rounded-full">${g}</span>`
                            ).join('')}
                        </div>
                        <p class="text-desc text-sm line-clamp-2">${movie.description || ''}</p>
                    </div>
                </div>
            </div>
            
            <div class="movie-content">
                <h3 class="movie-title line-clamp-1">${movie.title}</h3>
                <div class="movie-meta">
                    <span>${movie.year}</span>
                    <span>${movie.director}</span>
                </div>
            </div>
        </div>
    `).join('');
};

const updateFeaturedLoadMore = (hasMore, totalResults, currentCount) => {
    // Only run on main index page
    const isMainIndex = window.location.pathname === '/' || 
                       window.location.pathname.includes('index.html') ||
                       window.location.pathname === '/pages/index.html';
    
    if (!isMainIndex) {
        console.log('Not main index, skipping load more update');
        return;
    }
    
    const loadMoreBtn = document.getElementById('load-more-featured');
    if (!loadMoreBtn) {
        console.log('Load more button not found');
        return;
    }
    
    console.log('Load more check:', {
        hasMore,
        totalResults,
        currentCount,
        shouldShow: hasMore && totalResults > currentCount && totalResults > 5
    });
    
    const shouldShow = hasMore && totalResults > currentCount && totalResults > 5;
    
    // FORCE HIDE - be more aggressive
    if (!shouldShow) {
        console.log('FORCING BUTTON TO HIDE');
        loadMoreBtn.style.display = 'none';
        loadMoreBtn.classList.add('hidden');
        return; // Exit early
    }
    
    // Only show if conditions are met
    if (shouldShow) {
        console.log('SHOWING BUTTON');
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.classList.remove('hidden');
        const remaining = totalResults - currentCount;
        loadMoreBtn.innerHTML = `
            <i class="fas fa-plus mr-2"></i> 
            Load More (${remaining} remaining)
        `;
        
        // Remove any existing event listeners and add new one
        loadMoreBtn.replaceWith(loadMoreBtn.cloneNode(true));
        const newBtn = document.getElementById('load-more-featured');
        newBtn.onclick = () => loadMoreFeaturedMovies();
    }
};

const loadMoreFeaturedMovies = async () => {
    if (!window.featuredMoviesState) return;
    
    const { filter, currentPage, allMovies, totalResults } = window.featuredMoviesState;
    const nextPage = currentPage + 1;
    
    try {
        let apiUrl;
        switch(filter) {
            case 'new':
                apiUrl = `${API_BASE_URL}/movies?limit=10&page=${nextPage}&sort=-createdAt`;
                break;
            case 'top-rated':
            default:
                apiUrl = `${API_BASE_URL}/movies?limit=10&page=${nextPage}&sort=-averageRating`;
                break;
        }

        const { data } = await axios.get(apiUrl);
        const newMovies = data.data.movies || [];
        const hasMore = data.data.hasNextPage || false;
        
        // Update state
        const updatedMovies = [...allMovies, ...newMovies];
        window.featuredMoviesState = {
            filter,
            currentPage: nextPage,
            allMovies: updatedMovies,
            totalResults,
            hasMore
        };
        
        // Re-render all movies
        renderFeaturedMovies(updatedMovies);
        updateFeaturedLoadMore(hasMore, totalResults, updatedMovies.length);
        
    } catch (err) {
        console.error('Failed to load more featured movies:', err);
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

const loadGenres = async () => {
    try {
        // Show loading state
        const genreChips = document.getElementById('genre-chips');
        if (genreChips) {
            genreChips.innerHTML = Array(6).fill().map(() => 
                '<div class="genre-loading"></div>'
            ).join('');
        }

        const { data } = await axios.get(`${API_BASE_URL}/genres/active`);
        const genres = data.data.genres || [];
        
        // Update genre dropdown
        const genreSelect = document.getElementById('genre-filter');
        if (genreSelect) {
            genreSelect.innerHTML = '<option value="">All Genres</option>';
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.name;
                option.textContent = genre.name;
                genreSelect.appendChild(option);
            });
        }
        
        // Update genre chips
        if (genreChips) {
            const allChip = `<button class="filter-chip active px-4 py-2 rounded-full transition-all duration-300" data-genre="">All</button>`;
            const genreChipsHTML = genres.slice(0, 8).map(genre => 
                `<button class="filter-chip px-4 py-2 rounded-full transition-all duration-300" data-genre="${genre.name}">${genre.name}</button>`
            ).join('');
            
            genreChips.innerHTML = allChip + genreChipsHTML;
            
            // Add event listeners to chips
            document.querySelectorAll('.filter-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    const genre = chip.dataset.genre;
                    handleGenreFilter(genre);
                });
            });
        }
        
    } catch (err) {
        console.error('Failed to load genres:', err);
        
        // Show error state
        const genreChips = document.getElementById('genre-chips');
        if (genreChips) {
            genreChips.innerHTML = '<div class="genre-error">Failed to load genres</div>';
        }
    }
};

const enhanceSearchBar = () => {
    const searchInput = document.getElementById('search-input');
    const searchForm = document.getElementById('search-form');
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (!searchInput) return;
    
    // Enhanced form submission
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                doSearch(query);
                hideSearchSuggestions();
            }
        });
    }
    
    // Search suggestions with debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        searchTimeout = setTimeout(() => {
            if (query) {
                showSearchSuggestions(query);
            } else {
                hideSearchSuggestions();
            }
        }, 300);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsContainer?.contains(e.target)) {
            hideSearchSuggestions();
        }
    });
    
    // Show suggestions when focusing on search (if there's content)
    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.trim();
        if (query && query.length >= 2) {
            showSearchSuggestions(query);
        }
    });
    
    // Enhanced keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.blur();
            hideSearchSuggestions();
        }
    });
};

const showSearchSuggestions = async (query) => {
    if (!query || query.length < 2) {
        hideSearchSuggestions();
        return;
    }
    
    try {
        const { data } = await axios.get(`${API_BASE_URL}/movies?search=${query}&limit=5`);
        const movies = data.data.movies || [];
        
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (suggestionsContainer && movies.length > 0) {
            suggestionsContainer.innerHTML = movies.map(movie => `
                <div class="suggestion-item" onclick="selectSuggestion('${movie._id}', '${movie.title.replace(/'/g, "\\'")}')">
                    <strong>${movie.title}</strong> (${movie.year})
                    <small class="block text-xs opacity-70">${movie.director}</small>
                </div>
            `).join('');
            suggestionsContainer.style.display = 'block';
        }
    } catch (err) {
        console.error('Failed to load suggestions:', err);
    }
};

const hideSearchSuggestions = () => {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
};

const selectSuggestion = (movieId, title) => {
    window.location.href = `/pages/movies/details.html?id=${movieId}`;
    hideSearchSuggestions();
};

// ======================
// Initialization Functions
// ======================

const initMoviesPage = () => {
    // Check if we're on the movies listing page
    if (document.getElementById('movies-grid') && window.location.pathname.includes('/movies/') && !window.location.pathname.includes('details.html')) {
        
        const loadMoreBtn = document.getElementById('load-more');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
            loadMoreBtn.classList.add('hidden');
            console.log('Movies load more button force hidden on page load');
        }
        
        loadGenres(); // Load genres first
        initGenreFilter();
        initSortFilter();
        initAdvancedSearch();
        checkAdminStatus();
        
        // Load movies after genres are loaded
        setTimeout(() => {
            loadMovies(currentFilters, 1);
            updateActiveFilters();
        }, 500);
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

window.clearAllFilters = () => {
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

    // Reset genre chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.genre === '') {
            chip.classList.add('active');
        }
    });

    currentPage = 1;
    loadMovies(currentFilters, 1);
    updateActiveFilters();
    
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname);
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
window.loadGenres = loadGenres;
window.selectSuggestion = selectSuggestion;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const quickSearchGenre = sessionStorage.getItem('quickSearchGenre');
    const quickSearchFilter = sessionStorage.getItem('quickSearchFilter');
    
    if ((quickSearchGenre || quickSearchFilter) && window.location.pathname.includes('/movies/')) {
        // Clear the session storage
        sessionStorage.removeItem('quickSearchGenre');
        sessionStorage.removeItem('quickSearchFilter');
        
        if (quickSearchGenre) {
            // Set the genre filter
            currentFilters.genre = quickSearchGenre;
            
            // Update the genre dropdown
            const genreSelect = document.getElementById('genre-filter');
            if (genreSelect) {
                genreSelect.value = quickSearchGenre;
            }
            
            // Update genre chips
            document.querySelectorAll('.filter-chip').forEach(chip => {
                chip.classList.remove('active');
                if (chip.dataset.genre === quickSearchGenre) {
                    chip.classList.add('active');
                }
            });
        }
        
        if (quickSearchFilter) {
            // Set the sort filter
            currentFilters.sort = quickSearchFilter;
            
            // Update the sort dropdown
            const sortSelect = document.getElementById('sort-by');
            if (sortSelect) {
                sortSelect.value = quickSearchFilter;
            }
        }
        
        // Load movies with the filters
        setTimeout(() => {
            loadMovies(currentFilters, 1);
            updateActiveFilters();
        }, 500);
    }
    
    enhanceSearchBar();
    initMoviesPage();
});

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