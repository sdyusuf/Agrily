/**
 * ==============================================================================
 * AGRILY AGRONOMY VISION - AGROCHEMICAL RESISTANCE RISK & ROTATION ENGINE
 * ==============================================================================
 * 
 * Architecture Overview:
 * Implements global standard guidelines from the Fungicide Resistance Action
 * Committee (FRAC) and Insecticide Resistance Action Committee (IRAC) adapted
 * for Nigerian tropical farming ecologies.
 * 
 * Key Epidemiological Functions:
 * 1. Mode of Action (MoA) Code Mapping (Single-Site vs Multi-Site Protectants).
 * 2. Consecutive Application Risk Scoring:
 *    R_{risk} = \min(100, \sum_{i=1}^{k} C_{MoA} \cdot 25 \cdot (1 - \delta_{rot}))
 * 3. Mandatory MoA Rotation Scheduling:
 *    Enforces rotation after maximum consecutive applications (e.g., FRAC 11 QoI max 2).
 * 4. Synergistic Tank-Mix Pairings (e.g., mixing FRAC 4 systemic with FRAC M2 copper).
 * 
 * @module services/agrochemicalResistanceRiskEngine
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 */

'use strict';

/**
 * Standard FRAC & IRAC Chemical Classification Database
 */
const AGROCHEMICAL_CLASSIFICATIONS = Object.freeze({
  MANCOZEB: {
    tradeNames: ['Dithane M-45', 'Penncozeb'],
    type: 'FUNGICIDE',
    fracCode: 'M03',
    groupName: 'Dithiocarbamates',
    modeOfAction: 'Multi-site contact activity',
    resistanceRisk: 'LOW',
    maxConsecutiveSprays: 4,
    recommendedPartnerFrac: ['FRAC 4', 'FRAC 11']
  },
  COPPER_HYDROXIDE: {
    tradeNames: ['Kocide 2000', 'Champ DP'],
    type: 'BACTERICIDE_FUNGICIDE',
    fracCode: 'M01',
    groupName: 'Inorganic Copper',
    modeOfAction: 'Multi-site cell wall disruptor',
    resistanceRisk: 'LOW',
    maxConsecutiveSprays: 5,
    recommendedPartnerFrac: ['FRAC 4', 'FRAC 3']
  },
  METALAXYL_MANCOZEB: {
    tradeNames: ['Ridomil Gold MZ', 'Agro-Metalaxyl'],
    type: 'FUNGICIDE',
    fracCode: '4 + M03',
    groupName: 'Phenylamides + Dithiocarbamate',
    modeOfAction: 'RNA polymerase I inhibitor + Multi-site protectant',
    resistanceRisk: 'MEDIUM_HIGH',
    maxConsecutiveSprays: 2,
    recommendedPartnerFrac: ['FRAC 11', 'FRAC 3', 'FRAC M01']
  },
  AZOXYSTROBIN: {
    tradeNames: ['Amistar', 'Heritage'],
    type: 'FUNGICIDE',
    fracCode: '11',
    groupName: 'QoI (Quinone Outside Inhibitor / Strobilurin)',
    modeOfAction: 'Mitochondrial respiration complex III inhibition',
    resistanceRisk: 'HIGH',
    maxConsecutiveSprays: 2,
    recommendedPartnerFrac: ['FRAC M03', 'FRAC 3']
  },
  DIFENOCONAZOLE: {
    tradeNames: ['Score 250 EC'],
    type: 'FUNGICIDE',
    fracCode: '3',
    groupName: 'DMI (Demethylation Inhibitor / Triazole)',
    modeOfAction: 'C14-demethylase sterol biosynthesis inhibition',
    resistanceRisk: 'MEDIUM',
    maxConsecutiveSprays: 2,
    recommendedPartnerFrac: ['FRAC M03', 'FRAC 11']
  },
  CHLOROTHALONIL: {
    tradeNames: ['Bravo 500', 'Daconil'],
    type: 'FUNGICIDE',
    fracCode: 'M05',
    groupName: 'Chloronitriles',
    modeOfAction: 'Multi-site glutathione conjugation',
    resistanceRisk: 'LOW',
    maxConsecutiveSprays: 4,
    recommendedPartnerFrac: ['FRAC 11', 'FRAC 3']
  },
  IMIDACLOPRID: {
    tradeNames: ['Confidor', 'Kohinor'],
    type: 'INSECTICIDE',
    fracCode: 'IRAC 4A',
    groupName: 'Neonicotinoids',
    modeOfAction: 'Nicotinic acetylcholine receptor (nAChR) competitive modulator',
    resistanceRisk: 'HIGH',
    maxConsecutiveSprays: 2,
    recommendedPartnerFrac: ['IRAC 3A', 'IRAC 1A', 'ORGANIC_BOTANICAL']
  },
  LAMBDA_CYHALOTHRIN: {
    tradeNames: ['Karate Zeon', 'Attack'],
    type: 'INSECTICIDE',
    fracCode: 'IRAC 3A',
    groupName: 'Pyrethroids',
    modeOfAction: 'Sodium channel modulator',
    resistanceRisk: 'HIGH',
    maxConsecutiveSprays: 2,
    recommendedPartnerFrac: ['IRAC 4A', 'ORGANIC_BOTANICAL']
  },
  EMAMECTIN_BENZOATE: {
    tradeNames: ['Proclaim 05 SG', 'Afrisect'],
    type: 'INSECTICIDE',
    fracCode: 'IRAC 6',
    groupName: 'Avermectins',
    modeOfAction: 'Glutamate-gated chloride channel (GluCl) allosteric modulator',
    resistanceRisk: 'MEDIUM',
    maxConsecutiveSprays: 2,
    recommendedPartnerFrac: ['IRAC 3A', 'ORGANIC_BOTANICAL']
  },
  NEEM_AZADIRACHTIN: {
    tradeNames: ['Neem Baan', 'Pure Cold-Pressed Neem Oil'],
    type: 'ORGANIC_BOTANICAL',
    fracCode: 'BIO-BOTANICAL',
    groupName: 'Limonoids & Botanical Terpenes',
    modeOfAction: 'Ecdysone receptor disruption & antifeedant repellent',
    resistanceRisk: 'NEGLIGIBLE',
    maxConsecutiveSprays: 8,
    recommendedPartnerFrac: ['ALL_CHEMICAL_CLASSES']
  }
});

