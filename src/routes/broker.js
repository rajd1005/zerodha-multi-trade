const express = require('express');
const router = express.Router();
const { 
    addBrokerAccount, 
    getBrokerAccounts, 
    updateAccessToken, 
    generateAccessToken 
} = require('../controllers/brokerCtrl');
const { protect } = require('../middleware/authMiddleware');

// All routes here are protected
router.route('/').post(protect, addBrokerAccount).get(protect, getBrokerAccounts);

// Manual daily token update (Fallback/Legacy method)
router.route('/:id/token').put(protect, updateAccessToken);

// Automated OAuth Login: Exchange request_token for access_token
router.route('/generate-session').post(protect, generateAccessToken);

module.exports = router;
