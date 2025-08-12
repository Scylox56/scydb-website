const API_BASE_URL = 'https://scydb-api-production.up.railway.app/api/v1';

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

        document.addEventListener('click', (e) => {
            if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }
}

function updateAuthUI() {
    const authLinks = document.getElementById('auth-links');
    const userMenu = document.getElementById('user-menu');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const addMovieBtn = document.getElementById('add-movie-btn');
    const adminDashboardLink = document.getElementById('user-dashboard-link');
    const mobileAdminDashboardLink = document.getElementById('mobile-user-dashboard-link');
    const mobileAuthLinks = document.getElementById('mobile-auth-links');
    const mobileUserMenu = document.getElementById('mobile-user-menu');

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    console.log('UpdateAuthUI called. Token:', token ? 'exists' : 'not found', 'User:', user);

    const isLoggedIn = token && user?._id;
    const isAdmin = ['admin', 'super-admin'].includes(user?.role);

    // Desktop Auth UI
    if (authLinks) {
        authLinks.style.display = isLoggedIn ? 'none' : 'flex';
        authLinks.classList.toggle('hidden', isLoggedIn);
    }

    if (userMenu) {
        userMenu.style.display = isLoggedIn ? 'flex' : 'none';
        userMenu.classList.toggle('hidden', !isLoggedIn);
    }

    // Mobile Auth UI
    if (mobileAuthLinks) {
        mobileAuthLinks.classList.toggle('hidden', isLoggedIn);
    }

    if (mobileUserMenu) {
        mobileUserMenu.classList.toggle('hidden', !isLoggedIn);
    }

    // Set avatar and username
    if (isLoggedIn) {
        if (userAvatar && user.photo) {
            userAvatar.src = user.photo || '/assets/images/default-avatar.jpg';
        }
        if (userName && user.name) {
            userName.textContent = user.name;
        }
    }

    // Show/hide Add Movie button
    if (addMovieBtn) {
        addMovieBtn.classList.toggle('hidden', !isAdmin);
    }

    // Show/hide Admin Dashboard links (both desktop and mobile)
    [adminDashboardLink, mobileAdminDashboardLink].forEach(link => {
        if (link) {
            if (isAdmin) {
                link.classList.remove('hidden');
                link.style.display = 'block';
            } else {
                link.classList.add('hidden');
                link.style.display = 'none';
            }
        }
    });
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
    window.location.href = '/pages/index.html'; // Redirect to home page after login
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

        // Store email for verification page
        localStorage.setItem('pendingVerificationEmail', email);

        await Swal.fire({
            icon: 'success',
            title: 'Account Created!',
            text: 'Please check your email to verify your account.',
            showConfirmButton: false,
            timer: 2000
        });

        // Redirect to verification page instead of logging in
        window.location.href = `/pages/auth/verify-email.html?email=${encodeURIComponent(email)}`;

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

async function handleEmailVerification(token) {
    try {
        const { data } = await axios.get(`${API_BASE_URL}/auth/verify-email/${token}`, {
            withCredentials: true
        });

        saveSession(data);
        
        await Swal.fire({
            icon: 'success',
            title: 'Email Verified!',
            text: 'Welcome to ScyDB!',
            showConfirmButton: false,
            timer: 2000
        });

        // Redirect to success page
        window.location.href = '/pages/auth/email-verified.html';

        return data.data.user;
    } catch (error) {
        console.error('Email verification error:', error);
        
        await Swal.fire({
            icon: 'error',
            title: 'Verification Failed',
            text: error.response?.data?.message || 'Invalid or expired verification link.',
            confirmButtonText: 'Go to Login',
            showCancelButton: true,
            cancelButtonText: 'Resend Email'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/pages/auth/login.html';
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                window.location.href = '/pages/auth/verify-email.html';
            }
        });
        
        throw error;
    }
}

function startResendCooldown(seconds = 60) {
    const cooldownKey = 'verificationCooldownUntil';
    const endTime = Date.now() + seconds * 1000;
    localStorage.setItem(cooldownKey, endTime);

    const timerElement = document.getElementById('cooldown-timer');
    const cooldownElement = document.getElementById('resend-cooldown');
    const resendBtn = document.getElementById('resend-btn');

    if (cooldownElement) cooldownElement.classList.remove('hidden');
    if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.classList.add('opacity-50');
    }

    function updateTimer() {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        if (timerElement) timerElement.textContent = remaining;

        if (remaining <= 0) {
            clearInterval(interval);
            localStorage.removeItem(cooldownKey);
            if (cooldownElement) cooldownElement.classList.add('hidden');
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.classList.remove('opacity-50');
            }
        }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
}

// Restore cooldown if page reloads
(function restoreCooldown() {
    const cooldownKey = 'verificationCooldownUntil';
    const endTime = localStorage.getItem(cooldownKey);
    if (endTime && Date.now() < parseInt(endTime)) {
        startResendCooldown(Math.ceil((parseInt(endTime) - Date.now()) / 1000));
    }
})();


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
                // (This is handled in the handleSignup function)

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

    // Logout Buttons (both desktop and mobile)
    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    
    [logoutBtn, mobileLogoutBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', async () => {
                await handleLogout();
                window.location.href = '/pages/auth/login.html';
            });
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const verificationToken = urlParams.get('token');
    
    if (verificationToken && window.location.pathname.includes('verify-email')) {
        handleEmailVerification(verificationToken);
    }
}

// Start everything when DOM is ready
if (document.readyState !== 'loading') {
    initializeAuth();
} else {
    document.addEventListener('DOMContentLoaded', initializeAuth);
}