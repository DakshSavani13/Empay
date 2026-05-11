// Global App State
let currentUser = null;

const NavConfig = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-pie' },
    { id: 'attendance', label: 'Attendance', icon: 'fas fa-clock' },
    { id: 'leave', label: 'Leave Requests', icon: 'fas fa-calendar-alt' },
    { id: 'payroll', label: 'Payroll Management', icon: 'fas fa-money-check-alt' },
    { id: 'employees', label: 'Employees', icon: 'fas fa-users' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-file-alt' },
    { id: 'profile', label: 'My Profile', icon: 'fas fa-user-circle' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' }
  ],
  hr_officer: [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-pie' },
    { id: 'attendance', label: 'Attendance', icon: 'fas fa-clock' },
    { id: 'leave', label: 'Leave Requests', icon: 'fas fa-calendar-alt' },
    { id: 'employees', label: 'Employees', icon: 'fas fa-users' },
    { id: 'profile', label: 'My Profile', icon: 'fas fa-user-circle' }
  ],
  payroll_officer: [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-pie' },
    { id: 'attendance', label: 'Attendance Logs', icon: 'fas fa-clock' },
    { id: 'payroll', label: 'Payruns', icon: 'fas fa-money-check-alt' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-file-alt' },
    { id: 'profile', label: 'My Profile', icon: 'fas fa-user-circle' }
  ],
  employee: [
    { id: 'attendance', label: 'My Attendance', icon: 'fas fa-clock' },
    { id: 'leave', label: 'My Leaves', icon: 'fas fa-calendar-alt' },
    { id: 'payroll', label: 'My Payslips', icon: 'fas fa-file-invoice-dollar' },
    { id: 'profile', label: 'My Profile', icon: 'fas fa-user-circle' }
  ]
};

// Page title map for breadcrumb consistency
const PageTitles = {
  dashboard: 'Dashboard',
  attendance: 'Attendance',
  leave: 'Leave Management',
  payroll: 'Payroll',
  employees: 'Employees',
  reports: 'Reports',
  profile: 'My Profile',
  settings: 'Settings'
};

function initApp(user) {
  currentUser = user;
  
  // Update header and sidebar user info
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserRole = document.getElementById('sidebarUserRole');
  const headerUserName = document.getElementById('headerUserName');
  const headerUserRole = document.getElementById('headerUserRole');

  if (sidebarUserName) sidebarUserName.textContent = user.name;
  if (sidebarUserRole) sidebarUserRole.textContent = user.role.replace('_', ' ');
  if (headerUserName) headerUserName.textContent = user.name;
  if (headerUserRole) headerUserRole.textContent = user.role.replace('_', ' ');
  
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const userAvatarSidebar = document.getElementById('userAvatarSidebar');
  const headerAvatar = document.getElementById('headerAvatar');
  
  if (userAvatarSidebar) userAvatarSidebar.textContent = initials;
  if (headerAvatar) headerAvatar.textContent = initials;

  // Build Navigation
  buildNavigation(user.role);
  
  // Set Date safely
  const headerDate = document.getElementById('headerDate');
  if (headerDate) {
    const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    headerDate.textContent = new Date().toLocaleDateString('en-US', dateOpts);
  }

  // Navigate to default route
  const defaultRoute = user.role === 'employee' ? 'attendance' : 'dashboard';
  navigateTo(defaultRoute);
}

function buildNavigation(role) {
  const navContainer = document.getElementById('sidebarNav');
  navContainer.innerHTML = '';
  
  const items = NavConfig[role] || NavConfig.employee;
  
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'nav-item';
    el.id = `nav-${item.id}`;
    el.onclick = () => navigateTo(item.id);
    el.innerHTML = `<i class="${item.icon}"></i><span>${item.label}</span>`;
    navContainer.appendChild(el);
  });
}

