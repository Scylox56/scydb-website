document.addEventListener('DOMContentLoaded', () => {
      AOS.init({
        duration: 600,
        easing: 'ease-out-quad',
        once: true,
        offset: 20
      });
      
      const passwordInput = document.getElementById('password');
      const passwordConfirmInput = document.getElementById('passwordConfirm');
      const strengthBar = document.getElementById('password-strength-bar');
      const passwordHint = document.getElementById('password-hint');
      const passwordMatch = document.getElementById('password-match');
      const passwordMismatch = document.getElementById('password-mismatch');
      
      // Password strength checker
      passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = checkPasswordStrength(password);
        
        strengthBar.className = 'password-strength-bar';
        
        if (password.length === 0) {
          strengthBar.style.width = '0%';
          passwordHint.textContent = 'Password must be at least 8 characters long';
          passwordHint.className = 'text-xs text-secondary mt-2';
        } else if (strength === 'weak') {
          strengthBar.classList.add('strength-weak');
          passwordHint.textContent = 'Weak password - try adding numbers or symbols';
          passwordHint.className = 'text-xs text-red-500 mt-2';
        } else if (strength === 'medium') {
          strengthBar.classList.add('strength-medium');
          passwordHint.textContent = 'Medium strength - good progress!';
          passwordHint.className = 'text-xs text-yellow-600 mt-2';
        } else if (strength === 'strong') {
          strengthBar.classList.add('strength-strong');
          passwordHint.textContent = 'Strong password!';
          passwordHint.className = 'text-xs text-green-600 mt-2';
        }
        
        checkPasswordMatch();
      });
      
      // Password confirmation checker
      passwordConfirmInput.addEventListener('input', checkPasswordMatch);
      
      function checkPasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = passwordConfirmInput.value;
        
        if (confirmPassword.length === 0) {
          passwordMatch.classList.add('hidden');
          passwordMismatch.classList.add('hidden');
        } else if (password === confirmPassword) {
          passwordMatch.classList.remove('hidden');
          passwordMismatch.classList.add('hidden');
        } else {
          passwordMatch.classList.add('hidden');
          passwordMismatch.classList.remove('hidden');
        }
      }
      
      function checkPasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.match(/[a-z]/)) score++;
        if (password.match(/[A-Z]/)) score++;
        if (password.match(/[0-9]/)) score++;
        if (password.match(/[^A-Za-z0-9]/)) score++;
        
        if (score < 3) return 'weak';
        if (score < 5) return 'medium';
        return 'strong';
      }
      
      // Ripple effect for reset button
      const resetBtn = document.querySelector('#reset-password-form button[type="submit"]');
      if(resetBtn) {
        resetBtn.addEventListener('click', function(e) {
          const rect = this.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const ripple = document.createElement('span');
          ripple.style.left = `${x}px`;
          ripple.style.top = `${y}px`;
          ripple.style.background = 'rgba(255,255,255,0.3)';
          ripple.style.transform = 'scale(0)';
          ripple.classList.add('ripple-effect', 'absolute', 'rounded-full', 'pointer-events-none');
          
          this.style.overflow = 'hidden';
          this.appendChild(ripple);
          
          setTimeout(() => {
            ripple.style.transform = 'scale(4)';
            ripple.style.opacity = '0';
          }, 10);
          
          setTimeout(() => {
            ripple.remove();
          }, 600);
        });
      }
    });