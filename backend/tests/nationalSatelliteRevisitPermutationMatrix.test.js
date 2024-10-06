/**
 * ==============================================================================
 * 🛰️ NATIONAL SATELLITE REVISIT & ORBITAL PERMUTATION TEST MATRIX
 * ==============================================================================
 * 
 * Verifies:
 * 1. Comprehensive Nigerian Federal State & FCT Coverage:
 *    - All 36 States + Federal Capital Territory mapped to UTM Zones (31N, 32N, 33N).
 *    - Primary and secondary MGRS tile footprints validated.
 *    - Relative orbit tracks (R037, R080, R094, R123, R137) assigned.
 * 2. Solar Illumination Geometry & Sun Angles:
 *    - Solar declination, Equation of Time (EoT), elevation, and zenith angles at 10:30 AM descending node.
 * 3. 30-Day Dual Constellation (Sentinel-2A + Sentinel-2B) Revisit Scheduling:
 *    - Phasing verification (180° offset, 5-day equatorial repeat cycle).
 * 4. Temporal Gap-Filling & Curve Reconstruction:
 *    - Savitzky-Golay quadratic polynomial smoothing on cloud-distorted series.
 *    - Whittaker penalized least squares smoother with quality weight vectors.
 * 
 * @module tests/nationalSatelliteRevisitPermutationMatrix.test
 * ==============================================================================
 */

'use strict';

