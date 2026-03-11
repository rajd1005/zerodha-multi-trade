require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initVapidKeys } = require('./services/notificationService'); // Import the initializer

const tradeRoutes = require('./routes/trade');
const authRoutes = require('./routes/auth');
const brokerRoutes = require('./routes/broker');
const adminRoutes = require('./routes/admin');
const dataRoutes = require('./routes/data');
const notificationRoutes = require('./routes/notification');

const app = express();

app.use(cors());
app.use(express.json());

// Start the Application
const startServer = async () => {
    // 1. Connect to Database First
    await connectDB();

    // 2. Initialize VAPID Keys dynamically in DB
    await initVapidKeys();

    // 3. Mount API Routes
    app.use('/api/trades', tradeRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/brokers', brokerRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/data', dataRoutes);
    app.use('/api/notifications', notificationRoutes);

    app.get('/health', (req, res) => res.status(200).send('Server is healthy & running!'));

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
