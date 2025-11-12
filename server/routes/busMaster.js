const express = require('express');
const router = express.Router();
const {
  getAllBuses,
  createBus,
  updateBus,
  deleteBus
} = require('../controllers/busMasterController');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/firebaseAuth');

router.route('/')
  .get(getAllBuses)
  .post(verifyFirebaseToken, requireAdmin, createBus);

router.route('/:id')
  .put(verifyFirebaseToken, requireAdmin, updateBus)
  .delete(verifyFirebaseToken, requireAdmin, deleteBus);

module.exports = router;