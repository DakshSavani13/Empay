// Show alert in the login form
function showAlert(message, type = 'error') {
  const alertEl = document.getElementById('authAlert');
  if (alertEl) {
    alertEl.textContent = message;
    alertEl.className = `auth-alert ${type}`;
    alertEl.classList.remove('hidden');
    
    setTimeout(() => {
      alertEl.classList.add('hidden');
    }, 5000);
  }
}

// Toggle password visibility
function togglePassword(inputId, btnEl) {
  const input = document.getElementById(inputId);
  const icon = btnEl.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

// Handle login submission
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const showSignupLink = document.getElementById('showSignup');
  const showLoginLink = document.getElementById('showLogin');
  const switchToSignupText = document.getElementById('switchToSignupText');
  const switchToLoginText = document.getElementById('switchToLoginText');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const demoCreds = document.getElementById('demoCreds');

  if (showSignupLink && showLoginLink) {
    showSignupLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      switchToSignupText.classList.add('hidden');
      switchToLoginText.classList.remove('hidden');
      authTitle.textContent = 'Create Account';
      authSubtitle.textContent = 'Register your company on EmPay';
      demoCreds.classList.add('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      switchToLoginText.classList.add('hidden');
      switchToSignupText.classList.remove('hidden');
      authTitle.textContent = 'Welcome Back';
      authSubtitle.textContent = 'Sign in to your EmPay account';
      demoCreds.classList.remove('hidden');
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const companyName = document.getElementById('signupCompany').value;
      const name = document.getElementById('signupName').value;
      const email = document.getElementById('signupEmail').value;
      const phone = document.getElementById('signupPhone').value;
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('signupConfirmPassword').value;

      if (password !== confirmPassword) {
        return showAlert('Passwords do not match');
      }

      const btn = document.getElementById('signupBtn');
      const originalText = btn.innerHTML;

      try {
        btn.innerHTML = '<div class="spinner"></div>';
        btn.disabled = true;

        // Register new company (admin role for company creator)
        const response = await api.request('/auth/signup', {
          method: 'POST',
          body: { name, email, password, companyName, role: 'admin', phone }
        });

        if (response.success) {
          showAlert('Registration successful! Please sign in.', 'success');
          // Switch back to login
          showLoginLink.click();
          document.getElementById('loginEmail').value = response.data.loginId || email;
          document.getElementById('loginPassword').value = '';
        }
      } catch (error) {
        showAlert(error.message);
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const btn = document.getElementById('loginBtn');
      const originalText = btn.innerHTML;
      
      try {
        btn.innerHTML = '<div class="spinner"></div>';
        btn.disabled = true;
        
        const response = await api.login(email, password);
        
        if (response.success) {
          api.setToken(response.data.token);
          localStorage.setItem('empay_user', JSON.stringify(response.data));
          
          // Switch view
          document.getElementById('loginPage').classList.add('hidden');
          document.getElementById('appContainer').classList.remove('hidden');
          
          // Init app
          if (typeof initApp === 'function') {
            initApp(response.data);
          }
        }
      } catch (error) {
        showAlert(error.message);
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }
});
