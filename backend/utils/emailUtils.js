const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER || 'test@ethereal.email',
    pass: process.env.EMAIL_PASS || 'pass123'
  }
});

exports.sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: '"EmPay HRMS" <noreply@empay.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    // Attempt to send email but don't crash if config is invalid
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (err) {
    console.error('Email could not be sent:', err.message);
    return false;
  }
};
