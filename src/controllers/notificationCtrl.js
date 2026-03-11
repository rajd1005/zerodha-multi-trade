const NotificationSub = require('../models/NotificationSub');

// @desc    Save User Push Subscription
// @route   POST /api/notifications/subscribe
// @access  Private
const subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        
        // Prevent duplicate subscriptions for the same endpoint
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

module.exports = { subscribe };
