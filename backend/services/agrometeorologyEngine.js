/**
 * ==============================================================================
 * 🌾 AGRILY AGROMETEOROLOGICAL TELEMETRY: FAO-56 PENMAN-MONTEITH & THERMODYNAMICS
 * ==============================================================================
 *
 * Implements physical agrometeorology equations for tropical and montane
 * agricultural systems:
 *  - FAO-56 Penman-Monteith Reference Evapotranspiration (ET0) & Crop ETc (Kc)
 *  - Vapor Pressure Deficit (VPD) & Stomatal Conductance Stress Classification
 *  - Growing Degree Days (GDD) with Crop-Specific Base & Upper Cutoffs
 *  - Magnus-Tetens Dew Point & Stull Psychrometric Wet-Bulb Inversion
 *  - Nocturnal Radiative vs. Advective Frost Probability & Canopy Cooling
 * ==============================================================================
 */

const CROP_CARDINAL_TEMPERATURES = {
  Maize: { tBase: 10.0, tOpt: 28.0, tUpper: 36.0, kcIni: 0.35, kcMid: 1.20, kcEnd: 0.60, frostCriticalCelsius: 1.5 },
  Rice: { tBase: 10.0, tOpt: 30.0, tUpper: 37.0, kcIni: 1.05, kcMid: 1.20, kcEnd: 0.90, frostCriticalCelsius: 3.0 },
  Cassava: { tBase: 13.0, tOpt: 29.0, tUpper: 38.0, kcIni: 0.30, kcMid: 0.85, kcEnd: 0.40, frostCriticalCelsius: 4.0 },
  Yam: { tBase: 12.0, tOpt: 28.0, tUpper: 36.0, kcIni: 0.40, kcMid: 1.10, kcEnd: 0.65, frostCriticalCelsius: 3.5 },
  Sorghum: { tBase: 10.0, tOpt: 31.0, tUpper: 39.0, kcIni: 0.35, kcMid: 1.05, kcEnd: 0.55, frostCriticalCelsius: 2.0 },
  Millet: { tBase: 11.0, tOpt: 32.0, tUpper: 40.0, kcIni: 0.30, kcMid: 1.00, kcEnd: 0.35, frostCriticalCelsius: 2.5 },
  Tomato: { tBase: 10.0, tOpt: 25.0, tUpper: 34.0, kcIni: 0.60, kcMid: 1.15, kcEnd: 0.80, frostCriticalCelsius: 1.8 },
  Potato: { tBase: 7.0, tOpt: 20.0, tUpper: 30.0, kcIni: 0.50, kcMid: 1.15, kcEnd: 0.75, frostCriticalCelsius: 0.5 },
  Soybean: { tBase: 10.0, tOpt: 27.0, tUpper: 35.0, kcIni: 0.40, kcMid: 1.15, kcEnd: 0.50, frostCriticalCelsius: 1.5 },
  Cowpea: { tBase: 11.0, tOpt: 29.0, tUpper: 37.0, kcIni: 0.40, kcMid: 1.05, kcEnd: 0.55, frostCriticalCelsius: 2.5 },
  Onion: { tBase: 6.0, tOpt: 22.0, tUpper: 32.0, kcIni: 0.70, kcMid: 1.05, kcEnd: 0.75, frostCriticalCelsius: -1.0 },
  Cocoa: { tBase: 14.0, tOpt: 26.0, tUpper: 34.0, kcIni: 1.00, kcMid: 1.05, kcEnd: 1.00, frostCriticalCelsius: 6.0 }
};

/**
 * Compute saturation vapor pressure es(T) in kPa using the FAO-56 Tetens equation.
 * @param {number} tempCelsius - Air temperature in degrees Celsius
 * @returns {number} Saturation vapor pressure in kPa
 */
function computeSaturationVaporPressureKpa(tempCelsius) {
  const T = Number(tempCelsius || 0);
  const es = 0.6108 * Math.exp((17.27 * T) / (T + 237.3));
  return Number(es.toFixed(4));
}

/**
 * Compute slope of saturation vapor pressure curve Delta (kPa / °C).
 * @param {number} tempCelsius - Mean air temperature (°C)
 * @returns {number} Slope Delta in kPa / °C
 */
