const User = require('../models/User');
const bcrypt = require('bcryptjs');

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

        // Calculate subscription end date if days are provided
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
            isActive: true // Admin created users are active by default
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

// Ensure you export the new function
module.exports = {
    getAllUsers,
    updateUserStatus,
    adminCreateUser // Add this to exports
};
