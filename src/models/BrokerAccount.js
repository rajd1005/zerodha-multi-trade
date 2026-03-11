const mongoose = require('mongoose');

const brokerAccountSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    brokerName: { type: String, default: 'Zerodha' },
    
    // API Credentials
    apiKey: { type: String, required: true },
    apiSecret: { type: String, required: true },
    accessToken: { type: String }, // Generated daily from Zerodha
    
    // Copy Trading Settings
    accountAlias: { type: String }, // e.g., "Wife's Account", "HUF Account"
    lotMultiplier: { type: Number, default: 1 }, // E.g., If main account buys 1 lot, this account buys 2 lots
    isActive: { type: Boolean, default: true },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BrokerAccount', brokerAccountSchema);
