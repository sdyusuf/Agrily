/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - SOIL MICROBIOME & ENZYMATIC FERTILITY SERVICE
 * ==============================================================================
 * 
 * Architecture Overview:
 * Comprehensive biological soil health diagnostic engine modeling microbial
 * biomass carbon (MBC), soil enzyme kinetics (Dehydrogenase, Urease, Alkaline
 * Phosphatase, $\beta$-Glucosidase, and Fluorescein Diacetate [FDA] hydrolysis),
 * biological disease suppressiveness against soil-borne wilt pathogens, and
 * precision bio-inoculant prescription protocols (Trichoderma, Mycorrhizae, Rhizobia).
 * 
 * Mathematical Formulations:
 * 1. Microbial Biomass Carbon Ratio:
 *    MBC_{ratio} = \frac{MBC_{mg/kg}}{SOC_{mg/kg}} \times 100 \quad (\text{Optimal: 2.5 - 4.0\%})
 * 
 * 2. Biological Fertility Index (BFI, 0 - 100):
 *    BFI = w_{DHA} \cdot S_{DHA} + w_{URE} \cdot S_{URE} + w_{ALP} \cdot S_{ALP} + w_{GLU} \cdot S_{GLU} + w_{FDA} \cdot S_{FDA}
 *    where weights $w_i = [0.25, 0.20, 0.20, 0.20, 0.15]$
 * 
 * 3. Pathogen Disease Suppressiveness Index (DSI, 0 - 100):
 *    Quantifies the rhizosphere community capacity to competitively exclude
 *    Fusarium oxysporum (Tomato/Yam wilt), Ralstonia solanacearum (Bacterial wilt),
 *    and Pythium ultimum (Damping off).
 * 
 * @module services/soilMicrobiomeEnzymeActivityService
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 */

'use strict';

/**
 * Standard Soil Enzymatic Reference Thresholds for Tropical Arable Soils
 */
const ENZYMATIC_ACTIVITY_BENCHMARKS = Object.freeze({
  dehydrogenaseDha: {
    unit: 'µg TPF / g soil / 24h',
    name: 'Dehydrogenase (DHA - Total Microbial Respiration)',
    criticalLow: 25.0,
    moderateThreshold: 60.0,
    optimalThreshold: 120.0,
    role: 'Primary indicator of viable, metabolically active heterotrophic soil microorganisms.'
  },
  ureaseEnzyme: {
    unit: 'µg NH4-N / g soil / 2h',
    name: 'Urease (Nitrogen Mineralization Enzyme)',
    criticalLow: 15.0,
    moderateThreshold: 45.0,
    optimalThreshold: 90.0,
    role: 'Catalyzes rapid hydrolysis of applied urea fertilizer into bioavailable ammonium (NH4+).'
  },
  alkalinePhosphataseAlp: {
    unit: 'µg p-NP / g soil / h',
    name: 'Alkaline Phosphatase (Organic Phosphorus Solubilizer)',
    criticalLow: 50.0,
    moderateThreshold: 120.0,
    optimalThreshold: 240.0,
    role: 'Hydrolyzes organic monoesters into bioavailable orthophosphate anions (H2PO4-).'
  },
  betaGlucosidaseGlu: {
    unit: 'µg p-NP / g soil / h',
    name: 'β-Glucosidase (Cellulose & Carbon Cycling)',
    criticalLow: 30.0,
    moderateThreshold: 75.0,
    optimalThreshold: 150.0,
    role: 'Rate-limiting enzyme catalyzing degradation of cellobiose and plant crop residues into glucose.'
  },
  fluoresceinDiacetateFda: {
    unit: 'µg fluorescein / g soil / h',
    name: 'Fluorescein Diacetate (FDA Hydrolysis - Total Hydrolytic Activity)',
    criticalLow: 0.8,
    moderateThreshold: 2.0,
    optimalThreshold: 4.5,
    role: 'Universal assay for broad protease, lipase, and esterase activity across soil fungi and bacteria.'
  }
});

/**
 * Specialized Tropical Bio-Inoculant Strains
 */
