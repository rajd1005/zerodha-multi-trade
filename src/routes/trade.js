const express = require('express');
const router = express.Router();
const { placeTrade, placeBasketTrade, getPaperTrades, toggleTradeMode } = require('../controllers/tradeCtrl');
const { protect } = require('../middleware/authMiddleware');

// Execute a single trade (handles both paper and live automatically)
router.post('/place', protect, placeTrade);

// Execute multiple trades at once (Basket Orders)
router.post('/basket', protect, placeBasketTrade);

// Fetch virtual paper trades
router.get('/paper-history', protect, getPaperTrades);

// Toggle between paper and live mode
router.put('/mode', protect, toggleTradeMode);

module.exports = router;
