// ─── Payroll Module ───────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

async function renderPayroll(container) {
  if (currentUser.role === 'employee') {
    await renderMyPayslips(container);
  } else {
    await renderAdminPayroll(container);
  }
}

// ─── Employee: My Payslips ────────────────────────────────────────────────────
async function renderMyPayslips(container) {
  container.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Loading payslips...</p></div>`;
  try {
    const res = await api.getMyPayslips();
    const payslips = res.data || [];

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>My Payslips</h2>
          <p>View and download your monthly salary statements</p>
        </div>
      </div>

      ${payslips.length === 0 ? `
        <div class="card p-5 text-center">
          <i class="fas fa-file-invoice-dollar" style="font-size:48px; color:var(--border-color); margin-bottom:16px;"></i>
          <h3 class="text-muted">No payslips available yet</h3>
          <p class="text-muted mt-2">Your payslips will appear here once your payroll is processed.</p>
        </div>
      ` : `
        <div class="grid-3 mb-4">
          ${payslips.map(p => `
            <div class="card">
              <div class="card-header justify-between">
                <div>
                  <h3 style="margin-bottom: 2px;">${MONTHS[p.month-1]} ${p.year}</h3>
                  <div class="text-muted" style="font-size: 0.75rem;">Payslip</div>
                </div>
                <span class="badge ${p.status === 'finalized' ? 'badge-success' : 'badge-warning'}">${p.status}</span>
              </div>
              <div class="card-body">
                <div style="font-size:2rem; font-weight:700; color:var(--primary-color); letter-spacing:-0.5px; margin-bottom:1.5rem;">
                  ₹${(p.netPay || 0).toLocaleString('en-IN')}
                  <span class="text-muted" style="font-size: 0.875rem; font-weight: 500;">net pay</span>
                </div>
                <div class="grid-2" style="background:var(--bg-alt); padding: 1rem; border-radius: var(--border-radius-sm); gap: 1rem;">
                  <div>
                    <div class="text-muted" style="font-size: 0.75rem; margin-bottom:0.25rem;">Gross Salary</div>
                    <div style="font-weight:600; color:var(--success-color);">₹${(p.grossSalary || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div class="text-muted" style="font-size: 0.75rem; margin-bottom:0.25rem;">Deductions</div>
                    <div style="font-weight:600; color:var(--danger-color);">-₹${(p.totalDeductions || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div class="text-muted" style="font-size: 0.75rem; margin-bottom:0.25rem;">Days Worked</div>
                    <div style="font-weight:600;">${p.daysWorked || 0} days</div>
                  </div>
                  <div>
                    <div class="text-muted" style="font-size: 0.75rem; margin-bottom:0.25rem;">Working Days</div>
                    <div style="font-weight:600;">${p.workingDays || 0} days</div>
                  </div>
                </div>
              </div>
              <div class="card-footer d-flex gap-2">
                <button class="btn btn-primary" style="flex:1;" onclick="viewPayslipDetail('${p._id}')">
                  <i class="fas fa-eye"></i> View Details
                </button>
                ${p.status === 'finalized' ? `
                <button class="btn btn-danger" style="flex:1;" onclick="downloadPdf('${p._id}')">
                  <i class="fas fa-file-pdf"></i> Download
                </button>` : `<button class="btn btn-secondary" style="flex:1;" disabled><i class="fas fa-clock"></i> Pending</button>`}
              </div>
            </div>
          `).join('')}
        </div>
      `}

      <!-- Payslip Detail Modal -->
      <div id="payslipDetailModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="payslipModalTitle">Payslip Details</h3>
            <button class="close-modal" onclick="document.getElementById('payslipDetailModal').classList.remove('active')">&times;</button>
          </div>
          <div id="payslipDetailContent" class="modal-body"></div>
        </div>
      </div>
    `;
  } catch(e) {
    container.innerHTML = `<div class="auth-alert error"><i class="fas fa-exclamation-circle"></i> ${e.message}</div>`;
  }
}

