const mongoose = require('mongoose');

const scheduledRideSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusMaster',
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  departureTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  // Real-time location tracking (optional)
  currentLocation: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    },
    timestamp: {
      type: Date
    }
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

// Compound index for date queries
scheduledRideSchema.index({ date: 1, departureTime: 1 });

scheduledRideSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ScheduledRide', scheduledRideSchema);