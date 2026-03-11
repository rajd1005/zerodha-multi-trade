const User = require('../models/User');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        // Fetch all users but exclude their passwords from the result
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// @desc    Update user access, subscription, or demo status
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUserAccess = async (req, res) => {
    try {
        const { isActive, isDemo, subscriptionDaysToAdd } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Update basic status
        if (typeof isActive !== 'undefined') user.isActive = isActive;
        if (typeof isDemo !== 'undefined') user.isDemo = isDemo;

        // Logic to add days to subscription or demo
        if (subscriptionDaysToAdd) {
            const currentDate = user.subscriptionEndDate && user.subscriptionEndDate > Date.now() 
                ? new Date(user.subscriptionEndDate) 
                : new Date();
                
            currentDate.setDate(currentDate.getDate() + subscriptionDaysToAdd);
            user.subscriptionEndDate = currentDate;
        }

        const updatedUser = await user.save();
        
        res.status(200).json({
            message: 'User access updated successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                isActive: updatedUser.isActive,
                isDemo: updatedUser.isDemo,
                subscriptionEndDate: updatedUser.subscriptionEndDate
            }
        });

    } catch (error) {
        console.error("Admin Update Error:", error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

module.exports = { getAllUsers, updateUserAccess };
