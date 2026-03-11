const KiteService = require('./kite');
const { addTradeToMonitor } = require('../workers/tradeMonitor');

async function executeMultiAccountTrade(tradeDetails, linkedAccounts) {
    const results = [];

    for (const account of linkedAccounts) {
        const kite = new KiteService(account.apiKey, account.accessToken);
        
        try {
            // 1. Format and place the primary order
            const orderParams = {
                exchange: tradeDetails.exchange,
                tradingsymbol: tradeDetails.symbol,
                transaction_type: tradeDetails.transactionType, // BUY or SELL
                quantity: tradeDetails.quantity * account.lotMultiplier, // Multiplier logic
                product: tradeDetails.product, // MIS or CNC/NRML
                order_type: tradeDetails.orderType, // MARKET or LIMIT
                price: tradeDetails.price || 0,
                trigger_price: tradeDetails.triggerPrice || 0,
                validity: "DAY"
            };

            const orderId = await kite.placeRegularOrder(orderParams);
            results.push({ accountId: account.id, status: 'Success', orderId });
            
            // 2. If the user provided Target or Trailing points, send it to the Monitor
            if (tradeDetails.instrumentToken && (tradeDetails.targetPoints || tradeDetails.trailPoints)) {
                
                let targetPrice = 0;
                let initialSL = 0;
                const basePrice = tradeDetails.price; // For market orders, you would ideally fetch the executed price here

                // Calculate exact target and SL prices based on points
                if (tradeDetails.transactionType === "BUY") {
                    targetPrice = basePrice + (tradeDetails.targetPoints || 0);
                    initialSL = basePrice - (tradeDetails.slPoints || 0);
                } else { // SELL
                    targetPrice = basePrice - (tradeDetails.targetPoints || 0);
                    initialSL = basePrice + (tradeDetails.slPoints || 0);
                }

                // Create the payload for the WebSocket Monitor
                const monitorPayload = {
                    id: orderId, // Track by Zerodha's order ID
                    accountId: account.id,
                    apiKey: account.apiKey,
                    accessToken: account.accessToken,
                    symbol: tradeDetails.symbol,
                    instrumentToken: tradeDetails.instrumentToken,
                    transactionType: tradeDetails.transactionType,
                    quantity: orderParams.quantity,
                    product: tradeDetails.product,
                    targetPrice: targetPrice,
                    currentSL: initialSL,
                    trailPoints: tradeDetails.trailPoints || 0,
                    highestReached: basePrice
                };

                addTradeToMonitor(monitorPayload);
            }
            
        } catch (error) {
            results.push({ accountId: account.id, status: 'Failed', error: error.message });
        }
    }
    
    return results;
}

module.exports = { executeMultiAccountTrade };
