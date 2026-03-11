const BrokerAccount = require('../models/BrokerAccount');
const KiteService = require('../services/kite');

// In-memory cache for instruments so we don't download it from Zerodha every keystroke
let instrumentCache = {
    data: [],
    lastFetched: null
};

// Helper function to get an active Kite instance for the logged-in user
const getUserKiteInstance = async (userId) => {
    const account = await BrokerAccount.findOne({ userId, isActive: true });
    if (!account) throw new Error('No active broker account found');
    return new KiteService(account.apiKey, account.accessToken);
};

// @desc    Get Available Margins/Balance
// @route   GET /api/data/balance
// @access  Private
const getBalance = async (req, res) => {
    try {
        const kite = await getUserKiteInstance(req.user.id);
        const margins = await kite.getMargins();
        
        // Return equity and commodity balances
        res.status(200).json({
            equity: margins.equity.available.live_balance,
            commodity: margins.commodity ? margins.commodity.available.live_balance : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Current Positions
// @route   GET /api/data/positions
// @access  Private
const getPositions = async (req, res) => {
    try {
        const kite = await getUserKiteInstance(req.user.id);
        const positions = await kite.getPositions();
        res.status(200).json(positions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Search for Instruments (Symbols, Options Strike Prices)
// @route   GET /api/data/search?query=NIFTY&exchange=NFO
// @access  Private
const searchInstruments = async (req, res) => {
    try {
        const { query, exchange = 'NFO' } = req.query;
        if (!query) return res.status(400).json({ error: 'Search query is required' });

        const kite = await getUserKiteInstance(req.user.id);

        // Refresh cache if it's empty or older than 12 hours
        const cacheAge = instrumentCache.lastFetched ? (Date.now() - instrumentCache.lastFetched) / (1000 * 60 * 60) : 999;
        
        if (instrumentCache.data.length === 0 || cacheAge > 12) {
            console.log("Fetching fresh instruments from Zerodha...");
            instrumentCache.data = await kite.getInstruments(exchange);
            instrumentCache.lastFetched = Date.now();
        }

        // Filter the cached data based on the user's search string (e.g., "NIFTY24APR22500CE")
        const searchString = query.toUpperCase();
        const results = instrumentCache.data
            .filter(item => item.tradingsymbol.includes(searchString))
            .slice(0, 50); // Limit to 50 results to keep the UI fast

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getBalance, getPositions, searchInstruments };
