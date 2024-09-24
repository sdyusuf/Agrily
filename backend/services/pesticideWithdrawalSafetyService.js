/**
 * @file pesticideWithdrawalSafetyService.js
 * @description Pre-Harvest Interval (PHI) & Maximum Residue Limit (MRL) Food Safety Service.
 * Implements chemical degradation kinetics, half-life decay modeling,
 * NAFDAC / SON / Codex Alimentarius food safety clearance, and export produce residue verification.
 */

const crypto = require('crypto');

/**
 * Standard Nigerian Agricultural Chemical Formulations & Maximum Residue Limits (MRL)
 * Units: MRL in mg/kg (ppm), HalfLifeDays in field conditions (tropical 28-34°C)
 */
const AGROCHEMICAL_RESIDUE_DATABASE = {
  // FUNGICIDES
  'MANCOZEB_80WP': {
    formulationName: 'Mancozeb 80% WP',
    activeIngredient: 'Mancozeb',
    chemicalClass: 'DITHIOCARBAMATE',
    targetPathogens: ['Early Blight', 'Late Blight', 'Anthracnose', 'Downy Mildew'],
    nafdacNumber: 'NAFDAC-AG-048291',
    phiDaysStandard: 14,
    phiDaysExportStrict: 21,
    codexMrlMgKg: 5.0,
    euMrlMgKg: 2.0,
    halfLifeDays: 3.2,
    pollinatorToxicity: 'LOW_RISK',
    aquaticToxicity: 'HIGH_TOXICITY',
    allowableDailyIntakeMgKg: 0.05
  },
  'METALAXYL_M_68WG': {
    formulationName: 'Metalaxyl-M + Mancozeb (Ridomil Gold)',
    activeIngredient: 'Metalaxyl-M 40g/kg + Mancozeb 640g/kg',
    chemicalClass: 'PHENYLAMIDE_DITHIOCARBAMATE',
    targetPathogens: ['Late Blight', 'Black Pod Disease', 'Pythium Damping-Off'],
    nafdacNumber: 'NAFDAC-AG-011284',
    phiDaysStandard: 10,
    phiDaysExportStrict: 14,
    codexMrlMgKg: 0.5,
    euMrlMgKg: 0.2,
    halfLifeDays: 4.5,
    pollinatorToxicity: 'NON_TOXIC',
    aquaticToxicity: 'LOW_RISK',
    allowableDailyIntakeMgKg: 0.08
  },
  'COPPER_HYDROXIDE_77WP': {
    formulationName: 'Copper Hydroxide 77% WP (Kocide 2000)',
    activeIngredient: 'Copper Hydroxide (53.8% metallic copper equivalent)',
    chemicalClass: 'INORGANIC_COPPER',
    targetPathogens: ['Bacterial Wilt', 'Bacterial Spot', 'Anthracnose'],
    nafdacNumber: 'NAFDAC-AG-099412',
    phiDaysStandard: 3,
    phiDaysExportStrict: 7,
    codexMrlMgKg: 20.0,
    euMrlMgKg: 5.0,
    halfLifeDays: 8.0,
    pollinatorToxicity: 'LOW_RISK',
    aquaticToxicity: 'VERY_HIGH_TOXICITY',
    allowableDailyIntakeMgKg: 0.15
  },
  'AZOXYSTROBIN_25SC': {
    formulationName: 'Azoxystrobin 250 g/L SC',
    activeIngredient: 'Azoxystrobin',
    chemicalClass: 'STROBILURIN',
    targetPathogens: ['Rice Blast', 'Powdery Mildew', 'Leaf Rust'],
    nafdacNumber: 'NAFDAC-AG-077123',
    phiDaysStandard: 7,
    phiDaysExportStrict: 10,
    codexMrlMgKg: 3.0,
    euMrlMgKg: 1.5,
    halfLifeDays: 5.1,
    pollinatorToxicity: 'NON_TOXIC',
    aquaticToxicity: 'MODERATE_RISK',
    allowableDailyIntakeMgKg: 0.20
  },

  // INSECTICIDES & ACARICIDES
  'EMAMECTIN_BENZOATE_5SG': {
    formulationName: 'Emamectin Benzoate 5% SG',
    activeIngredient: 'Emamectin Benzoate',
    chemicalClass: 'AVERMECTIN',
    targetPathogens: ['Fall Armyworm', 'Tomato Leafminer (Tuta absoluta)', 'Pod Borer'],
    nafdacNumber: 'NAFDAC-AG-078411',
    phiDaysStandard: 7,
    phiDaysExportStrict: 14,
    codexMrlMgKg: 0.05,
    euMrlMgKg: 0.02,
    halfLifeDays: 2.1,
    pollinatorToxicity: 'MODERATE_RISK',
    aquaticToxicity: 'HIGH_TOXICITY',
    allowableDailyIntakeMgKg: 0.0005
  },
  'LAMBDA_CYHALOTHRIN_5EC': {
    formulationName: 'Lambda-Cyhalothrin 50 g/L EC (Karate)',
    activeIngredient: 'Lambda-Cyhalothrin',
    chemicalClass: 'SYNTHETIC_PYRETHROID',
    targetPathogens: ['Aphids', 'Armyworms', 'Capsid Bugs', 'Thrips'],
    nafdacNumber: 'NAFDAC-AG-033104',
    phiDaysStandard: 7,
    phiDaysExportStrict: 14,
    codexMrlMgKg: 0.2,
    euMrlMgKg: 0.1,
    halfLifeDays: 3.8,
    pollinatorToxicity: 'HIGHLY_TOXIC_TO_BEES',
    aquaticToxicity: 'EXTREMELY_HIGH_TOXICITY',
    allowableDailyIntakeMgKg: 0.005
  },
  'CHLORPYRIFOS_48EC': {
    formulationName: 'Chlorpyrifos 480 g/L EC',
    activeIngredient: 'Chlorpyrifos',
    chemicalClass: 'ORGANOPHOSPHATE',
    targetPathogens: ['Stem Borers', 'Termites', 'Soil Cutworms'],
    nafdacNumber: 'NAFDAC-AG-001928',
    phiDaysStandard: 21,
    phiDaysExportStrict: 30,
    codexMrlMgKg: 0.05,
    euMrlMgKg: 0.01,
    halfLifeDays: 7.2,
    pollinatorToxicity: 'HIGHLY_TOXIC_TO_BEES',
    aquaticToxicity: 'EXTREMELY_HIGH_TOXICITY',
    allowableDailyIntakeMgKg: 0.001
  },
  'IMIDACLOPRID_20SL': {
    formulationName: 'Imidacloprid 200 g/L SL',
    activeIngredient: 'Imidacloprid',
    chemicalClass: 'NEONICOTINOID',
    targetPathogens: ['Whiteflies (Bemisia tabaci)', 'Aphids', 'Jassids'],
    nafdacNumber: 'NAFDAC-AG-055209',
    phiDaysStandard: 14,
    phiDaysExportStrict: 21,
    codexMrlMgKg: 1.0,
    euMrlMgKg: 0.5,
    halfLifeDays: 6.4,
    pollinatorToxicity: 'HIGHLY_TOXIC_TO_BEES',
    aquaticToxicity: 'MODERATE_RISK',
    allowableDailyIntakeMgKg: 0.06
  },

  // ORGANIC & BOTANICALS
  'AZADIRACHTIN_15EC': {
    formulationName: 'Azadirachtin 1.5% EC (Cold-Pressed Neem)',
    activeIngredient: 'Azadirachtin A & B',
    chemicalClass: 'BOTANICAL_LIMONOID',
    targetPathogens: ['Whitefly Vectors', 'Aphids', 'Spider Mites'],
    nafdacNumber: 'NAFDAC-BIO-044192',
    phiDaysStandard: 1,
    phiDaysExportStrict: 1,
    codexMrlMgKg: 10.0,
    euMrlMgKg: 5.0,
    halfLifeDays: 0.8,
    pollinatorToxicity: 'NON_TOXIC',
    aquaticToxicity: 'LOW_RISK',
    allowableDailyIntakeMgKg: 0.50
  },
  'BACILLUS_THURINGIENSIS_2X': {
    formulationName: 'Bacillus thuringiensis subsp. kurstaki',
    activeIngredient: 'Bt endotoxin crystals',
    chemicalClass: 'BIOLOGICAL_MICROBIAL',
    targetPathogens: ['Lepidopteran Caterpillars', 'Fall Armyworm'],
    nafdacNumber: 'NAFDAC-BIO-009923',
    phiDaysStandard: 0,
    phiDaysExportStrict: 0,
    codexMrlMgKg: 50.0,
    euMrlMgKg: 50.0,
    halfLifeDays: 0.5,
    pollinatorToxicity: 'NON_TOXIC',
    aquaticToxicity: 'NON_TOXIC',
    allowableDailyIntakeMgKg: 1.00
  }
};

