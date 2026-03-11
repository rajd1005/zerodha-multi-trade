const { executeMultiAccountTrade } = require('../services/order');
const BrokerAccount = require('../models/BrokerAccount');

const placeTrade = async (req, res) => {
    try {
        const tradeDetails = req.body;
        
        // 1. Fetch real, active broker accounts linked to this user from MongoDB
        const linkedAccounts = await BrokerAccount.find({ 
            userId: req.user.id, 
            isActive: true 
        });

        if (!linkedAccounts || linkedAccounts.length === 0) {
            return res.status(400).json({ error: "No active broker accounts found. Please add an API key first." });
        }

        // 2. Pass the real accounts to our execution service
        const results = await executeMultiAccountTrade(tradeDetails, linkedAccounts);
        
        res.status(200).json({
            message: "Trade execution process completed",
            results: results
        });

    } catch (error) {
        console.error("Trade Execution Error:", error);
        res.status(500).json({ error: "Failed to process trades" });
    }
};

module.exports = { placeTrade };