function computeVaporPressureSlopeDelta(tempCelsius) {
  const T = Number(tempCelsius || 0);
  const es = computeSaturationVaporPressureKpa(T);
  const delta = (4098 * es) / Math.pow(T + 237.3, 2);
  return Number(delta.toFixed(5));
}

/**
 * Compute standard barometric pressure P (kPa) and psychrometric constant gamma (kPa / °C)
 * given elevation z in meters above sea level (FAO-56 Eq. 7 & 8).
 * @param {number} elevationMeters - Station altitude (m)
 * @returns {{ pressureKpa: number, psychrometricConstantGamma: number }}
 */
function computePsychrometricParameters(elevationMeters = 250) {
  const z = Math.max(-50, Math.min(5500, Number(elevationMeters || 0)));
  const pressureKpa = 101.3 * Math.pow((293 - 0.0065 * z) / 293, 5.26);
  const gamma = 0.000665 * pressureKpa;
  return {
    pressureKpa: Number(pressureKpa.toFixed(3)),
    psychrometricConstantGamma: Number(gamma.toFixed(5))
  };
}

/**
 * Convert wind speed measured at height zMeters (e.g., 10m) to standard 2m height (u2)
 * in m/s using FAO-56 Eq. 47 logarithmic wind profile.
 * @param {number} windSpeedKmh - Wind speed in km/h
 * @param {number} anemometerHeightMeters - Sensor height in meters (default 10m or 2m)
 * @returns {number} Wind speed u2 at 2m height in m/s
 */
function convertWindSpeedTo2mMs(windSpeedKmh, anemometerHeightMeters = 2.0) {
  const uzMs = Math.max(0.1, Number(windSpeedKmh || 0) / 3.6);
  const z = Math.max(0.5, Number(anemometerHeightMeters || 2.0));
  if (Math.abs(z - 2.0) < 0.05) {
    return Number(uzMs.toFixed(3));
  }
  const u2 = uzMs * (4.87 / Math.log(67.8 * z - 5.42));
  return Number(Math.max(0.1, u2).toFixed(3));
}

/**
 * Compute Vapor Pressure Deficit (VPD), Dew Point, Wet-Bulb temperature, and Delta-T.
 * @param {number} airTempCelsius - Dry-bulb air temperature (°C)
 * @param {number} relativeHumidityPct - Relative humidity (%)
 * @returns {object} Thermodynamic psychrometric profile
 */
function computePsychrometricProfile(airTempCelsius, relativeHumidityPct) {
  const T = Number(airTempCelsius ?? 28.0);
  const RH = Math.max(1, Math.min(100, Number(relativeHumidityPct ?? 55.0)));

  const esKpa = computeSaturationVaporPressureKpa(T);
  const eaKpa = Number((esKpa * (RH / 100)).toFixed(4));
  const vpdKpa = Number(Math.max(0, esKpa - eaKpa).toFixed(3));

  const alpha = (17.27 * T) / (237.3 + T) + Math.log(RH / 100);
  const dewPointCelsius = Number(((237.3 * alpha) / (17.27 - alpha)).toFixed(2));

  const wetBulbCelsius = Number(
    (
      T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
      Math.atan(T + RH) -
      Math.atan(RH - 1.676331) +
      0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
      4.686035
    ).toFixed(2)
  );

  const deltaTCelsius = Number(Math.max(0, T - wetBulbCelsius).toFixed(2));

  let stomatalStressClass = 'Optimal Transpiration';
  if (vpdKpa < 0.4) {
    stomatalStressClass = 'Low VPD / High Fungal Condensation Risk';
  } else if (vpdKpa > 3.0) {
    stomatalStressClass = 'Severe Stomatal Closure / Desiccation Lockout';
  } else if (vpdKpa > 2.0) {
    stomatalStressClass = 'Elevated Transpiration Demand';
  } else if (vpdKpa > 1.5) {
    stomatalStressClass = 'Mild Atmospheric Demand';
  }

  return {
    airTempCelsius: T,
    relativeHumidityPct: RH,
    saturationVaporPressureKpa: esKpa,
    actualVaporPressureKpa: eaKpa,
    vaporPressureDeficitKpa: vpdKpa,
    dewPointCelsius,
    wetBulbCelsius,
    deltaTCelsius,
    stomatalStressClass
  };
}