class AgrochemicalResistanceRiskEngine {
  /**
   * Retrieves chemical classification metadata by common or active name
   * 
   * @param {string} chemicalName - Name of active substance or product
   * @returns {Object|null}
   */
  static getChemicalMetadata(chemicalName = '') {
    if (!chemicalName) return null;
    const clean = chemicalName.trim().toUpperCase().replace(/[\s\-_]/g, '_');

    for (const [key, val] of Object.entries(AGROCHEMICAL_CLASSIFICATIONS)) {
      if (key === clean || val.tradeNames.some((tn) => tn.toUpperCase().includes(clean))) {
        return { chemicalKey: key, ...val };
      }
    }

    // Keyword matching fallback
    if (clean.includes('MANCOZEB')) return { chemicalKey: 'MANCOZEB', ...AGROCHEMICAL_CLASSIFICATIONS.MANCOZEB };
    if (clean.includes('COPPER')) return { chemicalKey: 'COPPER_HYDROXIDE', ...AGROCHEMICAL_CLASSIFICATIONS.COPPER_HYDROXIDE };
    if (clean.includes('METALAXYL')) return { chemicalKey: 'METALAXYL_MANCOZEB', ...AGROCHEMICAL_CLASSIFICATIONS.METALAXYL_MANCOZEB };
    if (clean.includes('AZOXY') || clean.includes('AMISTAR')) return { chemicalKey: 'AZOXYSTROBIN', ...AGROCHEMICAL_CLASSIFICATIONS.AZOXYSTROBIN };
    if (clean.includes('DIFENO') || clean.includes('SCORE')) return { chemicalKey: 'DIFENOCONAZOLE', ...AGROCHEMICAL_CLASSIFICATIONS.DIFENOCONAZOLE };
    if (clean.includes('IMIDA') || clean.includes('CONFIDOR')) return { chemicalKey: 'IMIDACLOPRID', ...AGROCHEMICAL_CLASSIFICATIONS.IMIDACLOPRID };
    if (clean.includes('LAMBDA') || clean.includes('KARATE')) return { chemicalKey: 'LAMBDA_CYHALOTHRIN', ...AGROCHEMICAL_CLASSIFICATIONS.LAMBDA_CYHALOTHRIN };
    if (clean.includes('NEEM') || clean.includes('AZADIRACHT')) return { chemicalKey: 'NEEM_AZADIRACHTIN', ...AGROCHEMICAL_CLASSIFICATIONS.NEEM_AZADIRACHTIN };

    return null;
  }

