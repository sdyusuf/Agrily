const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { EscrowContract, SUPPORTED_CURRENCIES } = require('../models/EscrowContract');
const { PaymentTransaction } = require('../models/PaymentTransaction');

// Webhook secrets (with safe test fallbacks)
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || 'sec_paystack_agrily_dev';
const FLUTTERWAVE_SECRET = process.env.FLW_SECRET_HASH || 'sec_flw_agrily_dev';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_agrily_dev';

// ============================================================================
// JOI VALIDATION SCHEMAS
// ============================================================================

const createEscrowLockSchema = Joi.object({
  orderId: Joi.string().required().messages({
    'any.required': 'Associated order ID is required'
  }),
  buyerEmail: Joi.string().email().required().messages({
    'string.email': 'Valid buyer email is required',
    'any.required': 'Buyer email is required'
  }),
  buyerName: Joi.string().min(2).required().messages({
    'any.required': 'Buyer name is required'
  }),
  farmerEmail: Joi.string().email().required().messages({
    'string.email': 'Valid farmer email is required',
    'any.required': 'Farmer email is required'
  }),
  farmerName: Joi.string().min(2).required().messages({
    'any.required': 'Farmer name is required'
  }),
  currency: Joi.string().valid(...SUPPORTED_CURRENCIES).optional().default('NGN'),
  totalAmount: Joi.number().min(1).required().messages({
    'number.min': 'Total escrow amount must be at least 1',
    'any.required': 'Total escrow amount is required'
  }),
  inspectionWindowHours: Joi.number().min(6).max(168).optional().default(48)
});

const releaseMilestoneSchema = Joi.object({
  milestoneIndex: Joi.number().integer().min(0).required().messages({
    'any.required': 'Milestone index is required'
  }),
  buyerSignature: Joi.string().min(4).required().messages({
    'any.required': 'Cryptographic authorization signature or PIN is required'
  })
});

const disputeContractSchema = Joi.object({
  openedBy: Joi.string().required().messages({
    'any.required': 'Dispute initiator identifier is required'
  }),
  reason: Joi.string().min(10).required().messages({
    'string.min': 'Dispute rationale must provide at least 10 characters of detail',
    'any.required': 'Dispute reason is required'
  })
});

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * Initialize a new escrow contract lock
 * POST /api/escrow/create-lock
 */
