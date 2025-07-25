// Create and inject navbar into the page
function createNavbar() {
    const navbar = `
        <div class="container mx-auto px-4 py-3">
            <div class="flex justify-between items-center">
                <!-- Logo -->
                <a href="/" class="flex items-center space-x-2">
                    <span class="text-2xl font-bold text-primary dark:text-white">ScyDB</span>
                </a>

                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-6">
                    <a href="/pages/index.html" class="nav-link">Home</a>
                    <a href="/pages/movies/" class="nav-link">Movies</a>
                    <a href="/pages/about.html" class="nav-link">About</a>
                </div>

                <!-- Auth Section -->
                <div class="flex items-center space-x-4">
                    <!-- Auth Links -->
                    <div id="auth-links" class="items-center space-x-4">
                        <a href="/pages/auth/login.html" class="btn btn-outline">Login</a>
                        <a href="/pages/auth/signup.html" class="btn btn-primary">Sign Up</a>
                    </div>

                    <!-- User Menu -->
                    <div id="user-menu" class="relative hidden">
                        <button id="user-menu-button" class="flex items-center space-x-2 focus:outline-none">
                            <img id="user-avatar" src="/assets/images/default-avatar.jpg" alt="User" class="w-10 h-10 rounded-full">
                            <span id="user-name" class="font-medium dark:text-white"></span>
                            <i class="fas fa-chevron-down text-sm"></i>
                        </button>
                        <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-50">
                            <a href="/pages/users/profile.html" class="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Profile</a>
                            <a href="/pages/users/watchlist.html" class="block px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Watchlist</a>
                            <button id="logout-btn" class="w-full text-left px-4 py-2 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Logout</button>
                        </div>
                    </div>
                </div>

                <!-- Mobile menu button -->
                <button id="mobile-menu-button" class="md:hidden focus:outline-none">
                    <i class="fas fa-bars text-gray-800 dark:text-white text-2xl"></i>
                </button>
            </div>

            <!-- Mobile menu -->
            <div id="mobile-menu" class="hidden md:hidden mt-4">
                <a href="/pages/index.html" class="block py-2 text-gray-800 dark:text-white">Home</a>
                <a href="/pages/movies/" class="block py-2 text-gray-800 dark:text-white">Movies</a>
                <a href="/pages/about.html" class="block py-2 text-gray-800 dark:text-white">About</a>
            </div>
        </div>
    `;

     const nav = document.querySelector('nav');
    if (nav) {
        nav.innerHTML = navbar;

        // ✅ Once injected, initialize auth logic
        if (typeof initializeAuth === 'function') {
            initializeAuth();
        } else {
            console.warn('initializeAuth is not available!');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    createNavbar();
});