
let currentUser = null;
let isLoading = false;


// INITIALIZATION


document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    
    // Redirect if not logged in
    if (!token) {
        return window.location.href = '/pages/auth/login.html';
    }

    // Initialize everything
    await initProfilePage();
});

async function initProfilePage() {
    try {
        console.log('Initializing profile page...');
        await loadUserProfile();
        initFormValidation();
        initPasswordStrength();
        await loadUserStats();
        setupEventListeners();
        setupFileUpload();
        
        // Initialize AOS if available
        if (typeof AOS !== 'undefined') {
            AOS.init({ duration: 600, easing: 'ease-out-quad', once: true });
        }
        
        console.log('Profile page initialized successfully!');
    } catch (err) {
        console.error('Failed to initialize profile page:', err);
        showNotification('error', 'Initialization Error', 'Failed to load profile page');
    }
}


// USER PROFILE LOADING


async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        currentUser = data.data.user;
        populateProfileData(currentUser);
        updateProfileCompletion();
        updateAdminVisibility();
        document.title = `${currentUser.name} - ScyDB`;
        
        console.log('User profile loaded:', currentUser);
        
    } catch (err) {
        console.error('Failed to load user profile:', err);
        showNotification('error', 'Profile Load Error', 'Failed to load profile data');
        
        // Redirect to login if token is invalid
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/pages/auth/login.html';
        }
    }
}

function populateProfileData(user) {
    try {
        // Basic info elements
        const elements = {
            'user-name': user.name || 'Unknown User',
            'user-email': user.email || '',
            'user-role': (user.role || 'member').toUpperCase(),
            'profile-name': user.name || '',
            'profile-email': user.email || '',
            'profile-avatar': user.photo || ''
        };

        // Populate text content
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'INPUT') {
                    element.value = value;
                } else {
                    element.textContent = value;
                }
            }
        });
        
        // Format and set join date
        const joinDateEl = document.getElementById('join-date');
        if (joinDateEl && user.createdAt) {
            const date = new Date(user.createdAt);
            const options = { year: 'numeric', month: 'long' };
            joinDateEl.textContent = `Joined ${date.toLocaleDateString('en-US', options)}`;
        } else if (joinDateEl) {
            joinDateEl.textContent = 'Member since 2024';
        }
        
        // Update all avatar images
        updateAvatarImages(user.photo || '/assets/images/default-avatar.jpg');
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(user));
        
    } catch (err) {
        console.error('Error populating profile data:', err);
    }
}

function updateAvatarImages(photoUrl) {
    const avatarSelectors = ['#user-avatar', '.profile-avatar', '#avatar-preview'];
    
    avatarSelectors.forEach(selector => {
        const avatars = document.querySelectorAll(selector);
        avatars.forEach(avatar => {
            if (avatar) {
                avatar.src = photoUrl;
                avatar.onerror = () => {
                    avatar.src = '/assets/images/default-avatar.jpg';
                };
            }
        });
    });
}

function updateProfileCompletion() {
    if (!currentUser) return;
    
    let completionScore = 0;
    const fields = [
        { field: 'name', weight: 33 },
        { field: 'email', weight: 33 },
        { field: 'photo', weight: 34 }
    ];
    
    fields.forEach(({ field, weight }) => {
        if (currentUser[field] && currentUser[field].toString().trim()) {
            completionScore += weight;
        }
    });
    
    const percentage = Math.min(completionScore, 100);
    
    // Update UI elements
    const percentageEl = document.getElementById('completion-percentage');
    const progressEl = document.getElementById('completion-progress');
    
    if (percentageEl) percentageEl.textContent = `${percentage}%`;
    if (progressEl) progressEl.style.width = `${percentage}%`;
    
    // Update completion tip
    const completionTip = document.querySelector('.completion-tip');
    if (completionTip) {
        const missingFields = fields.filter(({ field }) => 
            !currentUser[field] || !currentUser[field].toString().trim()
        );
        
        if (missingFields.length > 0) {
            const tips = {
                'photo': 'Add a profile picture',
                'name': 'Complete your name',
                'email': 'Add your email'
            };
            completionTip.textContent = tips[missingFields[0].field] + ' to increase completion!';
        } else {
            completionTip.textContent = 'Profile 100% complete! 🎉';
        }
    }
}

