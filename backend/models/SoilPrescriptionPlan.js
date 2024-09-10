/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - SOIL PRESCRIPTION PLAN (MONGOOSE SCHEMA)
 * ==============================================================================
 * 
 * Architecture Overview:
 * Diagnostic agronomic prescription linking measured soil fertility deficits to
 * commercial fertilizer blending recommendations, split-application timings,
 * liming schedules, and farmer return-on-investment projections.
 * 
 * @module models/SoilPrescriptionPlan
 * @requires mongoose
 * @requires crypto
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 */

'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const APPLICATION_STAGES = [
  'PRE_PLANT_BROADCAST_LIME',
  'BASAL_AT_PLANTING',
  'FIRST_TOP_DRESS_VEGETATIVE',
  'SECOND_TOP_DRESS_FLOWERING',
  'FOLIAR_MICRONUTRIENT_BOOST'
];

const SoilPrescriptionItemSchema = new mongoose.Schema(
  {
    productCode: { type: String, required: true },
    brandName: { type: String, required: true },
    bagsPerHectare: { type: Number, required: true, min: 0.1 },
    totalBagsForField: { type: Number, required: true, min: 1 },
    applicationTiming: {
      type: String,
      required: true,
      enum: APPLICATION_STAGES,
      default: 'BASAL_AT_PLANTING'
    },
    applicationInstructions: {
      type: String,
      default: 'Side-dress 5cm away from plant base and cover lightly with moist soil.'
    },
    unitCostNaira: { type: Number, required: true, min: 0 },
    lineTotalNaira: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const SoilPrescriptionPlanSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    sampleRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SoilSampleRecord',
      index: true
    },
    farmerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    farmerName: {
      type: String,
      required: true,
      trim: true
    },
    targetCrop: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    fieldAcreageHectares: {
      type: Number,
      required: true,
      min: 0.1,
      default: 1.0
    },
    targetYieldTonsPerHa: {
      type: Number,
      required: true,
      min: 0.5
    },
    // Net Elemental Requirements (Kilograms per Hectare)
    elementalDeficitKgPerHa: {
      netNitrogenN: { type: Number, required: true, default: 0 },
      netPhosphateP2O5: { type: Number, required: true, default: 0 },
      netPotashK2O: { type: Number, required: true, default: 0 },
      sulfurS: { type: Number, default: 0 },
      zincZn: { type: Number, default: 0 }
    },
    // Total Field Requirement (Acreage * Deficit)
    totalFieldElementalRequirementKg: {
      totalNitrogenN: { type: Number, default: 0 },
      totalPhosphateP2O5: { type: Number, default: 0 },
      totalPotashK2O: { type: Number, default: 0 }
    },
    // Recommended Commercial Bag Mix
    recommendedCommercialMix: {
      programName: {
        type: String,
        default: 'Balanced Agrily High-Yield Precision Protocol'
      },
      items: [SoilPrescriptionItemSchema]
    },
    soilAmendmentPlan: {
      requiresLiming: { type: Boolean, default: false },
      amendmentMaterial: { type: String, default: 'NONE' },
      dosageTonsPerHa: { type: Number, default: 0 },
      totalLimeTonsForField: { type: Number, default: 0 },
      applicationMethod: {
        type: String,
        default: 'Broadcast and thoroughly disk into top 15cm at least 3 weeks before planting.'
      }
    },
    economicImpact: {
      totalFertilizerCostNaira: { type: Number, default: 0 },
      estimatedLimeCostNaira: { type: Number, default: 0 },
      totalGrossInputCostNaira: { type: Number, default: 0 },
      projectedHarvestTonnage: { type: Number, default: 0 },
      projectedGrossRevenueNaira: { type: Number, default: 0 },
      projectedNetProfitNaira: { type: Number, default: 0 },
      returnOnInvestmentMultiplier: { type: Number, default: 0 }
    },
    issuingAgronomist: {
      name: { type: String, default: 'Dr. Amina Bello, FNSS' },
      qualification: { type: String, default: 'Senior Soil Fertility & Nutrition Specialist' }
    },
    cryptographicValidationSeal: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Instance Method: Computes Total Costs, Net Profits, and Cryptographic Audit Seal
 */
SoilPrescriptionPlanSchema.methods.computeCostAndSeal = function () {
  // 1. Compute Total Fertilizer Input Cost
  const items = this.recommendedCommercialMix?.items || [];
  let fertCost = 0;
  items.forEach((item) => {
    item.lineTotalNaira = item.totalBagsForField * item.unitCostNaira;
    fertCost += item.lineTotalNaira;
  });

  // 2. Compute Lime Cost (~₦45,000 per metric ton agricultural lime)
  const limeTons = this.soilAmendmentPlan?.totalLimeTonsForField || 0;
  const limeCost = Math.round(limeTons * 45000);

  const totalCost = fertCost + limeCost;
  this.economicImpact.totalFertilizerCostNaira = fertCost;
  this.economicImpact.estimatedLimeCostNaira = limeCost;
  this.economicImpact.totalGrossInputCostNaira = totalCost;

  // 3. Compute Net Profit & ROI
  const grossRev = this.economicImpact.projectedGrossRevenueNaira || 0;
  const netProfit = Math.max(0, grossRev - totalCost);
  this.economicImpact.projectedNetProfitNaira = netProfit;
  this.economicImpact.returnOnInvestmentMultiplier = totalCost > 0
    ? Number((netProfit / totalCost).toFixed(2))
    : 0;

  // 4. SHA-256 Cryptographic Seal
  const sealData = JSON.stringify({
    prescriptionId: this.prescriptionId,
    farmerEmail: this.farmerEmail,
    crop: this.targetCrop,
    acreage: this.fieldAcreageHectares,
    targetYield: this.targetYieldTonsPerHa,
    totalCost,
    grossRev,
    timestamp: this.createdAt || new Date().toISOString()
  });

  this.cryptographicValidationSeal = crypto.createHash('sha256').update(sealData).digest('hex');
};

/**
 * Pre-Save Mongoose Hook
 */
SoilPrescriptionPlanSchema.pre('save', function (next) {
  this.computeCostAndSeal();
  next();
});

module.exports = mongoose.model('SoilPrescriptionPlan', SoilPrescriptionPlanSchema);
module.exports.APPLICATION_STAGES = APPLICATION_STAGES;