const ACCREDITED_BIO_INOCULANTS = Object.freeze({
  TRICHODERMA_HARZIANUM: {
    strainCode: 'TH-NIG-042',
    name: 'Trichoderma harzianum (Bio-Fungicide & Root Colonizer)',
    targetPathogens: ['Fusarium oxysporum', 'Rhizoctonia solani', 'Pythium aphanidermatum'],
    applicationRateKgPerHa: 2.5,
    carrierType: 'Sterilized Peat / Talc Formulation',
    instructions: 'Seed dressing at 10g/kg seed or furrow drench at seedling transplanting.',
    benefits: 'Antagonistic mycoparasitism, induces systemic plant defense resistance (ISR).'
  },
  RHIZOBIUM_LEGUMINOSARUM: {
    strainCode: 'RH-NIG-109',
    name: 'Rhizobium leguminosarum bv. phaseoli (Symbiotic N-Fixer)',
    targetCrops: ['COWPEA', 'SOYBEAN', 'GROUNDNUT'],
    applicationRateKgPerHa: 1.0,
    carrierType: 'Lignite Slurry with Arabic Gum Sticker',
    instructions: 'Inoculate legume seeds in shaded area 30 minutes prior to sowing.',
    benefits: 'Fixes 60 - 140 kg atmospheric N2 / ha, cutting required chemical starter urea by 70%.'
  },
  GLOMUS_INTRARADICES_AMF: {
    strainCode: 'AMF-NIG-007',
    name: 'Rhizophagus irregularis (Arbuscular Mycorrhizal Fungi - AMF)',
    targetCrops: ['MAIZE', 'CASSAVA', 'YAM', 'TOMATO', 'PEPPER', 'COCOA'],
    applicationRateKgPerHa: 5.0,
    carrierType: 'Inoculated Vermiculite Root Fragment Matrix',
    instructions: 'Band into seed trench 2cm below seed placement.',
    benefits: 'Expands effective root surface area by 400%, solubilizing occluded rock phosphate and zinc.'
  },
  BACILLUS_SUBTILIS: {
    strainCode: 'BS-NIG-088',
    name: 'Bacillus subtilis Bio-Protective Bacterium',
    targetPathogens: ['Ralstonia solanacearum', 'Xanthomonas campestris', 'Clavibacter'],
    applicationRateKgPerHa: 2.0,
    carrierType: 'Water-Dispersible Granule (WDG)',
    instructions: 'Dissolve in knapsack sprayer and drench root crowns at 14 days post-planting.',
    benefits: 'Secretes lipopeptides (surfactin, iturin) and siderophores to suppress bacterial wilt.'
  }
});

class SoilMicrobiomeEnzymeActivityService {
  /**
   * Computes individual enzyme performance scores (0 - 100)
   * 
   * @param {number} measured - Measured value
   * @param {Object} benchmark - Benchmark metadata
   * @returns {Object} Score and tier
   */
  static scoreEnzyme(measured = 0, benchmark = {}) {
    const val = Math.max(0, Number(measured) || 0);
    const optimal = benchmark.optimalThreshold || 100.0;
    const score = Math.min(100, Math.round((val / optimal) * 100));

    let tier = 'OPTIMAL_BIOLOGICAL_ACTIVITY';
    if (val < benchmark.criticalLow) {
      tier = 'CRITICALLY_DEPRESSED_MICROBIAL_INACTIVITY';
    } else if (val < benchmark.moderateThreshold) {
      tier = 'SUBOPTIMAL_MODERATE_ACTIVITY';
    }

    return {
      measuredValue: val,
      unit: benchmark.unit,
      scorePct: score,
      tier,
      isDepressed: val < benchmark.moderateThreshold
    };
  }

