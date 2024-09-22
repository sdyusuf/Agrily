/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - SOIL CATION BALANCE & STRUCTURE DISPERSION SERVICE
 * ==============================================================================
 * 
 * Architecture Overview:
 * Advanced pedological service evaluating Base Cation Saturation Ratios (BCSR /
 * Albrecht System), Calcium-to-Magnesium balance, Exchangeable Sodium Percentage
 * (ESP), Sodium Adsorption Ratio (SAR), and Gypsum (CaSO4 · 2H2O) reclamation
 * requirements for structural sodicity and clay dispersion in tropical soils.
 * 
 * Mathematical Formulations:
 * 1. Base Cation Saturation Ratios (% of ECEC):
 *    Ca_{sat}\% = \frac{Ca^{2+}}{ECEC} \times 100 \quad (\text{Optimal: 65 - 75\%})
 *    Mg_{sat}\% = \frac{Mg^{2+}}{ECEC} \times 100 \quad (\text{Optimal: 10 - 15\%})
 *    K_{sat}\%  = \frac{K^+}{ECEC} \times 100     \quad (\text{Optimal: 3 - 5\%})
 *    Na_{sat}\% = \frac{Na^+}{ECEC} \times 100    \quad (\text{Optimal: } < 1.0\%)
 * 
 * 2. Cation Inter-Relationship Ratios:
 *    R_{Ca:Mg} = \frac{Ca^{2+}}{Mg^{2+}} \quad (\text{Ideal: 4.0 - 6.0})
 *    If R_{Ca:Mg} < 2.0: Soil aggregates collapse, tight clay packing, low infiltration.
 *    R_{Mg:K}  = \frac{Mg^{2+}}{K^+}     \quad (\text{Ideal: 2.5 - 4.5})
 *    If R_{Mg:K} > 6.0: High magnesium blocks plant potassium uptake (induced deficiency).
 * 
 * 3. Sodicity & Dispersion Risk (ESP & SAR):
 *    ESP\% = \left( \frac{Na^+}{ECEC} \right) \times 100
 *    SAR = \frac{Na^+}{\sqrt{\frac{Ca^{2+} + Mg^{2+}}{2}}}
 *    If ESP > 15% or SAR > 13: Soil is Classified as SODIC / DISPERSIVE.
 * 
 * 4. Gypsum Reclamation Requirement:
 *    Gypsum_{tons/ha} = 0.86 \times D_{topsoil} \times \rho_b \times ECEC \times \frac{(ESP_{current} - ESP_{target})}{100}
 * 
 * @module services/soilCationBalanceService
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 */

'use strict';

// Ideal Albrecht Base Cation Saturation Ranges for Arable Tropical Soils
const ALBRECHT_IDEAL_RANGES = Object.freeze({
  calciumCa: { min: 65.0, max: 75.0, optimal: 68.0, name: 'Calcium (Ca2+)' },
  magnesiumMg: { min: 10.0, max: 15.0, optimal: 12.0, name: 'Magnesium (Mg2+)' },
  potassiumK: { min: 3.0, max: 5.0, optimal: 4.0, name: 'Potassium (K+)' },
  sodiumNa: { min: 0.0, max: 1.5, optimal: 0.5, name: 'Sodium (Na+)' },
  exchangeableAcidityAlPlusH: { min: 0.0, max: 10.0, optimal: 2.0, name: 'Acid Cations (Al3+ + H+)' }
});

