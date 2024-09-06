/**
 * @file soilAgroChemicalRecommenderService.js
 * @description Soil Nutrition & Agro-Chemical Tank Compatibility Advisory Service.
 * Evaluates soil NPK nutrient telemetry, foliar micronutrient deficits,
 * agrochemical tank-mixing physical compatibility, and tropical water spray pH conditioning.
 */

const crypto = require('crypto');

/**
 * Standard Soil & Agro-Ecological Compatibility Knowledge Base
 */
const TROPICAL_CROP_NUTRIENT_PROFILES = {
  TOMATO: {
    optimalSoilPh: { min: 6.0, max: 6.8 },
    targetNpkRatio: '1:2:2',
    criticalMicronutrients: ['CALCIUM', 'BORON', 'ZINC'],
    deficiencySymptoms: {
      CALCIUM: 'Blossom End Rot (BER) of developing fruit, blackened necrotic distal fruit tissue',
      BORON: 'Brittle hollow stems, deformed growing tips, poor flower fertilization',
      ZINC: 'Little-leaf syndrome, interveinal foliar chlorosis with reduced internode length'
    }
  },
  CASSAVA: {
    optimalSoilPh: { min: 5.5, max: 6.5 },
    targetNpkRatio: '2:1:3',
    criticalMicronutrients: ['POTASSIUM', 'ZINC', 'MAGNESIUM'],
    deficiencySymptoms: {
      POTASSIUM: 'Poor starch accumulation in storage roots, marginal foliar necrosis and lodging',
      ZINC: 'Pale chlorotic blotches on young leaves in acidic savanna soils'
    }
  },
  MAIZE: {
    optimalSoilPh: { min: 5.8, max: 7.0 },
    targetNpkRatio: '3:1:2',
    criticalMicronutrients: ['NITROGEN', 'ZINC', 'SULFUR'],
    deficiencySymptoms: {
      NITROGEN: 'V-shaped chlorosis beginning at leaf tip and progressing down midrib',
      ZINC: 'Broad white or yellow bands between midrib and margins of young leaves'
    }
  },
  COCOA: {
    optimalSoilPh: { min: 6.0, max: 7.5 },
    targetNpkRatio: '1:1:2',
    criticalMicronutrients: ['ZINC', 'BORON', 'IRON'],
    deficiencySymptoms: {
      ZINC: 'Sickle leaf deformity and rosette apical growth',
      BORON: 'Chupon dieback and irregular bean shape inside pods'
    }
  }
};

/**
 * Agrochemical Tank-Mixing Compatibility Matrix
 */
const TANK_MIX_COMPATIBILITY_RULES = [
  {
    productA: 'COPPER_HYDROXIDE',
    productB: 'ORGANIC_PHOSPHATES',
    compatible: false,
    riskLevel: 'HIGH_PHYTOTOXICITY_RISK',
    warning: 'DO NOT TANK MIX: Fixed copper react with acidic phosphates, causing insoluble precipitate curdling and severe leaf burn.'
  },
  {
    productA: 'MANCOZEB_WP',
    productB: 'FOLIA_ZINC_CHELATE',
    compatible: true,
    riskLevel: 'SYNERGISTIC_COMPATIBLE',
    warning: 'SYNERGISTIC: Mancozeb contains zinc and manganese moieties; combining with chelated zinc enhances foliar disease resistance.'
  },
  {
    productA: 'EMAMECTIN_BENZOATE',
    productB: 'BACILLUS_THURINGIENSIS',
    compatible: true,
    riskLevel: 'BIO_ENHANCED_COMPATIBLE',
    warning: 'DUAL-ACTION: Low-dose emamectin paired with Bt microbial inoculant accelerates Fall Armyworm mortality without cross-resistance.'
  },
  {
    productA: 'AZADIRACHTIN_NEEM',
    productB: 'ALKALINE_LIME_SULFUR',
    compatible: false,
    riskLevel: 'RAPID_DEGRADATION_RISK',
    warning: 'INCOMPATIBLE: High pH alkaline solutions rapidly hydrolyze azadirachtin, destroying insecticidal efficacy within 30 minutes.'
  }
];

