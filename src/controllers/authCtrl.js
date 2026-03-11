const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
};

// @desc    Update user status, demo, or subscription
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
    try {
        const { isActive, isDemo, subscriptionDaysToAdd } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        if (isActive !== undefined) user.isActive = isActive;
        if (isDemo !== undefined) user.isDemo = isDemo;
        
        if (subscriptionDaysToAdd) {
            const currentEnd = user.subscriptionEndDate && user.subscriptionEndDate > new Date() 
                ? user.subscriptionEndDate 
                : new Date();
            
            const newDate = new Date(currentEnd);
            newDate.setDate(newDate.getDate() + parseInt(subscriptionDaysToAdd));
            user.subscriptionEndDate = newDate;
        }

        await user.save();
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// @desc    Admin manually creates a new user
// @route   POST /api/admin/users
// @access  Private/Admin
const adminCreateUser = async (req, res) => {
    try {
        const { name, email, password, isDemo, subscriptionDays } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ error: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let subscriptionEndDate = null;
        if (subscriptionDays) {
            subscriptionEndDate = new Date();
            subscriptionEndDate.setDate(subscriptionEndDate.getDate() + parseInt(subscriptionDays));
        }

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            isDemo: isDemo || false,
            subscriptionEndDate,
            isActive: true 
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to create user" });
    }
};

module.exports = {
    getAllUsers,
    updateUserStatus,
    adminCreateUser
};
