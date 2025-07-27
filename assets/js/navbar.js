function createNavbar() {
    const navbar = `
        <nav class="bg-[#F2F0E3] dark:bg-[#1F1F1F]">
    <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-20">
            <!-- Left: Logo -->
            <a href="/pages/index.html" class="text-2xl font-bold text-[#2E2E2E] dark:text-[#F2F0E3] ml-4 md:ml-20">
                ScyDB
            </a>

            <!-- Center: Nav links -->
            <div class="hidden md:flex items-center space-x-8">
                <a href="/pages/index.html" class="nav-link">Home</a>
                <a href="/pages/movies/" class="nav-link">Movies</a>
                <a href="/pages/about.html" class="nav-link">About</a>
            </div>

            <!-- Right: Theme toggle + Auth/User -->
            <div class="flex items-center space-x-4 mr-2 md:mr-20">
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
                <div id="auth-links" class="hidden md:flex items-center space-x-4">
                    <a href="/pages/auth/login.html" class="btn btn-outline">Login</a>
                    <a href="/pages/auth/signup.html" class="btn btn-primary">Sign Up</a>
                </div>

                <div id="user-menu" class="relative hidden">
                    <button id="user-menu-button" class="flex items-center space-x-1 focus:outline-none hover:bg-[#e0ddd0] dark:hover:bg-[#2E2E2E] rounded-lg px-2 py-1 transition-colors">
                        <img id="user-avatar" src="/assets/images/default-avatar.jpg" alt="User" class="w-8 h-8 rounded-full object-cover border border-[#e0ddd0] dark:border-[#2E2E2E]">
                        <svg class="w-4 h-4 text-[#2E2E2E] dark:text-[#F2F0E3] hidden md:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-[#F2F0E3] dark:bg-[#1F1F1F] rounded-md shadow-lg py-1 z-50 border border-[#e0ddd0] dark:border-[#2E2E2E]">
                        <a href="/pages/users/profile.html" class="dropdown-item">Profile</a> 
                        <a href="/pages/users/dashboard.html" id="user-dashboard-link" class="dropdown-item hidden">Dashboard</a>
                        <a href="/pages/users/watchlist.html" class="dropdown-item">Watchlist</a> 
                        <button id="logout-btn" class="dropdown-item w-full text-left">Logout</button>
                    </div>
                </div>

                <!-- Mobile menu button -->
                <button id="mobile-menu-button" class="md:hidden p-2 mr-2 rounded-full hover:bg-[#e0ddd0] dark:hover:bg-[#2E2E2E] transition-transform duration-200 active:scale-95 active:rotate-3">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Mobile menu -->
        <div id="mobile-menu" class="hidden md:hidden bg-[#F2F0E3] dark:bg-[#1F1F1F]">
            <div class="px-2 py-2 space-y-1 w-full">
                <a href="/pages/index.html" class="nav-link-mobile block">Home</a>
                <a href="/pages/movies/" class="nav-link-mobile block">Movies</a>
                <a href="/pages/about.html" class="nav-link-mobile block">About</a>
            </div>
            <div id="mobile-auth-links" class="px-4 py-2 border-t border-[#e0ddd0] dark:border-[#2E2E2E] space-y-2">
    <a href="/pages/auth/login.html" class="btn btn-outline w-full text-sm">Login</a>
    <a href="/pages/auth/signup.html" class="btn btn-primary w-full text-sm">Sign Up</a>
</div>
<div id="mobile-user-menu" class="px-4 py-2 border-t border-[#e0ddd0] dark:border-[#2E2E2E] hidden space-y-2">    <a href="/pages/users/profile.html" class="nav-link-mobile w-full block px-4">Profile</a>
    <a href="/pages/users/dashboard.html" id="mobile-user-dashboard-link" class="hidden nav-link-mobile block px-4">Dashboard</a>
    <a href="/pages/users/watchlist.html" class="nav-link-mobile w-full block px-4">Watchlist</a>
    <button id="mobile-logout-btn" class="nav-link-mobile w-full text-left px-4">Logout</button>
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
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Theme toggle functionality
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const html = document.documentElement;
                const isDark = html.classList.contains('dark');
                html.classList.toggle('dark', !isDark);
                localStorage.setItem('theme', isDark ? 'light' : 'dark');
            });
        }

        // Mobile theme toggle
        const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
if (mobileThemeToggle) {
  mobileThemeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    html.classList.toggle('dark', !isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  });
}

        // Setup user dropdown right after navbar inject
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

        // Init theme
        const initTheme = () => {
            const storedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = storedTheme ? storedTheme === 'dark' : systemPrefersDark;
            document.documentElement.classList.toggle('dark', initialTheme);
        };
        initTheme();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    createNavbar();
});
