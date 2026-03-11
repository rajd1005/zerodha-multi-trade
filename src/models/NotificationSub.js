const mongoose = require('mongoose');

const notificationSubSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    endpoint: { type: String, required: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NotificationSub', notificationSubSchema);
