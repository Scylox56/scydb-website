// Global variables
let availableGenres = [];
let selectedGenres = new Set();
let isSubmitting = false;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadAvailableGenres();
    initializeEventListeners();
    checkAuth();
    
    const spinner = document.getElementById('loading-spinner');
    const btnText = document.getElementById('btn-text');
    const submitBtn = document.getElementById('submit-btn');
    
    if (spinner) spinner.classList.add('hidden');
    if (btnText) btnText.textContent = 'Create Movie';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
});

// Authentication check
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !['admin', 'super-admin'].includes(user.role)) {
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You need admin privileges to access this page.',
            showConfirmButton: false,
            timer: 2000
        }).then(() => {
            window.location.href = '/pages/auth/login.html';
        });
        return;
    }
    
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = user.name || 'Admin';
    }
}

// Load available genres from API
async function loadAvailableGenres() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/genres/active`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        availableGenres = response.data.data.genres || [];
    } catch (error) {
        console.error('Error loading genres:', error);
        availableGenres = [
            { name: 'Action' }, { name: 'Adventure' }, { name: 'Comedy' }, 
            { name: 'Drama' }, { name: 'Horror' }, { name: 'Thriller' },
            { name: 'Romance' }, { name: 'Sci-Fi' }, { name: 'Fantasy' }
        ];
    }
}

// Initialize event listeners
function initializeEventListeners() {
    const form = document.getElementById('create-movie-form');
    const genreSearch = document.getElementById('genre-search');
    const movieCast = document.getElementById('movie-cast');
    const movieDescription = document.getElementById('movie-description');
    const moviePoster = document.getElementById('movie-poster');
    const movieBackdrop = document.getElementById('movie-backdrop');

    // Form submission
    if (form) form.addEventListener('submit', handleSubmit);

    // Genre search
    if (genreSearch) {
        genreSearch.addEventListener('input', handleGenreSearch);
        genreSearch.addEventListener('focus', showGenreDropdown);
    }
    document.addEventListener('click', hideGenreDropdown);

    // Cast preview
    if (movieCast) movieCast.addEventListener('input', updateCastPreview);

    // Description counter
    if (movieDescription) movieDescription.addEventListener('input', updateDescriptionCounter);

    // Image previews
    if (moviePoster) moviePoster.addEventListener('input', updatePosterPreview);
    if (movieBackdrop) movieBackdrop.addEventListener('input', updateBackdropPreview);

    // Add fade-in animation to form sections
    const sections = document.querySelectorAll('.form-section');
    sections.forEach((section, index) => {
        setTimeout(() => section.classList.add('fade-in'), index * 100);
    });
    setSubmitting(false);
}

// Genre search functionality
function handleGenreSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const dropdown = document.getElementById('genre-dropdown');
    
    if (searchTerm.length === 0) {
        dropdown.innerHTML = '';
        dropdown.classList.add('hidden');
        return;
    }

    const filteredGenres = availableGenres.filter(genre => 
        genre.name.toLowerCase().includes(searchTerm) && 
        !selectedGenres.has(genre.name)
    );

    if (filteredGenres.length === 0) {
        dropdown.innerHTML = '<div class="genre-option opacity-60">No genres found</div>';
    } else {
        dropdown.innerHTML = filteredGenres.map(genre => 
            `<div class="genre-option" data-genre="${genre.name}">${genre.name}</div>`
        ).join('');
    }

    dropdown.classList.remove('hidden');

    // Add click listeners to genre options
    dropdown.querySelectorAll('.genre-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const genreName = e.target.dataset.genre;
            if (genreName) {
                addGenre(genreName);
            }
        });
    });
}

function showGenreDropdown() {
    const dropdown = document.getElementById('genre-dropdown');
    const searchInput = document.getElementById('genre-search');
    
    if (searchInput.value.length === 0) {
        const unselectedGenres = availableGenres.filter(genre => !selectedGenres.has(genre.name));
        dropdown.innerHTML = unselectedGenres.map(genre => 
            `<div class="genre-option" data-genre="${genre.name}">${genre.name}</div>`
        ).join('');
        
        dropdown.querySelectorAll('.genre-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const genreName = e.target.dataset.genre;
                if (genreName) {
                    addGenre(genreName);
                }
            });
        });
    }
    dropdown.classList.remove('hidden');
}

function hideGenreDropdown(e) {
    const dropdown = document.getElementById('genre-dropdown');
    const genreSearch = document.getElementById('genre-search');
    
    if (genreSearch && dropdown && !genreSearch.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
}

// Add genre to selection
function addGenre(genreName) {
    if (!selectedGenres.has(genreName)) {
        selectedGenres.add(genreName);
        updateSelectedGenres();
        const genreSearch = document.getElementById('genre-search');
        const dropdown = document.getElementById('genre-dropdown');
        if (genreSearch) genreSearch.value = '';
        if (dropdown) dropdown.classList.add('hidden');
    }
}

// Remove genre from selection
function removeGenre(genreName) {
    selectedGenres.delete(genreName);
    updateSelectedGenres();
}

// Update selected genres display
function updateSelectedGenres() {
    const container = document.getElementById('selected-genres');
    if (container) {
        container.innerHTML = Array.from(selectedGenres).map(genre => `
            <div class="genre-tag">
                <span>${genre}</span>
                <button type="button" class="hover:text-red-200 transition-colors" onclick="removeGenre('${genre}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
}

