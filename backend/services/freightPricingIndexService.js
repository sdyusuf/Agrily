/**
 * @file freightPricingIndexService.js
 * @description Dynamic Freight Pricing & Regional Rate Indexing Service
 * Computes live haulage quotes across Nigerian trade corridors incorporating
 * diesel inflation indexing, cold-chain assurance premiums, and seasonal demand factors.
 */

const crypto = require('crypto');

/**
 * Standard Nigerian Agro-Freight Corridor Benchmarks
 */
const NIGERIAN_CORRIDOR_BENCHMARKS = [
  {
    benchmarkCode: 'BENCH-KN-LOS-01',
    corridorName: 'Kano-Kaduna-Abuja-Lagos Grain Expressway',
    originState: 'KANO',
    destinationState: 'LAGOS',
    distanceKm: 995,
    estimatedTransitHours: 34,
    baseTariffPerTonKmNgn: 32.50,
    dieselBenchmarkPriceNgn: 950,
    dieselSensitivityCoeff: 0.45,
    reeferColdChainPremiumPct: 22.0,
    securityRiskLevel: 'LOW_STANDARD_PATROL',
    statutoryTollsAndLeviesNgn: 12500,
    minimumConsignmentTariffNgn: 75000,
    seasonalMultipliers: { rainySeasonPeak: 1.18, drySeasonHarvest: 1.12, offSeasonBaseline: 1.00 }
  },
  {
    benchmarkCode: 'BENCH-JS-PH-02',
    corridorName: 'Jos-Benue-Enugu-Port Harcourt Fresh Produce Corridor',
    originState: 'PLATEAU',
    destinationState: 'RIVERS',
    distanceKm: 760,
    estimatedTransitHours: 26,
    baseTariffPerTonKmNgn: 38.00,
    dieselBenchmarkPriceNgn: 950,
    dieselSensitivityCoeff: 0.50,
    reeferColdChainPremiumPct: 28.0,
    securityRiskLevel: 'MEDIUM_CONVOY_ADVISED',
    statutoryTollsAndLeviesNgn: 9500,
    minimumConsignmentTariffNgn: 65000,
    seasonalMultipliers: { rainySeasonPeak: 1.25, drySeasonHarvest: 1.15, offSeasonBaseline: 1.00 }
  },
  {
    benchmarkCode: 'BENCH-BN-LOS-03',
    corridorName: 'Makurdi-Lokoja-Ore-Lagos Yam & Citrus Trunk',
    originState: 'BENUE',
    destinationState: 'LAGOS',
    distanceKm: 680,
    estimatedTransitHours: 22,
    baseTariffPerTonKmNgn: 34.00,
    dieselBenchmarkPriceNgn: 950,
    dieselSensitivityCoeff: 0.45,
    reeferColdChainPremiumPct: 20.0,
    securityRiskLevel: 'LOW_STANDARD_PATROL',
    statutoryTollsAndLeviesNgn: 8500,
    minimumConsignmentTariffNgn: 60000,
    seasonalMultipliers: { rainySeasonPeak: 1.20, drySeasonHarvest: 1.10, offSeasonBaseline: 1.00 }
  },
  {
    benchmarkCode: 'BENCH-ON-LOS-04',
    corridorName: 'Akure-Ondo-Sagamu-Lagos Cocoa Belt',
    originState: 'ONDO',
    destinationState: 'LAGOS',
    distanceKm: 310,
    estimatedTransitHours: 7.5,
    baseTariffPerTonKmNgn: 42.00,
    dieselBenchmarkPriceNgn: 950,
    dieselSensitivityCoeff: 0.40,
    reeferColdChainPremiumPct: 15.0,
    securityRiskLevel: 'LOW_STANDARD_PATROL',
    statutoryTollsAndLeviesNgn: 4500,
    minimumConsignmentTariffNgn: 40000,
    seasonalMultipliers: { rainySeasonPeak: 1.15, drySeasonHarvest: 1.22, offSeasonBaseline: 1.00 }
  },
  {
    benchmarkCode: 'BENCH-SK-IBD-05',
    corridorName: 'Sokoto-Kebbi-Ilorin-Ibadan Onion & Grain Route',
    originState: 'SOKOTO',
    destinationState: 'OYO',
    distanceKm: 840,
    estimatedTransitHours: 28,
    baseTariffPerTonKmNgn: 35.00,
    dieselBenchmarkPriceNgn: 950,
    dieselSensitivityCoeff: 0.48,
    reeferColdChainPremiumPct: 25.0,
    securityRiskLevel: 'MEDIUM_CONVOY_ADVISED',
    statutoryTollsAndLeviesNgn: 11000,
    minimumConsignmentTariffNgn: 68000,
    seasonalMultipliers: { rainySeasonPeak: 1.20, drySeasonHarvest: 1.15, offSeasonBaseline: 1.00 }
  },
  {
    benchmarkCode: 'BENCH-MD-ABJ-06',
    corridorName: 'Maiduguri-Bauchi-Jos-Abuja Cowpea & Cattle Corridor',
    originState: 'BORNO',
    destinationState: 'ABUJA',
    distanceKm: 820,
    estimatedTransitHours: 30,
    baseTariffPerTonKmNgn: 39.50,
    dieselBenchmarkPriceNgn: 950,
    dieselSensitivityCoeff: 0.52,
    reeferColdChainPremiumPct: 30.0,
    securityRiskLevel: 'HIGH_RISK_ESCORT_REQUIRED',
    statutoryTollsAndLeviesNgn: 14000,
    minimumConsignmentTariffNgn: 75000,
    seasonalMultipliers: { rainySeasonPeak: 1.25, drySeasonHarvest: 1.12, offSeasonBaseline: 1.00 }
  }
];

