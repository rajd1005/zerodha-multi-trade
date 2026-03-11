const KiteService = require('../services/kite');

// In a real production environment, you would use Redis or a Database
// to store active trades. For this step, we use an array in memory.
let activeTradesToMonitor = [];

// @desc Starts the WebSocket connection and listens for price changes
const startMonitoring = (mainAccount) => {
    if (!mainAccount || !mainAccount.apiKey || !mainAccount.accessToken) {
        console.log("Cannot start monitor: Missing Main Account Credentials");
        return;
    }

    const kite = new KiteService(mainAccount.apiKey, mainAccount.accessToken);
    
    // Extract instrument tokens from active trades
    const tokensToSubscribe = activeTradesToMonitor.map(trade => parseInt(trade.instrumentToken));
    
    if (tokensToSubscribe.length === 0) return;

    kite.initTicker(tokensToSubscribe, (ticks) => {
        processLiveTicks(ticks, kite);
    });
};

// @desc Logic to evaluate targets and Trailing SL based on live price
const processLiveTicks = async (ticks, kiteInstance) => {
    ticks.forEach(async (tick) => {
        const currentLtp = tick.last_price;
        const instrumentToken = tick.instrument_token;

        // Find all active trades matching this instrument
        const relevantTrades = activeTradesToMonitor.filter(t => parseInt(t.instrumentToken) === instrumentToken);

        for (let trade of relevantTrades) {
            
            // 1. Check Target Hit
            if (trade.transactionType === "BUY" && currentLtp >= trade.targetPrice) {
                console.log(`Target Hit for ${trade.symbol} at ${currentLtp}`);
                await executeExit(trade, kiteInstance);
            } 
            else if (trade.transactionType === "SELL" && currentLtp <= trade.targetPrice) {
                 console.log(`Target Hit for ${trade.symbol} at ${currentLtp}`);
                 await executeExit(trade, kiteInstance);
            }

            // 2. Check Trailing Stop Loss Logic (Example for BUY orders)
            if (trade.transactionType === "BUY" && trade.trailPoints > 0) {
                // If LTP moves up by 'trailPoints', move SL up by 'trailPoints'
                if (currentLtp >= trade.highestReached + trade.trailPoints) {
                    trade.highestReached = currentLtp;
                    trade.currentSL += trade.trailPoints;
                    
                    console.log(`Trailing SL Moved to ${trade.currentSL} for ${trade.symbol}`);
                    
                    // Call kiteInstance.modifyOrder() here to update SL in Zerodha
                    if(trade.slOrderId) {
                         await kiteInstance.modifyOrder(trade.slOrderId, { price: trade.currentSL });
                    }
                }
            }
        }
    });
};

// @desc Handles the exit when target/SL hits
const executeExit = async (trade, kiteInstance) => {
    // 1. Place a market order to exit the position
    // 2. Cancel any pending SL orders
    // 3. Remove from activeTradesToMonitor array
    
    // (We will build the multi-account exit logic here next)
    console.log(`Exiting Trade ID: ${trade.id}`);
    
    // Remove trade from monitoring array
    activeTradesToMonitor = activeTradesToMonitor.filter(t => t.id !== trade.id);
};

// @desc Adds a new trade to the monitoring array
const addTradeToMonitor = (tradeDetails) => {
    activeTradesToMonitor.push(tradeDetails);
    console.log(`Added ${tradeDetails.symbol} to monitor.`);
    // You would restart the ticker here to subscribe to the new token
};

module.exports = { startMonitoring, addTradeToMonitor };
