/**
 * ==============================================================================
 * 🪤 AGRILY SPRINT 22: PHEROMONE & SOLAR LIGHT TRAP TELEMETRY STATION SCHEMA
 * ==============================================================================
 *
 * Models geo-referenced entomological monitoring traps (Delta sticky traps,
 * Universal funnel bucket traps, and solar UV nocturnal light traps) used to
 * detect adult moth biofix flights and trigger degree-day larval clocks.
 *
 * @module models/PheromoneTrapStation
 */

const mongoose = require('mongoose');

const PheromoneTrapStationSchema = new mongoose.Schema(
  {
    trapCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: function () {
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `TRP-NG-${rand}`;
      },
    },
    stationName: {
      type: String,
      required: true,
      trim: true,
      default: 'Zaria Samaru IAR Pheromone Sentinel #01',
    },
    trapDesignType: {
      type: String,
      enum: [
        'UNIVERSAL_BUCKET_FUNNEL',
        'DELTA_STICKY_WING',
        'SOLAR_UV_LIGHT_TRAP',
        'YELLOW_STICKY_WHITEFLY_CARD',
      ],
      default: 'UNIVERSAL_BUCKET_FUNNEL',
    },
    targetPestKey: {
      type: String,
      required: true,
      default: 'FALL_ARMYWORM',
    },
    pheromoneLureCompound: {
      type: String,
      default: 'Z9-14:Ac + Z7-12:Ac + Z11-16:Ac Sex Pheromone Septa',
    },
    stateCode: {
      type: String,
      required: true,
      default: 'KD',
    },
    lgaName: {
      type: String,
      required: true,
      default: 'Sabon Gari',
    },
    coordinates: {
      latitude: { type: Number, required: true, default: 11.165 },
      longitude: { type: Number, required: true, default: 7.635 },
    },
    biofixEstablished: {
      type: Boolean,
      default: true,
    },
    biofixDateIso: {
      type: String,
      default: '2024-10-26',
    },
    accumulatedDegreeDaysSinceBiofix: {
      type: Number,
      min: 0,
      default: 168.5,
    },
    baseDevelopmentalTempC: {
      type: Number,
      default: 12.2,
    },
    upperDevelopmentalCutoffC: {
      type: Number,
      default: 35.5,
    },
    nightlyCatchSeries7Days: {
      type: [Number],
      default: [4, 7, 12, 18, 24, 29, 34],
    },
    sevenDayCumulativeMoths: {
      type: Number,
      default: function () {
        const series = Array.isArray(this.nightlyCatchSeries7Days)
          ? this.nightlyCatchSeries7Days
          : [4, 7, 12, 18, 24, 29, 34];
        return series.reduce((sum, v) => sum + (Number(v) || 0), 0);
      },
    },
    lureReplacementCountdownDays: {
      type: Number,
      min: 0,
      max: 60,
      default: 19,
    },
    trapAlertState: {
      type: String,
      enum: ['BASELINE_MONITORING', 'BIOFIX_SURGE', 'MASS_FLIGHT_CRITICAL'],
      default: function () {
        const series = Array.isArray(this.nightlyCatchSeries7Days)
          ? this.nightlyCatchSeries7Days
          : [4, 7, 12, 18, 24, 29, 34];
        const total = series.reduce((s, v) => s + (Number(v) || 0), 0);
        if (total >= 100) return 'MASS_FLIGHT_CRITICAL';
        if (total >= 35) return 'BIOFIX_SURGE';
        return 'BASELINE_MONITORING';
      },
    },
  },
  { timestamps: true }
);

module.exports = {
  PheromoneTrapStation:
    mongoose.models.PheromoneTrapStation ||
    mongoose.model('PheromoneTrapStation', PheromoneTrapStationSchema),
};
