const Route = require('../models/Route');
const { Client } = require('@googlemaps/google-maps-services-js');
const googleMapsClient = new Client({});

// Fetches an encoded polyline from Google Maps Directions API.
const getPolylineForRoute = async (origin, destination) => {
  try {
    const response = await googleMapsClient.directions({
      params: {
        origin: origin,
        destination: destination,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 1000, // Optional: timeout
    });

    // Get the encoded polyline string
    if (response.data.routes.length > 0) {
      return response.data.routes[0].overview_polyline.points;
    }
    return null; // No route found
  } catch (error) {
    console.error('Google Maps API Error:', error.message);
    // Don't block the request, just return null
    return null;
  }
};

// @desc    Get all routes
// @route   GET /api/routes
// @access  Public
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true });

    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new route
// @route   POST /api/routes
// @access  Private/Admin
exports.createRoute = async (req, res) => {
  try {
    const { departureLocation, arrivalLocation } = req.body;

    // Fetch the polyline from Google
    const polyline = await getPolylineForRoute(departureLocation, arrivalLocation);
    
    // Add the polyline to our request body
    const routeData = {
      ...req.body,
      polyline: polyline,
    };

    const route = await Route.create(routeData); // Use new routeData

    res.status(201).json({
      success: true,
      data: route
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create route',
      error: error.message
    });
  }
};

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private/Admin
exports.updateRoute = async (req, res) => {
  try {
    const { departureLocation, arrivalLocation } = req.body;
    let updatedData = { ...req.body };

    // --- ADD THIS ---
    // If locations are changing, fetch a new polyline
    if (departureLocation || arrivalLocation) {
      const currentRoute = await Route.findById(req.params.id);

      const newPolyline = await getPolylineForRoute(
        departureLocation || currentRoute.departureLocation,
        arrivalLocation || currentRoute.arrivalLocation
      );
      updatedData.polyline = newPolyline;
    }
    // --- END ADD ---

    // --- MODIFY THIS LINE ---
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      updatedData, // Use new updatedData
      { new: true, runValidators: true }
    );
    // --- END MODIFY ---

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    res.status(200).json({
      success: true,
      data: route
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update route',
      error: error.message
    });
  }
};

// @desc    Delete route (soft delete)
// @route   DELETE /api/routes/:id
// @access  Private/Admin
exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};