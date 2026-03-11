const { executeMultiAccountTrade } = require('../services/order');
const BrokerAccount = require('../models/BrokerAccount');
const { startMonitoring } = require('../workers/tradeMonitor');

// Flag to ensure we don't start multiple duplicate WebSocket connections
let isMonitorRunning = false;

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

        // 2. Start the WebSocket Monitor if it isn't running already
        // We use the first linked account to stream the live market data
        if (!isMonitorRunning && tradeDetails.instrumentToken) {
            startMonitoring(linkedAccounts[0]);
            isMonitorRunning = true;
        }

        // 3. Execute the trades across all accounts and send to monitor
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
