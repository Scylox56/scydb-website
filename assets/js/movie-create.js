document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api/v1';
    const form = document.getElementById('create-movie-form');
    const genreInput = document.getElementById('genre-input');
    const addGenreBtn = document.getElementById('add-genre-btn');
    const genreTags = document.getElementById('genre-tags');
    const genres = new Set();

    // Genre management
    addGenreBtn.addEventListener('click', () => {
        const genre = genreInput.value.trim();
        if (genre && !genres.has(genre)) {
            genres.add(genre);
            renderGenreTags();
            genreInput.value = '';
        }
    });

    function renderGenreTags() {
        genreTags.innerHTML = Array.from(genres).map(genre => `
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                ${genre}
                <button type="button" class="ml-2 text-primary/70 hover:text-primary" data-genre="${genre}">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');

        // Add event listeners to remove buttons
        document.querySelectorAll('[data-genre]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                genres.delete(e.currentTarget.dataset.genre);
                renderGenreTags();
            });
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const token = localStorage.getItem('token');
        if (!token) return window.location.href = '/pages/auth/login.html';

        const movieData = {
            title: document.getElementById('movie-title').value,
            year: parseInt(document.getElementById('movie-year').value),
            duration: parseInt(document.getElementById('movie-duration').value),
            director: document.getElementById('movie-director').value,
            genre: Array.from(genres),
            cast: document.getElementById('movie-cast').value.split(',').map(s => s.trim()),
            description: document.getElementById('movie-description').value,
            poster: document.getElementById('movie-poster').value,
            backdrop: document.getElementById('movie-backdrop').value,
            trailer: document.getElementById('movie-trailer').value
        };

        try {
            const { data } = await axios.post(`${API_BASE_URL}/movies`, movieData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                icon: 'success',
                title: 'Movie Created!',
                text: `${data.data.movie.title} has been added successfully`
            }).then(() => {
                window.location.href = `/pages/movies/details.html?id=${data.data.movie._id}`;
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Failed to create movie',
                text: err.response?.data?.message || 'Please check your inputs'
            });
        }
    });
});