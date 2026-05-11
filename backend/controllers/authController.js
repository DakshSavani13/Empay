const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { sendEmail } = require('../utils/emailUtils');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Admin
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, companyName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email.' });
    }

    const compName = companyName || 'Odoo India';
    let compPrefix = 'OI';
    if (compName.split(' ').length > 1) {
      compPrefix = compName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    } else {
      compPrefix = compName.substring(0, 2).toUpperCase();
    }
    const nameParts = name.split(' ');
    let namePrefix = '';
    if (nameParts.length >= 2) {
      namePrefix = (nameParts[0].substring(0, 2) + nameParts[nameParts.length - 1].substring(0, 2)).toUpperCase();
    } else {
      namePrefix = name.substring(0, 4).toUpperCase().padEnd(4, 'X');
    }
    const year = req.body.joiningDate ? new Date(req.body.joiningDate).getFullYear() : new Date().getFullYear();
    
    // Generate unique random hex to prevent race conditions during concurrent registrations
    const crypto = require('crypto');
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const loginId = `${compPrefix}${namePrefix}${year}${randomHex}`;

    const finalPassword = password || Math.random().toString(36).slice(-8);

    const user = await User.create({ name, email, password: finalPassword, role: role || 'employee', loginId, companyName: compName });

    // Auto-generate employee code
    const employeeCode = `EMP${year}${randomHex}`;

    const employee = await Employee.create({
      userId: user._id,
      employeeCode,
      department: req.body.department || 'General',
      designation: req.body.designation || 'Staff',
      joiningDate: req.body.joiningDate || new Date(),
      basicSalary: req.body.basicSalary || 25000,
      hra: req.body.hra || 10000,
      allowances: req.body.allowances || 5000
    });

    user.employeeId = employee._id;
    await user.save();

    await sendEmail({
      to: email,
      subject: 'Your EmPay Account Details',
      text: `Hello ${name},\n\nYour account has been created.\nLogin ID: ${loginId}\nPassword: ${finalPassword}\n\nPlease login and change your password.\n\nRegards,\nHR Department`
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: employee._id,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email or login ID, and password.' });
    }

    const user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { loginId: email.toUpperCase() }
      ] 
    }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  All (authenticated)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('employeeId');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/auth/role/:id
// @access  Admin
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'hr_officer', 'payroll_officer', 'employee'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, data: user, message: 'Role updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  All (authenticated)
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both old and new passwords.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('employeeId').sort('-createdAt');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
