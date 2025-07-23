document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = '/pages/auth/login.html';

    // Load user data
    const loadUserProfile = async () => {
        try {
            const { data } = await axios.get('/api/v1/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const user = data.data.user;

            // Populate profile
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-email').textContent = user.email;
            document.getElementById('profile-name').value = user.name;
            document.getElementById('profile-email').value = user.email;
            document.getElementById('profile-avatar').value = user.photo || '';
            
            if (user.photo) {
                document.getElementById('user-avatar').src = user.photo;
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Failed to load profile',
                text: err.response?.data?.message || 'Please login again'
            }).then(() => {
                window.location.href = '/pages/auth/login.html';
            });
        }
    };

    // Profile form submission
    document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const { data } = await axios.patch('/api/v1/users/updateMe', {
                name: document.getElementById('profile-name').value,
                email: document.getElementById('profile-email').value,
                photo: document.getElementById('profile-avatar').value
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                icon: 'success',
                title: 'Profile Updated!',
                text: 'Your changes have been saved'
            }).then(() => window.location.reload());
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: err.response?.data?.message || 'Please check your inputs'
            });
        }
    });

    // Password form submission
    document.getElementById('password-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const newPasswordConfirm = document.getElementById('new-password-confirm').value;

        if (newPassword !== newPasswordConfirm) {
            return Swal.fire({
                icon: 'error',
                title: 'Passwords Mismatch',
                text: 'New passwords do not match'
            });
        }

        try {
            await axios.patch('/api/v1/users/updateMyPassword', {
                currentPassword,
                newPassword,
                newPasswordConfirm
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                icon: 'success',
                title: 'Password Changed!',
                text: 'Please login with your new password'
            }).then(() => {
                localStorage.removeItem('token');
                window.location.href = '/pages/auth/login.html';
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Change Failed',
                text: err.response?.data?.message || 'Current password is incorrect'
            });
        }
    });

    // Initialize
    loadUserProfile();
});