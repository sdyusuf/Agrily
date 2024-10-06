/**
 * ==============================================================================
 * 🛰️ SATELLITE RADIATIVE TRANSFER & ATMOSPHERIC CORRECTION TEST MATRIX
 * ==============================================================================
 * 
 * Verifies:
 * 1. 6S Radiative Transfer Atmospheric Inversion:
 *    - Conversion from Level-1C Top-Of-Atmosphere (TOA) to Level-2A Bottom-Of-Atmosphere (BOA) reflectance.
 *    - Aerosol optical depth (AOD) scaling under Harmattan dust conditions (alpha ~ 0.35).
 * 2. Bodhaine (1999) Rayleigh Optical Depth & Scale Height Barometric Pressure Formulations.
 * 3. Minnaert Topographic Illumination Normalization on sloping terrain.
 * 4. PROSAIL (PROSPECT-D + 4SAIL) Leaf & Canopy Inversion:
 *    - Retrieval of Leaf Area Index (LAI, m^2/m^2), FAPAR, FVC, and Canopy Chlorophyll Content (CCC).
 *    - Look-Up Table (LUT) cost minimization for all 10 Nigerian crop presets.
 * 
 * @module tests/satelliteRadiativeTransferMatrix.test
 * ==============================================================================
 */

'use strict';

const assert = require('assert');
const {
  SatelliteAtmosphericCorrectionService,
  SENTINEL2_MSI_BANDS,
  AEROSOL_CLIMATOLOGY_MODELS
} = require('../services/satelliteAtmosphericCorrectionService');

