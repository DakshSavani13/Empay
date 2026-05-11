const Employee = require('../models/Employee');
const User = require('../models/User');
const Payslip = require('../models/Payslip');

// @desc    Get Salary Statement Report for an employee for a given year
// @route   GET /api/reports/salary-statement?employeeId=xxx&year=2025
// @access  Admin, Payroll Officer
exports.getSalaryStatement = async (req, res) => {
  try {
    const { employeeId, year } = req.query;

    if (!employeeId || !year) {
      return res.status(400).json({ success: false, message: 'Employee ID and year are required.' });
    }

    const y = parseInt(year);

    const employee = await Employee.findById(employeeId)
      .populate('userId', 'name email companyName loginId');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Get all payslips for this employee for the given year
    const payslips = await Payslip.find({
      employeeId: employee._id,
      year: y
    }).sort('month');

    // Build monthly breakdown
    const monthlyData = [];
    let totalBasic = 0, totalHRA = 0, totalAllowances = 0, totalGross = 0;
    let totalPF = 0, totalPT = 0, totalLOP = 0, totalDeductions = 0, totalNet = 0;

    for (let m = 1; m <= 12; m++) {
      const ps = payslips.find(p => p.month === m);
      if (ps) {
        monthlyData.push({
          month: m,
          basicPay: ps.basicPay || 0,
          hra: ps.hra || 0,
          allowances: ps.allowances || 0,
          grossSalary: ps.grossSalary || 0,
          employeePF: ps.employeePF || 0,
          professionalTax: ps.professionalTax || 0,
          lopDeduction: ps.lopDeduction || 0,
          totalDeductions: ps.totalDeductions || 0,
          netPay: ps.netPay || 0,
          workingDays: ps.workingDays || 0,
          presentDays: ps.presentDays || 0,
          status: ps.status
        });
        totalBasic += ps.basicPay || 0;
        totalHRA += ps.hra || 0;
        totalAllowances += ps.allowances || 0;
        totalGross += ps.grossSalary || 0;
        totalPF += ps.employeePF || 0;
        totalPT += ps.professionalTax || 0;
        totalLOP += ps.lopDeduction || 0;
        totalDeductions += ps.totalDeductions || 0;
        totalNet += ps.netPay || 0;
      }
    }

    // Build salary components summary (latest month's structure, annualised)
    const latestPayslip = payslips.length > 0 ? payslips[payslips.length - 1] : null;
    const monthlyBasic = latestPayslip ? latestPayslip.basicPay : employee.basicSalary;
    const monthlyHRA = latestPayslip ? latestPayslip.hra : employee.hra;
    const monthlyAllowance = latestPayslip ? latestPayslip.allowances : employee.allowances;
    const monthlyGross = monthlyBasic + monthlyHRA + monthlyAllowance;
    const monthlyPF = latestPayslip ? latestPayslip.employeePF : Math.round(monthlyBasic * 0.12);
    const monthlyPT = latestPayslip ? latestPayslip.professionalTax : 200;
    const monthlyDeductions = monthlyPF + monthlyPT;
    const monthlyNet = monthlyGross - monthlyDeductions;

    res.json({
      success: true,
      data: {
        employee: {
          _id: employee._id,
          name: employee.userId.name,
          email: employee.userId.email,
          employeeCode: employee.employeeCode,
          designation: employee.designation,
          department: employee.department,
          joiningDate: employee.joiningDate,
          companyName: employee.userId.companyName || 'EmPay Solutions'
        },
        year: y,
        // Component-level summary (for the statement view)
        components: {
          earnings: [
            { label: 'Basic Salary', monthly: monthlyBasic, yearly: monthlyBasic * 12 },
            { label: 'House Rent Allowance', monthly: monthlyHRA, yearly: monthlyHRA * 12 },
            { label: 'Special Allowance', monthly: monthlyAllowance, yearly: monthlyAllowance * 12 }
          ],
          totalEarnings: { monthly: monthlyGross, yearly: monthlyGross * 12 },
          deductions: [
            { label: 'PF — Employee Contribution', monthly: monthlyPF, yearly: monthlyPF * 12 },
            { label: 'Professional Tax', monthly: monthlyPT, yearly: monthlyPT * 12 }
          ],
          totalDeductions: { monthly: monthlyDeductions, yearly: monthlyDeductions * 12 },
          netSalary: { monthly: monthlyNet, yearly: monthlyNet * 12 }
        },
        // Actual payslip data per month
        monthlyData,
        totals: { totalBasic, totalHRA, totalAllowances, totalGross, totalPF, totalPT, totalLOP, totalDeductions, totalNet }
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
