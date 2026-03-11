const express = require('express');
const router = express.Router();
const { placeTrade } = require('../controllers/tradeCtrl');
const { protect } = require('../middleware/authMiddleware'); // Import protect

// Add 'protect' middleware here
router.post('/place', protect, placeTrade);

module.exports = router;
