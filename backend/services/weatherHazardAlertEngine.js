/**
 * ==============================================================================
 * 🌾 AGRILY AGROMETEOROLOGICAL TELEMETRY: WEATHER HAZARD ALERT ENGINE
 * ==============================================================================
 *
 * Evaluates real-time and 48-hour forecast microclimate observations against
 * crop-specific physiological thresholds and farmer subscription rules.
 * Generates actionable early-warning advisories for:
 *  1. Nocturnal Radiative Frost & Advective Freeze (Montane & Dry Season)
 *  2. Anthesis Heatwave & Pollen Sterility Stress
 *  3. Convective Flash Flood & Soil Root-Zone Waterlogging
 *  4. Harmattan Aerosol Desiccation & Extreme VPD Lockout
 *  5. Phytopathogen Leaf Wetness Infection Windows (Late Blight / Sigatoka)
 *  6. Prolonged Agricultural Dry Spell / Evapotranspiration Deficit
 * ==============================================================================
 */

const {
  computePsychrometricProfile,
  calculateFao56Evapotranspiration,
  evaluateNocturnalFrostMechanics
} = require('./agrometeorologyEngine');

const DEFAULT_THRESHOLDS = {
  frostTemperatureThresholdCelsius: 3.5,
  heatwaveTemperatureThresholdCelsius: 36.5,
  maxSprayWindSpeedKmh: 15.0,
  heavyRainfallThresholdMmHour: 25.0,
  droughtConsecutiveDryDays: 10,
  criticalVpdKpa: 2.8,
  fungalLeafWetnessHours: 8
};

/**
 * Evaluate a single microclimate observation or forecast frame and return all
 * triggered agronomy hazard alerts with mitigation recommendations.
 *
 * @param {object} reading - Microclimate reading payload
 * @param {object} [options] - Optional crop context and custom farmer thresholds
 * @returns {object} Comprehensive hazard assessment report
 */