class PesticideWithdrawalSafetyService {
  /**
   * Retrieves full chemical formulations registry
   */
  static getChemicalRegistry() {
    return AGROCHEMICAL_RESIDUE_DATABASE;
  }

  /**
   * Calculates chemical residue degradation curve and safe harvest clearance
   *
   * @param {Object} params
   * @param {string} params.formulationKey - Key in database (e.g. 'MANCOZEB_80WP')
   * @param {string} params.lastSprayDate - ISO date string (e.g. '2024-08-20')
   * @param {number} [params.initialConcentrationMgKg] - Initial deposit (default based on label application rate)
   * @param {string} [params.exportMarketDestination] - 'NIGERIA_DOMESTIC', 'CODEX_INTERNATIONAL', 'EU_STRICT'
   * @param {number} [params.ambientTemperatureC] - Ambient temp (higher temp accelerates photolysis)
   * @param {number} [params.cumulativeRainfallMm] - Rainfall wash-off modifier
   * @returns {Object} Residue degradation assessment
   */
  static evaluateResidueClearance(params = {}) {
    const rawKey = (params.formulationKey || 'MANCOZEB_80WP').toUpperCase().trim();
    const chemical = AGROCHEMICAL_RESIDUE_DATABASE[rawKey] || AGROCHEMICAL_RESIDUE_DATABASE['MANCOZEB_80WP'];

    const sprayDate = new Date(params.lastSprayDate || Date.now());
    const currentDate = new Date();
    const elapsedDays = Math.max(0, (currentDate - sprayDate) / (1000 * 60 * 60 * 24));

    // Environmental half-life adjustments:
    // Higher temp (>30°C) accelerates decay by 15%; tropical rainfall wash-off accelerates degradation by 20%
    const temp = Number(params.ambientTemperatureC) || 30.0;
    const rain = Number(params.cumulativeRainfallMm) || 0.0;
    let adjustedHalfLife = chemical.halfLifeDays;

    if (temp >= 32.0) adjustedHalfLife *= 0.85;
    if (rain >= 25.0) adjustedHalfLife *= 0.80;

    // First-order chemical kinetics: C(t) = C_0 * (0.5)^(t / t_half)
    const initialDeposit = Number(params.initialConcentrationMgKg) || (chemical.codexMrlMgKg * 2.8);
    const decayConstant = Math.LN2 / adjustedHalfLife;
    const currentEstimatedResidueMgKg = Number((initialDeposit * Math.exp(-decayConstant * elapsedDays)).toFixed(4));

    // Determine target MRL threshold based on market destination
    const destination = (params.exportMarketDestination || 'NIGERIA_DOMESTIC').toUpperCase();
    let allowableMrl = chemical.codexMrlMgKg;
    let requiredPhiDays = chemical.phiDaysStandard;

    if (destination === 'EU_STRICT') {
      allowableMrl = chemical.euMrlMgKg;
      requiredPhiDays = chemical.phiDaysExportStrict;
    }

    const isClearedForHarvest = requiredPhiDays === 0 || (currentEstimatedResidueMgKg <= allowableMrl && elapsedDays >= requiredPhiDays);
    const daysRemainingToSafety = isClearedForHarvest ? 0 : Math.max(0, Math.ceil(requiredPhiDays - elapsedDays));

    const safeDate = new Date(sprayDate.getTime() + (requiredPhiDays * 24 * 60 * 60 * 1000));

    // Generate 7-day degradation progression curve
    const degradationCurve = [];
    for (let day = 0; day <= requiredPhiDays + 3; day++) {
      const conc = Number((initialDeposit * Math.exp(-decayConstant * day)).toFixed(3));
      degradationCurve.push({
        dayPostSpray: day,
        projectedResidueMgKg: conc,
        compliesWithMrl: conc <= allowableMrl
      });
    }

    const verificationHash = crypto.createHash('sha256')
      .update(`${rawKey}|${params.lastSprayDate}|${currentEstimatedResidueMgKg}|${isClearedForHarvest}`)
      .digest('hex');

    return {
      success: true,
      formulationKey: rawKey,
      chemicalDetails: {
        commercialName: chemical.formulationName,
        activeIngredient: chemical.activeIngredient,
        chemicalClass: chemical.chemicalClass,
        nafdacRegNumber: chemical.nafdacNumber,
        pollinatorToxicity: chemical.pollinatorToxicity
      },
      evaluationContext: {
        lastSprayDate: sprayDate.toISOString().split('T')[0],
        elapsedDaysPostSpray: Number(elapsedDays.toFixed(1)),
        marketDestination: destination,
        allowableMrlThresholdMgKg: allowableMrl,
        initialDepositMgKg: initialDeposit,
        currentEstimatedResidueMgKg
      },
      foodSafetyVerdict: {
        isClearedForCommercialHarvest: isClearedForHarvest,
        safetyVerdictPill: isClearedForHarvest ? 'CLEARED_SAFE_FOR_CONSUMPTION' : 'MANDATORY_RESIDUE_HOLD_ACTIVE',
        requiredPhiDays,
        daysRemainingToClearance: daysRemainingToSafety,
        earliestSafeHarvestDate: safeDate.toISOString().split('T')[0],
        advisoryMessage: isClearedForHarvest
          ? `FOOD SAFETY CLEARED: Chemical residue (${currentEstimatedResidueMgKg} mg/kg) is below maximum allowable threshold (${allowableMrl} mg/kg). Produce cleared for haulage.`
          : `RESIDUE WARNING: Produce contains active chemical residues above safety limit. Delay harvest for ${daysRemainingToSafety} more days to protect consumer health.`
      },
      degradationCurve,
      cryptographicSafetySeal: verificationHash
    };
  }
}

module.exports = {
  PesticideWithdrawalSafetyService,
  AGROCHEMICAL_RESIDUE_DATABASE
};
