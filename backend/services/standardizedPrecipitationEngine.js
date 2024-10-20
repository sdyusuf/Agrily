/**
 * ==============================================================================
 * 🌾 AGRILY AGROMETEOROLOGICAL TELEMETRY: STANDARDIZED PRECIPITATION INDEX (SPI)
 * ==============================================================================
 *
 * Implements multi-timescale Standardized Precipitation Index (SPI-1, SPI-3,
 * SPI-6) and Standardized Precipitation-Evapotranspiration Index (SPEI)
 * climatological anomaly calculations across Nigeria's 8 agro-ecological belts.
 * ==============================================================================
 */

const HISTORICAL_CLIMATOLOGY_NORMS = {
  'Sahel Savannah': { meanMonthlyRainMm: 48.0, stdMonthlyRainMm: 22.0, meanMonthlyEt0Mm: 185.0 },
  'Sudan Savannah': { meanMonthlyRainMm: 78.0, stdMonthlyRainMm: 31.0, meanMonthlyEt0Mm: 162.0 },
  'Northern Guinea Savannah': { meanMonthlyRainMm: 112.0, stdMonthlyRainMm: 38.0, meanMonthlyEt0Mm: 144.0 },
  'Southern Guinea Savannah': { meanMonthlyRainMm: 138.0, stdMonthlyRainMm: 42.0, meanMonthlyEt0Mm: 128.0 },
  'Derived Savannah': { meanMonthlyRainMm: 154.0, stdMonthlyRainMm: 46.0, meanMonthlyEt0Mm: 118.0 },
  'Humid Forest': { meanMonthlyRainMm: 215.0, stdMonthlyRainMm: 58.0, meanMonthlyEt0Mm: 102.0 },
  'Mid-Altitude Montane': { meanMonthlyRainMm: 126.0, stdMonthlyRainMm: 39.0, meanMonthlyEt0Mm: 115.0 },
  'Coastal Mangrove': { meanMonthlyRainMm: 265.0, stdMonthlyRainMm: 68.0, meanMonthlyEt0Mm: 96.0 }
};

/**
 * Classify SPI or SPEI z-score per World Meteorological Organization (WMO) scale.
 * @param {number} zScore
 * @returns {{ category: string, severityCode: string, droughtTrigger: boolean }}
 */
function classifyWmoDroughtIndex(zScore) {
  const z = Number(zScore || 0);
  if (z >= 2.0) {
    return { category: 'Extremely Wet (Flood Anomaly)', severityCode: 'EXTREME_WET', droughtTrigger: false };
  }
  if (z >= 1.5) {
    return { category: 'Severely Wet', severityCode: 'SEVERE_WET', droughtTrigger: false };
  }
  if (z >= 1.0) {
    return { category: 'Moderately Wet', severityCode: 'MODERATE_WET', droughtTrigger: false };
  }
  if (z > -1.0) {
    return { category: 'Near Normal Climatology', severityCode: 'NORMAL', droughtTrigger: false };
  }
  if (z > -1.5) {
    return { category: 'Moderately Dry', severityCode: 'MODERATE_DROUGHT', droughtTrigger: true };
  }
  if (z > -2.0) {
    return { category: 'Severely Dry', severityCode: 'SEVERE_DROUGHT', droughtTrigger: true };
  }
  return { category: 'Extremely Dry (Agricultural Drought Emergency)', severityCode: 'EXTREME_DROUGHT', droughtTrigger: true };
}

/**
 * Calculate Standardized Precipitation Index (SPI) and SPEI for a given
 * accumulation window (1-month, 3-month, or 6-month).
 *
 * @param {object} params
 * @param {string} [params.agroEcologicalZone='Sudan Savannah']
 * @param {number} [params.timescaleMonths=1]
 * @param {number} params.observedRainfallMm
 * @param {number} [params.observedEt0Mm]
 * @returns {object} SPI & SPEI assessment
 */
function computeStandardizedPrecipitationIndex(params = {}) {
  const zone = params.agroEcologicalZone || 'Sudan Savannah';
  const norm = HISTORICAL_CLIMATOLOGY_NORMS[zone] || HISTORICAL_CLIMATOLOGY_NORMS['Sudan Savannah'];
  const scale = Math.max(1, Math.min(12, Number(params.timescaleMonths || 1)));

  const expectedMeanRain = norm.meanMonthlyRainMm * scale;
  const expectedStdRain = norm.stdMonthlyRainMm * Math.sqrt(scale);
  const observedRain = Math.max(0, Number(params.observedRainfallMm ?? expectedMeanRain));

  // Cube-root Wilson-Hilferty gamma normalization approximation for skewed rainfall
  const ratio = Math.max(0.02, observedRain / Math.max(1, expectedMeanRain));
  const cv = expectedStdRain / Math.max(1, expectedMeanRain);
  const rawZ = (observedRain - expectedMeanRain) / Math.max(1, expectedStdRain);
  const gammaAdjustedZ = ((Math.pow(ratio, 1 / 3) - (1 - (cv * cv) / 9)) / (cv / 3)) * 0.5 + rawZ * 0.5;
  const spiScore = Number(Math.max(-3.5, Math.min(3.5, gammaAdjustedZ)).toFixed(2));

  // SPEI climatic water balance D = P - ET0
  const expectedEt0 = norm.meanMonthlyEt0Mm * scale;
  const observedEt0 = Number(params.observedEt0Mm ?? expectedEt0);
  const observedBalanceD = observedRain - observedEt0;
  const expectedBalanceD = expectedMeanRain - expectedEt0;
  const speiStd = Math.hypot(expectedStdRain, expectedEt0 * 0.14);
  const speiScore = Number(
    Math.max(-3.5, Math.min(3.5, (observedBalanceD - expectedBalanceD) / Math.max(1, speiStd))).toFixed(2)
  );

  const spiClassification = classifyWmoDroughtIndex(spiScore);
  const speiClassification = classifyWmoDroughtIndex(speiScore);

  return {
    agroEcologicalZone: zone,
    timescaleMonths: scale,
    observedRainfallMm: observedRain,
    climatologyMeanRainMm: Number(expectedMeanRain.toFixed(1)),
    rainfallAnomalyPct: Number((((observedRain - expectedMeanRain) / expectedMeanRain) * 100).toFixed(1)),
    spiScore,
    spiCategory: spiClassification.category,
    spiSeverityCode: spiClassification.severityCode,
    speiScore,
    speiCategory: speiClassification.category,
    speiSeverityCode: speiClassification.severityCode,
    isParametricDroughtTriggered: spiClassification.droughtTrigger || speiClassification.droughtTrigger
  };
}

module.exports = {
  HISTORICAL_CLIMATOLOGY_NORMS,
  classifyWmoDroughtIndex,
  computeStandardizedPrecipitationIndex
};
