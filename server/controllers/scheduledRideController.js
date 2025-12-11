const ScheduledRide = require('../models/ScheduledRide');

const Route = require('../models/Route'); 
const { getDistance } = require('../utils/locationUtils'); 

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
    const driverLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };

    const ride = await ScheduledRide.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Update the ride's location
    ride.currentLocation = {
      lat: driverLocation.lat,
      lng: driverLocation.lng,
      timestamp: Date.now()
    };

    // Define our trigger distance (e.g., 50 meters)
    const GEOFENCE_RADIUS = 50; 
    let statusHasChanged = false;

    // We only process auto-updates for active rides
    if (ride.status === 'Scheduled' || ride.status === 'In Progress') {
      
      // We must fetch the route to get its coordinates
      const route = await Route.findById(ride.routeId);
      if (route) {

        // CASE 1: The ride is "Scheduled" and waiting to start.
        if (ride.status === 'Scheduled') {
          const distanceToStart = getDistance(driverLocation, route.departureCoords);
          
          if (distanceToStart < GEOFENCE_RADIUS) {
            ride.status = 'In Progress';
            statusHasChanged = true;
          }
        } 
        
        // CASE 2: The ride is "In Progress" and heading to the finish.
        else if (ride.status === 'In Progress') {
          const distanceToEnd = getDistance(driverLocation, route.arrivalCoords);

          if (distanceToEnd < GEOFENCE_RADIUS) {
            ride.status = 'Completed';
            statusHasChanged = true;
          }
        }
      }
    }

    await ride.save();

    // Emit socket event for location
    if (req.app.get('io')) {
      const populatedRide = await ScheduledRide.findById(ride._id).populate('busId', 'busNumber');
      const busNumber = populatedRide.busId ? populatedRide.busId.busNumber : '...';
      
      req.app.get('io').emit('ride-location-update', {
        rideId: ride._id,
        busNumber: busNumber,
        location: ride.currentLocation
      });

      if (statusHasChanged) {
        req.app.get('io').emit('ride-status-update', {
          rideId: ride._id,
          status: ride.status
        });
        console.log(`[Socket] Geofence triggered ride-status-update for ${ride._id}: ${ride.status}`);
      }
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