const createEscrowLock = async (req, res) => {
  try {
    const { error, value } = createEscrowLockSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Escrow lock creation validation failed',
        errors: error.details.map(d => d.message)
      });
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const contractId = `ESC-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const contract = new EscrowContract({
      ...value,
      contractId
    });

    await contract.save();

    return res.status(201).json({
      success: true,
      message: 'Escrow contract initialized successfully',
      data: contract
    });
  } catch (err) {
    console.error('Error creating escrow contract:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while initializing escrow contract'
    });
  }
};

/**
 * Paystack Webhook Ingestion & Signature Verification
 * POST /api/escrow/webhook/paystack
 */
const handlePaystackWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const secret = process.env.PAYSTACK_SECRET_KEY || PAYSTACK_SECRET;

    const isValid = PaymentTransaction.verifyHmacSignature(req.body, signature, secret, 'paystack');
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Paystack HMAC signature'
      });
    }

    const { event, data } = req.body;
    if (event === 'charge.success') {
      const contractId = data.metadata?.contractId || data.reference?.split('_')[0];
      const contract = await EscrowContract.findOne({ contractId: contractId?.toUpperCase() });

      if (contract && contract.canTransitionTo('DEPOSITED_LOCKED')) {
        contract.transitionTo('DEPOSITED_LOCKED');
        await contract.save();
      }

      const transaction = new PaymentTransaction({
        transactionReference: data.reference,
        escrowContractId: contract ? contract.contractId : 'UNKNOWN',
        orderId: contract ? contract.orderId : (data.metadata?.orderId || 'UNKNOWN'),
        gatewayProvider: 'paystack',
        channel: data.channel || 'card',
        currency: data.currency || 'NGN',
        amount: data.amount ? data.amount / 100 : 0, // Paystack kobo to NGN
        gatewayFee: data.fees ? data.fees / 100 : 0,
        status: 'success',
        gatewayReference: data.id?.toString(),
        customerEmail: data.customer?.email || 'customer@agrily.com',
        rawWebhookPayload: req.body,
        verifiedAt: new Date()
      });

      await transaction.save();
    }

    return res.status(200).json({ success: true, message: 'Paystack webhook processed' });
  } catch (err) {
    console.error('Error handling Paystack webhook:', err);
    return res.status(500).json({ success: false, message: 'Internal error processing webhook' });
  }
};

/**
 * Flutterwave Webhook Ingestion & Secret Verification
 * POST /api/escrow/webhook/flutterwave
 */
const handleFlutterwaveWebhook = async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    const secret = process.env.FLW_SECRET_HASH || FLUTTERWAVE_SECRET;

    const isValid = PaymentTransaction.verifyHmacSignature(req.body, signature, secret, 'flutterwave');
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Flutterwave secret verification hash'
      });
    }

    const { event, data } = req.body;
    if (event === 'charge.completed' && data?.status === 'successful') {
      const contractId = data.tx_ref?.split('_')[0] || data.meta?.contractId;
      const contract = await EscrowContract.findOne({ contractId: contractId?.toUpperCase() });

      if (contract && contract.canTransitionTo('DEPOSITED_LOCKED')) {
        contract.transitionTo('DEPOSITED_LOCKED');
        await contract.save();
      }

      const transaction = new PaymentTransaction({
        transactionReference: data.tx_ref || `FLW-${data.id}`,
        escrowContractId: contract ? contract.contractId : 'UNKNOWN',
        orderId: contract ? contract.orderId : (data.meta?.orderId || 'UNKNOWN'),
        gatewayProvider: 'flutterwave',
        channel: data.payment_type || 'card',
        currency: data.currency || 'NGN',
        amount: data.amount || 0,
        gatewayFee: data.app_fee || 0,
        status: 'success',
        gatewayReference: data.id?.toString(),
        customerEmail: data.customer?.email || 'customer@agrily.com',
        rawWebhookPayload: req.body,
        verifiedAt: new Date()
      });

      await transaction.save();
    }

    return res.status(200).json({ success: true, message: 'Flutterwave webhook processed' });
  } catch (err) {
    console.error('Error handling Flutterwave webhook:', err);
    return res.status(500).json({ success: false, message: 'Internal error processing webhook' });
  }
};

/**
 * Stripe Webhook Ingestion & Signature Verification
 * POST /api/escrow/webhook/stripe
 */
const handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET;

    const isValid = PaymentTransaction.verifyHmacSignature(req.body, signature, secret, 'stripe');
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Stripe webhook signature'
      });
    }

    const { type, data } = req.body;
    if (type === 'payment_intent.succeeded') {
      const obj = data.object;
      const contractId = obj.metadata?.contractId;
      const contract = await EscrowContract.findOne({ contractId: contractId?.toUpperCase() });

      if (contract && contract.canTransitionTo('DEPOSITED_LOCKED')) {
        contract.transitionTo('DEPOSITED_LOCKED');
        await contract.save();
      }

      const transaction = new PaymentTransaction({
        transactionReference: obj.id,
        escrowContractId: contract ? contract.contractId : 'UNKNOWN',
        orderId: contract ? contract.orderId : (obj.metadata?.orderId || 'UNKNOWN'),
        gatewayProvider: 'stripe',
        currency: (obj.currency || 'usd').toUpperCase(),
        amount: obj.amount ? obj.amount / 100 : 0,
        status: 'success',
        gatewayReference: obj.id,
        customerEmail: obj.receipt_email || 'customer@agrily.com',
        rawWebhookPayload: req.body,
        verifiedAt: new Date()
      });

      await transaction.save();
    }

    return res.status(200).json({ success: true, message: 'Stripe webhook processed' });
  } catch (err) {
    console.error('Error handling Stripe webhook:', err);
    return res.status(500).json({ success: false, message: 'Internal error processing webhook' });
  }
};

/**
 * Release an escrow milestone upon delivery / inspection authorization
 * POST /api/escrow/:contractId/release-milestone
 */
const releaseEscrowMilestone = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { error, value } = releaseMilestoneSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Milestone release validation failed',
        errors: error.details.map(d => d.message)
      });
    }

    const contract = await EscrowContract.findOne({ contractId: contractId.toUpperCase() });
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: `Escrow contract ${contractId} not found`
      });
    }

    if (contract.dispute?.isDisputed) {
      return res.status(403).json({
        success: false,
        message: 'Escrow contract is frozen under active dispute arbitration'
      });
    }

    const { milestoneIndex, buyerSignature } = value;
    contract.releaseMilestone(milestoneIndex, buyerSignature);
    await contract.save();

    return res.status(200).json({
      success: true,
      message: `Milestone ${milestoneIndex} released successfully`,
      data: {
        contractId: contract.contractId,
        status: contract.status,
        amountReleased: contract.amountReleased,
        farmerPayoutAmount: contract.farmerPayoutAmount,
        milestones: contract.milestones
      }
    });
  } catch (err) {
    console.error('Error releasing escrow milestone:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Error releasing milestone'
    });
  }
};

/**
 * Open a formal dispute freezing the escrow contract
 * POST /api/escrow/:contractId/dispute
 */
const disputeEscrowContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { error, value } = disputeContractSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dispute filing validation failed',
        errors: error.details.map(d => d.message)
      });
    }

    const contract = await EscrowContract.findOne({ contractId: contractId.toUpperCase() });
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: `Escrow contract ${contractId} not found`
      });
    }

    contract.transitionTo('DISPUTED', {
      openedBy: value.openedBy,
      reason: value.reason
    });

    await contract.save();

    return res.status(200).json({
      success: true,
      message: 'Escrow contract frozen under dispute arbitration',
      data: {
        contractId: contract.contractId,
        status: contract.status,
        dispute: contract.dispute
      }
    });
  } catch (err) {
    console.error('Error filing dispute:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Error filing dispute'
    });
  }
};

/**
 * Retrieve escrow contract details by contract ID
 * GET /api/escrow/:contractId
 */
const getEscrowContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const contract = await EscrowContract.findOne({ contractId: contractId.toUpperCase() });
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: `Escrow contract ${contractId} not found`
      });
    }

    const transactions = await PaymentTransaction.find({ escrowContractId: contract.contractId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        contract,
        transactions
      }
    });
  } catch (err) {
    console.error('Error fetching escrow contract:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving contract'
    });
  }
};

/**
 * List escrow contracts for a user (buyer or farmer) with summary statistics
 * GET /api/escrow/user/:email
 */
const getUserEscrowContracts = async (req, res) => {
  try {
    const { email } = req.params;
    const normalizedEmail = email.toLowerCase().trim();

    const contracts = await EscrowContract.find({
      $or: [
        { buyerEmail: normalizedEmail },
        { farmerEmail: normalizedEmail }
      ]
    }).sort({ createdAt: -1 });

    const totalLocked = contracts
      .filter(c => ['DEPOSITED_LOCKED', 'IN_TRANSIT_SECURED', 'INSPECTION_PENDING'].includes(c.status))
      .reduce((sum, c) => sum + (c.totalAmount - c.amountReleased), 0);

    const totalReleased = contracts
      .reduce((sum, c) => sum + c.amountReleased, 0);

    const disputedCount = contracts
      .filter(c => c.status === 'DISPUTED').length;

    return res.status(200).json({
      success: true,
      count: contracts.length,
      stats: {
        totalLocked: parseFloat(totalLocked.toFixed(2)),
        totalReleased: parseFloat(totalReleased.toFixed(2)),
        disputedCount
      },
      data: contracts
    });
  } catch (err) {
    console.error('Error fetching user escrow contracts:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving user contracts'
    });
  }
};

// ============================================================================
// ROUTE REGISTRATIONS
// ============================================================================

router.post('/create-lock', createEscrowLock);
router.post('/webhook/paystack', handlePaystackWebhook);
router.post('/webhook/flutterwave', handleFlutterwaveWebhook);
router.post('/webhook/stripe', handleStripeWebhook);
router.post('/:contractId/release-milestone', releaseEscrowMilestone);
router.post('/:contractId/dispute', disputeEscrowContract);
router.get('/:contractId', getEscrowContract);
router.get('/user/:email', getUserEscrowContracts);

module.exports = {
  router,
  createEscrowLockSchema,
  releaseMilestoneSchema,
  disputeContractSchema,
  createEscrowLock,
  handlePaystackWebhook,
  handleFlutterwaveWebhook,
  handleStripeWebhook,
  releaseEscrowMilestone,
  disputeEscrowContract,
  getEscrowContract,
  getUserEscrowContracts
};