class SoilCationBalanceService {
  /**
   * Evaluates comprehensive cation saturation percentages and inter-cation balance ratios
   * 
   * @param {Object} exchangeableCations - Concentrations in cmol(+)/kg
   * @param {number} exchangeableAcidity - Acidity (Al + H) in cmol(+)/kg
   * @returns {Object} Complete cation balance diagnostic report
   */
  static evaluateCationBalance(exchangeableCations = {}, exchangeableAcidity = 0.15) {
    const ca = Math.max(0, Number(exchangeableCations.calciumCa) || 3.8);
    const mg = Math.max(0, Number(exchangeableCations.magnesiumMg) || 1.2);
    const k = Math.max(0, Number(exchangeableCations.potassiumK) || 0.35);
    const na = Math.max(0, Number(exchangeableCations.sodiumNa) || 0.05);
    const acidity = Math.max(0, Number(exchangeableAcidity) || 0.15);

    const sumBases = ca + mg + k + na;
    const ecec = Number((sumBases + acidity).toFixed(2));

    if (ecec === 0) {
      throw new Error('Effective Cation Exchange Capacity (ECEC) cannot be zero.');
    }

    // Saturation percentages
    const caPct = Number(((ca / ecec) * 100).toFixed(1));
    const mgPct = Number(((mg / ecec) * 100).toFixed(1));
    const kPct = Number(((k / ecec) * 100).toFixed(1));
    const naPct = Number(((na / ecec) * 100).toFixed(1));
    const acidityPct = Number(((acidity / ecec) * 100).toFixed(1));
    const baseSaturationPct = Number(((sumBases / ecec) * 100).toFixed(1));

    // Ratios
    const caMgRatio = mg > 0 ? Number((ca / mg).toFixed(2)) : 10.0;
    const mgKRatio = k > 0 ? Number((mg / k).toFixed(2)) : 10.0;
    const caKRatio = k > 0 ? Number((ca / k).toFixed(2)) : 20.0;

    // Structural dispersion metrics
    const espPct = naPct; // Exchangeable Sodium Percentage
    const sarDenominator = Math.sqrt((ca + mg) / 2);
    const sar = sarDenominator > 0 ? Number((na / sarDenominator).toFixed(2)) : 0.0;

    // Diagnose Structural Dispersion / Sodicity Hazard
    let sodicityHazard = 'NONE_NORMAL';
    let dispersionAdvisory = 'Soil structural aggregation is stable. Minimal risk of surface crusting or clay dispersion.';

    if (espPct >= 15.0 || sar >= 13.0) {
      sodicityHazard = 'SEVERE_SODIC_DISPERSION';
      dispersionAdvisory = 'Critical sodicity hazard: High sodium causes clay platelet repulsion, pore collapse, and severe water infiltration blockage. Immediate gypsum (CaSO4) application required.';
    } else if (espPct >= 7.0 || sar >= 6.0) {
      sodicityHazard = 'MODERATE_SLAKING_RISK';
      dispersionAdvisory = 'Elevated sodium: Soil aggregates prone to slaking upon rainfall impact. Maintain organic surface mulch.';
    }

    // Diagnose Ca:Mg Structural Compaction
    let caMgAssessment = 'OPTIMAL_BALANCED';
    let caMgAdvisory = 'Calcium-to-Magnesium ratio is well-balanced for flocculated, porous soil tilth.';

    if (caMgRatio < 2.0) {
      caMgAssessment = 'HIGH_MAGNESIUM_COMPACTION_RISK';
      caMgAdvisory = `Low Ca:Mg ratio (${caMgRatio}:1). Excess magnesium tightens soil aggregates, reducing aeration and root penetration. Apply Calcitic Limestone (CaCO3) or Gypsum.`;
    } else if (caMgRatio > 8.0) {
      caMgAssessment = 'EXCESS_CALCIUM_MAGNESIUM_DEFICIT';
      caMgAdvisory = `Elevated Ca:Mg ratio (${caMgRatio}:1). High calcium may suppress magnesium uptake. Apply Magnesium Sulfate (Kieserite) or Dolomitic Limestone.`;
    }

    // Diagnose Mg:K Potassium Uptake Interference
    let mgKAssessment = 'BALANCED_UPTAKE';
    let mgKAdvisory = 'Magnesium-to-Potassium ratio promotes efficient nutrient absorption by roots.';

    if (mgKRatio > 5.5) {
      mgKAssessment = 'INDUCED_POTASSIUM_DEFICIENCY';
      mgKAdvisory = `High Mg:K ratio (${mgKRatio}:1). High magnesium competitively inhibits root potassium transporters. Boost potash fertilization (MOP 0-0-60).`;
    }

    return {
      effectiveCec: ecec,
      baseSaturationPct,
      cationsMeasuredCmolPerKg: {
        calciumCa: ca,
        magnesiumMg: mg,
        potassiumK: k,
        sodiumNa: na,
        exchangeableAcidityAlPlusH: acidity
      },
      albrechtSaturationPercentages: {
        calcium: { measuredPct: caPct, benchmarkRange: '65 - 75%', status: caPct < 65 ? 'DEFICIT' : caPct > 75 ? 'SURPLUS' : 'OPTIMAL' },
        magnesium: { measuredPct: mgPct, benchmarkRange: '10 - 15%', status: mgPct < 10 ? 'DEFICIT' : mgPct > 15 ? 'SURPLUS' : 'OPTIMAL' },
        potassium: { measuredPct: kPct, benchmarkRange: '3 - 5%', status: kPct < 3 ? 'DEFICIT' : kPct > 5 ? 'SURPLUS' : 'OPTIMAL' },
        sodium: { measuredPct: naPct, benchmarkRange: '< 1.5%', status: naPct > 1.5 ? 'ELEVATED' : 'SAFE' },
        acidity: { measuredPct: acidityPct, benchmarkRange: '< 10%', status: acidityPct > 10 ? 'HIGH_ACID_SATURATION' : 'SAFE' }
      },
      cationRatios: {
        calciumToMagnesium: { ratio: caMgRatio, optimalBenchmark: '4.0 - 6.0', assessment: caMgAssessment, advisory: caMgAdvisory },
        magnesiumToPotassium: { ratio: mgKRatio, optimalBenchmark: '2.5 - 4.5', assessment: mgKAssessment, advisory: mgKAdvisory },
        calciumToPotassium: { ratio: caKRatio, optimalBenchmark: '15.0 - 25.0' }
      },
      sodicityAndDispersion: {
        exchangeableSodiumPercentage: espPct,
        sodiumAdsorptionRatio: sar,
        hazardTier: sodicityHazard,
        advisory: dispersionAdvisory
      }
    };
  }

