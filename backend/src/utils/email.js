'use strict';

const nodemailer = require('nodemailer');
const config     = require('../config');
const logger     = require('../config/logger');

const transporter = nodemailer.createTransport({
  host:   config.smtp.host,
  port:   config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

/**
 * Send a generic email.
 * @param {Object} opts - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const info = await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
    text,
  });
  logger.info(`Email sent to ${to} — messageId: ${info.messageId}`);
  return info;
};

/** Welcome email sent after successful registration */
const sendWelcomeEmail = (to, name) =>
  sendEmail({
    to,
    subject: 'Welcome to Deal Desk CRM!',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been created successfully. Start managing your deals today.</p>
      <p>— The Deal Desk Team</p>
    `,
  });

/** Password-reset email */
const sendPasswordResetEmail = (to, resetLink) =>
  sendEmail({
    to,
    subject: 'Reset your Deal Desk password',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. It expires in 1 hour.</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });

/** Invoice notification */
const sendInvoiceEmail = (to, invoiceNumber, amount, dueDate) =>
  sendEmail({
    to,
    subject: `Invoice #${invoiceNumber} from Deal Desk CRM`,
    html: `
      <h2>Invoice #${invoiceNumber}</h2>
      <p>Amount due: <strong>$${amount}</strong></p>
      <p>Due date: <strong>${dueDate}</strong></p>
      <p>Thank you for your business!</p>
    `,
  });

module.exports = { sendEmail, sendWelcomeEmail, sendPasswordResetEmail, sendInvoiceEmail };
