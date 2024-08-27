/**
 * @file CropPathologyRecord.js
 * @description Mongoose Schema for Crop Leaf Disease Diagnosis & Pathology Records
 * Captures AI model inference results, leaf lesion telemetry, pathogen classifications,
 * crop severity staging, and cryptographic diagnosis validation seals.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Standard Nigerian Agricultural Commodities Evaluated by Agronomy AI Vision
 */
const SUPPORTED_CROPS = [
  'TOMATO',
  'CASSAVA',
  'MAIZE',
  'YAM',
  'COCOA',
  'RICE',
  'SORGHUM',
  'COWPEA',
  'PEPPER',
  'OIL_PALM'
];

/**
 * Pathogen Taxonomies
 */
const PATHOGEN_TYPES = [
  'FUNGAL',
  'BACTERIAL',
  'VIRAL',
  'PEST_INFESTATION',
  'PHYSIOLOGICAL_NUTRIENT_DEFICIENCY',
  'NONE_HEALTHY'
];

/**
 * Severity Progression Stages
 */
const SEVERITY_STAGES = [
  'STAGE_0_HEALTHY',
  'STAGE_1_EARLY_LESION',
  'STAGE_2_MODERATE_FOLIAR_SPREAD',
  'STAGE_3_SEVERE_DEFOLIATION',
  'STAGE_4_CATASTROPHIC_CANOPY_COLLAPSE'
];

/**
 * Triage Priorities
 */
const TRIAGE_PRIORITIES = [
  'LOW_WATCHLIST',
  'MEDIUM_ISOLATE_ZONE',
  'HIGH_EMERGENCY_CHEMICAL_INTERVENTION',
  'CRITICAL_QUARANTINE_ERADICATION'
];

/**
 * Nigerian Agro-Ecological Zones
 */
const AGRO_ECOLOGICAL_ZONES = [
  'SAHEL_SAVANNA',
  'SUDAN_SAVANNA',
  'NORTHERN_GUINEA_SAVANNA',
  'SOUTHERN_GUINEA_SAVANNA',
  'DERIVED_SAVANNA',
  'HUMID_FOREST_BELT',
  'MANGROVE_SWAMP'
];

