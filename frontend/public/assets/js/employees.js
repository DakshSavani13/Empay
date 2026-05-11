async function renderEmployees(container) {
  try {
    const res = await api.getAllEmployees();
    const employees = res.data;
    
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Employee Directory</h2>
          <p>Manage all company employees</p>
        </div>
        ${currentUser.role === 'admin' ? '<button class="btn btn-primary" id="addEmployeeBtn"><i class="fas fa-user-plus"></i> Add Employee</button>' : ''}
      </div>
      
      <div class="employee-grid">
        ${employees.length > 0 ? employees.map(e => {
          const initials = e.userId?.name ? e.userId.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
          
          let statusClass = 'badge-secondary';
          let statusText = 'Unknown';
          if(e.status === 'present') { statusClass = 'badge-success'; statusText = 'Present'; }
          else if(e.status === 'absent') { statusClass = 'badge-danger'; statusText = 'Absent'; }
          else if(e.status === 'on-leave') { statusClass = 'badge-warning'; statusText = 'On Leave'; }
          else if(e.status === 'half-day') { statusClass = 'badge-info'; statusText = 'Half Day'; }
          else if(e.status === 'weekend') { statusClass = 'badge-light'; statusText = 'Weekend'; }
          
          return `
            <div class="employee-card">
              <div class="employee-card-header">
                <div class="employee-avatar">${initials}</div>
                <div class="employee-status"><span class="badge ${statusClass}">${statusText}</span></div>
              </div>
              <div class="employee-card-body">
                <h3 class="employee-name">${e.userId ? e.userId.name : 'Unknown'}</h3>
                <p class="employee-designation">${e.designation}</p>
                <div class="employee-details">
                  <div class="detail-item">
                    <i class="fas fa-id-badge"></i> <span>${e.employeeCode}</span>
                  </div>
                  <div class="detail-item">
                    <i class="fas fa-building"></i> <span>${e.department}</span>
                  </div>
                  <div class="detail-item">
                    <i class="fas fa-envelope"></i> <span>${e.userId ? e.userId.email : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('') : '<div class="empty-state"><i class="fas fa-users"></i><p>No employees found</p></div>'}
      </div>

      <!-- Add Employee Modal -->
      <div id="addEmployeeModal" class="modal">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h2>Add New Employee</h2>
            <span class="close-modal">&times;</span>
          </div>
          <form id="addEmployeeForm">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div class="form-group">
                <label>Name</label>
                <input type="text" id="empName" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="empEmail" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" id="empPassword" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Role</label>
                <select id="empRole" class="form-control" required>
                  <option value="employee">Employee</option>
                  <option value="hr_officer">HR Officer</option>
                  <option value="payroll_officer">Payroll Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="form-group">
                <label>Department</label>
                <input type="text" id="empDept" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Designation</label>
                <input type="text" id="empDesignation" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Joining Date</label>
                <input type="date" id="empJoiningDate" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Basic Salary</label>
                <input type="number" id="empBasic" class="form-control" required>
              </div>
              <div class="form-group">
                <label>HRA</label>
                <input type="number" id="empHra" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Allowances</label>
                <input type="number" id="empAllowances" class="form-control" required>
              </div>
            </div>
            <div id="addEmpError" class="auth-alert error" style="display:none; margin-top: 15px;"></div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Register Employee</button>
          </form>
        </div>
      </div>
    `;

    // Modal Logic
    const addBtn = document.getElementById('addEmployeeBtn');
    const modal = document.getElementById('addEmployeeModal');
    const closeBtn = modal?.querySelector('.close-modal');
    const form = document.getElementById('addEmployeeForm');
    const errorDiv = document.getElementById('addEmpError');

    if (addBtn && modal) {
      addBtn.onclick = () => modal.classList.add('active');
      closeBtn.onclick = () => {
        modal.classList.remove('active');
        form.reset();
        errorDiv.style.display = 'none';
      };
      window.onclick = (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          form.reset();
          errorDiv.style.display = 'none';
        }
      };

      form.onsubmit = async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Registering...';
        submitBtn.disabled = true;

        try {
          const data = {
            name: document.getElementById('empName').value,
            email: document.getElementById('empEmail').value,
            password: document.getElementById('empPassword').value,
            role: document.getElementById('empRole').value,
            department: document.getElementById('empDept').value,
            designation: document.getElementById('empDesignation').value,
            joiningDate: document.getElementById('empJoiningDate').value,
            basicSalary: Number(document.getElementById('empBasic').value),
            hra: Number(document.getElementById('empHra').value),
            allowances: Number(document.getElementById('empAllowances').value)
          };
          
          await api.register(data);
          
          modal.classList.remove('active');
          form.reset();
          // Re-render
          renderEmployees(container);
        } catch (err) {
          errorDiv.textContent = err.message;
          errorDiv.style.display = 'block';
        } finally {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      };
    }
  } catch(e) {
    container.innerHTML = `<div class="auth-alert error">${e.message}</div>`;
  }
}
