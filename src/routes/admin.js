const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserStatus, adminCreateUser } = require('../controllers/adminCtrl');

// CHANGE 'admin' TO 'adminOnly' IN THE IMPORT BELOW
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get all registered users - UPDATE 'admin' TO 'adminOnly'
router.get('/users', protect, adminOnly, getAllUsers);

// Update a specific user's subscription or status - UPDATE 'admin' TO 'adminOnly'
router.put('/users/:id', protect, adminOnly, updateUserStatus);

// Manually add a new user - UPDATE 'admin' TO 'adminOnly'
router.post('/users', protect, adminOnly, adminCreateUser);

module.exports = router;