  /**
   * Calculates Agricultural Gypsum (CaSO4 · 2H2O) requirement to remediate sodic or dispersive soil
   * 
   * @param {Object} params
   * @param {number} params.effectiveCec - Soil ECEC in cmol(+)/kg
   * @param {number} params.currentEspPct - Current Exchangeable Sodium Percentage (%)
   * @param {number} params.targetEspPct - Desired post-reclamation ESP (typically 5.0%)
   * @param {number} params.topsoilDepthCm - Remediation depth (typically 20cm)
   * @param {number} params.bulkDensityGramsPerCm3 - Bulk density in g/cm3 (default 1.35)
   * @param {number} params.fieldAcreageHectares - Land area in hectares
   * @returns {Object} Gypsum amendment recommendation
   */
  static calculateGypsumRequirement({
    effectiveCec = 10.0,
    currentEspPct = 16.0,
    targetEspPct = 5.0,
    topsoilDepthCm = 20,
    bulkDensityGramsPerCm3 = 1.35,
    fieldAcreageHectares = 2.0
  } = {}) {
    const ecec = Math.max(1.0, Number(effectiveCec) || 10.0);
    const espNow = Math.max(0, Number(currentEspPct) || 0);
    const espTarget = Math.max(1.0, Number(targetEspPct) || 5.0);
    const depth = Math.max(5, Number(topsoilDepthCm) || 20);
    const density = Math.max(0.8, Number(bulkDensityGramsPerCm3) || 1.35);
    const acreage = Math.max(0.1, Number(fieldAcreageHectares) || 1.0);

    if (espNow <= espTarget) {
      return {
        needed: false,
        gypsumDoseKgPerHa: 0,
        gypsumDoseTonsPerHa: 0,
        totalTonsForField: 0,
        advisory: 'Exchangeable Sodium Percentage is within acceptable thresholds (ESP <= 5%). Gypsum amendment is not required.'
      };
    }

    // Formula: Gypsum (kg/ha) = 86 * depth(cm) * bulk_density * ECEC * (ESP_current - ESP_target) / 100
    const deltaEsp = (espNow - espTarget) / 100.0;
    const doseKgPerHa = Math.round(86.0 * depth * density * ecec * deltaEsp);
    const doseTonsPerHa = Number((doseKgPerHa / 1000.0).toFixed(2));
    const totalTonsField = Number((doseTonsPerHa * acreage).toFixed(2));

    return {
      needed: true,
      currentEspPct: espNow,
      targetEspPct: espTarget,
      gypsumDoseKgPerHa: doseKgPerHa,
      gypsumDoseTonsPerHa: doseTonsPerHa,
      totalTonsForField: totalTonsField,
      applicationGuidelines: 'Broadcast agricultural gypsum evenly across field and disk thoroughly to 15cm depth. Apply leaching irrigation to displace sodium cations into subsoil drainage.'
    };
  }
}

module.exports = {
  SoilCationBalanceService,
  ALBRECHT_IDEAL_RANGES
};
