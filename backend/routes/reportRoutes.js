const express = require('express');
const router = express.Router();
const { getSalaryStatement } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/salary-statement', protect, authorize('admin', 'payroll_officer'), getSalaryStatement);

module.exports = router;
