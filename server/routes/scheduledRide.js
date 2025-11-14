const express = require('express');
const router = express.Router();
const {
  getScheduledRides,
  createScheduledRide,
  updateScheduledRide,
  updateRideLocation,
  deleteScheduledRide
} = require('../controllers/scheduledRideController'); // Using your 'schedulrRideController.js' file


const { 
  verifyFirebaseToken, 
  requirePlanner,     
  requireOperator     
} = require('../middleware/firebaseAuth');

router.route('/')
  .get(getScheduledRides) 
  .post(verifyFirebaseToken, requirePlanner, createScheduledRide);

router.route('/:id')
  .put(verifyFirebaseToken, requireOperator, updateScheduledRide)
  .delete(verifyFirebaseToken, requirePlanner, deleteScheduledRide);


router.post(
  '/:id/location', 
  verifyFirebaseToken, 
  requireOperator,   
  updateRideLocation 
);

module.exports = router;