function evaluateMicroclimateHazards(reading = {}, options = {}) {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(options.thresholds || {}) };
  const cropType = options.cropType || reading.cropType || 'Maize';
  const phenologyStage = options.phenologyStage || 'Flowering / Anthesis';
  const stationCode = reading.stationCode || options.stationCode || 'AWS-NG-001';

  const airTemp = Number(reading.airTempCelsius ?? 28.0);
  const minTemp = Number(reading.minTempCelsius ?? airTemp);
  const maxTemp = Number(reading.maxTempCelsius ?? airTemp);
  const rh = Number(reading.relativeHumidityPct ?? 55.0);
  const windKmh = Number(reading.windSpeedKmh ?? 10.0);
  const windGustKmh = Number(reading.windGustKmh ?? windKmh * 1.35);
  const precipMm = Number(reading.precipitationMm ?? 0);
  const leafWetnessHrs = Number(reading.leafWetnessDurationHours ?? 0);
  const cloudCoverPct = Number(reading.cloudCoverPct ?? 25);
  const visibilityKm = Number(reading.harmattanDustVisibilityKm ?? 10.0);
  const consecutiveDryDays = Number(reading.consecutiveDryDays ?? options.consecutiveDryDays ?? 0);

  const psychro = computePsychrometricProfile(airTemp, rh);
  const etReport = calculateFao56Evapotranspiration({
    airTempCelsius: airTemp,
    minTempCelsius: minTemp,
    maxTempCelsius: maxTemp,
    relativeHumidityPct: rh,
    windSpeedKmh: windKmh,
    solarIrradianceWm2: reading.solarIrradianceWm2 ?? 540,
    elevationMeters: options.elevationMeters ?? 350,
    cropType,
    phenologyStage
  });

  const frostReport = evaluateNocturnalFrostMechanics({
    airTempCelsius: minTemp,
    dewPointCelsius: psychro.dewPointCelsius,
    cloudCoverPct,
    windSpeedKmh: windKmh,
    cropType
  });

  const alerts = [];

  // 1. Frost / Chilling Injury Hazard
  if (
    minTemp <= thresholds.frostTemperatureThresholdCelsius ||
    frostReport.estimatedCanopyTempCelsius <= thresholds.frostTemperatureThresholdCelsius
  ) {
    const isCritical = frostReport.estimatedCanopyTempCelsius <= 0.5 || minTemp <= 1.0;
    alerts.push({
      alertCode: `ALT-FROST-${stationCode}`,
      hazardType: frostReport.frostMechanism === 'Advective Freeze' ? 'ADVECTIVE_FREEZE' : 'RADIATIVE_FROST',
      severity: isCritical ? 'Critical Emergency' : 'Warning',
      headline: `${isCritical ? 'CRITICAL FREEZE' : 'Frost Warning'}: Canopy temp projected at ${frostReport.estimatedCanopyTempCelsius}°C (${frostReport.frostMechanism})`,
      cropImpact: `${cropType} at ${phenologyStage} faces intracellular ice crystallization and vascular necrosis below ${frostReport.cropCriticalFreezeThresholdCelsius}°C.`,
      mitigationActions: [
        'Activate overhead micro-sprinkler frost protection (2.5–3.5 mm/hr) before wet-bulb temperature reaches 0.5°C to release latent heat of fusion (334 kJ/kg).',
        'Pre-irrigate dry topsoil before sunset to increase soil thermal conductivity and upward nocturnal longwave heat flux.',
        frostReport.isBlackFrostRisk
          ? 'BLACK FROST ALERT: Very low dew point prevents hoarfrost formation; run continuous misting until sunrise.'
          : 'Avoid cultivating or disturbing soil within 24 hours prior to the frost window.'
      ],
      metrics: {
        shelterMinTempCelsius: minTemp,
        estimatedCanopyTempCelsius: frostReport.estimatedCanopyTempCelsius,
        frostProbabilityPct: frostReport.frostProbabilityPct,
        isBlackFrostRisk: frostReport.isBlackFrostRisk
      }
    });
  }

  // 2. Heatwave & Anthesis Pollen Sterility Hazard
  if (maxTemp >= thresholds.heatwaveTemperatureThresholdCelsius) {
    const isCritical = maxTemp >= 39.5;
    alerts.push({
      alertCode: `ALT-HEAT-${stationCode}`,
      hazardType: 'HEATWAVE_POLLEN_STERILITY',
      severity: isCritical ? 'Critical Emergency' : 'Warning',
      headline: `${isCritical ? 'Extreme Heatwave' : 'Thermal Stress Advisory'}: Peak air temperature ${maxTemp}°C with VPD ${psychro.vaporPressureDeficitKpa} kPa`,
      cropImpact: `High canopy thermal load during ${phenologyStage} accelerates pollen desiccation, reduces stigma receptivity, and triggers flower/pod abortion in ${cropType}.`,
      mitigationActions: [
        `Apply pulse cooling irrigation (${Math.round(etReport.cropEvapotranspirationEtcMmDay * 1.15)} mm/day) between 11:00 and 15:00 WAT to lower canopy temperature via transpirational cooling.`,
        'Suspend foliar fertilizer or EC-heavy agrochemical applications during peak solar irradiance.',
        'Maintain organic surface mulch (5–8 cm) to buffer 10cm root-zone soil temperatures.'
      ],
      metrics: {
        maxTempCelsius: maxTemp,
        vaporPressureDeficitKpa: psychro.vaporPressureDeficitKpa,
        cropEtcMmDay: etReport.cropEvapotranspirationEtcMmDay
      }
    });
  }

  // 3. Convective Flash Flood & Waterlogging Hazard
  if (precipMm >= thresholds.heavyRainfallThresholdMmHour) {
    const isCritical = precipMm >= 55.0;
    alerts.push({
      alertCode: `ALT-FLOOD-${stationCode}`,
      hazardType: 'FLASH_FLOOD_WATERLOGGING',
      severity: isCritical ? 'Critical Emergency' : 'Warning',
      headline: `Heavy Convective Downpour (${precipMm} mm): Root-Zone Waterlogging & Nutrient Leaching Alert`,
      cropImpact: `Intense precipitation exceeds soil infiltration capacity, causing rhizosphere hypoxia, nitrate leaching, and foliar agrochemical wash-off.`,
      mitigationActions: [
        'Clear perimeter drainage furrows and diversion bunds immediately to prevent standing water > 12 hours.',
        'Postpone top-dressing urea/NPK applications until soil matric potential drains below field capacity.',
        'Inspect lower stems and tubers for water-borne oomycete (Pythium/Phytophthora) lesions 48 hours post-storm.'
      ],
      metrics: {
        precipitationMm: precipMm,
        windGustKmh
      }
    });
  }

  // 4. Harmattan Desiccation & Extreme VPD Lockout
  if (psychro.vaporPressureDeficitKpa >= thresholds.criticalVpdKpa || visibilityKm <= 3.5) {
    alerts.push({
      alertCode: `ALT-HARMATTAN-${stationCode}`,
      hazardType: 'HARMATTAN_DESICCATION',
      severity: psychro.vaporPressureDeficitKpa >= 3.6 || visibilityKm <= 1.8 ? 'Critical Emergency' : 'Watch',
      headline: `Harmattan Atmospheric Desiccation: VPD ${psychro.vaporPressureDeficitKpa} kPa & Dust Visibility ${visibilityKm} km`,
      cropImpact: `Dry Saharan northeasterly winds force guard-cell stomatal closure, halting photosynthesis while fine dust coats leaf cuticles and reduces PAR absorption.`,
      mitigationActions: [
        'Increase irrigation frequency with shorter cycle intervals to offset high aerodynamic evapotranspiration.',
        'Utilize windbreaks or shelterbelts on north-eastern parcel boundaries to reduce aerodynamic boundary-layer stripping.',
        'Avoid fine-nozzle mist spraying; use low-drift air-induction nozzles due to high Delta-T droplet evaporation.'
      ],
      metrics: {
        vaporPressureDeficitKpa: psychro.vaporPressureDeficitKpa,
        deltaTCelsius: psychro.deltaTCelsius,
        visibilityKm
      }
    });
  }

  // 5. Fungal Blight Leaf Wetness Hazard
  if (leafWetnessHrs >= thresholds.fungalLeafWetnessHours && airTemp >= 14 && airTemp <= 28 && rh >= 82) {
    alerts.push({
      alertCode: `ALT-FUNGAL-${stationCode}`,
      hazardType: 'FUNGAL_BLIGHT_WETNESS',
      severity: leafWetnessHrs >= 12 ? 'Warning' : 'Watch',
      headline: `Phytopathogen Infection Window: ${leafWetnessHrs}h Leaf Wetness at ${airTemp}°C (${rh}% RH)`,
      cropImpact: `Warm humid canopy microclimate satisfies Smith/Wallin sporulation criteria for Late Blight (Phytophthora) and Cercospora leaf spot on ${cropType}.`,
      mitigationActions: [
        'Schedule preventative systemic or contact fungicide application during the next valid Delta-T spray window.',
        'Avoid overhead sprinkler irrigation during evening hours to prevent extending nocturnal leaf wetness duration.'
      ],
      metrics: {
        leafWetnessDurationHours: leafWetnessHrs,
        relativeHumidityPct: rh,
        airTempCelsius: airTemp
      }
    });
  }

  // 6. Prolonged Dry Spell / Soil Moisture Deficit
  if (
    consecutiveDryDays >= thresholds.droughtConsecutiveDryDays ||
    (reading.soilMoistureVolumetricPct !== undefined && Number(reading.soilMoistureVolumetricPct) <= 13.5)
  ) {
    alerts.push({
      alertCode: `ALT-DROUGHT-${stationCode}`,
      hazardType: 'DROUGHT_DEFICIT',
      severity: consecutiveDryDays >= 18 || Number(reading.soilMoistureVolumetricPct) <= 9.5 ? 'Critical Emergency' : 'Warning',
      headline: `Agricultural Dry Spell Alert: ${consecutiveDryDays} Consecutive Dry Days (ETc Demand ${etReport.cropEvapotranspirationEtcMmDay} mm/day)`,
      cropImpact: `Depleted root-zone available water capacity induces leaf rolling, stomatal closure, and assimilate partitioning loss in ${cropType}.`,
      mitigationActions: [
        `Deliver deficit-recovery irrigation of ${Math.round(etReport.grossIrrigationLitersPerHectare / 1000)} m³/ha prioritizing flowering and grain-fill blocks.`,
        'Apply potassium silicate or osmoprotectant foliar biostimulants during early morning hours to bolster turgor pressure.'
      ],
      metrics: {
        consecutiveDryDays,
        soilMoistureVolumetricPct: reading.soilMoistureVolumetricPct ?? 12.0,
        dailyCropEtcMm: etReport.cropEvapotranspirationEtcMmDay
      }
    });
  }

  // Sort alerts by severity priority
  const severityOrder = { 'Critical Emergency': 4, Warning: 3, Watch: 2, Advisory: 1 };
  alerts.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));

  const highestSeverity = alerts.length > 0 ? alerts[0].severity : 'All Clear';

  return {
    stationCode,
    cropType,
    phenologyStage,
    evaluatedAt: new Date().toISOString(),
    overallRiskLevel: highestSeverity,
    activeAlertCount: alerts.length,
    psychrometrics: psychro,
    evapotranspiration: etReport,
    frostDiagnostics: frostReport,
    alerts
  };
}