class FreightPricingIndexService {
  /**
   * Returns list of all pre-configured corridor rate benchmarks
   */
  static getAllCorridorBenchmarks() {
    return NIGERIAN_CORRIDOR_BENCHMARKS;
  }

  /**
   * Finds matching benchmark or synthesizes generic distance-based benchmark
   */
  static findOrSynthesizeBenchmark(originState, destinationState) {
    const orig = (originState || '').toUpperCase().trim();
    const dest = (destinationState || '').toUpperCase().trim();

    const match = NIGERIAN_CORRIDOR_BENCHMARKS.find(
      b => b.originState === orig && b.destinationState === dest
    );

    if (match) return match;

    // Approximate interstate distance fallback
    const estimatedDistanceKm = orig === dest ? 80 : 550;
    const estimatedHours = Math.max(2, Math.round(estimatedDistanceKm / 40));

    return {
      benchmarkCode: `BENCH-GEN-${orig.slice(0, 3)}-${dest.slice(0, 3)}`,
      corridorName: `${originState || 'Domestic'} to ${destinationState || 'Domestic'} Inter-State Route`,
      originState: orig,
      destinationState: dest,
      distanceKm: estimatedDistanceKm,
      estimatedTransitHours: estimatedHours,
      baseTariffPerTonKmNgn: 36.00,
      dieselBenchmarkPriceNgn: 950,
      dieselSensitivityCoeff: 0.45,
      reeferColdChainPremiumPct: 25.0,
      securityRiskLevel: 'LOW_STANDARD_PATROL',
      statutoryTollsAndLeviesNgn: 6500,
      minimumConsignmentTariffNgn: 45000,
      seasonalMultipliers: { rainySeasonPeak: 1.20, drySeasonHarvest: 1.12, offSeasonBaseline: 1.00 }
    };
  }

  /**
   * Calculates live haulage freight quote with granular line-item breakdown
   */
  static calculateTariffQuote({
    originState,
    destinationState,
    tonnage = 1.0,
    isTemperatureControlled = false,
    currentDieselPriceNgn = 950,
    season = 'DRY_SEASON_HARVEST'
  }) {
    const benchmark = this.findOrSynthesizeBenchmark(originState, destinationState);
    const tons = Math.max(0.1, parseFloat(tonnage) || 1.0);
    const distance = benchmark.distanceKm;

    // 1. Base Freight Subtotal
    const rawBaseFreight = distance * tons * benchmark.baseTariffPerTonKmNgn;

    // 2. Diesel Surcharge / Rebate
    const benchmarkDiesel = benchmark.dieselBenchmarkPriceNgn || 950;
    const dieselRatio = (currentDieselPriceNgn - benchmarkDiesel) / benchmarkDiesel;
    const fuelSurchargePct = Math.max(-0.15, dieselRatio * benchmark.dieselSensitivityCoeff);
    const fuelSurchargeNgn = Math.round(rawBaseFreight * fuelSurchargePct);

    // 3. Cold Chain Reefer Premium
    let reeferPremiumNgn = 0;
    if (isTemperatureControlled) {
      reeferPremiumNgn = Math.round(rawBaseFreight * (benchmark.reeferColdChainPremiumPct / 100));
    }

    // 4. Seasonal Demand Multiplier
    let seasonalMult = benchmark.seasonalMultipliers.drySeasonHarvest || 1.12;
    if (season === 'RAINY_SEASON_PEAK') {
      seasonalMult = benchmark.seasonalMultipliers.rainySeasonPeak || 1.20;
    } else if (season === 'OFF_SEASON_BASELINE') {
      seasonalMult = benchmark.seasonalMultipliers.offSeasonBaseline || 1.00;
    }

    // 5. Security & Checkpoint Escorts
    let securitySurchargeNgn = 0;
    if (benchmark.securityRiskLevel === 'HIGH_RISK_ESCORT_REQUIRED') {
      securitySurchargeNgn = 35000;
    } else if (benchmark.securityRiskLevel === 'MEDIUM_CONVOY_ADVISED') {
      securitySurchargeNgn = 15000;
    }

    // Subtotal before tolls
    let calculatedFreight = (rawBaseFreight + fuelSurchargeNgn + reeferPremiumNgn) * seasonalMult;
    calculatedFreight += (benchmark.statutoryTollsAndLeviesNgn || 0) + securitySurchargeNgn;

    // Floor tariff protection
    const finalTariffNgn = Math.max(benchmark.minimumConsignmentTariffNgn, Math.round(calculatedFreight));
    const effectiveRatePerTonKm = parseFloat((finalTariffNgn / (distance * tons)).toFixed(2));

    const quoteId = `QT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    return {
      quoteId,
      corridorCode: benchmark.benchmarkCode,
      corridorName: benchmark.corridorName,
      originState: benchmark.originState,
      destinationState: benchmark.destinationState,
      distanceKm: distance,
      estimatedTransitHours: benchmark.estimatedTransitHours,
      tonnage: tons,
      isTemperatureControlled,
      rawBaseFreightNgn: Math.round(rawBaseFreight),
      fuelSurchargeNgn,
      fuelSurchargePct: parseFloat((fuelSurchargePct * 100).toFixed(1)),
      reeferPremiumNgn,
      securitySurchargeNgn,
      statutoryTollsNgn: benchmark.statutoryTollsAndLeviesNgn,
      seasonApplied: season,
      seasonMultiplier: seasonalMult,
      finalTariffNgn,
      effectiveRatePerTonKmNgn: effectiveRatePerTonKm,
      quoteValidUntil: new Date(Date.now() + 7 * 24 * 3600000).toISOString()
    };
  }
}

module.exports = {
  FreightPricingIndexService,
  NIGERIAN_CORRIDOR_BENCHMARKS
};