function viewPayslipDetail(id) {
  api.getPayslip(id).then(res => {
    const p = res.data;
    const modal = document.getElementById('payslipDetailModal');
    document.getElementById('payslipModalTitle').textContent = `Payslip — ${MONTHS[p.month-1]} ${p.year}`;
    document.getElementById('payslipDetailContent').innerHTML = `
      <div class="grid-2 mb-4">
        <div>
          <div class="text-muted mb-2" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Earnings</div>
          ${row('Basic Salary', p.basicSalary)}
          ${row('HRA', p.hra)}
          ${row('Special Allowance', p.specialAllowance)}
          ${row('Other Allowances', p.otherAllowances)}
          <div style="border-top:2px solid var(--border-color); margin-top:10px; padding-top:10px;">
            ${row('Gross Salary', p.grossSalary, 'var(--success-color)', true)}
          </div>
        </div>
        <div>
          <div class="text-muted mb-2" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Deductions</div>
          ${row('PF (Employee)', p.pf)}
          ${row('Professional Tax', p.professionalTax)}
          ${row('TDS', p.tds)}
          ${row('LOP Deduction', p.lopDeduction)}
          <div style="border-top:2px solid var(--border-color); margin-top:10px; padding-top:10px;">
            ${row('Total Deductions', p.totalDeductions, 'var(--danger-color)', true)}
          </div>
        </div>
      </div>
      <div style="background:linear-gradient(135deg, var(--primary-color), var(--accent-color)); color:white; padding: 1.5rem; border-radius: var(--border-radius); display:flex; justify-content:space-between; align-items:center; box-shadow: var(--shadow-md);">
        <div>
          <div style="font-size: 0.875rem; opacity:0.9;">Net Pay</div>
          <div style="font-size: 2rem; font-weight: 700;">₹${(p.netPay || 0).toLocaleString('en-IN')}</div>
        </div>
        <div class="text-right" style="font-size: 0.875rem; opacity:0.9;">
          <div>${MONTHS[p.month-1]} ${p.year}</div>
          <div class="mt-1">${p.daysWorked || 0} / ${p.workingDays || 0} days worked</div>
        </div>
      </div>
    `;
    modal.classList.add('active');
  }).catch(e => alert('Could not load payslip details: ' + e.message));
}

function row(label, val, color = 'var(--text-main)', bold = false) {
  return `<div class="d-flex justify-between py-1" style="border-bottom:1px solid var(--border-color);">
    <span class="text-muted">${label}</span>
    <span style="font-weight:${bold ? '700' : '500'}; color:${color};">₹${(val || 0).toLocaleString('en-IN')}</span>
  </div>`;
}

// ─── Admin / Payroll Officer View ─────────────────────────────────────────────
async function renderAdminPayroll(container) {
  container.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Loading...</p></div>`;
  try {
    const res = await api.getPayruns();
    const payruns = res.data || [];

    const totalProcessed = payruns.length;
    const finalized = payruns.filter(p => p.status === 'finalized').length;
    const latestNet = payruns[0] ? payruns[0].totalNet : 0;
    const latestEmp = payruns[0] ? payruns[0].totalEmployees : 0;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h2>Payroll Management</h2>
          <p>Process, review, and finalize employee payruns</p>
        </div>
        <button class="btn btn-primary" onclick="showGenerateModal()">
          <i class="fas fa-cogs"></i> Generate Payrun
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid-4 mb-4">
        <div class="card stat-card" style="margin-bottom: 0;">
          <div class="stat-icon primary"><i class="fas fa-layer-group"></i></div>
          <div class="stat-details">
            <h3>${totalProcessed}</h3>
            <p>Total Payruns</p>
          </div>
        </div>
        <div class="card stat-card" style="margin-bottom: 0;">
          <div class="stat-icon success"><i class="fas fa-check-circle"></i></div>
          <div class="stat-details">
            <h3>${finalized}</h3>
            <p>Finalized</p>
          </div>
        </div>
        <div class="card stat-card" style="margin-bottom: 0;">
          <div class="stat-icon warning"><i class="fas fa-users"></i></div>
          <div class="stat-details">
            <h3>${latestEmp}</h3>
            <p>Employees (Latest)</p>
          </div>
        </div>
        <div class="card stat-card" style="margin-bottom: 0;">
          <div class="stat-icon info"><i class="fas fa-rupee-sign"></i></div>
          <div class="stat-details">
            <h3>₹${latestNet > 0 ? (latestNet/100000).toFixed(1)+'L' : '0'}</h3>
            <p>Latest Net Payout</p>
          </div>
        </div>
      </div>

      <!-- Payruns Table -->
      <div class="card">
        <div class="card-header">
          <h3>Payrun History</h3>
        </div>
        ${payruns.length === 0 ? `
          <div class="p-5 text-center">
            <i class="fas fa-cogs" style="font-size:40px; color:var(--border-color); margin-bottom:12px;"></i>
            <p class="text-muted">No payruns generated yet. Click "Generate Payrun" to get started.</p>
          </div>
        ` : `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Employees</th>
                  <th>Gross Total</th>
                  <th>Deductions</th>
                  <th>Net Payout</th>
                  <th>Status</th>
                  <th>Processed By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${payruns.map(p => {
                  const isFinalized = p.status === 'finalized';
                  return `
                  <tr>
                    <td>
                      <div style="font-weight:600;">${MONTHS[p.month-1]} ${p.year}</div>
                      <div class="text-muted" style="font-size:0.75rem;">${new Date(p.processedAt || p.createdAt).toLocaleDateString('en-IN')}</div>
                    </td>
                    <td>${p.totalEmployees || 0}</td>
                    <td style="font-weight:600; color:var(--success-color);">₹${(p.totalGross || 0).toLocaleString('en-IN')}</td>
                    <td style="color:var(--danger-color);">₹${(p.totalDeductions || 0).toLocaleString('en-IN')}</td>
                    <td style="font-weight:700; color:var(--primary-color);">₹${(p.totalNet || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span class="badge ${isFinalized ? 'badge-success' : 'badge-warning'}">
                        ${isFinalized ? '✓ Finalized' : '⏳ Processing'}
                      </span>
                    </td>
                    <td class="text-muted">${p.processedBy?.name || 'System'}</td>
                    <td>
                      <div class="d-flex gap-2">
                        <button class="btn btn-secondary btn-icon" title="View" onclick="viewPayrunDetail('${p._id}', '${MONTHS[p.month-1]} ${p.year}')">
                          <i class="fas fa-eye"></i>
                        </button>
                        ${!isFinalized ? `
                        <button class="btn btn-success btn-icon" title="Finalize" onclick="finalizePayrun('${p._id}')">
                          <i class="fas fa-check"></i>
                        </button>` : ''}
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Generate Payrun Modal -->
      <div id="generatePayrunModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Generate Payrun</h3>
            <button class="close-modal" onclick="document.getElementById('generatePayrunModal').classList.remove('active')">&times;</button>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-4">
              This will calculate payroll for all active employees for the selected month and year.
            </p>
            <div class="form-group">
              <label class="form-label" for="payrunMonth">Month</label>
              <select id="payrunMonth" class="form-control">
                ${MONTHS.map((m,i) => `<option value="${i+1}" ${new Date().getMonth() === i ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="payrunYear">Year</label>
              <input type="number" id="payrunYear" class="form-control" value="${new Date().getFullYear()}" min="2020" max="2099">
            </div>
            <div id="generatePayrunError" class="auth-alert error"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('generatePayrunModal').classList.remove('active')">Cancel</button>
            <button class="btn btn-primary" id="generatePayrunBtn" onclick="submitGeneratePayrun()">
              <i class="fas fa-cogs"></i> Generate
            </button>
          </div>
        </div>
      </div>

      <!-- Payrun Detail Modal -->
      <div id="payrunDetailModal" class="modal modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="payrunDetailTitle">Payrun Details</h3>
            <button class="close-modal" onclick="document.getElementById('payrunDetailModal').classList.remove('active')">&times;</button>
          </div>
          <div id="payrunDetailContent" class="modal-body"></div>
        </div>
      </div>
    `;
  } catch(e) {
    container.innerHTML = `<div class="auth-alert error"><i class="fas fa-exclamation-circle"></i> ${e.message}</div>`;
  }
}

function showGenerateModal() {
  document.getElementById('generatePayrunModal').classList.add('active');
  document.getElementById('generatePayrunError').style.display = 'none';
}

async function submitGeneratePayrun() {
  const month = document.getElementById('payrunMonth').value;
  const year = document.getElementById('payrunYear').value;
  const btn = document.getElementById('generatePayrunBtn');
  const errDiv = document.getElementById('generatePayrunError');

  if (!month || !year || isNaN(year) || year < 2020) {
    errDiv.textContent = 'Please select a valid month and year.';
    errDiv.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  errDiv.style.display = 'none';

  try {
    const res = await api.generatePayrun(parseInt(month), parseInt(year));
    document.getElementById('generatePayrunModal').classList.remove('active');
    const contentArea = document.getElementById('contentArea');
    renderPayroll(contentArea);
    // Show success toast
    showToast(`Payrun for ${MONTHS[parseInt(month)-1]} ${year} generated for ${res.data.totalEmployees} employees.`, 'success');
  } catch(e) {
    errDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${e.message}`;
    errDiv.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-cogs"></i> Generate';
  }
}

async function viewPayrunDetail(payrunId, label) {
  const modal = document.getElementById('payrunDetailModal');
  const content = document.getElementById('payrunDetailContent');
  document.getElementById('payrunDetailTitle').textContent = `Payrun — ${label}`;
  content.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Loading payslips...</p></div>`;
  modal.classList.add('active');

  try {
    const parts = label.split(' ');
    const mIdx = MONTHS.indexOf(parts[0]) + 1;
    const y = parseInt(parts[1]);
    const res = await api.getPayslips(mIdx, y);
    const payslips = res.data || [];

    if (payslips.length === 0) {
      content.innerHTML = `<p class="text-muted text-center p-5">No payslips found for this period.</p>`;
      return;
    }

    content.innerHTML = `
      <div class="mb-3 text-muted">Showing ${payslips.length} payslip(s) for ${label}</div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Gross</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Days</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${payslips.map(p => `
              <tr>
                <td>
                  <div style="font-weight:600;">${p.employeeId?.userId?.name || 'N/A'}</div>
                  <div class="text-muted" style="font-size:0.75rem;">${p.employeeId?.employeeCode || ''}</div>
                </td>
                <td style="color:var(--success-color); font-weight:600;">₹${(p.grossSalary||0).toLocaleString('en-IN')}</td>
                <td style="color:var(--danger-color);">₹${(p.totalDeductions||0).toLocaleString('en-IN')}</td>
                <td style="font-weight:700; color:var(--primary-color);">₹${(p.netPay||0).toLocaleString('en-IN')}</td>
                <td>${p.daysWorked||0}/${p.workingDays||0}</td>
                <td><span class="badge ${p.status==='finalized'?'badge-success':'badge-warning'}">${p.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch(e) {
    content.innerHTML = `<div class="auth-alert error">${e.message}</div>`;
  }
}

async function finalizePayrun(id) {
  if (!confirm('Finalize this payrun? Payslips will become visible to all employees and notification emails will be sent.')) return;
  try {
    await api.finalizePayrun(id);
    renderPayroll(document.getElementById('contentArea'));
    showToast('Payrun finalized. Employees have been notified.', 'success');
  } catch(e) {
    alert('Failed to finalize: ' + e.message);
  }
}

async function downloadPdf(id) {
  try {
    const res = await api.downloadPayslip(id);
    if (res.success && res.blob) {
      const url = window.URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Payslip.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
  } catch(e) {
    alert('Download failed: ' + e.message);
  }
}

function showToast(message, type = 'success') {
  const existing = document.getElementById('payroll-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'payroll-toast';
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

  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `@keyframes slideInToast { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }`;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, 4000);
}
