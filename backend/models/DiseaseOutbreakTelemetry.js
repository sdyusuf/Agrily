/**
 * @file DiseaseOutbreakTelemetry.js
 * @description Mongoose Schema for Regional Crop Disease Outbreak Telemetry & Contagion Mapping.
 * Tracks spatial disease clusters across Nigerian states/LGAs, outbreak risk levels,
 * vector climatology telemetry, acreage at risk, and active quarantine buffer perimeters.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Contagion Risk Classification Levels
 */
const OUTBREAK_STATUSES = [
  'MONITORING_NORMAL',
  'LOCALIZED_SPORADIC',
  'MODERATE_SPREAD_WATCH',
  'EPIDEMIC_SURGE_WARNING',
  'CRITICAL_QUARANTINE_LOCKDOWN'
];

/**
 * 36 Nigerian States + FCT Geo-Clusters
 */
const NIGERIAN_STATES = [
  'ABIA', 'ADAMAWA', 'AKWA IBOM', 'ANAMBRA', 'BAUCHI', 'BAYELSA', 'BENUE',
  'BORNO', 'CROSS RIVER', 'DELTA', 'EBONYI', 'EDO', 'EKITI', 'ENUGU',
  'FCT', 'GOMBE', 'IMO', 'JIGAWA', 'KADUNA', 'KANO', 'KATSINA', 'KEBBI',
  'KOGI', 'KWARA', 'LAGOS', 'NASARAWA', 'NIGER', 'OGUN', 'ONDO', 'OSUN',
  'OYO', 'PLATEAU', 'RIVERS', 'SOKOTO', 'TARABA', 'YOBE', 'ZAMFARA'
];

const diseaseOutbreakTelemetrySchema = new mongoose.Schema({
  outbreakClusterId: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true,
    default: () => `OBK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
  },
  state: {
    type: String,
    required: [true, 'Nigerian state is required'],
    enum: NIGERIAN_STATES,
    uppercase: true,
    trim: true
  },
  lgaCluster: [{
    type: String,
    trim: true
  }],
  primaryCropAffected: {
    type: String,
    required: [true, 'Primary affected crop is required'],
    uppercase: true,
    trim: true
  },
  targetPathogenCode: {
    type: String,
    required: [true, 'Target pathogen code is required'],
    uppercase: true,
    trim: true
  },
  pathogenCommonName: {
    type: String,
    required: [true, 'Pathogen common name is required'],
    trim: true
  },
  outbreakStatus: {
    type: String,
    enum: OUTBREAK_STATUSES,
    default: 'LOCALIZED_SPORADIC',
    required: true
  },
  reportedCasesCount: {
    type: Number,
    min: 1,
    default: 1
  },
  confirmedAcreageHectares: {
    type: Number,
    min: 0,
    default: 10
  },
  quarantineRadiusKm: {
    type: Number,
    min: 0,
    max: 250,
    default: 5.0
  },
  environmentalTelemetry: {
    ambientTemperatureC: {
      type: Number,
      default: 28.5
    },
    relativeHumidityPct: {
      type: Number,
      min: 0,
      max: 100,
      default: 75.0
    },
    precipitationMm: {
      type: Number,
      min: 0,
      default: 12.0
    },
    sporeFavorableIndex: {
      type: Number,
      min: 0,
      max: 1.0,
      default: 0.65
    }
  },
  containmentProtocol: {
    isBorderTransitInterdicted: {
      type: Boolean,
      default: false
    },
    mandatoryChemicalSprayZone: {
      type: Boolean,
      default: false
    },
    quarantineAuthority: {
      type: String,
      default: 'Nigeria Agricultural Quarantine Service (NAQS)'
    },
    quarantineEnactedAt: {
      type: Date,
      default: null
    }
  },
  telemetryIntegrityHash: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Instance method: Auto-derive quarantine buffer and telemetry hash
diseaseOutbreakTelemetrySchema.methods.computeQuarantinePerimeter = function () {
  // 1. Auto-adjust quarantine radius and interdiction based on outbreak severity
  if (this.outbreakStatus === 'CRITICAL_QUARANTINE_LOCKDOWN') {
    this.quarantineRadiusKm = Math.max(this.quarantineRadiusKm, 25.0);
    this.containmentProtocol.isBorderTransitInterdicted = true;
    this.containmentProtocol.mandatoryChemicalSprayZone = true;
    if (!this.containmentProtocol.quarantineEnactedAt) {
      this.containmentProtocol.quarantineEnactedAt = new Date();
    }
  } else if (this.outbreakStatus === 'EPIDEMIC_SURGE_WARNING') {
    this.quarantineRadiusKm = Math.max(this.quarantineRadiusKm, 15.0);
    this.containmentProtocol.mandatoryChemicalSprayZone = true;
  } else if (this.outbreakStatus === 'MODERATE_SPREAD_WATCH') {
    this.quarantineRadiusKm = Math.max(this.quarantineRadiusKm, 8.0);
  }

  // 2. Generate tamper-proof SHA-256 telemetry hash
  const payload = [
    this.outbreakClusterId,
    this.state,
    this.primaryCropAffected,
    this.targetPathogenCode,
    this.outbreakStatus,
    this.reportedCasesCount,
    this.confirmedAcreageHectares,
    this.quarantineRadiusKm
  ].join('|');

  this.telemetryIntegrityHash = crypto.createHash('sha256').update(payload).digest('hex');
  return this;
};

// Auto-derive quarantine buffer and telemetry hash before saving
diseaseOutbreakTelemetrySchema.pre('save', function (next) {
  this.computeQuarantinePerimeter();
  next();
});

// Virtual: Contagion emergency level
diseaseOutbreakTelemetrySchema.virtual('isHighRiskEmergency').get(function () {
  return this.outbreakStatus === 'CRITICAL_QUARANTINE_LOCKDOWN' ||
         this.outbreakStatus === 'EPIDEMIC_SURGE_WARNING';
});

// Virtual: Estimated produce volume at risk (in metric tonnes, average 15MT/ha)
diseaseOutbreakTelemetrySchema.virtual('estimatedProduceVolumeAtRiskMt').get(function () {
  return Number((this.confirmedAcreageHectares * 15.2).toFixed(2));
});

const DiseaseOutbreakTelemetry = mongoose.model('DiseaseOutbreakTelemetry', diseaseOutbreakTelemetrySchema);

module.exports = {
  DiseaseOutbreakTelemetry,
  OUTBREAK_STATUSES,
  NIGERIAN_STATES
};
