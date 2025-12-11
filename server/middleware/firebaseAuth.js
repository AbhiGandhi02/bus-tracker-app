const admin = require('firebase-admin');
const User = require('../models/User');

// Verify Firebase ID Token
exports.verifyFirebaseToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get or create user in our database
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      // First time login - create user
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        photoURL: decodedToken.picture,
        role: 'user'
      });
    } else {
      user.lastLogin = Date.now();
      await user.save();
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Firebase auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

exports.requireMasterAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'masteradmin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Master Admin role required.'
    });
  }
};

exports.requirePlanner = (req, res, next) => {
  if (req.user && (req.user.role === 'masteradmin' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Master Admin role required.'
    });
  }
};

exports.requireOperator = (req, res, next) => {
  if (req.user && (req.user.role === 'masteradmin' || req.user.role === 'driver')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Driver or Master Admin role required.'
    });
  }
};

exports.requireDriver = (req, res, next) => {
  if (req.user && req.user.role === 'driver') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Driver role required.'
    });
  }
};