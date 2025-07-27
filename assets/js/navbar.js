function createNavbar() {
    const navbar = `
        <nav class="bg-[#F2F0E3] dark:bg-[#1F1F1F]">
    <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-20">
            <!-- Left: Logo -->
            <a href="/pages/index.html" class="text-2xl font-bold text-[#2E2E2E] dark:text-[#F2F0E3] ml-20 md:ml-5">
                ScyDB
            </a>

            <!-- Center: Nav links -->
            <div class="hidden md:flex items-center space-x-8">
                <a href="/pages/index.html" class="nav-link">Home</a>
                <a href="/pages/movies/" class="nav-link">Movies</a>
                <a href="/pages/about.html" class="nav-link">About</a>
            </div>

            <!-- Right: Theme toggle + Auth/User -->
            <div class="flex items-center space-x-4 mr-20 md:mr-5">
                <!-- Theme Toggle -->
                <button id="theme-toggle" class="p-2 rounded-full hover:bg-[#e0ddd0] dark:hover:bg-[#2E2E2E] transition-colors">
                    <svg id="theme-icon-dark" class="w-5 h-5 hidden dark:block" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                    </svg>
                    <svg id="theme-icon-light" class="w-5 h-5 dark:hidden" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
                    </svg>
                </button>

                <!-- Auth/User Section -->
                <div id="auth-links" class="hidden items-center space-x-4">
                    <a href="/pages/auth/login.html" class="btn btn-outline">Login</a>
                    <a href="/pages/auth/signup.html" class="btn btn-primary">Sign Up</a>
                </div>

                <div id="user-menu" class="relative hidden">
    <!-- This is the clickable button with avatar + arrow -->
    <button id="user-menu-button" class="flex items-center space-x-1 focus:outline-none hover:bg-[#e0ddd0] dark:hover:bg-[#2E2E2E] rounded-lg px-2 py-1 transition-colors">
        <img id="user-avatar" src="/assets/images/default-avatar.jpg" alt="User" class="w-8 h-8 rounded-full object-cover border border-[#e0ddd0] dark:border-[#2E2E2E]">
        <svg class="w-4 h-4 text-[#2E2E2E] dark:text-[#F2F0E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
    </button>
                    <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-[#F2F0E3] dark:bg-[#1F1F1F] rounded-md shadow-lg py-1 z-50 border border-[#e0ddd0] dark:border-[#2E2E2E]">
                        <a href="/pages/users/profile.html" class="dropdown-item">Profile</a>
                        <a href="/pages/users/dashboard.html" id="user-dashboard-link" class="hidden dropdown-item">Dashboard</a>
                        <a href="/pages/users/watchlist.html" class="dropdown-item">Watchlist</a>
                        <button id="logout-btn" class="dropdown-item w-full text-left">Logout</button>
                    </div>
                </div>

                <!-- Mobile menu button -->
                <button id="mobile-menu-button" class="md:hidden p-2 rounded-full hover:bg-[#e0ddd0] dark:hover:bg-[#2E2E2E] transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>

         <!-- Mobile menu -->
        <div id="mobile-menu" class="hidden md:hidden bg-[#F2F0E3] dark:bg-[#1F1F1F] border-t border-[#e0ddd0] dark:border-[#2E2E2E]">
            <div class="px-2 py-2 space-y-1">
                <a href="/pages/index.html" class="nav-link-mobile block">Home</a>
                <a href="/pages/movies/" class="nav-link-mobile block">Movies</a>
                <a href="/pages/about.html" class="nav-link-mobile block">About</a>
            </div>
            <div id="mobile-auth-links" class="px-2 py-2 border-t border-[#e0ddd0] dark:border-[#2E2E2E] space-y-2">
                <a href="/pages/auth/login.html" class="btn btn-outline w-full text-sm">Login</a>
                <a href="/pages/auth/signup.html" class="btn btn-primary w-full text-sm">Sign Up</a>
            </div>
            <div id="mobile-user-menu" class="px-2 py-2 border-t border-[#e0ddd0] dark:border-[#2E2E2E] hidden space-y-2">
                <a href="/pages/users/profile.html" class="nav-link-mobile block">Profile</a>
                <a href="/pages/users/dashboard.html" id="mobile-user-dashboard-link" class="hidden nav-link-mobile block">Dashboard</a>
                <a href="/pages/users/watchlist.html" class="nav-link-mobile block">Watchlist</a>
                <button id="mobile-logout-btn" class="nav-link-mobile w-full text-left">Logout</button>
            </div>
        </div>
    </div>
</nav>
    `;

    const nav = document.querySelector('nav');
       if (nav) {
        nav.innerHTML = navbar;

        // Mobile menu toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Theme toggle functionality
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            const isDark = html.classList.contains('dark');
            html.classList.toggle('dark', !isDark);
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
            document.querySelector('nav').classList.toggle('dark', !isDark);
        });

        // Initialize theme
        const initTheme = () => {
            const storedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = storedTheme ? storedTheme === 'dark' : systemPrefersDark;
            document.documentElement.classList.toggle('dark', initialTheme);
            document.querySelector('nav').classList.toggle('dark', initialTheme);
        };
        initTheme();

        // ✅ Call dropdown + auth setup after elements exist
         const userMenuButton = document.getElementById('user-menu-button');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userMenuButton && userDropdown) {
            // Click functionality
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });
            
            // Hover functionality
            const userMenu = document.getElementById('user-menu');
            if (userMenu) {
                userMenu.addEventListener('mouseenter', () => {
                    userDropdown.classList.remove('hidden');
                });
                
                userMenu.addEventListener('mouseleave', () => {
                    userDropdown.classList.add('hidden');
                });
            }
        }

        // Setup logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/pages/index.html';
            });
        }
        
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/pages/index.html';
            });
        }

        setTimeout(() => updateAuthUI(), 0);
    }
}    

 function updateAuthUI() {
    const authToken = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    // Debug: Let's see what's actually stored
    console.log('Auth Token:', authToken);
    console.log('User String:', userStr);
    
    const user = userStr ? JSON.parse(userStr) : {};
    console.log('Parsed User:', user);
    
    const authLinks = document.getElementById('auth-links');
    const userMenu = document.getElementById('user-menu');
    const mobileAuthLinks = document.getElementById('mobile-auth-links');
    const mobileUserMenu = document.getElementById('mobile-user-menu');
    
    // Change the condition to only check for user data since token is null
    if (Object.keys(user).length > 0 && user.id) {
        // User is logged in
        if (authLinks) authLinks.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');
        if (mobileAuthLinks) mobileAuthLinks.classList.add('hidden');
        if (mobileUserMenu) mobileUserMenu.classList.remove('hidden');
        
        // Update user avatar if available
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar && user.photo) {
            userAvatar.src = user.photo;
        }
    } else {
        // User is not logged in
        if (authLinks) authLinks.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
        if (mobileAuthLinks) mobileAuthLinks.classList.remove('hidden');
        if (mobileUserMenu) mobileUserMenu.classList.add('hidden');
    
    }
    const dashboardLink = document.getElementById('user-dashboard-link');
        
        if (user.role === 'admin' || user.role === 'super-admin') {
            if (dashboardLink) dashboardLink.classList.remove('hidden');
        } else {
            if (dashboardLink) dashboardLink.classList.add('hidden');
        }
}

document.addEventListener('DOMContentLoaded', () => {
    createNavbar();

    // Dropdown fix
    document.addEventListener('click', function (e) {
        const dropdown = document.getElementById('user-dropdown');
        const button = document.getElementById('user-menu-button');
        if (!dropdown || !button) return;

        if (button.contains(e.target)) {
            dropdown.classList.toggle('hidden');
        } else if (!dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
});
