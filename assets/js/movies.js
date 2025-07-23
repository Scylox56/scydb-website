// ======================
// Movie Core Functions
// ======================
const API_BASE_URL = 'http://localhost:3000/api/v1';
/**
 * Loads movie details for the details page
 */
const loadMovieDetails = async () => {
    const movieId = new URLSearchParams(window.location.search).get('id');
    if (!movieId) return window.location.href = '/pages/movies/';

    try {
        const { data } = await axios.get(`${API_BASE_URL}/movies/${movieId}`);
        const movie = data.data.movie;

        // Update DOM
        document.getElementById('movie-title').textContent = movie.title;
        document.getElementById('movie-year').textContent = movie.year;
        document.getElementById('movie-rating').textContent = `${movie.averageRating?.toFixed(1) || 'N/A'}/10`;
        document.getElementById('movie-duration').textContent = `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`;
        document.getElementById('movie-description').textContent = movie.description;
        document.getElementById('movie-director').textContent = movie.director;
        document.getElementById('movie-cast').textContent = movie.cast.join(', ');
        
        // Set images
        document.getElementById('movie-poster').src = movie.poster;
        document.getElementById('movie-backdrop').src = movie.backdrop;

        // Genres
        const genresContainer = document.getElementById('movie-genres');
        genresContainer.innerHTML = movie.genre.map(genre => 
            `<span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">${genre}</span>`
        ).join('');

        // Watchlist button
        document.getElementById('watchlist-btn').addEventListener('click', toggleWatchlist);

        // Load reviews
        await loadReviews();
        
        // Initialize review modal if button exists
        if (document.getElementById('add-review-btn')) {
            initReviewModal();
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

/**
 * Toggle movie in user's watchlist
 */
const toggleWatchlist = async () => {
    const movieId = new URLSearchParams(window.location.search).get('id');
    const btn = document.getElementById('watchlist-btn');
    
    try {
        const token = localStorage.getItem('token');
        if (!token) return window.location.href = '/pages/auth/login.html';

        const { data } = await axios.post(`${API_BASE_URL}/users/watchlist/${movieId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        btn.innerHTML = data.data.user.watchLater.includes(movieId) 
            ? `<i class="fas fa-bookmark mr-2"></i> In Watchlist` 
            : `<i class="far fa-bookmark mr-2"></i> Add to Watchlist`;
        
        btn.classList.toggle('btn-outline');
        btn.classList.toggle('btn-primary');
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Failed to update watchlist',
            text: err.response?.data?.message || 'Please try again'
        });
    }
};

// ======================
// Review System
// ======================

/**
 * Loads reviews for the current movie
 */
const loadReviews = async () => {
    const movieId = new URLSearchParams(window.location.search).get('id');
    if (!movieId) return;

    try {
        const { data } = await axios.get(`${API_BASE_URL}/movies/${movieId}/reviews`);
        const container = document.getElementById('reviews-container');
        const currentUser = JSON.parse(localStorage.getItem('user'));

        if (!data.data.reviews || data.data.reviews.length === 0) {
            container.innerHTML = `<p class="text-gray-500 dark:text-gray-400 text-center py-8">No reviews yet. Be the first to review!</p>`;
            return;
        }

        container.innerHTML = data.data.reviews.map(review => `
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg relative" data-review-id="${review._id}">
                <div class="flex items-center gap-3 mb-3">
                    <img src="${review.user.photo || '/assets/images/default-avatar.jpg'}" 
                         alt="${review.user.name}" 
                         class="w-10 h-10 rounded-full object-cover">
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
                    <button class="edit-review-btn p-1 text-blue-500 hover:text-blue-700">
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
        document.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteReview);
        });

        document.querySelectorAll('.edit-review-btn').forEach(btn => {
            btn.addEventListener('click', handleEditReview);
        });

    } catch (err) {
        console.error('Failed to load reviews:', err);
    }
};

/**
 * Initialize review submission modal
 */
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
                           class="input-field" placeholder="Your rating"
                           value="${reviewToEdit?.rating || ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1 dark:text-gray-300">Review</label>
                    <textarea id="review-text" rows="4" required class="input-field" 
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
                rating: document.getElementById('review-rating').value,
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
            await loadReviews();
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
};

