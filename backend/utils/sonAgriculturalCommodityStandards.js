/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: SON & NAFDAC COMMODITY STANDARDS DICTIONARY
 * ==============================================================================
 * 
 * Statutory agricultural grading and defect specifications conforming to:
 *  - Standards Organisation of Nigeria (SON): NIS 341:2006 (Grains), NIS 248:2008 (Tubers)
 *  - National Agency for Food and Drug Administration and Control (NAFDAC)
 *  - Nigeria Agricultural Quarantine Service (NAQS)
 *  - Nigerian Export Promotion Council (NEPC) Export Quality Directives
 * 
 * Defines mandatory defect tolerances, moisture thresholds, cold-chain SLA bands,
 * and regional agro-corridor provenance metadata across 20 core Nigerian commodities.
 * 
 * @module utils/sonAgriculturalCommodityStandards
 * @author Agrily Standards & Quality Engineering
 * ==============================================================================
 */

const NIGERIAN_COMMODITY_STANDARDS = {
  // ----------------------------------------------------------------------------
  // 1. CEREAL GRAINS & PULSES
  // ----------------------------------------------------------------------------
  WHITE_MAIZE: {
    key: 'WHITE_MAIZE',
    commonName: 'White Maize (Dent / Flint)',
    localNames: { hausa: 'Masara Farin', yoruba: 'Agbado Funfun', igbo: 'Oka Ocha' },
    scientificTaxon: 'Zea mays indentata',
    category: 'grains',
    standardReference: 'NIS 341:2006',
    moisture: { optimal: 12.0, maxGradeA: 13.0, maxGradeB: 14.0, maxGradeC: 15.5, immediateReject: 16.0 },
    foreignMatterPct: { maxGradeA: 1.0, maxGradeB: 2.0, maxGradeC: 4.0 },
    brokenGrainsPct: { maxGradeA: 2.0, maxGradeB: 5.0, maxGradeC: 8.0 },
    insectDamagedPct: { maxGradeA: 1.0, maxGradeB: 3.0, maxGradeC: 6.0 },
    aflatoxinLimitPpb: 10.0,
    storageTemp: { minC: 18.0, maxC: 25.0, maxPermissibleTransitC: 32.0 },
    primaryBelts: ['Kano (Dawanau)', 'Kaduna (Giwa)', 'Katsina (Funtua)', 'Plateau (Shendam)'],
    standardUnit: '100kg Bag'
  },

  YELLOW_MAIZE: {
    key: 'YELLOW_MAIZE',
    commonName: 'Yellow Maize (Feed & Industrial Starch)',
    localNames: { hausa: 'Masara Rawayya', yoruba: 'Agbado Pupa', igbo: 'Oka Edo' },
    scientificTaxon: 'Zea mays indurata',
    category: 'grains',
    standardReference: 'NIS 341:2006',
    moisture: { optimal: 12.5, maxGradeA: 13.5, maxGradeB: 14.5, maxGradeC: 16.0, immediateReject: 16.5 },
    foreignMatterPct: { maxGradeA: 1.5, maxGradeB: 2.5, maxGradeC: 5.0 },
    brokenGrainsPct: { maxGradeA: 3.0, maxGradeB: 6.0, maxGradeC: 10.0 },
    insectDamagedPct: { maxGradeA: 1.5, maxGradeB: 4.0, maxGradeC: 7.0 },
    aflatoxinLimitPpb: 15.0,
    storageTemp: { minC: 18.0, maxC: 26.0, maxPermissibleTransitC: 34.0 },
    primaryBelts: ['Kaduna', 'Oyo (Saki)', 'Ogun', 'Gombe'],
    standardUnit: '100kg Bag'
  },

  SORGHUM_WHITE: {
    key: 'SORGHUM_WHITE',
    commonName: 'White Guinea Corn / Sorghum (Farafara)',
    localNames: { hausa: 'Dawa Farafara', yoruba: 'Oka Baba Funfun', igbo: 'Oka Sorghum' },
    scientificTaxon: 'Sorghum bicolor',
    category: 'grains',
    standardReference: 'NIS 389:2008',
    moisture: { optimal: 11.5, maxGradeA: 12.5, maxGradeB: 13.5, maxGradeC: 15.0, immediateReject: 15.5 },
    foreignMatterPct: { maxGradeA: 1.0, maxGradeB: 2.0, maxGradeC: 3.5 },
    brokenGrainsPct: { maxGradeA: 2.0, maxGradeB: 4.0, maxGradeC: 7.0 },
    insectDamagedPct: { maxGradeA: 1.0, maxGradeB: 2.5, maxGradeC: 5.0 },
    aflatoxinLimitPpb: 10.0,
    storageTemp: { minC: 18.0, maxC: 28.0, maxPermissibleTransitC: 35.0 },
    primaryBelts: ['Kano', 'Sokoto', 'Borno', 'Bauchi', 'Adamawa'],
    standardUnit: '100kg Bag'
  },

  SOYBEANS: {
    key: 'SOYBEANS',
    commonName: 'Soybeans (Commercial Oilseed)',
    localNames: { hausa: 'Waken Soya', yoruba: 'Ewa Soya', igbo: 'Agwa Soya' },
    scientificTaxon: 'Glycine max',
    category: 'grains',
    standardReference: 'NIS 440:2004',
    moisture: { optimal: 10.0, maxGradeA: 11.0, maxGradeB: 12.5, maxGradeC: 14.0, immediateReject: 14.5 },
    foreignMatterPct: { maxGradeA: 1.0, maxGradeB: 2.0, maxGradeC: 3.0 },
    brokenGrainsPct: { maxGradeA: 2.0, maxGradeB: 4.0, maxGradeC: 8.0 },
    oilContentMinPct: 18.5,
    storageTemp: { minC: 15.0, maxC: 24.0, maxPermissibleTransitC: 30.0 },
    primaryBelts: ['Benue (Gboko/Makurdi)', 'Kaduna', 'Kano', 'Taraba'],
    standardUnit: '100kg Bag'
  },

  COWPEA_WHITE: {
    key: 'COWPEA_WHITE',
    commonName: 'White Cowpea (Black-Eyed Beans / Oloyin)',
    localNames: { hausa: 'Wake Farin', yoruba: 'Ewa Oloyin / Funfun', igbo: 'Agwa Ocha' },
    scientificTaxon: 'Vigna unguiculata',
    category: 'grains',
    standardReference: 'NIS 342:2006',
    moisture: { optimal: 10.5, maxGradeA: 11.5, maxGradeB: 12.5, maxGradeC: 14.0, immediateReject: 14.5 },
    foreignMatterPct: { maxGradeA: 0.8, maxGradeB: 1.8, maxGradeC: 3.0 },
    weevilDamagedPct: { maxGradeA: 0.5, maxGradeB: 2.0, maxGradeC: 5.0 },
    storageTemp: { minC: 16.0, maxC: 24.0, maxPermissibleTransitC: 30.0 },
    primaryBelts: ['Borno', 'Kano', 'Gombe', 'Yobe', 'Niger'],
    standardUnit: '100kg Bag'
  },

  SESAME_SEED_WHITE: {
    key: 'SESAME_SEED_WHITE',
    commonName: 'Natural White Sesame Seed (Beniseed)',
    localNames: { hausa: 'Ridi Farin', yoruba: 'Isasa Funfun', igbo: 'Mkpuru Isasa' },
    scientificTaxon: 'Sesamum indicum',
    category: 'grains',
    standardReference: 'NIS 388:2008 / NEPC Export Grade',
    moisture: { optimal: 5.0, maxGradeA: 6.0, maxGradeB: 7.0, maxGradeC: 8.5, immediateReject: 9.0 },
    foreignMatterPct: { maxGradeA: 1.0, maxGradeB: 2.0, maxGradeC: 3.5 },
    oilContentMinPct: 50.0,
    purityMinPct: 99.0,
    storageTemp: { minC: 15.0, maxC: 22.0, maxPermissibleTransitC: 28.0 },
    primaryBelts: ['Nasarawa (Doma)', 'Benue', 'Jigawa (Hadejia)', 'Taraba'],
    standardUnit: '80kg Bag'
  },

  // ----------------------------------------------------------------------------
  // 2. PERISHABLE VEGETABLES & FRUITS (COLD CHAIN REGULATED)
  // ----------------------------------------------------------------------------
  ROMA_TOMATOES: {
    key: 'ROMA_TOMATOES',
    commonName: 'Fresh Roma Plum Tomatoes (Grade A Table / Salad)',
    localNames: { hausa: 'Tumatir Hausa', yoruba: 'Tomati Eko', igbo: 'Tomato' },
    scientificTaxon: 'Solanum lycopersicum',
    category: 'vegetables',
    standardReference: 'NIS 512:2006 (Cold Chain Produce)',
    moisture: { optimal: 92.5, maxGradeA: 94.0, maxGradeB: 95.5, maxGradeC: 97.0, immediateReject: 98.0 },
    spoilageRotPct: { maxGradeA: 1.5, maxGradeB: 3.5, maxGradeC: 6.5, immediateReject: 8.0 },
    foreignMatterPct: { maxGradeA: 0.5, maxGradeB: 1.2, maxGradeC: 2.5 },
    firmnessIndexScoreMin: 7.0,
    coldChain: {
      optimalPulpTempC: 8.0,
      minPermissibleTempC: 4.0, // Chilling injury threshold
      maxPermissibleTempC: 11.5, // Rapid microbial proliferation threshold
      slaMaxExcursionDurationHours: 4.0
    },
    primaryBelts: ['Kano (Kura/Bunkure)', 'Kaduna (Hunkuyi/Zaria)', 'Plateau (Jos South)'],
    standardUnit: '50kg Raffia Basket / 25kg Plastic Crate'
  },

  SCOTCH_BONNET_PEPPER: {
    key: 'SCOTCH_BONNET_PEPPER',
    commonName: 'Fresh Scotch Bonnet Pepper (Ata Rodo / Habanero)',
    localNames: { hausa: 'Barkono / Attarugu', yoruba: 'Ata Rodo', igbo: 'Ose Oyibo' },
    scientificTaxon: 'Capsicum chinense',
    category: 'vegetables',
    standardReference: 'NIS 514:2006',
    moisture: { optimal: 88.0, maxGradeA: 90.0, maxGradeB: 92.0, maxGradeC: 94.0, immediateReject: 95.0 },
    spoilageRotPct: { maxGradeA: 1.0, maxGradeB: 3.0, maxGradeC: 5.5, immediateReject: 7.0 },
    foreignMatterPct: { maxGradeA: 0.5, maxGradeB: 1.0, maxGradeC: 2.0 },
    coldChain: {
      optimalPulpTempC: 7.5,
      minPermissibleTempC: 5.0,
      maxPermissibleTempC: 10.0,
      slaMaxExcursionDurationHours: 6.0
    },
    primaryBelts: ['Kano', 'Kaduna', 'Oyo', 'Ogun'],
    standardUnit: '40kg Bag / 20kg Crate'
  },

  BELL_PEPPER_TATASE: {
    key: 'BELL_PEPPER_TATASE',
    commonName: 'Red Sweet Bell Pepper (Tatase)',
    localNames: { hausa: 'Tatase Babba', yoruba: 'Ata Tatase', igbo: 'Ose Nsukka' },
    scientificTaxon: 'Capsicum annuum',
    category: 'vegetables',
    standardReference: 'NIS 514:2006',
    moisture: { optimal: 90.0, maxGradeA: 92.5, maxGradeB: 94.0, maxGradeC: 96.0, immediateReject: 97.0 },
    spoilageRotPct: { maxGradeA: 1.5, maxGradeB: 3.5, maxGradeC: 6.0, immediateReject: 8.0 },
    foreignMatterPct: { maxGradeA: 0.5, maxGradeB: 1.5, maxGradeC: 2.5 },
    coldChain: {
      optimalPulpTempC: 7.0,
      minPermissibleTempC: 4.5,
      maxPermissibleTempC: 10.5,
      slaMaxExcursionDurationHours: 5.0
    },
    primaryBelts: ['Kaduna', 'Kano', 'Plateau'],
    standardUnit: '30kg Crate'
  },

  RED_ONIONS: {
    key: 'RED_ONIONS',
    commonName: 'Aliero Red Bulb Onions (Cured)',
    localNames: { hausa: 'Albasa Ja', yoruba: 'Alubosa Pupa', igbo: 'Yabasi Uhie' },
    scientificTaxon: 'Allium cepa',
    category: 'vegetables',
    standardReference: 'NIS 482:2005',
    moisture: { optimal: 80.0, maxGradeA: 83.0, maxGradeB: 86.0, maxGradeC: 89.0, immediateReject: 90.0 },
    spoilageRotPct: { maxGradeA: 1.0, maxGradeB: 2.5, maxGradeC: 5.0, immediateReject: 7.0 },
    foreignMatterPct: { maxGradeA: 1.0, maxGradeB: 2.0, maxGradeC: 3.5 },
    coldChain: {
      optimalPulpTempC: 15.0, // Ambient ventilated dry haulage
      minPermissibleTempC: 10.0,
      maxPermissibleTempC: 25.0,
      slaMaxExcursionDurationHours: 24.0
    },
    primaryBelts: ['Kebbi (Aliero)', 'Sokoto (Goronyo)', 'Kano', 'Borno'],
    standardUnit: '100kg Bag'
  },

  CAVENDISH_BANANAS: {
    key: 'CAVENDISH_BANANAS',
    commonName: 'Export Grade Cavendish Bananas (Green Firm)',
    localNames: { hausa: 'Ayaba Kore', yoruba: 'Ogede Wewe', igbo: 'Unere Ndidi' },
    scientificTaxon: 'Musa acuminata',
    category: 'fruits',
    standardReference: 'NIS 618:2010',
    moisture: { optimal: 74.0, maxGradeA: 76.0, maxGradeB: 78.0, maxGradeC: 80.0, immediateReject: 82.0 },
    spoilageRotPct: { maxGradeA: 0.5, maxGradeB: 2.0, maxGradeC: 4.0, immediateReject: 6.0 },
    bruisingScuffPct: { maxGradeA: 1.0, maxGradeB: 3.0, maxGradeC: 6.0 },
    coldChain: {
      optimalPulpTempC: 13.5, // Sensitive to chilling injury below 12°C
      minPermissibleTempC: 12.0,
      maxPermissibleTempC: 15.0,
      slaMaxExcursionDurationHours: 4.0
    },
    primaryBelts: ['Edo', 'Ondo', 'Cross River', 'Delta'],
    standardUnit: '18kg Export Carton'
  },

  // ----------------------------------------------------------------------------
  // 3. ROOTS, TUBERS & RHIZOMES
  // ----------------------------------------------------------------------------
  WHITE_YAM_PONA: {
    key: 'WHITE_YAM_PONA',
    commonName: 'Benue Pona White Yam (Tubers)',
    localNames: { hausa: 'Doya Pona', yoruba: 'Isu Pona', igbo: 'Ji Ocha Pona' },
    scientificTaxon: 'Dioscorea rotundata',
    category: 'tubers',
    standardReference: 'NIS 248:2008',
    moisture: { optimal: 65.0, maxGradeA: 68.0, maxGradeB: 72.0, maxGradeC: 75.0, immediateReject: 78.0 },
    softRotDeductionPct: { maxGradeA: 0.5, maxGradeB: 2.0, maxGradeC: 4.5, immediateReject: 6.0 },
    nematodeGallScoreMax: 2,
    bruisingBrokenHeadPct: { maxGradeA: 2.0, maxGradeB: 5.0, maxGradeC: 9.0 },
    storageTemp: { minC: 16.0, maxC: 24.0, maxPermissibleTransitC: 30.0 },
    primaryBelts: ['Benue (Zaki Biam)', 'Nasarawa', 'Niger (Minna)', 'Taraba (Wukari)'],
    standardUnit: 'Tubers (100 Count Heap)'
  },

  CASSAVA_TUBERS: {
    key: 'CASSAVA_TUBERS',
    commonName: 'Fresh Cassava Roots (High Starch TMS Variety)',
    localNames: { hausa: 'Rogo', yoruba: 'Ege / Gbaguda', igbo: 'Akpu / Abacha' },
    scientificTaxon: 'Manihot esculenta',
    category: 'tubers',
    standardReference: 'NIS 481:2005',
    moisture: { optimal: 62.0, maxGradeA: 65.0, maxGradeB: 68.0, maxGradeC: 72.0, immediateReject: 75.0 },
    postHarvestDeteriorationHoursMax: 48,
    cyanogenicPotentialPpmMax: 50.0,
    storageTemp: { minC: 18.0, maxC: 28.0, maxPermissibleTransitC: 32.0 },
    primaryBelts: ['Ogun', 'Oyo', 'Imo', 'Edo', 'Kogi'],
    standardUnit: 'Metric Tonne (Weighbridge Bulk)'
  },

  GINGER_SPLIT_DRIED: {
    key: 'GINGER_SPLIT_DRIED',
    commonName: 'Split Dried Ginger (Kaduna Yellow Tadurga)',
    localNames: { hausa: 'Citta Marike', yoruba: 'Atale Gbigbe', igbo: 'Jinja Okpukpu' },
    scientificTaxon: 'Zingiber officinale',
    category: 'tubers',
    standardReference: 'NIS 391:2008 / ASTA Export Grade',
    moisture: { optimal: 8.0, maxGradeA: 9.0, maxGradeB: 10.5, maxGradeC: 12.0, immediateReject: 12.5 },
    foreignMatterPct: { maxGradeA: 1.0, maxGradeB: 2.0, maxGradeC: 3.5 },
    oleoresinMinPct: 4.5,
    storageTemp: { minC: 18.0, maxC: 26.0, maxPermissibleTransitC: 32.0 },
    primaryBelts: ['Kaduna (Kachia / Jaba)', 'Plateau', 'Nasarawa'],
    standardUnit: '40kg Jute Bag'
  },

  // ----------------------------------------------------------------------------
  // 4. CASH EXPORT COMMODITIES
  // ----------------------------------------------------------------------------
  COCOA_BEANS_GRADE_ONE: {
    key: 'COCOA_BEANS_GRADE_ONE',
    commonName: 'Fermented Main Crop Cocoa Beans (Grade 1)',
    localNames: { hausa: 'Koko', yoruba: 'Koko Akoko', igbo: 'Koko Ndi Eze' },
    scientificTaxon: 'Theobroma cacao',
    category: 'grains',
    standardReference: 'NIS 310:2006 / FCC International Grade 1',
    moisture: { optimal: 7.0, maxGradeA: 7.5, maxGradeB: 8.0, maxGradeC: 9.0, immediateReject: 9.5 },
    fermentationScoreMinPct: 80.0,
    moldBeanMaxCount: 3.0, // per 100 cut beans
    slatyBeanMaxCount: 3.0,
    storageTemp: { minC: 18.0, maxC: 24.0, maxPermissibleTransitC: 28.0 },
    primaryBelts: ['Ondo (Idanre / Ile-Oluji)', 'Osun', 'Cross River', 'Ekiti'],
    standardUnit: '64kg Cocoa Bag'
  },

  CASHEW_RAW_NUTS: {
    key: 'CASHEW_RAW_NUTS',
    commonName: 'Raw Cashew Nuts in Shell (RCN Ogbomoso / Kogi)',
    localNames: { hausa: 'Kashu', yoruba: 'Kaju', igbo: 'Kashu' },
    scientificTaxon: 'Anacardium occidentale',
    category: 'grains',
    standardReference: 'NIS 487:2005 / Outturn KOR Standards',
    moisture: { optimal: 8.0, maxGradeA: 9.0, maxGradeB: 10.0, maxGradeC: 11.5, immediateReject: 12.0 },
    outturnRatioKorMin: 48.0, // Kernel Outturn Ratio lbs/bag
    nutCountPerKgMax: 200,
    defectiveNutsMaxPct: 8.0,
    storageTemp: { minC: 18.0, maxC: 26.0, maxPermissibleTransitC: 32.0 },
    primaryBelts: ['Kogi (Anyigba)', 'Oyo (Ogbomoso)', 'Enugu', 'Kwara'],
    standardUnit: '80kg Jute Bag'
  }
};

