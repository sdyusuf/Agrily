/**
 * ==============================================================================
 * 🌾 AGRILY HARVEST YIELD PREDICTOR: CROP YIELD FORECAST SCHEMA
 * ==============================================================================
 *
 * Captures hybrid mechanistic (Monteith Radiation Use Efficiency + FAO-33 water
 * response) and ML Ridge Regression ensemble yield predictions for a registered
 * farm parcel, including Monte Carlo confidence intervals (P10/P50/P90),
 * commercial bag/truckload equivalents, and farm-gate revenue projections.
 * ==============================================================================
 */

const mongoose = require('mongoose');

const featureAttributionSchema = new mongoose.Schema(
  {
    featureName: { type: String, required: true },
    contributionTonsPerHa: { type: Number, required: true },
    importanceWeightPct: { type: Number, required: true }
  },
  { _id: false }
);

const cropYieldForecastSchema = new mongoose.Schema(
  {
    forecastCode: {
      type: String,
      required: [true, 'Forecast code is required'],
      trim: true,
      uppercase: true,
      index: true,
      default: function () {
        const cropPrefix = (this.cropType || 'CRP').slice(0, 3).toUpperCase();
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `YLD-${cropPrefix}-${rand}`;
      }
    },
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FarmParcel',
      index: true
    },
    parcelCode: {
      type: String,
      required: [true, 'Parcel code is required'],
      trim: true,
      uppercase: true,
      index: true
    },
    parcelName: {
      type: String,
      required: [true, 'Parcel name is required'],
      trim: true
    },
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      enum: [
        'Maize',
        'Rice',
        'Cassava',
        'Yam',
        'Sorghum',
        'Millet',
        'Soybean',
        'Cowpea',
        'Tomato',
        'Potato',
        'Onion',
        'Cocoa'
      ]
    },
    cultivarCode: {
      type: String,
      default: 'SAMMAZ-15',
      trim: true
    },
    agroEcologicalZone: {
      type: String,
      default: 'Northern Guinea Savannah'
    },
    areaHectares: {
      type: Number,
      required: [true, 'Parcel area in hectares is required'],
      min: [0.1, 'Area must be at least 0.1 hectares']
    },
    daysAfterPlanting: {
      type: Number,
      default: 85,
      min: 1,
      max: 365
    },
    phenologyStage: {
      type: String,
      enum: ['Emergence', 'Vegetative', 'Flowering / Anthesis', 'Grain Fill / Tuber Bulking', 'Physiological Maturity'],
      default: 'Grain Fill / Tuber Bulking'
    },
    inputFeatures: {
      peakNdvi: { type: Number, default: 0.76, min: 0.05, max: 0.99 },
      cumulativeGddCelsiusDays: { type: Number, default: 1420, min: 50 },
      seasonalRainfallMm: { type: Number, default: 680, min: 0 },
      appliedNitrogenKgHa: { type: Number, default: 110, min: 0 },
      appliedPhosphorusKgHa: { type: Number, default: 45, min: 0 },
      appliedPotassiumKgHa: { type: Number, default: 50, min: 0 },
      plantPopulationPerHa: { type: Number, default: 53333, min: 1000 },
      waterStressScalarKs: { type: Number, default: 0.91, min: 0.1, max: 1.0 },
      pestDiseaseLossPct: { type: Number, default: 4.5, min: 0, max: 90 }
    },
    mechanisticBiomassTonsHa: {
      type: Number,
      required: true,
      min: 0
    },
    harvestIndexEffective: {
      type: Number,
      default: 0.46,
      min: 0.1,
      max: 0.85
    },
    predictedYieldTonsPerHa: {
      type: Number,
      required: [true, 'Predicted yield (tons/ha) is required'],
      min: 0
    },
    totalHarvestTonnage: {
      type: Number,
      default: function () {
        const y = Number(this.predictedYieldTonsPerHa || 0);
        const area = Number(this.areaHectares || 1);
        return Number((y * area).toFixed(2));
      }
    },
    monteCarloConfidence: {
      p10DownsideTonsPerHa: { type: Number, required: true },
      p50MedianTonsPerHa: { type: Number, required: true },
      p90UpsideTonsPerHa: { type: Number, required: true },
      coefficientOfVariationPct: { type: Number, default: 11.4 },
      confidenceScorePct: { type: Number, default: 89 }
    },
    commercialEquivalents: {
      standardBagWeightKg: { type: Number, default: 100 },
      estimatedBagsCount: {
        type: Number,
        default: function () {
          const totalTons = Number(this.totalHarvestTonnage || 0);
          return Math.round((totalTons * 1000) / 100);
        }
      },
      thirtyTonTrailersRequired: {
        type: Number,
        default: function () {
          const totalTons = Number(this.totalHarvestTonnage || 0);
          return Math.max(1, Math.ceil(totalTons / 30));
        }
      },
      farmGatePricePerTonNgn: { type: Number, default: 680000 },
      projectedGrossRevenueNgn: {
        type: Number,
        default: function () {
          const totalTons = Number(this.totalHarvestTonnage || 0);
          const price = Number(this.commercialEquivalents?.farmGatePricePerTonNgn || 680000);
          return Math.round(totalTons * price);
        }
      }
    },
    featureAttributions: {
      type: [featureAttributionSchema],
      default: []
    },
    modelVersion: {
      type: String,
      default: 'Agrily-Monteith-RidgeEnsemble-v2.4'
    }
  },
  {
    timestamps: true
  }
);

/**
 * Summarize parcel yield forecast and confidence spread
 */
cropYieldForecastSchema.methods.getExecutiveSummary = function () {
  return {
    forecastCode: this.forecastCode,
    parcelCode: this.parcelCode,
    cropType: this.cropType,
    predictedYieldTonsPerHa: this.predictedYieldTonsPerHa,
    totalHarvestTonnage: this.totalHarvestTonnage,
    p10DownsideTonsPerHa: this.monteCarloConfidence?.p10DownsideTonsPerHa,
    p90UpsideTonsPerHa: this.monteCarloConfidence?.p90UpsideTonsPerHa,
    estimatedBagsCount: this.commercialEquivalents?.estimatedBagsCount,
    projectedGrossRevenueNgn: this.commercialEquivalents?.projectedGrossRevenueNgn
  };
};

module.exports =
  mongoose.models.CropYieldForecast ||
  mongoose.model('CropYieldForecast', cropYieldForecastSchema);