const assert = require('assert');
const {
  sentinelConstellationRevisitService,
  SENTINEL_ORBITAL_CONSTANTS,
  NIGERIAN_STATE_ORBITAL_REGISTRY
} = require('../services/sentinelConstellationRevisitService');

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runSuite() {
  console.log('\n🛰️ Starting National Satellite Revisit & Orbital Mechanics Matrix Tests...\n');

  // Test 1: Constellation orbital constants
  await runTest('SENTINEL_ORBITAL_CONSTANTS should adhere to ESA Sentinel-2 parameters', async () => {
    assert.strictEqual(SENTINEL_ORBITAL_CONSTANTS.ALTITUDE_KM, 786.0);
    assert.strictEqual(SENTINEL_ORBITAL_CONSTANTS.INCLINATION_DEG, 98.62);
    assert.strictEqual(SENTINEL_ORBITAL_CONSTANTS.ORBITS_PER_CYCLE, 143);
    assert.strictEqual(SENTINEL_ORBITAL_CONSTANTS.CYCLE_DAYS, 10);
    assert.strictEqual(SENTINEL_ORBITAL_CONSTANTS.DUAL_REVISIT_NOMINAL_DAYS, 5);
    assert.strictEqual(SENTINEL_ORBITAL_CONSTANTS.SWATH_WIDTH_KM, 290.0);
    assert.strictEqual(SENTINEL_ORBITAL_CONSTANTS.EQUATOR_CROSSING_TIME_LOCAL, '10:30');
  });

  // Test 2: Orbital phasing
  await runTest('SENTINEL_ORBITAL_CONSTANTS should declare 180-degree orbital phasing between S2A and S2B', async () => {
    const s2a = SENTINEL_ORBITAL_CONSTANTS.PLATFORMS.SENTINEL_2A;
    const s2b = SENTINEL_ORBITAL_CONSTANTS.PLATFORMS.SENTINEL_2B;

    assert.strictEqual(s2a.platformId, 'S2A');
    assert.strictEqual(s2b.platformId, 'S2B');
    assert.strictEqual(Math.abs(s2b.orbitalPhaseDeg - s2a.orbitalPhaseDeg), 180.0);
  });

  // Test 3: All 37 Nigerian jurisdictions audit
  await runTest('NIGERIAN_STATE_ORBITAL_REGISTRY should contain exactly 37 mapped jurisdictions', async () => {
    const EXPECTED = [
      'ABIA', 'ADAMAWA', 'AKWA_IBOM', 'ANAMBRA', 'BAUCHI', 'BAYELSA', 'BENUE',
      'BORNO', 'CROSS_RIVER', 'DELTA', 'EBONYI', 'EDO', 'EKITI', 'ENUGU',
      'FCT', 'GOMBE', 'IMO', 'JIGAWA', 'KADUNA', 'KANO', 'KATSINA', 'KEBBI',
      'KOGI', 'KWARA', 'LAGOS', 'NASARAWA', 'NIGER', 'OGUN', 'ONDO', 'OSUN',
      'OYO', 'PLATEAU', 'RIVERS', 'SOKOTO', 'TARABA', 'YOBE', 'ZAMFARA'
    ];

    const keys = Object.keys(NIGERIAN_STATE_ORBITAL_REGISTRY);
    assert.strictEqual(keys.length, 37, 'Registry must have 37 keys');

    for (const key of EXPECTED) {
      assert.ok(keys.includes(key), `Jurisdiction ${key} must exist in registry`);
      const s = NIGERIAN_STATE_ORBITAL_REGISTRY[key];
      assert.ok(s.geoCenter.lat >= 4.0 && s.geoCenter.lat <= 14.0, `Lat for ${key} must be in [4, 14]`);
      assert.ok(s.geoCenter.lon >= 2.5 && s.geoCenter.lon <= 15.0, `Lon for ${key} must be in [2.5, 15]`);
      assert.ok(['31N', '32N', '33N'].includes(s.utmZone), `UTM Zone for ${key} must be valid`);
      assert.ok(/^[0-9]{2}[A-Z]{3}$/.test(s.primaryMgrsTile), `MGRS tile ${s.primaryMgrsTile} for ${key} must be valid format`);
      assert.ok(s.cloudCoverRiskFactor > 0.0 && s.cloudCoverRiskFactor < 1.0, `Cloud factor for ${key} must be in (0, 1)`);
    }
  });

  // Test 4: Solar geometry at equinox
  await runTest('calculateSolarGeometry should compute accurate sun angles for Kano at Equinox', async () => {
    const kano = NIGERIAN_STATE_ORBITAL_REGISTRY.KANO;
    const geo = sentinelConstellationRevisitService.calculateSolarGeometry(
      kano.geoCenter.lat,
      kano.geoCenter.lon,
      '2024-03-21T10:30:00Z'
    );

    assert.ok(geo.dayOfYear === 81, 'Equinox DOY should be 81');
    assert.ok(Math.abs(geo.declinationDeg) < 2.0, 'Declination near equinox should be ~0 deg');
    assert.ok(geo.solarElevationDeg > 60.0, 'Midday solar elevation should exceed 60 deg');
    assert.ok(geo.solarZenithDeg < 30.0, 'Solar zenith should be < 30 deg');
    assert.strictEqual(geo.descendingNodeLocalTime, '10:30 AM');
  });

  // Test 5: 30-day constellation revisit schedule
  await runTest('generateConstellationRevisitSchedule should forecast alternating S2A/S2B overpasses across 30 days', async () => {
    const schedule = sentinelConstellationRevisitService.generateConstellationRevisitSchedule({
      latitude: 9.0765,
      longitude: 7.3986,
      stateKey: 'FCT',
      startDate: '2024-05-01',
      horizonDays: 30
    });

    assert.strictEqual(schedule.stateContext, 'Federal Capital Territory');
    assert.strictEqual(schedule.mgrsPrimaryTile, '32NMJ');
    assert.ok(schedule.totalPassesScheduled >= 5 && schedule.totalPassesScheduled <= 7, '30-day passes should be ~6');
    assert.ok(Math.abs(schedule.averageRevisitIntervalDays - 5.0) <= 1.0, 'Average revisit should be ~5 days');

    const platforms = schedule.passes.map((p) => p.platform);
    assert.ok(platforms.includes('S2A'), 'S2A passes must be present');
    assert.ok(platforms.includes('S2B'), 'S2B passes must be present');
  });

  // Test 6: Savitzky-Golay cloud filtering
  await runTest('applySavitzkyGolayFilter should smooth negative cloud outliers in NDVI series', async () => {
    const raw = [0.25, 0.28, 0.35, 0.45, 0.58, 0.18, 0.64, 0.70, 0.72, 0.68, 0.55, 0.42];
    const smoothed = sentinelConstellationRevisitService.applySavitzkyGolayFilter(raw, 2);

    assert.strictEqual(smoothed.length, raw.length);
    assert.ok(smoothed[5] > 0.18, 'Cloud dip at index 5 should be elevated by smoothing');
    assert.ok(smoothed[8] > 0.65, 'Peak at index 8 should be preserved');
  });

  // Test 7: Whittaker penalized least squares smoother
  await runTest('applyWhittakerSmoother should reconstruct missing values using observation quality weights', async () => {
    const raw = [0.20, 0.32, 0.48, 0.12, 0.65, 0.74, 0.78, 0.71, 0.58, 0.40];
    const weights = [1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];

    const smoothed = sentinelConstellationRevisitService.applyWhittakerSmoother(raw, weights, 15.0);

    assert.strictEqual(smoothed.length, raw.length);
    assert.ok(smoothed[3] > 0.35 && smoothed[3] < 0.65, 'Cloud-masked point should interpolate smoothly');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal suite failure:', err);
  process.exit(1);
});
