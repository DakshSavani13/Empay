const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves, getAllLeaves, approveLeave, rejectLeave, allocateLeave } = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const leaveValidation = [
  body('leaveType').isIn(['casual', 'sick', 'earned']).withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('reason').trim().notEmpty().withMessage('Reason is required').escape(),
  validate
];

router.post('/apply', protect, leaveValidation, applyLeave);
router.get('/my', protect, getMyLeaves);
router.get('/all', protect, authorize('admin', 'hr_officer', 'payroll_officer'), getAllLeaves);
router.put('/:id/approve', protect, authorize('admin', 'hr_officer', 'payroll_officer'), approveLeave);
router.put('/:id/reject', protect, authorize('admin', 'hr_officer', 'payroll_officer'), rejectLeave);
router.post('/allocate', protect, authorize('admin', 'hr_officer'), allocateLeave);

module.exports = router;
