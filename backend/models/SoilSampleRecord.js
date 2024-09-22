/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - SOIL SAMPLE TELEMETRY RECORD (MONGOOSE SCHEMA)
 * ==============================================================================
 * 
 * Architecture Overview:
 * Comprehensive soil physics, chemistry, and fertility diagnostics record
 * supporting tropical agricultural pedology across Nigeria's 7 agro-ecological
 * zones. Integrates USDA ternary texture classifications, Effective Cation
 * Exchange Capacity (ECEC), Base Saturation %, and cryptographic audit sealing.
 * 
 * Mathematical Formulations:
 * 1. ECEC = Ca^{2+} + Mg^{2+} + K^+ + Na^+ + (Al^{3+} + H^+) [cmol(+)/kg]
 * 2. Base Saturation (BS%) = \frac{Ca + Mg + K + Na}{ECEC} \cdot 100
 * 3. Organic Matter (OM%) = Organic Carbon (OC%) \times 1.724 (Van Bemmelen factor)
 * 4. C:N Ratio = \frac{Organic Carbon \%}{Total Nitrogen \%}
 * 
 * @module models/SoilSampleRecord
 * @requires mongoose
 * @requires crypto
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 */

'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * 7 Agro-Ecological Zones of Nigeria
 */
const AGRO_ECOLOGICAL_ZONES = [
  'SAHEL_SAVANNA',
  'SUDAN_SAVANNA',
  'NORTHERN_GUINEA_SAVANNA',
  'SOUTHERN_GUINEA_SAVANNA',
  'DERIVED_SAVANNA',
  'HUMID_RAINFOREST',
  'MANGROVE_SWAMP_COASTAL'
];

/**
 * Supported Agricultural Commodities
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
 * 12 USDA Soil Textural Classes
 */
const USDA_TEXTURE_CLASSES = [
  'SAND',
  'LOAMY_SAND',
  'SANDY_LOAM',
  'LOAM',
  'SILT_LOAM',
  'SILT',
  'SANDY_CLAY_LOAM',
  'CLAY_LOAM',
  'SILTY_CLAY_LOAM',
  'SANDY_CLAY',
  'SILTY_CLAY',
  'CLAY'
];

