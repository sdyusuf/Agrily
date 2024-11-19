/**
 * ==============================================================================
 * 💧 AGRILY SPRINT 23: FAO-56 ROOT-ZONE IRRIGATION SCHEDULE SCHEMA
 * ==============================================================================
 *
 * Models parcel-level daily soil water balance and irrigation scheduling using
 * the FAO Irrigation and Drainage Paper No. 56 Dual Crop Coefficient method:
 *
 *   ET_c = (K_cb * K_s + K_e) * ET_0
 *   TAW  = 1000 * (theta_FC - theta_WP) * Z_r   [mm]
 *   RAW  = p * TAW                              [mm]
 *
 * Includes Christiansen / Merriam-Keller Distribution Uniformity (DU_lq),
 * application efficiency (drip, center pivot, sprinkler, furrow), and gross
 * runtime hours per irrigation event.
 *
 * @module models/IrrigationZoneSchedule
 */

const mongoose = require('mongoose');

const IRRIGATION_SYSTEM_TYPES = [
  'SUBSURFACE_DRIP_TAPE',
  'SURFACE_DRIP_EMITTER',
  'CENTER_PIVOT_LEPA',
  'SOLID_SET_SPRINKLER',
  'SOLAR_MICRO_SPRINKLER',
  'GRADED_FURROW_SIPHON',
];

const RootZoneBalanceSubSchema = new mongoose.Schema(
  {
    fieldCapacityVolPct: { type: Number, min: 8, max: 55, default: 29.5 },
    wiltingPointVolPct: { type: Number, min: 3, max: 35, default: 13.5 },
    currentVolumetricMoisturePct: { type: Number, min: 3, max: 55, default: 19.2 },
    effectiveRootDepthMetersZr: { type: Number, min: 0.15, max: 2.5, default: 0.85 },
    managementAllowedDepletionFractionP: { type: Number, min: 0.2, max: 0.8, default: 0.50 },
    totalAvailableWaterMmTaw: {
      type: Number,
      default: function () {
        const fc = (this.fieldCapacityVolPct ?? 29.5) / 100;
        const wp = (this.wiltingPointVolPct ?? 13.5) / 100;
        const zr = this.effectiveRootDepthMetersZr ?? 0.85;
        return Number((1000 * Math.max(0.02, fc - wp) * zr).toFixed(1));
      },
    },
    readilyAvailableWaterMmRaw: {
      type: Number,
      default: function () {
        const fc = (this.fieldCapacityVolPct ?? 29.5) / 100;
        const wp = (this.wiltingPointVolPct ?? 13.5) / 100;
        const zr = this.effectiveRootDepthMetersZr ?? 0.85;
        const p = this.managementAllowedDepletionFractionP ?? 0.50;
        const taw = 1000 * Math.max(0.02, fc - wp) * zr;
        return Number((taw * p).toFixed(1));
      },
    },
    currentRootZoneDepletionMmDr: {
      type: Number,
      default: function () {
        const fc = (this.fieldCapacityVolPct ?? 29.5) / 100;
        const theta = (this.currentVolumetricMoisturePct ?? 19.2) / 100;
        const zr = this.effectiveRootDepthMetersZr ?? 0.85;
        return Number(Math.max(0, 1000 * (fc - theta) * zr).toFixed(1));
      },
    },
  },
  { _id: false }
);

