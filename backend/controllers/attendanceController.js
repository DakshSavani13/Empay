const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { isWithinGeofence } = require('../utils/geoFence');

// @desc    Check in
// @route   POST /api/attendance/checkin
// @access  All
exports.checkIn = async (req, res) => {
  try {
    const { latitude, longitude, localDate } = req.body;
    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    // Geofence check
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Location coordinates are required to check in.' });
    }

    const { isWithin, distance } = isWithinGeofence(latitude, longitude);
    if (!isWithin) {
      return res.status(400).json({
        success: false,
        message: `You are ${distance}m away from the office. Please be within ${process.env.ALLOWED_RADIUS_METERS}m to check in.`
      });
    }

    // Check for an open session
    const openAttendance = await Attendance.findOne({
      employeeId: employee._id,
      "sessions.checkOut": null
    });

    if (openAttendance) {
      return res.status(400).json({ success: false, message: 'You have an active session that is not checked out.' });
    }

    // Find today's record based on local timezone date passed from frontend
    const dateObj = localDate ? new Date(localDate) : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

    let attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: dateObj
    });

    const newSession = {
      checkIn: new Date(),
      checkInLocation: { latitude, longitude }
    };

    if (!attendance) {
      attendance = new Attendance({
        employeeId: employee._id,
        date: dateObj,
        sessions: [newSession],
        status: 'present'
      });
    } else {
      attendance.sessions.push(newSession);
      attendance.status = 'present';
    }

    await attendance.save();

    res.json({
      success: true,
      message: 'Checked in successfully!',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check out
// @route   POST /api/attendance/checkout
// @access  All
exports.checkOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const employee = await Employee.findOne({ userId: req.user._id });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    // Geofence check for checkout
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Location coordinates are required to check out.' });
    }

    const { isWithin, distance } = isWithinGeofence(latitude, longitude);
    if (!isWithin) {
      return res.status(400).json({
        success: false,
        message: `You are ${distance}m away from the office. Please be within ${process.env.ALLOWED_RADIUS_METERS}m to check out.`
      });
    }

    // Find attendance record with an open session
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      "sessions.checkOut": null
    });

    if (!attendance) {
      return res.status(400).json({ success: false, message: 'You have not checked in or already checked out.' });
    }

    const openSession = attendance.sessions.find(s => s.checkOut == null);
    if (openSession) {
      openSession.checkOut = new Date();
      openSession.checkOutLocation = latitude && longitude ? { latitude, longitude } : undefined;
    }

    // Calculate total working hours
    const totalMs = attendance.sessions.reduce((sum, s) => {
      if (s.checkOut && s.checkIn) {
        return sum + (s.checkOut - s.checkIn);
      }
      return sum;
    }, 0);

    attendance.workingHours = Math.round((totalMs / (1000 * 60 * 60)) * 100) / 100;

    // Mark half-day if less than 4 hours
    if (attendance.workingHours < 4) {
      attendance.status = 'half-day';
    } else {
      attendance.status = 'present';
    }

    await attendance.save();

    res.json({
      success: true,
      message: `Checked out successfully! Total hours: ${attendance.workingHours}h`,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my attendance
// @route   GET /api/attendance/my
// @access  All
exports.getMyAttendance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const { month, year } = req.query;
    let filter = { employeeId: employee._id };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(filter).sort('-date');
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all attendance
// @route   GET /api/attendance/all
// @access  Admin, HR, PO
exports.getAllAttendance = async (req, res) => {
  try {
    const { month, year, date } = req.query;
    let filter = {};

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    } else if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(filter)
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name email' }
      })
      .sort('-date');

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get monthly attendance report for an employee
// @route   GET /api/attendance/monthly/:id
// @access  Admin, HR, PO
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const attendance = await Attendance.find({
      employeeId: req.params.id,
      date: { $gte: startDate, $lte: endDate }
    }).sort('date');

    const summary = {
      totalDays: new Date(y, m, 0).getDate(),
      present: attendance.filter(a => a.status === 'present').length,
      absent: 0,
      halfDay: attendance.filter(a => a.status === 'half-day').length,
      onLeave: attendance.filter(a => a.status === 'on-leave').length,
      avgWorkingHours: 0
    };

    const workingDaysCount = attendance.filter(a => a.workingHours > 0).length;
    const totalHours = attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);
    summary.avgWorkingHours = workingDaysCount > 0 ? Math.round((totalHours / workingDaysCount) * 100) / 100 : 0;

    res.json({ success: true, data: { attendance, summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's attendance status
// @route   GET /api/attendance/today
// @access  All
exports.getTodayStatus = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    const { localDate } = req.query;
    const dateObj = localDate ? new Date(localDate) : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

    // Today's attendance record
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: dateObj
    });

    // Check if there is ANY open session (cross-midnight included)
    const activeSessionRecord = await Attendance.findOne({
      employeeId: employee._id,
      "sessions.checkOut": null
    });

    const isCheckedIn = !!activeSessionRecord;
    const isCheckedOut = attendance ? !isCheckedIn && attendance.sessions.length > 0 : false;

    // If there is an active session from a previous day, we should probably return THAT attendance record
    // so the frontend sees the correct working hours and checkIn time
    const recordToReturn = activeSessionRecord || attendance;

    res.json({
      success: true,
      data: {
        checkedIn: isCheckedIn,
        checkedOut: isCheckedOut,
        attendance: recordToReturn
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
