/**
 * =============================================================================
 * ☁️ SENTINEL-2 SCENE CLASSIFICATION LAYER (SCL) MASKING SERVICE
 * =============================================================================
 * Detects, isolates, and interpolates cloud shadows, cirrus, and high-reflectance
 * cloud artifacts in Level-2A Sentinel-2 multispectral scenes.
 */

const SCL_LABELS = {
  0: 'NO_DATA',
  1: 'SATURATED_OR_DEFECTIVE',
  2: 'CAST_SHADOW',
  3: 'CLOUD_SHADOWS',
  4: 'VEGETATION',
  5: 'NOT_VEGETATED_BARE_SOIL',
  6: 'WATER',
  7: 'UNCLASSIFIED',
  8: 'CLOUD_MEDIUM_PROBABILITY',
  9: 'CLOUD_HIGH_PROBABILITY',
  10: 'THIN_CIRRUS',
  11: 'SNOW_OR_ICE'
};

/**
 * Determines whether a given SCL code represents cloud, cirrus, or cloud shadow
 */
function isCloudOrShadow(sclCode) {
  const code = Number(sclCode);
  return [1, 2, 3, 8, 9, 10, 11].includes(code);
}

/**
 * Flags all masked cells in a flat or 2D grid matrix
 */
function filterMaskedCells(cells = []) {
  if (!Array.isArray(cells)) return [];
  return cells.map((cell) => {
    const masked = isCloudOrShadow(cell.scl);
    return {
      ...cell,
      isMasked: masked,
      sclLabel: SCL_LABELS[cell.scl] || 'UNKNOWN',
      stressSeverity: masked ? 'Masked Cloud' : cell.stressSeverity
    };
  });
}

/**
 * Calculates the exact percentage of cells occluded by clouds or cloud shadows
 */
function calculateSceneCloudPercentage(cells = []) {
  if (!Array.isArray(cells) || cells.length === 0) return 0.0;
  const maskedCount = cells.filter((c) => isCloudOrShadow(c.scl) || c.isMasked).length;
  return parseFloat(((maskedCount / cells.length) * 100).toFixed(2));
}

/**
 * Interpolates clouded cells from surrounding unmasked valid pixels
 * Uses a distance-weighted neighborhood kernel.
 */
function interpolateCloudGaps(grid = [], width = 12, height = 12) {
  if (!Array.isArray(grid) || grid.length === 0) return [];

  // Create a 2D lookup map for quick spatial queries
  const matrix = {};
  grid.forEach((c) => {
    matrix[`${c.x},${c.y}`] = { ...c };
  });

  return grid.map((cell) => {
    if (!cell.isMasked && !isCloudOrShadow(cell.scl)) {
      return cell;
    }

    // 8-neighborhood kernel
    const neighbors = [];
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        if (dx === 0 && dy === 0) continue;
        const key = `${cell.x + dx},${cell.y + dy}`;
        const neighbor = matrix[key];
        if (neighbor && !neighbor.isMasked && !isCloudOrShadow(neighbor.scl)) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          neighbors.push({ ...neighbor, dist });
        }
      }
    }

    if (neighbors.length === 0) {
      // Fallback: assign regional default if surrounded completely by deep cloud
      return {
        ...cell,
        ndvi: 0.55,
        evi: 0.40,
        savi: 0.38,
        ndwi: 0.15,
        interpolated: true
      };
    }

    // Inverse distance weighted mean
    let sumWeight = 0;
    let weightedNdvi = 0;
    let weightedEvi = 0;
    let weightedSavi = 0;
    let weightedNdwi = 0;

    neighbors.forEach((n) => {
      const weight = 1.0 / n.dist;
      sumWeight += weight;
      weightedNdvi += n.ndvi * weight;
      weightedEvi += (n.evi || 0) * weight;
      weightedSavi += (n.savi || 0) * weight;
      weightedNdwi += (n.ndwi || 0) * weight;
    });

    const finalNdvi = parseFloat((weightedNdvi / sumWeight).toFixed(4));
    const finalEvi = parseFloat((weightedEvi / sumWeight).toFixed(4));
    const finalSavi = parseFloat((weightedSavi / sumWeight).toFixed(4));
    const finalNdwi = parseFloat((weightedNdwi / sumWeight).toFixed(4));

    return {
      ...cell,
      ndvi: finalNdvi,
      evi: finalEvi,
      savi: finalSavi,
      ndwi: finalNdwi,
      interpolated: true,
      originalScl: cell.scl,
      isMasked: false,
      stressSeverity: finalNdvi < 0.2 ? 'Severe Stress' : finalNdvi < 0.4 ? 'Moderate Stress' : finalNdvi < 0.65 ? 'Healthy Vegetation' : 'Dense Canopy'
    };
  });
}

module.exports = {
  SCL_LABELS,
  isCloudOrShadow,
  filterMaskedCells,
  calculateSceneCloudPercentage,
  interpolateCloudGaps
};
