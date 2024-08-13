/**
 * @file RegionalFreightBenchmark.js
 * @description Mongoose model for Nigerian Regional Agro-Freight Tariff Benchmarks
 * Establishes state-to-state baseline tariffs, road quality indices, diesel surcharge adjusters,
 * and seasonal volatility multipliers across Nigerian agricultural trade corridors.
 */

const mongoose = require('mongoose');

const SECURITY_RISK_LEVELS = [
  'LOW_STANDARD_PATROL',
  'MEDIUM_CONVOY_ADVISED',
  'HIGH_RISK_ESCORT_REQUIRED'
];

const SEASONS = [
  'RAINY_SEASON_PEAK',
  'DRY_SEASON_HARVEST',
  'OFF_SEASON_BASELINE'
];

const RegionalFreightBenchmarkSchema = new mongoose.Schema(
  {
    benchmarkCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    corridorName: {
      type: String,
      required: true,
      trim: true
    },
    originState: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    destinationState: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    distanceKm: {
      type: Number,
      required: true,
      min: 1
    },
    estimatedTransitHours: {
      type: Number,
      required: true,
      min: 0.5
    },
    roadQualityScore: {
      type: Number,
      default: 3.5,
      min: 1.0,
      max: 5.0
    },
    securityRiskLevel: {
      type: String,
      enum: SECURITY_RISK_LEVELS,
      default: 'LOW_STANDARD_PATROL'
    },
    baseTariffPerTonKmNgn: {
      type: Number,
      required: true,
      min: 1.0,
      default: 32.50
    },
    minimumConsignmentTariffNgn: {
      type: Number,
      required: true,
      min: 5000,
      default: 45000
    },
    dieselBenchmarkPriceNgn: {
      type: Number,
      default: 950,
      min: 100
    },
    dieselSensitivityCoeff: {
      type: Number,
      default: 0.45,
      min: 0.1,
      max: 1.0
    },
    reeferColdChainPremiumPct: {
      type: Number,
      default: 25.0,
      min: 0,
      max: 100
    },
    seasonalMultipliers: {
      rainySeasonPeak: { type: Number, default: 1.20, min: 0.8 },
      drySeasonHarvest: { type: Number, default: 1.15, min: 0.8 },
      offSeasonBaseline: { type: Number, default: 1.00, min: 0.8 }
    },
    statutoryTollsAndLeviesNgn: {
      type: Number,
      default: 7500,
      min: 0
    },
    recommendedVehicleType: {
      type: String,
      default: 'MEDIUM_TRUCK_8_TON'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    historicalRateSamples: [
      {
        recordedDate: { type: Date, default: Date.now },
        averageBilledRatePerTonKm: { type: Number },
        dieselPriceAtTimeNgn: { type: Number }
      }
    ]
  },
  {
    timestamps: true
  }
);

/**
 * Calculates dynamic freight tariff quote
 */
RegionalFreightBenchmarkSchema.methods.calculateFreightQuote = function ({
  tonnage = 1.0,
  isTemperatureControlled = false,
  currentDieselPriceNgn = 950,
  season = 'DRY_SEASON_HARVEST'
}) {
  const tons = Math.max(0.1, parseFloat(tonnage) || 1.0);
  const distance = this.distanceKm;

  // 1. Base Freight Subtotal
  const baseRate = this.baseTariffPerTonKmNgn;
  const rawBaseFreight = distance * tons * baseRate;

  // 2. Diesel Inflation Adjustment
  const benchmarkDiesel = this.dieselBenchmarkPriceNgn || 950;
  const dieselDeltaRatio = (currentDieselPriceNgn - benchmarkDiesel) / benchmarkDiesel;
  const fuelSurchargePct = Math.max(-0.15, dieselDeltaRatio * this.dieselSensitivityCoeff);
  const fuelSurchargeNgn = Math.round(rawBaseFreight * fuelSurchargePct);

  // 3. Seasonal Multiplier
  let seasonMultiplier = this.seasonalMultipliers.drySeasonHarvest || 1.15;
  if (season === 'RAINY_SEASON_PEAK') {
    seasonMultiplier = this.seasonalMultipliers.rainySeasonPeak || 1.20;
  } else if (season === 'OFF_SEASON_BASELINE') {
    seasonMultiplier = this.seasonalMultipliers.offSeasonBaseline || 1.00;
  }

  // 4. Reefer Cold Chain Assurance
  let reeferPremiumNgn = 0;
  if (isTemperatureControlled) {
    reeferPremiumNgn = Math.round(rawBaseFreight * (this.reeferColdChainPremiumPct / 100));
  }

  // 5. Road Quality / Security Risk Adjustment
  let securityEscortNgn = 0;
  if (this.securityRiskLevel === 'HIGH_RISK_ESCORT_REQUIRED') {
    securityEscortNgn = 35000;
  } else if (this.securityRiskLevel === 'MEDIUM_CONVOY_ADVISED') {
    securityEscortNgn = 15000;
  }

  // Subtotal before seasonal and tolls
  let calculatedFreight = (rawBaseFreight + fuelSurchargeNgn + reeferPremiumNgn) * seasonMultiplier;
  calculatedFreight += (this.statutoryTollsAndLeviesNgn || 0) + securityEscortNgn;

  // Floor protection
  const finalTariffNgn = Math.max(this.minimumConsignmentTariffNgn, Math.round(calculatedFreight));

  return {
    benchmarkCode: this.benchmarkCode,
    corridorName: this.corridorName,
    distanceKm: distance,
    tonnage: tons,
    baseRatePerTonKm: baseRate,
    rawBaseFreightNgn: Math.round(rawBaseFreight),
    fuelSurchargeNgn,
    reeferPremiumNgn,
    securityEscortNgn,
    statutoryTollsNgn: this.statutoryTollsAndLeviesNgn,
    seasonApplied: season,
    seasonMultiplier,
    finalTariffNgn,
    calculatedRatePerTonKmNgn: parseFloat((finalTariffNgn / (distance * tons)).toFixed(2))
  };
};

module.exports = mongoose.model('RegionalFreightBenchmark', RegionalFreightBenchmarkSchema);
