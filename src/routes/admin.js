const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserStatus, adminCreateUser } = require('../controllers/adminCtrl');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id', protect, admin, updateUserStatus);
router.post('/users', protect, admin, adminCreateUser);

module.exports = router;
