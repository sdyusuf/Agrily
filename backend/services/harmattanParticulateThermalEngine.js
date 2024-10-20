/**
 * ==============================================================================
 * 🌾 AGRILY AGROMETEOROLOGICAL TELEMETRY: HARMATTAN DUST & FROST THERMODYNAMICS
 * ==============================================================================
 *
 * Models two critical dry-season atmospheric phenomena in West Africa:
 *  1. Saharan Harmattan Dust Plume (Bodele Depression aerosol optical depth
 *     AOD_550nm, PAR attenuation, and foliar cuticle abrasion/desiccation).
 *  2. Canopy Frost Protection Thermodynamics (latent heat of fusion released by
 *     overhead micro-sprinkler icing to protect montane potato/tomato crops).
 * ==============================================================================
 */

/**
 * Evaluate Saharan Harmattan aerosol optical depth (AOD), PAR dimming, and
 * orchard flower desiccation risk from horizontal visibility and wind vectors.
 *
 * @param {object} params
 * @param {number} params.visibilityKm - Horizontal visibility (km)
 * @param {number} params.relativeHumidityPct - Relative humidity (%)
 * @param {number} params.windSpeedKmh - Northeasterly trade wind speed (km/h)
 * @param {number} [params.clearSkySolarIrradianceWm2=820]
 * @returns {object} Harmattan aerosol and photosynthetic dimming report
 */
function evaluateHarmattanAerosolImpact(params = {}) {
  const visibilityKm = Math.max(0.2, Math.min(50, Number(params.visibilityKm ?? 8.5)));
  const rh = Math.max(5, Math.min(100, Number(params.relativeHumidityPct ?? 24)));
  const windKmh = Math.max(0, Number(params.windSpeedKmh ?? 16.0));
  const clearSolarWm2 = Math.max(100, Number(params.clearSkySolarIrradianceWm2 ?? 820));

  // Koschmieder empirical relation between horizontal visibility and AOD at 550nm
  const aod550nm = Number(Math.min(4.5, Math.max(0.08, 3.912 / visibilityKm)).toFixed(3));

  // Beer-Lambert direct + diffuse PAR transmission attenuation by mineral dust
  const parTransmissionFraction = Number(Math.max(0.35, Math.exp(-0.24 * aod550nm)).toFixed(3));
  const attenuatedSolarWm2 = Math.round(clearSolarWm2 * parTransmissionFraction);
  const parLossPct = Number(((1 - parTransmissionFraction) * 100).toFixed(1));

  // Estimate PM10 dust concentration (µg/m³)
  const estimatedPm10UgM3 = Math.round(aod550nm * 380);

  let plumeSeverity = 'Background Clean Air';
  if (aod550nm >= 1.8) {
    plumeSeverity = 'Severe Harmattan Dust Storm';
  } else if (aod550nm >= 0.9) {
    plumeSeverity = 'Moderate Harmattan Plume';
  } else if (aod550nm >= 0.45) {
    plumeSeverity = 'Light Saharan Haze';
  }

  return {
    visibilityKm,
    aerosolOpticalDepth550nm: aod550nm,
    estimatedPm10UgM3,
    parTransmissionFraction,
    parAttenuationLossPct: parLossPct,
    attenuatedSolarIrradianceWm2: attenuatedSolarWm2,
    plumeSeverity,
    isOrchardFlowerAbortionRisk: aod550nm >= 1.0 && rh <= 25 && windKmh >= 15
  };
}

/**
 * Calculate the required overhead micro-sprinkler irrigation rate (mm/hr) to
 * protect a crop canopy during a nocturnal radiative freeze via latent heat
 * of fusion (Lf = 334 kJ/kg).
 *
 * @param {object} params
 * @param {number} params.canopyTempCelsius - Unprotected leaf temperature (°C)
 * @param {number} params.windSpeedKmh - Nocturnal wind speed (km/h)
 * @param {number} params.relativeHumidityPct - Relative humidity (%)
 * @param {number} [params.areaHectares=5.0] - Protected field area (ha)
 * @returns {object} Frost protection energy balance & pump flow prescription
 */
function calculateFrostSprinklerThermodynamics(params = {}) {
  const tCanopy = Number(params.canopyTempCelsius ?? -1.5);
  const windKmh = Math.max(0, Number(params.windSpeedKmh ?? 3.5));
  const rh = Math.max(10, Math.min(100, Number(params.relativeHumidityPct ?? 55)));
  const areaHa = Math.max(0.1, Number(params.areaHectares ?? 5.0));

  if (tCanopy >= 1.5) {
    return {
      isProtectionRequired: false,
      unprotectedCanopyTempCelsius: tCanopy,
      radiativeHeatDeficitWm2: 0,
      recommendedApplicationRateMmHr: 0,
      latentHeatReleasedKwPerHectare: 0,
      requiredPumpFlowLitersPerMinute: 0,
      advisory: 'Canopy above 1.5°C safety margin; active icing irrigation not required.'
    };
  }

  const freezeDeficitDeg = Math.max(0.5, 0.5 - tCanopy);
  const windConvectiveFactor = 1 + windKmh * 0.12;
  const evaporativeSublimationPenalty = 1 + (100 - rh) * 0.008;

  // Radiative + convective heat loss rate in W/m²
  const heatDeficitWm2 = Number(
    (42 * freezeDeficitDeg * windConvectiveFactor * evaporativeSublimationPenalty).toFixed(1)
  );

  // 1 mm/hr of freezing water over 1 m² = 1 kg/hr -> 334,000 J / 3600 s = 92.78 W/m² latent heat
  const rawMmHr = heatDeficitWm2 / 92.78;
  const recommendedApplicationRateMmHr = Number(
    Math.max(2.2, Math.min(6.5, rawMmHr * 1.15)).toFixed(2)
  );

  // 1 mm/hr on 1 ha = 10,000 L/hr = 166.67 L/min
  const requiredPumpFlowLitersPerMinute = Math.round(
    recommendedApplicationRateMmHr * areaHa * 166.67
  );
  const latentHeatReleasedKwPerHectare = Number(
    (recommendedApplicationRateMmHr * 927.8).toFixed(1)
  );

  return {
    isProtectionRequired: true,
    unprotectedCanopyTempCelsius: tCanopy,
    radiativeHeatDeficitWm2: heatDeficitWm2,
    recommendedApplicationRateMmHr,
    latentHeatReleasedKwPerHectare,
    requiredPumpFlowLitersPerMinute,
    advisory:
      windKmh > 16
        ? 'WARNING: High wind speed (>16 km/h) risks evaporative cooling exceeding latent heat; combine with windbreaks.'
        : `Operate micro-sprinklers continuously at ${recommendedApplicationRateMmHr} mm/hr until wet-bulb rises above +1.0°C after sunrise.`
  };
}

module.exports = {
  evaluateHarmattanAerosolImpact,
  calculateFrostSprinklerThermodynamics
};