/**
 * Compute FAO-56 Penman-Monteith Reference Evapotranspiration (ET0) and Crop Evapotranspiration (ETc).
 *
 * @param {object} params
 * @param {number} params.airTempCelsius - Mean or instantaneous air temperature (°C)
 * @param {number} [params.minTempCelsius] - Daily minimum temperature (°C)
 * @param {number} [params.maxTempCelsius] - Daily maximum temperature (°C)
 * @param {number} params.relativeHumidityPct - Relative humidity (%)
 * @param {number} params.windSpeedKmh - Wind speed (km/h)
 * @param {number} params.solarIrradianceWm2 - Mean daytime/instantaneous solar irradiance (W/m²)
 * @param {number} [params.elevationMeters=250] - Altitude above sea level (m)
 * @param {string} [params.cropType='Maize'] - Target crop species
 * @param {string} [params.phenologyStage='Mid-Season'] - 'Initial', 'Mid-Season', or 'Late-Season'
 * @returns {object} Detailed FAO-56 evapotranspiration and irrigation water requirement breakdown
 */
function calculateFao56Evapotranspiration(params = {}) {
  const tMean =
    params.minTempCelsius !== undefined && params.maxTempCelsius !== undefined
      ? (Number(params.minTempCelsius) + Number(params.maxTempCelsius)) / 2
      : Number(params.airTempCelsius ?? 28.5);

  const rh = Math.max(1, Math.min(100, Number(params.relativeHumidityPct ?? 55)));
  const windKmh = Math.max(0, Number(params.windSpeedKmh ?? 10.0));
  const solarWm2 = Math.max(0, Number(params.solarIrradianceWm2 ?? 520));
  const elevation = Number(params.elevationMeters ?? 250);
  const cropType = params.cropType || 'Maize';
  const stage = params.phenologyStage || 'Mid-Season';

  // Convert solar irradiance W/m² (assuming 12-hour tropical photoperiod equivalent if instantaneous)
  // 1 W/m² over 12 daylight hours = 0.0432 MJ m⁻² day⁻¹; cap daily Rs between 2 and 32 MJ/m²/day
  const rsMjM2Day = Math.max(2.0, Math.min(32.0, solarWm2 * 0.0432));

  // Net shortwave radiation Rns = (1 - albedo) * Rs, with grass reference albedo = 0.23
  const rns = (1 - 0.23) * rsMjM2Day;

  const psychro = computePsychrometricParameters(elevation);
  const delta = computeVaporPressureSlopeDelta(tMean);
  const gamma = psychro.psychrometricConstantGamma;
  const u2 = convertWindSpeedTo2mMs(windKmh, params.anemometerHeightMeters || 2.0);

  let es;
  if (params.minTempCelsius !== undefined && params.maxTempCelsius !== undefined) {
    es =
      (computeSaturationVaporPressureKpa(params.minTempCelsius) +
        computeSaturationVaporPressureKpa(params.maxTempCelsius)) /
      2;
  } else {
    es = computeSaturationVaporPressureKpa(tMean);
  }
  const ea = es * (rh / 100);
  const vpd = Math.max(0, es - ea);

  // Net longwave radiation Rnl approximation (MJ m⁻² day⁻¹)
  const stefanBoltzmann = 4.903e-9;
  const tKelvin4 = Math.pow(tMean + 273.16, 4);
  const humidityFactor = Math.max(0.05, 0.34 - 0.14 * Math.sqrt(Math.max(0.01, ea)));
  const cloudFactor = Math.max(0.15, Math.min(1.0, 1.35 * (rsMjM2Day / 26.5) - 0.35));
  const rnl = stefanBoltzmann * tKelvin4 * humidityFactor * cloudFactor;

  // Net radiation Rn = Rns - Rnl; daily soil heat flux G ≈ 0
  const rn = Math.max(0.5, rns - rnl);
  const soilHeatFluxG = 0;

  const radiationTerm = 0.408 * delta * (rn - soilHeatFluxG);
  const aerodynamicTerm = gamma * (900 / (tMean + 273)) * u2 * vpd;
  const denominator = delta + gamma * (1 + 0.34 * u2);

  const et0MmDay = Number(Math.max(0.2, (radiationTerm + aerodynamicTerm) / denominator).toFixed(2));

  const cropMeta = CROP_CARDINAL_TEMPERATURES[cropType] || CROP_CARDINAL_TEMPERATURES.Maize;
  let kc = cropMeta.kcMid;
  if (stage === 'Initial' || stage === 'Emergence') {
    kc = cropMeta.kcIni;
  } else if (stage === 'Late-Season' || stage === 'Maturity / Harvest') {
    kc = cropMeta.kcEnd;
  } else if (stage === 'Vegetative') {
    kc = Number(((cropMeta.kcIni + cropMeta.kcMid) / 2).toFixed(2));
  }

  const etcMmDay = Number((et0MmDay * kc).toFixed(2));
  const grossIrrigationLitersPerHectare = Math.round(etcMmDay * 10000);

  return {
    cropType,
    phenologyStage: stage,
    meanTempCelsius: Number(tMean.toFixed(2)),
    windSpeed2mMs: u2,
    vaporPressureDeficitKpa: Number(vpd.toFixed(3)),
    netRadiationMjM2Day: Number(rn.toFixed(2)),
    radiationComponentMmDay: Number((radiationTerm / denominator).toFixed(2)),
    aerodynamicComponentMmDay: Number((aerodynamicTerm / denominator).toFixed(2)),
    referenceEt0MmDay: et0MmDay,
    cropCoefficientKc: kc,
    cropEvapotranspirationEtcMmDay: etcMmDay,
    grossIrrigationLitersPerHectare
  };
}

