const express = require('express');
const router = express.Router();
const {
  getAllBuses,
  getBus,
  createBus,
  updateBus,
  deleteBus,
  updateLocation
} = require('../controllers/busController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getAllBuses)
  .post(protect, authorize('admin'), createBus);

router.route('/:id')
  .get(getBus)
  .put(protect, authorize('admin'), updateBus)
  .delete(protect, authorize('admin'), deleteBus);

router.post('/:id/location', updateLocation);

module.exports = router;