const SoilSampleRecordSchema = new mongoose.Schema(
  {
    sampleId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
    farmLocation: {
      state: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        index: true
      },
      lga: {
        type: String,
        required: true,
        trim: true
      },
      villageOrTown: {
        type: String,
        default: 'Agrily Cooperative Farm Hub'
      },
      coordinates: {
        latitude: { type: Number, min: 4.0, max: 14.0 }, // Nigeria latitude boundaries
        longitude: { type: Number, min: 2.5, max: 15.0 } // Nigeria longitude boundaries
      }
    },
    agroEcologicalZone: {
      type: String,
      required: true,
      enum: AGRO_ECOLOGICAL_ZONES,
      default: 'NORTHERN_GUINEA_SAVANNA',
      index: true
    },
    targetCrop: {
      type: String,
      required: true,
      enum: SUPPORTED_CROPS,
      index: true
    },
    fieldAcreageHectares: {
      type: Number,
      required: true,
      min: 0.1,
      max: 10000,
      default: 1.0
    },
    samplingDepthCm: {
      type: Number,
      default: 20, // Standard 0 - 20 cm arable topsoil horizon
      min: 5,
      max: 100
    },
    // Soil Physics
    soilPhysics: {
      sandPct: { type: Number, required: true, min: 0, max: 100 },
      siltPct: { type: Number, required: true, min: 0, max: 100 },
      clayPct: { type: Number, required: true, min: 0, max: 100 },
      bulkDensityGPerCm3: { type: Number, default: 1.35, min: 0.8, max: 2.0 },
      textureClass: {
        type: String,
        enum: USDA_TEXTURE_CLASSES,
        default: 'SANDY_LOAM'
      }
    },
    // Soil Chemical Fertility
    soilChemistry: {
      phWater: { type: Number, required: true, min: 3.0, max: 10.5 }, // 1:1 soil:water
      phBuffer: { type: Number, default: 6.8, min: 4.0, max: 8.5 }, // Adams-Evans / SMP buffer
      organicCarbonPct: { type: Number, required: true, min: 0, max: 15.0 }, // Walkley-Black
      totalNitrogenPct: { type: Number, required: true, min: 0, max: 2.5 }, // Kjeldahl N
      availablePhosphorusBray1MgPerKg: { type: Number, required: true, min: 0, max: 250 }, // Bray-1 P (ppm)
      exchangeableAcidityAlPlusH: { type: Number, default: 0.15, min: 0, max: 15.0 }, // cmol(+)/kg
      exchangeableCations: {
        calciumCa: { type: Number, required: true, min: 0, max: 50.0 }, // cmol(+)/kg
        magnesiumMg: { type: Number, required: true, min: 0, max: 25.0 }, // cmol(+)/kg
        potassiumK: { type: Number, required: true, min: 0, max: 10.0 }, // cmol(+)/kg
        sodiumNa: { type: Number, default: 0.05, min: 0, max: 10.0 } // cmol(+)/kg
      },
      effectiveCec: { type: Number, default: 0 }, // ECEC cmol(+)/kg
      baseSaturationPct: { type: Number, default: 0 }, // Base Saturation %
      electricalConductivityDsPerM: { type: Number, default: 0.25, min: 0, max: 10.0 } // Salinity dS/m
    },
    // Micronutrient Profile (DTPA extractable ppm / mg/kg)
    micronutrientsPpm: {
      zincZn: { type: Number, default: 1.8, min: 0, max: 50.0 },
      boronB: { type: Number, default: 0.45, min: 0, max: 20.0 },
      copperCu: { type: Number, default: 1.2, min: 0, max: 30.0 },
      ironFe: { type: Number, default: 18.0, min: 0, max: 200.0 },
      manganeseMn: { type: Number, default: 14.0, min: 0, max: 150.0 },
      sulfurS: { type: Number, default: 9.5, min: 0, max: 100.0 }
    },
    // Liming and Amendment Assessment
    amendmentAdvisory: {
      requiresLiming: { type: Boolean, default: false },
      recommendedMaterial: {
        type: String,
        enum: ['NONE', 'DOLOMITIC_LIMESTONE', 'CALCITIC_LIMESTONE', 'ELEMENTAL_SULFUR'],
        default: 'NONE'
      },
      recommendedDoseKgPerHa: { type: Number, default: 0 }
    },
    laboratoryMetadata: {
      labName: {
        type: String,
        default: 'Agrily Agricultural Soil Chemistry & Pedology Research Laboratory'
      },
      accreditedStandard: {
        type: String,
        default: 'IITA / Soil Science Society of Nigeria (SSSN) Analytical Protocols'
      },
      certifiedPedologist: {
        type: String,
        default: 'Dr. Amina Bello, FNSS (Chief Pedologist)'
      }
    },
    cryptographicSeal: {
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
 * Virtual: Soil Organic Matter Percentage (OM%)
 * Van Bemmelen standard conversion: OM% = OC% * 1.724
 */
SoilSampleRecordSchema.virtual('soilChemistry.organicMatterPct').get(function () {
  if (this.soilChemistry && typeof this.soilChemistry.organicCarbonPct === 'number') {
    return Number((this.soilChemistry.organicCarbonPct * 1.724).toFixed(2));
  }
  return 0;
});

/**
 * Virtual: Carbon to Nitrogen Ratio (C:N)
 * Healthy tropical agricultural soil target: 10:1 to 15:1
 */
SoilSampleRecordSchema.virtual('soilChemistry.carbonNitrogenRatio').get(function () {
  if (
    this.soilChemistry &&
    typeof this.soilChemistry.organicCarbonPct === 'number' &&
    typeof this.soilChemistry.totalNitrogenPct === 'number' &&
    this.soilChemistry.totalNitrogenPct > 0
  ) {
    return Number((this.soilChemistry.organicCarbonPct / this.soilChemistry.totalNitrogenPct).toFixed(1));
  }
  return 0;
});

/**
 * Static Helper: Classify USDA Soil Texture from Sand, Silt, and Clay percentages
 *
 * @param {number} sand - Sand fraction % (0-100)
 * @param {number} silt - Silt fraction % (0-100)
 * @param {number} clay - Clay fraction % (0-100)
 * @returns {string} USDA textural class name
 */
SoilSampleRecordSchema.statics.classifySoilTexture = function (sand, silt, clay) {
  const s = Number(sand) || 0;
  const si = Number(silt) || 0;
  const c = Number(clay) || 0;

  // Textural boundary logic according to USDA NRCS Soil Survey Triangle
  if (c >= 40) {
    if (si >= 40) return 'SILTY_CLAY';
    if (s >= 45) return 'SANDY_CLAY';
    return 'CLAY';
  }

  if (c >= 27 && c < 40) {
    if (s >= 45) return 'SANDY_CLAY_LOAM';
    if (s <= 20) return 'SILTY_CLAY_LOAM';
    return 'CLAY_LOAM';
  }

  if (si + 1.5 * c < 15) return 'SAND';
  if (si + 2 * c < 30) return 'LOAMY_SAND';

  if (c >= 20 && c < 27) {
    if (s >= 52) return 'SANDY_CLAY_LOAM';
    if (si >= 50) return 'SILT_LOAM';
    return 'LOAM';
  }

  // Clay < 20%
  if (si >= 80 && c < 12) return 'SILT';
  if ((si >= 50 && c < 20) || (si >= 50 && si < 80 && c < 12)) return 'SILT_LOAM';
  if ((c >= 7 && c < 20) && (s > 52) && (si + 2 * c >= 30)) return 'SANDY_LOAM';
  if (c < 7 && si < 50 && (si + 2 * c >= 30)) return 'SANDY_LOAM';
  if (s >= 43 && s < 52 && c >= 7 && c < 20) return 'LOAM';

  return 'LOAM';
};

/**
 * Instance Method: Computes ECEC, Base Saturation, and Liming Status
 */
SoilSampleRecordSchema.methods.computeEcecAndBaseSaturation = function () {
  const cations = this.soilChemistry.exchangeableCations || {};
  const ca = Number(cations.calciumCa) || 0;
  const mg = Number(cations.magnesiumMg) || 0;
  const k = Number(cations.potassiumK) || 0;
  const na = Number(cations.sodiumNa) || 0;
  const acidity = Number(this.soilChemistry.exchangeableAcidityAlPlusH) || 0;

  const sumBases = ca + mg + k + na;
  const ecec = Number((sumBases + acidity).toFixed(2));
  const bs = ecec > 0 ? Number(((sumBases / ecec) * 100).toFixed(1)) : 0;

  this.soilChemistry.effectiveCec = ecec;
  this.soilChemistry.baseSaturationPct = Math.min(100, Math.max(0, bs));

  // Determine Liming Needs based on pH and Base Saturation
  const ph = this.soilChemistry.phWater;
  if (ph < 5.5 || bs < 50) {
    this.amendmentAdvisory.requiresLiming = true;
    this.amendmentAdvisory.recommendedMaterial = mg < 1.0 ? 'DOLOMITIC_LIMESTONE' : 'CALCITIC_LIMESTONE';
    // Lime Requirement in kg/ha: (5.8 - pH) * ECEC * 350
    const dose = Math.max(250, Math.round((5.8 - ph) * ecec * 350));
    this.amendmentAdvisory.recommendedDoseKgPerHa = Math.min(4000, dose);
  } else if (ph > 7.8) {
    this.amendmentAdvisory.requiresLiming = true;
    this.amendmentAdvisory.recommendedMaterial = 'ELEMENTAL_SULFUR';
    this.amendmentAdvisory.recommendedDoseKgPerHa = Math.round((ph - 7.2) * 400);
  } else {
    this.amendmentAdvisory.requiresLiming = false;
    this.amendmentAdvisory.recommendedMaterial = 'NONE';
    this.amendmentAdvisory.recommendedDoseKgPerHa = 0;
  }
};

/**
 * Instance Method: Evaluates Texture, Computes ECEC, and Generates Cryptographic SHA-256 Seal
 */
SoilSampleRecordSchema.methods.computeDiagnosticsAndSeal = function () {
  // 1. Texture Classification
  if (this.soilPhysics) {
    const s = this.soilPhysics.sandPct || 0;
    const si = this.soilPhysics.siltPct || 0;
    const c = this.soilPhysics.clayPct || 0;
    this.soilPhysics.textureClass = this.constructor.classifySoilTexture(s, si, c);
  }

  // 2. Chemistry & Liming
  this.computeEcecAndBaseSaturation();

  // 3. Cryptographic Audit Seal (SHA-256)
  const sealPayload = JSON.stringify({
    sampleId: this.sampleId,
    farmerEmail: this.farmerEmail,
    state: this.farmLocation ? this.farmLocation.state : 'N/A',
    crop: this.targetCrop,
    phWater: this.soilChemistry.phWater,
    ecec: this.soilChemistry.effectiveCec,
    bsPct: this.soilChemistry.baseSaturationPct,
    texture: this.soilPhysics.textureClass,
    requiresLiming: this.amendmentAdvisory.requiresLiming,
    timestamp: this.createdAt || new Date().toISOString()
  });

  this.cryptographicSeal = crypto.createHash('sha256').update(sealPayload).digest('hex');
};

/**
 * Pre-Save Mongoose Hook: Auto-compute diagnostics and seal
 */
SoilSampleRecordSchema.pre('save', function (next) {
  this.computeDiagnosticsAndSeal();
  next();
});

module.exports = mongoose.model('SoilSampleRecord', SoilSampleRecordSchema);
module.exports.AGRO_ECOLOGICAL_ZONES = AGRO_ECOLOGICAL_ZONES;
module.exports.SUPPORTED_CROPS = SUPPORTED_CROPS;
module.exports.USDA_TEXTURE_CLASSES = USDA_TEXTURE_CLASSES;
