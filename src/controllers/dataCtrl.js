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
// @route   GET /api/data/search?query=NIFTY&exchange=ALL
// @access  Private
const searchInstruments = async (req, res) => {
    try {
        const { query, exchange = 'ALL' } = req.query;
        if (!query) return res.status(400).json({ error: 'Search query is required' });

        const kite = await getUserKiteInstance(req.user.id);

        // Refresh cache if it's empty or older than 12 hours
        const cacheAge = instrumentCache.lastFetched ? (Date.now() - instrumentCache.lastFetched) / (1000 * 60 * 60) : 999;
        
        if (instrumentCache.data.length === 0 || cacheAge > 12) {
            console.log("Fetching fresh instruments from Zerodha...");
            // Fetch ALL instruments if no specific exchange is forced
            instrumentCache.data = await kite.getInstruments();
            instrumentCache.lastFetched = Date.now();
        }

        // Filter the cached data based on the user's search string (e.g., "NIFTY24APR22500CE" or "RELIANCE")
        const searchString = query.toUpperCase();
        let results = instrumentCache.data
            // Added safety check: item && item.tradingsymbol
            .filter(item => item && item.tradingsymbol && item.tradingsymbol.includes(searchString));

        if (exchange !== 'ALL') {
            results = results.filter(item => item.exchange === exchange);
        }

        // Limit to 50 results to keep the UI fast
        results = results.slice(0, 50);

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Live Last Traded Price (LTP) for multiple instruments
// @route   GET /api/data/ltp?instruments=NSE:INFY,NFO:NIFTY24MAY22000CE
// @access  Private
const getLtp = async (req, res) => {
    try {
        const { instruments } = req.query; 
        if (!instruments) return res.status(400).json({ error: 'Instruments query parameter is required' });
        
        const kite = await getUserKiteInstance(req.user.id);
        const ltpData = await kite.getLTP(instruments.split(','));
        res.status(200).json(ltpData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Option Chain for a specific underlying symbol
// @route   GET /api/data/option-chain?symbol=NIFTY
// @access  Private
const getOptionChain = async (req, res) => {
    try {
        const { symbol } = req.query; 
        if (!symbol) return res.status(400).json({ error: 'Symbol query parameter is required' });

        const kite = await getUserKiteInstance(req.user.id);
        
        // Ensure instruments are cached
        if (instrumentCache.data.length === 0) {
            instrumentCache.data = await kite.getInstruments();
            instrumentCache.lastFetched = Date.now();
        }

        // Find all NFO options matching the underlying symbol name
        const options = instrumentCache.data.filter(i => i.name === symbol && i.segment === 'NFO-OPT');
        
        if (options.length === 0) return res.json([]);

        // Get unique expiries and find the closest one
        const expiries = [...new Set(options.map(i => i.expiry))].sort((a, b) => new Date(a) - new Date(b));
        const nearestExpiry = expiries[0];

        // Filter options for nearest expiry and group by strike price
        const nearestOptions = options.filter(i => i.expiry === nearestExpiry);
        const chainMap = {};
        
        nearestOptions.forEach(opt => {
            if(!chainMap[opt.strike]) chainMap[opt.strike] = { strike: opt.strike };
            if(opt.instrument_type === 'CE') chainMap[opt.strike].CE = opt;
            if(opt.instrument_type === 'PE') chainMap[opt.strike].PE = opt;
        });

        // Convert map to array and sort by strike price
        const chainArray = Object.values(chainMap).sort((a,b) => a.strike - b.strike);
        
        res.status(200).json({ expiry: nearestExpiry, chain: chainArray });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getBalance, getPositions, searchInstruments, getLtp, getOptionChain };
