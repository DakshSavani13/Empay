export const NavConfig = {
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

export const PageTitles = {
  dashboard: 'Dashboard',
  attendance: 'Attendance',
  leave: 'Leave Management',
  payroll: 'Payroll',
  employees: 'Employees',
  reports: 'Reports',
  profile: 'My Profile',
  settings: 'Settings'
};

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
