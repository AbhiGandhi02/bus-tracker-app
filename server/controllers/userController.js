const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/Driver)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ role: 1, name: 1 });

    // --- THIS IS THE FIX ---
    // We must remap the user data to be consistent with the /api/auth/me
    // endpoint. We will rename `_id` to `id`.
    const formattedUsers = users.map(user => {
      return {
        id: user._id, // Rename _id to id
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        photoURL: user.photoURL,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      };
    });
    // --- END OF FIX ---

    res.status(200).json({
      success: true,
      count: formattedUsers.length,
      data: formattedUsers // Send the newly formatted array
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update a user's role
// @route   PUT /api/users/:id/role
// @access  Private (Admin/Driver)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userIdToUpdate = req.params.id; // This 'id' comes from the URL

    // Validate role
    if (!['user', 'admin', 'driver'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // --- Business Logic ---
    // Prevent an admin from demoting the *last* admin
    if (req.user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      const userToUpdate = await User.findById(userIdToUpdate);
      // Only check if the user *being demoted* is currently an admin
      if (userToUpdate.role === 'admin' && adminCount <= 1) {
         return res.status(400).json({
          success: false,
          message: 'Cannot demote the last admin account'
        });
      }
    }
    
    // Prevent user from changing their *own* role
    if (req.user._id.toString() === userIdToUpdate) {
       return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }
    // --- End Logic ---

    // --- THIS IS THE FIX (Part 2) ---
    // Use findByIdAndUpdate, which correctly uses the 'id' (as _id)
    const user = await User.findByIdAndUpdate(
      userIdToUpdate,
      { role: role },
      { new: true, runValidators: true }
    );
    // --- END OF FIX ---

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send back the updated user, also formatted with 'id'
    const formattedUser = {
      id: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.status(200).json({
      success: true,
      data: formattedUser
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};