const API_BASE_URL = 'http://localhost:3000/api/v1';

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
                <div class="movie-card relative">
                    <a href="/pages/movies/details.html?id=${movie._id}">
                        <img src="${movie.poster || '/assets/images/default-poster.jpg'}" 
                             alt="${movie.title}" 
                             class="w-full h-64 object-cover rounded-lg">
                        <div class="p-4">
                            <h3 class="font-semibold text-lg dark:text-white truncate">${movie.title}</h3>
                            <div class="flex justify-between items-center mt-2">
                                <span class="text-gray-600 dark:text-gray-300">${movie.year}</span>
                                <span class="text-yellow-400 font-medium">
                                    ${movie.averageRating?.toFixed(1) || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </a>
                    <button class="remove-watchlist absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 hover:opacity-100 transition-opacity" 
                            data-movie-id="${movie._id}">
                        <i class="fas fa-times"></i>
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
    refreshBtn?.addEventListener('click', loadWatchlist);
    await loadWatchlist();
});