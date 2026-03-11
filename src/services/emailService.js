const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter using SMTP
    // You will add EMAIL_USER and EMAIL_PASS to your Railway Environment Variables
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Define the email options
    const mailOptions = {
        from: `Zerodha Trading System <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
