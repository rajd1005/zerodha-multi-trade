const { executeMultiAccountTrade } = require('../services/order');
const { executePaperTrade } = require('../services/paperTradeService');
const BrokerAccount = require('../models/BrokerAccount');
const User = require('../models/User');
const PaperTrade = require('../models/PaperTrade');
const { startMonitoring } = require('../workers/tradeMonitor');
const { checkRiskLimits } = require('../services/riskManager');

let isMonitorRunning = false;

const placeTrade = async (req, res) => {
    try {
        const tradeDetails = req.body;
        
        // 1. Fetch the user to determine their current tradeMode
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        // --- PAPER TRADING ROUTE ---
        if (user.tradeMode === 'paper') {
            const results = await executePaperTrade(user._id, tradeDetails);
            return res.status(200).json({
                message: "Paper trade execution completed",
                results: results
            });
        }

        // --- LIVE TRADING ROUTE ---
        const linkedAccounts = await BrokerAccount.find({ 
            userId: req.user.id, 
            isActive: true 
        });

        if (!linkedAccounts || linkedAccounts.length === 0) {
            return res.status(400).json({ error: "No active broker accounts found. Please add an API key first." });
        }

        await checkRiskLimits(req.user.id, linkedAccounts);

        if (!isMonitorRunning && tradeDetails.instrumentToken) {
            startMonitoring(linkedAccounts[0]);
            isMonitorRunning = true;
        }

        const results = await executeMultiAccountTrade(tradeDetails, linkedAccounts);
        
        res.status(200).json({
            message: "Live trade execution process completed",
            results: results
        });

    } catch (error) {
        console.error("Trade Execution Error:", error.message);
        const statusCode = error.message.includes("limit") || error.message.includes("Risk Manager") ? 403 : 500;
        res.status(statusCode).json({ error: error.message || "Failed to process trades" });
    }
};

// @desc    Get user's paper trading history
// @route   GET /api/trades/paper-history
// @access  Private
const getPaperTrades = async (req, res) => {
    try {
        const trades = await PaperTrade.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(trades);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch paper trades" });
    }
};

// @desc    Toggle between 'paper' and 'live' trading mode
// @route   PUT /api/trades/mode
// @access  Private
const toggleTradeMode = async (req, res) => {
    try {
        const { mode } = req.body; 
        if (!['paper', 'live'].includes(mode)) {
            return res.status(400).json({ error: "Invalid trade mode. Must be 'paper' or 'live'." });
        }

        const user = await User.findByIdAndUpdate(req.user.id, { tradeMode: mode }, { new: true }).select('-password');
        res.status(200).json({ message: `Trade mode switched to ${mode.toUpperCase()}`, user });
    } catch (error) {
        res.status(500).json({ error: "Failed to switch trade mode" });
    }
};

module.exports = { placeTrade, getPaperTrades, toggleTradeMode };
