// Initialize AOS animations
AOS.init({
  duration: 800,
  easing: 'ease-in-out',
  once: true
});

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    const html = document.documentElement;
    themeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        html.classList.toggle('dark', savedTheme === 'dark');
    }
}

// Setup user dropdown and logout button



// Mobile menu toggle
document.getElementById('mobile-menu-button')?.addEventListener?.('click', () => {
  document.getElementById('mobile-menu').classList.toggle('hidden');
});

// Check auth status on page load
window.API_BASE_URL = window.API_BASE_URL || 'https://scydb-api-production.up.railway.app/api/v1';

const checkAuthStatus = async () => {
  const token = localStorage.getItem('token');
  console.log('Checking auth status. Token:', token ? 'exists' : 'not found');
  
  if (!token) {
    console.log('No token found, showing login/signup');
    localStorage.removeItem('user');
    updateUIForLoggedInUser(null);
    return;
  }

  // Verify token with backend
  try {
    const { data } = await axios.get(`${window.API_BASE_URL}/auth/check`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    // Update stored user data and UI
    localStorage.setItem('user', JSON.stringify(data.data.user));
    updateUIForLoggedInUser(data.data.user);
    console.log('Token verified, user authenticated');
  } catch (err) {
    console.log('Token invalid, clearing session');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateUIForLoggedInUser(null);
    return;
  }
};

// Update UI for logged-in users
const updateUIForLoggedInUser = (user) => {
  const authLinks = document.getElementById('auth-links'); // Desktop Login/Signup
  const userMenu = document.getElementById('user-menu');   // Desktop User Dropdown
  const userDashboardLink = document.getElementById('user-dashboard-link');
  const mobileUserDashboardLink = document.getElementById('mobile-user-dashboard-link');
  const mobileAuthLinks = document.getElementById('mobile-auth-links'); // Burger Login/Signup
  const mobileUserMenu = document.getElementById('mobile-user-menu');   // Burger User Dropdown

  if (!user) {
    // Guest (not logged in)

    // Show desktop auth buttons on md+ only (hidden by Tailwind on mobile)


    // Hide desktop user menu
    if (userMenu) {
      userMenu.classList.add('hidden');
    }

    // Show mobile auth buttons
    if (mobileAuthLinks) {
      mobileAuthLinks.classList.remove('hidden');
    }

    // Hide mobile user dropdown
    if (mobileUserMenu) {
      mobileUserMenu.classList.add('hidden');
    }

    // Hide dashboard links (mobile + desktop)
    [userDashboardLink, mobileUserDashboardLink].forEach(link => {
      if (link) {
        link.classList.add('hidden');
      }
    });

    // Show signup button for guests
const ctaSignupBtn = document.querySelector('section a[href="../auth/signup.html"]');
if (ctaSignupBtn) {
  ctaSignupBtn.style.display = '';
}

return;

    return;
  }

  //  Logged-in user
const isAdmin = user && ['admin', 'super-admin'].includes(user.role);
  // Hide desktop auth links (completely)
  if (authLinks) {
  authLinks.style.display = 'none';
  authLinks.classList.add('hidden');
}

  // Show desktop user menu
  if (userMenu) {
    userMenu.classList.remove('hidden');

    const userNameElement = document.getElementById('user-name');
    const userAvatarElement = document.getElementById('user-avatar');
    if (userNameElement) userNameElement.textContent = user.name || 'User';
    if (userAvatarElement) userAvatarElement.src = user.photo || '/assets/images/default-avatar.jpg';
  }

  // Hide mobile auth buttons
  if (mobileAuthLinks) {
    mobileAuthLinks.classList.add('hidden');
  }

  // Show mobile user menu
  if (mobileUserMenu) {
    mobileUserMenu.classList.remove('hidden');
  }

  // Show dashboard link only if admin
[userDashboardLink, mobileUserDashboardLink].forEach(link => {
  if (link) {
    if (user && user.role && ['admin', 'super-admin'].includes(user.role)) {
      link.classList.remove('hidden');
      link.style.display = 'block';
    } else {
      link.classList.add('hidden');
      link.style.display = 'none';
    }
  }
});

  // Show admin-only elements
  if (isAdmin) {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
  }

  // Hide/show CTA section signup button based on login status
const ctaSignupBtn = document.querySelector('section a[href="../auth/signup.html"]');
if (ctaSignupBtn) {
  if (user) {
    // Hide signup button for logged-in users
    ctaSignupBtn.style.display = 'none';
  } else {
    // Show signup button for guests
    ctaSignupBtn.style.display = '';
  }
}
};

// Show success message after email verification
if (window.location.search.includes('verified=success')) {
  Swal.fire({
    icon: 'success',
    title: 'Email Verified!',
    text: 'Your account has been verified and you are now logged in.',
    confirmButtonText: 'OK'
  });

  // Remove query from URL so it doesn't show again on refresh
  window.history.replaceState({}, document.title, window.location.pathname);
}


function setupLogoutButton() {
  const logoutBtn = document.getElementById('logout-btn');
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  
  [logoutBtn, mobileLogoutBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await axios.get(`${window.API_BASE_URL}/auth/logout`, { withCredentials: true });
        } catch {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/pages/auth/login.html';
      });
    }
  });
}

// Initialize after DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  setupLogoutButton();
});