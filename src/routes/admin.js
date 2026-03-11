const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserAccess } = require('../controllers/adminCtrl');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes here require the user to be logged in AND be an admin
router.route('/users')
    .get(protect, adminOnly, getAllUsers);

router.route('/users/:id')
    .put(protect, adminOnly, updateUserAccess);

module.exports = router;
