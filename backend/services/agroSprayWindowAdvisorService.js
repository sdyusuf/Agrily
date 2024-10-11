/**
 * ==============================================================================
 * 🌾 AGRILY AGROMETEOROLOGICAL TELEMETRY: AGRO SPRAY WINDOW ADVISOR SERVICE
 * ==============================================================================
 *
 * Evaluates hourly meteorological conditions to determine safe and efficacious
 * agrochemical spraying windows based on:
 *  - Delta-T (T_dry - T_wet): Droplet evaporation vs. leaf cuticle survival
 *  - Wind Speed & Gusts: Off-target spray drift prevention
 *  - Surface Thermal Inversion Detection: Low-wind stable boundary layer lockout
 *  - Post-Application Rainfastness Window: Wash-off risk within 4 hours
 * ==============================================================================
 */

const { computePsychrometricProfile } = require('./agrometeorologyEngine');

/**
 * Evaluate a single hour's meteorological conditions for foliar spraying suitability.
 *
 * @param {object} frame - Hourly meteorological reading
 * @param {object} [nextFrames=[]] - Subsequent 3–4 hours to check rain wash-off risk
 * @returns {object} Spray suitability score, classification, nozzle recommendation, and constraints
 */
function evaluateHourlySprayWindow(frame = {}, nextFrames = []) {
  const airTemp = Number(frame.airTempCelsius ?? 26.0);
  const rh = Number(frame.relativeHumidityPct ?? 60.0);
  const windSpeedKmh = Number(frame.windSpeedKmh ?? 8.0);
  const windGustKmh = Number(frame.windGustKmh ?? windSpeedKmh * 1.3);
  const precipMm = Number(frame.precipitationMm ?? 0);
  const precipProbPct = Number(frame.precipitationProbabilityPct ?? 10);
  const cloudCoverPct = Number(frame.cloudCoverPct ?? 40);
  const solarWm2 = Number(frame.solarIrradianceWm2 ?? 300);

  const psychro = computePsychrometricProfile(airTemp, rh);
  const deltaT = psychro.deltaTCelsius;

  // Check 3-hour lookahead rainfastness wash-off
  const upcomingRainMm = Array.isArray(nextFrames)
    ? nextFrames.slice(0, 3).reduce((acc, f) => acc + Number(f?.precipitationMm || 0), 0)
    : 0;

  let status = 'Optimal Window';
  let suitabilityScore = 92;
  let colorToken = 'emerald';
  let nozzleGuidance = 'Standard Flat-Fan or Medium VMD (250–350 µm) at 2.5 bar';
  const limitingFactors = [];

  // 1. Active rain or imminent wash-off risk
  if (precipMm >= 0.5 || upcomingRainMm >= 2.0 || precipProbPct >= 75) {
    status = 'Rain Wash-Off Risk';
    suitabilityScore = 15;
    colorToken = 'danger';
    nozzleGuidance = 'SUSPEND SPRAYING: Rainfastness threshold (< 3 hrs) violated';
    limitingFactors.push(
      precipMm >= 0.5
        ? `Active precipitation (${precipMm} mm/hr)`
        : `Lookahead rainfall (${upcomingRainMm.toFixed(1)} mm in next 3h / ${precipProbPct}% probability)`
    );
  }
  // 2. High wind drift lockout
  else if (windSpeedKmh > 15.0 || windGustKmh > 22.0) {
    status = 'High Drift Risk';
    suitabilityScore = 22;
    colorToken = 'danger';
    nozzleGuidance = 'LOCKOUT: Wind exceeds 15 km/h safe drift ceiling';
    limitingFactors.push(`Wind speed ${windSpeedKmh} km/h (gusts ${windGustKmh.toFixed(1)} km/h)`);
  }
  // 3. Surface thermal inversion lockout (very calm < 3 km/h + low solar / clear sky)
  else if (windSpeedKmh < 3.0 && solarWm2 < 120 && cloudCoverPct < 45) {
    status = 'Inversion Lockout';
    suitabilityScore = 28;
    colorToken = 'danger';
    nozzleGuidance = 'LOCKOUT: Stable thermal inversion traps fine aerosols aloft';
    limitingFactors.push(`Calm boundary layer (${windSpeedKmh} km/h) under low-turbulence inversion`);
  }
  // 4. Extreme Delta-T (> 10°C) rapid droplet evaporation
  else if (deltaT > 10.0 || airTemp > 35.0) {
    status = 'Rapid Evaporation Risk';
    suitabilityScore = 30;
    colorToken = 'danger';
    nozzleGuidance = 'LOCKOUT: Delta-T > 10°C causes flash evaporation before leaf deposition';
    limitingFactors.push(`High Delta-T (${deltaT}°C) and air temperature (${airTemp}°C)`);
  }
  // 5. Marginal Delta-T (8°C - 10°C or < 2°C) or breezy wind (12 - 15 km/h)
  else if (deltaT > 8.0 || deltaT < 2.0 || windSpeedKmh > 12.0) {
    status = 'Caution / Marginal';
    suitabilityScore = 64;
    colorToken = 'warning';
    nozzleGuidance =
      deltaT < 2.0
        ? 'Medium droplet nozzle; monitor slow drying & leaf runoff'
        : 'Coarse Air-Induction (AI) low-drift nozzle (350–450 µm) + anti-evaporant adjuvant';
    if (deltaT > 8.0) limitingFactors.push(`Elevated Delta-T (${deltaT}°C)`);
    if (deltaT < 2.0) limitingFactors.push(`Low Delta-T (${deltaT}°C) slow droplet drying`);
    if (windSpeedKmh > 12.0) limitingFactors.push(`Moderate breeze (${windSpeedKmh} km/h)`);
  } else {
    // Adjust optimal score by closeness to ideal Delta-T = 5.0°C and wind = 7.5 km/h
    const dtPenalty = Math.abs(deltaT - 5.0) * 2.5;
    const windPenalty = Math.abs(windSpeedKmh - 7.5) * 1.2;
    suitabilityScore = Math.round(Math.max(78, Math.min(99, 98 - dtPenalty - windPenalty)));
  }

  return {
    observationTimestamp: frame.observationTimestamp || new Date().toISOString(),
    airTempCelsius: airTemp,
    wetBulbCelsius: psychro.wetBulbCelsius,
    relativeHumidityPct: rh,
    deltaTCelsius: deltaT,
    windSpeedKmh,
    windGustKmh: Number(windGustKmh.toFixed(1)),
    precipitationMm: precipMm,
    upcoming3hRainMm: Number(upcomingRainMm.toFixed(1)),
    status,
    suitabilityScore,
    colorToken,
    nozzleGuidance,
    limitingFactors
  };
}

