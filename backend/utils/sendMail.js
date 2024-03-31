/**
 * ============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * Email Dispatch Service (Brevo API & SMTP Fallback)
 * ============================================================================
 * 
 * @module backend/utils/sendMail
 * @description
 * High-reliability transactional email delivery service supporting Brevo REST API v3
 * with automated fallbacks to Nodemailer Gmail/SMTP transport.
 * 
 * Sourced configuration:
 *  - Provider: Brevo (api.brevo.com/v3/smtp/email)
 *  - Verified Sender Email: yusuf.hilside@gmail.com
 *  - Sender Name: Agrily
 */

const https = require('https');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Dispatches an email via Brevo REST API v3.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} [options.name] - Recipient display name
 * @param {string} options.subject - Email subject line
 * @param {string} [options.text] - Plaintext email content
 * @param {string} [options.html] - HTML formatted email body
 * @returns {Promise<Object>} API dispatch response
 */
function sendViaBrevo({ to, name = 'Valued User', subject, text, html }) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'yusuf.hilside@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Agrily';

    if (!apiKey) {
      return reject(new Error('BREVO_API_KEY is not defined in environment'));
    }

    const payload = JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: to,
          name: name
        }
      ],
      subject: subject,
      textContent: text || '',
      htmlContent: html || `<p>${(text || '').replace(/\n/g, '<br/>')}</p>`
    });

    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(responseBody);
              console.log('✅ Brevo Email Dispatched successfully:', parsed.messageId);
              resolve({ success: true, messageId: parsed.messageId, provider: 'brevo' });
            } catch (e) {
              resolve({ success: true, response: responseBody, provider: 'brevo' });
            }
          } else {
            console.error(`❌ Brevo API error [Status ${res.statusCode}]:`, responseBody);
            reject(new Error(`Brevo HTTP ${res.statusCode}: ${responseBody}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error('❌ Brevo connection error:', err);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

const {
  renderEmailShell,
  buildVerificationEmail,
  buildPasswordResetEmail
} = require('./emailTemplate');

/**
 * Sends an email verification link to a newly registered user.
 * 
 * @param {string} email - Destination email
 * @param {string} verificationString - UUID verification token
 * @returns {Promise<Object>}
 */
async function sendMail(email, verificationString) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const verifyUrl = `${frontendUrl}/verify/${verificationString}`;
  const subject = 'Agrily - Verify your email address';
  const text = `
Welcome to Agrily!

Please verify your email address to activate your produce marketplace account:
${verifyUrl}

This link is valid for 48 hours. If you did not create an account, you can ignore this email.

Best regards,
The Agrily Team
https://agrily.com
`;

  const html = buildVerificationEmail({ verifyUrl, email });

  if (process.env.BREVO_API_KEY) {
    try {
      return await sendViaBrevo({ to: email, subject, text, html });
    } catch (err) {
      console.warn('⚠️ Brevo send failed, falling back to nodemailer:', err.message);
    }
  }

  // Fallback to Nodemailer
  return new Promise((resolve) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.User || '',
        pass: process.env.Password || ''
      }
    });

    const mailOptions = {
      from: process.env.BREVO_SENDER_EMAIL || 'yusuf.hilside@gmail.com',
      to: email,
      subject,
      text,
      html
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Nodemailer send error:', error.message);
      } else {
        console.log('Email sent: ' + info?.response);
      }
      resolve(info);
    });
  });
}

/**
 * Sends a generic formatted email (e.g., password reset, order notification).
 * 
 * @param {string} destination - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Message body
 * @param {string} [code=''] - Optional security code or link append
 * @returns {Promise<Object>}
 */
async function sendMailFull(destination, subject, text, code = '') {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const fullText = code ? `${text} ${code}` : text;

  const isPasswordReset = subject.toLowerCase().includes('password') || text.toLowerCase().includes('password');

  let html;
  if (isPasswordReset) {
    let resetUrl = '';
    if (code && code.length > 10) {
      resetUrl = `${frontendUrl}/reset-password/${code}`;
    } else {
      const match = fullText.match(/https?:\/\/[^\s]+/);
      resetUrl = match ? match[0] : `${frontendUrl}/reset-password`;
    }
    html = buildPasswordResetEmail({ resetUrl, email: destination });
  } else {
    html = renderEmailShell({
      preheader: subject,
      badge: '📢 Account Notification',
      badgeColor: '#1b4332',
      headline: subject,
      subheadline: 'Official communication from the Agrily Agricultural Platform',
      contentHtml: `
        <div style="background-color: #f8faf9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 16px 0;">
          <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.65;">
            ${fullText.replace(/\n/g, '<br/>')}
          </p>
        </div>
      `,
      ctaText: 'Visit Agrily Marketplace',
      ctaUrl: `${frontendUrl}/home`,
      showTrustPillars: true
    });
  }

  if (process.env.BREVO_API_KEY) {
    try {
      return await sendViaBrevo({ to: destination, subject, text: fullText, html });
    } catch (err) {
      console.warn('⚠️ Brevo send failed, falling back to nodemailer:', err.message);
    }
  }

  return new Promise((resolve) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.User || '',
        pass: process.env.Password || ''
      }
    });

    const mailOptions = {
      from: process.env.BREVO_SENDER_EMAIL || 'yusuf.hilside@gmail.com',
      to: destination,
      subject,
      text: fullText,
      html
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Nodemailer error:', error.message);
      } else {
        console.log('Email sent: ' + info?.response);
      }
      resolve(info);
    });
  });
}

module.exports = { sendMail, sendMailFull, sendViaBrevo };