function updateAdminVisibility() {
    if (!currentUser) return;
    
    const isAdmin = ['admin', 'super-admin'].includes(currentUser.role);
    const adminElements = document.querySelectorAll('.admin-only, #admin-dashboard-link');
    
    adminElements.forEach(element => {
        if (isAdmin) {
            element.classList.remove('hidden');
            element.style.display = '';
        } else {
            element.classList.add('hidden');
            element.style.display = 'none';
        }
    });
}


// STATS LOADING


async function loadUserStats() {
    try {
        // Get watchlist count from user data
        let watchlistCount = 0;
        if (currentUser?.watchLater) {
            watchlistCount = currentUser.watchLater.length;
        }

        // Calculate days since joined
        let daysActive = 0;
        if (currentUser?.createdAt) {
            const joinDate = new Date(currentUser.createdAt);
            const today = new Date();
            const diffTime = Math.abs(today - joinDate);
            daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Try to get reviews count from API
        let reviewsCount = 0;
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/reviews/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const reviews = response.data.data?.reviews || response.data.data || response.data || [];
            reviewsCount = Array.isArray(reviews) ? reviews.length : 0;
            console.log('Reviews fetched successfully:', reviewsCount);
        } catch (err) {
            console.log('Could not fetch reviews count:', err.response?.data?.message || err.message);
            // Try alternative endpoint if the first one fails
            try {
                const token = localStorage.getItem('token');
                const altResponse = await axios.get(`${API_BASE_URL}/users/me/reviews`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const altReviews = altResponse.data.data?.reviews || altResponse.data.data || altResponse.data || [];
                reviewsCount = Array.isArray(altReviews) ? altReviews.length : 0;
                console.log('Reviews fetched from alternative endpoint:', reviewsCount);
            } catch (altErr) {
                console.log('Alternative reviews endpoint also failed:', altErr.response?.data?.message || altErr.message);
                reviewsCount = 0;
            }
        }

        const stats = {
            reviewsWritten: reviewsCount,
            watchlistCount: watchlistCount,
            daysActive: daysActive
        };
        
        // Animate numbers
        animateNumber('reviews-written', stats.reviewsWritten);
        animateNumber('watchlist-count', stats.watchlistCount);
        animateNumber('summary-reviews', stats.reviewsWritten);
        animateNumber('summary-watchlist', stats.watchlistCount);
        animateNumber('days-active', stats.daysActive);
        
        console.log('User stats loaded:', stats);
        updateStatNumberColors();
    } catch (err) {
        console.error('Failed to load stats:', err);
        // Set default values on error
        const defaultStats = { reviewsWritten: 0, watchlistCount: 0, daysActive: 0 };
        Object.entries(defaultStats).forEach(([key, value]) => {
            const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
            if (element) element.textContent = value;
        });
    }
}

function animateNumber(elementId, targetNumber) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1000;
    const increment = targetNumber / (duration / 16);
    let currentNumber = 0;
    
    const timer = setInterval(() => {
        currentNumber += increment;
        if (currentNumber >= targetNumber) {
            currentNumber = targetNumber;
            clearInterval(timer);
        }
        element.textContent = Math.floor(currentNumber);
        
        updateStatNumberColors();
    }, 16);
}

function updateStatNumberColors() {
    const statNumbers = document.querySelectorAll('.stat-number');
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    statNumbers.forEach(number => {
        if (isDarkMode) {
            number.style.color = '#F2F0E3';
        } else {
            number.style.color = '#2E2E2E';
        }
    });
    
    const statLabels = document.querySelectorAll('.stat-label');
    statLabels.forEach(label => {
        if (isDarkMode) {
            label.style.color = '#9CA3AF';
        } else {
            label.style.color = '#6B7280';
        }
    });
}


// EVENT LISTENERS