/**
 * Compute daily Growing Degree Days (GDD) with upper thermal cutoff and pollen heat penalty.
 * @param {object} params
 * @param {number} params.minTempCelsius
 * @param {number} params.maxTempCelsius
 * @param {string} [params.cropType='Maize']
 * @returns {object}
 */
function calculateGrowingDegreeDays(params = {}) {
  const cropType = params.cropType || 'Maize';
  const cardinal = CROP_CARDINAL_TEMPERATURES[cropType] || CROP_CARDINAL_TEMPERATURES.Maize;

  const tMinRaw = Number(params.minTempCelsius ?? 19.0);
  const tMaxRaw = Number(params.maxTempCelsius ?? 31.0);

  const tMinClamped = Math.max(cardinal.tBase, Math.min(cardinal.tUpper, tMinRaw));
  const tMaxClamped = Math.max(cardinal.tBase, Math.min(cardinal.tUpper, tMaxRaw));

  const meanEffectiveTemp = (tMinClamped + tMaxClamped) / 2;
  const gddIncrement = Number(Math.max(0, meanEffectiveTemp - cardinal.tBase).toFixed(2));

  const heatDegreeHours = Math.max(0, tMaxRaw - cardinal.tUpper);
  let thermalStressStatus = 'Optimal Thermal Accumulation';
  if (tMaxRaw >= cardinal.tUpper + 3.5) {
    thermalStressStatus = 'Critical Pollen Sterility / Heat Arrest';
  } else if (tMaxRaw > cardinal.tUpper) {
    thermalStressStatus = 'Supra-Optimal Heat Stress';
  } else if (tMinRaw < cardinal.tBase) {
    thermalStressStatus = 'Sub-Base Cold Growth Arrest';
  }

  return {
    cropType,
    tBaseCelsius: cardinal.tBase,
    tUpperCelsius: cardinal.tUpper,
    tMinObservedCelsius: tMinRaw,
    tMaxObservedCelsius: tMaxRaw,
    gddIncrement,
    supraOptimalHeatExcessCelsius: Number(heatDegreeHours.toFixed(2)),
    thermalStressStatus
  };
}