/**
 * Handles review deletion
 */
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

/**
 * Handles review editing
 */
const handleEditReview = (e) => {
    const reviewElement = e.target.closest('[data-review-id]');
    const reviewId = reviewElement.dataset.reviewId;
    
    const review = {
        _id: reviewId,
        rating: reviewElement.querySelector('.fa-star:not(.text-gray-300)').length,
        review: reviewElement.querySelector('p').textContent
    };
    
    initReviewModal(review);
};

// ======================
// Movie Listings
// ======================

/**
 * Renders movies in grid layout
 */
const renderMovies = (movies) => {
    const container = document.getElementById('movies-grid');
    if (!container) return;

    container.innerHTML = movies.map(movie => `
        <div class="movie-card group">
            <a href="/pages/movies/details.html?id=${movie._id}">
                <div class="relative overflow-hidden rounded-lg aspect-[2/3]">
                    <img src="${movie.poster}" alt="${movie.title}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h3 class="text-white text-xl font-bold mb-2">${movie.title}</h3>
                        <div class="flex items-center mb-2">
                            <div class="relative w-full h-2 bg-gray-700 rounded-full">
                                <div class="absolute top-0 left-0 h-2 bg-yellow-500 rounded-full" 
                                     style="width: ${(movie.averageRating / 10) * 100 || 0}%"></div>
                            </div>
                            <span class="ml-2 text-white font-medium">${movie.averageRating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div class="flex flex-wrap gap-1 mb-4">
                            ${movie.genre.map(g => `<span class="px-2 py-1 bg-primary/30 text-white text-xs rounded-full">${g}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="mt-3">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">${movie.title}</h3>
                    <p class="text-gray-600 dark:text-gray-300">${movie.year}</p>
                </div>
            </a>
        </div>
    `).join('');
};

/**
 * Loads movies for the index page
 */
const loadMovies = async () => {
    try {
        const { data } = await axios.get(`${API_BASE_URL}/movies`);
        renderMovies(data.data.movies);
    } catch (err) {
        console.error('Failed to load movies:', err);
    }
};

// ======================
// Utility Functions
// ======================

/**
 * Initializes search functionality
 */
const initSearch = () => {
    document.getElementById('search-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;

        try {
            const { data } = await axios.get(`${API_BASE_URL}/movies?search=${query}`);
            renderMovies(data.data.movies);
        } catch (err) {
            console.error('Search failed:', err);
        }
    });
};

/**
 * Initializes genre filter
 */
const initGenreFilter = () => {
    document.getElementById('genre-filter')?.addEventListener('change', async (e) => {
        const genre = e.target.value;
        if (!genre) return;

        try {
            const { data } = await axios.get(`${API_BASE_URL}/movies?genre=${genre}`);
            renderMovies(data.data.movies);
        } catch (err) {
            console.error('Filter failed:', err);
        }
    });
};

/**
 * Checks if user is admin to show admin features
 */
const checkAdminStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const { data } = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        if (['admin', 'super-admin'].includes(data.data.user.role)) {
            document.getElementById('add-movie-btn')?.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Admin check failed:', err);
    }
};

// ======================
// Initialization
// ======================

/**
 * Initializes all movie-related functionality
 */
const initMoviesPage = () => {
    if (document.getElementById('movies-grid')) {
        loadMovies();
        initSearch();
        initGenreFilter();
        checkAdminStatus();
    }
    
    if (window.location.pathname.includes('details.html')) {
        loadMovieDetails();
    }
};

document.addEventListener('DOMContentLoaded', initMoviesPage);