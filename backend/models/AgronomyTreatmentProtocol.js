/**
 * @file AgronomyTreatmentProtocol.js
 * @description Mongoose Schema for Crop Agronomy Treatment & Phytosanitary Protocols.
 * Details curated curative, preventative, and organic treatments for diagnosed crop diseases,
 * complete with Pre-Harvest Interval (PHI) withdrawal safety windows, dosage rates,
 * NAFDAC registration references, and protective equipment guidelines.
 */

const mongoose = require('mongoose');

/**
 * Treatment Classifications
 */
const TREATMENT_TYPES = [
  'ORGANIC_BIO_FUNGICIDE',
  'SYSTEMIC_CHEMICAL_FUNGICIDE',
  'CONTACT_BACTERICIDE',
  'BOTANICAL_NEEM_EXTRACT',
  'BENEFICIAL_MICROBIAL_INOCULANT',
  'CHEMICAL_INSECTICIDE_ACARICIDE',
  'CULTURAL_PRUNING_ISOLATION'
];

/**
 * Application Modes
 */
const APPLICATION_METHODS = [
  'FOLIAR_KNAPSACK_SPRAY',
  'SOIL_DRENCH_ROOT_ZONE',
  'SEED_DRESSING_SLURRY',
  'TRUNK_INJECTION_COLLAR_PAINT',
  'ELECTROSTATIC_DRONE_SPRAY',
  'ORGANIC_MULCH_INTEGRATION'
];

const agronomyTreatmentProtocolSchema = new mongoose.Schema({
  protocolCode: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true
  },
  diseaseCode: {
    type: String,
    required: [true, 'Associated disease code is required'],
    uppercase: true,
    trim: true
  },
  targetCrop: {
    type: String,
    required: [true, 'Target crop commodity is required'],
    uppercase: true,
    trim: true
  },
  treatmentName: {
    type: String,
    required: [true, 'Treatment commercial/technical name is required'],
    trim: true
  },
  treatmentType: {
    type: String,
    enum: TREATMENT_TYPES,
    required: true,
    default: 'SYSTEMIC_CHEMICAL_FUNGICIDE'
  },
  activeIngredients: [{
    chemicalName: {
      type: String,
      required: true,
      trim: true
    },
    concentrationPct: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  applicationMethod: {
    type: String,
    enum: APPLICATION_METHODS,
    default: 'FOLIAR_KNAPSACK_SPRAY'
  },
  dosageRate: {
    quantity: {
      type: Number,
      required: true,
      min: 0.01
    },
    unit: {
      type: String,
      enum: ['L_PER_HA', 'KG_PER_HA', 'ML_PER_20L_KNAPSACK', 'G_PER_20L_KNAPSACK'],
      default: 'L_PER_HA'
    },
    dilutionWaterLitersPerHa: {
      type: Number,
      default: 200
    }
  },
  applicationFrequency: {
    intervalDays: {
      type: Number,
      min: 1,
      default: 7
    },
    maximumApplicationsPerSeason: {
      type: Number,
      min: 1,
      default: 3
    }
  },
  safetyAndWithdrawal: {
    preHarvestIntervalDays: {
      type: Number,
      required: [true, 'Pre-Harvest Interval (PHI) in days is mandatory for food safety'],
      min: 0,
      default: 14
    },
    reEntryIntervalHours: {
      type: Number,
      min: 0,
      default: 24
    },
    requiredPPE: [{
      type: String,
      trim: true
    }],
    nafdacRegNumber: {
      type: String,
      trim: true,
      default: 'NAFDAC-AG-PENDING'
    },
    pollinatorToxicity: {
      type: String,
      enum: ['NON_TOXIC', 'LOW_RISK', 'MODERATE_RISK', 'HIGHLY_TOXIC_TO_BEES'],
      default: 'LOW_RISK'
    }
  },
  organicCertified: {
    type: Boolean,
    default: false
  },
  curativeEfficacyPct: {
    type: Number,
    min: 0,
    max: 100,
    default: 88.0
  },
  curativeInstructions: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: Food safety clearance warning
agronomyTreatmentProtocolSchema.virtual('requiresLongWithdrawal').get(function () {
  return this.safetyAndWithdrawal.preHarvestIntervalDays >= 14;
});

// Virtual: Is bee-friendly eco treatment
agronomyTreatmentProtocolSchema.virtual('isPollinatorFriendly').get(function () {
  return this.safetyAndWithdrawal.pollinatorToxicity === 'NON_TOXIC' ||
         this.safetyAndWithdrawal.pollinatorToxicity === 'LOW_RISK';
});

const AgronomyTreatmentProtocol = mongoose.model('AgronomyTreatmentProtocol', agronomyTreatmentProtocolSchema);

module.exports = {
  AgronomyTreatmentProtocol,
  TREATMENT_TYPES,
  APPLICATION_METHODS
};
