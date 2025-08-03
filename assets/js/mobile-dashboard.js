// Fixed Mobile Dashboard Functionality
console.log('Mobile dashboard script starting...');

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobile);
} else {
    initMobile();
}

function initMobile() {
    console.log('Initializing mobile dashboard...');
    
    // Small delay to ensure everything is ready
    setTimeout(() => {
        createMobileMenuElements();
        initializeMobileMenu();
        handleWindowResize();
        console.log('Mobile dashboard initialization complete');
    }, 200);
}

function createMobileMenuElements() {
    console.log('Creating mobile menu elements...');
    
    // Remove existing elements if they exist
    const existingToggle = document.querySelector('.mobile-menu-toggle');
    const existingOverlay = document.querySelector('.mobile-overlay');
    
    if (existingToggle) existingToggle.remove();
    if (existingOverlay) existingOverlay.remove();
    
    // Create mobile menu toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'mobile-menu-toggle';
    toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
    toggleButton.setAttribute('aria-label', 'Toggle mobile menu');
    toggleButton.type = 'button';
    toggleButton.style.cursor = 'pointer';
    document.body.appendChild(toggleButton);
    console.log('Mobile toggle button created');
    
    // Create mobile overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.style.cursor = 'pointer';
    document.body.appendChild(overlay);
    console.log('Mobile overlay created');
}

function initializeMobileMenu() {
    console.log('Setting up mobile menu functionality...');
    
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar-gradient');
    const overlay = document.querySelector('.mobile-overlay');
    const body = document.body;
    
    console.log('Elements check:', {
        toggleButton: !!toggleButton,
        sidebar: !!sidebar,
        overlay: !!overlay
    });
    
    if (!toggleButton || !sidebar || !overlay) {
        console.error('Missing required elements for mobile menu');
        return;
    }
    
    let isMenuOpen = false;
    
    function openMobileMenu() {
        console.log('Opening mobile menu');
        isMenuOpen = true;
        sidebar.classList.add('sidebar-open');
        overlay.classList.add('active');
        toggleButton.innerHTML = '<i class="fas fa-times"></i>';
        body.style.overflow = 'hidden';
        toggleButton.style.transform = 'rotate(180deg)';
    }
    
    function closeMobileMenu() {
        console.log('Closing mobile menu');
        isMenuOpen = false;
        sidebar.classList.remove('sidebar-open');
        overlay.classList.remove('active');
        toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
        body.style.overflow = '';
        toggleButton.style.transform = 'rotate(0deg)';
    }
    
    function toggleMobileMenu() {
        console.log('Toggle clicked, current state:', isMenuOpen ? 'open' : 'closed');
        if (isMenuOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }
    
    // Remove any existing event listeners
    toggleButton.replaceWith(toggleButton.cloneNode(true));
    const newToggleButton = document.querySelector('.mobile-menu-toggle');
    
    overlay.replaceWith(overlay.cloneNode(true));
    const newOverlay = document.querySelector('.mobile-overlay');
    
    // Add event listeners with multiple event types for better compatibility
    newToggleButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Toggle button clicked');
        toggleMobileMenu();
    });
    
    newToggleButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Toggle button touched');
        toggleMobileMenu();
    });
    
    newOverlay.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Overlay clicked');
        closeMobileMenu();
    });
    
    newOverlay.addEventListener('touchend', function(e) {
        e.preventDefault();
        console.log('Overlay touched');
        closeMobileMenu();
    });
    
    // Close menu when clicking sidebar items
    const sidebarButtons = sidebar.querySelectorAll('.sidebar-btn');
    sidebarButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (window.innerWidth <= 1024 && isMenuOpen) {
                console.log('Sidebar button clicked, closing menu');
                setTimeout(closeMobileMenu, 100);
            }
        });
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen) {
            console.log('Escape key pressed, closing menu');
            closeMobileMenu();
        }
    });
    
    // Handle swipe gestures
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        // Swipe right to open menu (from left edge)
        if (swipeDistance > swipeThreshold && touchStartX < 50 && !isMenuOpen) {
            console.log('Swipe right detected, opening menu');
            openMobileMenu();
        }
        
        // Swipe left to close menu
        if (swipeDistance < -swipeThreshold && isMenuOpen) {
            console.log('Swipe left detected, closing menu');
            closeMobileMenu();
        }
    }
    
    console.log('Mobile menu event listeners attached successfully');
}

function handleWindowResize() {
    window.addEventListener('resize', debounce(() => {
        const sidebar = document.querySelector('.sidebar-gradient');
        const overlay = document.querySelector('.mobile-overlay');
        const toggleButton = document.querySelector('.mobile-menu-toggle');
        const body = document.body;
        
        // Close mobile menu when resizing to desktop
        if (window.innerWidth > 1024) {
            if (sidebar) sidebar.classList.remove('sidebar-open');
            if (overlay) overlay.classList.remove('active');
            if (toggleButton) {
                toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
                toggleButton.style.transform = 'rotate(0deg)';
            }
            body.style.overflow = '';
            console.log('Resized to desktop, mobile menu closed');
        }
        
        // Update charts if available
        if (typeof Chart !== 'undefined') {
            Chart.helpers.each(Chart.instances, function(instance) {
                instance.resize();
            });
        }
    }, 250));
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add touch device class
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}

// Export mobile menu functions for external use
window.mobileMenu = {
    open: () => {
        const sidebar = document.querySelector('.sidebar-gradient');
        const overlay = document.querySelector('.mobile-overlay');
        const toggleButton = document.querySelector('.mobile-menu-toggle');
        
        if (sidebar) sidebar.classList.add('sidebar-open');
        if (overlay) overlay.classList.add('active');
        if (toggleButton) {
            toggleButton.innerHTML = '<i class="fas fa-times"></i>';
            toggleButton.style.transform = 'rotate(180deg)';
        }
        document.body.style.overflow = 'hidden';
        console.log('Mobile menu opened via API');
    },
    
    close: () => {
        const sidebar = document.querySelector('.sidebar-gradient');
        const overlay = document.querySelector('.mobile-overlay');
        const toggleButton = document.querySelector('.mobile-menu-toggle');
        
        if (sidebar) sidebar.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('active');
        if (toggleButton) {
            toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
            toggleButton.style.transform = 'rotate(0deg)';
        }
        document.body.style.overflow = '';
        console.log('Mobile menu closed via API');
    }
};

console.log('Mobile dashboard script loaded successfully');