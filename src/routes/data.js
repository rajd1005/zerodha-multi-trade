const express = require('express');
const router = express.Router();
const { getBalance, getPositions, searchInstruments } = require('../controllers/dataCtrl');
const { protect } = require('../middleware/authMiddleware');

router.get('/balance', protect, getBalance);
router.get('/positions', protect, getPositions);
router.get('/search', protect, searchInstruments);

module.exports = router;
