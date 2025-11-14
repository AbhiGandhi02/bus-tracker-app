const express = require('express');
const router = express.Router();
const {
  getAllBuses,
  createBus,
  updateBus,
  deleteBus
} = require('../controllers/busMasterController');
const { verifyFirebaseToken, requirePlanner } = require('../middleware/firebaseAuth');

router.route('/')
  .get(getAllBuses)
  .post(verifyFirebaseToken, requirePlanner, createBus);

router.route('/:id')
  .put(verifyFirebaseToken, requirePlanner, updateBus)
  .delete(verifyFirebaseToken, requirePlanner, deleteBus);

module.exports = router;