/**
 * @file fleetEmissionCreditCalculatorService.js
 * @description Green Agro-Haulage Carbon Offset & Clean Emission Credit Calculator
 * Calculates CO2 emission baselines, carbon tax offset certificates, and ESG eco-credits
 * for sustainable agricultural transport fleets operating across Nigeria.
 */

const crypto = require('crypto');

/**
 * Statutory Emission Standards (kg CO2 per Ton-Km)
 */
const BASELINE_EMISSION_STANDARDS = {
  HEAVY_DIESEL_HAULER_BASELINE: 0.082, // Standard unoptimized diesel hauler
  OPTIMIZED_ECO_CARRIER_TARGET: 0.055, // Eco-optimized carrier target
  CARBON_CREDIT_VALUE_PER_TON_CO2_NGN: 18500 // Statutory carbon offset credit rate
};

class FleetEmissionCreditCalculatorService {
  /**
   * Calculates carbon credits earned by eco-efficient carrier fleets
   */
  static evaluateCarbonOffsetCredits({
    carrierCode,
    totalDistanceKm = 1000,
    tonnageHauled = 20.0,
    actualFuelConsumedLitres = 280,
    ecoDrivingScore = 90
  }) {
    const dist = Math.max(1, parseFloat(totalDistanceKm) || 1);
    const tons = Math.max(0.1, parseFloat(tonnageHauled) || 1);
    const tonKm = dist * tons;

    // Actual CO2 emitted (1L Diesel = ~2.68 kg CO2)
    const actualCo2Kg = parseFloat((actualFuelConsumedLitres * 2.68).toFixed(1));
    const actualCo2PerTonKm = parseFloat((actualCo2Kg / tonKm).toFixed(4));

    // Baseline unoptimized comparison
    const unoptimizedBaselineCo2Kg = parseFloat((tonKm * BASELINE_EMISSION_STANDARDS.HEAVY_DIESEL_HAULER_BASELINE).toFixed(1));
    const co2SavedKg = Math.max(0, parseFloat((unoptimizedBaselineCo2Kg - actualCo2Kg).toFixed(1)));
    const co2SavedTonnes = parseFloat((co2SavedKg / 1000).toFixed(3));

    // Monetary value of carbon credits earned
    const carbonCreditEarnedNgn = Math.round(co2SavedTonnes * BASELINE_EMISSION_STANDARDS.CARBON_CREDIT_VALUE_PER_TON_CO2_NGN);

    // Eco-bonus factor
    let esgRating = 'STANDARD_EMITTING';
    if (ecoDrivingScore >= 90 && co2SavedKg > 100) esgRating = 'TIER_1_GREEN_PIONEER';
    else if (ecoDrivingScore >= 75 && co2SavedKg > 50) esgRating = 'TIER_2_ECO_COMPLIANT';

    const certificateId = `CARBON-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const payload = `${certificateId}|${carrierCode}|${tonKm}|${actualCo2Kg}|${co2SavedKg}|${carbonCreditEarnedNgn}`;
    const digitalCreditSeal = crypto.createHash('sha256').update(payload).digest('hex');

    return {
      certificateId,
      carrierCode,
      totalDistanceCoveredKm: dist,
      tonnageHauledTonnes: tons,
      totalTonKmApportioned: Math.round(tonKm),
      actualFuelConsumedLitres,
      actualCo2EmittedKg: actualCo2Kg,
      actualCo2PerTonKmKg: actualCo2PerTonKm,
      unoptimizedBaselineCo2Kg,
      co2SavedKg,
      co2SavedTonnes,
      carbonCreditEarnedNgn,
      esgRating,
      digitalCreditSeal,
      issuedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  FleetEmissionCreditCalculatorService,
  BASELINE_EMISSION_STANDARDS
};
