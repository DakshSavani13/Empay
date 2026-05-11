const Employee = require('../models/Employee');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Admin, HR
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('userId', 'name email role isActive avatar')
      .sort('-createdAt');

    // Get today's start and end to find today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendances = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    });

    const attendanceMap = {};
    attendances.forEach(att => {
      attendanceMap[att.employeeId.toString()] = att.status;
    });

    const employeesWithStatus = employees.map(emp => {
      const empObj = emp.toObject();
      empObj.status = attendanceMap[emp._id.toString()] || 'absent';
      return empObj;
    });

    res.json({ success: true, data: employeesWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  All
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'name email role isActive avatar');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create employee profile
// @route   POST /api/employees
// @access  Admin, HR
exports.createEmployee = async (req, res) => {
  try {
    const { userId, department, designation, joiningDate, basicSalary, hra, allowances, phone, address, bankAccount, pfNumber } = req.body;

    const existingEmployee = await Employee.findOne({ userId });
    if (existingEmployee) {
      return res.status(400).json({ success: false, message: 'Employee profile already exists for this user.' });
    }

    const count = await Employee.countDocuments();
    const employeeCode = `EMP${String(count + 1).padStart(4, '0')}`;

    const employee = await Employee.create({
      userId,
      employeeCode,
      department,
      designation,
      joiningDate,
      basicSalary,
      hra: hra || 0,
      allowances: allowances || 0,
      phone: phone || '',
      address: address || '',
      bankAccount: bankAccount || '',
      pfNumber: pfNumber || ''
    });

    // Link employee to user
    await User.findByIdAndUpdate(userId, { employeeId: employee._id });

    const populated = await Employee.findById(employee._id)
      .populate('userId', 'name email role isActive avatar');

    res.status(201).json({ success: true, data: populated, message: 'Employee created successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update employee profile
// @route   PUT /api/employees/:id
// @access  Admin, HR
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('userId', 'name email role isActive avatar');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    res.json({ success: true, data: employee, message: 'Employee updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Admin
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Deactivate instead of hard delete
    employee.isActive = false;
    await employee.save();

    // Also deactivate the user
    await User.findByIdAndUpdate(employee.userId, { isActive: false });

    res.json({ success: true, message: 'Employee deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my profile (employee's own)
// @route   GET /api/employees/me
// @access  All
exports.getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id })
      .populate('userId', 'name email role isActive avatar');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update my profile
// @route   PUT /api/employees/me
// @access  All
exports.updateMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee profile not found.' });
    }

    // Don't allow changing core fields like salary/designation by the employee themselves unless they are admin/hr.
    // In this workflow, we'll assume updates are restricted to resume/private info if they are just an employee.
    // But since it's a demo, we will allow updating the allowed fields.
    const allowedUpdates = [
      'about', 'jobLove', 'interests', 'skills', 'certifications',
      'dateOfBirth', 'nationality', 'personalEmail', 'gender', 'maritalStatus', 
      'bankName', 'ifscCode', 'panNo', 'uanNo', 'phone', 'address', 'bankAccount'
    ];
    
    // If Admin/HR, allow changing salary/designation
    if (req.user.role === 'admin' || req.user.role === 'payroll_officer') {
      allowedUpdates.push('monthWage', 'yearlyWage', 'workingDaysPerWeek', 'breakTimeHours', 'salaryComponents', 'pfContribution', 'professionalTax');
    } else {
      // Logging: Ensure role-based attempts to modify restricted salary fields by non-authorized users are logged or rejected explicitly
      const restrictedFields = ['monthWage', 'yearlyWage', 'workingDaysPerWeek', 'breakTimeHours', 'salaryComponents', 'pfContribution', 'professionalTax'];
      const attemptedRestrictedUpdate = restrictedFields.some(field => req.body[field] !== undefined);
      if (attemptedRestrictedUpdate) {
        console.warn(`Unauthorized attempt to modify salary info by user ${req.user._id} (${req.user.email})`);
      }
    }

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        employee[field] = req.body[field];
      }
    });

    await employee.save();
    
    const updatedEmployee = await Employee.findById(employee._id).populate('userId', 'name email role isActive avatar');
    res.json({ success: true, data: updatedEmployee, message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
