const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../services/emailService');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ error: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // Send Welcome Email
        try {
            const message = `Hello ${name},\n\nWelcome to the Trading System. Your account has been created successfully.`;
            await sendEmail({ email: user.email, subject: 'Account Created', message });
        } catch (emailError) {
            console.error("Welcome email failed to send, but user was created.", emailError);
        }

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role)
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during registration' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role)
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error during login' });
    }
};

// @desc    Forgot Password - Generates token and emails it
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ error: 'There is no user with that email' });

        // Generate a random token
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // Hash it and set to user model
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        await user.save();

        // Create reset url (this will point to your frontend app)
        const resetUrl = `${req.protocol}://${req.get('host')}/resetpassword/${resetToken}`;
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password.\n\nPlease use the following token to reset your password on the frontend:\n\n${resetToken}\n\nIf you did not request this, please ignore this email.`;

        try {
            await sendEmail({ email: user.email, subject: 'Password Reset Request', message });
            res.status(200).json({ message: 'Email sent successfully' });
        } catch (emailError) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ error: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error during password reset request' });
    }
};

// @desc    Reset Password using token
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
            message: "Password reset successful"
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during password reset' });
    }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };
