const REPORT_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

async function renderReports(container) {

  container.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div class="page-title">
        <h2><i class="fas fa-file-alt" style="color:var(--primary); margin-right:8px;"></i>Salary Statement Report</h2>
        <p>Generate and print employee salary statements.</p>
      </div>
    </div>

    <!-- Report Form -->
    <div class="card" id="reportFormCard">
      <div class="card-header" style="border-bottom:1px solid var(--border); padding:16px 24px;">
        <h3 style="margin:0; font-size:15px; font-weight:600;">Salary Statement Report</h3>
      </div>
      <div class="card-body" style="padding:24px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr auto; gap:16px; align-items:end;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Employee Name</label>
            <select id="reportEmployeeSelect" class="form-input" style="padding:10px 14px;">
              <option value="">-- Select Employee --</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Year</label>
            <select id="reportYearSelect" class="form-input" style="padding:10px 14px;">
              <option value="">-- Select Year --</option>
            </select>
          </div>
          <button class="btn btn-primary" id="generateReportBtn" style="padding:10px 28px; height:44px; white-space:nowrap;">
            <i class="fas fa-file-invoice" style="margin-right:6px;"></i> Generate
          </button>
        </div>
      </div>
    </div>

    <!-- Report Output -->
    <div id="reportOutput" style="display:none; margin-top:20px;">
      <div style="display:flex; justify-content:flex-end; margin-bottom:12px;" id="reportActions">
        <button class="btn" id="printReportBtn" style="background:var(--primary); color:#fff; padding:10px 24px;">
          <i class="fas fa-print" style="margin-right:6px;"></i> Print
        </button>
      </div>
      <div id="salaryStatementPrint" class="card" style="padding:0; overflow:hidden;"></div>
    </div>

    <!-- Loading -->
    <div id="reportLoading" style="display:none; text-align:center; padding:60px;">
      <div class="spinner spinner-primary"></div>
      <p style="margin-top:12px; color:var(--text-muted);">Generating report...</p>
    </div>

    <!-- Error -->
    <div id="reportError" style="display:none;" class="auth-alert error"></div>
  `;

  // Populate employee list
  try {
    const empRes = await api.getAllEmployees();
    const select = document.getElementById('reportEmployeeSelect');
    if (empRes.success && empRes.data) {
      empRes.data
        .filter(e => e.isActive)
        .sort((a, b) => (a.userId?.name || '').localeCompare(b.userId?.name || ''))
        .forEach(emp => {
          const opt = document.createElement('option');
          opt.value = emp._id;
          opt.textContent = `${emp.userId?.name || 'Unknown'} (${emp.employeeCode})`;
          select.appendChild(opt);
        });
    }
  } catch (e) {
    console.error('Failed to load employees:', e);
  }

  // Populate year list — current year and 4 previous years
  const yearSelect = document.getElementById('reportYearSelect');
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 4; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }

  // Generate button
  document.getElementById('generateReportBtn').addEventListener('click', async () => {
    const employeeId = document.getElementById('reportEmployeeSelect').value;
    const year = document.getElementById('reportYearSelect').value;

    if (!employeeId || !year) {
      document.getElementById('reportError').style.display = 'block';
      document.getElementById('reportError').innerHTML = '<i class="fas fa-exclamation-circle"></i> Please select an employee and a year.';
      document.getElementById('reportOutput').style.display = 'none';
      return;
    }

    document.getElementById('reportError').style.display = 'none';
    document.getElementById('reportOutput').style.display = 'none';
    document.getElementById('reportLoading').style.display = 'block';

    try {
      const res = await api.getSalaryStatement(employeeId, year);
      if (res.success) {
        renderSalaryStatement(res.data);
        document.getElementById('reportOutput').style.display = 'block';
      }
    } catch (e) {
      document.getElementById('reportError').style.display = 'block';
      document.getElementById('reportError').innerHTML = `<i class="fas fa-exclamation-circle"></i> ${e.message}`;
    } finally {
      document.getElementById('reportLoading').style.display = 'none';
    }
  });

  // Print button
  document.getElementById('printReportBtn').addEventListener('click', () => {
    const printContent = document.getElementById('salaryStatementPrint').innerHTML;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Salary Statement Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
          .ss-container { max-width: 800px; margin: 0 auto; }
          .ss-header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #714B67; padding-bottom: 16px; }
          .ss-company { font-size: 20px; font-weight: 700; color: #714B67; margin-bottom: 4px; }
          .ss-title { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 6px; }
          .ss-subtitle { font-size: 11px; color: #666; }
          .ss-emp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 40px; margin-bottom: 20px; padding: 14px 0; border-bottom: 1px solid #e0e0e0; }
          .ss-emp-row { display: flex; gap: 8px; font-size: 12.5px; }
          .ss-emp-label { font-weight: 600; color: #555; min-width: 140px; }
          .ss-emp-value { color: #222; }
          .ss-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12.5px; }
          .ss-table th, .ss-table td { border: 1px solid #ddd; padding: 8px 12px; text-align: right; }
          .ss-table th { background: #f5f0f4; color: #714B67; font-weight: 600; text-align: center; }
          .ss-table td:first-child, .ss-table th:first-child { text-align: left; }
          .ss-section-row td { background: #faf5f9; font-weight: 700; color: #714B67; border-top: 2px solid #714B67; }
          .ss-total-row td { background: #714B67; color: #fff; font-weight: 700; font-size: 13px; }
          .ss-footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 12px; }
          @media print {
            body { padding: 10px; }
            @page { margin: 15mm; }
          }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  });
}

function renderSalaryStatement(data) {
  const { employee, year, components } = data;
  const fmt = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // Build the effective-from date (Jan of report year or joining date, whichever is later)
  const joiningDate = new Date(employee.joiningDate);
  const yearStart = new Date(year, 0, 1);
  const effectiveFrom = joiningDate > yearStart ? formatDate(joiningDate) : `01 Jan ${year}`;

  let earningsRows = '';
  components.earnings.forEach(e => {
    earningsRows += `
      <tr>
        <td style="padding-left:24px;">${e.label}</td>
        <td>${fmt(e.monthly)}</td>
        <td>${fmt(e.yearly)}</td>
      </tr>`;
  });

  let deductionRows = '';
  components.deductions.forEach(d => {
    deductionRows += `
      <tr>
        <td style="padding-left:24px;">${d.label}</td>
        <td>${fmt(d.monthly)}</td>
        <td>${fmt(d.yearly)}</td>
      </tr>`;
  });

  const html = `
    <div class="ss-container" style="padding:32px;">
      <!-- Header -->
      <div class="ss-header">
        <div class="ss-company">${employee.companyName}</div>
        <div class="ss-title">Salary Statement Report</div>
        <div class="ss-subtitle">Financial Year ${year}</div>
      </div>

      <!-- Employee Info -->
      <div class="ss-emp-grid">
        <div class="ss-emp-row">
          <span class="ss-emp-label">Employee Name</span>
          <span class="ss-emp-value">${employee.name}</span>
        </div>
        <div class="ss-emp-row">
          <span class="ss-emp-label">Date Of Joining</span>
          <span class="ss-emp-value">${formatDate(employee.joiningDate)}</span>
        </div>
        <div class="ss-emp-row">
          <span class="ss-emp-label">Designation</span>
          <span class="ss-emp-value">${employee.designation}</span>
        </div>
        <div class="ss-emp-row">
          <span class="ss-emp-label">Salary Effective From</span>
          <span class="ss-emp-value">${effectiveFrom}</span>
        </div>
        <div class="ss-emp-row">
          <span class="ss-emp-label">Department</span>
          <span class="ss-emp-value">${employee.department}</span>
        </div>
        <div class="ss-emp-row">
          <span class="ss-emp-label">Employee Code</span>
          <span class="ss-emp-value">${employee.employeeCode}</span>
        </div>
      </div>

      <!-- Salary Components Table -->
      <table class="ss-table">
        <thead>
          <tr>
            <th style="width:45%;">Salary Components</th>
            <th style="width:27.5%;">Monthly Amount</th>
            <th style="width:27.5%;">Yearly Amount</th>
          </tr>
        </thead>
        <tbody>
          <!-- Earnings Section -->
          <tr class="ss-section-row">
            <td colspan="3">Earnings</td>
          </tr>
          ${earningsRows}
          <tr style="background:#faf5f9;">
            <td style="font-weight:600;">Total Earnings</td>
            <td style="font-weight:600;">${fmt(components.totalEarnings.monthly)}</td>
            <td style="font-weight:600;">${fmt(components.totalEarnings.yearly)}</td>
          </tr>

          <!-- Deductions Section -->
          <tr class="ss-section-row">
            <td colspan="3">Deduction</td>
          </tr>
          ${deductionRows}
          <tr style="background:#faf5f9;">
            <td style="font-weight:600;">Total Deductions</td>
            <td style="font-weight:600;">${fmt(components.totalDeductions.monthly)}</td>
            <td style="font-weight:600;">${fmt(components.totalDeductions.yearly)}</td>
          </tr>

          <!-- Net Salary -->
          <tr class="ss-total-row">
            <td>Net Salary</td>
            <td>${fmt(components.netSalary.monthly)}</td>
            <td>${fmt(components.netSalary.yearly)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Monthly Breakdown (if payslips exist) -->
      ${data.monthlyData.length > 0 ? renderMonthlyBreakdown(data) : `
        <div style="text-align:center; padding:24px; color:var(--text-muted); font-size:13px; border:1px dashed var(--border); border-radius:8px;">
          <i class="fas fa-info-circle" style="margin-right:6px;"></i>
          No processed payslips found for ${year}. The above values are calculated from the employee's current salary structure.
        </div>
      `}

      <!-- Footer -->
      <div class="ss-footer">
        Generated by EmPay HRMS &mdash; ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </div>
  `;

  document.getElementById('salaryStatementPrint').innerHTML = html;
}

function renderMonthlyBreakdown(data) {
  const fmt = (n) => '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  let rows = '';
  data.monthlyData.forEach(m => {
    const statusBadge = m.status === 'finalized'
      ? '<span style="background:#d4edda; color:#155724; padding:2px 8px; border-radius:4px; font-size:10px;">Finalized</span>'
      : '<span style="background:#fff3cd; color:#856404; padding:2px 8px; border-radius:4px; font-size:10px;">Draft</span>';

    rows += `
      <tr>
        <td>${REPORT_MONTHS[m.month - 1]}</td>
        <td>${fmt(m.basicPay)}</td>
        <td>${fmt(m.hra)}</td>
        <td>${fmt(m.allowances)}</td>
        <td>${fmt(m.grossSalary)}</td>
        <td>${fmt(m.totalDeductions)}</td>
        <td style="font-weight:600;">${fmt(m.netPay)}</td>
        <td style="text-align:center;">${statusBadge}</td>
      </tr>`;
  });

  // Totals row
  rows += `
    <tr class="ss-total-row">
      <td>Total</td>
      <td>${fmt(data.totals.totalBasic)}</td>
      <td>${fmt(data.totals.totalHRA)}</td>
      <td>${fmt(data.totals.totalAllowances)}</td>
      <td>${fmt(data.totals.totalGross)}</td>
      <td>${fmt(data.totals.totalDeductions)}</td>
      <td>${fmt(data.totals.totalNet)}</td>
      <td></td>
    </tr>`;

  return `
    <h3 style="margin:24px 0 12px; font-size:14px; font-weight:600; color:var(--text-main);">
      <i class="fas fa-calendar-alt" style="color:var(--primary); margin-right:6px;"></i>Monthly Breakdown — ${data.year}
    </h3>
    <div style="overflow-x:auto;">
      <table class="ss-table" style="font-size:11.5px;">
        <thead>
          <tr>
            <th>Month</th>
            <th>Basic</th>
            <th>HRA</th>
            <th>Allowances</th>
            <th>Gross</th>
            <th>Deductions</th>
            <th>Net Pay</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
