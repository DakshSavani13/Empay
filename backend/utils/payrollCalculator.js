const { isWorkingDay } = require('./holidays');

/**
 * Calculate payroll for an employee
 * @param {Object} employee - Employee document
 * @param {Number} workingDays - Total working days in the month
 * @param {Number} presentDays - Days the employee was present
 * @param {Number} approvedLeaveDays - Days on approved leave
 */
function calculatePayroll(employee, workingDays, presentDays, approvedLeaveDays) {
  const basicPay = employee.basicSalary || 0;
  const hra = employee.hra || 0;
  const allowances = employee.allowances || 0;

  const grossSalary = basicPay + hra + allowances;

  // PF calculation: 12% of basic
  const pfPercent = parseFloat(process.env.PF_PERCENTAGE || 12);
  const employeePF = Math.round((basicPay * pfPercent) / 100);
  const employerPF = Math.round((basicPay * pfPercent) / 100);

  // Professional tax
  const professionalTax = parseFloat(process.env.PROFESSIONAL_TAX_MONTHLY || 200);

  // LOP calculation
  const paidDays = presentDays + approvedLeaveDays;
  const lopDays = Math.max(0, workingDays - paidDays);
  const dailyRate = workingDays > 0 ? basicPay / workingDays : 0;
  const lopDeduction = Math.round(lopDays * dailyRate);

  // Total deductions
  const totalDeductions = employeePF + professionalTax + lopDeduction;

  // Net pay
  const netPay = Math.max(0, grossSalary - totalDeductions);

  return {
    basicPay,
    hra,
    allowances,
    grossSalary,
    employeePF,
    employerPF,
    professionalTax,
    lopDays,
    lopDeduction,
    totalDeductions,
    netPay,
    workingDays,
    presentDays
  };
}

/**
 * Get total working days in a month (excluding weekends and holidays)
 */
function getWorkingDays(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (isWorkingDay(date)) {
      workingDays++;
    }
  }

  return workingDays;
}

module.exports = { calculatePayroll, getWorkingDays };
