require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const tradeRoutes = require('./routes/trade');
const authRoutes = require('./routes/auth'); // Add this line
const brokerRoutes = require('./routes/broker');
const adminRoutes = require('./routes/admin'); // Add this near the top
const dataRoutes = require('./routes/data'); // Add this line

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// API Routes
app.use('/api/trades', tradeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/brokers', brokerRoutes); // Add this line
app.use('/api/admin', adminRoutes); // Add this line
app.use('/api/data', dataRoutes); // Add this line

app.get('/health', (req, res) => res.status(200).send('Server is healthy & running!'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
