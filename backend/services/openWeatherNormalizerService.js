/**
 * ==============================================================================
 * 🌾 AGRILY AGROMETEOROLOGICAL TELEMETRY: OPENWEATHERMAP & NIMET NORMALIZER
 * ==============================================================================
 *
 * Translates external OpenWeatherMap (OWM 2.5 / 3.0 OneCall) and Nigerian
 * Meteorological Agency (NiMet) synoptic telemetry payloads into canonical
 * Agrily MicroclimateReading records. Also provides deterministic 7-day daily,
 * 24-hour hourly, and 10x10 spatial microclimate radar grids for offline/CI
 * environments across Nigeria's primary agro-ecological zones.
 * ==============================================================================
 */

const {
  computePsychrometricProfile,
  calculateFao56Evapotranspiration,
  calculateGrowingDegreeDays,
  evaluateNocturnalFrostMechanics
} = require('./agrometeorologyEngine');
const { evaluateHourlySprayWindow } = require('./agroSprayWindowAdvisorService');

/**
 * Convert Kelvin to Celsius if value > 170 (auto-detect OWM default Kelvin vs metric Celsius)
 * @param {number} val
 * @returns {number}
 */
function normalizeTempToCelsius(val) {
  const num = Number(val ?? 28.0);
  if (num > 170) {
    return Number((num - 273.15).toFixed(2));
  }
  return Number(num.toFixed(2));
}

/**
 * Normalize an OpenWeatherMap current or hourly payload object into an Agrily
 * MicroclimateReading-compatible object.
 *
 * @param {object} owmPayload - Raw OpenWeatherMap JSON payload
 * @param {object} [stationMeta={}] - Station context (stationCode, elevationMeters, cropType)
 * @returns {object} Normalized microclimate reading
 */
