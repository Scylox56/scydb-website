const API_BASE_URL = 'http://localhost:3000/api/v1';

// Initialize user dropdown menu functionality
function setupUserDropdown() {
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userMenuButton && userDropdown) {
        // Toggle dropdown on button click
        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            userDropdown.classList.add('hidden');
        });
    }
}

// Update UI based on authentication state
function updateAuthUI() {
    const authLinks = document.getElementById('auth-links');
    const userMenu = document.getElementById('user-menu');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token && user?._id) {
        // User is logged in
        if (authLinks) authLinks.classList.add('hidden');
        if (userMenu) {
            userMenu.classList.remove('hidden');
            if (user.photo) userAvatar.src = user.photo;
            if (user.name) userName.textContent = user.name;
        }
    } else {
        // User is logged out
        if (authLinks) authLinks.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
    }
}

// Redirect if trying to access protected routes without auth
function checkProtectedRoutes() {
    const protectedPaths = ['/profile', '/dashboard', '/watchlist'];
    const currentPath = window.location.pathname;
    
    if (protectedPaths.some(path => currentPath.includes(path))) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/pages/auth/login.html';
        }
    }
}

// Save user session data
function saveSession(data) {
    if (data.token) {
        localStorage.setItem('token', data.token);
    }
    if (data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    updateAuthUI();
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up UI components
    setupUserDropdown();
    updateAuthUI();
    checkProtectedRoutes();

    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;

            if (!email || !password) {
                Swal.fire('Missing Credentials', 'Please enter both email and password.', 'warning');
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            try {
                const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
                    email,
                    password
                }, {
                    withCredentials: true
                });

                saveSession(data);
                await Swal.fire({
                    icon: 'success',
                    title: 'Login Successful!',
                    showConfirmButton: false,
                    timer: 1500
                });

                window.location.href = ['admin', 'super-admin'].includes(data.data.user.role)
                    ? '/pages/users/dashboard.html'
                    : '/pages/movies/index.html';
            } catch (error) {
                Swal.fire(
                    'Login Failed',
                    error.response?.data?.message || 'Invalid email or password',
                    'error'
                );
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                await axios.get(`${API_BASE_URL}/auth/logout`, {
                    withCredentials: true
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            updateAuthUI();
            window.location.href = '/pages/auth/login.html';
        });
    }

    // Signup form handler
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const userData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                passwordConfirm: document.getElementById('passwordConfirm').value
            };

            try {
                const { data } = await axios.post(`${API_BASE_URL}/auth/signup`, userData, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                saveSession(data);
                await Swal.fire({
                    icon: 'success',
                    title: 'Account Created!',
                    showConfirmButton: false,
                    timer: 1500
                });
                window.location.href = '/pages/users/profile.html';
            } catch (error) {
                Swal.fire(
                    'Signup Failed',
                    error.response?.data?.message || 'Could not create account',
                    'error'
                );
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
});