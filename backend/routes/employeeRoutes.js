const express = require('express');
const router = express.Router();
const { getAllEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getMyProfile, updateMyProfile } = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.get('/', protect, authorize('admin', 'hr_officer'), getAllEmployees);
router.get('/:id', protect, getEmployee);
router.post('/', protect, authorize('admin', 'hr_officer'), createEmployee);
router.put('/:id', protect, authorize('admin', 'hr_officer'), updateEmployee);
router.delete('/:id', protect, authorize('admin'), deleteEmployee);

module.exports = router;
