async function renderDashboard(container) {
  if (currentUser.role === 'admin' || currentUser.role === 'hr_officer' || currentUser.role === 'payroll_officer') {
    try {
      const res = await api.getOverview();
      const stats = res.data;
      
      const roleLabel = {
        admin: 'Admin Dashboard',
        hr_officer: 'HR Dashboard',
        payroll_officer: 'Payroll Dashboard'
      }[currentUser.role] || 'Dashboard';
      
      const html = `
        <div class="page-header">
          <div class="page-title">
            <h2>${roleLabel}</h2>
            <p>Welcome back, ${currentUser.name}. Here's your system overview.</p>
          </div>
        </div>
        
        <div class="grid-4 mb-4">
          <div class="card stat-card" style="margin-bottom: 0;">
            <div class="stat-icon primary"><i class="fas fa-users"></i></div>
            <div class="stat-details">
              <h3>${stats.totalEmployees}</h3>
              <p>Total Employees</p>
            </div>
          </div>
          <div class="card stat-card" style="margin-bottom: 0;">
            <div class="stat-icon success"><i class="fas fa-user-check"></i></div>
            <div class="stat-details">
              <h3>${stats.presentToday}</h3>
              <p>Present Today</p>
            </div>
          </div>
          <div class="card stat-card" style="margin-bottom: 0;">
            <div class="stat-icon warning"><i class="fas fa-calendar-minus"></i></div>
            <div class="stat-details">
              <h3>${stats.pendingLeaves}</h3>
              <p>Pending Leaves</p>
            </div>
          </div>
          <div class="card stat-card" style="margin-bottom: 0;">
            <div class="stat-icon info"><i class="fas fa-money-check-alt"></i></div>
            <div class="stat-details">
              <h3 style="font-size: 1.25rem;">${stats.currentPayrun ? stats.currentPayrun.status.toUpperCase() : 'N/A'}</h3>
              <p>Current Payrun</p>
            </div>
          </div>
        </div>
        
        <div class="grid-2 gap-4">
          <div class="card h-100">
            <div class="card-header">
              <h3>Department Distribution</h3>
            </div>
            <div class="card-body d-flex align-center justify-center" style="min-height: 300px;">
              ${stats.departments && stats.departments.length > 0 ? `<canvas id="deptChart"></canvas>` : `<p class="text-muted">No department data available</p>`}
            </div>
          </div>
          <div class="card h-100">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="card-body d-flex" style="flex-direction: column; gap: 1rem;">
              ${currentUser.role !== 'payroll_officer' ? `
              <button class="btn btn-secondary d-flex align-center gap-3 w-100 p-3 justify-start" onclick="navigateTo('leave')" style="background: rgba(147, 51, 234, 0.05); border: 1px solid rgba(147, 51, 234, 0.2);">
                <div class="stat-icon primary" style="width: 40px; height: 40px; font-size: 1rem;"><i class="fas fa-calendar-alt"></i></div>
                <div class="text-left">
                  <div style="font-weight: 600; color: var(--text-main);">Leave Requests</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${stats.pendingLeaves} pending approval</div>
                </div>
              </button>` : ''}
              
              ${currentUser.role !== 'hr_officer' ? `
              <button class="btn btn-secondary d-flex align-center gap-3 w-100 p-3 justify-start" onclick="navigateTo('payroll')" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2);">
                <div class="stat-icon success" style="width: 40px; height: 40px; font-size: 1rem;"><i class="fas fa-money-check-alt"></i></div>
                <div class="text-left">
                  <div style="font-weight: 600; color: var(--text-main);">Payroll Management</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${stats.currentPayrun ? stats.currentPayrun.status : 'No active payrun'}</div>
                </div>
              </button>` : ''}
              
              <button class="btn btn-secondary d-flex align-center gap-3 w-100 p-3 justify-start" onclick="navigateTo('attendance')" style="background: var(--bg-alt); border: 1px solid var(--border-color);">
                <div class="stat-icon info" style="width: 40px; height: 40px; font-size: 1rem;"><i class="fas fa-clock"></i></div>
                <div class="text-left">
                  <div style="font-weight: 600; color: var(--text-main);">Attendance Logs</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${stats.presentToday} checked in today</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      `;
      
      container.innerHTML = html;
      
      if (stats.departments && stats.departments.length > 0) {
        const ctx = document.getElementById('deptChart').getContext('2d');
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: stats.departments.map(d => d._id || 'Unassigned'),
            datasets: [{
              data: stats.departments.map(d => d.count),
              backgroundColor: [
                '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
                '#8b5cf6', '#0ea5e9', '#ec4899', '#14b8a6'
              ],
              borderWidth: 0,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim() || '#e2e8f0',
                  font: { family: 'Inter', size: 12 }
                }
              }
            },
            cutout: '70%'
          }
        });
      }
      
    } catch (error) {
      container.innerHTML = `<div class="auth-alert error"><i class="fas fa-exclamation-circle"></i> ${error.message}</div>`;
    }
  } else {
    // Employee view
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Welcome, ${currentUser.name}</h2>
          <p>Here is your quick overview for today.</p>
        </div>
      </div>
      
      <div class="grid-3 mb-4">
        <div class="card hover-card" onclick="navigateTo('attendance')">
          <div class="card-body text-center p-5">
            <div class="stat-icon primary mx-auto mb-3" style="width: 64px; height: 64px; font-size: 1.5rem;"><i class="fas fa-clock"></i></div>
            <h3 class="mb-1">Attendance</h3>
            <p class="text-muted" style="font-size: 0.875rem;">Check in/out & view logs</p>
          </div>
        </div>
        <div class="card hover-card" onclick="navigateTo('leave')">
          <div class="card-body text-center p-5">
            <div class="stat-icon success mx-auto mb-3" style="width: 64px; height: 64px; font-size: 1.5rem;"><i class="fas fa-calendar-alt"></i></div>
            <h3 class="mb-1">Leave</h3>
            <p class="text-muted" style="font-size: 0.875rem;">Apply & track requests</p>
          </div>
        </div>
        <div class="card hover-card" onclick="navigateTo('payroll')">
          <div class="card-body text-center p-5">
            <div class="stat-icon warning mx-auto mb-3" style="width: 64px; height: 64px; font-size: 1.5rem;"><i class="fas fa-file-invoice-dollar"></i></div>
            <h3 class="mb-1">Payslips</h3>
            <p class="text-muted" style="font-size: 0.875rem;">View & download salary</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Add a helper style class dynamically for hoverable cards if not present
if (!document.getElementById('dashboard-styles')) {
  const style = document.createElement('style');
  style.id = 'dashboard-styles';
  style.textContent = `
    .hover-card {
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .hover-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-lg);
      border-color: var(--primary-color);
    }
    .w-100 { width: 100%; }
    .h-100 { height: 100%; }
    .mx-auto { margin-left: auto; margin-right: auto; }
  `;
  document.head.appendChild(style);
}
