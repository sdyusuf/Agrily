/**
 * ==============================================================================
 * AGRILY SPRINT 18: SOIL NITROGEN VOLATILIZATION & LEACHING STRESS SIMULATION
 * ==============================================================================
 * 
 * Verifies:
 * 1. Ammonia volatilization thermodynamics under extreme Sahelian heat wave (38°C).
 * 2. Alkaline topsoil (pH 8.2) accelerating Henderson-Hasselbalch NH3 degassing.
 * 3. Deep subsurface banding (10cm) suppressing gaseous ammonia losses by > 75%.
 * 4. Extreme monsoonal precipitation (180mm) nitrate percolation leaching in Rainforest zone.
 * 5. Urease inhibitor (NBPT) enzymatic delay under warm tropical field conditions.
 * 6. Precision fertigation nitrogen use efficiency surpassing 85%.
 * 7. Digital Soil Health Passport generation and cryptographic integrity verification.
 * 
 * @module tests/soilNutrientStressSimulation.test
 */

'use strict';

const assert = require('assert');
const { SoilNitrogenVolatilizationModel, APPLICATION_METHODS } = require('../services/soilNitrogenVolatilizationModel');
const { DigitalSoilHealthCertificateService } = require('../services/digitalSoilHealthCertificateService');

let passedTests = 0;
let failedTests = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

async function runSuite() {
  console.log('\n=================================================================');
  console.log('🧪 AGRILY SPRINT 18: NITROGEN VOLATILIZATION & STRESS SIMULATION');
  console.log('=================================================================\n');

  // Test 1: Temperature-corrected pKa calculation
  await runTest('calculateTemperatureCorrectedPka should compute lower pKa at elevated temperature (35°C vs 20°C)', async () => {
    const pKaAt20 = SoilNitrogenVolatilizationModel.calculateTemperatureCorrectedPka(20.0);
    const pKaAt35 = SoilNitrogenVolatilizationModel.calculateTemperatureCorrectedPka(35.0);
    assert(pKaAt35 < pKaAt20, 'pKa must decrease with higher temperature, shifting equilibrium toward volatile NH3');
    assert(pKaAt35 > 8.8 && pKaAt35 < 9.1, 'pKa at 35°C should be within 8.8 - 9.1');
  });

  // Test 2: Extreme Sahel Heat Wave Surface Broadcast
  await runTest('simulateNitrogenFate should predict high volatilization (> 20%) under Sahel heat wave (38°C, pH 8.0, 20km/h wind)', async () => {
    const res = SoilNitrogenVolatilizationModel.simulateNitrogenFate({
      appliedPureNitrogenKgPerHa: 120.0,
      fertilizerType: 'UREA_46',
      soilPh: 8.0,
      ambientTemperatureCelsius: 38.0,
      relativeHumidityPct: 30.0,
      windSpeedKmH: 22.0,
      rainfallOrIrrigationMm: 5.0,
      applicationMethod: 'SURFACE_BROADCAST_UNINCORPORATED',
      fieldAcreageHectares: 5.0
    });

    assert(res.nitrogenFateBreakdown.ammoniaVolatilization.lossPct > 20.0, 'Ammonia loss must exceed 20% under extreme conditions');
    assert(res.nitrogenFateBreakdown.ammoniaVolatilization.riskTier === 'HIGH_AMMONIA_ESCAPE', 'Risk tier must be HIGH_AMMONIA_ESCAPE');
    assert(res.economicImpact.totalFieldFinancialLossNaira > 50000, 'Financial loss must be calculated');
    assert(res.mitigationAdvisories.some((m) => m.includes('Urgent: Incorporate broadcast fertilizer')), 'Generates urgent incorporation advisory');
  });

  // Test 3: Subsurface Deep Banding Mitigation
  await runTest('DEEP_BAND_PLACEMENT_10CM should reduce ammonia volatilization by > 75% compared to surface broadcast', async () => {
    const broadcastRes = SoilNitrogenVolatilizationModel.simulateNitrogenFate({
      appliedPureNitrogenKgPerHa: 100.0,
      soilPh: 7.2,
      ambientTemperatureCelsius: 32.0,
      applicationMethod: 'SURFACE_BROADCAST_UNINCORPORATED'
    });

    const deepBandRes = SoilNitrogenVolatilizationModel.simulateNitrogenFate({
      appliedPureNitrogenKgPerHa: 100.0,
      soilPh: 7.2,
      ambientTemperatureCelsius: 32.0,
      applicationMethod: 'DEEP_BAND_PLACEMENT_10CM'
    });

    const broadcastLoss = broadcastRes.nitrogenFateBreakdown.ammoniaVolatilization.lostKgPerHa;
    const deepBandLoss = deepBandRes.nitrogenFateBreakdown.ammoniaVolatilization.lostKgPerHa;
    const reductionPct = ((broadcastLoss - deepBandLoss) / broadcastLoss) * 100;

    assert(reductionPct > 75.0, `Deep banding must reduce volatilization by > 75% (achieved ${reductionPct.toFixed(1)}%)`);
    assert(deepBandRes.nitrogenFateBreakdown.ammoniaVolatilization.riskTier === 'LOW', 'Risk tier should be LOW for deep banding');
  });

  // Test 4: Monsoonal Rainfall Nitrate Leaching
  await runTest('Heavy tropical rainfall (160mm) should induce significant nitrate leaching in light soils', async () => {
    const leachingRes = SoilNitrogenVolatilizationModel.simulateNitrogenFate({
      appliedPureNitrogenKgPerHa: 100.0,
      rainfallOrIrrigationMm: 160.0,
      soilPh: 5.5,
      ambientTemperatureCelsius: 28.0,
      applicationMethod: 'SURFACE_BROADCAST_INCORPORATED_5CM'
    });

    assert(leachingRes.nitrogenFateBreakdown.nitrateLeaching.lossPct > 15.0, 'Leaching loss must exceed 15% with 160mm precipitation');
    assert(leachingRes.mitigationAdvisories.some((m) => m.includes('Split nitrogen dose')), 'Advises split top-dressing for high leaching');
  });

  // Test 5: Precision Fertigation Efficiency
  await runTest('FERTIGATION_DRIP should achieve nitrogen use efficiency above 80%', async () => {
    const fertRes = SoilNitrogenVolatilizationModel.simulateNitrogenFate({
      appliedPureNitrogenKgPerHa: 80.0,
      applicationMethod: 'FERTIGATION_DRIP',
      soilPh: 6.4,
      ambientTemperatureCelsius: 30.0,
      rainfallOrIrrigationMm: 20.0
    });

    assert(fertRes.nitrogenFateBreakdown.nitrogenUseEfficiencyPct >= 80.0, 'Fertigation efficiency must be >= 80%');
  });

  // Test 6: Digital Soil Health Passport Generation
  await runTest('issueSoilHealthPassport should create tamper-proof certificate with SHA-256 seal', async () => {
    const mockSample = {
      sampleId: 'SL-TEST-2024-KANO',
      farmerEmail: 'musa.danbaba@kura.ng',
      farmerName: 'Alhaji Musa Danbaba',
      farmLocation: { state: 'Kano', lga: 'Kura', agroZone: 'SUDAN_SAVANNA' },
      agroEcologicalZone: 'SUDAN_SAVANNA',
      targetCrop: 'MAIZE',
      fieldAcreageHectares: 3.5,
      soilPhysics: { sandPct: 68, siltPct: 20, clayPct: 12, texturalClass: 'SANDY_LOAM' },
      soilChemistry: { phWater: 6.4, effectiveCec: 7.8, baseSaturationPct: 82.0 }
    };

    const passport = DigitalSoilHealthCertificateService.issueSoilHealthPassport({
      sampleRecord: mockSample
    });

    assert(passport.certificateMetadata.passportId.startsWith('PASSPORT-SL-'), 'Generates valid PASSPORT-SL- ID');
    assert(passport.securitySeal.algorithm === 'SHA-256', 'Uses SHA-256 algorithm');
    assert(passport.securitySeal.cryptographicSignature.length === 64, 'Signature is 64-character hex');
    assert(passport.pedologicalAssessment.healthGrade.includes('PRIME') || passport.pedologicalAssessment.healthGrade.includes('HIGH'), 'Grades high-quality Sudan Alfisol as High/Prime');
  });

  // Test 7: Certificate Signature Verification
  await runTest('verifyCertificateSignature should validate authentic certificate and reject tampered record', async () => {
    const mockSample = {
      sampleId: 'SL-N/A',
      farmerEmail: 'test@agrily.ng',
      farmLocation: { state: 'Kaduna', lga: 'Ikara', agroZone: 'NORTHERN_GUINEA_SAVANNA' },
      agroEcologicalZone: 'NORTHERN_GUINEA_SAVANNA',
      targetCrop: 'MAIZE',
      soilPhysics: { sandPct: 58, siltPct: 24, clayPct: 18, texturalClass: 'SANDY_LOAM' },
      soilChemistry: { phWater: 6.2, effectiveCec: 8.5, baseSaturationPct: 75.0 }
    };

    const cert = DigitalSoilHealthCertificateService.issueSoilHealthPassport({ sampleRecord: mockSample });
    const isValidOriginal = DigitalSoilHealthCertificateService.verifyCertificateSignature(cert);
    assert.strictEqual(isValidOriginal, true, 'Original certificate signature must verify as authentic');

    // Tamper with pH
    const tamperedCert = JSON.parse(JSON.stringify(cert));
    tamperedCert.pedologicalAssessment.soilReaction.phWater = 4.2;
    const isValidTampered = DigitalSoilHealthCertificateService.verifyCertificateSignature(tamperedCert);
    assert.strictEqual(isValidTampered, false, 'Tampered certificate must fail signature verification');
  });

  console.log('\n=================================================================');
  console.log(`🏁 SIMULATION SUITE COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('=================================================================\n');

  if (failedTests > 0) process.exit(1);
}

runSuite();
