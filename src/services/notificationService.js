const webpush = require('web-push');
const NotificationSub = require('../models/NotificationSub');

// You will generate these VAPID keys later and put them in your Railway .env
// For now, we use placeholders so the server doesn't crash if they are missing
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BM_dummy_public_key_generate_later';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'dummy_private_key';

webpush.setVapidDetails(
    'mailto:your-email@example.com',
    publicVapidKey,
    privateVapidKey
);

const sendPushNotification = async (userId, payload) => {
    try {
        // Find all devices this user has allowed notifications on
        const subscriptions = await NotificationSub.find({ userId });

        if (subscriptions.length === 0) return;

        const pushPayload = JSON.stringify({
            title: payload.title || 'Trade Alert',
            body: payload.message,
            icon: '/icon-192x192.png'
        });

        const sendPromises = subscriptions.map(sub => 
            webpush.sendNotification(sub, pushPayload).catch(err => {
                console.error("Failed to send to a subscription, it might be expired:", err.message);
                // Optionally delete expired subscriptions here
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

module.exports = { sendPushNotification };
