const mongoose = require('mongoose');

const payrunSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'processing', 'finalized'],
    default: 'draft'
  },
  totalEmployees: {
    type: Number,
    default: 0
  },
  totalGross: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  totalNet: {
    type: Number,
    default: 0
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

payrunSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payrun', payrunSchema);
