const Payrun = require('../models/Payrun');
const Payslip = require('../models/Payslip');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { calculatePayroll, getWorkingDays } = require('../utils/payrollCalculator');
const { generatePayslipPDF } = require('../utils/pdfGenerator');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailUtils');
const { isWorkingDay } = require('../utils/holidays');

exports.generatePayrun = async (req, res) => {
  try {
    const { month, year } = req.body;
    const m = parseInt(month), y = parseInt(year);

    let payrun = await Payrun.findOne({ month: m, year: y });
    if (payrun && payrun.status === 'finalized') return res.status(400).json({ success: false, message: 'Payrun already finalized.' });

    if (!payrun) payrun = await Payrun.create({ month: m, year: y, processedBy: req.user._id });

    const employees = await Employee.find({ isActive: true });
    const workingDays = getWorkingDays(y, m);
    const startDate = new Date(y, m - 1, 1), endDate = new Date(y, m, 0, 23, 59, 59);

    let totalGross = 0, totalDeductions = 0, totalNet = 0;

    for (const emp of employees) {
      const attendanceFull = await Attendance.countDocuments({ employeeId: emp._id, date: { $gte: startDate, $lte: endDate }, status: 'present' });
      const attendanceHalf = await Attendance.countDocuments({ employeeId: emp._id, date: { $gte: startDate, $lte: endDate }, status: 'half-day' });
      
      const presentDays = attendanceFull + (attendanceHalf * 0.5);

      const approvedLeaves = await Leave.find({ employeeId: emp._id, status: 'approved', startDate: { $lte: endDate }, endDate: { $gte: startDate } });

      let approvedLeaveDays = 0;
      approvedLeaves.forEach(l => {
        const ls = new Date(Math.max(l.startDate, startDate)), le = new Date(Math.min(l.endDate, endDate));
        let c = new Date(ls);
        while (c <= le) { if (isWorkingDay(c)) approvedLeaveDays++; c.setDate(c.getDate() + 1); }
      });

      const calc = calculatePayroll(emp, workingDays, presentDays, approvedLeaveDays);

      await Payslip.findOneAndUpdate(
        { employeeId: emp._id, month: m, year: y },
        { ...calc, employeeId: emp._id, payrunId: payrun._id, month: m, year: y, status: 'draft' },
        { upsert: true, new: true }
      );

      totalGross += calc.grossSalary; totalDeductions += calc.totalDeductions; totalNet += calc.netPay;
    }

    payrun.totalEmployees = employees.length; payrun.totalGross = totalGross; payrun.totalDeductions = totalDeductions; payrun.totalNet = totalNet;
    payrun.status = 'processing'; payrun.processedAt = new Date(); await payrun.save();

    res.json({ success: true, data: payrun, message: `Payrun generated for ${employees.length} employees.` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getPayslips = async (req, res) => {
  try {
    const { month, year } = req.query;
    let filter = {};
    if (month && year) { filter.month = parseInt(month); filter.year = parseInt(year); }
    const payslips = await Payslip.find(filter).populate({ path: 'employeeId', populate: { path: 'userId', select: 'name email' } }).sort('-year -month');
    res.json({ success: true, data: payslips });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getPayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id).populate({ path: 'employeeId', populate: { path: 'userId', select: 'name email' } });
    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found.' });
    res.json({ success: true, data: payslip });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getMyPayslips = async (req, res) => {
  try {
    const emp = await Employee.findOne({ userId: req.user._id });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const payslips = await Payslip.find({ employeeId: emp._id }).sort('-year -month');
    res.json({ success: true, data: payslips });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.downloadPayslipPDF = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id).populate('employeeId');
    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found.' });
    const employee = payslip.employeeId;
    const user = await User.findById(employee.userId);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${months[payslip.month-1]}_${payslip.year}.pdf`);
    const doc = generatePayslipPDF(payslip, employee, user);
    doc.pipe(res); doc.end();
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.finalizePayrun = async (req, res) => {
  try {
    const payrun = await Payrun.findById(req.params.id);
    if (!payrun) return res.status(404).json({ success: false, message: 'Payrun not found.' });
    payrun.status = 'finalized'; await payrun.save();
    await Payslip.updateMany({ payrunId: payrun._id }, { status: 'finalized' });
    
    // Notify employees
    const payslips = await Payslip.find({ payrunId: payrun._id }).populate({
      path: 'employeeId',
      populate: { path: 'userId' }
    });
    
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    
    for (const ps of payslips) {
      if (ps.employeeId && ps.employeeId.userId && ps.employeeId.userId.email) {
        await sendEmail({
          to: ps.employeeId.userId.email,
          subject: `Payslip available for ${months[payrun.month - 1]} ${payrun.year}`,
          text: `Hello ${ps.employeeId.userId.name},\n\nYour payslip for ${months[payrun.month - 1]} ${payrun.year} is now available in your EmPay dashboard.\n\nRegards,\nPayroll Department`
        });
      }
    }

    res.json({ success: true, data: payrun, message: 'Payrun finalized.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getPayruns = async (req, res) => {
  try {
    const payruns = await Payrun.find().populate('processedBy', 'name').sort('-year -month');
    res.json({ success: true, data: payruns });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
