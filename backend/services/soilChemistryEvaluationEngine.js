/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - SOIL CHEMISTRY & FERTILITY EVALUATION ENGINE
 * ==============================================================================
 * 
 * Architecture Overview:
 * High-performance soil fertility diagnostics engine implementing Liebig's Law
 * of the Minimum, Adams-Evans/SMP buffer pH lime requirement calculations,
 * and Aluminum toxicity risk indexing for tropical agricultural soils.
 * 
 * Mathematical Formulations:
 * 1. Liebig Limiting Nutrient Factor:
 *    \lambda_{i} = \frac{S_{measured, i}}{S_{optimal, i}} \quad \forall i \in \{N, P, K, Ca, Mg, S, Zn, B\}
 *    L_{minimum} = \min(\lambda_1, \lambda_2, \dots, \lambda_m)
 * 
 * 2. Acid Saturation Index (ASI%):
 *    ASI\% = \left( \frac{Al^{3+} + H^+}{ECEC} \right) \cdot 100
 *    If ASI% > 20% in sensitive crops (e.g. Maize), Aluminum toxicity inhibits root elongation.
 * 
 * 3. Adams-Evans Tropical Liming Requirement:
 *    Lime_{tons/ha} = \max\left(0, \frac{(pH_{target} - pH_{H2O}) \cdot ECEC \cdot 0.35}{F_{purity}}\right)
 * 
 * 4. Overall Soil Fertility Index (0 - 100):
 *    SFI = \sum_{i=1}^{k} w_i \cdot \min(100, \lambda_i \cdot 100)
 * 
 * @module services/soilChemistryEvaluationEngine
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 */

'use strict';

/**
 * Crop-Specific Optimal Soil Chemical Thresholds
 */
const CROP_OPTIMAL_NUTRIENT_THRESHOLDS = Object.freeze({
  TOMATO: {
    phOptimal: { min: 6.0, max: 6.8 },
    nitrogenTotalPct: 0.15,
    phosphorusBray1Ppm: 25.0,
    potassiumK_cmol: 0.50,
    calciumCa_cmol: 5.0,
    magnesiumMg_cmol: 2.0,
    sulfurPpm: 12.0,
    zincPpm: 2.0,
    boronPpm: 0.6,
    maxAcidSaturationPct: 15.0
  },
  CASSAVA: {
    phOptimal: { min: 5.5, max: 6.5 },
    nitrogenTotalPct: 0.10,
    phosphorusBray1Ppm: 12.0,
    potassiumK_cmol: 0.40,
    calciumCa_cmol: 3.5,
    magnesiumMg_cmol: 1.2,
    sulfurPpm: 8.0,
    zincPpm: 1.2,
    boronPpm: 0.3,
    maxAcidSaturationPct: 25.0 // High acid tolerance
  },
  MAIZE: {
    phOptimal: { min: 5.8, max: 7.0 },
    nitrogenTotalPct: 0.14,
    phosphorusBray1Ppm: 18.0,
    potassiumK_cmol: 0.35,
    calciumCa_cmol: 4.0,
    magnesiumMg_cmol: 1.5,
    sulfurPpm: 10.0,
    zincPpm: 1.5,
    boronPpm: 0.4,
    maxAcidSaturationPct: 18.0
  },
  YAM: {
    phOptimal: { min: 5.8, max: 6.6 },
    nitrogenTotalPct: 0.12,
    phosphorusBray1Ppm: 15.0,
    potassiumK_cmol: 0.60, // High potassium feeder for starch tuberization
    calciumCa_cmol: 4.5,
    magnesiumMg_cmol: 1.8,
    sulfurPpm: 9.0,
    zincPpm: 1.4,
    boronPpm: 0.4,
    maxAcidSaturationPct: 20.0
  },
  COCOA: {
    phOptimal: { min: 6.0, max: 7.2 },
    nitrogenTotalPct: 0.18,
    phosphorusBray1Ppm: 20.0,
    potassiumK_cmol: 0.55,
    calciumCa_cmol: 6.0,
    magnesiumMg_cmol: 2.5,
    sulfurPpm: 14.0,
    zincPpm: 2.5,
    boronPpm: 0.8,
    maxAcidSaturationPct: 10.0 // Highly sensitive to aluminum toxicity
  },
  RICE: {
    phOptimal: { min: 5.5, max: 6.5 },
    nitrogenTotalPct: 0.13,
    phosphorusBray1Ppm: 15.0,
    potassiumK_cmol: 0.30,
    calciumCa_cmol: 3.8,
    magnesiumMg_cmol: 1.4,
    sulfurPpm: 10.0,
    zincPpm: 1.8, // Zinc critical in flooded paddy soils
    boronPpm: 0.35,
    maxAcidSaturationPct: 22.0
  },
  SORGHUM: {
    phOptimal: { min: 6.0, max: 7.5 },
    nitrogenTotalPct: 0.10,
    phosphorusBray1Ppm: 12.0,
    potassiumK_cmol: 0.30,
    calciumCa_cmol: 3.5,
    magnesiumMg_cmol: 1.2,
    sulfurPpm: 8.0,
    zincPpm: 1.2,
    boronPpm: 0.3,
    maxAcidSaturationPct: 25.0
  },
  COWPEA: {
    phOptimal: { min: 6.0, max: 6.8 },
    nitrogenTotalPct: 0.08, // Nitrogen fixing legume, lower N requirement
    phosphorusBray1Ppm: 22.0, // High phosphorus requirement for nodulation
    potassiumK_cmol: 0.35,
    calciumCa_cmol: 4.0,
    magnesiumMg_cmol: 1.5,
    sulfurPpm: 11.0,
    zincPpm: 1.6,
    boronPpm: 0.5,
    maxAcidSaturationPct: 15.0
  },
  PEPPER: {
    phOptimal: { min: 6.0, max: 6.8 },
    nitrogenTotalPct: 0.14,
    phosphorusBray1Ppm: 22.0,
    potassiumK_cmol: 0.50,
    calciumCa_cmol: 5.0,
    magnesiumMg_cmol: 1.8,
    sulfurPpm: 12.0,
    zincPpm: 1.8,
    boronPpm: 0.5,
    maxAcidSaturationPct: 15.0
  },
  OIL_PALM: {
    phOptimal: { min: 5.0, max: 6.5 },
    nitrogenTotalPct: 0.12,
    phosphorusBray1Ppm: 15.0,
    potassiumK_cmol: 0.45,
    calciumCa_cmol: 3.5,
    magnesiumMg_cmol: 1.5,
    sulfurPpm: 9.0,
    zincPpm: 1.5,
    boronPpm: 0.6,
    maxAcidSaturationPct: 30.0
  }
});

