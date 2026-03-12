const express = require('express');
const router = express.Router();
const { getBalance, getPositions, searchInstruments, getLtp, getOptionChain } = require('../controllers/dataCtrl');
const { protect } = require('../middleware/authMiddleware');

router.get('/balance', protect, getBalance);
router.get('/positions', protect, getPositions);
router.get('/search', protect, searchInstruments);

// New routes for fetching Live LTP and Option Chain
router.get('/ltp', protect, getLtp);
router.get('/option-chain', protect, getOptionChain);

module.exports = router;
