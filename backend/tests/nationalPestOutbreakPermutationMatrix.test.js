/**
 * ==============================================================================
 * 🧪 AGRILY SPRINT 22: NATIONAL 37-STATE × 10-PEST COMBINATORIAL EPIDEMIC MATRIX
 * ==============================================================================
 *
 * Exhaustively verifies:
 *  1. 37 Nigerian Jurisdictions (36 States + FCT) × 10 Tropical Pest Species ×
 *     3 Microclimate Regimes (BIOCONTROL_SUPPRESSED, STANDARD_SEASONAL, DRY_SPELL_SURGE)
 *     = 1,110 total regional entomological outbreak permutations.
 *  2. Epidemic Monotonicity Invariant:
 *     BIOCONTROL_SUPPRESSED incidence <= STANDARD_SEASONAL incidence <= DRY_SPELL_SURGE incidence.
 *  3. Boundary-Layer 24h/48h/72h Migratory Swarm Trajectory & ITCZ Fallout Physics
 *     across all 10 pest flight biomechanics profiles.
 *  4. ISO 22866 Ultra-Low Volume (ULV) Droplet Drift, Stull Wet-Bulb Depression (Delta-T),
 *     and Oil-Carrier Evaporation Mitigation across all 10 species.
 */

const assert = require('assert');
const {
  NATIONAL_STATE_AGRO_REGISTRY,
} = require('../services/nationalAgroZoneYieldBenchmarkEngine');
const {
  PEST_ENTOMOLOGY_CATALOG,
} = require('../services/pestPhenologyAndEilEngine');
const {
  ZONE_PEST_AFFINITY_MULTIPLIERS,
  evaluateStatePestEpidemicRisk,
} = require('../services/nationalPestEpidemicSurveillanceEngine');
const {
  SWARM_FLIGHT_BIOMECHANICS,
  simulateMigratorySwarmTrajectory,
  evaluateUlvSprayDriftAndDeltaT,
} = require('../services/migratorySwarmTrajectoryEngine');

console.log('🧪 Running Sprint 22 National 37-State × 10-Pest Combinatorial Epidemic Matrix...');

const allStates = NATIONAL_STATE_AGRO_REGISTRY;
const allPests = Object.keys(PEST_ENTOMOLOGY_CATALOG);

assert.strictEqual(allStates.length, 37, 'Expected 37 Nigerian jurisdictions');
assert.strictEqual(allPests.length, 10, 'Expected 10 tropical pest species');
assert.strictEqual(
  Object.keys(SWARM_FLIGHT_BIOMECHANICS).length,
  10,
  'Expected 10 flight biomechanics profiles'
);
assert.strictEqual(
  Object.keys(ZONE_PEST_AFFINITY_MULTIPLIERS).length,
  6,
  'Expected 6 agro-ecological zone pest affinity matrices'
);

// 1. Execute 37 States × 10 Pests × 3 Microclimate Regimes = 1,110 Permutations
let permutationsVerified = 0;

for (const stateEntry of allStates) {
  for (const pestKey of allPests) {
    const suppressed = evaluateStatePestEpidemicRisk({
      stateCode: stateEntry.stateCode,
      pestKey,
      microclimateRegime: 'BIOCONTROL_SUPPRESSED',
      monitoredHectares: 1500,
    });

    const standard = evaluateStatePestEpidemicRisk({
      stateCode: stateEntry.stateCode,
      pestKey,
      microclimateRegime: 'STANDARD_SEASONAL',
      monitoredHectares: 1500,
    });

    const drySurge = evaluateStatePestEpidemicRisk({
      stateCode: stateEntry.stateCode,
      pestKey,
      microclimateRegime: 'DRY_SPELL_SURGE',
      monitoredHectares: 1500,
    });

    // Verify Monotonicity Invariant across microclimate & biocontrol regimes
    assert(
      suppressed.estimatedIncidencePct <= standard.estimatedIncidencePct,
      `Expected biocontrol suppressed incidence <= standard in ${stateEntry.stateCode} for ${pestKey}`
    );
    assert(
      standard.estimatedIncidencePct <= drySurge.estimatedIncidencePct,
      `Expected standard incidence <= dry spell surge in ${stateEntry.stateCode} for ${pestKey}`
    );

    // Verify Thermal GDD Velocity Invariant: warmer dry spell accumulates >= GDD/day
    assert(
      drySurge.dailyGdd >= suppressed.dailyGdd,
      `Expected dry spell daily GDD >= suppressed daily GDD in ${stateEntry.stateCode} for ${pestKey}`
    );

    // Verify Value-at-Risk & Pheromone Lure allocation
    assert(
      drySurge.regionalCropValueAtRiskNgn >= suppressed.regionalCropValueAtRiskNgn,
      `Expected higher crop Value-at-Risk under dry spell surge in ${stateEntry.stateCode} for ${pestKey}`
    );
    assert(
      standard.pheromoneLureSeptaRequired === 600,
      'Expected 600 pheromone septa for 1,500 ha (1 trap per 2.5 ha)'
    );

    permutationsVerified += 3;
  }
}

