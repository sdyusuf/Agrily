/**
 * =============================================================================
 * 🛰️ AGRILY MULTI-SPECTRAL VEGETATION INDEX ENGINE
 * =============================================================================
 * Pure mathematical algorithms for precision remote sensing of crop canopy vigor,
 * chlorophyll density, nitrogen uptake proxy, and water stress index.
 * Supported Instruments: Sentinel-2 MSI (L2A Surface Reflectance), Landsat-8/9 OLI.
 */

/**
 * Normalized Difference Vegetation Index (NDVI)
 * Formula: (NIR - Red) / (NIR + Red)
 * Range: [-1.0, +1.0]
 * Standard benchmark for photosynthetic capacity and green biomass.
 */
function calculateNdvi(nir, red) {
  const sum = Number(nir) + Number(red);
  if (sum <= 0.00001) return 0.0;
  const val = (Number(nir) - Number(red)) / sum;
  return Math.max(-1.0, Math.min(1.0, parseFloat(val.toFixed(4))));
}

/**
 * Enhanced Vegetation Index (EVI)
 * Formula: 2.5 * ((NIR - Red) / (NIR + 6.0 * Red - 7.5 * Blue + 1.0))
 * Optimized for high-biomass regions by decoupling soil background and atmospheric aerosol scatter.
 */
function calculateEvi(nir, red, blue = 0.04) {
  const denom = Number(nir) + (6.0 * Number(red)) - (7.5 * Number(blue)) + 1.0;
  if (Math.abs(denom) <= 0.0001) return 0.0;
  const val = 2.5 * ((Number(nir) - Number(red)) / denom);
  return Math.max(-1.0, Math.min(1.5, parseFloat(val.toFixed(4))));
}

/**
 * Soil-Adjusted Vegetation Index (SAVI)
 * Formula: ((NIR - Red) / (NIR + Red + L)) * (1.0 + L)
 * Standard soil adjustment factor L = 0.5
 */
function calculateSavi(nir, red, L = 0.5) {
  const denom = Number(nir) + Number(red) + Number(L);
  if (denom <= 0.0001) return 0.0;
  const val = ((Number(nir) - Number(red)) / denom) * (1.0 + Number(L));
  return Math.max(-1.0, Math.min(1.0, parseFloat(val.toFixed(4))));
}

/**
 * Modified Soil Adjusted Vegetation Index (MSAVI2)
 * Formula: (2 * NIR + 1 - sqrt((2 * NIR + 1)^2 - 8 * (NIR - Red))) / 2
 * Eliminates need for manual L-factor parameterization across arid/semi-arid soils.
 */
function calculateMsavi2(nir, red) {
  const n = Number(nir);
  const r = Number(red);
  const term1 = 2 * n + 1;
  const discriminant = Math.pow(term1, 2) - 8 * (n - r);
  if (discriminant < 0) return 0.0;
  const val = (term1 - Math.sqrt(discriminant)) / 2;
  return Math.max(-1.0, Math.min(1.0, parseFloat(val.toFixed(4))));
}

/**
 * Normalized Difference Water Index (NDWI - Gao 1996)
 * Formula: (NIR - SWIR) / (NIR + SWIR)
 * Measures liquid water absorption in plant canopy leaves and drought stress.
 */
function calculateNdwi(nir, swir = 0.20) {
  const sum = Number(nir) + Number(swir);
  if (sum <= 0.00001) return 0.0;
  const val = (Number(nir) - Number(swir)) / sum;
  return Math.max(-1.0, Math.min(1.0, parseFloat(val.toFixed(4))));
}

/**
 * Green Normalized Difference Vegetation Index (GNDVI)
 * Formula: (NIR - Green) / (NIR + Green)
 * More sensitive to chlorophyll concentration than traditional NDVI in mature closed canopies.
 */
function calculateGndvi(nir, green = 0.08) {
  const sum = Number(nir) + Number(green);
  if (sum <= 0.00001) return 0.0;
  const val = (Number(nir) - Number(green)) / sum;
  return Math.max(-1.0, Math.min(1.0, parseFloat(val.toFixed(4))));
}

/**
 * Normalized Difference Red Edge Index (NDRE)
 * Formula: (NIR - RedEdge) / (NIR + RedEdge)
 * Sensed at Sentinel-2 Band 5 (705 nm). Resists saturation at peak vegetative stages.
 */
function calculateNdre(nir, redEdge = 0.25) {
  const sum = Number(nir) + Number(redEdge);
  if (sum <= 0.00001) return 0.0;
  const val = (Number(nir) - Number(redEdge)) / sum;
  return Math.max(-1.0, Math.min(1.0, parseFloat(val.toFixed(4))));
}

/**
 * Chlorophyll Index Red Edge (CIre)
 * Formula: (NIR / RedEdge) - 1
 */
function calculateChlorophyllIndex(nir, redEdge = 0.25) {
  if (Number(redEdge) <= 0.0001) return 0.0;
  const val = (Number(nir) / Number(redEdge)) - 1.0;
  return Math.max(0.0, parseFloat(val.toFixed(3)));
}

/**
 * Classifies crop vigor according to FAO / Sentinel-2 agronomy thresholds
 */
function classifyVigor(ndvi) {
  const v = Number(ndvi);
  if (v < 0.20) return 'Severe Stress';
  if (v < 0.40) return 'Moderate Stress';
  if (v < 0.65) return 'Healthy Vegetation';
  return 'Dense Canopy';
}

/**
 * Comprehensive pixel index processor
 */
function computePixelIndices(bands = {}) {
  const nir = Number(bands.nir !== undefined ? bands.nir : 0.65);
  const red = Number(bands.red !== undefined ? bands.red : 0.08);
  const blue = Number(bands.blue !== undefined ? bands.blue : 0.04);
  const green = Number(bands.green !== undefined ? bands.green : 0.07);
  const swir = Number(bands.swir !== undefined ? bands.swir : 0.20);
  const redEdge = Number(bands.redEdge !== undefined ? bands.redEdge : 0.24);

  const ndvi = calculateNdvi(nir, red);
  const evi = calculateEvi(nir, red, blue);
  const savi = calculateSavi(nir, red, 0.5);
  const msavi2 = calculateMsavi2(nir, red);
  const ndwi = calculateNdwi(nir, swir);
  const gndvi = calculateGndvi(nir, green);
  const ndre = calculateNdre(nir, redEdge);
  const chlorophyllScore = calculateChlorophyllIndex(nir, redEdge);
  const healthCategory = classifyVigor(ndvi);

  return {
    ndvi,
    evi,
    savi,
    msavi2,
    ndwi,
    gndvi,
    ndre,
    chlorophyllScore,
    healthCategory
  };
}

/**
 * Generates an analytical 2D raster grid for a farm polygon boundary
 */
function generateSyntheticRasterGrid({ rows = 12, cols = 12, centroid = { latitude: 12.015, longitude: 8.525 }, baseNdvi = 0.68, noiseStdDev = 0.08, cloudPercent = 0.0 }) {
  const cells = [];
  const deltaLat = 0.00018; // ~20 meters
  const deltaLng = 0.00018;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Gaussian perturbation
      const u1 = Math.random() || 0.001;
      const u2 = Math.random() || 0.001;
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      
      // Introduce spatial gradient (e.g. edge or depression variance)
      const gradient = ((r / rows) * 0.12) - ((c / cols) * 0.06);
      let cellNdvi = baseNdvi + (z0 * noiseStdDev) + gradient;
      cellNdvi = Math.max(0.08, Math.min(0.92, parseFloat(cellNdvi.toFixed(4))));

      const nir = parseFloat((0.25 + cellNdvi * 0.55).toFixed(4));
      const red = parseFloat((0.25 - cellNdvi * 0.18).toFixed(4));
      const green = 0.065;
      const blue = 0.038;
      const swir = parseFloat((0.28 - cellNdvi * 0.12).toFixed(4));
      const redEdge = parseFloat((0.15 + cellNdvi * 0.22).toFixed(4));

      const indices = computePixelIndices({ nir, red, green, blue, swir, redEdge });

      // Simulate occasional cloud shadow based on cloudPercent
      const isCloud = Math.random() * 100 < cloudPercent;
      const sclCode = isCloud ? (Math.random() > 0.5 ? 9 : 3) : 4; // 9 = Cloud, 3 = Shadow, 4 = Veg

      cells.push({
        cellId: `CELL-R${r}-C${c}`,
        x: c,
        y: r,
        lat: parseFloat((centroid.latitude + (r - rows / 2) * deltaLat).toFixed(6)),
        lng: parseFloat((centroid.longitude + (c - cols / 2) * deltaLng).toFixed(6)),
        ndvi: isCloud ? 0.10 : indices.ndvi,
        evi: isCloud ? 0.05 : indices.evi,
        savi: isCloud ? 0.08 : indices.savi,
        ndwi: isCloud ? -0.15 : indices.ndwi,
        scl: sclCode,
        isMasked: isCloud,
        chlorophyllScore: indices.chlorophyllScore,
        stressSeverity: isCloud ? 'Masked Cloud' : indices.healthCategory
      });
    }
  }

  return cells;
}

module.exports = {
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
};
