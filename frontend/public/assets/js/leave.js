async function renderLeave(container) {
  if (currentUser.role === 'employee') {
    try {
      const res = await api.getMyLeaves();
      const { leaves, allocation } = res.data;
      
      const casualAvailable = allocation.casual.total - allocation.casual.used;
      const sickAvailable = allocation.sick.total - allocation.sick.used;
      
      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Time Off</h2>
            <p>Manage your leave requests and balances</p>
          </div>
          <button class="btn btn-primary" onclick="showApplyLeaveModal()"><i class="fas fa-plus"></i> New Request</button>
        </div>
        
        <div class="grid-2 mb-4" style="max-width: 600px;">
          <div class="card stat-card">
            <div class="stat-icon info"><i class="fas fa-calendar-check"></i></div>
            <div class="stat-details">
              <h3>${casualAvailable}</h3>
              <p>Paid Time Off Available</p>
            </div>
          </div>
          <div class="card stat-card">
            <div class="stat-icon warning"><i class="fas fa-briefcase-medical"></i></div>
            <div class="stat-details">
              <h3>${sickAvailable}</h3>
              <p>Sick Time Off Available</p>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3>Recent Requests</h3>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Time off Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${leaves.map(l => {
                  let statusClass = 'badge-secondary';
                  if(l.status === 'approved') statusClass = 'badge-success';
                  else if(l.status === 'rejected') statusClass = 'badge-danger';
                  else if(l.status === 'pending') statusClass = 'badge-warning';

                  return `
                  <tr>
                    <td><strong>${currentUser.name}</strong></td>
                    <td>${new Date(l.startDate).toLocaleDateString('en-GB')}</td>
                    <td>${new Date(l.endDate).toLocaleDateString('en-GB')}</td>
                    <td class="text-info" style="font-weight: 500;">${getFriendlyLeaveName(l.leaveType)}</td>
                    <td><span class="badge ${statusClass}" style="text-transform: capitalize;">${l.status}</span></td>
                  </tr>
                `}).join('') || '<tr><td colspan="5" class="text-center text-muted py-4">No time off requests found</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
      
      // Inject Modal
      if(!document.getElementById('applyLeaveModal')) {
        const modalHtml = `
          <div id="applyLeaveModal" class="modal">
            <div class="modal-content">
              <div class="modal-header">
                <h3>Time Off Request</h3>
                <button class="close-modal" onclick="closeModal('applyLeaveModal')">&times;</button>
              </div>
              <div class="modal-body">
                <form id="applyLeaveForm">
                  <div class="form-group grid-2">
                    <label>Employee</label>
                    <div style="font-weight: 600;">${currentUser.name}</div>
                  </div>
                  
                  <div class="form-group grid-2">
                    <label>Time off Type</label>
                    <select id="leaveType" class="form-control" required>
                      <option value="casual">Paid time off</option>
                      <option value="sick">Sick time off</option>
                      <option value="earned">Unpaid Leaves</option>
                    </select>
                  </div>
                  
                  <div class="form-group grid-2">
                    <label>Validity Period</label>
                    <div class="d-flex align-center gap-2">
                      <input type="date" id="leaveStart" class="form-control" required onchange="calculateDays()">
                      <span>to</span>
                      <input type="date" id="leaveEnd" class="form-control" required onchange="calculateDays()">
                    </div>
                  </div>
                  
                  <div class="form-group grid-2">
                    <label>Duration</label>
                    <div class="d-flex align-center gap-2">
                      <span id="allocationDays" style="font-weight: 600; font-size: 1.1rem; color: var(--primary-color);">0.00</span>
                      <span class="text-muted">Days</span>
                    </div>
                  </div>
                  
                  <div class="form-group grid-2 align-start">
                    <label>Note</label>
                    <textarea id="leaveReason" class="form-control" rows="3" required></textarea>
                  </div>
                  
                  <div class="form-group grid-2">
                    <label>Attachment</label>
                    <div class="d-flex align-center gap-2">
                      <button type="button" class="btn btn-secondary btn-icon"><i class="fas fa-upload"></i></button>
                      <span class="text-muted" style="font-size: 0.75rem;">(For sick leave certificate)</span>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('applyLeaveModal')">Discard</button>
                <button class="btn btn-primary" onclick="submitLeave()">Submit Request</button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
      }
    } catch(e) { container.innerHTML = `<div class="auth-alert error">${e.message}</div>`; }
  } else {
    // Admin View
    try {
      const res = await api.getAllLeaves();
      const leaves = res.data;
      
      const empsRes = await api.getAllEmployees();
      const employees = empsRes.data;
      
      window.allEmployeesList = employees;
      renderAdminList(container, leaves);
    } catch(e) { container.innerHTML = `<div class="auth-alert error">${e.message}</div>`; }
  }
}

function renderAdminList(container, leaves) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2>Time Off Approvals</h2>
        <p>Review and manage employee leave requests</p>
      </div>
      <button class="btn btn-primary" onclick="showAdminNewForm()"><i class="fas fa-plus"></i> New Allocation</button>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3>All Requests</h3>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Time off Type</th>
              <th>Days</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${leaves.map(l => {
              let statusClass = 'badge-secondary';
              if(l.status === 'approved') statusClass = 'badge-success';
              else if(l.status === 'rejected') statusClass = 'badge-danger';
              else if(l.status === 'pending') statusClass = 'badge-warning';

              return `
              <tr>
                <td><strong>${l.employeeId?.userId?.name || 'Unknown'}</strong></td>
                <td>${new Date(l.startDate).toLocaleDateString('en-GB')}</td>
                <td>${new Date(l.endDate).toLocaleDateString('en-GB')}</td>
                <td class="text-info" style="font-weight: 500;">${getFriendlyLeaveName(l.leaveType)}</td>
                <td>${l.totalDays}</td>
                <td><span class="badge ${statusClass}" style="text-transform: capitalize;">${l.status}</span></td>
                <td>
                  ${l.status === 'pending' ? `
                    <div class="d-flex gap-2">
                      <button class="btn btn-success btn-icon" title="Approve" onclick="processLeave('${l._id}', 'approve')"><i class="fas fa-check"></i></button>
                      <button class="btn btn-danger btn-icon" title="Reject" onclick="processLeave('${l._id}', 'reject')"><i class="fas fa-times"></i></button>
                    </div>
                  ` : '-'}
                </td>
              </tr>
            `}).join('') || '<tr><td colspan="7" class="text-center text-muted py-4">No leave requests found</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function showAdminNewForm() {
  const container = document.getElementById('contentArea');
  const employees = window.allEmployeesList || [];
  
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h2>Time Off Allocation</h2>
        <p>Allocate time off balances for employees</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-secondary" onclick="renderLeave(document.getElementById('contentArea'))">Back to List</button>
        <button class="btn btn-primary" onclick="submitAdminAllocation()"><i class="fas fa-save"></i> Save Allocation</button>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body" style="max-width: 600px;">
        <div class="form-group grid-2">
          <label>Employee</label>
          <select id="adminEmployee" class="form-control">
            ${employees.map(e => `<option value="${e._id}">${e.userId?.name || 'Unknown'}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group grid-2">
          <label>Time off Type</label>
          <select id="adminLeaveType" class="form-control">
            <option value="casual">Paid time off</option>
            <option value="sick">Sick time off</option>
            <option value="earned">Unpaid Leaves</option>
          </select>
        </div>
        
        <div class="form-group grid-2">
          <label>Validity Period</label>
          <div class="d-flex align-center gap-2">
            <input type="date" id="adminLeaveStart" class="form-control">
            <span>to</span>
            <input type="date" id="adminLeaveEnd" class="form-control">
          </div>
        </div>
        <div class="form-group grid-2">
          <label></label>
          <label class="d-flex align-center gap-2" style="font-weight: normal; cursor: pointer;">
            <input type="checkbox" id="noLimitCheck" onchange="toggleNoLimit()"> No End Date Limit
          </label>
        </div>
        
        <div class="form-group grid-2">
          <label>Allocation Days</label>
          <div class="d-flex align-center gap-2">
            <input type="number" id="adminAllocationDays" class="form-control" value="24" style="width: 100px;">
            <span class="text-muted">Days</span>
          </div>
        </div>
        
        <div class="form-group grid-2 align-start">
          <label>Note / Description</label>
          <input type="text" id="adminLeaveReason" class="form-control">
        </div>
      </div>
    </div>
  `;
}

function getFriendlyLeaveName(type) {
  const map = { casual: 'Paid time off', sick: 'Sick time off', earned: 'Unpaid Leaves' };
  return map[type] || type;
}

function calculateDays() {
  const start = document.getElementById('leaveStart').value;
  const end = document.getElementById('leaveEnd').value;
  if(start && end) {
    const s = new Date(start);
    const e = new Date(end);
    let days = 0;
    let cur = new Date(s);
    while(cur <= e) {
      if(cur.getDay() !== 0) days++; // Skip Sundays
      cur.setDate(cur.getDate() + 1);
    }
    document.getElementById('allocationDays').innerText = Math.max(0, days).toFixed(2);
  }
}

function toggleNoLimit() {
  const isChecked = document.getElementById('noLimitCheck').checked;
  const endInput = document.getElementById('adminLeaveEnd');
  if (isChecked) {
    endInput.value = '';
    endInput.disabled = true;
  } else {
    endInput.disabled = false;
  }
}

function showApplyLeaveModal() {
  document.getElementById('applyLeaveModal').classList.add('active');
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('leaveStart').min = today;
  document.getElementById('leaveEnd').min = today;
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

async function submitLeave() {
  const data = {
    leaveType: document.getElementById('leaveType').value,
    startDate: document.getElementById('leaveStart').value,
    endDate: document.getElementById('leaveEnd').value,
    reason: document.getElementById('leaveReason').value
  };
  
  if(!data.startDate || !data.endDate || !data.reason) return alert('Please fill all required fields');
  
  try {
    await api.applyLeave(data);
    closeModal('applyLeaveModal');
    renderLeave(document.getElementById('contentArea'));
  } catch(e) { alert(e.message); }
}

async function submitAdminAllocation() {
  const employeeId = document.getElementById('adminEmployee').value;
  const leaveType = document.getElementById('adminLeaveType').value;
  const days = parseFloat(document.getElementById('adminAllocationDays').value);
  
  if(!employeeId || isNaN(days)) return alert('Please provide employee and allocation days');
  
  const payload = {
    employeeId,
    year: new Date().getFullYear(),
  };
  payload[leaveType] = days;
  
  try {
    await api.allocateLeave(payload);
    alert('Leave allocation saved successfully!');
    renderLeave(document.getElementById('contentArea'));
  } catch(e) { alert(e.message); }
}

async function processLeave(id, action) {
  if(!confirm(`Are you sure you want to ${action} this leave?`)) return;
  try {
    if(action === 'approve') await api.approveLeave(id);
    else await api.rejectLeave(id, 'Rejected by admin');
    renderLeave(document.getElementById('contentArea'));
  } catch(e) { alert(e.message); }
}
