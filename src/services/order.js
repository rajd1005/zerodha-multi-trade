const KiteService = require('./kite');
const { addTradeToMonitor } = require('../workers/tradeMonitor');

async function executeMultiAccountTrade(tradeDetails, linkedAccounts) {
    const results = [];

    for (const account of linkedAccounts) {
        const kite = new KiteService(account.apiKey, account.accessToken);
        
        try {
            const orderParams = {
                exchange: tradeDetails.exchange,
                tradingsymbol: tradeDetails.symbol,
                transaction_type: tradeDetails.transactionType,
                quantity: tradeDetails.quantity * account.lotMultiplier,
                product: tradeDetails.product,
                order_type: tradeDetails.orderType,
                price: tradeDetails.price || 0,
                trigger_price: tradeDetails.triggerPrice || 0,
                validity: "DAY"
            };

            const orderId = await kite.placeRegularOrder(orderParams);
            results.push({ accountId: account.id, status: 'Success', orderId });
            
            if (tradeDetails.instrumentToken && (tradeDetails.targetPoints || tradeDetails.trailPoints)) {
                
                let targetPrice = 0;
                let initialSL = 0;
                const basePrice = tradeDetails.price || 0; 

                if (tradeDetails.transactionType === "BUY") {
                    targetPrice = basePrice + (tradeDetails.targetPoints || 0);
                    initialSL = basePrice - (tradeDetails.slPoints || 0);
                } else { 
                    targetPrice = basePrice - (tradeDetails.targetPoints || 0);
                    initialSL = basePrice + (tradeDetails.slPoints || 0);
                }

                const monitorPayload = {
                    id: orderId,
                    userId: account.userId, // Added userId for Notifications
                    accountId: account.id,
                    apiKey: account.apiKey,
                    accessToken: account.accessToken,
                    symbol: tradeDetails.symbol,
                    instrumentToken: tradeDetails.instrumentToken,
                    transactionType: tradeDetails.transactionType,
                    quantity: orderParams.quantity,
                    product: tradeDetails.product,
                    targetPrice: targetPrice > 0 ? targetPrice : undefined,
                    currentSL: initialSL > 0 ? initialSL : undefined,
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
