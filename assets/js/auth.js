// Signup Handler
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            passwordConfirm: document.getElementById('passwordConfirm').value
        };

        try {
            const { data } = await axios.post('/api/v1/auth/signup', user);
            localStorage.setItem('token', data.token);
            
            Swal.fire({
                icon: 'success',
                title: 'Account Created!',
                text: 'Redirecting to your dashboard...'
            }).then(() => {
                window.location.href = '/pages/users/profile.html';
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Signup Failed',
                text: err.response?.data?.message || 'An error occurred'
            });
        }
    });
}