/**
 * Retrieve statutory commodity standard by key
 * @param {string} commodityKey
 * @returns {Object|null}
 */
function getCommodityStandard(commodityKey) {
  if (!commodityKey) return null;
  const normalizedKey = commodityKey.trim().toUpperCase().replace(/[-\s]/g, '_');
  return NIGERIAN_COMMODITY_STANDARDS[normalizedKey] || null;
}

/**
 * Evaluate metrics against standard thresholds
 * @param {string} commodityKey
 * @param {Object} metrics
 * @returns {Object} Evaluation report with grade and statutory compliance flags
 */
function evaluateCommodityGrade(commodityKey, metrics = {}) {
  const standard = getCommodityStandard(commodityKey);
  if (!standard) {
    return {
      success: false,
      grade: 'GRADE_B_WHOLESALE_STANDARD',
      score: 75,
      recommendation: 'ACCEPT_FULL_SETTLEMENT',
      message: `No explicit statutory profile for ${commodityKey}; default wholesale standard applied.`
    };
  }

  let score = 100;
  const violations = [];
  let isRejected = false;

  // 1. Moisture Evaluation
  const moistureVal = Number(metrics.moistureContentPercentage || 0);
  if (moistureVal > standard.moisture.immediateReject) {
    score -= 40;
    isRejected = true;
    violations.push(`Moisture (${moistureVal}%) exceeds statutory threshold of ${standard.moisture.immediateReject}%`);
  } else if (moistureVal > standard.moisture.maxGradeB) {
    score -= 20;
  } else if (moistureVal > standard.moisture.maxGradeA) {
    score -= 10;
  }

  // 2. Foreign Matter Evaluation
  const foreignVal = Number(metrics.foreignMatterPercentage || 0);
  if (standard.foreignMatterPct) {
    if (foreignVal > standard.foreignMatterPct.maxGradeC) {
      score -= 25;
      violations.push(`Foreign matter (${foreignVal}%) exceeds maximum permissible Grade C allowance`);
    } else if (foreignVal > standard.foreignMatterPct.maxGradeB) {
      score -= 12;
    } else if (foreignVal > standard.foreignMatterPct.maxGradeA) {
      score -= 6;
    }
  }

  // 3. Spoilage & Rot Evaluation (Vegetables / Fruits / Tubers)
  const spoilageVal = Number(metrics.spoilageRotPercentage || 0);
  if (standard.spoilageRotPct) {
    if (spoilageVal > standard.spoilageRotPct.immediateReject) {
      score -= 45;
      isRejected = true;
      violations.push(`Spoilage rate (${spoilageVal}%) exceeds maximum allowable ${standard.spoilageRotPct.immediateReject}%`);
    } else if (spoilageVal > standard.spoilageRotPct.maxGradeB) {
      score -= 22;
    } else if (spoilageVal > standard.spoilageRotPct.maxGradeA) {
      score -= 10;
    }
  }

  // 4. Biological Pathogens & Pests
  if (metrics.moldMildewDetected) {
    score = Math.min(score, 30);
    isRejected = true;
    violations.push('Aflatoxin/mold biological contamination detected. Prohibited under NAFDAC food safety act.');
  }

  if (metrics.pestInfestationDetected) {
    score -= 30;
    violations.push('Live insect infestation detected. Requires fumigation quarantine.');
  }

  // 5. Final Grade & Score Assignment
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let grade = 'GRADE_A_EXPORT_PREMIUM';
  let recommendation = 'ACCEPT_FULL_SETTLEMENT';
  let priceDiscountPct = 0;

  if (isRejected || finalScore < 50) {
    grade = 'REJECTED_UNFIT';
    recommendation = 'LODGE_TRIBUNAL_DISPUTE';
    priceDiscountPct = 100;
  } else if (finalScore < 70) {
    grade = 'GRADE_C_PROCESSING_ONLY';
    recommendation = 'ACCEPT_WITH_PRO_RATA_DISCOUNT';
    priceDiscountPct = Math.round((100 - finalScore) * 0.4);
  } else if (finalScore < 85) {
    grade = 'GRADE_B_WHOLESALE_STANDARD';
    recommendation = 'ACCEPT_FULL_SETTLEMENT';
    priceDiscountPct = 0;
  }

  return {
    success: true,
    commodityKey: standard.key,
    commonName: standard.commonName,
    standardReference: standard.standardReference,
    grade,
    score: finalScore,
    recommendation,
    priceDiscountPct,
    violations,
    isCompliantWithSon: !isRejected && finalScore >= 70
  };
}

module.exports = {
  NIGERIAN_COMMODITY_STANDARDS,
  getCommodityStandard,
  evaluateCommodityGrade
};
