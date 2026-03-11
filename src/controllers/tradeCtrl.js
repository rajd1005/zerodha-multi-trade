const { executeMultiAccountTrade } = require('../services/order');

const placeTrade = async (req, res) => {
    try {
        const tradeDetails = req.body;
        
        // Temporarily mocking linked accounts for testing
        // Later, this will fetch from MongoDB
        const dummyLinkedAccounts = [
            { id: 'user_acc_1', apiKey: 'dummy_key', accessToken: 'dummy_token', lotMultiplier: 1 }
        ];

        const results = await executeMultiAccountTrade(tradeDetails, dummyLinkedAccounts);
        
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
