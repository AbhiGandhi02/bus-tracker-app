const BusMaster = require('../models/BusMaster');

// @desc    Get all buses
// @route   GET /api/bus-master
// @access  Public
exports.getAllBuses = async (req, res) => {
  try {
    const buses = await BusMaster.find({ isActive: true });

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

// @desc    Create new bus
// @route   POST /api/bus-master
// @access  Private/Admin
exports.createBus = async (req, res) => {
  try {
    const bus = await BusMaster.create(req.body);

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
// @route   PUT /api/bus-master/:id
// @access  Private/Admin
exports.updateBus = async (req, res) => {
  try {
    const bus = await BusMaster.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
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

// @desc    Delete bus (soft delete)
// @route   DELETE /api/bus-master/:id
// @access  Private/Admin
exports.deleteBus = async (req, res) => {
  try {
    const bus = await BusMaster.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

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