/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE PLATFORM - AUTOMATED NOTIFICATIONS SERVICE
 * ==============================================================================
 * 
 * Module Description:
 * This notification service generates and dispatches automated transactional emails
 * across the agricultural procurement supply chain using Nodemailer.
 * 
 * Supply Chain Communication Milestones:
 *  1. Order Placement Alert: Dispatched to the producer/farmer when a buyer purchases
 *     produce, detailing crop varieties, quantities, packaging units, and freight destination.
 *  2. Haulage Dispatch Alert: Dispatched to the buyer when crops are loaded onto transit
 *     vehicles, providing waybill reference and tracking coordinates.
 *  3. Delivery Acceptance Alert: Confirms drop-off inspection and triggers escrow release.
 * 
 * @module utils/emailService
 * @requires nodemailer
 */

const nodemailer = require('nodemailer');
require('dotenv/config');

/**
 * Configure default Nodemailer transport instance.
 * Gracefully defaults to dry-run/mock mode if environment SMTP credentials are absent.
 * 
 * @function createEmailTransporter
 * @returns {nodemailer.Transporter}
 */
function createEmailTransporter() {
  if (process.env.BREVO_API_KEY) {
    return {
      sendMail: async (options) => {
        const { sendViaBrevo } = require('./sendMail');
        return await sendViaBrevo({
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html
        });
      }
    };
  }

  const user = process.env.User || process.env.SMTP_USER || '';
  const pass = process.env.Password || process.env.SMTP_PASS || '';

  if (!user || !pass) {
    // Return mock transport for test/local environments
    return {
      sendMail: async (options) => {
        return {
          mock: true,
          messageId: `mock-${Date.now()}`,
          response: '250 Mock Email Dispatched',
          to: options.to,
          subject: options.subject
        };
      }
    };
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    }
  });
}

const { renderEmailShell } = require('./emailTemplate');

/**
 * Pure template generator for agricultural notification emails.
 * Generates both HTML and fallback plain-text content.
 * 
 * @function buildOrderEmailContent
 * @param {string} templateType - 'NEW_ORDER_FARMER' | 'ORDER_IN_TRANSIT' | 'ORDER_DELIVERED'
 * @param {Object} order - Agricultural Order document
 * @returns {{ subject: string, text: string, html: string }}
 */