  /**
   * Evaluates chemical application history and assesses resistance mutation risk
   * 
   * @param {Array<Object>} sprayHistory - Chronological array of previous spray events
   * @param {string} proposedChemical - Next planned chemical spray
   * @returns {Object} Comprehensive resistance risk report and rotation advice
   */
  static evaluateResistanceRisk({
    sprayHistory = [],
    proposedChemical = 'AZOXYSTROBIN',
    cropName = 'TOMATO',
    targetPathogen = 'Phytophthora infestans (Late Blight)'
  } = {}) {
    const proposedMeta = this.getChemicalMetadata(proposedChemical) || {
      chemicalKey: proposedChemical.toUpperCase(),
      type: 'FUNGICIDE',
      fracCode: 'UNKNOWN',
      groupName: 'Unclassified',
      modeOfAction: 'Single-site synthetic',
      resistanceRisk: 'MEDIUM_HIGH',
      maxConsecutiveSprays: 2,
      recommendedPartnerFrac: ['FRAC M03', 'FRAC M01']
    };

    let consecutiveSpraysOfSameMoA = 0;
    const historyLength = sprayHistory.length;

    // Scan backwards through history to find consecutive applications of same FRAC/IRAC code
    for (let i = historyLength - 1; i >= 0; i--) {
      const pastEvent = sprayHistory[i];
      const pastChemName = pastEvent.chemicalName || pastEvent.activeIngredient || '';
      const pastMeta = this.getChemicalMetadata(pastChemName);

      if (pastMeta && pastMeta.fracCode === proposedMeta.fracCode) {
        consecutiveSpraysOfSameMoA++;
      } else {
        break; // Streak broken by rotation
      }
    }

    const proposedConsecutiveCount = consecutiveSpraysOfSameMoA + 1;
    const maxAllowed = proposedMeta.maxConsecutiveSprays || 2;
    const isExceeded = proposedConsecutiveCount > maxAllowed;

    // Calculate Resistance Risk Score (0 - 100)
    let baseRiskScore = 15;
    if (proposedMeta.resistanceRisk === 'HIGH') baseRiskScore = 40;
    else if (proposedMeta.resistanceRisk === 'MEDIUM_HIGH') baseRiskScore = 30;
    else if (proposedMeta.resistanceRisk === 'MEDIUM') baseRiskScore = 20;
    else if (proposedMeta.resistanceRisk === 'LOW') baseRiskScore = 8;
    else if (proposedMeta.resistanceRisk === 'NEGLIGIBLE') baseRiskScore = 2;

    const streakMultiplier = 1.0 + (consecutiveSpraysOfSameMoA * 0.75);
    let riskScore = Math.min(100, Math.round(baseRiskScore * streakMultiplier));
    if (isExceeded) riskScore = Math.max(85, riskScore);

    let riskLevel = 'LOW';
    if (riskScore >= 75) riskLevel = 'CRITICAL_HIGH';
    else if (riskScore >= 50) riskLevel = 'ELEVATED';
    else if (riskScore >= 25) riskLevel = 'MODERATE';

    // Formulate Rotation Recommendations
    const rotationAlternatives = [];
    if (proposedMeta.type.includes('FUNGICIDE')) {
      if (proposedMeta.fracCode !== 'M03') {
        rotationAlternatives.push({
          chemical: 'Mancozeb 80% WP (Dithane M-45)',
          code: 'FRAC M03',
          rationale: 'Multi-site protectant contact fungicide resetting single-site resistance pressure.'
        });
      }
      if (proposedMeta.fracCode !== 'M01') {
        rotationAlternatives.push({
          chemical: 'Copper Hydroxide 53.8% (Kocide 2000)',
          code: 'FRAC M01',
          rationale: 'Inorganic multi-site protectant bactericide/fungicide with zero known resistance.'
        });
      }
      if (proposedMeta.fracCode !== 'BIO-BOTANICAL') {
        rotationAlternatives.push({
          chemical: 'Cold-Pressed Neem Oil 5ml/L + Garlic Extract',
          code: 'BIO-BOTANICAL',
          rationale: 'Organic botanical safe tank partner with zero chemical residues and PHI.'
        });
      }
    } else {
      rotationAlternatives.push({
        chemical: 'Cold-Pressed Neem Oil (Azadirachtin)',
        code: 'BIO-BOTANICAL',
        rationale: 'Natural antifeedant insect growth regulator preventing IRAC 4A/3A cross-resistance.'
      });
      rotationAlternatives.push({
        chemical: 'Emamectin Benzoate 5% SG',
        code: 'IRAC 6',
        rationale: 'Targeted nerve & muscle action from non-pyrethroid class.'
      });
    }

    return {
      cropName,
      targetPathogen,
      proposedChemical: proposedMeta.chemicalKey,
      chemicalMetadata: proposedMeta,
      consecutiveSpraysCount: proposedConsecutiveCount,
      maxPermittedConsecutiveSprays: maxAllowed,
      rotationMandatory: isExceeded,
      resistanceRiskScore: riskScore,
      resistanceRiskLevel: riskLevel,
      advisoryWarning: isExceeded
        ? `🚨 CRITICAL RESISTANCE ALERT: ${proposedConsecutiveCount} consecutive applications of ${proposedMeta.groupName} (${proposedMeta.fracCode}) exceeds FRAC maximum safe threshold (${maxAllowed}). Pathogen resistance mutation highly probable. Rotate active ingredient immediately.`
        : `✅ COMPLIANT: Application ${proposedConsecutiveCount} of ${maxAllowed} permitted consecutive sprays of ${proposedMeta.fracCode}. Follow next treatment with a multi-site partner.`,
      recommendedRotationPartners: rotationAlternatives,
      tankMixSynergyPartner: proposedMeta.recommendedPartnerFrac || ['FRAC M03']
    };
  }