function setupEventListeners() {
    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Password form submission
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Reset buttons
    const resetProfileBtn = document.getElementById('reset-profile-btn');
    if (resetProfileBtn) {
        resetProfileBtn.addEventListener('click', resetProfileForm);
    }

    const resetPasswordBtn = document.getElementById('reset-password-btn');
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', resetPasswordForm);
    }

    // Avatar preview button
    const previewBtn = document.getElementById('preview-avatar-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', previewAvatarFromUrl);
    }

    // Password toggle buttons
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.closest('button').dataset.target;
            togglePassword(targetId);
        });
    });

    // Avatar change button
    const avatarChangeBtn = document.getElementById('avatar-change-btn');
    if (avatarChangeBtn) {
        avatarChangeBtn.addEventListener('click', openAvatarModal);
    }

    // Modal close buttons
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const cancelAvatarBtn = document.getElementById('cancel-avatar-btn');
    
    [modalCloseBtn, cancelAvatarBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', closeAvatarModal);
        }
    });

    // Modal save button
    const saveAvatarBtn = document.getElementById('save-avatar-btn');
    if (saveAvatarBtn) {
        saveAvatarBtn.addEventListener('click', saveNewAvatar);
    }

    // Modal preview button
    const previewModalBtn = document.getElementById('preview-modal-avatar-btn');
    if (previewModalBtn) {
        previewModalBtn.addEventListener('click', previewAvatarFromModal);
    }

    // Back to top button
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Avatar URL input real-time preview
    const avatarInput = document.getElementById('profile-avatar');
    if (avatarInput) {
        avatarInput.addEventListener('input', debounce(() => {
            const url = avatarInput.value;
            if (url && isValidUrl(url)) {
                updateAvatarImages(url);
            }
        }, 500));
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            // Wait for theme to change then update colors
            setTimeout(() => {
                updateStatNumberColors();
            }, 100);
        });
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                updateStatNumberColors();
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });
}


// FILE UPLOAD HANDLING


function setupFileUpload() {
    const fileInput = document.getElementById('avatar-file-input');
    const modalFileInput = document.getElementById('avatar-file');
    const uploadArea = document.getElementById('upload-area');

    // Main form file input
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // Modal file input
    if (modalFileInput) {
        modalFileInput.addEventListener('change', handleModalFileUpload);
    }

    // Upload area click
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            modalFileInput?.click();
        });
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateFile(file)) {
        event.target.value = '';
        return;
    }

    try {
        const imageUrl = await uploadImageToCloudinary(file);
        
        // Update avatar input and preview
        const avatarInput = document.getElementById('profile-avatar');
        if (avatarInput) {
            avatarInput.value = imageUrl;
        }
        
        updateAvatarImages(imageUrl);
        showNotification('success', 'Image Uploaded', 'Your profile picture has been uploaded successfully!');
        
    } catch (err) {
        console.error('File upload failed:', err);
        showNotification('error', 'Upload Failed', 'Failed to upload image. Please try again.');
        event.target.value = '';
    }
}

async function handleModalFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateFile(file)) {
        event.target.value = '';
        return;
    }

    try {
        const imageUrl = await uploadImageToCloudinary(file);
        
        // Update preview in modal
        const previewImg = document.getElementById('avatar-preview');
        if (previewImg) {
            previewImg.src = imageUrl;
        }
        
        // Store the URL for saving
        previewImg.dataset.uploadedUrl = imageUrl;
        
        showNotification('success', 'Image Uploaded', 'Click "Save Avatar" to apply the changes.');
        
    } catch (err) {
        console.error('Modal file upload failed:', err);
        showNotification('error', 'Upload Failed', 'Failed to upload image. Please try again.');
        event.target.value = '';
    }
}

function validateFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    if (file.size > maxSize) {
        showNotification('error', 'File Too Large', 'Please select an image smaller than 5MB.');
        return false;
    }
    
    if (!validTypes.includes(file.type)) {
        showNotification('error', 'Invalid Format', 'Please select a JPEG, PNG, or GIF image.');
        return false;
    }
    
    return true;
}

async function uploadImageToCloudinary(file) {

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
    
            resolve(e.target.result);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}


// FORM HANDLING


