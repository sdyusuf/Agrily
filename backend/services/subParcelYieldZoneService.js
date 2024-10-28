/**
 * ==============================================================================
 * 🌾 AGRILY HARVEST YIELD PREDICTOR: SUB-PARCEL YIELD ZONE MAPPER
 * ==============================================================================
 *
 * Generates an 8x8 spatial yield productivity grid (64 management cells) across
 * a farm parcel, modeling spatial heterogeneity in soil fertility, topographic
 * drainage, canopy NDVI, Harvest Index, and expected harvest revenue (NGN/ha).
 * ==============================================================================
 */

/**
 * Generate an 8x8 spatial sub-parcel yield grid from a parcel's predicted yield.
 *
 * @param {object} forecastResult - Output of predictParcelHarvestYield
 * @returns {object} Grid cells and zonal management summary
 */
function generateSubParcelYieldGrid(forecastResult = {}) {
  const meanYield = Number(forecastResult.predictedYieldTonsPerHa || 5.8);
  const meanBiomass = Number(forecastResult.mechanisticBiomassTonsHa || 12.2);
  const baseHi = Number(forecastResult.effectiveHarvestIndex || 0.48);
  const pricePerTon = Number(forecastResult.farmGatePricePerTonNgn || 680000);

  const cells = [];
  let highYieldCellsCount = 0;
  let lowYieldCellsCount = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      // Topographic fertility gradient: central-west block has higher fertility, SE corner has mild compaction
      const distFertile = Math.hypot(row - 3, col - 2);
      const distCompacted = Math.hypot(row - 6, col - 6);

      const spatialMultiplier = Math.max(
        0.58,
        Math.min(
          1.26,
          1.14 - distFertile * 0.045 - (distCompacted < 2.2 ? (2.2 - distCompacted) * 0.14 : 0)
        )
      );

      const yieldTonsPerHa = Number((meanYield * spatialMultiplier).toFixed(2));
      const biomassTonsPerHa = Number((meanBiomass * (0.92 * spatialMultiplier + 0.08)).toFixed(2));
      const cellHi = Number(
        Math.min(0.78, Math.max(0.25, baseHi * (0.95 + (spatialMultiplier - 1) * 0.25))).toFixed(2)
      );
      const ndviScore = Number(
        Math.min(0.92, Math.max(0.28, 0.74 * spatialMultiplier)).toFixed(2)
      );
      const revenueNgnPerHa = Math.round(yieldTonsPerHa * pricePerTon);

      let managementZone = 'Standard Productivity Zone';
      if (spatialMultiplier >= 1.08) {
        managementZone = 'High-Yield Core Zone';
        highYieldCellsCount += 1;
      } else if (spatialMultiplier <= 0.82) {
        managementZone = 'Low-Yield Compaction / Nutrient Deficit';
        lowYieldCellsCount += 1;
      }

      cells.push({
        cellId: `Z${row}-${col}`,
        row,
        col,
        yieldTonsPerHa,
        biomassTonsPerHa,
        harvestIndex: cellHi,
        ndviScore,
        revenueNgnPerHa,
        spatialMultiplier: Number(spatialMultiplier.toFixed(2)),
        managementZone
      });
    }
  }

  return {
    totalCells: cells.length,
    highYieldCellsCount,
    lowYieldCellsCount,
    standardCellsCount: cells.length - highYieldCellsCount - lowYieldCellsCount,
    cells
  };
}

module.exports = {
  generateSubParcelYieldGrid
};
