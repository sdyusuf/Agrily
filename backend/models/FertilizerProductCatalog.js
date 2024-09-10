/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - FERTILIZER PRODUCT CATALOG (MONGOOSE SCHEMA)
 * ==============================================================================
 * 
 * Architecture Overview:
 * Master catalog of registered commercial and organic fertilizer formulations
 * distributed across Nigerian agricultural supply chains. Enables algorithmic
 * linear-programming optimization of lowest-cost bag combinations matching
 * crop nutrient prescriptions.
 * 
 * Regulated Fertilizer Formulas Included:
 * - NPK 15-15-15 (Standard Basal Compound)
 * - NPK 20-10-10 (High Nitrogen Cereal Formulation)
 * - Urea 46-0-0 (High Analysis Nitrogen Top-Dress)
 * - DAP 18-46-0 (Diammonium Phosphate Root Establishment)
 * - MOP 0-0-60 (Muriate of Potash / Potassium Chloride)
 * - SSP 0-18-0 (Single Superphosphate with 12% Sulfur)
 * - CAN 27-0-0 (Calcium Ammonium Nitrate Non-Acidifying Top-Dress)
 * - Agricultural Dolomitic Limestone (CaCO3 + MgCO3)
 * 
 * @module models/FertilizerProductCatalog
 * @requires mongoose
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 */

'use strict';

const mongoose = require('mongoose');

const FERTILIZER_CATEGORIES = [
  'INORGANIC_BLENDED',
  'INORGANIC_STRAIGHT',
  'ORGANIC_BIOLOGICAL',
  'SOIL_AMENDMENT_LIME'
];

const PHYSICAL_FORMS = [
  'GRANULAR',
  'PRILL',
  'POWDER',
  'LIQUID_FOLIAR'
];

const FertilizerProductCatalogSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    brandName: {
      type: String,
      required: true,
      trim: true
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: FERTILIZER_CATEGORIES,
      index: true
    },
    physicalForm: {
      type: String,
      required: true,
      enum: PHYSICAL_FORMS,
      default: 'GRANULAR'
    },
    guaranteedAnalysis: {
      totalNitrogenPct: { type: Number, required: true, min: 0, max: 82.0 },
      availablePhosphateP2O5Pct: { type: Number, required: true, min: 0, max: 60.0 },
      solublePotashK2OPct: { type: Number, required: true, min: 0, max: 62.0 },
      secondaryNutrients: {
        sulfurS: { type: Number, default: 0, min: 0, max: 30.0 },
        calciumCa: { type: Number, default: 0, min: 0, max: 40.0 },
        magnesiumMg: { type: Number, default: 0, min: 0, max: 25.0 }
      },
      micronutrients: {
        zincZn: { type: Number, default: 0, min: 0, max: 5.0 },
        boronB: { type: Number, default: 0, min: 0, max: 2.0 }
      }
    },
    packagingBagSizeKg: {
      type: Number,
      required: true,
      default: 50.0,
      min: 1.0
    },
    bulkDensityKgPerLiter: {
      type: Number,
      default: 1.02,
      min: 0.5,
      max: 2.0
    },
    saltIndex: {
      type: Number,
      default: 55, // Measure of chemical osmotic salt burn potential
      min: 0,
      max: 150
    },
    marketWholesalePriceNaira: {
      type: Number,
      required: true,
      min: 500,
      default: 38000 // Average price per 50kg bag
    },
    nafdacOrFsrNumber: {
      type: String,
      required: true,
      default: 'FS-REG-NG-2024-001'
    },
    inStock: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Virtual: N-P-K Grade String (e.g., '15-15-15', '46-0-0')
 */
FertilizerProductCatalogSchema.virtual('npkGrade').get(function () {
  const g = this.guaranteedAnalysis;
  if (!g) return '0-0-0';
  return `${g.totalNitrogenPct}-${g.availablePhosphateP2O5Pct}-${g.solublePotashK2OPct}`;
});

/**
 * Instance Method: Compute Elemental Content in 1 Standard Bag (in kg)
 *
 * @returns {Object} Net kilograms of active nutrients per package
 */
FertilizerProductCatalogSchema.methods.computeNutrientsPerBag = function () {
  const bagKg = this.packagingBagSizeKg || 50;
  const g = this.guaranteedAnalysis || { totalNitrogenPct: 0, availablePhosphateP2O5Pct: 0, solublePotashK2OPct: 0 };

  return {
    bagSizeKg: bagKg,
    nitrogenKg: Number(((g.totalNitrogenPct / 100) * bagKg).toFixed(2)),
    phosphateP2O5Kg: Number(((g.availablePhosphateP2O5Pct / 100) * bagKg).toFixed(2)),
    potashK2OKg: Number(((g.solublePotashK2OPct / 100) * bagKg).toFixed(2)),
    sulfurKg: Number((((g.secondaryNutrients?.sulfurS || 0) / 100) * bagKg).toFixed(2)),
    calciumKg: Number((((g.secondaryNutrients?.calciumCa || 0) / 100) * bagKg).toFixed(2)),
    magnesiumKg: Number((((g.secondaryNutrients?.magnesiumMg || 0) / 100) * bagKg).toFixed(2))
  };
};

module.exports = mongoose.model('FertilizerProductCatalog', FertilizerProductCatalogSchema);
module.exports.FERTILIZER_CATEGORIES = FERTILIZER_CATEGORIES;
module.exports.PHYSICAL_FORMS = PHYSICAL_FORMS;
