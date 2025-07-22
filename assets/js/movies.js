// Movie Details Loader
const loadMovieDetails = async () => {
    const movieId = new URLSearchParams(window.location.search).get('id');
    if (!movieId) return window.location.href = '/pages/movies/';

    try {
        const { data } = await axios.get(`/api/v1/movies/${movieId}`);
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

// Toggle Watchlist
const toggleWatchlist = async () => {
    const movieId = new URLSearchParams(window.location.search).get('id');
    const btn = document.getElementById('watchlist-btn');
    
    try {
        const token = localStorage.getItem('token');
        if (!token) return window.location.href = '/pages/auth/login.html';

        const { data } = await axios.post(`/api/v1/users/watchlist/${movieId}`, {}, {
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

// Initialize
if (window.location.pathname.includes('details.html')) {
    loadMovieDetails();
}