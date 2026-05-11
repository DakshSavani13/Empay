const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  sessions: [{
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, default: null },
    checkInLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null }
    },
    checkOutLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null }
    }
  }],
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'on-leave', 'weekend'],
    default: 'present'
  },
  workingHours: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals to maintain compatibility with frontend expected structure
attendanceSchema.virtual('checkIn').get(function() {
  if (this.sessions && this.sessions.length > 0) {
    return this.sessions[0].checkIn;
  }
  return null;
});

attendanceSchema.virtual('checkOut').get(function() {
  if (this.sessions && this.sessions.length > 0) {
    const lastSession = this.sessions[this.sessions.length - 1];
    return lastSession.checkOut;
  }
  return null;
});

// Compound index for unique attendance per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
