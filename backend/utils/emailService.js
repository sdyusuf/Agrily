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
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${it.name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${it.quantity} ${it.unit || 'unit'}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">NGN ${Number(it.price || 0).toLocaleString()}</td>
    </tr>`)
    .join('');

  switch (templateType) {
    case 'NEW_ORDER_FARMER':
      return {
        subject: `[Agrily Action Required] New Produce Order Received: ${orderRef}`,
        text: `Hello Producer,\n\nYou have received a new produce procurement order on Agrily!\n\nOrder Reference: ${orderRef}\nBuyer: ${buyerName}\nDrop-off Destination: ${street}, ${city}, ${state}\nTotal Value: ${total}\n\nProduce Items Requested:\n${itemsListText}\n\nPlease log in to your Agrily dashboard to confirm harvest allocation and initiate dispatch packaging.\n\nBest regards,\nAgrily Agricultural Operations Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a; line-height: 1.6;">
            <div style="background-color: #1b4332; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🌾 New Produce Order Received</h1>
              <p style="color: #dda15e; margin: 8px 0 0 0; font-size: 14px;">Consignment Reference: <strong>${orderRef}</strong></p>
            </div>
            <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
              <p>Hello Producer,</p>
              <p>A buyer has placed an agricultural procurement request for your listed harvest batches.</p>
              <div style="background-color: #f8faf9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Buyer:</strong> ${buyerName}</p>
                <p style="margin: 0 0 8px 0;"><strong>Freight Drop-off:</strong> ${street}, ${city}, ${state}</p>
                <p style="margin: 0;"><strong>Total Valuation:</strong> <span style="color: #2d6a4f; font-weight: bold;">${total}</span></p>
              </div>
              <h3 style="color: #1b4332; margin-bottom: 12px;">Produce Items:</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #f1f5f9; text-align: left;">
                    <th style="padding: 8px 12px;">Crop</th>
                    <th style="padding: 8px 12px; text-align: center;">Quantity</th>
                    <th style="padding: 8px 12px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>${itemsListHtml}</tbody>
              </table>
              <p style="font-size: 14px; color: #64748b;">Please log in to your Agrily dashboard to review harvest availability and confirm order allocation.</p>
            </div>
          </div>
        `
      };

    case 'ORDER_IN_TRANSIT':
      return {
        subject: `[Agrily Dispatch Alert] Your Produce is In Transit: ${orderRef}`,
        text: `Hello ${buyerName},\n\nGreat news! Your agricultural produce consignment has been packed, verified, and loaded onto freight transit.\n\nOrder Reference: ${orderRef}\nDestination: ${street}, ${city}, ${state}\nExpected Delivery: 2 - 4 Business Days\n\nProduce Items In Transit:\n${itemsListText}\n\nYour payment remains safe in Agrily Escrow until you inspect produce quality upon delivery.\n\nBest regards,\nAgrily Agricultural Operations Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a; line-height: 1.6;">
            <div style="background-color: #2d6a4f; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🚚 Consignment Dispatched</h1>
              <p style="color: #dda15e; margin: 8px 0 0 0; font-size: 14px;">Waybill Reference: <strong>${orderRef}</strong></p>
            </div>
            <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
              <p>Hello ${buyerName},</p>
              <p>Your agricultural produce order has been verified at the farm gate and loaded onto dispatch transport.</p>
              <div style="background-color: #f8faf9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Drop-off Location:</strong> ${street}, ${city}, ${state}</p>
                <p style="margin: 0;"><strong>Expected Delivery:</strong> <span style="color: #2d6a4f; font-weight: bold;">2 - 4 Business Days</span></p>
              </div>
              <p style="font-size: 14px; color: #64748b;">🛡️ <strong>Agrily Escrow Protection:</strong> Your funds are held securely and will only be released to the producer once you inspect crop freshness at destination.</p>
            </div>
          </div>
        `
      };

    case 'ORDER_DELIVERED':
      return {
        subject: `[Agrily Completed] Produce Delivered & Accepted: ${orderRef}`,
        text: `Hello,\n\nOrder ${orderRef} has been officially marked as Delivered and quality verified at destination.\n\nThank you for choosing Agrily for verified direct-from-farm procurement!\n\nBest regards,\nAgrily Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a; line-height: 1.6;">
            <div style="background-color: #1b4332; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📦 Delivery Completed</h1>
              <p style="color: #52b788; margin: 8px 0 0 0; font-size: 14px;">Order ${orderRef}</p>
            </div>
            <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
              <p>Produce consignment has been delivered and accepted.</p>
              <p>Funds are now released to the producer from Agrily Escrow.</p>
            </div>
          </div>
        `
      };

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
