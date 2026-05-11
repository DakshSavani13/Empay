const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeCode: {
    type: String,
    unique: true,
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  joiningDate: {
    type: Date,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  hra: {
    type: Number,
    default: 0,
    min: 0
  },
  allowances: {
    type: Number,
    default: 0,
    min: 0
  },
  bankAccount: {
    type: String,
    default: ''
  },
  pfNumber: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // --- Profile Fields ---
  // Resume Tab
  about: { type: String, default: '' },
  jobLove: { type: String, default: '' },
  interests: { type: String, default: '' },
  skills: [{ type: String }],
  certifications: [{ type: String }],

  // Private Info Tab
  dateOfBirth: { type: Date },
  nationality: { type: String, default: '' },
  personalEmail: { type: String, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed', ''], default: '' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  location: { type: String, default: '' },

  // Expanded Bank Details
  bankName: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  panNo: { type: String, default: '' },
  uanNo: { type: String, default: '' },

  // Salary Info Tab
  monthWage: { type: Number, default: 0 },
  yearlyWage: { type: Number, default: 0 },
  workingDaysPerWeek: { type: Number, default: 5 },
  breakTimeHours: { type: Number, default: 1 },
  
  salaryComponents: {
    basic: { percentage: { type: Number, default: 50 }, amount: { type: Number, default: 0 } },
    hra: { percentage: { type: Number, default: 50 }, amount: { type: Number, default: 0 } }, // Percentage of Basic
    standardAllowance: { percentage: { type: Number, default: 16.67 }, amount: { type: Number, default: 0 } },
    performanceBonus: { percentage: { type: Number, default: 8.33 }, amount: { type: Number, default: 0 } },
    lta: { percentage: { type: Number, default: 8.33 }, amount: { type: Number, default: 0 } },
    fixedAllowance: { percentage: { type: Number, default: 11.67 }, amount: { type: Number, default: 0 } }
  },
  pfContribution: {
    employeeRate: { type: Number, default: 12 },
    employerRate: { type: Number, default: 12 }
  },
  professionalTax: { type: Number, default: 200 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);
