const KiteService = require('./kite');

// In the future, this will fetch linked accounts from your DB
async function executeMultiAccountTrade(tradeDetails, linkedAccounts) {
    const results = [];

    for (const account of linkedAccounts) {
        const kite = new KiteService(account.apiKey, account.accessToken);
        
        try {
            // Format order as per Zerodha's requirements
            const orderParams = {
                exchange: tradeDetails.exchange,
                tradingsymbol: tradeDetails.symbol,
                transaction_type: tradeDetails.transactionType, // BUY or SELL
                quantity: tradeDetails.quantity * account.lotMultiplier, // Multiplier logic
                product: tradeDetails.product, // MIS or CNC/NRML
                order_type: tradeDetails.orderType, // MARKET, LIMIT, SL, SL-M
                price: tradeDetails.price || 0,
                trigger_price: tradeDetails.triggerPrice || 0,
                validity: "DAY"
            };

            const orderId = await kite.placeRegularOrder(orderParams);
            results.push({ accountId: account.id, status: 'Success', orderId });
            
        } catch (error) {
            results.push({ accountId: account.id, status: 'Failed', error: error.message });
        }
    }
    
    return results;
}

module.exports = { executeMultiAccountTrade };