const cropPathologyRecordSchema = new mongoose.Schema({
  diagnosisId: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true,
    default: () => `DX-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  farmerName: {
    type: String,
    required: [true, 'Farmer name is required'],
    trim: true
  },
  farmLocation: {
    state: {
      type: String,
      required: [true, 'State location is required'],
      uppercase: true,
      trim: true
    },
    lga: {
      type: String,
      required: [true, 'Local Government Area (LGA) is required'],
      trim: true
    },
    agroZone: {
      type: String,
      enum: AGRO_ECOLOGICAL_ZONES,
      default: 'SUDAN_SAVANNA'
    },
    coordinates: {
      latitude: {
        type: Number,
        min: 4.0,
        max: 14.5
      },
      longitude: {
        type: Number,
        min: 2.5,
        max: 15.0
      }
    }
  },
  cropType: {
    type: String,
    required: [true, 'Crop commodity type is required'],
    enum: SUPPORTED_CROPS,
    uppercase: true
  },
  fieldAcreageHectares: {
    type: Number,
    min: [0.1, 'Acreage must be at least 0.1 hectare'],
    default: 1.0
  },
  imageMetadata: {
    imageUrl: {
      type: String,
      required: [true, 'Image URL or base64 storage reference is required']
    },
    imageSha256Hash: {
      type: String,
      required: true,
      default: () => crypto.randomBytes(32).toString('hex')
    },
    capturedVia: {
      type: String,
      enum: ['MOBILE_CAMERA', 'DRONE_FIELD_SURVEY', 'DESKTOP_UPLOAD', 'IOT_SPECTRAL_TRAP'],
      default: 'MOBILE_CAMERA'
    }
  },
  aiInference: {
    diseaseCode: {
      type: String,
      required: [true, 'Disease classification code is required'],
      uppercase: true,
      trim: true
    },
    commonDiseaseName: {
      type: String,
      required: [true, 'Common disease name is required'],
      trim: true
    },
    pathogenType: {
      type: String,
      enum: PATHOGEN_TYPES,
      required: true,
      default: 'FUNGAL'
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: [0.0, 'Confidence score must be >= 0.0'],
      max: [1.0, 'Confidence score must be <= 1.0'],
      default: 0.85
    },
    severityStage: {
      type: String,
      enum: SEVERITY_STAGES,
      default: 'STAGE_1_EARLY_LESION'
    },
    affectedCanopyPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 15
    },
    triagePriority: {
      type: String,
      enum: TRIAGE_PRIORITIES,
      default: 'MEDIUM_ISOLATE_ZONE'
    },
    modelEngineVersion: {
      type: String,
      default: 'TensorFlowJS-MobileNetV3-Agrily-v1.4'
    }
  },
  economicImpactEstimate: {
    projectedYieldLossPct: {
      type: Number,
      min: 0,
      max: 100,
      default: 20
    },
    estimatedFinancialLossNgn: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  treatmentPrescription: {
    protocolCode: {
      type: String,
      default: null
    },
    recommendedActionPlan: {
      type: String,
      default: 'Immediate foliar application of recommended biological or systemic fungicide.'
    },
    isContagionReported: {
      type: Boolean,
      default: false
    }
  },
  cryptographicSeal: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Instance method: Compute triage priority, economic loss, and cryptographic seal
cropPathologyRecordSchema.methods.computeTriageAndSeal = function () {
  // 1. Derive triage priority automatically from severity and confidence
  if (this.aiInference.severityStage === 'STAGE_4_CATASTROPHIC_CANOPY_COLLAPSE') {
    this.aiInference.triagePriority = 'CRITICAL_QUARANTINE_ERADICATION';
    this.economicImpactEstimate.projectedYieldLossPct = Math.min(100, Math.max(75, this.aiInference.affectedCanopyPercentage));
  } else if (this.aiInference.severityStage === 'STAGE_3_SEVERE_DEFOLIATION') {
    this.aiInference.triagePriority = 'HIGH_EMERGENCY_CHEMICAL_INTERVENTION';
    this.economicImpactEstimate.projectedYieldLossPct = Math.min(75, Math.max(45, this.aiInference.affectedCanopyPercentage));
  } else if (this.aiInference.severityStage === 'STAGE_2_MODERATE_FOLIAR_SPREAD') {
    this.aiInference.triagePriority = 'MEDIUM_ISOLATE_ZONE';
    this.economicImpactEstimate.projectedYieldLossPct = Math.min(45, Math.max(20, this.aiInference.affectedCanopyPercentage));
  } else if (this.aiInference.severityStage === 'STAGE_0_HEALTHY') {
    this.aiInference.triagePriority = 'LOW_WATCHLIST';
    this.economicImpactEstimate.projectedYieldLossPct = 0;
  } else {
    this.aiInference.triagePriority = 'LOW_WATCHLIST';
    this.economicImpactEstimate.projectedYieldLossPct = 10;
  }

  // 2. Generate tamper-evident SHA-256 seal
  const payload = [
    this.diagnosisId,
    this.cropType,
    this.farmLocation ? this.farmLocation.state : '',
    this.aiInference.diseaseCode,
    this.aiInference.confidenceScore,
    this.aiInference.severityStage,
    this.aiInference.affectedCanopyPercentage
  ].join('|');

  this.cryptographicSeal = crypto.createHash('sha256').update(payload).digest('hex');
  return this;
};

// Calculate triage priority and economic loss prior to saving
cropPathologyRecordSchema.pre('save', function (next) {
  this.computeTriageAndSeal();
  next();
});

// Virtual: Is quarantine action required
cropPathologyRecordSchema.virtual('requiresQuarantineAction').get(function () {
  return this.aiInference.triagePriority === 'CRITICAL_QUARANTINE_ERADICATION' ||
         this.aiInference.affectedCanopyPercentage >= 65;
});

// Virtual: Is healthy leaf diagnosis
cropPathologyRecordSchema.virtual('isHealthyLeaf').get(function () {
  return this.aiInference.pathogenType === 'NONE_HEALTHY' ||
         this.aiInference.severityStage === 'STAGE_0_HEALTHY';
});

const CropPathologyRecord = mongoose.model('CropPathologyRecord', cropPathologyRecordSchema);

module.exports = {
  CropPathologyRecord,
  SUPPORTED_CROPS,
  PATHOGEN_TYPES,
  SEVERITY_STAGES,
  TRIAGE_PRIORITIES,
  AGRO_ECOLOGICAL_ZONES
};
