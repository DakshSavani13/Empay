const express = require('express');
const router = express.Router();
const { getOverview, getAttendanceSummary, getPayrollSummary } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/overview', protect, authorize('admin', 'hr_officer', 'payroll_officer'), getOverview);
router.get('/attendance', protect, authorize('admin', 'hr_officer'), getAttendanceSummary);
router.get('/payroll', protect, authorize('admin', 'payroll_officer'), getPayrollSummary);

module.exports = router;
