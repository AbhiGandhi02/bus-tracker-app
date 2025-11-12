const express = require('express');
const router = express.Router();
const {
  getScheduledRides,
  createScheduledRide,
  updateScheduledRide,
  updateRideLocation,
  deleteScheduledRide
} = require('../controllers/scheduledRideController');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/firebaseAuth');

router.route('/')
  .get(getScheduledRides)
  .post(verifyFirebaseToken, requireAdmin, createScheduledRide);

router.route('/:id')
  .put(verifyFirebaseToken, requireAdmin, updateScheduledRide)
  .delete(verifyFirebaseToken, requireAdmin, deleteScheduledRide);

router.post('/:id/location', updateRideLocation);

module.exports = router;