function normalizeOpenWeatherPayload(owmPayload = {}, stationMeta = {}) {
  const current = owmPayload.current || owmPayload.main || owmPayload;
  const windObj = owmPayload.wind || current;
  const cloudsObj = owmPayload.clouds || current;
  const rainObj = owmPayload.rain || current.rain || {};

  const airTempCelsius = normalizeTempToCelsius(
    current.temp ?? current.airTempCelsius ?? 28.5
  );
  const minTempCelsius = normalizeTempToCelsius(
    current.temp_min ?? current.minTempCelsius ?? airTempCelsius - 3.5
  );
  const maxTempCelsius = normalizeTempToCelsius(
    current.temp_max ?? current.maxTempCelsius ?? airTempCelsius + 3.5
  );

  const relativeHumidityPct = Math.max(
    1,
    Math.min(100, Number(current.humidity ?? current.relativeHumidityPct ?? 58))
  );
  const atmosphericPressureHpa = Number(
    current.pressure ?? current.atmosphericPressureHpa ?? 1012
  );

  // OWM wind_speed is in m/s unless windSpeedKmh is explicitly provided
  const rawWindMs = Number(windObj.wind_speed ?? windObj.speed ?? 2.8);
  const windSpeedKmh =
    current.windSpeedKmh !== undefined
      ? Number(current.windSpeedKmh)
      : Number((rawWindMs * 3.6).toFixed(1));

  const windGustKmh =
    current.windGustKmh !== undefined
      ? Number(current.windGustKmh)
      : windObj.wind_gust || windObj.gust
      ? Number((Number(windObj.wind_gust || windObj.gust) * 3.6).toFixed(1))
      : Number((windSpeedKmh * 1.35).toFixed(1));

  const windDirectionDegrees = Number(
    windObj.wind_deg ?? windObj.deg ?? current.windDirectionDegrees ?? 215
  );

  const cloudCoverPct = Math.max(
    0,
    Math.min(100, Number(cloudsObj.clouds ?? cloudsObj.all ?? current.cloudCoverPct ?? 30))
  );

  const precipitationMm = Number(
    rainObj['1h'] ?? rainObj['3h'] ?? current.precipitationMm ?? 0
  );

  // Estimate solar irradiance from cloud cover & UV index if not explicitly supplied
  const uvi = Number(current.uvi ?? 7.5);
  const defaultSolar = Math.round(Math.max(40, (1 - 0.65 * (cloudCoverPct / 100)) * (uvi * 95)));
  const solarIrradianceWm2 = Number(current.solarIrradianceWm2 ?? defaultSolar);

  const visibilityMeters = Number(current.visibility ?? 10000);
  const harmattanDustVisibilityKm = Number(
    (current.harmattanDustVisibilityKm ?? visibilityMeters / 1000).toFixed(1)
  );

  const stationCode = stationMeta.stationCode || owmPayload.stationCode || 'AWS-NG-001';
  const cropType = stationMeta.cropType || owmPayload.cropType || 'Maize';
  const elevationMeters = Number(stationMeta.elevationMeters ?? 350);

  const psychro = computePsychrometricProfile(airTempCelsius, relativeHumidityPct);
  const etReport = calculateFao56Evapotranspiration({
    airTempCelsius,
    minTempCelsius,
    maxTempCelsius,
    relativeHumidityPct,
    windSpeedKmh,
    solarIrradianceWm2,
    elevationMeters,
    cropType
  });
  const gddReport = calculateGrowingDegreeDays({
    minTempCelsius,
    maxTempCelsius,
    cropType
  });
  const frostReport = evaluateNocturnalFrostMechanics({
    airTempCelsius: minTempCelsius,
    dewPointCelsius: psychro.dewPointCelsius,
    cloudCoverPct,
    windSpeedKmh,
    cropType
  });
  const sprayEval = evaluateHourlySprayWindow({
    airTempCelsius,
    relativeHumidityPct,
    windSpeedKmh,
    windGustKmh,
    precipitationMm,
    cloudCoverPct,
    solarIrradianceWm2
  });

  let heatStressSeverity = 'Optimal';
  if (maxTempCelsius >= 39.5) {
    heatStressSeverity = 'Critical Pollen Sterility';
  } else if (maxTempCelsius >= 36.5) {
    heatStressSeverity = 'Severe Heatwave';
  } else if (maxTempCelsius >= 33.5) {
    heatStressSeverity = 'Moderate Heat Stress';
  } else if (maxTempCelsius >= 31.0) {
    heatStressSeverity = 'Mild Thermal Load';
  }

  const timestampEpoch = current.dt ? Number(current.dt) * 1000 : Date.now();

  return {
    stationCode,
    observationTimestamp: current.observationTimestamp || new Date(timestampEpoch).toISOString(),
    readingType: owmPayload.readingType || 'Observed',
    airTempCelsius,
    minTempCelsius,
    maxTempCelsius,
    canopyTempCelsius: frostReport.estimatedCanopyTempCelsius,
    soilTemp10cmCelsius: Number((airTempCelsius * 0.88 + 2.2).toFixed(1)),
    soilTemp30cmCelsius: Number((airTempCelsius * 0.82 + 3.4).toFixed(1)),
    relativeHumidityPct,
    dewPointCelsius: psychro.dewPointCelsius,
    wetBulbCelsius: psychro.wetBulbCelsius,
    deltaTCelsius: psychro.deltaTCelsius,
    vaporPressureDeficitKpa: psychro.vaporPressureDeficitKpa,
    atmosphericPressureHpa,
    windSpeedKmh,
    windGustKmh,
    windDirectionDegrees,
    solarIrradianceWm2,
    photosyntheticActiveRadiationUmol: Math.round(solarIrradianceWm2 * 2.02),
    cloudCoverPct,
    precipitationMm,
    precipitationProbabilityPct: Number(current.pop ? Math.round(current.pop * 100) : current.precipitationProbabilityPct ?? (precipitationMm > 0 ? 85 : 15)),
    soilMoistureVolumetricPct: Number(current.soilMoistureVolumetricPct ?? 24.5),
    leafWetnessDurationHours: Number(current.leafWetnessDurationHours ?? (relativeHumidityPct > 85 || precipitationMm > 0 ? 9 : 2)),
    referenceEvapotranspirationMmDay: etReport.referenceEt0MmDay,
    cropEvapotranspirationEtcMmDay: etReport.cropEvapotranspirationEtcMmDay,
    growingDegreeDaysIncrement: gddReport.gddIncrement,
    harmattanDustVisibilityKm,
    frostRiskProbabilityPct: frostReport.frostProbabilityPct,
    heatStressSeverity,
    sprayWindowSuitability: sprayEval.status
  };
}

/**
 * Generate a deterministic 7-day daily agrometeorological forecast timeline
 * tailored to a station's agro-ecological profile.
 *
 * @param {object} station - WeatherStation document or object
 * @returns {Array<object>} 7-day forecast series
 */
