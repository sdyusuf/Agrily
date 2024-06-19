const mongoose = require('mongoose');
const crypto = require('crypto');

const GATEWAY_PROVIDERS = ['paystack', 'flutterwave', 'stripe'];
const PAYMENT_STATUSES = ['pending', 'success', 'failed', 'reversed', 'refunded'];

const paymentTransactionSchema = new mongoose.Schema({
  transactionReference: {
    type: String,
    required: [true, 'Transaction reference is required'],
    unique: true,
    trim: true
  },
  escrowContractId: {
    type: String,
    required: [true, 'Associated escrow contract ID is required'],
    trim: true,
    uppercase: true
  },
  orderId: {
    type: String,
    required: [true, 'Order ID is required'],
    trim: true
  },
  gatewayProvider: {
    type: String,
    required: [true, 'Gateway provider is required'],
    enum: GATEWAY_PROVIDERS
  },
  channel: {
    type: String,
    enum: ['card', 'bank_transfer', 'ussd', 'mobile_money', 'apple_pay'],
    default: 'card'
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['NGN', 'KES', 'USD', 'GHS'],
    default: 'NGN'
  },
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: [0.01, 'Amount must be greater than zero']
  },
  gatewayFee: {
    type: Number,
    default: 0,
    min: 0
  },
  netAmount: {
    type: Number,
    default: function () {
      return parseFloat((this.amount - (this.gatewayFee || 0)).toFixed(2));
    }
  },
  status: {
    type: String,
    enum: PAYMENT_STATUSES,
    default: 'pending'
  },
  gatewayReference: {
    type: String,
    default: null
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    lowercase: true,
    trim: true
  },
  rawWebhookPayload: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

/**
 * Verify cryptographic HMAC signature for incoming webhooks
 * @param {string|Buffer|object} payload Raw request body
 * @param {string} signature Header signature
 * @param {string} secret Gateway webhook secret
 * @param {string} provider 'paystack' | 'flutterwave' | 'stripe'
 * @returns {boolean}
 */
paymentTransactionSchema.statics.verifyHmacSignature = function (payload, signature, secret, provider) {
  if (!signature || !secret) return false;

  const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  if (provider === 'paystack') {
    // Paystack uses HMAC-SHA512
    const hash = crypto.createHmac('sha512', secret).update(bodyString).digest('hex');
    return hash === signature;
  }

  if (provider === 'flutterwave') {
    // Flutterwave sends secret hash directly in verif-hash header
    return signature === secret;
  }

  if (provider === 'stripe') {
    // Basic stripe webhook signature timestamp & HMAC-SHA256 check
    // Format: t=1614838289,v1=5257a869e7ecebeda32affa62cd496b83e57e484fe9897...
    const elements = signature.split(',');
    const timestampElement = elements.find(e => e.startsWith('t='));
    const signatureElement = elements.find(e => e.startsWith('v1='));

    if (!timestampElement || !signatureElement) return false;

    const timestamp = timestampElement.split('=')[1];
    const expectedSig = signatureElement.split('=')[1];

    const signedPayload = `${timestamp}.${bodyString}`;
    const computedSig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

    return computedSig === expectedSig;
  }

  return false;
};

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

module.exports = {
  PaymentTransaction,
  GATEWAY_PROVIDERS,
  PAYMENT_STATUSES
};
