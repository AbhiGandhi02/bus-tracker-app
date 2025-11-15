const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  routeName: {
    type: String,
    required: true,
    trim: true
  },
  departureLocation: {
    type: String,
    required: true,
    trim: true
  },
  arrivalLocation: {
    type: String,
    required: true,
    trim: true
  },
  rideTime: {
    type: String,
    required: true,
    trim: true
  },
  polyline: {
    type: String,
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

routeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Route', routeSchema);