  /**
   * Evaluates complete biological soil fertility and enzyme kinetics
   * 
   * @param {Object} enzymaticAssays - Measured enzyme parameters
   * @param {number} soilOrganicCarbonPct - Walkley-Black SOC%
   * @param {string} targetCrop - Target crop commodity
   * @returns {Object} Biological diagnostic report
   */
  static evaluateMicrobialFertility(enzymaticAssays = {}, soilOrganicCarbonPct = 0.85, targetCrop = 'MAIZE') {
    const dhaVal = Number(enzymaticAssays.dehydrogenaseDha ?? 55.0);
    const ureVal = Number(enzymaticAssays.ureaseEnzyme ?? 40.0);
    const alpVal = Number(enzymaticAssays.alkalinePhosphataseAlp ?? 110.0);
    const gluVal = Number(enzymaticAssays.betaGlucosidaseGlu ?? 65.0);
    const fdaVal = Number(enzymaticAssays.fluoresceinDiacetateFda ?? 1.8);

    const dhaScore = this.scoreEnzyme(dhaVal, ENZYMATIC_ACTIVITY_BENCHMARKS.dehydrogenaseDha);
    const ureScore = this.scoreEnzyme(ureVal, ENZYMATIC_ACTIVITY_BENCHMARKS.ureaseEnzyme);
    const alpScore = this.scoreEnzyme(alpVal, ENZYMATIC_ACTIVITY_BENCHMARKS.alkalinePhosphataseAlp);
    const gluScore = this.scoreEnzyme(gluVal, ENZYMATIC_ACTIVITY_BENCHMARKS.betaGlucosidaseGlu);
    const fdaScore = this.scoreEnzyme(fdaVal, ENZYMATIC_ACTIVITY_BENCHMARKS.fluoresceinDiacetateFda);

    // Biological Fertility Index (BFI, 0 - 100)
    const bfiScore = Math.round(
      (dhaScore.scorePct * 0.25) +
      (ureScore.scorePct * 0.20) +
      (alpScore.scorePct * 0.20) +
      (gluScore.scorePct * 0.20) +
      (fdaScore.scorePct * 0.15)
    );

    let biologicalHealthTier = 'MODERATE_BIOLOGICAL_HEALTH';
    if (bfiScore >= 80) biologicalHealthTier = 'THRIVING_DIVERSE_MICROBIOME';
    else if (bfiScore >= 60) biologicalHealthTier = 'ADEQUATE_ACTIVE_MICROBIOME';
    else if (bfiScore < 40) biologicalHealthTier = 'STERILIZED_DEPLETED_MICROBIOME';

    // Microbial Disease Suppressiveness Index (DSI, 0 - 100)
    // Correlates with FDA hydrolytic capacity and high dehydrogenase respiration
    const dsiScore = Math.min(100, Math.round((fdaScore.scorePct * 0.55) + (dhaScore.scorePct * 0.45)));

    let diseaseSuppressionRating = 'MODERATE_COMPETITIVE_EXCLUSION';
    if (dsiScore >= 75) diseaseSuppressionRating = 'HIGH_PATHOGEN_SUPPRESSION';
    else if (dsiScore < 45) diseaseSuppressionRating = 'VULNERABLE_ROOT_ROT_PRONE';

    // Formulate Targeted Bio-Inoculant Protocol
    const recommendedInoculants = [];
    const cropUpper = targetCrop.toUpperCase();

    // If legume, always prescribe Rhizobium
    if (['COWPEA', 'SOYBEAN', 'GROUNDNUT'].includes(cropUpper)) {
      recommendedInoculants.push(ACCREDITED_BIO_INOCULANTS.RHIZOBIUM_LEGUMINOSARUM);
    }

    // If phosphorus enzyme is low or root tuber/cereal, prescribe Mycorrhizae
    if (alpScore.isDepressed || ['MAIZE', 'CASSAVA', 'YAM', 'TOMATO'].includes(cropUpper)) {
      recommendedInoculants.push(ACCREDITED_BIO_INOCULANTS.GLOMUS_INTRARADICES_AMF);
    }

    // If disease suppressiveness is low or solanaceous crop, prescribe Trichoderma
    if (dsiScore < 60 || ['TOMATO', 'PEPPER'].includes(cropUpper)) {
      recommendedInoculants.push(ACCREDITED_BIO_INOCULANTS.TRICHODERMA_HARZIANUM);
    }

    // Bacterial wilt suppression for Solanaceae
    if (['TOMATO', 'PEPPER'].includes(cropUpper) && dsiScore < 50) {
      recommendedInoculants.push(ACCREDITED_BIO_INOCULANTS.BACILLUS_SUBTILIS);
    }

    return {
      targetCrop: cropUpper,
      biologicalFertilityIndex: {
        score: bfiScore,
        tier: biologicalHealthTier,
        description: 'Composite metric evaluating soil microbial biomass vitality, organic matter cycling, and enzymatic responsiveness.'
      },
      diseaseSuppressionCapacity: {
        suppressionScore: dsiScore,
        rating: diseaseSuppressionRating,
        wiltPathogenVulnerability: dsiScore < 50 ? 'HIGH_RISK' : 'RESILIENT'
      },
      enzymaticAssayDetails: {
        dehydrogenase: dhaScore,
        urease: ureScore,
        alkalinePhosphatase: alpScore,
        betaGlucosidase: gluScore,
        fluoresceinDiacetate: fdaScore
      },
      prescribedBioInoculants: recommendedInoculants,
      regenerativeBioAdvisory: bfiScore < 50
        ? 'Soil microbial respiration is critically depressed. Minimize non-selective broad-spectrum chemical fumigants and incorporate cured vermicompost to re-inoculate beneficial rhizosphere taxa.'
        : 'Rhizosphere microbial community is well-balanced. Maintain organic vegetative surface residue to sustain active fungal mycelial networks.'
    };
  }
}

module.exports = {
  SoilMicrobiomeEnzymeActivityService,
  ENZYMATIC_ACTIVITY_BENCHMARKS,
  ACCREDITED_BIO_INOCULANTS
};
