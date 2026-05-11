async function renderSettings(container) {
  try {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>User Settings & Roles</h2>
          <p>Manage access control and assign organizational roles to users.</p>
        </div>
      </div>

      <div class="grid-2" style="grid-template-columns: 1fr 3fr; gap: 1.5rem;">
        <div>
          <div class="card h-100" style="margin-bottom: 0;">
            <div class="card-header">
              <h3>Information</h3>
            </div>
            <div class="card-body">
              <p class="text-muted mb-3" style="font-size: 0.875rem;">
                Administrators can assign system access rights based on organizational hierarchy.
              </p>
              <ul class="mb-4 text-muted" style="font-size: 0.875rem; padding-left: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                <li>Access rights restrict module visibility.</li>
                <li>Changes take effect immediately upon saving.</li>
                <li>Ensure at least one active Administrator remains.</li>
              </ul>
              
              <div class="p-3" style="background: var(--primary-light); border-radius: var(--border-radius-sm); border-left: 3px solid var(--primary-color);">
                <div style="font-weight: 600; color: var(--primary-color); margin-bottom: 0.25rem; font-size: 0.875rem;">Available Roles</div>
                <div class="d-flex flex-column gap-1 text-muted" style="font-size: 0.75rem;">
                  <div>• Admin (Full Access)</div>
                  <div>• HR Officer (People & Leave)</div>
                  <div>• Payroll Officer (Finance Only)</div>
                  <div>• Employee (Self-Service)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="card h-100" style="margin-bottom: 0;">
            <div class="card-header d-flex justify-between align-center">
              <h3>System Users</h3>
              <div class="search-box" style="position: relative; width: 250px;">
                <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                <input type="text" class="form-control" id="settingsSearchUser" placeholder="Search users..." style="padding-left: 35px; height: 36px;">
              </div>
            </div>
            <div class="table-responsive">
              <table class="data-table" id="usersTable">
                <thead>
                  <tr>
                    <th>User Profile</th>
                    <th>Login ID</th>
                    <th>Role Assignment</th>
                  </tr>
                </thead>
                <tbody id="usersTableBody">
                  <tr>
                    <td colspan="3" class="text-center p-4">
                      <div class="spinner"></div>
                      <p class="text-muted mt-2">Loading users...</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    const res = await api.getAllUsers();
    let users = res.data;

    const tbody = container.querySelector('#usersTableBody');
    const searchInput = container.querySelector('#settingsSearchUser');

    const roleOptions = [
      { value: 'employee', label: 'Employee' },
      { value: 'hr_officer', label: 'HR Officer' },
      { value: 'payroll_officer', label: 'Payroll Officer' },
      { value: 'admin', label: 'Administrator' }
    ];

    function renderUsers(usersToRender) {
      tbody.innerHTML = '';
      if (usersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted p-5">No users found.</td></tr>';
        return;
      }

      usersToRender.forEach(user => {
        const loginId = user.employeeId ? user.employeeId.employeeCode : 'N/A';
        const initials = user.name.substring(0, 2).toUpperCase();
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div class="d-flex align-center gap-3">
              <div class="user-avatar-sm d-flex align-center justify-center" style="background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--primary-color); font-weight: 600; width: 36px; height: 36px; border-radius: 50%;">
                ${initials}
              </div>
              <div>
                <div style="font-weight: 600; color: var(--text-main);">${user.name}</div>
                <div class="text-muted" style="font-size: 0.75rem;">${user.email}</div>
              </div>
            </div>
          </td>
          <td style="font-family: monospace; color: var(--text-muted);">${loginId}</td>
          <td>
            <div class="form-group mb-0" style="width: 200px;">
              <select class="form-control role-select" data-user-id="${user._id}">
                ${roleOptions.map(r => `<option value="${r.value}" ${user.role === r.value ? 'selected' : ''}>${r.label}</option>`).join('')}
              </select>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Add event listeners for role changes
      const roleSelects = container.querySelectorAll('.role-select');
      roleSelects.forEach(select => {
        select.addEventListener('change', async (e) => {
          const userId = e.target.dataset.userId;
          const newRole = e.target.value;
          const originalValue = Array.from(e.target.options).find(opt => opt.defaultSelected)?.value || 'employee';

          try {
            e.target.disabled = true;
            // Provide visual feedback
            e.target.style.opacity = '0.5';
            
            await api.updateUserRole(userId, newRole);
            
            // Update the defaultSelected
            Array.from(e.target.options).forEach(opt => {
              if (opt.value === newRole) opt.defaultSelected = true;
              else opt.defaultSelected = false;
            });
            
            // Show toast
            showToast('User role updated successfully', 'success');
          } catch (error) {
            showToast('Failed to update role: ' + error.message, 'danger');
            e.target.value = originalValue;
          } finally {
            e.target.disabled = false;
            e.target.style.opacity = '1';
          }
        });
      });
    }

    renderUsers(users);

    // Filter functionality
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = users.filter(u => 
          u.name.toLowerCase().includes(term) || 
          u.email.toLowerCase().includes(term) ||
          (u.employeeId && u.employeeId.employeeCode.toLowerCase().includes(term))
        );
        renderUsers(filtered);
      });
    }

  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="stat-icon danger mb-3" style="width: 64px; height: 64px; font-size: 2rem; margin: 0 auto;"><i class="fas fa-exclamation-triangle"></i></div>
        <h3 class="mb-2">Error Loading Settings</h3>
        <p class="text-muted mb-4">${error.message}</p>
        <button class="btn btn-primary" onclick="renderSettings(document.getElementById('contentArea'))">
          <i class="fas fa-sync"></i> Try Again
        </button>
      </div>
    `;
  }
}

// Using the showToast from payroll.js or recreating here if needed globally
if (typeof showToast !== 'function') {
  window.showToast = function(message, type = 'success') {
    const existing = document.getElementById('global-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      padding:14px 20px; border-radius:var(--border-radius); font-size:0.875rem; font-weight:500;
      background:${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
      color:white; box-shadow:var(--shadow-lg);
      display:flex; align-items:center; gap:10px;
      animation: slideInToast 0.3s ease;
      max-width:360px;
    `;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, 4000);
  };
}
