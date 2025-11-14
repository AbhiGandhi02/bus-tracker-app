const ScheduledRide = require('../models/ScheduledRide');

// @desc    Get scheduled rides for a date
// @route   GET /api/scheduled-rides?date=YYYY-MM-DD
// @access  Public
exports.getScheduledRides = async (req, res) => {
  try {
    const { date } = req.query;
    
    // Default to today if no date provided
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const rides = await ScheduledRide.find({
      date: {
        $gte: queryDate,
        $lt: nextDay
      }
    })
    .populate('busId')
    .populate('routeId')
    .sort({ departureTime: 1 });

    res.status(200).json({
      success: true,
      count: rides.length,
      data: rides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create scheduled ride
// @route   POST /api/scheduled-rides
// @access  Private (Planner: MasterAdmin/Admin)
exports.createScheduledRide = async (req, res) => {
  try {
    const ride = await ScheduledRide.create(req.body);
    const populatedRide = await ScheduledRide.findById(ride._id)
      .populate('busId')
      .populate('routeId');

    res.status(201).json({
      success: true,
      data: populatedRide
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create scheduled ride',
      error: error.message
    });
  }
};

// @desc    Update scheduled ride (Status)
// @route   PUT /api/scheduled-rides/:id
// @access  Private (Operator: MasterAdmin/Driver)
exports.updateScheduledRide = async (req, res) => {
  try {
    const ride = await ScheduledRide.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('busId')
    .populate('routeId');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled ride not found'
      });
    }

    // Broadcast this status update to all connected clients
    if (req.app.get('io') && req.body.status) {
      req.app.get('io').emit('ride-status-update', {
        rideId: ride._id,
        status: ride.status
      });
      console.log(`[Socket] Emitted ride-status-update for ${ride._id}: ${ride.status}`);
    }

    res.status(200).json({
      success: true,
      data: ride
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update scheduled ride',
      error: error.message
    });
  }
};

// @desc    Update ride location (real-time tracking)
// @route   POST /api/scheduled-rides/:id/location
// @access  Private (Operator: MasterAdmin/Driver)
exports.updateRideLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    const ride = await ScheduledRide.findById(req.params.id);

    if (!ride) {
      // Corrected status code from 4404 to 404
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    ride.currentLocation = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      timestamp: Date.now()
    };


    await ride.save();

    // Emit socket event for location
    if (req.app.get('io')) {
      // --- FIX for busNumber ---
      let busNumber = '...';
      try {
        const populatedRide = await ScheduledRide.findById(ride._id).populate('busId');
        
        // --- THIS IS THE FIX ---
        // Changed `(populatedRide.busId as any).busNumber` to standard JavaScript
        if (populatedRide && populatedRide.busId && populatedRide.busId.busNumber) {
          busNumber = populatedRide.busId.busNumber;
        }
        // --- END OF FIX ---

      } catch (e) {
        console.warn("Could not populate busNumber for socket event");
      }
      // --- END FIX ---
      
      req.app.get('io').emit('ride-location-update', {
        rideId: ride._id,
        busNumber: busNumber, // Send the correct bus number
        location: ride.currentLocation
      });
    }

    res.status(200).json({
      success: true,
      data: ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

// @desc    Delete scheduled ride
// @route   DELETE /api/scheduled-rides/:id
// @access  Private (Planner: MasterAdmin/Admin)
exports.deleteScheduledRide = async (req, res) => {
  try {
    const ride = await ScheduledRide.findByIdAndDelete(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled ride not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Scheduled ride deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};