function generateSevenDayForecastSeries(station = {}) {
  const zone = station.agroEcologicalZone || 'Northern Guinea Savannah';
  const cropType = station.primaryCropFocus || 'Maize';
  const stationCode = station.stationCode || 'AWS-KAN-2018';
  const elevationMeters = Number(station.elevationMeters ?? 450);

  const isMontane = zone === 'Mid-Altitude Montane' || elevationMeters >= 1000;
  const isArid = zone === 'Sahel Savannah' || zone === 'Sudan Savannah';
  const isHumid = zone === 'Humid Forest' || zone === 'Southern Guinea Savannah' || zone === 'Derived Savannah';

  const baseDates = [
    '2024-10-14',
    '2024-10-15',
    '2024-10-16',
    '2024-10-17',
    '2024-10-18',
    '2024-10-19',
    '2024-10-20'
  ];

  return baseDates.map((dateStr, idx) => {
    const wave = Math.sin(idx * 0.95);
    const minTempCelsius = Number(
      (isMontane ? 2.2 + idx * 0.4 + wave * 1.1 : isArid ? 21.5 + wave * 1.8 : 22.8 + wave * 1.2).toFixed(1)
    );
    const maxTempCelsius = Number(
      (isMontane ? 21.5 + wave * 1.5 : isArid ? 37.8 + wave * 2.1 : 31.2 + wave * 1.6).toFixed(1)
    );
    const airTempCelsius = Number(((minTempCelsius + maxTempCelsius) / 2).toFixed(1));
    const relativeHumidityPct = Math.round(
      isMontane ? 52 + idx * 3 : isArid ? 24 + (idx % 3) * 5 : 76 + (idx % 4) * 4
    );
    const windSpeedKmh = Number((isArid ? 14.5 + (idx % 3) * 3.2 : 8.2 + (idx % 4) * 2.1).toFixed(1));
    const solarIrradianceWm2 = Math.round(isArid ? 720 - (idx % 2) * 45 : isHumid ? 490 + (idx % 3) * 55 : 610);
    const precipitationMm = isHumid
      ? idx === 2 || idx === 5
        ? Number((28.4 + idx * 3.2).toFixed(1))
        : idx === 3
        ? 8.5
        : 0
      : isMontane && idx === 4
      ? 14.2
      : isArid && idx === 6
      ? 4.0
      : 0;

    return normalizeOpenWeatherPayload(
      {
        observationTimestamp: `${dateStr}T12:00:00Z`,
        readingType: 'DailyAggregate',
        airTempCelsius,
        minTempCelsius,
        maxTempCelsius,
        relativeHumidityPct,
        windSpeedKmh,
        solarIrradianceWm2,
        precipitationMm,
        cloudCoverPct: precipitationMm > 10 ? 82 : isArid ? 12 : 35,
        soilMoistureVolumetricPct: Number(
          Math.max(9.5, Math.min(42.0, (isArid ? 13.5 : 27.0) + precipitationMm * 0.35 - idx * 0.8)).toFixed(1)
        ),
        harmattanDustVisibilityKm: isArid && idx <= 2 ? 2.4 : 9.5
      },
      { stationCode, elevationMeters, cropType }
    );
  });
}

/**
 * Generate a 24-hour hourly forecast series for Delta-T spray planning and diurnal
 * frost/heat tracking.
 *
 * @param {object} station - WeatherStation document or object
 * @returns {Array<object>} 24 hourly forecast frames
 */
