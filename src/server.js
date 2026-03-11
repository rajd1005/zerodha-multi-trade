require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const tradeRoutes = require('./routes/trade');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// API Routes
app.use('/api/trades', tradeRoutes);

// Basic health check route for Railway
app.get('/health', (req, res) => res.status(200).send('Server is healthy & running!'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
