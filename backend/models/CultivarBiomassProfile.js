/**
 * ==============================================================================
 * 🌾 AGRILY HARVEST YIELD PREDICTOR: CULTIVAR BIOMASS PROFILE SCHEMA
 * ==============================================================================
 *
 * Defines ecophysiological genetic parameters for improved West African crop
 * cultivars (IITA / IAR / NCRI releases), including Radiation Use Efficiency
 * (RUE in g dry matter per MJ intercepted PAR), Canopy Extinction Coefficient
 * (k_ext), Potential Harvest Index (HI_0), and FAO-33 Yield Response Factor (Ky).
 * ==============================================================================
 */

const mongoose = require('mongoose');

const cultivarBiomassProfileSchema = new mongoose.Schema(
  {
    cultivarCode: {
      type: String,
      required: [true, 'Cultivar code is required'],
      trim: true,
      uppercase: true,
      unique: true
    },
    cultivarName: {
      type: String,
      required: [true, 'Cultivar name is required'],
      trim: true
    },
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      trim: true
    },
    breedingInstitute: {
      type: String,
      default: 'IITA / IAR Samaru'
    },
    maturityDays: {
      type: Number,
      required: true,
      default: 110,
      min: 45,
      max: 365
    },
    radiationUseEfficiencyGramPerMjPar: {
      type: Number,
      required: true,
      default: 3.6, // C4 Maize ~3.6-3.8 g/MJ; C3 Rice/Soybean ~2.2-2.6 g/MJ
      min: 0.8,
      max: 5.5
    },
    canopyExtinctionCoefficientK: {
      type: Number,
      default: 0.65,
      min: 0.3,
      max: 1.1
    },
    baselineHarvestIndex: {
      type: Number,
      required: true,
      default: 0.48,
      min: 0.15,
      max: 0.85
    },
    fao33WaterYieldResponseKy: {
      type: Number,
      default: 1.25, // Maize Ky = 1.25; Sorghum Ky = 0.90; Cassava Ky = 0.85
      min: 0.4,
      max: 2.0
    },
    geneticPotentialYieldTonsPerHa: {
      type: Number,
      required: true,
      default: 7.8,
      min: 0.5,
      max: 60.0
    },
    optimalPlantPopulationPerHa: {
      type: Number,
      default: 53333
    },
    standardCommercialMoisturePct: {
      type: Number,
      default: 13.0
    },
    droughtToleranceRating: {
      type: String,
      enum: ['High Tolerance', 'Moderate Tolerance', 'Sensitive'],
      default: 'Moderate Tolerance'
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.CultivarBiomassProfile ||
  mongoose.model('CultivarBiomassProfile', cultivarBiomassProfileSchema);
