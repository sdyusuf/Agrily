/**
 * @file CarrierScorecard.js
 * @description Mongoose model for Carrier Performance Scorecard & Tier Ranking
 * Maintains historical turnaround reliability, cargo preservation records, eco-efficiency indices,
 * and automated bonus/retention fee tier assignments for logistics operators.
 */

const mongoose = require('mongoose');

const CARRIER_TIERS = [
  'PLATINUM_AGRO_CARRIER',
  'GOLD_AGRO_CARRIER',
  'SILVER_AGRO_CARRIER',
  'BRONZE_CARRIER',
  'PROBATIONARY_CARRIER',
  'SUSPENDED'
];

const CarrierScorecardSchema = new mongoose.Schema(
  {
    carrierCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    carrierName: {
      type: String,
      required: [true, 'Carrier name is required'],
      trim: true
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      index: true
    },
    cacRegistrationNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true
    },
    fleetSize: {
      type: Number,
      default: 1,
      min: 1
    },
    primaryCorridors: [
      {
        type: String,
        trim: true
      }
    ],
    tier: {
      type: String,
      enum: CARRIER_TIERS,
      default: 'PROBATIONARY_CARRIER',
      index: true
    },
    lifetimeMetrics: {
      totalTripsAssigned: { type: Number, default: 0, min: 0 },
      completedTrips: { type: Number, default: 0, min: 0 },
      cancelledTrips: { type: Number, default: 0, min: 0 },
      onTimeDeliveries: { type: Number, default: 0, min: 0 },
      totalDistanceCoveredKm: { type: Number, default: 0, min: 0 },
      totalTonnageHauledTonnes: { type: Number, default: 0, min: 0 },
      coldChainExcursionIncidents: { type: Number, default: 0, min: 0 },
      cargoDamageClaimsCount: { type: Number, default: 0, min: 0 }
    },
    turnaroundBenchmarks: {
      averageLoadingTimeMinutes: { type: Number, default: 45, min: 0 },
      averageTransitSpeedKmh: { type: Number, default: 55, min: 0 },
      averageOffloadingTimeMinutes: { type: Number, default: 40, min: 0 },
      averageTurnaroundTotalMinutes: { type: Number, default: 720, min: 0 }
    },
    compositeScores: {
      onTimeReliabilityPct: { type: Number, default: 100, min: 0, max: 100 },
      safetyAndPreservationScore: { type: Number, default: 100, min: 0, max: 100 },
      ecoEfficiencyScore: { type: Number, default: 85, min: 0, max: 100 },
      overallCarrierScore: { type: Number, default: 80, min: 0, max: 100 }
    },
    incentivesAndGuarantees: {
      freightPaymentBonusPct: { type: Number, default: 0, min: 0 },
      retentionEscrowRequiredPct: { type: Number, default: 15, min: 0 },
      priorityDispatchAccess: { type: Boolean, default: false }
    },
    lastAuditedDate: {
      type: Date,
      default: Date.now
    },
    monthlyAuditHistory: [
      {
        monthYear: { type: String, trim: true },
        tripsCount: { type: Number, default: 0 },
        onTimeRatePct: { type: Number, default: 0 },
        disputesRaisedCount: { type: Number, default: 0 },
        bonusEarnedNgn: { type: Number, default: 0 }
      }
    ]
  },
  {
    timestamps: true
  }
);

/**
 * Recalculates composite scores and assigns appropriate carrier tier
 */
CarrierScorecardSchema.methods.recalculatePerformanceScores = function () {
  const m = this.lifetimeMetrics;
  const c = this.compositeScores;
  const inc = this.incentivesAndGuarantees;

  if (m.completedTrips === 0) {
    this.tier = 'PROBATIONARY_CARRIER';
    inc.freightPaymentBonusPct = 0;
    inc.retentionEscrowRequiredPct = 15;
    inc.priorityDispatchAccess = false;
    c.overallCarrierScore = 75;
    return this;
  }

  // 1. On-Time Reliability (0-100)
  c.onTimeReliabilityPct = parseFloat(((m.onTimeDeliveries / m.completedTrips) * 100).toFixed(1));

  // 2. Cargo Preservation & Safety (Deductions for claims & excursions)
  const excursionPenalty = (m.coldChainExcursionIncidents / m.completedTrips) * 25;
  const damagePenalty = (m.cargoDamageClaimsCount / m.completedTrips) * 50;
  c.safetyAndPreservationScore = Math.max(0, Math.min(100, Math.round(100 - excursionPenalty - damagePenalty)));

  // 3. Overall Weighted Score
  // On-time (50%), Safety & Cargo preservation (35%), Eco-efficiency (15%)
  const overall = (c.onTimeReliabilityPct * 0.50) + (c.safetyAndPreservationScore * 0.35) + (c.ecoEfficiencyScore * 0.15);
  c.overallCarrierScore = Math.max(10, Math.min(100, Math.round(overall)));

  // 4. Tier Assignment & Incentives
  if (m.cargoDamageClaimsCount >= 3 && c.overallCarrierScore <= 55) {
    this.tier = 'SUSPENDED';
    inc.freightPaymentBonusPct = 0;
    inc.retentionEscrowRequiredPct = 30;
    inc.priorityDispatchAccess = false;
  } else if (c.overallCarrierScore >= 92 && m.completedTrips >= 10) {
    this.tier = 'PLATINUM_AGRO_CARRIER';
    inc.freightPaymentBonusPct = 4.5;
    inc.retentionEscrowRequiredPct = 0;
    inc.priorityDispatchAccess = true;
  } else if (c.overallCarrierScore >= 80 && m.completedTrips >= 5) {
    this.tier = 'GOLD_AGRO_CARRIER';
    inc.freightPaymentBonusPct = 2.0;
    inc.retentionEscrowRequiredPct = 2.5;
    inc.priorityDispatchAccess = true;
  } else if (c.overallCarrierScore >= 65) {
    this.tier = 'SILVER_AGRO_CARRIER';
    inc.freightPaymentBonusPct = 0;
    inc.retentionEscrowRequiredPct = 5.0;
    inc.priorityDispatchAccess = false;
  } else {
    this.tier = 'BRONZE_CARRIER';
    inc.freightPaymentBonusPct = 0;
    inc.retentionEscrowRequiredPct = 12.5;
    inc.priorityDispatchAccess = false;
  }

  this.lastAuditedDate = new Date();
  return this;
};

CarrierScorecardSchema.pre('validate', function (next) {
  if (!this.carrierCode) {
    this.carrierCode = `CAR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  this.recalculatePerformanceScores();
  next();
});

module.exports = mongoose.model('CarrierScorecard', CarrierScorecardSchema);