/**
 * Estimate nocturnal radiative and advective frost probability and canopy depression.
 * @param {object} params
 * @param {number} params.airTempCelsius - Shelter air temperature at 2m (°C)
 * @param {number} params.dewPointCelsius - Dew point temperature (°C)
 * @param {number} params.cloudCoverPct - Cloud cover percentage (0-100%)
 * @param {number} params.windSpeedKmh - Nocturnal wind speed (km/h)
 * @param {number} [params.elevationMeters=1200] - Altitude (m)
 * @param {string} [params.cropType='Potato']
 * @returns {object} Frost risk diagnostic
 */
function evaluateNocturnalFrostMechanics(params = {}) {
  const tAir = Number(params.airTempCelsius ?? 5.0);
  const tDew = Number(params.dewPointCelsius ?? 1.0);
  const cloudFraction = Math.max(0, Math.min(1, Number(params.cloudCoverPct ?? 15) / 100));
  const windKmh = Math.max(0, Number(params.windSpeedKmh ?? 4.0));
  const u2 = convertWindSpeedTo2mMs(windKmh, 2.0);
  const cropType = params.cropType || 'Potato';
  const cardinal = CROP_CARDINAL_TEMPERATURES[cropType] || CROP_CARDINAL_TEMPERATURES.Potato;

  // Radiative canopy depression below 2m shelter air temperature under clear, calm night skies
  const clearSkyCoolingFactor = 3.8 * (1 - 0.85 * cloudFraction) * Math.exp(-0.22 * u2);
  const estimatedCanopyTempCelsius = Number((tAir - clearSkyCoolingFactor).toFixed(2));

  // Determine frost mechanism: Radiative (calm, clear inversion) vs. Advective (windy sub-zero air mass)
  let frostMechanism = 'None';
  if (estimatedCanopyTempCelsius <= 2.5) {
    frostMechanism = windKmh >= 16 && cloudFraction > 0.4 ? 'Advective Freeze' : 'Radiative Inversion Frost';
  }

  // Compute probability score (0 - 100%)
  const tempMargin = estimatedCanopyTempCelsius - cardinal.frostCriticalCelsius;
  const dewDepression = Math.max(0, tAir - tDew);
  let probabilityPct = 0;
  if (tempMargin <= -2.0) {
    probabilityPct = 98;
  } else if (tempMargin <= 0) {
    probabilityPct = Math.round(78 + Math.abs(tempMargin) * 10);
  } else if (tempMargin <= 3.5) {
    probabilityPct = Math.round(Math.max(5, (3.5 - tempMargin) * 20 + Math.min(12, dewDepression * 2)));
  }
  probabilityPct = Math.max(0, Math.min(100, probabilityPct));

  let frostSeverity = 'Safe';
  if (estimatedCanopyTempCelsius <= -1.0) {
    frostSeverity = 'Lethal Hard Freeze';
  } else if (estimatedCanopyTempCelsius <= cardinal.frostCriticalCelsius) {
    frostSeverity = 'Critical Cellular Ice Nucleation';
  } else if (estimatedCanopyTempCelsius <= 3.5) {
    frostSeverity = 'Frost Watch / Chilling Injury Risk';
  }

  return {
    cropType,
    shelterAirTempCelsius: tAir,
    dewPointCelsius: tDew,
    radiativeCanopyDepressionCelsius: Number(clearSkyCoolingFactor.toFixed(2)),
    estimatedCanopyTempCelsius,
    cropCriticalFreezeThresholdCelsius: cardinal.frostCriticalCelsius,
    frostMechanism,
    frostProbabilityPct: probabilityPct,
    frostSeverity,
    isBlackFrostRisk: estimatedCanopyTempCelsius <= 0.5 && tDew < estimatedCanopyTempCelsius - 1.5
  };
}

module.exports = {
  CROP_CARDINAL_TEMPERATURES,
  computeSaturationVaporPressureKpa,
  computeVaporPressureSlopeDelta,
  computePsychrometricParameters,
  convertWindSpeedTo2mMs,
  computePsychrometricProfile,
  calculateFao56Evapotranspiration,
  calculateGrowingDegreeDays,
  evaluateNocturnalFrostMechanics
};
