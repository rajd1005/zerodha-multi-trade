const BrokerAccount = require('../models/BrokerAccount');

// @desc    Add a new Zerodha Broker Account
// @route   POST /api/brokers
// @access  Private (Logged-in users only)
const addBrokerAccount = async (req, res) => {
    try {
        const { brokerName, apiKey, apiSecret, accountAlias, lotMultiplier } = req.body;

        const newAccount = await BrokerAccount.create({
            userId: req.user.id, // Comes from the JWT middleware
            brokerName: brokerName || 'Zerodha',
            apiKey,
            apiSecret,
            accountAlias,
            lotMultiplier: lotMultiplier || 1
        });

        res.status(201).json({ message: 'Broker account added successfully', account: newAccount });
    } catch (error) {
        console.error("Error adding broker:", error);
        res.status(500).json({ error: 'Failed to add broker account' });
    }
};

// @desc    Get all linked Broker Accounts for the logged-in user
// @route   GET /api/brokers
// @access  Private
const getBrokerAccounts = async (req, res) => {
    try {
        const accounts = await BrokerAccount.find({ userId: req.user.id });
        res.status(200).json(accounts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch broker accounts' });
    }
};

// @desc    Save daily Access Token (Zerodha requires generating this daily)
// @route   PUT /api/brokers/:id/token
// @access  Private
const updateAccessToken = async (req, res) => {
    try {
        const { accessToken } = req.body;
        const account = await BrokerAccount.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { accessToken },
            { new: true }
        );

        if (!account) return res.status(404).json({ error: 'Account not found' });
        
        res.status(200).json({ message: 'Access token updated successfully', account });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update access token' });
    }
};

module.exports = { addBrokerAccount, getBrokerAccounts, updateAccessToken };
