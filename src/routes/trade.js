const express = require('express');
const router = express.Router();
const { placeTrade } = require('../controllers/tradeCtrl');

// Define the route for placing a trade
router.post('/place', placeTrade);

module.exports = router;
