const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    keyName: { type: String, required: true, unique: true }, // e.g., 'VAPID_KEYS'
    publicKey: { type: String },
    privateKey: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
