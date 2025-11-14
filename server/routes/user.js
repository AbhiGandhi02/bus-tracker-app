const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole } = require('../controllers/userController');
const { verifyFirebaseToken, requireMasterAdmin } = require('../middleware/firebaseAuth');

router.use(verifyFirebaseToken, requireMasterAdmin);

// @desc    Get all users
// @route   GET /api/users
router.route('/')
  .get(getAllUsers);

// @desc    Update a user's role
// @route   PUT /api/users/:id/role
router.route('/:id/role')
  .put(updateUserRole);

module.exports = router;