async function handleProfileUpdate(e) {
    e.preventDefault();
    
    if (isLoading) return;
    isLoading = true;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Updating...';
    submitBtn.disabled = true;
    
    try {
        const formData = {
            name: document.getElementById('profile-name').value.trim(),
            email: document.getElementById('profile-email').value.trim(),
            photo: document.getElementById('profile-avatar').value.trim()
        };

        // Validate form data
        if (!formData.name) {
            throw new Error('Name is required');
        }
        
        if (!formData.email || !isValidEmail(formData.email)) {
            throw new Error('Valid email is required');
        }
        
        const token = localStorage.getItem('token');
        const { data } = await axios.patch(`${API_BASE_URL}/users/updateMe`, formData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update current user data
        currentUser = data.data.user;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Update UI
        populateProfileData(currentUser);
        updateProfileCompletion();
        
        // Show success
        showNotification('success', 'Profile Updated!', 'Your profile has been successfully updated.');
        
    } catch (err) {
        console.error('Profile update failed:', err);
        showNotification('error', 'Update Failed', err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        isLoading = false;
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    if (isLoading) return;
    isLoading = true;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const newPasswordConfirm = document.getElementById('new-password-confirm').value;

    // Validate passwords match
    if (newPassword !== newPasswordConfirm) {
        showFieldError('new-password-confirm', 'Passwords do not match');
        isLoading = false;
        return;
    }

    // Show loading
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Changing...';
    submitBtn.disabled = true;
    
    try {
        const token = localStorage.getItem('token');
        await axios.patch(`${API_BASE_URL}/users/updateMyPassword`, {
            currentPassword,
            newPassword,
            newPasswordConfirm
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Clear form
        e.target.reset();
        clearPasswordStrength();
        
        // Show success and logout
        showNotification('success', 'Password Changed!', 'Please login with your new password.');
        
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/pages/auth/login.html';
        }, 2000);
        
    } catch (err) {
        console.error('Password change failed:', err);
        showNotification('error', 'Password Change Failed', err.response?.data?.message || 'Current password is incorrect');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        isLoading = false;
    }
}

async function handleLogout() {
    const result = await Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#F76F53',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, logout'
    });
    
    if (result.isConfirmed) {
        try {
            // Call logout API
            await axios.get(`${API_BASE_URL}/auth/logout`);
        } catch (err) {
            console.error('Logout API failed:', err);
        }
        
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to home
        window.location.href = '/pages/index.html';
    }
}


// FORM VALIDATION


function initFormValidation() {
    // Real-time validation for profile form
    const profileInputs = document.querySelectorAll('#profile-form input');
    profileInputs.forEach(input => {
        if (input && input.type !== 'file') {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => clearFieldError(input));
        }
    });

    // Real-time validation for password form
    const passwordInputs = document.querySelectorAll('#password-form input');
    passwordInputs.forEach(input => {
        if (input) {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => clearFieldError(input));
        }
    });
}

function validateField(input) {
    const value = input.value.trim();
    
    // Clear previous errors
    clearFieldError(input);
    
    // Email validation
    if (input.type === 'email' && value) {
        if (!isValidEmail(value)) {
            showFieldError(input.id, 'Please enter a valid email address');
            return false;
        }
    }
    
    // URL validation
    if (input.type === 'url' && value) {
        if (!isValidUrl(value)) {
            showFieldError(input.id, 'Please enter a valid URL');
            return false;
        }
    }
    
    // Required field validation
    if (input.required && !value) {
        showFieldError(input.id, 'This field is required');
        return false;
    }
    
    // Password confirmation validation
    if (input.id === 'new-password-confirm') {
        const newPassword = document.getElementById('new-password').value;
        if (value && value !== newPassword) {
            showFieldError(input.id, 'Passwords do not match');
            return false;
        }
    }
    
    // Success state
    if (value) {
        showFieldSuccess(input.id);
    }
    return true;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const feedback = field.parentNode.querySelector('.input-feedback');
    
    field.classList.add('error');
    field.classList.remove('success');
    
    if (feedback) {
        feedback.textContent = message;
        feedback.classList.add('error');
        feedback.classList.remove('success');
    }
}

function showFieldSuccess(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const feedback = field.parentNode.querySelector('.input-feedback');
    
    field.classList.add('success');
    field.classList.remove('error');
    
    if (feedback) {
        feedback.textContent = '✓ Looks good!';
        feedback.classList.add('success');
        feedback.classList.remove('error');
    }
}

function clearFieldError(input) {
    const feedback = input.parentNode.querySelector('.input-feedback');
    
    input.classList.remove('error', 'success');
    
    if (feedback) {
        feedback.textContent = '';
        feedback.classList.remove('error', 'success');
    }
}


// PASSWORD STRENGTH


function initPasswordStrength() {
    const passwordInput = document.getElementById('new-password');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            updatePasswordStrength(password);
        });
    }
}

