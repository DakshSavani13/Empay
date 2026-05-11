const mongoose = require('mongoose');

const leaveAllocationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  casual: {
    total: { type: Number, default: 12 },
    used: { type: Number, default: 0 }
  },
  sick: {
    total: { type: Number, default: 10 },
    used: { type: Number, default: 0 }
  },
  earned: {
    total: { type: Number, default: 15 },
    used: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

leaveAllocationSchema.index({ employeeId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveAllocation', leaveAllocationSchema);
