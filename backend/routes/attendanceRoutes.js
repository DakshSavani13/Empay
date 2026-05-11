const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getMyAttendance, getAllAttendance, getMonthlyReport, getTodayStatus } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/checkin', protect, checkIn);
router.post('/checkout', protect, checkOut);
router.get('/today', protect, getTodayStatus);
router.get('/my', protect, getMyAttendance);
router.get('/all', protect, authorize('admin', 'hr_officer', 'payroll_officer'), getAllAttendance);
router.get('/monthly/:id', protect, authorize('admin', 'hr_officer', 'payroll_officer'), getMonthlyReport);

module.exports = router;
