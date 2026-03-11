const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserStatus, adminCreateUser } = require('../controllers/adminCtrl');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all registered users
router.get('/users', protect, admin, getAllUsers);

// Update a specific user's subscription or status
router.put('/users/:id', protect, admin, updateUserStatus);

// Manually add a new user
router.post('/users', protect, admin, adminCreateUser);

module.exports = router;