function buildOrderEmailContent(templateType, order = {}) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const orderRef = order.orderNumber || order._id || 'AGR-REF';
  const total = Number(order.totalAmount || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  const buyerName = order.buyerName || 'Valued Commercial Buyer';
  const street = order.deliveryAddress?.street || 'Designated Freight Terminal';
  const city = order.deliveryAddress?.city || 'Drop-off City';
  const state = order.deliveryAddress?.state || 'Territory';

  const itemsListText = (order.items || [])
    .map(it => ` - ${it.name}: ${it.quantity} ${it.unit || 'unit'}(s) @ NGN ${Number(it.price || 0).toLocaleString()}`)
    .join('\n');

  const itemsListHtml = (order.items || [])
    .map(it => `<tr>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; color: #0f172a;">${it.name}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 14px; color: #475569;">${it.quantity} ${it.unit || 'unit'}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 14px; font-weight: 600; color: #1b4332;">NGN ${Number(it.price || 0).toLocaleString()}</td>
    </tr>`)
    .join('');

  switch (templateType) {
    case 'NEW_ORDER_FARMER': {
      const subject = `[Agrily Action Required] New Produce Order Received: ${orderRef}`;
      const text = `Hello Producer,\n\nYou have received a new produce procurement order on Agrily!\n\nOrder Reference: ${orderRef}\nBuyer: ${buyerName}\nDrop-off Destination: ${street}, ${city}, ${state}\nTotal Value: ${total}\n\nProduce Items Requested:\n${itemsListText}\n\nPlease log in to your Agrily dashboard to confirm harvest allocation and initiate dispatch packaging.\n\nBest regards,\nAgrily Agricultural Operations Team`;

      const graphicHtml = `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #d8f3dc 100%); border: 1px solid #bbf7d0; border-radius: 14px; padding: 22px; text-align: center;">
          <tr>
            <td align="center">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); border-radius: 50%; margin: 0 auto 12px auto; line-height: 60px; text-align: center; box-shadow: 0 4px 16px rgba(45, 106, 79, 0.25);">
                <span style="font-size: 28px; line-height: 60px; display: inline-block;">🌾</span>
              </div>
              <div style="font-size: 16px; font-weight: 800; color: #1b4332; margin-bottom: 4px;">
                Produce Consignment Order Confirmed
              </div>
              <div style="font-size: 13px; color: #2d6a4f;">
                Consignment Reference: <strong>${orderRef}</strong> &bull; Total Valuation: <strong>${total}</strong>
              </div>
            </td>
          </tr>
        </table>
      `;

      const contentHtml = `
        <p>Hello Producer,</p>
        <p>A buyer has placed an agricultural procurement request for your listed harvest batches.</p>

        <div style="background-color: #f8faf9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 8px; font-size: 14px; color: #475569;">
                <strong style="color: #0f172a;">Buyer:</strong> ${buyerName}
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; font-size: 14px; color: #475569;">
                <strong style="color: #0f172a;">Freight Drop-off:</strong> ${street}, ${city}, ${state}
              </td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #475569;">
                <strong style="color: #0f172a;">Total Valuation:</strong> <span style="color: #2d6a4f; font-weight: 800; font-size: 16px;">${total}</span>
              </td>
            </tr>
          </table>
        </div>

        <h3 style="color: #1b4332; font-size: 16px; font-weight: 700; margin: 24px 0 12px 0;">Produce Items:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left;">
              <th style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #1b4332; border-bottom: 1px solid #e2e8f0;">Crop</th>
              <th style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #1b4332; text-align: center; border-bottom: 1px solid #e2e8f0;">Quantity</th>
              <th style="padding: 10px 14px; font-size: 13px; font-weight: 700; color: #1b4332; text-align: right; border-bottom: 1px solid #e2e8f0;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsListHtml}</tbody>
        </table>

        <p style="font-size: 14px; color: #64748b; line-height: 1.5;">Please log in to your Agrily dashboard to review harvest availability and confirm order allocation.</p>
      `;

      const html = renderEmailShell({
        preheader: `New Order ${orderRef} - ${total} from ${buyerName}`,
        badge: '🌾 New Produce Order Received',
        badgeColor: '#1b4332',
        headline: `New Produce Order: ${orderRef}`,
        subheadline: `A verified buyer has requested produce allocation from your harvest inventory.`,
        graphicHtml,
        contentHtml,
        ctaText: 'Review Order in Dashboard',
        ctaUrl: `${frontendUrl}/orders`,
        showTrustPillars: true
      });

      return { subject, text, html };
    }

    case 'ORDER_IN_TRANSIT': {
      const subject = `[Agrily Dispatch Alert] Your Produce is In Transit: ${orderRef}`;
      const text = `Hello ${buyerName},\n\nGreat news! Your agricultural produce consignment has been packed, verified, and loaded onto freight transit.\n\nOrder Reference: ${orderRef}\nDestination: ${street}, ${city}, ${state}\nExpected Delivery: 2 - 4 Business Days\n\nProduce Items In Transit:\n${itemsListText}\n\nYour payment remains safe in Agrily Escrow until you inspect produce quality upon delivery.\n\nBest regards,\nAgrily Agricultural Operations Team`;

      const graphicHtml = `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; border-radius: 14px; padding: 22px; text-align: center;">
          <tr>
            <td align="center">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); border-radius: 50%; margin: 0 auto 12px auto; line-height: 60px; text-align: center; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);">
                <span style="font-size: 28px; line-height: 60px; display: inline-block;">🚚</span>
              </div>
              <div style="font-size: 16px; font-weight: 800; color: #1e3a8a; margin-bottom: 4px;">
                Consignment Loaded & In Transit
              </div>
              <div style="font-size: 13px; color: #1e40af;">
                Waybill Reference: <strong>${orderRef}</strong> &bull; Expected Delivery: <strong>2 - 4 Business Days</strong>
              </div>
            </td>
          </tr>
        </table>
      `;

      const contentHtml = `
        <p>Hello ${buyerName},</p>
        <p>Your agricultural produce order has been verified at the farm gate and loaded onto dispatch transport.</p>

        <div style="background-color: #f8faf9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 8px; font-size: 14px; color: #475569;">
                <strong style="color: #0f172a;">Drop-off Location:</strong> ${street}, ${city}, ${state}
              </td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #475569;">
                <strong style="color: #0f172a;">Expected Delivery:</strong> <span style="color: #2d6a4f; font-weight: 800; font-size: 15px;">2 - 4 Business Days</span>
              </td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #065f46; line-height: 1.5;">
            🛡️ <strong>Agrily Escrow Protection:</strong> Your funds are held securely and will only be released to the producer once you inspect crop freshness at destination.
          </p>
        </div>
      `;

      const html = renderEmailShell({
        preheader: `Consignment ${orderRef} is in transit to ${city}. Expected delivery in 2 - 4 Business Days.`,
        badge: '🚚 Dispatch & Haulage Alert',
        badgeColor: '#1d4ed8',
        headline: `Consignment Dispatched: ${orderRef}`,
        subheadline: `Produce has been verified at the farm gate and dispatched for delivery.`,
        graphicHtml,
        contentHtml,
        ctaText: 'Track Consignment Waybill',
        ctaUrl: `${frontendUrl}/orders`,
        showTrustPillars: true
      });

      return { subject, text, html };
    }

    case 'ORDER_DELIVERED': {
      const subject = `[Agrily Completed] Produce Delivered & Accepted: ${orderRef}`;
      const text = `Hello,\n\nOrder ${orderRef} has been officially marked as Delivered and quality verified at destination.\n\nThank you for choosing Agrily for verified direct-from-farm procurement!\n\nBest regards,\nAgrily Team`;

      const graphicHtml = `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #86efac; border-radius: 14px; padding: 22px; text-align: center;">
          <tr>
            <td align="center">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); border-radius: 50%; margin: 0 auto 12px auto; line-height: 60px; text-align: center; box-shadow: 0 4px 16px rgba(45, 106, 79, 0.25);">
                <span style="font-size: 28px; line-height: 60px; display: inline-block;">📦</span>
              </div>
              <div style="font-size: 16px; font-weight: 800; color: #14532d; margin-bottom: 4px;">
                Delivery Confirmed & Quality Verified
              </div>
              <div style="font-size: 13px; color: #166534;">
                Order: <strong>${orderRef}</strong> &bull; Escrow Settlement Complete
              </div>
            </td>
          </tr>
        </table>
      `;

      const contentHtml = `
        <p>Produce consignment has been delivered and accepted.</p>
        <p>Funds are now released to the producer from Agrily Escrow.</p>
        <div style="background-color: #f8faf9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.6;">
            Thank you for participating in Nigeria's trusted direct-from-farm supply chain. All consignment quality standards have been satisfied.
          </p>
        </div>
      `;

      const html = renderEmailShell({
        preheader: `Order ${orderRef} has been delivered and accepted. Escrow settlement finalized.`,
        badge: '📦 Delivery Completed & Settled',
        badgeColor: '#166534',
        headline: `Delivery Completed: ${orderRef}`,
        subheadline: `Produce consignment has been verified at destination and escrow funds disbursed.`,
        graphicHtml,
        contentHtml,
        ctaText: 'View Order Receipt',
        ctaUrl: `${frontendUrl}/orders`,
        showTrustPillars: true
      });

      return { subject, text, html };
    }

    default:
      return {
        subject: `Agrily Order Notification: ${orderRef}`,
        text: `Notification regarding your order ${orderRef}.`,
        html: `<p>Notification regarding your order ${orderRef}.</p>`
      };
  }
}

