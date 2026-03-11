const express = require('express');
const router = express.Router();
const { addBrokerAccount, getBrokerAccounts, updateAccessToken } = require('../controllers/brokerCtrl');
const { protect } = require('../middleware/authMiddleware');

// All routes here are protected
router.route('/').post(protect, addBrokerAccount).get(protect, getBrokerAccounts);
router.route('/:id/token').put(protect, updateAccessToken);

module.exports = router;
