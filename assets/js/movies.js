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
    if (!movieId) return window.location.href = '/pages/movies/';

    try {
        const { data } = await axios.get(`${API_BASE_URL}/movies/${movieId}`);
        const movie = data.data.movie;

        // Update DOM elements
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        const updateSrc = (id, src) => {
            const element = document.getElementById(id);
            if (element) element.src = src;
        };

        updateElement('movie-title', movie.title);
        updateElement('movie-year', movie.year);
        updateElement('movie-rating', `${movie.averageRating?.toFixed(1) || 'N/A'}/10`);
        updateElement('movie-duration', `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`);
        updateElement('movie-description', movie.description);
        updateElement('movie-director', movie.director);
        updateElement('movie-cast', movie.cast.join(', '));
        
        updateSrc('movie-poster', movie.poster);
        updateSrc('movie-backdrop', movie.backdrop);

        // Genres
        const genresContainer = document.getElementById('movie-genres');
        if (genresContainer) {
            genresContainer.innerHTML = movie.genre.map(genre => 
                `<span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">${genre}</span>`
            ).join('');
        }

        // Watchlist button
        const watchlistBtn = document.getElementById('watchlist-btn');
        if (watchlistBtn) {
            watchlistBtn.addEventListener('click', () => toggleWatchlist(movieId));
            await updateWatchlistButton(movieId);
        }

        // Load reviews
        await loadReviews(movieId);
        
        // Initialize review modal
        const addReviewBtn = document.getElementById('add-review-btn');
        if (addReviewBtn) {
            addReviewBtn.addEventListener('click', () => initReviewModal());
        }

    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Failed to load movie',
            text: err.response?.data?.message || 'Movie not found'
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

        const { data } = await axios.post(`${API_BASE_URL}/users/watchlist/${movieId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const isInWatchlist = data.data.user.watchLater.includes(movieId);
        
        if (btn) {
            btn.innerHTML = isInWatchlist 
                ? `<i class="fas fa-bookmark mr-2"></i> In Watchlist` 
                : `<i class="far fa-bookmark mr-2"></i> Add to Watchlist`;
            
            btn.classList.toggle('btn-outline', !isInWatchlist);
            btn.classList.toggle('btn-primary', isInWatchlist);
        }
    } catch (err) {
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
        
        const isInWatchlist = data.data.user.watchLater.includes(movieId);
        
        btn.innerHTML = isInWatchlist 
            ? `<i class="fas fa-bookmark mr-2"></i> In Watchlist` 
            : `<i class="far fa-bookmark mr-2"></i> Add to Watchlist`;
        
        btn.classList.toggle('btn-outline', !isInWatchlist);
        btn.classList.toggle('btn-primary', isInWatchlist);
    } catch (err) {
        console.error('Failed to check watchlist status:', err);
    }
};

// ======================
// Review System
// ======================

const loadReviews = async (movieId) => {
    if (!movieId) {
        movieId = new URLSearchParams(window.location.search).get('id');
    }
    if (!movieId) return;

    try {
        const { data } = await axios.get(`${API_BASE_URL}/movies/${movieId}/reviews`);
        const container = document.getElementById('reviews-container');
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

        if (!container) return;

        if (!data.data.reviews || data.data.reviews.length === 0) {
            container.innerHTML = `<p class="text-gray-500 dark:text-gray-400 text-center py-8">No reviews yet. Be the first to review!</p>`;
            return;
        }

        container.innerHTML = data.data.reviews.map(review => `
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg relative" data-review-id="${review._id}">
                <div class="flex items-center gap-3 mb-3">
                    <img src="${review.user.photo || '/assets/images/default-avatar.jpg'}" 
                         alt="${review.user.name}" 
                         class="w-10 h-10 rounded-full object-cover"
                         onerror="this.src='/assets/images/default-avatar.jpg'">
                    <div>
                        <h3 class="font-semibold dark:text-white">${review.user.name}</h3>
                        <div class="flex items-center gap-1">
                            ${Array(10).fill().map((_, i) => 
                                `<i class="fas fa-star ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'} text-sm"></i>`
                            ).join('')}
                            <span class="text-sm ml-1 text-gray-500">${review.rating}/10</span>
                        </div>
                    </div>
                </div>
                <p class="text-gray-700 dark:text-gray-300 mb-4">${review.review}</p>
                <div class="text-xs text-gray-500">
                    ${new Date(review.createdAt).toLocaleDateString()}
                </div>
                
                ${currentUser && (currentUser._id === review.user._id || currentUser.role === 'admin') ? `
                <div class="absolute top-2 right-2 flex gap-2">
                    <button class="edit-review-btn p-1 text-blue-500 hover:text-blue-700" data-review='${JSON.stringify(review)}'>
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-review-btn p-1 text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ` : ''}
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteReview);
        });

        container.querySelectorAll('.edit-review-btn').forEach(btn => {
            btn.addEventListener('click', handleEditReview);
        });

    } catch (err) {
        console.error('Failed to load reviews:', err);
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

    // Form submission
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
                await axios.patch(`${API_BASE_URL}/reviews/${reviewToEdit._id}`, reviewData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
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
            Swal.fire({
                icon: 'error',
                title: 'Failed to submit review',
                text: err.response?.data?.message || 'Please try again'
            });
        }
    });

    // Cancel button
    modal.querySelector('#cancel-review').addEventListener('click', () => {
        modal.remove();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

const handleDeleteReview = async (e) => {
    const reviewId = e.target.closest('[data-review-id]').dataset.reviewId;
    
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
                await axios.delete(`${API_BASE_URL}/reviews/${reviewId}`, {
                    headers: { 
                        Authorization: `Bearer ${localStorage.getItem('token')}` 
                    }
                });
                await loadReviews();
                Swal.fire('Deleted!', 'Your review has been deleted.', 'success');
            } catch (err) {
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

const loadFeaturedMovies = async () => {
    try {
        const { data } = await axios.get(`${API_BASE_URL}/movies?limit=10&sort=popular`);
        const movies = data.data.movies || [];
        
        const container = document.getElementById('movies-grid');
        if (!container) return;

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
    } catch (err) {
        console.error('Failed to load featured movies:', err);
    }
};

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