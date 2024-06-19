const mongoose = require('mongoose');

const ESCROW_STATUSES = [
  'INITIALIZED',
  'DEPOSITED_LOCKED',
  'IN_TRANSIT_SECURED',
  'INSPECTION_PENDING',
  'RELEASED_TO_FARMER',
  'DISPUTED',
  'REFUNDED'
];

const SUPPORTED_CURRENCIES = ['NGN', 'KES', 'USD', 'GHS'];

const milestoneSchema = new mongoose.Schema({
  milestoneName: {
    type: String,
    required: [true, 'Milestone name is required'],
    trim: true
  },
  percentage: {
    type: Number,
    required: [true, 'Milestone percentage is required'],
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100%']
  },
  amount: {
    type: Number,
    required: [true, 'Milestone amount is required'],
    min: [0, 'Milestone amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'eligible', 'released'],
    default: 'pending'
  },
  releasedAt: {
    type: Date,
    default: null
  },
  releaseTransactionRef: {
    type: String,
    default: null
  }
}, { _id: true });

const escrowContractSchema = new mongoose.Schema({
  contractId: {
    type: String,
    required: [true, 'Escrow contract identifier is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  orderId: {
    type: String,
    required: [true, 'Associated order ID is required'],
    trim: true
  },
  buyerEmail: {
    type: String,
    required: [true, 'Buyer email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid buyer email format']
  },
  buyerName: {
    type: String,
    required: [true, 'Buyer name is required'],
    trim: true
  },
  farmerEmail: {
    type: String,
    required: [true, 'Farmer email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid farmer email format']
  },
  farmerName: {
    type: String,
    required: [true, 'Farmer name is required'],
    trim: true
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: SUPPORTED_CURRENCIES,
    default: 'NGN'
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total escrow amount is required'],
    min: [1, 'Total escrow amount must be at least 1']
  },
  escrowFeeRate: {
    type: Number,
    default: 0.015, // 1.5% Agrily platform escrow fee
    min: 0,
    max: 0.10
  },
  escrowFee: {
    type: Number,
    default: function () {
      return parseFloat((this.totalAmount * (this.escrowFeeRate || 0.015)).toFixed(2));
    }
  },
  farmerPayoutAmount: {
    type: Number,
    default: function () {
      return parseFloat((this.totalAmount - (this.escrowFee || 0)).toFixed(2));
    }
  },
  amountReleased: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ESCROW_STATUSES,
    default: 'INITIALIZED'
  },
  milestones: {
    type: [milestoneSchema],
    default: function () {
      const payout = this.farmerPayoutAmount || this.totalAmount;
      return [
        {
          milestoneName: 'Initial Transit Lock',
          percentage: 0,
          amount: 0,
          status: 'released',
          releasedAt: new Date()
        },
        {
          milestoneName: 'In-Transit Freight Checkpoint',
          percentage: 30,
          amount: parseFloat((payout * 0.3).toFixed(2)),
          status: 'pending'
        },
        {
          milestoneName: 'Final Quality Inspection Acceptance',
          percentage: 70,
          amount: parseFloat((payout * 0.7).toFixed(2)),
          status: 'pending'
        }
      ];
    }
  },
  inspectionWindowHours: {
    type: Number,
    default: 48,
    min: 6,
    max: 168 // Up to 7 days
  },
  depositedAt: {
    type: Date,
    default: null
  },
  inspectionExpiresAt: {
    type: Date,
    default: null
  },
  disbursedAt: {
    type: Date,
    default: null
  },
  buyerReleaseSign: {
    type: String,
    default: null
  },
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    reason: {
      type: String,
      default: null
    },
    openedBy: {
      type: String,
      default: null
    },
    openedAt: {
      type: Date,
      default: null
    },
    resolutionNotes: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true
});

// State machine allowed transitions
const STATE_TRANSITIONS = {
  INITIALIZED: ['DEPOSITED_LOCKED', 'REFUNDED'],
  DEPOSITED_LOCKED: ['IN_TRANSIT_SECURED', 'DISPUTED', 'REFUNDED'],
  IN_TRANSIT_SECURED: ['INSPECTION_PENDING', 'DISPUTED'],
  INSPECTION_PENDING: ['RELEASED_TO_FARMER', 'DISPUTED'],
  DISPUTED: ['RELEASED_TO_FARMER', 'REFUNDED', 'INSPECTION_PENDING'],
  RELEASED_TO_FARMER: [],
  REFUNDED: []
};

escrowContractSchema.methods.canTransitionTo = function (nextStatus) {
  const allowed = STATE_TRANSITIONS[this.status] || [];
  return allowed.includes(nextStatus);
};

escrowContractSchema.methods.transitionTo = function (nextStatus, metadata = {}) {
  if (!this.canTransitionTo(nextStatus)) {
    throw new Error(`Illegal state transition from ${this.status} to ${nextStatus}`);
  }

  this.status = nextStatus;

  if (nextStatus === 'DEPOSITED_LOCKED') {
    this.depositedAt = new Date();
  } else if (nextStatus === 'INSPECTION_PENDING') {
    const hours = this.inspectionWindowHours || 48;
    this.inspectionExpiresAt = new Date(Date.now() + hours * 3600 * 1000);
  } else if (nextStatus === 'RELEASED_TO_FARMER') {
    this.disbursedAt = new Date();
    this.amountReleased = this.farmerPayoutAmount;
    if (metadata.signature) {
      this.buyerReleaseSign = metadata.signature;
    }
  } else if (nextStatus === 'DISPUTED') {
    this.dispute.isDisputed = true;
    this.dispute.openedBy = metadata.openedBy || 'buyer';
    this.dispute.reason = metadata.reason || 'Produce inspection failure or non-delivery';
    this.dispute.openedAt = new Date();
  }

  return this;
};

escrowContractSchema.methods.releaseMilestone = function (milestoneIndex, transactionRef) {
  if (milestoneIndex < 0 || milestoneIndex >= this.milestones.length) {
    throw new Error('Invalid milestone index');
  }

  const milestone = this.milestones[milestoneIndex];
  if (milestone.status === 'released') {
    throw new Error(`Milestone ${milestone.milestoneName} has already been released`);
  }

  milestone.status = 'released';
  milestone.releasedAt = new Date();
  milestone.releaseTransactionRef = transactionRef || `REL-${Date.now()}`;
  this.amountReleased = parseFloat((this.amountReleased + milestone.amount).toFixed(2));

  // If all milestones released, transition contract to RELEASED_TO_FARMER
  const allReleased = this.milestones.every(m => m.status === 'released');
  if (allReleased) {
    this.status = 'RELEASED_TO_FARMER';
    this.disbursedAt = new Date();
  }

  return this;
};

const EscrowContract = mongoose.model('EscrowContract', escrowContractSchema);

module.exports = {
  EscrowContract,
  ESCROW_STATUSES,
  SUPPORTED_CURRENCIES
};
