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
const checkAuthStatus = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const { data } = await axios.get('/api/v1/auth/check', {
      headers: { Authorization: `Bearer ${token}` }
    });
    updateUIForLoggedInUser(data.data.user);
  } catch (err) {
    localStorage.removeItem('token');
  }
};

// Update UI for logged-in users
const updateUIForLoggedInUser = (user) => {
  document.getElementById('auth-links')?.classList.add('hidden');
  document.getElementById('user-menu')?.classList.remove('hidden');
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-avatar').src = user.photo || '/assets/images/default-avatar.jpg';

  // Show admin features if applicable
  if (['admin', 'super-admin'].includes(user.role)) {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
  }
};

// Initialize
checkAuthStatus();