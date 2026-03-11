const express = require('express');
const router = express.Router();
const { subscribe, getPublicKey } = require('../controllers/notificationCtrl');
const { protect } = require('../middleware/authMiddleware');

// Public route for frontend to get the key
router.get('/vapid-public-key', getPublicKey);

// Protected route to save the user's device subscription
router.post('/subscribe', protect, subscribe);

module.exports = router;