const IrrigationZoneScheduleSchema = new mongoose.Schema(
  {
    scheduleCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: function () {
        const rand = Math.floor(10000 + Math.random() * 90000);
        return `IRR-2024-${rand}`;
      },
    },
    zoneCode: {
      type: String,
      required: true,
      trim: true,
      default: 'ZNE-HADEJIA-01',
    },
    zoneName: {
      type: String,
      required: true,
      trim: true,
      default: 'Kano River Irrigation Project (KRIP) Sector B-04',
    },
    riverBasinAuthority: {
      type: String,
      default: 'Hadejia-Jama’are River Basin Development Authority (HJRBDA)',
    },
    stateCode: {
      type: String,
      required: true,
      default: 'KN',
    },
    cropKey: {
      type: String,
      required: true,
      default: 'MAIZE',
    },
    phenologyStage: {
      type: String,
      default: 'MID_SEASON_TASSEL_SILKING',
    },
    commandAreaHectares: {
      type: Number,
      required: true,
      min: 0.25,
      default: 12.0,
    },
    irrigationSystemType: {
      type: String,
      enum: IRRIGATION_SYSTEM_TYPES,
      default: 'SURFACE_DRIP_EMITTER',
    },
    applicationEfficiencyFractionEa: {
      type: Number,
      min: 0.45,
      max: 0.98,
      default: 0.90,
    },
    distributionUniformityDuLq: {
      type: Number,
      min: 0.55,
      max: 0.98,
      default: 0.91,
    },
    fao56DualKcParameters: {
      referenceEt0MmDay: { type: Number, min: 1.0, max: 12.0, default: 5.8 },
      basalCropCoeffKcb: { type: Number, min: 0.15, max: 1.35, default: 1.15 },
      soilEvaporationCoeffKe: { type: Number, min: 0.0, max: 0.65, default: 0.08 },
      waterStressCoeffKs: { type: Number, min: 0.1, max: 1.0, default: 0.94 },
      cropEvapotranspirationEtcMmDay: {
        type: Number,
        default: function () {
          const et0 = this.fao56DualKcParameters?.referenceEt0MmDay ?? 5.8;
          const kcb = this.fao56DualKcParameters?.basalCropCoeffKcb ?? 1.15;
          const ke = this.fao56DualKcParameters?.soilEvaporationCoeffKe ?? 0.08;
          const ks = this.fao56DualKcParameters?.waterStressCoeffKs ?? 0.94;
          return Number(((kcb * ks + ke) * et0).toFixed(2));
        },
      },
    },
    rootZoneBalance: {
      type: RootZoneBalanceSubSchema,
      default: () => ({}),
    },
    netIrrigationRequirementMm: {
      type: Number,
      default: function () {
        const dr = this.rootZoneBalance?.currentRootZoneDepletionMmDr ?? 87.6;
        return Number(Math.max(0, dr).toFixed(1));
      },
    },
    grossIrrigationRequirementMm: {
      type: Number,
      default: function () {
        const netMm = this.netIrrigationRequirementMm ?? this.rootZoneBalance?.currentRootZoneDepletionMmDr ?? 87.6;
        const ea = this.applicationEfficiencyFractionEa ?? 0.90;
        return Number((netMm / Math.max(0.45, ea)).toFixed(1));
      },
    },
    totalWaterVolumeCubicMeters: {
      type: Number,
      default: function () {
        const grossMm = this.grossIrrigationRequirementMm ?? 97.3;
        const areaHa = this.commandAreaHectares ?? 12.0;
        // 1 mm over 1 ha = 10 m^3
        return Math.round(grossMm * areaHa * 10);
      },
    },
    irrigationTriggerState: {
      type: String,
      enum: [
        'ADEQUATE_ROOT_MOISTURE',
        'APPROACHING_MAD_THRESHOLD',
        'TRIGGER_IRRIGATION_CYCLE_NOW',
        'CRITICAL_WILTING_STRESS_EMERGENCY',
      ],
      default: function () {
        const dr = this.rootZoneBalance?.currentRootZoneDepletionMmDr ?? 87.6;
        const raw = this.rootZoneBalance?.readilyAvailableWaterMmRaw ?? 68.0;
        const taw = this.rootZoneBalance?.totalAvailableWaterMmTaw ?? 136.0;
        if (dr >= taw * 0.78) return 'CRITICAL_WILTING_STRESS_EMERGENCY';
        if (dr >= raw) return 'TRIGGER_IRRIGATION_CYCLE_NOW';
        if (dr >= raw * 0.8) return 'APPROACHING_MAD_THRESHOLD';
        return 'ADEQUATE_ROOT_MOISTURE';
      },
    },
  },
  { timestamps: true }
);

module.exports = {
  IrrigationZoneSchedule:
    mongoose.models.IrrigationZoneSchedule ||
    mongoose.model('IrrigationZoneSchedule', IrrigationZoneScheduleSchema),
  IRRIGATION_SYSTEM_TYPES,
};
