const webpush = require('web-push');
const NotificationSub = require('../models/NotificationSub');
const SystemConfig = require('../models/SystemConfig');

// @desc Auto-generates and loads VAPID keys from the database
const initVapidKeys = async () => {
    try {
        let config = await SystemConfig.findOne({ keyName: 'VAPID_KEYS' });

        if (!config) {
            console.log("⚙️ No VAPID keys found in DB. Generating new ones now...");
            
            // Automatically generate keys
            const vapidKeys = webpush.generateVAPIDKeys();
            
            // Save them permanently to MongoDB
            config = await SystemConfig.create({
                keyName: 'VAPID_KEYS',
                publicKey: vapidKeys.publicKey,
                privateKey: vapidKeys.privateKey
            });
            console.log("✅ New VAPID keys generated and saved to DB successfully!");
        } else {
            console.log("✅ VAPID keys loaded from Database.");
        }

        // Initialize web-push with the persistent keys
        webpush.setVapidDetails(
            'mailto:admin@zerodhatradesystem.com', // You can change this to your email
            config.publicKey,
            config.privateKey
        );

    } catch (error) {
        console.error("❌ Failed to initialize VAPID keys:", error.message);
    }
};

// @desc Sends the actual push notification to the user's devices
const sendPushNotification = async (userId, payload) => {
    try {
        const subscriptions = await NotificationSub.find({ userId });

        if (subscriptions.length === 0) return;

        const pushPayload = JSON.stringify({
            title: payload.title || 'Trade Alert',
            body: payload.message,
            icon: '/icon-192x192.png' // This will look for the logo in your PWA frontend
        });

        const sendPromises = subscriptions.map(sub => 
            webpush.sendNotification(sub, pushPayload).catch(err => {
                console.error("Failed to send push notification. Subscription might be revoked:", err.message);
                // If the user blocked notifications or the endpoint expired, delete it from DB
                if (err.statusCode === 410 || err.statusCode === 404) {
                    return NotificationSub.findByIdAndDelete(sub._id);
                }
            })
        );

        await Promise.all(sendPromises);
    } catch (error) {
        console.error("Push Notification Error:", error.message);
    }
};

module.exports = { initVapidKeys, sendPushNotification };
