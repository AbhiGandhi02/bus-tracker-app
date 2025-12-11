const express = require('express');
const router = express.Router();
const { getMe, setAdmin } = require('../controllers/authController');
const { verifyFirebaseToken } = require('../middleware/firebaseAuth');

router.get('/me', verifyFirebaseToken, getMe);
router.post('/set-admin', verifyFirebaseToken, setAdmin); 

module.exports = router;