/**
 * Generate a complete multi-hour (e.g., 24h or 48h) spray window schedule and
 * identify the best consecutive 3-hour operational block for tractor/knapsack booms.
 *
 * @param {Array<object>} hourlyForecast - Array of hourly forecast readings
 * @returns {object} Full schedule and recommended optimal blocks
 */
function generateSpraySchedulePlan(hourlyForecast = []) {
  if (!Array.isArray(hourlyForecast) || hourlyForecast.length === 0) {
    return {
      totalHoursEvaluated: 0,
      optimalHoursCount: 0,
      marginalHoursCount: 0,
      lockoutHoursCount: 0,
      recommendedWindow: null,
      hourlyWindows: []
    };
  }

  const hourlyWindows = hourlyForecast.map((frame, index) => {
    const nextFrames = hourlyForecast.slice(index + 1, index + 4);
    return evaluateHourlySprayWindow(frame, nextFrames);
  });

  const optimalHoursCount = hourlyWindows.filter((w) => w.status === 'Optimal Window').length;
  const marginalHoursCount = hourlyWindows.filter((w) => w.status === 'Caution / Marginal').length;
  const lockoutHoursCount = hourlyWindows.length - optimalHoursCount - marginalHoursCount;

  // Find best 3-hour contiguous block
  let bestBlock = null;
  for (let i = 0; i <= hourlyWindows.length - 3; i++) {
    const slice = hourlyWindows.slice(i, i + 3);
    const hasLockout = slice.some((w) => w.suitabilityScore < 50);
    if (hasLockout) continue;

    const avgScore = Math.round(slice.reduce((acc, w) => acc + w.suitabilityScore, 0) / 3);
    const meanDeltaT = Number((slice.reduce((acc, w) => acc + w.deltaTCelsius, 0) / 3).toFixed(2));
    const meanWindKmh = Number((slice.reduce((acc, w) => acc + w.windSpeedKmh, 0) / 3).toFixed(1));

    if (!bestBlock || avgScore > bestBlock.averageSuitabilityScore) {
      bestBlock = {
        startTimestamp: slice[0].observationTimestamp,
        endTimestamp: slice[slice.length - 1].observationTimestamp,
        durationHours: 3,
        averageSuitabilityScore: avgScore,
        meanDeltaTCelsius: meanDeltaT,
        meanWindSpeedKmh: meanWindKmh,
        nozzleRecommendation: slice[0].nozzleGuidance
      };
    }
  }

  return {
    totalHoursEvaluated: hourlyWindows.length,
    optimalHoursCount,
    marginalHoursCount,
    lockoutHoursCount,
    recommendedWindow: bestBlock,
    hourlyWindows
  };
}

module.exports = {
  evaluateHourlySprayWindow,
  generateSpraySchedulePlan
};
