document.addEventListener('DOMContentLoaded', () => {
      AOS.init({
        duration: 600,
        easing: 'ease-out-quad',
        once: true,
        offset: 20
      });
      
      // Ripple effect for submit button
      const submitBtn = document.querySelector('#forgot-password-form button[type="submit"]');
      if(submitBtn) {
        submitBtn.addEventListener('click', function(e) {
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