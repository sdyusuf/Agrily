/**
 * ==============================================================================
 * 🧪 SPRINT 20 UNIT TESTS: FAO-56 PENMAN-MONTEITH & AGROMETEOROLOGY ENGINE
 * ==============================================================================
 */

const assert = require('assert');
const {
  computeSaturationVaporPressureKpa,
  computeVaporPressureSlopeDelta,
  computePsychrometricParameters,
  convertWindSpeedTo2mMs,
  computePsychrometricProfile,
  calculateFao56Evapotranspiration,
  calculateGrowingDegreeDays,
  evaluateNocturnalFrostMechanics
} = require('../services/agrometeorologyEngine');
const {
  evaluateHourlySprayWindow,
  generateSpraySchedulePlan
} = require('../services/agroSprayWindowAdvisorService');

console.log('🧪 Starting FAO-56 Penman-Monteith & Agrometeorology Engine Unit Tests...');

// 1. Saturation Vapor Pressure & Slope Delta
{
  const es25 = computeSaturationVaporPressureKpa(25.0);
  // At 25°C, standard Tetens saturation vapor pressure is ~3.168 kPa
  assert.ok(es25 > 3.15 && es25 < 3.19, `Expected es(25°C) ~3.168 kPa, got ${es25}`);

  const delta25 = computeVaporPressureSlopeDelta(25.0);
  // At 25°C, Delta is ~0.1888 kPa/°C
  assert.ok(delta25 > 0.185 && delta25 < 0.193, `Expected Delta(25°C) ~0.189 kPa/°C, got ${delta25}`);
  console.log('  ✓ Tetens saturation vapor pressure and slope curve Delta match FAO-56 tables');
}

// 2. Elevation Barometric Pressure & Logarithmic Wind Profile Conversion
{
  const seaLevel = computePsychrometricParameters(0);
  const josPlateau = computePsychrometricParameters(1280);
  assert.strictEqual(seaLevel.pressureKpa, 101.3);
  assert.ok(josPlateau.pressureKpa < 88.0 && josPlateau.pressureKpa > 85.5);
  assert.ok(josPlateau.psychrometricConstantGamma < seaLevel.psychrometricConstantGamma);

  const u2From10m = convertWindSpeedTo2mMs(18.0, 10.0); // 18 km/h = 5.0 m/s at 10m -> ~3.74 m/s at 2m
  assert.ok(u2From10m > 3.6 && u2From10m < 3.9, `Expected u2 ~3.74 m/s, got ${u2From10m}`);
  console.log('  ✓ Barometric pressure, psychrometric constant, and 10m-to-2m logarithmic wind profile verified');
}

// 3. Psychrometric Profile (VPD, Dew Point, Wet-Bulb, Delta-T)
{
  const aridHarmattan = computePsychrometricProfile(36.0, 18.0);
  assert.ok(aridHarmattan.vaporPressureDeficitKpa > 4.5, 'Arid Harmattan should yield VPD > 4.5 kPa');
  assert.strictEqual(aridHarmattan.stomatalStressClass, 'Severe Stomatal Closure / Desiccation Lockout');
  assert.ok(aridHarmattan.deltaTCelsius > 14.0, 'Arid Harmattan should produce high Delta-T');

  const humidForest = computePsychrometricProfile(24.0, 94.0);
  assert.ok(humidForest.vaporPressureDeficitKpa < 0.3);
  assert.strictEqual(humidForest.stomatalStressClass, 'Low VPD / High Fungal Condensation Risk');
  console.log('  ✓ Psychrometric profile accurately classifies Harmattan desiccation vs. humid condensation');
}

