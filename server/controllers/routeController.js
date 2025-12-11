const Route = require('../models/Route');
const { Client } = require('@googlemaps/google-maps-services-js');
const googleMapsClient = new Client({});

// Fetches an encoded polyline from Google Maps Directions API.
const getPolylineForRoute = async (originCoords, destinationCoords) => {
  try {
    const originString = `${originCoords.lat},${originCoords.lng}`;
    const destString = `${destinationCoords.lat},${destinationCoords.lng}`;

    const response = await googleMapsClient.directions({
      params: {
        origin: originString,
        destination: destString,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000, 
    });

    // Get the encoded polyline string
    if (response.data.routes.length > 0) {
      return response.data.routes[0].overview_polyline.points;
    }
    return null; // No route found
  } catch (error) {
    console.error('Google Maps API Error:', error.message);
    if (error.response) {
       console.error('API Response Data:', error.response.data);
    }
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
    const { departureCoords, arrivalCoords } = req.body;

    const polyline = await getPolylineForRoute(departureCoords, arrivalCoords);
    
    const routeData = {
      ...req.body,
      polyline: polyline,
    };

    const route = await Route.create(routeData);

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
    const { departureCoords, arrivalCoords } = req.body;
    let updatedData = { ...req.body };

    if (departureCoords || arrivalCoords) {
      const newPolyline = await getPolylineForRoute(departureCoords, arrivalCoords);
      
      updatedData.polyline = newPolyline;
    }

    const route = await Route.findByIdAndUpdate(
      req.params.id,
      updatedData, 
      { new: true, runValidators: true }
    );

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