function generateHourlyForecastSeries(station = {}) {
  const zone = station.agroEcologicalZone || 'Northern Guinea Savannah';
  const stationCode = station.stationCode || 'AWS-KAN-2018';
  const isMontane = zone === 'Mid-Altitude Montane' || Number(station.elevationMeters) >= 1000;
  const isArid = zone === 'Sahel Savannah' || zone === 'Sudan Savannah';

  const hours = [];
  for (let h = 0; h < 24; h++) {
    const hourPad = String(h).padStart(2, '0');
    // Diurnal temperature wave: minimum at 05:00, maximum at 14:00
    const diurnalPhase = Math.sin(((h - 5) / 24) * 2 * Math.PI);
    const tBase = isMontane ? 11.5 : isArid ? 30.5 : 26.8;
    const tAmp = isMontane ? 9.2 : isArid ? 8.5 : 5.2;
    const airTempCelsius = Number((tBase + tAmp * diurnalPhase).toFixed(1));

    const rhBase = isMontane ? 58 : isArid ? 32 : 74;
    const relativeHumidityPct = Math.max(
      14,
      Math.min(96, Math.round(rhBase - diurnalPhase * (isArid ? 18 : 22)))
    );

    const isDaylight = h >= 6 && h <= 18;
    const solarIrradianceWm2 = isDaylight
      ? Math.round(Math.max(50, Math.sin(((h - 6) / 12) * Math.PI) * (isArid ? 890 : 740)))
      : 0;

    // Wind picks up mid-day, calm pre-dawn
    const windSpeedKmh = Number(
      (isDaylight ? 6.5 + Math.sin(((h - 6) / 12) * Math.PI) * (isArid ? 12.5 : 7.5) : 2.4 + (h % 2) * 1.1).toFixed(1)
    );

    const precipitationMm = !isArid && (h === 16 || h === 17) ? 6.4 : 0;
    const cloudCoverPct = precipitationMm > 0 ? 85 : isArid ? 10 : 28;

    hours.push({
      stationCode,
      observationTimestamp: `2024-10-14T${hourPad}:00:00Z`,
      hourLabel: `${hourPad}:00`,
      airTempCelsius,
      relativeHumidityPct,
      windSpeedKmh,
      windGustKmh: Number((windSpeedKmh * 1.32).toFixed(1)),
      solarIrradianceWm2,
      precipitationMm,
      precipitationProbabilityPct: precipitationMm > 0 ? 80 : h === 15 ? 45 : 10,
      cloudCoverPct
    });
  }

  return hours;
}

/**
 * Generate a 8x8 spatial microclimate radar grid around a station's coordinates
 * for rendering precipitation cells, frost pockets, VPD gradients, and wind vectors.
 *
 * @param {object} station - WeatherStation document or object
 * @returns {Array<object>} 64 spatial radar grid cells
 */
function generateMicroclimateRadarGrid(station = {}) {
  const zone = station.agroEcologicalZone || 'Northern Guinea Savannah';
  const isMontane = zone === 'Mid-Altitude Montane' || Number(station.elevationMeters) >= 1000;
  const isArid = zone === 'Sahel Savannah' || zone === 'Sudan Savannah';

  const cells = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      // Storm cell centered near (row=3, col=5)
      const distStorm = Math.hypot(row - 3, col - 5);
      const precipIntensityMmHr = isArid
        ? Number(Math.max(0, 6.5 - distStorm * 2.2).toFixed(1))
        : Number(Math.max(0, 34.0 - distStorm * 7.5).toFixed(1));

      // Valley frost pocket centered near (row=6, col=2)
      const distValley = Math.hypot(row - 6, col - 2);
      const baseTemp = isMontane ? 4.2 : isArid ? 36.8 : 28.5;
      const canopyTempCelsius = Number(
        (baseTemp - (isMontane ? Math.max(0, 4.5 - distValley * 1.2) : 0) + (row - 4) * 0.45).toFixed(1)
      );

      const windSpeedKmh = Number((8.5 + col * 1.4 + (row % 3) * 1.8).toFixed(1));
      const windDirectionDegrees = (210 + row * 8 - col * 5) % 360;
      const vpdKpa = Number(
        Math.max(0.3, (isArid ? 3.4 : isMontane ? 0.9 : 1.6) + (col - 3) * 0.18 - precipIntensityMmHr * 0.04).toFixed(2)
      );

      let cellHazardLabel = 'Nominal';
      if (isMontane && canopyTempCelsius <= 1.5) {
        cellHazardLabel = 'Frost Pocket';
      } else if (precipIntensityMmHr >= 22.0) {
        cellHazardLabel = 'Convective Squall';
      } else if (vpdKpa >= 3.0) {
        cellHazardLabel = 'Desiccation Zone';
      } else if (windSpeedKmh >= 16.0) {
        cellHazardLabel = 'Spray Drift Zone';
      }

      cells.push({
        cellId: `R${row}-C${col}`,
        row,
        col,
        canopyTempCelsius,
        precipIntensityMmHr,
        windSpeedKmh,
        windDirectionDegrees,
        vpdKpa,
        relativeHumidityPct: Math.max(15, Math.min(98, Math.round(78 - vpdKpa * 16))),
        cellHazardLabel
      });
    }
  }
  return cells;
}

module.exports = {
  normalizeTempToCelsius,
  normalizeOpenWeatherPayload,
  generateSevenDayForecastSeries,
  generateHourlyForecastSeries,
  generateMicroclimateRadarGrid
};