/**
 * Scan a multi-hour forecast series (e.g. 48-hour or 7-day timeline) and aggregate
 * upcoming hazard windows with lead-time countdowns.
 *
 * @param {Array<object>} forecastFrames - Array of hourly/daily forecast readings
 * @param {object} [options] - Crop & threshold options
 * @returns {object} Forecast hazard timeline summary
 */
function analyzeForecastHazardTimeline(forecastFrames = [], options = {}) {
  if (!Array.isArray(forecastFrames) || forecastFrames.length === 0) {
    return {
      totalFramesAnalyzed: 0,
      hazardWindowsCount: 0,
      cumulativeRainfallMm: 0,
      cumulativeEtcMm: 0,
      lowestCanopyTempCelsius: null,
      peakAirTempCelsius: null,
      events: []
    };
  }

  let cumulativeRainfallMm = 0;
  let cumulativeEtcMm = 0;
  let lowestCanopyTempCelsius = Infinity;
  let peakAirTempCelsius = -Infinity;
  const eventMap = new Map();

  forecastFrames.forEach((frame, idx) => {
    const evalResult = evaluateMicroclimateHazards(frame, options);
    const precip = Number(frame.precipitationMm || 0);
    cumulativeRainfallMm += precip;

    // Scale daily ETc by frame interval (assume hourly if > 14 frames, else daily)
    const isHourly = forecastFrames.length > 14;
    const etcIncrement = isHourly
      ? evalResult.evapotranspiration.cropEvapotranspirationEtcMmDay / 24
      : evalResult.evapotranspiration.cropEvapotranspirationEtcMmDay;
    cumulativeEtcMm += etcIncrement;

    if (evalResult.frostDiagnostics.estimatedCanopyTempCelsius < lowestCanopyTempCelsius) {
      lowestCanopyTempCelsius = evalResult.frostDiagnostics.estimatedCanopyTempCelsius;
    }
    const frameMax = Number(frame.maxTempCelsius ?? frame.airTempCelsius ?? 28);
    if (frameMax > peakAirTempCelsius) {
      peakAirTempCelsius = frameMax;
    }

    evalResult.alerts.forEach((alert) => {
      if (!eventMap.has(alert.hazardType)) {
        eventMap.set(alert.hazardType, {
          ...alert,
          firstDetectedTimestamp: frame.observationTimestamp || new Date().toISOString(),
          leadTimeFrames: idx,
          occurrenceFramesCount: 1
        });
      } else {
        const existing = eventMap.get(alert.hazardType);
        existing.occurrenceFramesCount += 1;
        if (alert.severity === 'Critical Emergency') {
          existing.severity = 'Critical Emergency';
          existing.headline = alert.headline;
        }
      }
    });
  });

  const events = Array.from(eventMap.values());
  return {
    totalFramesAnalyzed: forecastFrames.length,
    hazardWindowsCount: events.length,
    cumulativeRainfallMm: Number(cumulativeRainfallMm.toFixed(1)),
    cumulativeEtcMm: Number(cumulativeEtcMm.toFixed(2)),
    moistureBalanceMm: Number((cumulativeRainfallMm - cumulativeEtcMm).toFixed(2)),
    lowestCanopyTempCelsius: Number(lowestCanopyTempCelsius.toFixed(2)),
    peakAirTempCelsius: Number(peakAirTempCelsius.toFixed(2)),
    events
  };
}

module.exports = {
  DEFAULT_THRESHOLDS,
  evaluateMicroclimateHazards,
  analyzeForecastHazardTimeline
};
