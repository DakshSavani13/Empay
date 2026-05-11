const Leave = require('../models/Leave');
const LeaveAllocation = require('../models/LeaveAllocation');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { sendEmail } = require('../utils/emailUtils');
const { isWorkingDay } = require('../utils/holidays');

exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const start = new Date(startDate), end = new Date(endDate);
    if (start > end) return res.status(400).json({ success: false, message: 'Start date must be before end date.' });

    let totalDays = 0, current = new Date(start);
    while (current <= end) { if (isWorkingDay(current)) totalDays++; current.setDate(current.getDate() + 1); }

    const year = start.getFullYear();
    let alloc = await LeaveAllocation.findOne({ employeeId: employee._id, year });
    
    if (!alloc) {
      // Create default allocation if none exists for the year
      alloc = await LeaveAllocation.create({ 
        employeeId: employee._id, 
        year,
        casual: { total: 12, used: 0 },
        sick: { total: 10, used: 0 },
        earned: { total: 15, used: 0 }
      });
    }

    // Factor in pending leaves so employees cannot request more than allowed by spamming requests
    const pendingLeaves = await Leave.find({
      employeeId: employee._id,
      leaveType,
      status: 'pending'
    });
    
    // Sum pending days for the same year
    const pendingDays = pendingLeaves
      .filter(l => l.startDate.getFullYear() === year)
      .reduce((sum, l) => sum + l.totalDays, 0);

    const bal = alloc[leaveType].total - alloc[leaveType].used - pendingDays;
    if (totalDays > bal) {
      return res.status(400).json({ success: false, message: `Insufficient ${leaveType} leave. Available (including pending): ${bal}, Requested: ${totalDays}` });
    }

    const leave = await Leave.create({ employeeId: employee._id, leaveType, startDate: start, endDate: end, totalDays, reason });
    res.status(201).json({ success: true, data: leave, message: 'Leave submitted.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
    const leaves = await Leave.find({ employeeId: employee._id }).populate('approvedBy', 'name').sort('-appliedAt');
    const year = new Date().getFullYear();
    let allocation = await LeaveAllocation.findOne({ employeeId: employee._id, year });
    if (!allocation) allocation = await LeaveAllocation.create({ employeeId: employee._id, year });
    res.json({ success: true, data: { leaves, allocation } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const leaves = await Leave.find(filter).populate({ path: 'employeeId', populate: { path: 'userId', select: 'name email' } }).populate('approvedBy', 'name').sort('-appliedAt');
    res.json({ success: true, data: leaves });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Not found.' });
    if (leave.status !== 'pending') return res.status(400).json({ success: false, message: 'Already processed.' });

    leave.status = 'approved'; leave.approvedBy = req.user._id; await leave.save();
    const year = leave.startDate.getFullYear();
    await LeaveAllocation.findOneAndUpdate({ employeeId: leave.employeeId, year }, { $inc: { [`${leave.leaveType}.used`]: leave.totalDays } }, { upsert: true });

    let cur = new Date(leave.startDate);
    while (cur <= leave.endDate) {
      if (isWorkingDay(cur)) {
        const d = new Date(cur); d.setHours(0,0,0,0);
        
        // Preserve existing check-ins/sessions if the employee was partially present
        let existingAttendance = await Attendance.findOne({ employeeId: leave.employeeId, date: d });
        if (existingAttendance) {
          existingAttendance.status = 'on-leave';
          await existingAttendance.save();
        } else {
          await Attendance.create({ employeeId: leave.employeeId, date: d, status: 'on-leave' });
        }
      }
      cur.setDate(cur.getDate() + 1);
    }
    
    // Send email
    const emp = await Employee.findById(leave.employeeId).populate('userId');
    if (emp && emp.userId && emp.userId.email) {
      await sendEmail({
        to: emp.userId.email,
        subject: 'Leave Request Approved',
        text: `Hello ${emp.userId.name},\n\nYour ${leave.leaveType} leave from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} has been approved.\n\nRegards,\nHR Department`
      });
    }

    res.json({ success: true, data: leave, message: 'Leave approved.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.rejectLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Not found.' });
    if (leave.status !== 'pending') return res.status(400).json({ success: false, message: 'Already processed.' });
    leave.status = 'rejected'; leave.approvedBy = req.user._id; leave.rejectionReason = req.body.reason || ''; await leave.save();
    
    // Send email
    const emp = await Employee.findById(leave.employeeId).populate('userId');
    if (emp && emp.userId && emp.userId.email) {
      await sendEmail({
        to: emp.userId.email,
        subject: 'Leave Request Rejected',
        text: `Hello ${emp.userId.name},\n\nYour ${leave.leaveType} leave from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} has been rejected.\nReason: ${leave.rejectionReason}\n\nRegards,\nHR Department`
      });
    }

    res.json({ success: true, data: leave, message: 'Leave rejected.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.allocateLeave = async (req, res) => {
  try {
    const { employeeId, year, casual, sick, earned } = req.body;
    const allocation = await LeaveAllocation.findOneAndUpdate(
      { employeeId, year: year || new Date().getFullYear() },
      { employeeId, year: year || new Date().getFullYear(), casual: { total: casual || 12, used: 0 }, sick: { total: sick || 10, used: 0 }, earned: { total: earned || 15, used: 0 } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: allocation, message: 'Leave allocated.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
