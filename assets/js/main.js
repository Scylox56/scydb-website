// Initialize AOS animations
AOS.init({
  duration: 800,
  easing: 'ease-in-out',
  once: true
});

// Mobile menu toggle
document.getElementById('mobile-menu-button')?.addEventListener('click', () => {
  document.getElementById('mobile-menu').classList.toggle('hidden');
});

// Dark mode toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');
if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
  });
}

// Check auth status on page load
window.API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api/v1';
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

  try {
    const { data } = await axios.get(`${window.API_BASE_URL}/auth/check`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    });
    // Store user in localStorage for consistency with other pages
    localStorage.setItem('user', JSON.stringify(data.data.user));
    updateUIForLoggedInUser(data.data.user);
  } catch (err) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Update UI for logged-in users
const updateUIForLoggedInUser = (user) => {
  const authLinks = document.getElementById('auth-links');
  const userMenu = document.getElementById('user-menu');

  if (!user) {
    // Force show auth links and hide user menu when no user
    if (authLinks) {
      authLinks.style.display = 'flex';
      authLinks.classList.remove('hidden');
      console.log('Auth links shown - no user');
    }
    if (userMenu) {
      userMenu.style.display = 'none';
      userMenu.classList.add('hidden');
    }
    return;
  }

  // User is logged in
  if (authLinks) {
    authLinks.style.display = 'none';
    authLinks.classList.add('hidden');
    console.log('Auth links hidden by updateUIForLoggedInUser');
  }
  
  if (userMenu) {
    userMenu.style.display = 'flex';
    userMenu.classList.remove('hidden');
    const userNameElement = document.getElementById('user-name');
    const userAvatarElement = document.getElementById('user-avatar');
    if (userNameElement) userNameElement.textContent = user.name || 'User';
    if (userAvatarElement) userAvatarElement.src = user.photo || '/assets/images/default-avatar.jpg';
    console.log('User menu shown by updateUIForLoggedInUser');
  }

  // Show admin features if applicable
  if (['admin', 'super-admin'].includes(user.role)) {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
  }
};

// Setup user dropdown and logout button
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

function setupLogoutButton() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await axios.get(`${window.API_BASE_URL}/auth/logout`, { withCredentials: true });
      } catch {}
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/pages/auth/login.html';
    });
  }
}

// Initialize after DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  setupUserDropdown();
  setupLogoutButton();
});