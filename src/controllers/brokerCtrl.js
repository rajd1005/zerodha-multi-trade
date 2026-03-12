const KiteConnect = require("kiteconnect").KiteConnect;
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

// @desc    Save daily Access Token manually (Fallback/Legacy method)
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

// @desc    Automated OAuth Login: Exchange request_token for access_token
// @route   POST /api/brokers/generate-session
// @access  Private
const generateAccessToken = async (req, res) => {
    try {
        const { accountId, requestToken } = req.body;

        // 1. Fetch the saved broker account to get the API Key and Secret
        const account = await BrokerAccount.findOne({ _id: accountId, userId: req.user.id });
        if (!account) return res.status(404).json({ error: 'Broker account not found' });

        // 2. Initialize KiteConnect to generate the session
        const kite = new KiteConnect({ api_key: account.apiKey });
        
        // 3. Exchange request_token + api_secret for the access_token
        const session = await kite.generateSession(requestToken, account.apiSecret);

        // 4. Save the new access token to the database
        account.accessToken = session.access_token;
        await account.save();

        res.status(200).json({ message: 'Zerodha Login Successful!', account });
    } catch (error) {
        console.error("Failed to generate access token:", error.message);
        res.status(500).json({ error: 'Failed to authenticate with Zerodha' });
    }
};

module.exports = { 
    addBrokerAccount, 
    getBrokerAccounts, 
    updateAccessToken, 
    generateAccessToken 
};
