const API_BASE_URL = 'http://localhost:3000/api/v1';

// ======================
// UI Management Functions
// ======================

function setupUserDropdown() {
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', () => {
            userDropdown.classList.add('hidden');
        });
    }
}

function updateAuthUI() {
    const authLinks = document.getElementById('auth-links');
    const userMenu = document.getElementById('user-menu');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('UpdateAuthUI called. Token:', token ? 'exists' : 'not found', 'User:', user);

    if (token && user?._id) {
        if (authLinks) authLinks.classList.add('hidden');
        if (userMenu) {
            userMenu.classList.remove('hidden');
            if (userAvatar && user.photo) userAvatar.src = user.photo || '/assets/images/default-avatar.jpg';
            if (userName && user.name) userName.textContent = user.name;
        }
    } else {
        if (authLinks) authLinks.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
    }
}

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

function saveSession(data) {
    if (data.token) {
        localStorage.setItem('token', data.token);
    }
    if (data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    updateAuthUI();
    window.location.href = '/'; // Redirect to home page after login
}

// ======================
// Authentication Handlers
// ======================

async function handleLogin(email, password) {
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

        return data.data.user;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Signup handler
async function handleSignup(name, email, password, passwordConfirm) {
    try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/signup`, {
            name,
            email,
            password,
            passwordConfirm
        }, {
            withCredentials: true
        });

        saveSession(data);

        await Swal.fire({
            icon: 'success',
            title: 'Signup Successful!',
            showConfirmButton: false,
            timer: 1500
        });

        return data.data.user;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

async function handleLogout() {
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
}

// ======================
// Initialization
// ======================

function initializeAuth() {
    setupUserDropdown();
    updateAuthUI();
    checkProtectedRoutes();

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            try {
                if (submitBtn) submitBtn.disabled = true;
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                if (!email || !password) {
                    throw new Error('Please enter both email and password');
                }

                const user = await handleLogin(email, password);
                
                // Redirect based on role
                const redirectPath = ['admin', 'super-admin'].includes(user.role)
                    ? '/pages/users/dashboard.html'
                    : '/pages/index.html';
                
                window.location.href = redirectPath;
                
            } catch (error) {
                Swal.fire(
                    'Login Failed',
                    error.response?.data?.message || error.message || 'Invalid credentials',
                    'error'
                );
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Signup Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            try {
                if (submitBtn) submitBtn.disabled = true;

                const name = signupForm.querySelector('input[name="name"]').value;
                const email = signupForm.querySelector('input[name="email"]').value;
                const password = signupForm.querySelector('input[name="password"]').value;
                const passwordConfirm = signupForm.querySelector('input[name="passwordConfirm"]').value;

                if (!name || !email || !password || !passwordConfirm) {
                    throw new Error('Please fill all fields');
                }

                const user = await handleSignup(name, email, password, passwordConfirm);

                // Redirect after signup
                window.location.href = '/pages/movies/index.html';

            } catch (error) {
                Swal.fire(
                    'Signup Failed',
                    error.response?.data?.message || error.message || 'Invalid signup details',
                    'error'
                );
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await handleLogout();
            window.location.href = '/pages/auth/login.html';
        });
    }
}

// Start everything when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAuth);