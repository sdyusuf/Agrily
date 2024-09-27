const assert = require('assert');
const {
  calculateNdvi,
  calculateEvi,
  calculateSavi,
  calculateMsavi2,
  calculateNdwi,
  calculateGndvi,
  calculateNdre,
  calculateChlorophyllIndex,
  classifyVigor,
  computePixelIndices,
  generateSyntheticRasterGrid
} = require('../services/vegetationIndexEngine');
const { computeZonalStatistics } = require('../services/canopyVigorZonalService');

console.log('🧪 Starting Vegetation Index Engine & Zonal Service Unit Tests...');

// 1. NDVI Calculation
{
  const ndviDense = calculateNdvi(0.80, 0.10);
  assert.ok(Math.abs(ndviDense - 0.7778) < 0.001, 'NDVI calculation mismatch');

  const ndviZero = calculateNdvi(0, 0);
  assert.strictEqual(ndviZero, 0, 'Zero NIR/Red should return 0 safely without NaN');

  const ndviWater = calculateNdvi(0.05, 0.15);
  assert.strictEqual(ndviWater, -0.5, 'Water/bare soil should produce negative NDVI');
  console.log('  ✓ should calculate accurate NDVI values and handle zero-division edge cases');
}

// 2. EVI Calculation
{
  const evi = calculateEvi(0.75, 0.12, 0.05);
  assert.ok(evi > 0.35 && evi < 1.2, 'EVI should be in realistic vegetative range');

  const eviClamp = calculateEvi(10.0, 0.0, 0.0);
  assert.ok(eviClamp <= 1.5, 'EVI should clamp cleanly at maximum bounds');
  console.log('  ✓ should calculate Enhanced Vegetation Index with blue band aerosol correction');
}

// 3. SAVI & MSAVI2 Calculation
{
  const savi = calculateSavi(0.70, 0.15, 0.5);
  assert.ok(savi > 0.35 && savi < 0.85, 'SAVI value out of expected range');

  const msavi2 = calculateMsavi2(0.70, 0.15);
  assert.ok(msavi2 > 0.40 && msavi2 < 0.90, 'MSAVI2 value out of expected range');
  console.log('  ✓ should compute soil-adjusted vegetation indices (SAVI and MSAVI2)');
}

// 4. NDWI & Water Stress
{
  const ndwiHighMoisture = calculateNdwi(0.75, 0.18);
  assert.ok(ndwiHighMoisture > 0.55, 'High moisture leaf canopy must have positive NDWI');

  const ndwiDrought = calculateNdwi(0.30, 0.45);
  assert.ok(ndwiDrought < 0, 'Severe drought desiccated foliage should have negative NDWI');
  console.log('  ✓ should compute Normalized Difference Water Index (NDWI) for leaf moisture assessment');
}

// 5. GNDVI, NDRE & Chlorophyll Index
{
  const gndvi = calculateGndvi(0.68, 0.08);
  assert.ok(gndvi > 0.70, 'GNDVI should reflect green chlorophyll absorbance');

  const ndre = calculateNdre(0.68, 0.22);
  assert.ok(ndre > 0.45, 'NDRE should measure RedEdge boundary');

  const ci = calculateChlorophyllIndex(0.68, 0.22);
  assert.ok(ci > 2.0, 'Chlorophyll index should be greater than 2');
  console.log('  ✓ should compute GNDVI, NDRE, and Chlorophyll index proxies');
}

// 6. Comprehensive Pixel Struct & Vigor Classification
{
  const result = computePixelIndices({ nir: 0.85, red: 0.08, blue: 0.03, green: 0.06, swir: 0.18, redEdge: 0.22 });
  assert.strictEqual(result.healthCategory, 'Dense Canopy');
  assert.ok(result.ndvi > 0.80);
  assert.ok(result.chlorophyllScore > 2.5);

  assert.strictEqual(classifyVigor(0.12), 'Severe Stress');
  assert.strictEqual(classifyVigor(0.32), 'Moderate Stress');
  assert.strictEqual(classifyVigor(0.55), 'Healthy Vegetation');
  assert.strictEqual(classifyVigor(0.75), 'Dense Canopy');
  console.log('  ✓ should classify crop vigor stages according to agronomic thresholds');
}

// 7. Synthetic Raster Grid Generation
{
  const grid = generateSyntheticRasterGrid({ rows: 8, cols: 8, centroid: { latitude: 12.0, longitude: 8.5 }, baseNdvi: 0.70, cloudPercent: 10 });
  assert.strictEqual(grid.length, 64, 'Grid should have 8x8 = 64 cells');
  assert.ok(grid[0].cellId.startsWith('CELL-'));
  assert.ok(grid[0].lat && grid[0].lng);
  assert.ok(typeof grid[0].ndvi === 'number');
  console.log('  ✓ should synthesize 2D geospatial raster grids with multi-spectral parameters');
}

// 8. Canopy Vigor Zonal Statistics Aggregator
{
  const mockCells = [
    { cellId: '1', ndvi: 0.75, evi: 0.60, savi: 0.52, ndwi: 0.25, isMasked: false, chlorophyllScore: 3.2 },
    { cellId: '2', ndvi: 0.72, evi: 0.58, savi: 0.50, ndwi: 0.22, isMasked: false, chlorophyllScore: 3.0 },
    { cellId: '3', ndvi: 0.35, evi: 0.25, savi: 0.22, ndwi: 0.05, isMasked: false, chlorophyllScore: 1.1 },
    { cellId: '4', ndvi: 0.15, evi: 0.10, savi: 0.09, ndwi: -0.10, isMasked: false, chlorophyllScore: 0.4 }
  ];

  const zonal = computeZonalStatistics(mockCells, 20.0);
  assert.ok(zonal.meanNdvi > 0.45 && zonal.meanNdvi < 0.55, 'Mean NDVI calculation error');
  assert.strictEqual(zonal.vigorDistribution.severeStressHectares, 5.0, '25% of 20 Ha should be 5.0 Ha');
  assert.strictEqual(zonal.vigorDistribution.moderateStressHectares, 5.0, '25% of 20 Ha should be 5.0 Ha');
  assert.strictEqual(zonal.vigorDistribution.hyperDenseHectares, 10.0, '50% of 20 Ha should be 10.0 Ha');
  assert.ok(zonal.advisoryReport.length > 20, 'Advisory report should be generated');
  console.log('  ✓ should aggregate zonal hectares, statistical dispersion, and agronomic advisory reports');
}

console.log('\n🎉 All 8/8 Vegetation Index Engine & Zonal tests passed successfully!\n');
