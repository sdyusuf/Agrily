const assert = require('assert');
const {
  SCL_LABELS,
  isCloudOrShadow,
  filterMaskedCells,
  calculateSceneCloudPercentage,
  interpolateCloudGaps
} = require('../services/sentinelSceneMaskService');

console.log('🧪 Starting Sentinel Scene Classification Masking Unit Tests...');

// 1. SCL Labels and Classification
{
  assert.strictEqual(SCL_LABELS[3], 'CLOUD_SHADOWS');
  assert.strictEqual(SCL_LABELS[4], 'VEGETATION');
  assert.strictEqual(SCL_LABELS[9], 'CLOUD_HIGH_PROBABILITY');
  assert.strictEqual(SCL_LABELS[10], 'THIN_CIRRUS');

  assert.strictEqual(isCloudOrShadow(3), true, 'Cloud shadows should be flagged as masked');
  assert.strictEqual(isCloudOrShadow(8), true, 'Medium probability cloud should be flagged');
  assert.strictEqual(isCloudOrShadow(9), true, 'High probability cloud should be flagged');
  assert.strictEqual(isCloudOrShadow(10), true, 'Cirrus should be flagged');
  assert.strictEqual(isCloudOrShadow(4), false, 'Vegetation should NOT be flagged');
  assert.strictEqual(isCloudOrShadow(5), false, 'Bare soil should NOT be flagged');
  console.log('  ✓ should accurately parse Sentinel-2 SCL codes and flag cloud occlusions');
}

// 2. Filter Masked Cells in Grid
{
  const rawCells = [
    { cellId: 'C1', scl: 4, ndvi: 0.72 },
    { cellId: 'C2', scl: 9, ndvi: 0.12 },
    { cellId: 'C3', scl: 3, ndvi: 0.15 },
    { cellId: 'C4', scl: 4, ndvi: 0.68 }
  ];

  const processed = filterMaskedCells(rawCells);
  assert.strictEqual(processed[0].isMasked, false);
  assert.strictEqual(processed[1].isMasked, true);
  assert.strictEqual(processed[1].stressSeverity, 'Masked Cloud');
  assert.strictEqual(processed[2].isMasked, true);
  assert.strictEqual(processed[3].isMasked, false);
  console.log('  ✓ should filter and tag masked cells with SCL taxonomy');
}

// 3. Scene Cloud Percentage Calculation
{
  const testCells = [
    { scl: 4, isMasked: false },
    { scl: 4, isMasked: false },
    { scl: 4, isMasked: false },
    { scl: 9, isMasked: true }
  ];

  const cloudPct = calculateSceneCloudPercentage(testCells);
  assert.strictEqual(cloudPct, 25.0, '1 out of 4 cells should equal 25% cloud cover');
  console.log('  ✓ should accurately calculate overall scene cloud coverage percentage');
}

// 4. Spatial Interpolation of Cloud Gaps
{
  const matrix = [
    { cellId: 'C0', x: 0, y: 0, scl: 4, ndvi: 0.70, isMasked: false },
    { cellId: 'C1', x: 1, y: 0, scl: 9, ndvi: 0.05, isMasked: true }, // Cloud gap in center
    { cellId: 'C2', x: 2, y: 0, scl: 4, ndvi: 0.74, isMasked: false }
  ];

  const restored = interpolateCloudGaps(matrix, 3, 1);
  assert.strictEqual(restored[1].interpolated, true);
  assert.ok(restored[1].ndvi >= 0.70 && restored[1].ndvi <= 0.74, 'Interpolated NDVI should fall between valid neighbors');
  assert.strictEqual(restored[1].isMasked, false, 'Interpolated cell is unmasked');
  console.log('  ✓ should perform distance-weighted spatial gap filling over cloud occlusions');
}

console.log('\n🎉 All 4/4 Sentinel Scene Masking unit tests passed successfully!\n');