class SoilAgroChemicalRecommenderService {
  /**
   * Evaluates soil telemetry and advises on corrective micronutrient amendments
   *
   * @param {Object} soilTelemetry
   * @param {string} cropType
   * @returns {Object} Nutrition evaluation
   */
  static evaluateSoilNutrition(soilTelemetry = {}, cropType = 'TOMATO') {
    const rawCrop = cropType.toUpperCase().trim();
    const profile = TROPICAL_CROP_NUTRIENT_PROFILES[rawCrop] || TROPICAL_CROP_NUTRIENT_PROFILES.TOMATO;

    const measuredPh = Number(soilTelemetry.soilPh) || 6.2;
    const isPhAcidic = measuredPh < profile.optimalSoilPh.min;
    const isPhAlkaline = measuredPh > profile.optimalSoilPh.max;
    const isPhOptimal = !isPhAcidic && !isPhAlkaline;

    const recommendations = [];

    if (isPhAcidic) {
      recommendations.push({
        action: 'APPLY_AGRICULTURAL_DOLOMITIC_LIME',
        targetDosageKgPerHa: 500,
        rationale: `Soil pH (${measuredPh}) is below optimal ${profile.optimalSoilPh.min}. Dolomitic limestone elevates pH while replenishing essential calcium and magnesium.`
      });
    } else if (isPhAlkaline) {
      recommendations.push({
        action: 'APPLY_ELEMENTAL_SULFUR_OR_AMMONIUM_SULFATE',
        targetDosageKgPerHa: 200,
        rationale: `Soil pH (${measuredPh}) is above optimal ${profile.optimalSoilPh.max}. Elemental sulfur reduces alkalinity to prevent iron and zinc lockout.`
      });
    }

    // Water spray pH conditioning
    const rawWaterPh = Number(soilTelemetry.sprayWaterPh) || 7.8; // Common alkaline borehole water in Northern belts
    const requiresWaterConditioning = rawWaterPh > 6.8;

    return {
      success: true,
      cropType: rawCrop,
      soilTelemetry: {
        measuredPh,
        phStatus: isPhOptimal ? 'OPTIMAL' : (isPhAcidic ? 'ACIDIC_NUTRIENT_LOCKOUT' : 'ALKALINE_DEFICIENCY_RISK'),
        optimalRange: profile.optimalSoilPh,
        targetNpkRatio: profile.targetNpkRatio
      },
      sprayWaterTelemetry: {
        rawWaterPh,
        requiresAcidifyingBuffer: requiresWaterConditioning,
        recommendedSprayPhRange: { min: 5.5, max: 6.5 },
        bufferingAdvisory: requiresWaterConditioning
          ? 'Add 25ml Agricultural Citric Acid / Phosphoric Acid buffer per 200L water prior to chemical addition to prevent alkaline hydrolysis.'
          : 'Water pH is optimal for chemical foliar dissolution.'
      },
      micronutrientAdvisory: profile.criticalMicronutrients.map(nutrient => ({
        nutrient,
        symptomIfDeficient: profile.deficiencySymptoms[nutrient] || 'General vigor deficit'
      })),
      correctiveActions: recommendations
    };
  }

  /**
   * Verifies physical and chemical compatibility of two tank-mix products
   *
   * @param {string} productA
   * @param {string} productB
   * @returns {Object} Compatibility assessment
   */
  static verifyTankMixCompatibility(productA, productB) {
    const rawA = (productA || '').toUpperCase().trim();
    const rawB = (productB || '').toUpperCase().trim();

    const rule = TANK_MIX_COMPATIBILITY_RULES.find(r =>
      (r.productA === rawA && r.productB === rawB) ||
      (r.productA === rawB && r.productB === rawA)
    );

    if (rule) {
      return {
        productA: rawA,
        productB: rawB,
        compatible: rule.compatible,
        riskLevel: rule.riskLevel,
        advisory: rule.warning,
        jarTestMandatory: !rule.compatible
      };
    }

    return {
      productA: rawA,
      productB: rawB,
      compatible: true,
      riskLevel: 'STANDARD_CAUTION',
      advisory: 'No known severe chemical antagonism reported. Conduct a 500ml jar slurry test 15 minutes before knapsack filling.',
      jarTestMandatory: true
    };
  }
}

module.exports = {
  SoilAgroChemicalRecommenderService,
  TROPICAL_CROP_NUTRIENT_PROFILES,
  TANK_MIX_COMPATIBILITY_RULES
};
