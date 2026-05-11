const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payslip = require('../models/Payslip');
const Payrun = require('../models/Payrun');

exports.getOverview = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ isActive: true });

    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const presentToday = await Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'present' });

    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    const month = today.getMonth() + 1, year = today.getFullYear();
    const payrun = await Payrun.findOne({ month, year });

    const deptAgg = await Employee.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const roleAgg = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees, totalUsers, presentToday, absentToday: totalEmployees - presentToday,
        pendingLeaves, currentPayrun: payrun || null, departments: deptAgg, roles: roleAgg
      }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1), end = new Date(y, m, 0, 23, 59, 59);

    const agg = await Attendance.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const daily = await Attendance.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: 'present' } },
      { $group: { _id: { $dayOfMonth: '$date' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } }
    ]);

    res.json({ success: true, data: { summary: agg, daily } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getPayrollSummary = async (req, res) => {
  try {
    const trends = await Payrun.find().sort('year month').limit(12).select('month year totalGross totalNet totalDeductions totalEmployees status');
    const latestPayslips = await Payslip.find().sort('-year -month').limit(10).populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } });
    res.json({ success: true, data: { trends, latestPayslips } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
