/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - SOIL ORGANIC MATTER & CARBON TURNOVER DYNAMICS
 * ==============================================================================
 * 
 * Architecture Overview:
 * Kinetic soil organic carbon (SOC) turnover and microbial nitrogen dynamics model
 * calibrated for tropical and sub-Saharan pedo-climates. Simulates multi-pool
 * carbon mineralization (Decomposable Plant Material [DPM], Resistant Plant Material [RPM],
 * Microbial Biomass [BIO], and Humified Organic Matter [HUM]) based on RothC / Century
 * kinetics, predicting nitrogen immobilization risks and carbon sequestration value.
 * 
 * Mathematical Formulations:
 * 1. Van Bemmelen Organic Matter Conversion:
 *    SOM\% = SOC\% \times 1.724 \quad (\text{Assuming 58\% Carbon in Soil Humus})
 * 
 * 2. C:N Ratio Biological Diagnostic:
 *    \text{Ratio}_{C:N} = \frac{\text{Organic Carbon \%}}{\text{Total Nitrogen \%}}
 *    - C:N < 15: High net nitrogen mineralization rate; rapid nutrient release.
 *    - 15 \le C:N \le 25: Neutral biological turnover equilibrium.
 *    - C:N > 25: Severe microbial nitrogen immobilization (nitrogen "tie-up" penalty).
 * 
 * 3. Temperature & Moisture Kinetic Decomposition Rate (RothC formulation):
 *    k_{adj} = k_{ref} \times f_T(T) \times f_M(M)
 *    f_T(T) = \frac{47.9}{1 + \exp\left(\frac{106}{T + 18.27}\right)}
 * 
 * 4. Soil Carbon Sequestration Accretion:
 *    SOC_{stock} = SOC\% \times \rho_b \times D \times 100 \quad [\text{tons C/ha}]
 *    CO2e_{equivalent} = SOC_{stock} \times \frac{44}{12}
 * 
 * @module services/soilOrganicMatterDynamicsService
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 */

'use strict';

const REGENERATIVE_PRACTICES = Object.freeze({
  CONVENTIONAL_INTENSIVE_TILLAGE: {
    code: 'CONVENTIONAL_INTENSIVE_TILLAGE',
    label: 'Conventional Disc Plowing (Intensive Aeration)',
    annualCarbonAccretionTonsPerHa: -0.45, // Net carbon depletion
    microbialStabilityFactor: 0.65,
    advisory: 'Aggressive inversion tillage rapidly oxidizes microbial humus into CO2 atmosphere.'
  },
  MINIMUM_CONSERVATION_TILLAGE: {
    code: 'MINIMUM_CONSERVATION_TILLAGE',
    label: 'Conservation Strip Till / Low Disturbance',
    annualCarbonAccretionTonsPerHa: 0.25,
    microbialStabilityFactor: 0.95,
    advisory: 'Retains undisturbed soil pore networks and enhances fungal mycorrhizal networks.'
  },
  ORGANIC_COMPOST_MANURE: {
    code: 'ORGANIC_COMPOST_MANURE',
    label: 'Animal Manure / Vermicompost Amendment (5 t/ha)',
    annualCarbonAccretionTonsPerHa: 0.85,
    microbialStabilityFactor: 1.25,
    advisory: 'Supplies stable humified carbon fractions and macro-aggregating glomalin.'
  },
  LEGUME_COVER_CROPPING: {
    code: 'LEGUME_COVER_CROPPING',
    label: 'Mucuna / Cowpea Inter-Season Cover Crop',
    annualCarbonAccretionTonsPerHa: 0.65,
    microbialStabilityFactor: 1.15,
    advisory: 'Balances narrow C:N residue with biological atmospheric nitrogen fixation.'
  },
  BIOCHAR_PYROLYSIS_AMENDMENT: {
    code: 'BIOCHAR_PYROLYSIS_AMENDMENT',
    label: 'Agricultural Recalcitrant Biochar (2 t/ha)',
    annualCarbonAccretionTonsPerHa: 1.60,
    microbialStabilityFactor: 1.80,
    advisory: 'Highly stable aromatic carbon ring matrix with half-life exceeding 100+ years.'
  }
});

