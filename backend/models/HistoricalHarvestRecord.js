/**
 * ==============================================================================
 * 🌾 AGRILY HARVEST YIELD PREDICTOR: HISTORICAL HARVEST & WEIGHBRIDGE SCHEMA
 * ==============================================================================
 *
 * Captures verified post-harvest weighbridge tonnage tickets, grain moisture
 * percentages at harvest, dry-weight commercial shrinkage adjustments, and
 * prediction error residuals (RMSE / MAPE) used to recalibrate parcel models.
 * ==============================================================================
 */

const mongoose = require('mongoose');

const historicalHarvestRecordSchema = new mongoose.Schema(
  {
    ticketCode: {
      type: String,
      required: [true, 'Weighbridge ticket code is required'],
      trim: true,
      uppercase: true,
      default: function () {
        return `WBG-${Math.floor(10000 + Math.random() * 90000)}`;
      }
    },
    parcelCode: {
      type: String,
      required: [true, 'Parcel code is required'],
      trim: true,
      uppercase: true,
      index: true
    },
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      trim: true
    },
    cultivarCode: {
      type: String,
      default: 'SAMMAZ-15',
      trim: true
    },
    harvestSeasonLabel: {
      type: String,
      required: [true, 'Harvest season label is required'],
      default: '2024 Wet Season'
    },
    harvestDate: {
      type: Date,
      default: Date.now
    },
    harvestedAreaHectares: {
      type: Number,
      required: [true, 'Harvested area (ha) is required'],
      min: 0.1
    },
    wetHarvestedTonnage: {
      type: Number,
      required: [true, 'Wet harvested tonnage is required'],
      min: 0.05
    },
    harvestMoisturePct: {
      type: Number,
      required: [true, 'Harvest moisture percentage is required'],
      default: 18.5,
      min: 5.0,
      max: 75.0
    },
    standardCommercialMoisturePct: {
      type: Number,
      default: 13.0,
      min: 5.0,
      max: 65.0
    },
    dryAdjustedCommercialTonnage: {
      type: Number,
      default: function () {
        const wet = Number(this.wetHarvestedTonnage || 0);
        const mi = Number(this.harvestMoisturePct ?? 18.5);
        const mf = Number(this.standardCommercialMoisturePct ?? 13.0);
        if (mi <= mf) return Number(wet.toFixed(2));
        const adjusted = wet * ((100 - mi) / (100 - mf));
        return Number(adjusted.toFixed(2));
      }
    },
    actualYieldTonsPerHa: {
      type: Number,
      default: function () {
        const dryTons = Number(this.dryAdjustedCommercialTonnage || this.wetHarvestedTonnage || 0);
        const area = Math.max(0.1, Number(this.harvestedAreaHectares || 1));
        return Number((dryTons / area).toFixed(2));
      }
    },
    preHarvestPredictedYieldTonsPerHa: {
      type: Number,
      required: [true, 'Pre-harvest predicted yield is required'],
      min: 0
    },
    absolutePercentageErrorPct: {
      type: Number,
      default: function () {
        const actual = Number(this.actualYieldTonsPerHa || 0);
        const pred = Number(this.preHarvestPredictedYieldTonsPerHa || 0);
        if (actual <= 0) return 0;
        return Number(((Math.abs(actual - pred) / actual) * 100).toFixed(2));
      }
    },
    qualityGrade: {
      type: String,
      enum: ['SON Grade 1 Export', 'SON Grade 2 Commercial', 'Grade 3 Processing', 'Sub-Standard High Moisture'],
      default: 'SON Grade 1 Export'
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.HistoricalHarvestRecord ||
  mongoose.model('HistoricalHarvestRecord', historicalHarvestRecordSchema);
