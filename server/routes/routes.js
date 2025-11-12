const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  createRoute,
  updateRoute,
  deleteRoute
} = require('../controllers/routeController');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/firebaseAuth');

router.route('/')
  .get(getAllRoutes)
  .post(verifyFirebaseToken, requireAdmin, createRoute);

router.route('/:id')
  .put(verifyFirebaseToken, requireAdmin, updateRoute)
  .delete(verifyFirebaseToken, requireAdmin, deleteRoute);

module.exports = router;