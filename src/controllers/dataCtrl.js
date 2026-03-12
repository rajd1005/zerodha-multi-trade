const BrokerAccount = require('../models/BrokerAccount');
const KiteService = require('../services/kite');

let instrumentCache = {
    data: [],
    lastFetched: null
};

const getUserKiteInstance = async (userId) => {
    const account = await BrokerAccount.findOne({ userId, isActive: true });
    if (!account) throw new Error('No active broker account found');
    return new KiteService(account.apiKey, account.accessToken);
};

const getBalance = async (req, res) => {
    try {
        const kite = await getUserKiteInstance(req.user.id);
        const margins = await kite.getMargins();
        res.status(200).json({
            equity: margins.equity.available.live_balance,
            commodity: margins.commodity ? margins.commodity.available.live_balance : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPositions = async (req, res) => {
    try {
        const kite = await getUserKiteInstance(req.user.id);
        const positions = await kite.getPositions();
        res.status(200).json(positions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const searchInstruments = async (req, res) => {
    try {
        const { query, exchange = 'ALL' } = req.query;
        if (!query) return res.status(400).json({ error: 'Search query is required' });

        const kite = await getUserKiteInstance(req.user.id);
        const cacheAge = instrumentCache.lastFetched ? (Date.now() - instrumentCache.lastFetched) / (1000 * 60 * 60) : 999;
        
        if (instrumentCache.data.length === 0 || cacheAge > 12) {
            console.log("Fetching fresh instruments from Zerodha...");
            instrumentCache.data = await kite.getInstruments();
            instrumentCache.lastFetched = Date.now();
        }

        const searchString = query.toUpperCase();
        let results = instrumentCache.data
            .filter(item => item && item.tradingsymbol && item.tradingsymbol.includes(searchString));

        if (exchange !== 'ALL') {
            results = results.filter(item => item.exchange === exchange);
        }

        results.sort((a, b) => {
            const aExact = a.tradingsymbol === searchString;
            const bExact = b.tradingsymbol === searchString;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;

            const aCash = a.segment === 'NSE' || a.segment === 'BSE';
            const bCash = b.segment === 'NSE' || b.segment === 'BSE';
            if (aCash && !bCash) return -1;
            if (!aCash && bCash) return 1;

            return 0;
        });

        results = results.slice(0, 50);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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

const getOptionChain = async (req, res) => {
    try {
        const { symbol } = req.query; 
        if (!symbol) return res.status(400).json({ error: 'Symbol query parameter is required' });

        const kite = await getUserKiteInstance(req.user.id);
        
        if (instrumentCache.data.length === 0) {
            instrumentCache.data = await kite.getInstruments();
            instrumentCache.lastFetched = Date.now();
        }

        let searchSymbol = symbol.toUpperCase();
        
        // Normalize common NSE Index names
        if (searchSymbol === 'NIFTY 50') searchSymbol = 'NIFTY';
        if (searchSymbol === 'NIFTY BANK') searchSymbol = 'BANKNIFTY';
        if (searchSymbol === 'NIFTY FIN SERVICE') searchSymbol = 'FINNIFTY';
        if (searchSymbol === 'NIFTY MID SELECT') searchSymbol = 'MIDCPNIFTY';

        const options = instrumentCache.data.filter(i => 
            i.name === searchSymbol && (i.segment === 'NFO-OPT' || i.segment === 'BFO-OPT')
        );
        
        if (options.length === 0) return res.json([]);

        // Filter out past expiries just in case
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const validOptions = options.filter(i => new Date(i.expiry) >= today);
        const optionsToUse = validOptions.length > 0 ? validOptions : options;

        const expiries = [...new Set(optionsToUse.map(i => i.expiry))].sort((a, b) => new Date(a) - new Date(b));
        
        // FIX: Find a valid expiry that has a proper option chain (> 10 strikes) to avoid anomalies
        let nearestExpiry = expiries[0];
        for (let exp of expiries) {
            const strikeCount = new Set(optionsToUse.filter(i => i.expiry === exp).map(i => i.strike)).size;
            if (strikeCount > 10) {
                nearestExpiry = exp;
                break;
            }
        }

        const nearestOptions = optionsToUse.filter(i => i.expiry === nearestExpiry);
        const chainMap = {};
        
        nearestOptions.forEach(opt => {
            if(!chainMap[opt.strike]) chainMap[opt.strike] = { strike: opt.strike };
            if(opt.instrument_type === 'CE') chainMap[opt.strike].CE = opt;
            if(opt.instrument_type === 'PE') chainMap[opt.strike].PE = opt;
        });

        const chainArray = Object.values(chainMap).sort((a,b) => a.strike - b.strike);
        res.status(200).json({ expiry: nearestExpiry, chain: chainArray });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getBalance, getPositions, searchInstruments, getLtp, getOptionChain };
