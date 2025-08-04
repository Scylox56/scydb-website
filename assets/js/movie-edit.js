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

    // Add edit page class for CSS targeting
    document.body.classList.add('edit-page');

    let selectedGenres = [];
    let availableGenres = [];

    const API_BASE_URL = 'https://scydb-api-production.up.railway.app/api/v1';

    try {
        // Load available genres and movie data simultaneously
        const [genresResponse, movieResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/genres/active`),
            axios.get(`${API_BASE_URL}/movies/${movieId}`)
        ]);

        availableGenres = genresResponse.data.data.genres;
        const movie = movieResponse.data.data.movie;

        // Initialize selected genres
        selectedGenres = [...movie.genre];

        // Populate form fields
        populateFormFields(movie);

        // Initialize genre functionality
        initializeGenreSystem();

        // Initialize other form functionality
        initializeFormHandlers();

        // Show form
        document.getElementById('loading-spinner').classList.add('hidden');
        document.getElementById('movie-form-fields').classList.remove('hidden');

    } catch (err) {
        console.error('Load error:', err);
        Swal.fire({
            icon: 'error',
            title: 'Failed to load movie',
            text: err.response?.data?.message || 'Movie not found'
        }).then(() => {
            window.location.href = '/pages/movies/';
        });
    }

    function populateFormFields(movie) {
        document.getElementById('movie-title').value = movie.title;
        document.getElementById('movie-year').value = movie.year;
        document.getElementById('movie-duration').value = movie.duration;
        document.getElementById('movie-director').value = movie.director;
        document.getElementById('movie-cast').value = movie.cast.join(', ');
        document.getElementById('movie-description').value = movie.description;
        document.getElementById('movie-poster').value = movie.poster;
        document.getElementById('movie-backdrop').value = movie.backdrop;
        document.getElementById('movie-trailer').value = movie.trailer;

        // Update genre display
        updateSelectedGenresDisplay();

        // Update character counter
        updateDescriptionCounter();

        // Show image previews
        showImagePreview('poster');
        showImagePreview('backdrop');
    }

    function initializeGenreSystem() {
        const genreSearchInput = document.getElementById('genre-search-input');
        const genreDropdown = document.getElementById('genre-dropdown');

        // Populate dropdown with all genres initially
        updateGenreDropdown();

        // Handle search input
        genreSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            updateGenreDropdown(searchTerm);
        });

        // Handle focus to show dropdown
        genreSearchInput.addEventListener('focus', () => {
            genreDropdown.classList.remove('hidden');
            updateGenreDropdown(genreSearchInput.value.toLowerCase());
        });

        // Handle click outside to hide dropdown
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#genre-search')) {
                genreDropdown.classList.add('hidden');
            }
        });
    }

    function updateGenreDropdown(searchTerm = '') {
        const genreDropdown = document.getElementById('genre-dropdown');
        
        const filteredGenres = availableGenres.filter(genre => {
            const matchesSearch = genre.name.toLowerCase().includes(searchTerm);
            const notSelected = !selectedGenres.includes(genre.name);
            return matchesSearch && notSelected;
        });

        genreDropdown.innerHTML = filteredGenres.map(genre => `
            <button type="button" class="genre-option" data-genre="${genre.name}">
                ${genre.name}
                ${genre.description ? `<span class="text-sm opacity-60 block">${genre.description}</span>` : ''}
            </button>
        `).join('');

        // Add click handlers to genre options
        genreDropdown.querySelectorAll('.genre-option').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const genreName = button.dataset.genre;
                addGenre(genreName);
                document.getElementById('genre-search-input').value = '';
                genreDropdown.classList.add('hidden');
            });
        });
    }

    function addGenre(genreName) {
        if (!selectedGenres.includes(genreName)) {
            selectedGenres.push(genreName);
            updateSelectedGenresDisplay();
            updateGenreDropdown();
        }
    }

    function removeGenre(genreName) {
        selectedGenres = selectedGenres.filter(g => g !== genreName);
        updateSelectedGenresDisplay();
        updateGenreDropdown();
    }

    function updateSelectedGenresDisplay() {
        const container = document.getElementById('selected-genres');
        container.innerHTML = selectedGenres.map(genre => `
            <span class="genre-tag">
                ${genre}
                <button type="button" class="ml-2 opacity-70 hover:opacity-100" onclick="removeGenre('${genre}')">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </span>
        `).join('');
    }

    function initializeFormHandlers() {
        // Description character counter
        const descInput = document.getElementById('movie-description');
        descInput.addEventListener('input', updateDescriptionCounter);

        // Image preview handlers
        document.getElementById('movie-poster').addEventListener('input', () => showImagePreview('poster'));
        document.getElementById('movie-backdrop').addEventListener('input', () => showImagePreview('backdrop'));

        // Cast preview handler
        document.getElementById('movie-cast').addEventListener('input', updateCastPreview);

        // Form submission
        document.getElementById('edit-movie-form').addEventListener('submit', handleFormSubmit);

        // Delete button
        document.getElementById('delete-movie-btn').addEventListener('click', handleDeleteMovie);
    }

    function updateDescriptionCounter() {
        const descInput = document.getElementById('movie-description');
        const counter = document.getElementById('desc-counter');
        counter.textContent = `${descInput.value.length} characters`;
    }

    function showImagePreview(type) {
        const input = document.getElementById(`movie-${type}`);
        const preview = document.getElementById(`${type}-preview`);
        const img = document.getElementById(`${type}-img`);

        if (input.value && isValidUrl(input.value)) {
            img.src = input.value;
            img.onload = () => preview.classList.remove('hidden');
            img.onerror = () => preview.classList.add('hidden');
        } else {
            preview.classList.add('hidden');
        }
    }

    function updateCastPreview() {
        const castInput = document.getElementById('movie-cast');
        const preview = document.getElementById('cast-preview');
        const tagsContainer = document.getElementById('cast-tags');

        const castMembers = castInput.value.split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (castMembers.length > 0) {
            tagsContainer.innerHTML = castMembers.map(member => `
                <span class="cast-tag">${member}</span>
            `).join('');
            preview.classList.remove('hidden');
        } else {
            preview.classList.add('hidden');
        }
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        if (selectedGenres.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please add at least one genre'
            });
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        const btnText = document.getElementById('btn-text');
        const loadingSpinner = document.getElementById('submit-loading-spinner');

        // Show loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Saving...';
        loadingSpinner.classList.remove('hidden');
        
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
                text: `${updatedData.title} has been updated successfully`,
                showConfirmButton: false,
                timer: 2000
            }).then(() => {
                window.location.href = `/pages/movies/details.html?id=${movieId}`;
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: err.response?.data?.message || 'Please check your inputs'
            });
        } finally {
            // Reset loading state
            submitBtn.disabled = false;
            btnText.textContent = 'Save Changes';
            loadingSpinner.classList.add('hidden');
        }
    }

    async function handleDeleteMovie() {
        const result = await Swal.fire({
            title: 'Delete Movie?',
            text: "You won't be able to revert this action!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_BASE_URL}/movies/${movieId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'The movie has been deleted.',
                    showConfirmButton: false,
                    timer: 2000
                }).then(() => {
                    window.location.href = '/pages/movies/';
                });
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: err.response?.data?.message || 'You may not have permission to delete this movie'
                });
            }
        }
    }

    // Make removeGenre globally accessible
    window.removeGenre = removeGenre;
});