class SoilChemistryEvaluationEngine {
  /**
   * Resolves crop optimal nutrient threshold standards
   * 
   * @param {string} crop - Target agricultural crop
   * @returns {Object} Optimal chemical threshold values
   */
  static getCropThresholds(crop = 'TOMATO') {
    const key = (crop || 'TOMATO').toUpperCase().trim().replace(/[\s\-]/g, '_');
    return CROP_OPTIMAL_NUTRIENT_THRESHOLDS[key] || CROP_OPTIMAL_NUTRIENT_THRESHOLDS.TOMATO;
  }

  /**
   * Evaluates soil fertility status, Liebig limiting factors, and liming needs
   * 
   * @param {Object} soilData - Soil chemistry and physical parameters
   * @param {string} crop - Target agricultural commodity
   * @returns {Object} Comprehensive diagnostic evaluation report
   */
  static evaluateSoilFertility(arg1 = {}, arg2 = 'TOMATO') {
    let soilData = arg1;
    let crop = arg2;

    // Handle polymorphic call: evaluateSoilFertility(crop, soilData)
    if (typeof arg1 === 'string' && typeof arg2 === 'object') {
      crop = arg1;
      soilData = arg2 || {};
    }

    const thresholds = this.getCropThresholds(crop);

    const ph = Math.min(10.5, Math.max(3.0, Number(soilData.phWater) || 6.2));
    const totalN = Math.max(0, Number(soilData.totalNitrogenPct) || 0.10);
    const brayP = Math.max(0, Number(soilData.availablePhosphorusBray1MgPerKg ?? soilData.phosphorusBray1Ppm) || 12.0);
    const cations = soilData.exchangeableCations || {};
    const ca = Math.max(0, Number(cations.calciumCa ?? soilData.exchangeableCalciumCa) || 3.5);
    const mg = Math.max(0, Number(cations.magnesiumMg ?? soilData.exchangeableMagnesiumMg) || 1.2);
    const k = Math.max(0, Number(cations.potassiumK ?? soilData.exchangeablePotassiumK) || 0.35);
    const na = Math.max(0, Number(cations.sodiumNa ?? soilData.exchangeableSodiumNa) || 0.05);
    const exAcidity = Math.max(0, Number(soilData.exchangeableAcidityAlPlusH) || 0.15);

    const micronutrients = soilData.micronutrientsPpm || {};
    const s = Math.max(0, Number(micronutrients.sulfurS ?? soilData.sulfateSulfurMgPerKg ?? soilData.sulfurPpm) || 8.0);
    const zn = Math.max(0, Number(micronutrients.zincZn ?? soilData.zincPpm) || 1.4);
    const b = Math.max(0, Number(micronutrients.boronB ?? soilData.boronPpm) || 0.4);

    // 1. Cation Exchange & Base Saturation
    const sumBases = ca + mg + k + na;
    const ecec = Number((sumBases + exAcidity).toFixed(2));
    const baseSaturationPct = ecec > 0 ? Number(((sumBases / ecec) * 100).toFixed(1)) : 0;
    const acidSaturationPct = ecec > 0 ? Number(((exAcidity / ecec) * 100).toFixed(1)) : 0;

    // 2. Liebig's Law of the Minimum Ratios (Measured / Optimal)
    const nutrientRatios = [
      { nutrient: 'NITROGEN', symbol: 'N', measured: totalN, optimal: thresholds.nitrogenTotalPct, unit: '%', ratio: totalN / thresholds.nitrogenTotalPct },
      { nutrient: 'PHOSPHORUS', symbol: 'P2O5', measured: brayP, optimal: thresholds.phosphorusBray1Ppm, unit: 'mg/kg (ppm)', ratio: brayP / thresholds.phosphorusBray1Ppm },
      { nutrient: 'POTASSIUM', symbol: 'K2O', measured: k, optimal: thresholds.potassiumK_cmol, unit: 'cmol/kg', ratio: k / thresholds.potassiumK_cmol },
      { nutrient: 'CALCIUM', symbol: 'Ca', measured: ca, optimal: thresholds.calciumCa_cmol, unit: 'cmol/kg', ratio: ca / thresholds.calciumCa_cmol },
      { nutrient: 'MAGNESIUM', symbol: 'Mg', measured: mg, optimal: thresholds.magnesiumMg_cmol, unit: 'cmol/kg', ratio: mg / thresholds.magnesiumMg_cmol },
      { nutrient: 'SULFUR', symbol: 'S', measured: s, optimal: thresholds.sulfurPpm, unit: 'mg/kg', ratio: s / thresholds.sulfurPpm },
      { nutrient: 'ZINC', symbol: 'Zn', measured: zn, optimal: thresholds.zincPpm, unit: 'mg/kg', ratio: zn / thresholds.zincPpm },
      { nutrient: 'BORON', symbol: 'B', measured: b, optimal: thresholds.boronPpm, unit: 'mg/kg', ratio: b / thresholds.boronPpm }
    ];

    nutrientRatios.forEach((nr) => {
      nr.ratio = Number(nr.ratio.toFixed(2));
      nr.satisfactionPct = Math.min(150, Math.round(nr.ratio * 100));
      if (nr.ratio < 0.60) nr.status = 'DEFICIT_CRITICAL';
      else if (nr.ratio < 0.85) nr.status = 'DEFICIT_MODERATE';
      else if (nr.ratio <= 1.30) nr.status = 'OPTIMAL_BALANCED';
      else nr.status = 'SURPLUS_HIGH';
    });

    // Primary Limiting Factor (Liebig's Minimum)
    const sortedByRatio = [...nutrientRatios].sort((a, b) => a.ratio - b.ratio);
    const liebigLimitingNutrient = sortedByRatio[0];

    // 3. Overall Soil Fertility Index (0 - 100)
    // Weighted: N (25%), P (25%), K (25%), Bases/Micros (25%)
    const sfiRaw = (
      (Math.min(1.0, nutrientRatios[0].ratio) * 25) +
      (Math.min(1.0, nutrientRatios[1].ratio) * 25) +
      (Math.min(1.0, nutrientRatios[2].ratio) * 25) +
      (Math.min(1.0, (nutrientRatios[3].ratio + nutrientRatios[4].ratio + nutrientRatios[6].ratio) / 3) * 25)
    );
    const soilFertilityIndex = Math.min(100, Math.max(10, Math.round(sfiRaw)));

    let fertilityTier = 'MODERATE_FERTILITY';
    if (soilFertilityIndex >= 85) fertilityTier = 'EXCELLENT_HIGH_YIELD';
    else if (soilFertilityIndex >= 70) fertilityTier = 'GOOD_ADEQUATE';
    else if (soilFertilityIndex >= 45) fertilityTier = 'MODERATE_FERTILITY';
    else fertilityTier = 'DEGRADED_CRITICAL_INTERVENTION';

    // 4. Aluminum Toxicity & Acidity Warning
    const aluminumToxicityRisk = acidSaturationPct > thresholds.maxAcidSaturationPct;

    // 5. Adams-Evans Liming Calculation
    let requiresLiming = false;
    let recommendedMaterial = 'NONE';
    let recommendedLimeKgPerHa = 0;
    let limingAdvisory = 'Soil pH is within the agronomically optimal range for this crop.';

    if (ph < thresholds.phOptimal.min || aluminumToxicityRisk) {
      requiresLiming = true;
      recommendedMaterial = mg < 1.0 ? 'DOLOMITIC_LIMESTONE' : 'CALCITIC_LIMESTONE';
      
      // Target pH is upper mid of optimal range (e.g. 6.2)
      const targetPh = (thresholds.phOptimal.min + thresholds.phOptimal.max) / 2;
      const deltaPh = Math.max(0.2, targetPh - ph);
      
      // Lime requirement formula (kg/ha): deltaPh * ECEC * 350
      const calcLime = Math.round(deltaPh * ecec * 350);
      recommendedLimeKgPerHa = Math.min(4500, Math.max(400, calcLime));
      
      limingAdvisory = `🚨 ACIDITY ALERT: Soil pH (${ph}) is below optimal (${thresholds.phOptimal.min}). Acid saturation is ${acidSaturationPct}%. Apply ${recommendedLimeKgPerHa.toLocaleString()} kg/ha of ${recommendedMaterial.replace(/_/g, ' ')} at least 3 weeks prior to planting.`;
    } else if (ph > thresholds.phOptimal.max && ph >= 7.8) {
      requiresLiming = true;
      recommendedMaterial = 'ELEMENTAL_SULFUR';
      recommendedLimeKgPerHa = Math.round((ph - 7.2) * 350);
      limingAdvisory = `⚠️ ALKALINITY ALERT: Soil pH (${ph}) promotes micronutrient (Fe/Zn) lockout. Apply ${recommendedLimeKgPerHa} kg/ha of Agricultural Elemental Sulfur to reduce pH towards neutrality.`;
    }

    return {
      crop: crop.toUpperCase(),
      soilFertilityIndex,
      fertilityTier,
      phStatus: {
        measuredPh: ph,
        optimalRange: thresholds.phOptimal,
        isOptimal: ph >= thresholds.phOptimal.min && ph <= thresholds.phOptimal.max,
        acidSaturationPct,
        aluminumToxicityRisk
      },
      cationExchange: {
        effectiveCec: ecec,
        baseSaturationPct,
        exchangeableCations: { ca, mg, k, na, exAcidity }
      },
      liebigLimitingNutrient: {
        nutrient: liebigLimitingNutrient.nutrient,
        symbol: liebigLimitingNutrient.symbol,
        measured: liebigLimitingNutrient.measured,
        optimal: liebigLimitingNutrient.optimal,
        unit: liebigLimitingNutrient.unit,
        satisfactionPct: liebigLimitingNutrient.satisfactionPct,
        advisory: `Under Liebig's Law of the Minimum, crop yield will be limited primarily by ${liebigLimitingNutrient.nutrient} (${liebigLimitingNutrient.satisfactionPct}% of optimal capacity).`
      },
      nutrientSatisfactionBreakdown: nutrientRatios,
      limingRecommendation: {
        requiresLiming,
        recommendedMaterial,
        recommendedDoseKgPerHa: recommendedLimeKgPerHa,
        recommendedDoseTonsPerHa: Number((recommendedLimeKgPerHa / 1000).toFixed(2)),
        advisory: limingAdvisory
      }
    };
  }
}

module.exports = {
  SoilChemistryEvaluationEngine,
  CROP_OPTIMAL_NUTRIENT_THRESHOLDS
};