function updatePasswordStrength(password) {
    const strengthBars = document.querySelectorAll('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBars.length || !strengthText) return;
    
    // Reset bars
    strengthBars.forEach(bar => {
        bar.classList.remove('active', 'weak', 'medium', 'strong');
    });
    
    if (password.length === 0) {
        strengthText.textContent = 'Password strength';
        return;
    }
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score++;
    
    // Lowercase check
    if (/[a-z]/.test(password)) score++;
    
    // Number check
    if (/\d/.test(password)) score++;
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    // Update bars and text
    let strength = 'weak';
    let activeClass = 'weak';
    
    if (score >= 4) {
        strength = 'strong';
        activeClass = 'strong';
        strengthText.textContent = 'Strong password';
    } else if (score >= 2) {
        strength = 'medium';
        activeClass = 'medium';
        strengthText.textContent = 'Medium strength';
    } else {
        strengthText.textContent = 'Weak password';
    }
    
    // Activate bars based on score
    for (let i = 0; i < Math.min(score, 4); i++) {
        strengthBars[i].classList.add('active', activeClass);
    }
}

function clearPasswordStrength() {
    const strengthBars = document.querySelectorAll('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    strengthBars.forEach(bar => {
        bar.classList.remove('active', 'weak', 'medium', 'strong');
    });
    
    if (strengthText) {
        strengthText.textContent = 'Password strength';
    }
}


// AVATAR MODAL


function openAvatarModal() {
    const modal = document.getElementById('avatar-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Reset modal state
        const previewImg = document.getElementById('avatar-preview');
        if (previewImg && currentUser?.photo) {
            previewImg.src = currentUser.photo;
        }
    }
}

function closeAvatarModal() {
    const modal = document.getElementById('avatar-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Reset file inputs
        const fileInput = document.getElementById('avatar-file');
        const urlInput = document.getElementById('avatar-url-input');
        
        if (fileInput) fileInput.value = '';
        if (urlInput) urlInput.value = '';
    }
}

function previewAvatarFromUrl() {
    const url = document.getElementById('profile-avatar').value;
    if (url && isValidUrl(url)) {
        updateAvatarImages(url);
        showNotification('info', 'Preview Updated', 'Avatar preview updated. Save to apply changes.');
    } else {
        showNotification('error', 'Invalid URL', 'Please enter a valid image URL.');
    }
}

function previewAvatarFromModal() {
    const url = document.getElementById('avatar-url-input').value;
    const previewImg = document.getElementById('avatar-preview');
    
    if (url && isValidUrl(url) && previewImg) {
        previewImg.src = url;
        previewImg.dataset.urlPreview = url;
        showNotification('info', 'Preview Updated', 'Click "Save Avatar" to apply the changes.');
    } else {
        showNotification('error', 'Invalid URL', 'Please enter a valid image URL.');
    }
}

async function saveNewAvatar() {
    const previewImg = document.getElementById('avatar-preview');
    if (!previewImg) return;
    
    const newUrl = previewImg.dataset.uploadedUrl || previewImg.dataset.urlPreview || previewImg.src;
    
    if (!newUrl || newUrl === '/assets/images/default-avatar.jpg') {
        showNotification('error', 'No Image Selected', 'Please upload or enter an image URL first.');
        return;
    }
    
    try {
        // Update the main form
        const avatarInput = document.getElementById('profile-avatar');
        if (avatarInput) {
            avatarInput.value = newUrl;
        }
        
        // Update all avatar images
        updateAvatarImages(newUrl);
        
        // Close modal
        closeAvatarModal();
        
        showNotification('success', 'Avatar Updated', 'Your avatar has been updated! Remember to save your profile.');
        
    } catch (err) {
        console.error('Error saving avatar:', err);
        showNotification('error', 'Save Failed', 'Failed to save avatar. Please try again.');
    }
}


// UTILITY FUNCTIONS


function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const button = input.parentNode.querySelector('.password-toggle');
    const icon = button?.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    } else {
        input.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}

function resetProfileForm() {
    if (currentUser) {
        populateProfileData(currentUser);
        
        // Clear all field states
        const inputs = document.querySelectorAll('#profile-form input');
        inputs.forEach(input => clearFieldError(input));
        
        showNotification('info', 'Form Reset', 'All changes have been reset to original values.');
    }
}

function resetPasswordForm() {
    const form = document.getElementById('password-form');
    if (form) {
        form.reset();
        clearPasswordStrength();
        
        // Clear field states
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => clearFieldError(input));
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

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

function showNotification(type, title, message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: type,
            title: title,
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    } else {
        console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    }
}


// GLOBAL EXPORTS


// Make key functions globally available
window.initProfilePage = initProfilePage;
window.togglePassword = togglePassword;
window.openAvatarModal = openAvatarModal;
window.closeAvatarModal = closeAvatarModal;
window.resetProfileForm = resetProfileForm;
window.resetPasswordForm = resetPasswordForm;