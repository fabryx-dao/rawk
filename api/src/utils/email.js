const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify?token=${token}`;
  
  await transporter.sendMail({
    from: '"Rawk" <noreply@rawk.sh>',
    to: email,
    subject: 'Verify your Rawk account',
    html: `
      <h2>Welcome to Rawk!</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>This link expires in 24 hours.</p>
    `
  });
}

module.exports = { sendVerificationEmail };