/**
 * Sends automated new order notification to producing farmer.
 * 
 * @async
 * @function sendNewOrderAlertToFarmer
 * @param {string} farmerEmail
 * @param {Object} order
 * @param {Object} [transporter] Optional custom transport for unit testing
 * @returns {Promise<Object>}
 */
async function sendNewOrderAlertToFarmer(farmerEmail, order, customTransporter = null) {
  if (!farmerEmail) return null;

  try {
    const transporter = customTransporter || createEmailTransporter();
    const content = buildOrderEmailContent('NEW_ORDER_FARMER', order);

    const mailOptions = {
      from: 'Agrily Agricultural Commerce <no-reply@agrily.com>',
      to: farmerEmail,
      subject: content.subject,
      text: content.text,
      html: content.html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.warn('Failed to send new order alert to farmer:', error.message);
    return null;
  }
}

/**
 * Sends automated in-transit haulage dispatch alert to buyer.
 * 
 * @async
 * @function sendOrderDispatchedAlertToBuyer
 * @param {string} buyerEmail
 * @param {Object} order
 * @param {Object} [transporter] Optional custom transport for unit testing
 * @returns {Promise<Object>}
 */
async function sendOrderDispatchedAlertToBuyer(buyerEmail, order, customTransporter = null) {
  if (!buyerEmail) return null;

  try {
    const transporter = customTransporter || createEmailTransporter();
    const content = buildOrderEmailContent('ORDER_IN_TRANSIT', order);

    const mailOptions = {
      from: 'Agrily Dispatch & Logistics <logistics@agrily.com>',
      to: buyerEmail,
      subject: content.subject,
      text: content.text,
      html: content.html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.warn('Failed to send dispatch alert to buyer:', error.message);
    return null;
  }
}

module.exports = {
  createEmailTransporter,
  buildOrderEmailContent,
  sendNewOrderAlertToFarmer,
  sendOrderDispatchedAlertToBuyer
};