// 4. FAO-56 Penman-Monteith Reference ET0 & Crop ETc
{
  const kanoIrrigatedMaize = calculateFao56Evapotranspiration({
    minTempCelsius: 22.0,
    maxTempCelsius: 36.0,
    relativeHumidityPct: 32.0,
    windSpeedKmh: 14.5,
    solarIrradianceWm2: 650,
    elevationMeters: 472,
    cropType: 'Maize',
    phenologyStage: 'Mid-Season'
  });

  assert.ok(kanoIrrigatedMaize.referenceEt0MmDay > 5.0 && kanoIrrigatedMaize.referenceEt0MmDay < 10.5);
  assert.strictEqual(kanoIrrigatedMaize.cropCoefficientKc, 1.2);
  assert.ok(kanoIrrigatedMaize.cropEvapotranspirationEtcMmDay > kanoIrrigatedMaize.referenceEt0MmDay);
  assert.strictEqual(
    kanoIrrigatedMaize.grossIrrigationLitersPerHectare,
    Math.round(kanoIrrigatedMaize.cropEvapotranspirationEtcMmDay * 10000)
  );
  console.log('  ✓ FAO-56 Penman-Monteith ET0 and Crop ETc (Kc) irrigation volumes verified');
}

// 5. Growing Degree Days (GDD) & Nocturnal Radiative Frost Mechanics
{
  const gddOptimal = calculateGrowingDegreeDays({
    minTempCelsius: 18.0,
    maxTempCelsius: 30.0,
    cropType: 'Maize'
  });
  assert.strictEqual(gddOptimal.gddIncrement, 14.0);
  assert.strictEqual(gddOptimal.thermalStressStatus, 'Optimal Thermal Accumulation');

  const frostEval = evaluateNocturnalFrostMechanics({
    airTempCelsius: 2.8,
    dewPointCelsius: -2.5,
    cloudCoverPct: 5,
    windSpeedKmh: 2.5,
    cropType: 'Potato'
  });
  assert.ok(frostEval.estimatedCanopyTempCelsius < 0.5, 'Clear calm night should depress canopy below 0.5°C');
  assert.strictEqual(frostEval.frostMechanism, 'Radiative Inversion Frost');
  assert.ok(frostEval.frostProbabilityPct >= 75);
  assert.strictEqual(frostEval.isBlackFrostRisk, true);
  console.log('  ✓ Growing Degree Days (GDD) and Nocturnal Radiative Black Frost mechanics verified');
}

// 6. Agro Spray Window Advisor (Delta-T, Drift, Inversion, Rain Wash-Off)
{
  const optimalFrame = evaluateHourlySprayWindow({
    airTempCelsius: 25.0,
    relativeHumidityPct: 62.0,
    windSpeedKmh: 7.5,
    precipitationMm: 0,
    precipitationProbabilityPct: 10,
    solarIrradianceWm2: 340
  });
  assert.strictEqual(optimalFrame.status, 'Optimal Window');
  assert.ok(optimalFrame.suitabilityScore >= 85);

  const driftLockout = evaluateHourlySprayWindow({
    airTempCelsius: 27.0,
    relativeHumidityPct: 55.0,
    windSpeedKmh: 21.0
  });
  assert.strictEqual(driftLockout.status, 'High Drift Risk');

  const schedule = generateSpraySchedulePlan([
    { observationTimestamp: '2024-10-12T06:00:00Z', airTempCelsius: 23, relativeHumidityPct: 68, windSpeedKmh: 6.5, solarIrradianceWm2: 210 },
    { observationTimestamp: '2024-10-12T07:00:00Z', airTempCelsius: 25, relativeHumidityPct: 64, windSpeedKmh: 7.5, solarIrradianceWm2: 340 },
    { observationTimestamp: '2024-10-12T08:00:00Z', airTempCelsius: 26, relativeHumidityPct: 60, windSpeedKmh: 8.5, solarIrradianceWm2: 460 },
    { observationTimestamp: '2024-10-12T13:00:00Z', airTempCelsius: 37, relativeHumidityPct: 22, windSpeedKmh: 18.0, solarIrradianceWm2: 880 }
  ]);
  assert.strictEqual(schedule.totalHoursEvaluated, 4);
  assert.strictEqual(schedule.optimalHoursCount, 3);
  assert.ok(schedule.recommendedWindow);
  assert.strictEqual(schedule.recommendedWindow.durationHours, 3);
  console.log('  ✓ Agro Spray Window Advisor evaluates Delta-T, wind drift, and 3-hour optimal boom blocks');
}

console.log('✅ All FAO-56 Penman-Monteith & Agrometeorology Engine tests passed!');
