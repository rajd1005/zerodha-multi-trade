const mongoose = require('mongoose');

const paperTradeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, required: true },
    transactionType: { type: String, enum: ['BUY', 'SELL'], required: true },
    quantity: { type: Number, required: true },
    product: { type: String, required: true },
    orderType: { type: String, required: true },
    price: { type: Number, default: 0 },
    targetPrice: { type: Number },
    stopLoss: { type: Number },
    status: { type: String, enum: ['OPEN', 'COMPLETED', 'CANCELLED'], default: 'OPEN' },
    pnl: { type: Number, default: 0 }, // Virtual Profit and Loss
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PaperTrade', paperTradeSchema);
