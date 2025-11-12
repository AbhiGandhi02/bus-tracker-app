const Bus = require('../models/Bus');

// @desc    Get all buses
// @route   GET /api/buses
// @access  Public
exports.getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find().populate('routeId', 'routeName routeNumber stops');

    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single bus
// @route   GET /api/buses/:id
// @access  Public
exports.getBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('routeId');

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new bus
// @route   POST /api/buses
// @access  Private/Admin
exports.createBus = async (req, res) => {
  try {
    const bus = await Bus.create(req.body);

    res.status(201).json({
      success: true,
      data: bus
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create bus',
      error: error.message
    });
  }
};

// @desc    Update bus
// @route   PUT /api/buses/:id
// @access  Private/Admin
exports.updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update bus',
      error: error.message
    });
  }
};

// @desc    Delete bus
// @route   DELETE /api/buses/:id
// @access  Private/Admin
exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bus deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update bus location
// @route   POST /api/buses/:id/location
// @access  Public (for GPS device)
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    bus.location = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      timestamp: Date.now()
    };

    await bus.save();

    // Emit socket event (handled in server.js)
    if (req.app.get('io')) {
      req.app.get('io').emit('bus-location-update', {
        busId: bus._id,
        busNumber: bus.busNumber,
        location: bus.location
      });
    }

    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};