// Update cast preview
function updateCastPreview() {
    const castInput = document.getElementById('movie-cast');
    const castPreview = document.getElementById('cast-preview');
    const castTags = document.getElementById('cast-tags');
    
    if (!castInput || !castPreview || !castTags) return;
    
    const castMembers = castInput.value.split(',').map(member => member.trim()).filter(member => member);
    
    if (castMembers.length > 0) {
        castTags.innerHTML = castMembers.map(member => 
            `<div class="cast-tag">${member}</div>`
        ).join('');
        castPreview.classList.remove('hidden');
    } else {
        castPreview.classList.add('hidden');
    }
}

// Update description counter
function updateDescriptionCounter() {
    const description = document.getElementById('movie-description');
    const counter = document.getElementById('desc-counter');
    if (description && counter) {
        counter.textContent = `${description.value.length} characters`;
    }
}

// Update poster preview
function updatePosterPreview() {
    const posterInput = document.getElementById('movie-poster');
    const preview = document.getElementById('poster-preview');
    const img = document.getElementById('poster-img');
    
    if (!posterInput || !preview || !img) return;
    
    if (posterInput.value && isValidImageUrl(posterInput.value)) {
        img.src = posterInput.value;
        img.onload = () => preview.classList.remove('hidden');
        img.onerror = () => preview.classList.add('hidden');
    } else {
        preview.classList.add('hidden');
    }
}

// Update backdrop preview
function updateBackdropPreview() {
    const backdropInput = document.getElementById('movie-backdrop');
    const preview = document.getElementById('backdrop-preview');
    const img = document.getElementById('backdrop-img');
    
    if (!backdropInput || !preview || !img) return;
    
    if (backdropInput.value && isValidImageUrl(backdropInput.value)) {
        img.src = backdropInput.value;
        img.onload = () => preview.classList.remove('hidden');
        img.onerror = () => preview.classList.add('hidden');
    } else {
        preview.classList.add('hidden');
    }
}

// Validate image URL
function isValidImageUrl(url) {
    try {
        new URL(url);
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('imgur.com') || url.includes('tmdb.org');
    } catch {
        return false;
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validation
    if (selectedGenres.size === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Missing Genres',
            text: 'Please select at least one genre for the movie.'
        });
        return;
    }

    const castInput = document.getElementById('movie-cast');
    if (!castInput || !castInput.value.trim()) {
        Swal.fire({
            icon: 'warning',
            title: 'Missing Cast',
            text: 'Please enter at least one cast member.'
        });
        return;
    }

    setSubmitting(true);

    const movieData = {
        title: document.getElementById('movie-title').value.trim(),
        year: parseInt(document.getElementById('movie-year').value),
        duration: parseInt(document.getElementById('movie-duration').value),
        director: document.getElementById('movie-director').value.trim(),
        genre: Array.from(selectedGenres),
        cast: castInput.value.split(',').map(member => member.trim()).filter(member => member),
        description: document.getElementById('movie-description').value.trim(),
        poster: document.getElementById('movie-poster').value.trim(),
        backdrop: document.getElementById('movie-backdrop').value.trim(),
        trailer: document.getElementById('movie-trailer').value.trim()
    };

    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/movies`, movieData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        await Swal.fire({
            icon: 'success',
            title: 'Movie Created Successfully!',
            html: `
                <div class="text-center">
                    <p class="mb-4">"${movieData.title}" has been added to the database.</p>
                    <img src="${movieData.poster}" alt="${movieData.title}" class="w-32 h-48 object-cover rounded-lg mx-auto mb-4" onerror="this.style.display='none'">
                </div>
            `,
            confirmButtonColor: '#F76F53',
            confirmButtonText: 'View Movie'
        });

        // Redirect to movie details or dashboard
        const movieId = response.data.data.movie._id;
        window.location.href = `/pages/movies/details.html?id=${movieId}`;
        
    } catch (error) {
        console.error('Error creating movie:', error);
        Swal.fire({
            icon: 'error',
            title: 'Failed to Create Movie',
            text: error.response?.data?.message || 'Please check your inputs and try again.',
            confirmButtonColor: '#F76F53'
        });
    } finally {
        setSubmitting(false);
    }
}


// Set submitting state
function setSubmitting(submitting) {
    isSubmitting = submitting;
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('loading-spinner');

    if (submitBtn && btnText && spinner) {
        if (submitting) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
            btnText.textContent = 'Creating Movie...';
            spinner.classList.remove('hidden');
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            btnText.textContent = 'Create Movie';
            spinner.classList.add('hidden');
        }
    }
}

// Make functions globally available
window.removeGenre = removeGenre;