const KiteService = require('../services/kite');
const { sendPushNotification } = require('../services/notificationService'); // Import notifications

let activeTradesToMonitor = [];

const startMonitoring = (mainAccount) => {
    if (!mainAccount || !mainAccount.apiKey || !mainAccount.accessToken) {
        console.log("Cannot start monitor: Missing Main Account Credentials");
        return;
    }

    const kite = new KiteService(mainAccount.apiKey, mainAccount.accessToken);
    const tokensToSubscribe = activeTradesToMonitor.map(trade => parseInt(trade.instrumentToken));
    
    if (tokensToSubscribe.length === 0) return;

    kite.initTicker(tokensToSubscribe, (ticks) => {
        processLiveTicks(ticks, kite);
    });
};

const processLiveTicks = async (ticks, kiteInstance) => {
    ticks.forEach(async (tick) => {
        const currentLtp = tick.last_price;
        const instrumentToken = tick.instrument_token;

        const relevantTrades = activeTradesToMonitor.filter(t => parseInt(t.instrumentToken) === instrumentToken);

        for (let trade of relevantTrades) {
            
            // 1. Check Target Hit
            if (trade.targetPrice) {
                if ((trade.transactionType === "BUY" && currentLtp >= trade.targetPrice) || 
                    (trade.transactionType === "SELL" && currentLtp <= trade.targetPrice)) {
                    
                    console.log(`Target Hit for ${trade.symbol} at ${currentLtp}`);
                    
                    // Trigger Web Push Notification
                    sendPushNotification(trade.userId, {
                        title: "🎯 Target Hit!",
                        message: `${trade.symbol} reached your target of ₹${currentLtp}. Position exiting.`
                    });

                    await executeExit(trade, kiteInstance);
                }
            }

            // 2. Check Trailing Stop Loss Logic
            if (trade.trailPoints > 0) {
                if (trade.transactionType === "BUY" && currentLtp >= trade.highestReached + trade.trailPoints) {
                    trade.highestReached = currentLtp;
                    trade.currentSL += trade.trailPoints;
                    
                    console.log(`Trailing SL Moved to ${trade.currentSL} for ${trade.symbol}`);
                    
                    // Alert user that SL has moved
                    sendPushNotification(trade.userId, {
                        title: "📈 Trailing SL Updated",
                        message: `Your stop loss for ${trade.symbol} has been trailed to ₹${trade.currentSL}.`
                    });

                    if(trade.slOrderId) {
                         await kiteInstance.modifyOrder(trade.slOrderId, { price: trade.currentSL });
                    }
                }
                // (Add inverse logic for SELL orders here if needed)
            }
        }
    });
};

const executeExit = async (trade, kiteInstance) => {
    console.log(`Exiting Trade ID: ${trade.id}`);
    activeTradesToMonitor = activeTradesToMonitor.filter(t => t.id !== trade.id);
};

const addTradeToMonitor = (tradeDetails) => {
    activeTradesToMonitor.push(tradeDetails);
    console.log(`Added ${tradeDetails.symbol} to monitor.`);
};

module.exports = { startMonitoring, addTradeToMonitor };
