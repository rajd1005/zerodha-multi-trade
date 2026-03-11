const NotificationSub = require('../models/NotificationSub');
const SystemConfig = require('../models/SystemConfig');

// @desc    Get VAPID Public Key for Frontend Subscription
// @route   GET /api/notifications/vapid-public-key
// @access  Public
const getPublicKey = async (req, res) => {
    try {
        const config = await SystemConfig.findOne({ keyName: 'VAPID_KEYS' });
        if (!config || !config.publicKey) {
            return res.status(500).json({ error: "VAPID keys are not initialized yet." });
        }
        res.status(200).json({ publicKey: config.publicKey });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch public key" });
    }
};

// @desc    Save User Push Subscription
// @route   POST /api/notifications/subscribe
// @access  Private
const subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        
        // Prevent duplicate subscriptions for the exact same device/browser
        const existingSub = await NotificationSub.findOne({ endpoint: subscription.endpoint });
        if (!existingSub) {
            await NotificationSub.create({
                userId: req.user.id,
                endpoint: subscription.endpoint,
                keys: subscription.keys
            });
        }
        res.status(201).json({ message: "Subscribed to notifications successfully." });
    } catch (error) {
        res.status(500).json({ error: "Failed to save subscription" });
    }
};

module.exports = { getPublicKey, subscribe };