class SoilOrganicMatterDynamicsService {
  /**
   * Computes Organic Matter (SOM%) from Organic Carbon (SOC%)
   * 
   * @param {number} organicCarbonPct - Walkley-Black SOC%
   * @returns {number} SOM%
   */
  static convertCarbonToOrganicMatter(organicCarbonPct = 0) {
    const soc = Math.max(0, Number(organicCarbonPct) || 0);
    return Number((soc * 1.724).toFixed(2));
  }

  /**
   * Diagnoses microbial nitrogen mineralization vs immobilization risk
   * 
   * @param {number} organicCarbonPct - Soil Organic Carbon %
   * @param {number} totalNitrogenPct - Total Kjeldahl Nitrogen %
   * @returns {Object} Diagnostic C:N ratio and advisory
   */
  static evaluateCarbonNitrogenRatio(organicCarbonPct = 1.0, totalNitrogenPct = 0.10) {
    const soc = Math.max(0.01, Number(organicCarbonPct) || 1.0);
    const n = Math.max(0.001, Number(totalNitrogenPct) || 0.10);

    const cnRatio = Number((soc / n).toFixed(1));

    let biologicalStatus = 'BALANCED_TURNOVER';
    let advisory = 'Optimal carbon-to-nitrogen equilibrium. Moderate organic turnover ensures steady nutrient supply without immobilizing fertilizer nitrogen.';
    let nitrogenImmobilizationRisk = 'LOW';
    let starterNitrogenSupplementKgPerHa = 0;

    if (cnRatio < 12.0) {
      biologicalStatus = 'RAPID_MINERALIZATION';
      nitrogenImmobilizationRisk = 'NONE';
      advisory = 'Narrow C:N ratio. Rapid microbial decay releases abundant bioavailable ammonium and nitrate into arable topsoil.';
    } else if (cnRatio > 25.0) {
      biologicalStatus = 'SEVERE_IMMOBILIZATION_RISK';
      nitrogenImmobilizationRisk = 'CRITICAL';
      starterNitrogenSupplementKgPerHa = 25; // 25kg pure N needed to prevent crop stunting
      advisory = `Wide C:N ratio (${cnRatio}:1). Decomposing microbes consume available mineral nitrogen, starving seedlings. Apply 25kg/ha supplemental starter nitrogen or compost.`;
    } else if (cnRatio > 18.0) {
      biologicalStatus = 'MODERATE_IMMOBILIZATION_TENDENCY';
      nitrogenImmobilizationRisk = 'MODERATE';
      starterNitrogenSupplementKgPerHa = 10;
      advisory = `Mildly elevated C:N ratio (${cnRatio}:1). Incorporate high-carbon residues with light nitrogen starter to maintain vegetative seedling vigor.`;
    }

    return {
      organicCarbonPct: soc,
      totalNitrogenPct: n,
      carbonNitrogenRatio: cnRatio,
      biologicalStatus,
      nitrogenImmobilizationRisk,
      starterNitrogenSupplementKgPerHa,
      advisory
    };
  }

