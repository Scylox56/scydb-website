document.addEventListener('DOMContentLoaded', async () => {
    const movieId = new URLSearchParams(window.location.search).get('id');
    if (!movieId) return window.location.href = '/pages/movies/';

    const token = localStorage.getItem('token');
    if (!token) return window.location.href = '/pages/auth/login.html';

    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!['admin', 'super-admin'].includes(user.role)) {
        return window.location.href = '/pages/movies/';
    }

    let selectedGenres = [];

    try {
        // Load movie data
        const API_BASE_URL = 'http://localhost:3000/api/v1';
        const { data } = await axios.get(`${API_BASE_URL}/movies/${movieId}`);
        const movie = data.data.movie;

        // Create form fields HTML
        const formFieldsHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium mb-1 dark:text-gray-300">Title*</label>
                    <input type="text" id="movie-title" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${movie.title}">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1 dark:text-gray-300">Release Year*</label>
                    <input type="number" id="movie-year" min="1900" max="2030" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${movie.year}">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1 dark:text-gray-300">Duration (minutes)*</label>
                    <input type="number" id="movie-duration" min="1" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${movie.duration}">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1 dark:text-gray-300">Director*</label>
                    <input type="text" id="movie-director" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${movie.director}">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-1 dark:text-gray-300">Genres*</label>
                <div class="flex flex-wrap gap-2 mb-2" id="genre-tags"></div>
                <div class="flex">
                    <input type="text" id="genre-input" placeholder="Add genre" class="flex-1 px-3 py-2 border rounded-l-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <button type="button" id="add-genre-btn" class="px-4 py-2 bg-primary text-white rounded-r-lg hover:bg-primary/90">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-1 dark:text-gray-300">Cast (comma separated)*</label>
                <textarea id="movie-cast" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows="3">${movie.cast.join(', ')}</textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-1 dark:text-gray-300">Description*</label>
                <textarea id="movie-description" rows="4" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">${movie.description}</textarea>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium mb-1 dark:text-gray-300">Poster URL*</label>
                    <input type="url" id="movie-poster" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${movie.poster}">
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1 dark:text-gray-300">Backdrop URL*</label>
                    <input type="url" id="movie-backdrop" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${movie.backdrop}">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-1 dark:text-gray-300">Trailer URL*</label>
                <input type="url" id="movie-trailer" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" value="${movie.trailer}">
            </div>
            
            <button type="submit" class="btn btn-primary w-full py-3">
                <i class="fas fa-save mr-2"></i> Save Changes
            </button>
            
            <button type="button" id="delete-movie-btn" class="btn !bg-red-500 !border-red-500 hover:!bg-red-600 text-white w-full py-3">
                <i class="fas fa-trash mr-2"></i> Delete Movie
            </button>
        `;

        // Insert form fields
        document.getElementById('movie-form-fields').innerHTML = formFieldsHTML;
        
        // Initialize genres
        selectedGenres = [...movie.genre];
        updateGenreTags();

        // Show form
        document.getElementById('loading-spinner').classList.add('hidden');
        document.getElementById('movie-form-fields').classList.remove('hidden');

        // Setup genre functionality
        setupGenreFunctionality();

        // Form submission
        document.getElementById('edit-movie-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (selectedGenres.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Validation Error',
                    text: 'Please add at least one genre'
                });
                return;
            }
            
            const updatedData = {
                title: document.getElementById('movie-title').value,
                year: parseInt(document.getElementById('movie-year').value),
                duration: parseInt(document.getElementById('movie-duration').value),
                director: document.getElementById('movie-director').value,
                cast: document.getElementById('movie-cast').value.split(',').map(s => s.trim()).filter(s => s),
                genre: selectedGenres,
                description: document.getElementById('movie-description').value,
                poster: document.getElementById('movie-poster').value,
                backdrop: document.getElementById('movie-backdrop').value,
                trailer: document.getElementById('movie-trailer').value
            };

            try {
                await axios.patch(`${API_BASE_URL}/movies/${movieId}`, updatedData, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Movie Updated!',
                    text: `${updatedData.title} has been updated`
                }).then(() => {
                    window.location.href = `/pages/movies/details.html?id=${movieId}`;
                });
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: err.response?.data?.message || 'Please check your inputs'
                });
            }
        });

        // Delete button
        document.getElementById('delete-movie-btn').addEventListener('click', async () => {
            Swal.fire({
                title: 'Delete Movie?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await axios.delete(`${API_BASE_URL}/movies/${movieId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        Swal.fire(
                            'Deleted!',
                            'The movie has been deleted.',
                            'success'
                        ).then(() => {
                            window.location.href = '/pages/movies/';
                        });
                    } catch (err) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Delete Failed',
                            text: err.response?.data?.message || 'You may not have permission'
                        });
                    }
                }
            });
        });

    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Failed to load movie',
            text: err.response?.data?.message || 'Movie not found'
        }).then(() => {
            window.location.href = '/pages/movies/';
        });
    }

    // Genre management functions
    function setupGenreFunctionality() {
        const addGenreBtn = document.getElementById('add-genre-btn');
        const genreInput = document.getElementById('genre-input');

        addGenreBtn.addEventListener('click', addGenre);
        genreInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addGenre();
            }
        });
    }

    function addGenre() {
        const genreInput = document.getElementById('genre-input');
        const genre = genreInput.value.trim();
        
        if (genre && !selectedGenres.includes(genre)) {
            selectedGenres.push(genre);
            updateGenreTags();
            genreInput.value = '';
        }
    }

    function removeGenre(genre) {
        selectedGenres = selectedGenres.filter(g => g !== genre);
        updateGenreTags();
    }

    function updateGenreTags() {
        const container = document.getElementById('genre-tags');
        container.innerHTML = selectedGenres.map(genre => `
            <span class="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                ${genre}
                <button type="button" class="ml-2 text-primary/70 hover:text-primary" onclick="removeGenre('${genre}')">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </span>
        `).join('');
    }

    window.removeGenre = removeGenre;
});