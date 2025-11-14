const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  createRoute,
  updateRoute,
  deleteRoute
} = require('../controllers/routeController');
const { verifyFirebaseToken, requirePlanner } = require('../middleware/firebaseAuth');

router.route('/')
  .get(getAllRoutes)
  .post(verifyFirebaseToken, requirePlanner, createRoute);

router.route('/:id')
  .put(verifyFirebaseToken, requirePlanner, updateRoute)
  .delete(verifyFirebaseToken, requirePlanner, deleteRoute);

module.exports = router;