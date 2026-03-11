const PaperTrade = require('../models/PaperTrade');

async function executePaperTrade(userId, tradeDetails) {
    try {
        let targetPrice = 0;
        let initialSL = 0;
        const basePrice = tradeDetails.price || 0;

        // Calculate virtual target and SL exactly as we do for live trades
        if (tradeDetails.targetPoints || tradeDetails.slPoints) {
            if (tradeDetails.transactionType === "BUY") {
                targetPrice = basePrice + (tradeDetails.targetPoints || 0);
                initialSL = basePrice - (tradeDetails.slPoints || 0);
            } else {
                targetPrice = basePrice - (tradeDetails.targetPoints || 0);
                initialSL = basePrice + (tradeDetails.slPoints || 0);
            }
        }

        const virtualTrade = await PaperTrade.create({
            userId: userId,
            symbol: tradeDetails.symbol,
            transactionType: tradeDetails.transactionType,
            quantity: tradeDetails.quantity,
            product: tradeDetails.product,
            orderType: tradeDetails.orderType,
            price: tradeDetails.price,
            targetPrice: targetPrice > 0 ? targetPrice : undefined,
            stopLoss: initialSL > 0 ? initialSL : undefined,
            status: 'OPEN'
        });

        // Return a mock result identical in structure to the live trade array
        return [{
            accountId: 'PAPER_ACCOUNT',
            status: 'Success',
            orderId: virtualTrade._id.toString(),
            message: 'Paper trade executed locally'
        }];
    } catch (error) {
        console.error("Paper Trade Execution Error:", error);
        throw new Error("Failed to execute paper trade");
    }
}

module.exports = { executePaperTrade };