assert.strictEqual(
  permutationsVerified,
  1110,
  'Expected 1,110 state × pest × microclimate permutations verified'
);

// 2. Verify Migratory Swarm Trajectory & ITCZ Fallout Physics across all 10 species
for (const pestKey of allPests) {
  const calmTrajectory = simulateMigratorySwarmTrajectory({
    pestKey,
    originLatitude: 11.5,
    originLongitude: 8.5,
    boundaryLayerWindSpeedKmh: 10.0,
    windBearingDeg: 220,
    boundaryLayerTempC: 27.0,
    itczLatitudeDeg: 10.8,
  });

  const galeTrajectory = simulateMigratorySwarmTrajectory({
    pestKey,
    originLatitude: 11.5,
    originLongitude: 8.5,
    boundaryLayerWindSpeedKmh: 38.0,
    windBearingDeg: 220,
    boundaryLayerTempC: 27.0,
    itczLatitudeDeg: 10.8,
  });

  assert.strictEqual(calmTrajectory.waypoints.length, 3);
  assert(
    calmTrajectory.waypoints[2].cumulativeDistanceKm >
      calmTrajectory.waypoints[0].cumulativeDistanceKm,
    `Expected 72h displacement > 24h displacement for ${pestKey}`
  );
  assert(
    galeTrajectory.total72hDisplacementKm > calmTrajectory.total72hDisplacementKm,
    `Expected stronger boundary-layer wind to increase 72h displacement for ${pestKey}`
  );
}

// 3. Verify ULV Spray Drift, Delta-T Evaporation & Oil Adjuvant Mitigation across all 10 species
for (const pestKey of allPests) {
  const waterCarrierHotDry = evaluateUlvSprayDriftAndDeltaT({
    pestKey,
    dryBulbTempC: 36.0,
    relativeHumidityPct: 28.0,
    windSpeed10mKmh: 16.0,
    releaseHeightMeters: 3.0,
    nozzleVmdMicrons: 110,
    oilBasedCarrier: false,
  });

  const oilCarrierHotDry = evaluateUlvSprayDriftAndDeltaT({
    pestKey,
    dryBulbTempC: 36.0,
    relativeHumidityPct: 28.0,
    windSpeed10mKmh: 16.0,
    releaseHeightMeters: 3.0,
    nozzleVmdMicrons: 110,
    oilBasedCarrier: true,
  });

  assert(
    oilCarrierHotDry.canopyDepositionEfficiencyPct >
      waterCarrierHotDry.canopyDepositionEfficiencyPct,
    `Expected oil-based ULV carrier to reduce evaporative drift loss at high Delta-T for ${pestKey}`
  );
  assert(
    waterCarrierHotDry.mandatoryBufferZoneMeters >= 10,
    `Expected positive mandatory buffer zone for ${pestKey}`
  );
}

console.log(
  `✅ Sprint 22 National Pest Epidemic Matrix Passed (${permutationsVerified} state-pest-regime permutations + 20 trajectory/ULV physics checks verified)!`
);