  /**
   * Generates a season-long chemical rotation program for a specific crop and pathology
   * 
   * @param {string} crop - Crop name
   * @param {number} totalSeasonWeeks - Expected vegetative & reproductive period in weeks
   * @returns {Array<Object>} Weekly rotation schedule with alternating FRAC/IRAC groups
   */
  static buildSeasonalSpraySchedule(crop = 'TOMATO', totalSeasonWeeks = 10) {
    const weeks = Math.max(4, Math.min(20, Number(totalSeasonWeeks) || 10));
    const schedule = [];

    const rotationCycle = [
      { chemical: 'COPPER_HYDROXIDE', purpose: 'Early vegetative seedling protection', type: 'Preventative Contact' },
      { chemical: 'METALAXYL_MANCOZEB', purpose: 'Early blight/damping-off systemic knockdown', type: 'Curative Systemic' },
      { chemical: 'MANCOZEB', purpose: 'Canopy expansion multi-site cover', type: 'Protectant Multi-Site' },
      { chemical: 'NEEM_AZADIRACHTIN', purpose: 'Mid-vegetative vector suppression', type: 'Botanical Vector Control' },
      { chemical: 'AZOXYSTROBIN', purpose: 'Pre-flowering blast/anthracnose defense', type: 'Single-Site Systemic' },
      { chemical: 'CHLOROTHALONIL', purpose: 'Flowering protectant (zero residue hazard)', type: 'Protectant Multi-Site' },
      { chemical: 'DIFENOCONAZOLE', purpose: 'Fruit setting leaf spot control', type: 'Curative Systemic' },
      { chemical: 'NEEM_AZADIRACHTIN', purpose: 'Pre-harvest residue clearance period (PHI safe)', type: 'Organic Safe Harvest' }
    ];

    for (let w = 1; w <= weeks; w++) {
      const template = rotationCycle[(w - 1) % rotationCycle.length];
      const meta = this.getChemicalMetadata(template.chemical);

      schedule.push({
        week: w,
        crop,
        plannedChemical: template.chemical,
        tradeName: meta ? meta.tradeNames[0] : template.chemical,
        fracCode: meta ? meta.fracCode : 'UNCLASSIFIED',
        applicationType: template.type,
        strategicPurpose: template.purpose,
        estimatedPHIWithdrawalDays: meta && meta.type === 'ORGANIC_BOTANICAL' ? 0 : 7
      });
    }

    return schedule;
  }
}

module.exports = {
  AgrochemicalResistanceRiskEngine,
  AGROCHEMICAL_CLASSIFICATIONS
};
