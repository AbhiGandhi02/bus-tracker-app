const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  arrivalTime: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  }
});

const routeSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: [true, 'Please provide a route name'],
    unique: true,
    trim: true
  },
  routeNumber: {
    type: String,
    required: true,
    unique: true
  },
  stops: [stopSchema],
  startTime: {
    type: String,
    required: [true, 'Please provide start time']
  },
  endTime: {
    type: String,
    required: [true, 'Please provide end time']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Route', routeSchema);