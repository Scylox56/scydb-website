document.addEventListener('DOMContentLoaded', async () => {
    const movieId = new URLSearchParams(window.location.search).get('id');
    if (!movieId) return window.location.href = '/pages/movies/';

    const token = localStorage.getItem('token');
    if (!token) return window.location.href = '/pages/auth/login.html';

    try {
        // Load movie data
        const API_BASE_URL = 'http://localhost:3000/api/v1';
        const { data } = await axios.get(`${API_BASE_URL}/movies/${movieId}`);
        const movie = data.data.movie;

        // Populate form (using same fields as create.js)
        document.getElementById('movie-title').value = movie.title;
        document.getElementById('movie-year').value = movie.year;
        document.getElementById('movie-duration').value = movie.duration;
        document.getElementById('movie-director').value = movie.director;
        document.getElementById('movie-cast').value = movie.cast.join(', ');
        document.getElementById('movie-description').value = movie.description;
        document.getElementById('movie-poster').value = movie.poster;
        document.getElementById('movie-backdrop').value = movie.backdrop;
        document.getElementById('movie-trailer').value = movie.trailer;

        // Show form
        document.getElementById('loading-spinner').classList.add('hidden');
        document.getElementById('movie-form-fields').classList.remove('hidden');

        // Form submission
        document.getElementById('edit-movie-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedData = {
                title: document.getElementById('movie-title').value,
                year: document.getElementById('movie-year').value,
                duration: document.getElementById('movie-duration').value,
                director: document.getElementById('movie-director').value,
                cast: document.getElementById('movie-cast').value.split(',').map(s => s.trim()),
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
});