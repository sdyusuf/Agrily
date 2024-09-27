/**
 * =============================================================================
 * 🌾 CANOPY VIGOR ZONAL SERVICE
 * =============================================================================
 * Performs high-precision spatial statistical aggregation of satellite pixel arrays
 * into farm-scale agronomic metrics, crop stress zones, and actionable irrigation/fertilizer advisories.
 */

function computeZonalStatistics(cells = [], totalHectares = 10.0) {
  if (!Array.isArray(cells) || cells.length === 0) {
    return {
      meanNdvi: 0.0,
      minNdvi: 0.0,
      maxNdvi: 0.0,
      stdDevNdvi: 0.0,
      medianNdvi: 0.0,
      meanEvi: 0.0,
      meanSavi: 0.0,
      meanNdwi: 0.0,
      meanGndvi: 0.0,
      meanNdre: 0.0,
      chlorophyllIndex: 0.0,
      waterStressIndex: 0.0,
      canopyUniformityIndex: 0.0,
      cloudMaskPercentage: 0.0,
      vigorDistribution: {
        severeStressHectares: 0.0,
        moderateStressHectares: 0.0,
        healthyHectares: 0.0,
        hyperDenseHectares: 0.0
      },
      advisoryReport: 'No satellite telemetry data available.'
    };
  }

  const validCells = cells.filter((c) => !c.isMasked);
  const cloudMaskPercentage = parseFloat((((cells.length - validCells.length) / cells.length) * 100).toFixed(2));

  if (validCells.length === 0) {
    return {
      meanNdvi: 0.0,
      minNdvi: 0.0,
      maxNdvi: 0.0,
      stdDevNdvi: 0.0,
      medianNdvi: 0.0,
      meanEvi: 0.0,
      meanSavi: 0.0,
      meanNdwi: 0.0,
      meanGndvi: 0.0,
      meanNdre: 0.0,
      chlorophyllIndex: 0.0,
      waterStressIndex: 0.0,
      canopyUniformityIndex: 0.0,
      cloudMaskPercentage: 100.0,
      vigorDistribution: {
        severeStressHectares: 0.0,
        moderateStressHectares: 0.0,
        healthyHectares: 0.0,
        hyperDenseHectares: 0.0
      },
      advisoryReport: 'Cloud occlusion 100%. Re-observation needed from next satellite pass.'
    };
  }

  const ndviList = validCells.map((c) => Number(c.ndvi)).sort((a, b) => a - b);
  const sumNdvi = ndviList.reduce((acc, val) => acc + val, 0);
  const count = ndviList.length;

  const meanNdvi = parseFloat((sumNdvi / count).toFixed(4));
  const minNdvi = ndviList[0];
  const maxNdvi = ndviList[count - 1];
  const medianNdvi = count % 2 === 0
    ? parseFloat(((ndviList[count / 2 - 1] + ndviList[count / 2]) / 2).toFixed(4))
    : ndviList[Math.floor(count / 2)];

  const variance = ndviList.reduce((acc, val) => acc + Math.pow(val - meanNdvi, 2), 0) / count;
  const stdDevNdvi = parseFloat(Math.sqrt(variance).toFixed(4));

  const meanEvi = parseFloat((validCells.reduce((a, c) => a + (Number(c.evi) || 0), 0) / count).toFixed(4));
  const meanSavi = parseFloat((validCells.reduce((a, c) => a + (Number(c.savi) || 0), 0) / count).toFixed(4));
  const meanNdwi = parseFloat((validCells.reduce((a, c) => a + (Number(c.ndwi) || 0), 0) / count).toFixed(4));
  const meanGndvi = parseFloat((validCells.reduce((a, c) => a + (Number(c.gndvi) || 0), 0) / count).toFixed(4));
  const meanNdre = parseFloat((validCells.reduce((a, c) => a + (Number(c.ndre) || 0), 0) / count).toFixed(4));

  // Chlorophyll and water deficit index
  const chlorophyllIndex = parseFloat((validCells.reduce((a, c) => a + (Number(c.chlorophyllScore) || 0), 0) / count).toFixed(2));
  // NDWI < 0 indicates severe canopy water stress; > 0.3 indicates high hydration
  const waterStressScore = parseFloat(Math.max(0.0, Math.min(1.0, (0.35 - meanNdwi) * 2.0)).toFixed(2));

  // Uniformity index (1.0 = completely uniform crop canopy)
  const coefficientOfVariation = meanNdvi > 0 ? (stdDevNdvi / meanNdvi) : 1.0;
  const canopyUniformityIndex = parseFloat(Math.max(0.0, Math.min(1.0, 1.0 - coefficientOfVariation)).toFixed(2));

  // Area breakdown
  const severeCount = validCells.filter((c) => c.ndvi < 0.20).length;
  const moderateCount = validCells.filter((c) => c.ndvi >= 0.20 && c.ndvi < 0.40).length;
  const healthyCount = validCells.filter((c) => c.ndvi >= 0.40 && c.ndvi < 0.65).length;
  const hyperCount = validCells.filter((c) => c.ndvi >= 0.65).length;

  const ha = Number(totalHectares) || 10.0;
  const severeStressHectares = parseFloat(((severeCount / count) * ha).toFixed(2));
  const moderateStressHectares = parseFloat(((moderateCount / count) * ha).toFixed(2));
  const healthyHectares = parseFloat(((healthyCount / count) * ha).toFixed(2));
  const hyperDenseHectares = parseFloat(((hyperCount / count) * ha).toFixed(2));

  // Dynamic agronomic advisory synthesis
  let advisoryReport = '';
  if (severeStressHectares > (ha * 0.25)) {
    advisoryReport = `CRITICAL ALERT: ${severeStressHectares} Ha (${Math.round((severeStressHectares / ha) * 100)}%) of parcel is in severe vegetative decline (NDVI < 0.20). Immediate field scouting recommended to isolate root rot or pest infestation.`;
  } else if (waterStressScore > 0.50) {
    advisoryReport = `MOISTURE DEFICIT DETECTED: Canopy Water Stress Index is elevated (${waterStressScore}/1.0). Schedule supplemental irrigation or check drip line pressure in drier quadrants.`;
  } else if (meanNdvi >= 0.65) {
    advisoryReport = `OPTIMAL CANOPY HEALTH: Strong photosynthetic biomass index (${meanNdvi}). Chlorophyll index (${chlorophyllIndex}) indicates robust nitrogen assimilation.`;
  } else {
    advisoryReport = `NORMAL CROP DEVELOPMENT: Canopy vigor index is within standard seasonal parameters. Continue routine pest monitoring and nutrient schedule.`;
  }

  return {
    meanNdvi,
    minNdvi,
    maxNdvi,
    stdDevNdvi,
    medianNdvi,
    meanEvi,
    meanSavi,
    meanNdwi,
    meanGndvi,
    meanNdre,
    chlorophyllIndex,
    waterStressIndex: waterStressScore,
    canopyUniformityIndex,
    cloudMaskPercentage,
    vigorDistribution: {
      severeStressHectares,
      moderateStressHectares,
      healthyHectares,
      hyperDenseHectares
    },
    advisoryReport
  };
}

module.exports = {
  computeZonalStatistics
};