function navigateTo(route) {
  // Update active state in nav
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = document.getElementById(`nav-${route}`);
  if (activeNav) activeNav.classList.add('active');
  
  // Update breadcrumb (centralized — every page gets the right title)
  const title = PageTitles[route] || 'EmPay';
  document.getElementById('pageTitle').textContent = title;

  // Close mobile sidebar if open
  document.getElementById('sidebar').classList.remove('mobile-open');

  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = '<div class="empty-state"><div class="spinner spinner-primary"></div><p>Loading...</p></div>';

  // Route handling
  switch (route) {
    case 'dashboard':
      renderDashboard(contentArea);
      break;
    case 'attendance':
      renderAttendance(contentArea);
      break;
    case 'leave':
      renderLeave(contentArea);
      break;
    case 'payroll':
      renderPayroll(contentArea);
      break;
    case 'employees':
      renderEmployees(contentArea);
      break;
    case 'profile':
      loadAndRender(contentArea, 'renderProfile', 'assets/js/profile.js');
      break;
    case 'settings':
      loadAndRender(contentArea, 'renderSettings', 'assets/js/settings.js');
      break;
    case 'reports':
      loadAndRender(contentArea, 'renderReports', 'assets/js/reports.js');
      break;
    default:
      contentArea.innerHTML = '<div class="empty-state"><i class="fas fa-tools"></i><p>Page Under Construction</p></div>';
  }
}

/**
 * Dynamic script loader fallback
 * Ensures a module script is loaded before calling its render function
 */
function loadAndRender(contentArea, renderFnName, src) {
  if (typeof window[renderFnName] === 'function') {
    window[renderFnName](contentArea);
  } else {
    console.warn(`${renderFnName} not found, attempting to load ${src}...`);
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      if (typeof window[renderFnName] === 'function') {
        window[renderFnName](contentArea);
      } else {
        contentArea.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Component Error: ${renderFnName} failed to initialize.</p></div>`;
      }
    };
    script.onerror = () => {
      contentArea.innerHTML = `<div class="empty-state"><i class="fas fa-tools"></i><p>Resource Error: Failed to load ${src}.</p></div>`;
    };
    document.head.appendChild(script);
  }
}

// Handle logout
function handleLogout() {
  api.clearToken();
  currentUser = null;
  
  // Reset login form state
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if (loginForm) loginForm.reset();
  if (signupForm) signupForm.reset();
  
  // Ensure login form is shown (not signup)
  loginForm?.classList.remove('hidden');
  signupForm?.classList.add('hidden');
  document.getElementById('switchToSignupText')?.classList.remove('hidden');
  document.getElementById('switchToLoginText')?.classList.add('hidden');
  document.getElementById('demoCreds')?.classList.remove('hidden');
  document.getElementById('authTitle').textContent = 'Welcome Back';
  document.getElementById('authSubtitle').textContent = 'Sign in to your EmPay account';
  
  // Hide auth alert
  const alertEl = document.getElementById('authAlert');
  if (alertEl) alertEl.classList.add('hidden');
  
  // Toggle views
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('appContainer').classList.add('hidden');
}

// Sidebar toggle logic & initial auth check
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('sidebarToggle');
  const mobileToggleBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  // Handle Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Check initial auth state — validate token with server
  const savedUser = localStorage.getItem('empay_user');
  if (api.token && savedUser) {
    try {
      const user = JSON.parse(savedUser);
      
      // Show app immediately with cached user data for fast UX
      document.getElementById('loginPage').classList.add('hidden');
      document.getElementById('appContainer').classList.remove('hidden');
      initApp(user);

      // Then validate token in background — if invalid, force logout
      api.getMe().then(res => {
        if (res.success && res.data) {
          // Update cached user with fresh server data
          const freshUser = {
            _id: res.data._id,
            name: res.data.name,
            email: res.data.email,
            role: res.data.role,
            employeeId: res.data.employeeId
          };
          localStorage.setItem('empay_user', JSON.stringify(freshUser));
          
          // If role changed on server, reinitialize
          if (freshUser.role !== user.role) {
            initApp(freshUser);
          }
        }
      }).catch(() => {
        // Token is invalid or expired — force logout
        handleLogout();
      });
    } catch (e) {
      console.error('Invalid user data', e);
      api.clearToken();
    }
  }
});