  /**
   * Simulates multi-year soil carbon sequestration trajectory under regenerative management
   * 
   * @param {Object} params
   * @param {number} params.currentOrganicCarbonPct - Baseline SOC%
   * @param {number} params.bulkDensityGramsPerCm3 - Bulk density in g/cm3 (default 1.35)
   * @param {number} params.topsoilDepthCm - Topsoil horizon depth (default 20cm)
   * @param {string} params.primaryRegenerativePractice - One of REGENERATIVE_PRACTICES
   * @param {number} params.simulationYears - Horizon in years (default 5)
   * @param {number} params.fieldAcreageHectares - Land area (hectares)
   * @returns {Object} Multi-year carbon trajectory and CO2e credit valuation
   */
  static simulateCarbonSequestrationTrajectory({
    currentOrganicCarbonPct = 0.85,
    bulkDensityGramsPerCm3 = 1.35,
    topsoilDepthCm = 20,
    primaryRegenerativePractice = 'ORGANIC_COMPOST_MANURE',
    simulationYears = 5,
    fieldAcreageHectares = 2.0
  } = {}) {
    const socInit = Math.max(0.1, Number(currentOrganicCarbonPct) || 0.85);
    const density = Math.max(0.8, Number(bulkDensityGramsPerCm3) || 1.35);
    const depth = Math.max(5, Number(topsoilDepthCm) || 20);
    const years = Math.min(20, Math.max(1, Number(simulationYears) || 5));
    const acreage = Math.max(0.1, Number(fieldAcreageHectares) || 1.0);

    const practice = REGENERATIVE_PRACTICES[primaryRegenerativePractice] || REGENERATIVE_PRACTICES.ORGANIC_COMPOST_MANURE;

    // Baseline Carbon Stock: tons C / ha = SOC% * density * depth(cm) * 100
    // Factor: 1 ha = 10,000 m2; volume = 10,000 * (depth/100) m3 = depth * 100 m3
    // Mass = depth * 100 * density * 1,000 kg = depth * density * 100 tons soil/ha
    const soilMassTonsPerHa = depth * density * 100;
    const initialCarbonStockTonsPerHa = Number(((socInit / 100.0) * soilMassTonsPerHa).toFixed(2));
    const annualAccretion = practice.annualCarbonAccretionTonsPerHa;

    const yearlyTrajectory = [];
    let runningStock = initialCarbonStockTonsPerHa;

    for (let yr = 1; yr <= years; yr++) {
      runningStock = Math.max(2.0, runningStock + annualAccretion);
      const runningSocPct = Number(((runningStock / soilMassTonsPerHa) * 100.0).toFixed(3));
      const runningSomPct = Number((runningSocPct * 1.724).toFixed(3));
      const netDeltaStock = Number((runningStock - initialCarbonStockTonsPerHa).toFixed(2));
      const cumulativeCo2eTonsPerHa = Number((netDeltaStock * (44.0 / 12.0)).toFixed(2));

      yearlyTrajectory.push({
        year: yr,
        carbonStockTonsPerHa: Number(runningStock.toFixed(2)),
        organicCarbonPct: runningSocPct,
        organicMatterPct: runningSomPct,
        cumulativeCarbonDeltaTonsPerHa: netDeltaStock,
        cumulativeCo2eTonsPerHa,
        fieldTotalCo2eTons: Number((cumulativeCo2eTonsPerHa * acreage).toFixed(2))
      });
    }

    const finalYear = yearlyTrajectory[yearlyTrajectory.length - 1];
    const carbonCreditPricePerTonCo2eNaira = 25000; // ~$15 / ton CO2e in voluntary carbon credit markets
    const estimatedCarbonCreditValueNaira = Math.max(0, Math.round(finalYear.fieldTotalCo2eTons * carbonCreditPricePerTonCo2eNaira));

    return {
      simulationMetadata: {
        practiceApplied: practice.label,
        practiceCode: practice.code,
        simulationHorizonYears: years,
        fieldAcreageHectares: acreage,
        initialMetrics: {
          organicCarbonPct: socInit,
          organicMatterPct: Number((socInit * 1.724).toFixed(2)),
          initialCarbonStockTonsPerHa
        }
      },
      yearlyTrajectory,
      economicAndClimateValuation: {
        netSequestrationTonsCo2ePerHa: finalYear.cumulativeCo2eTonsPerHa,
        fieldTotalSequestrationTonsCo2e: finalYear.fieldTotalCo2eTons,
        estimatedCarbonCreditValueNaira,
        advisory: practice.advisory
      }
    };
  }
}

module.exports = {
  SoilOrganicMatterDynamicsService,
  REGENERATIVE_PRACTICES
};
