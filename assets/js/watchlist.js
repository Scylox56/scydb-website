
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('watchlist-container');
    const emptyState = document.getElementById('empty-watchlist');
    const refreshBtn = document.getElementById('refresh-watchlist');

    const loadWatchlist = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/pages/auth/login.html';
            return;
        }

        try {
            // 1. Get user data
            const { data: userData } = await axios.get(`${API_BASE_URL}/users/me`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            
            const watchlist = userData.data.user.watchLater;
            
            // 2. Handle empty watchlist
            if (!watchlist || watchlist.length === 0) {
                container.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }
            
            // 3. Fetch all movies in watchlist
            const movies = await Promise.all(
                watchlist.map(movieId => 
                    axios.get(`${API_BASE_URL}/movies/${movieId}`)
                        .then(res => res.data.data.movie)
                        .catch(err => {
                            console.error(`Error loading movie ${movieId}:`, err);
                            return null;
                        })
                )
            );
            
            // 4. Filter out nulls and render
            const validMovies = movies.filter(movie => movie !== null);
            
            if (validMovies.length === 0) {
                container.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }
            
            container.innerHTML = validMovies.map(movie => `
            <div class="movie-card group">
                <a href="/pages/movies/details.html?id=${movie._id}">
                    <div class="relative overflow-hidden rounded-t-lg">
                        <img src="${movie.poster || '/assets/images/default-poster.jpg'}" 
                            alt="${movie.title}" 
                            class="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-110">
                        <div class="gradient-overlay absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div class="p-6">
                        <h3 class="font-semibold text-xl line-clamp-1 mb-3">${movie.title}</h3>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm opacity-70">${movie.year}</span>
                            <div class="flex items-center space-x-1">
                                <i class="fas fa-star text-yellow-400 text-sm"></i>
                                <span class="text-sm font-medium">
                                    ${movie.averageRating?.toFixed(1) || 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div class="text-xs opacity-60 line-clamp-2">
                            ${movie.genres?.slice(0, 2).join(' • ') || 'Drama'}
                        </div>
                    </div>
                </a>
                <button class="remove-watchlist absolute top-4 right-4 w-9 h-9 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 flex items-center justify-center shadow-lg" 
                        data-movie-id="${movie._id}"
                        title="Remove from watchlist">
                    <i class="fas fa-times text-sm"></i>
                </button>
            </div>
        `).join('');
            
            // 5. Add event listeners to remove buttons
            document.querySelectorAll('.remove-watchlist').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    try {
                        await axios.delete(`${API_BASE_URL}/users/watchlist/${e.currentTarget.dataset.movieId}`, {
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            withCredentials: true
                        });
                        await loadWatchlist();
                    } catch (err) {
                        console.error('Remove error:', err);
                        Swal.fire({
                            icon: 'error',
                            title: 'Failed to remove',
                            text: err.response?.data?.message || 'Please try again'
                        });
                    }
                });
            });
            
            container.classList.remove('hidden');
            emptyState.classList.add('hidden');
            
        } catch (err) {
            console.error('Watchlist error:', err);
            
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/pages/auth/login.html';
                return;
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Failed to load watchlist',
                text: err.response?.data?.message || 'Network error. Please try again.'
            });
        }
    };

    // Initialize
    await loadWatchlist();
});