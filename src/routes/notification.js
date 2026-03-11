const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/notificationCtrl');
const { protect } = require('../middleware/authMiddleware');

router.post('/subscribe', protect, subscribe);

module.exports = router;
