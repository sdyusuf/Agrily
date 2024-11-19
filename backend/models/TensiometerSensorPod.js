/**
 * ==============================================================================
 * 🌡️ AGRILY SPRINT 23: MULTI-DEPTH TENSIOMETER & CAPACITANCE SENSOR POD SCHEMA
 * ==============================================================================
 *
 * Models in-situ soil moisture tensiometers & dielectric FDR/TDR probes measuring:
 *  - Matric suction potential (kPa / centibars) at 15cm, 30cm, 60cm, and 90cm depths
 *  - Bulk soil pore-water electrical conductivity (EC_e dS/m) for Rhoades salinity
 *    leaching requirement (LR = EC_w / (5 * EC_e_threshold - EC_w))
 *
 * @module models/TensiometerSensorPod
 */

const mongoose = require('mongoose');

const DepthHorizonSchema = new mongoose.Schema(
  {
    depthCm: { type: Number, required: true, enum: [15, 30, 60, 90], default: 30 },
    matricSuctionKpa: { type: Number, required: true, min: 0, max: 1500, default: 42.0 },
    volumetricMoisturePct: { type: Number, required: true, min: 2, max: 58, default: 21.4 },
    soilTempC: { type: Number, default: 26.8 },
    poreWaterEcDsm: { type: Number, min: 0.05, max: 25.0, default: 1.35 },
  },
  { _id: false }
);

const TensiometerSensorPodSchema = new mongoose.Schema(
  {
    podCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: function () {
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `TNS-POD-${rand}`;
      },
    },
    zoneCode: {
      type: String,
      required: true,
      default: 'ZNE-HADEJIA-01',
    },
    soilTextureClass: {
      type: String,
      enum: [
        'SANDY_LOAM',
        'LOAM',
        'SANDY_CLAY_LOAM',
        'CLAY_LOAM',
        'SILTY_CLAY_LOAM',
        'FADAMA_VERTISOL_CLAY',
      ],
      default: 'SANDY_CLAY_LOAM',
    },
    depthHorizons: {
      type: [DepthHorizonSchema],
      default: () => [
        { depthCm: 15, matricSuctionKpa: 48.0, volumetricMoisturePct: 18.8, soilTempC: 28.4, poreWaterEcDsm: 1.45 },
        { depthCm: 30, matricSuctionKpa: 41.0, volumetricMoisturePct: 20.5, soilTempC: 27.1, poreWaterEcDsm: 1.32 },
        { depthCm: 60, matricSuctionKpa: 32.0, volumetricMoisturePct: 23.4, soilTempC: 26.0, poreWaterEcDsm: 1.18 },
        { depthCm: 90, matricSuctionKpa: 24.0, volumetricMoisturePct: 26.1, soilTempC: 25.4, poreWaterEcDsm: 1.10 },
      ],
    },
    rootZoneWeightedSuctionKpa: {
      type: Number,
      default: function () {
        const horizons = Array.isArray(this.depthHorizons) && this.depthHorizons.length > 0
          ? this.depthHorizons
          : [{ matricSuctionKpa: 42.0 }];
        const avg =
          horizons.reduce((sum, h) => sum + (Number(h.matricSuctionKpa) || 0), 0) /
          horizons.length;
        return Number(avg.toFixed(1));
      },
    },
    irrigationWaterEcDsm: {
      type: Number,
      default: 0.85,
    },
    cropSalinityThresholdEcDsm: {
      type: Number,
      default: 1.7, // Maize FAO-29 threshold = 1.7 dS/m
    },
    leachingRequirementFractionLr: {
      type: Number,
      default: function () {
        const ecw = this.irrigationWaterEcDsm ?? 0.85;
        const ect = this.cropSalinityThresholdEcDsm ?? 1.7;
        const denom = Math.max(0.5, 5 * ect - ecw);
        return Number(Math.min(0.35, Math.max(0.02, ecw / denom)).toFixed(3));
      },
    },
  },
  { timestamps: true }
);

module.exports = {
  TensiometerSensorPod:
    mongoose.models.TensiometerSensorPod ||
    mongoose.model('TensiometerSensorPod', TensiometerSensorPodSchema),
};
