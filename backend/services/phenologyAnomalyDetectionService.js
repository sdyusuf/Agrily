/**
 * =============================================================================
 * 📈 PHENOLOGY ANOMALY DETECTION SERVICE
 * =============================================================================
 * Algorithmic change detection across multi-temporal satellite vegetation time series.
 * Combines CUSUM (Cumulative Sum) shift detection, Z-score historical deviation,
 * and abrupt canopy shock classification.
 */

const crypto = require('crypto');

/**
 * Evaluates a chronological series of satellite readings for vegetative anomalies
 * 
 * @param {Array<Object>} readings - Sorted ascending by readingDate
 * @param {Object} options - Thresholds and parameters
 * @returns {Array<Object>} Detected anomalies with recommendations
 */
function detectPhenologyAnomalies(readings = [], options = {}) {
  if (!Array.isArray(readings) || readings.length < 2) {
    return [];
  }

  const zThreshold = Number(options.zThreshold) || -1.65; // ~95% confidence interval
  const abruptDropThreshold = Number(options.abruptDropThreshold) || -0.12;
  const cusumTargetSlack = Number(options.cusumSlack) || 0.05;

  const validReadings = readings.filter((r) => typeof r.meanNdvi === 'number' && !isNaN(r.meanNdvi));
  if (validReadings.length < 2) return [];

  // Compute baseline mean and variance across entire observed profile
  const ndviValues = validReadings.map((r) => r.meanNdvi);
  const baselineMean = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;
  const baselineVariance = ndviValues.reduce((acc, val) => acc + Math.pow(val - baselineMean, 2), 0) / ndviValues.length;
  const baselineStdDev = Math.sqrt(baselineVariance) || 0.05;

  const alerts = [];
  let cusumNeg = 0;

  validReadings.forEach((reading, idx) => {
    const readingDateStr = reading.readingDate instanceof Date 
      ? reading.readingDate.toISOString().split('T')[0] 
      : String(reading.readingDate || '').split('T')[0];

    const currentNdvi = reading.meanNdvi;
    const currentNdwi = reading.meanNdwi !== undefined ? reading.meanNdwi : 0.15;

    // 1. Z-Score Historical Baseline Anomaly
    const zScore = (currentNdvi - baselineMean) / baselineStdDev;
    if (zScore <= zThreshold) {
      alerts.push({
        alertId: `ALT-Z-${idx}-${Date.now().toString(36)}`,
        date: readingDateStr,
        meanNdvi: currentNdvi,
        metric: 'Z_SCORE_ANOMALY',
        deviationScore: parseFloat(zScore.toFixed(2)),
        alertType: 'Canopy Biomass Deficit',
        severity: zScore < -2.2 ? 'Critical' : 'Warning',
        rootCauseHypothesis: 'Significant downward departure from seasonal trajectory. Potential nutrient chlorosis, flood damage, or disease outbreak.',
        recommendation: 'Deploy agronomist for ground-truth inspection. Check localized nitrogen availability and soil moisture sensors.'
      });
    }

    // 2. Abrupt Single-Pass Vigor Drop
    if (idx > 0) {
      const prevReading = validReadings[idx - 1];
      const deltaNdvi = currentNdvi - prevReading.meanNdvi;
      const daysBetween = Math.max(1, Math.round((new Date(reading.readingDate) - new Date(prevReading.readingDate)) / (1000 * 60 * 60 * 24)));

      if (deltaNdvi <= abruptDropThreshold) {
        alerts.push({
          alertId: `ALT-DROP-${idx}-${Date.now().toString(36)}`,
          date: readingDateStr,
          meanNdvi: currentNdvi,
          deltaNdvi: parseFloat(deltaNdvi.toFixed(3)),
          daysBetween,
          metric: 'ABRUPT_CANOPY_SHOCK',
          alertType: 'Rapid Defoliation Event',
          severity: deltaNdvi <= -0.20 ? 'Critical' : 'Warning',
          rootCauseHypothesis: 'Sudden collapse in canopy greenness within short interval. Typical of pest swarms (Armyworm/Locusts), chemical burn, or hailstorm.',
          recommendation: 'Immediate pest outbreak scout dispatch advised. Review drone or handheld foliar diagnostics.'
        });
      }
    }

    // 3. Canopy Water Deficit Stress
    if (currentNdwi < -0.05 && currentNdvi < 0.50) {
      alerts.push({
        alertId: `ALT-WATER-${idx}-${Date.now().toString(36)}`,
        date: readingDateStr,
        meanNdvi: currentNdvi,
        meanNdwi: currentNdwi,
        metric: 'CANOPY_WATER_DEFICIT',
        alertType: 'Severe Moisture Stress',
        severity: currentNdwi < -0.15 ? 'Critical' : 'Warning',
        rootCauseHypothesis: 'Sub-zero NDWI combined with suppressed NDVI signals persistent plant tissue desiccation.',
        recommendation: 'Activate irrigation cycle immediately. Prioritize dripline flow to moisture-stressed quadrants.'
      });
    }

    // 4. Tabular CUSUM Drift Detection
    const shift = (baselineMean - cusumTargetSlack) - currentNdvi;
    cusumNeg = Math.max(0, cusumNeg + shift);
    if (cusumNeg > (3.5 * baselineStdDev)) {
      alerts.push({
        alertId: `ALT-CUSUM-${idx}-${Date.now().toString(36)}`,
        date: readingDateStr,
        meanNdvi: currentNdvi,
        metric: 'CUSUM_PROGRESSIVE_DECLINE',
        cusumStatistic: parseFloat(cusumNeg.toFixed(3)),
        alertType: 'Chronic Canopy Degradation',
        severity: 'Warning',
        rootCauseHypothesis: 'Persistent low-level stress accumulating across consecutive satellite revisit intervals.',
        recommendation: 'Evaluate cumulative thermal stress and soil compaction. Consider mid-season foliar biostimulant application.'
      });
      cusumNeg = 0; // Reset after alert
    }
  });

  return alerts;
}

/**
 * Generates an end-of-season phenology synthesis with cryptographic summary seal
 */
function generatePhenologySeasonReport(parcel, readings = []) {
  const anomalies = detectPhenologyAnomalies(readings);
  const ndviValues = readings.map((r) => r.meanNdvi || 0);
  const peakNdvi = ndviValues.length > 0 ? Math.max(...ndviValues) : 0;
  const avgNdvi = ndviValues.length > 0 ? parseFloat((ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length).toFixed(3)) : 0;

  const seal = crypto.createHash('sha256')
    .update(`${parcel?.parcelCode || 'PARCEL'}|${readings.length}|${peakNdvi}|${avgNdvi}`)
    .digest('hex');

  return {
    success: true,
    parcelId: parcel?._id,
    parcelCode: parcel?.parcelCode,
    parcelName: parcel?.parcelName,
    cropType: parcel?.cropType,
    totalPassesEvaluated: readings.length,
    peakCanopyNdvi: peakNdvi,
    averageSeasonNdvi: avgNdvi,
    detectedAnomaliesCount: anomalies.length,
    anomalies,
    cryptographicReportSeal: seal,
    evaluatedAt: new Date().toISOString()
  };
}

module.exports = {
  detectPhenologyAnomalies,
  generatePhenologySeasonReport
};
