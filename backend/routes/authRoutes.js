const express = require('express');
const router = express.Router();
const { register, login, getMe, updateRole, getAllUsers, changePassword } = require('../controllers/authController');
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

const loginValidation = [
  body('email').notEmpty().withMessage('Email or Login ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

// Public: company self-registration (first-time signup)
router.post('/signup', registerValidation, register);

// Protected: admin-only employee creation
router.post('/register', protect, authorize('admin', 'hr_officer'), registerValidation, register);

router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/role/:id', protect, authorize('admin'), updateRole);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.post('/change-password', protect, changePassword);

module.exports = router;