const {
  CropCanopyRadiativeTransferModel,
  CROP_PROSAIL_CANOPY_PRESETS
} = require('../services/cropCanopyRadiativeTransferModel');

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
  console.log('\n🛰️ Starting Satellite Radiative Transfer & Atmospheric Correction Matrix Tests...\n');

  // Test 1: Band specifications
  await runTest('SENTINEL2_MSI_BANDS should declare calibrated spectral bands with wavelengths and resolutions', async () => {
    const bands = Object.keys(SENTINEL2_MSI_BANDS);
    assert.ok(bands.includes('B01'), 'B01 must exist');
    assert.ok(bands.includes('B02'), 'B02 must exist');
    assert.ok(bands.includes('B03'), 'B03 must exist');
    assert.ok(bands.includes('B04'), 'B04 must exist');
    assert.ok(bands.includes('B08'), 'B08 must exist');
    assert.ok(bands.includes('B11'), 'B11 must exist');
    assert.ok(bands.includes('B12'), 'B12 must exist');

    assert.strictEqual(SENTINEL2_MSI_BANDS.B04.centralWavelengthNm, 665);
    assert.strictEqual(SENTINEL2_MSI_BANDS.B08.centralWavelengthNm, 842);
    assert.strictEqual(SENTINEL2_MSI_BANDS.B04.spatialResolutionM, 10);
    assert.strictEqual(SENTINEL2_MSI_BANDS.B08.spatialResolutionM, 10);
  });

  // Test 2: Solar irradiance
  await runTest('SENTINEL2_MSI_BANDS should provide valid solar irradiance across optical spectrum', async () => {
    for (const [bandKey, bandMeta] of Object.entries(SENTINEL2_MSI_BANDS)) {
      assert.ok(bandMeta.solarIrradianceWm2 > 50, `Solar irradiance for ${bandKey} must be > 50 W/m2`);
      assert.ok(bandMeta.solarIrradianceWm2 < 2500, `Solar irradiance for ${bandKey} must be < 2500 W/m2`);
      assert.ok(bandMeta.bandwidthNm > 0, `Bandwidth for ${bandKey} must be > 0`);
    }
  });

  // Test 3: Bodhaine Rayleigh scattering
  await runTest('calculateRayleighOpticalDepth should compute decreasing optical thickness with wavelength', async () => {
    const tauBlue = SatelliteAtmosphericCorrectionService.calculateRayleighOpticalDepth(0.490, 0);
    const tauRed = SatelliteAtmosphericCorrectionService.calculateRayleighOpticalDepth(0.665, 0);
    const tauNir = SatelliteAtmosphericCorrectionService.calculateRayleighOpticalDepth(0.842, 0);

    assert.ok(tauBlue > tauRed, 'Blue Rayleigh optical depth must exceed Red');
    assert.ok(tauRed > tauNir, 'Red Rayleigh optical depth must exceed NIR');
    assert.ok(Math.abs(tauBlue - 0.156) < 0.05, 'Blue Rayleigh depth should be ~0.156 at sea level');
  });

  // Test 4: Altitude pressure scaling
  await runTest('calculateRayleighOpticalDepth should scale with barometric pressure at elevated altitudes', async () => {
    const tauSeaLevel = SatelliteAtmosphericCorrectionService.calculateRayleighOpticalDepth(0.560, 0);
    const tauJosPlateau = SatelliteAtmosphericCorrectionService.calculateRayleighOpticalDepth(0.560, 1200);

    assert.ok(tauJosPlateau < tauSeaLevel, 'Jos Plateau Rayleigh scattering must be lower than Sea Level');
    const ratio = tauJosPlateau / tauSeaLevel;
    assert.ok(ratio > 0.80 && ratio < 0.92, 'Barometric pressure scale ratio should be ~0.867');
  });

  // Test 5: Harmattan vs Continental Aerosols
  await runTest('calculateAerosolOpticalDepth should model coarse mineral dust scattering for Harmattan', async () => {
    const aod550 = 0.40;
    const harmattanAlpha = AEROSOL_CLIMATOLOGY_MODELS.SAHARAN_HARMATTAN_DUST.angstromAlpha;
    const continentalAlpha = AEROSOL_CLIMATOLOGY_MODELS.CONTINENTAL_CLEAN.angstromAlpha;

    const tauHarmattanNir = SatelliteAtmosphericCorrectionService.calculateAerosolOpticalDepth(0.842, aod550, harmattanAlpha);
    const tauContinentalNir = SatelliteAtmosphericCorrectionService.calculateAerosolOpticalDepth(0.842, aod550, continentalAlpha);

    assert.ok(tauHarmattanNir > tauContinentalNir, 'Harmattan dust with lower alpha must produce higher NIR scattering');
  });

  // Test 6: Minnaert Topographic Normalization
  await runTest('normalizeTopographicIllumination should normalize sunlit and shaded slopes', async () => {
    const observedBoa = 0.38;
    const res = SatelliteAtmosphericCorrectionService.normalizeTopographicIllumination({
      boaReflectance: observedBoa,
      sunZenithDeg: 35.0,
      sunAzimuthDeg: 145.0,
      slopeDeg: 15.0,
      aspectDeg: 140.0,
      minnaertK: 0.82
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.normalizedReflectance > 0.0 && res.normalizedReflectance < 1.0, 'Corrected reflectance must be bounded in [0, 1]');
    assert.ok(Math.abs(res.normalizedReflectance - observedBoa) < 0.10, 'Illumination correction adjustment must be subtle and physical');
  });

  // Test 7: Full Scene TOA to BOA Atmospheric Correction
  await runTest('processMultiSpectralSceneTOAtoBOA should remove atmospheric path reflectance and return corrected bands', async () => {
    const toaBands = {
      B02: 0.185,
      B03: 0.165,
      B04: 0.142,
      B08: 0.420,
      B11: 0.210
    };

    const result = SatelliteAtmosphericCorrectionService.processMultiSpectralSceneTOAtoBOA(
      toaBands,
      {
        sunZenithAngle: 32.5,
        viewZenithAngle: 4.2,
        elevationMeters: 450,
        aerosolModelKey: 'SAHARAN_HARMATTAN_DUST',
        customAod550: 0.28
      }
    );

    assert.strictEqual(result.success, true);
    assert.ok(result.correctedBands.B02 !== undefined, 'BOA Blue band must be present');
    assert.ok(result.correctedBands.B04 !== undefined, 'BOA Red band must be present');
    assert.ok(result.correctedBands.B08 > 0.20, 'BOA NIR reflectance should remain high for vegetation');
    assert.ok(result.atmosphericCorrectionEngine.includes('Agrily 6S-MSI'));
  });

  // Test 8: PROSAIL Presets for 10 crops
  await runTest('CROP_PROSAIL_CANOPY_PRESETS should contain configurations for 10 staple crops', async () => {
    const crops = [
      'MAIZE', 'RICE', 'CASSAVA', 'YAM', 'SORGHUM',
      'MILLET', 'SOYBEAN', 'GROUNDNUT', 'TOMATO', 'OIL_PALM'
    ];

    for (const cropKey of crops) {
      const preset = CROP_PROSAIL_CANOPY_PRESETS[cropKey];
      assert.ok(preset, `Preset for ${cropKey} must exist`);
      assert.ok(preset.chlorophyllCabUgCm2 > 20, `Chlorophyll content for ${cropKey} must be > 20`);
      assert.ok(preset.averageLeafAngleDeg > 25, `Leaf angle for ${cropKey} must be > 25`);
      assert.ok(preset.nominalLaiRange[0] >= 0.1, `Min LAI for ${cropKey} must be >= 0.1`);
      assert.ok(preset.nominalLaiRange[1] <= 10.0, `Max LAI for ${cropKey} must be <= 10.0`);
    }
  });

  // Test 9: PROSAIL LUT Inversion
  await runTest('invertCanopyBiophysicalVariables should accurately retrieve LAI, FAPAR, FVC, and CCC for healthy maize', async () => {
    const healthyMaizeBands = {
      B02: 0.035,
      B03: 0.082,
      B04: 0.045,
      B08: 0.520,
      B11: 0.160
    };

    const inversion = CropCanopyRadiativeTransferModel.invertCanopyBiophysicalVariables({
      boaBands: healthyMaizeBands,
      cropKey: 'MAIZE',
      viewGeometry: { sunZenithAngle: 30.0 }
    });

    assert.strictEqual(inversion.success, true);
    assert.ok(inversion.biophysicalVariables.leafAreaIndexM2M2 >= 1.0, `Maize LAI must be >= 1.0`);
    assert.ok(inversion.biophysicalVariables.fractionAbsorbedParFAPAR >= 0.40, `Maize FAPAR must be >= 0.40`);
    assert.ok(inversion.biophysicalVariables.fractionalVegetationCoverFVC >= 0.40, `Maize FVC must be >= 0.40`);
    assert.ok(inversion.biophysicalVariables.canopyChlorophyllContentGM2 > 0.4, `Canopy Chlorophyll must be > 0.4`);
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
