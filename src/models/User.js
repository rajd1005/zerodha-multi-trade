const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    
    // Subscription & Access
    isActive: { type: Boolean, default: true },
    subscriptionEndDate: { type: Date },
    isDemo: { type: Boolean, default: false },
    
    // Risk Management Settings
    maxLossPerDay: { type: Number, default: 0 }, // 0 means unlimited
    maxProfitPerDay: { type: Number, default: 0 },
    
    // Trade Mode Preference
    tradeMode: { type: String, enum: ['paper', 'live'], default: 'paper' },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
