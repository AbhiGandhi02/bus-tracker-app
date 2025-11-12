const mongoose = require('mongoose');

const busMasterSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  busType: {
    type: String,
    enum: ['AC', 'Non-AC', 'Mini', 'Deluxe'],
    default: 'Non-AC'
  },
  driverName: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
busMasterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BusMaster', busMasterSchema);