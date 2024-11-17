/**
 * ==============================================================================
 * 🦗 AGRILY SPRINT 22: MIGRATORY SWARM TRAJECTORY & ULV SPRAY DRIFT ENGINE
 * ==============================================================================
 *
 * Models boundary-layer (850-925 hPa) wind-assisted insect migration, Inter-Tropical
 * Discontinuity (ITD / ITCZ) convergence trapping, and Ultra-Low Volume (ULV)
 * biopesticide droplet evaporation & drift physics:
 *
 *  1. Nocturnal Lepidoptera (Spodoptera frugiperda, Maruca vitrata, Busseola)
 *     vs. Diurnal Orthoptera/Aves (Schistocerca gregaria, Quelea quelea) flight kinematics.
 *  2. ITCZ / ITD Convergence Zone rain-out & moth fallout concentration multiplier.
 *  3. Volume Median Diameter (VMD, microns) & Wet-Bulb Depression (Delta-T) ULV
 *     droplet survival and downwind buffer zone calculation (ISO 22866 standard).
 *
 * @module services/migratorySwarmTrajectoryEngine
 */

const SWARM_FLIGHT_BIOMECHANICS = {
  FALL_ARMYWORM: {
    pestKey: 'FALL_ARMYWORM',
    flightRegime: 'NOCTURNAL_JET_STREAM_GLIDER',
    selfPoweredAirspeedKmh: 14.5,
    flightHoursPerDay: 5.5,
    minFlightCeilingTempC: 16.0,
    preferredAltitudeMetersAgl: 350,
    windTransportCoefficient: 0.78,
    itczFalloutSensitivity: 1.42,
    optimalUlvVmdMicrons: 115,
  },
  TUTA_ABSOLUTA: {
    pestKey: 'TUTA_ABSOLUTA',
    flightRegime: 'CREPUSCULAR_BOUNDARY_DISPERSER',
    selfPoweredAirspeedKmh: 5.8,
    flightHoursPerDay: 3.0,
    minFlightCeilingTempC: 13.5,
    preferredAltitudeMetersAgl: 45,
    windTransportCoefficient: 0.48,
    itczFalloutSensitivity: 1.15,
    optimalUlvVmdMicrons: 135,
  },
  QUELEA_BIRDS: {
    pestKey: 'QUELEA_BIRDS',
    flightRegime: 'DIURNAL_FLOCK_FORAGER',
    selfPoweredAirspeedKmh: 38.0,
    flightHoursPerDay: 4.2,
    minFlightCeilingTempC: 12.0,
    preferredAltitudeMetersAgl: 85,
    windTransportCoefficient: 0.42,
    itczFalloutSensitivity: 1.18,
    optimalUlvVmdMicrons: 160,
  },
  DESERT_LOCUST: {
    pestKey: 'DESERT_LOCUST',
    flightRegime: 'DIURNAL_THERMAL_CONVECTIVE_SWARM',
    selfPoweredAirspeedKmh: 18.0,
    flightHoursPerDay: 7.5,
    minFlightCeilingTempC: 20.0,
    preferredAltitudeMetersAgl: 650,
    windTransportCoefficient: 0.88,
    itczFalloutSensitivity: 1.55,
    optimalUlvVmdMicrons: 90,
  },
  BEMISIA_WHITEFLY: {
    pestKey: 'BEMISIA_WHITEFLY',
    flightRegime: 'CANOPY_PLUME_DRIFTER',
    selfPoweredAirspeedKmh: 2.4,
    flightHoursPerDay: 3.5,
    minFlightCeilingTempC: 15.0,
    preferredAltitudeMetersAgl: 25,
    windTransportCoefficient: 0.55,
    itczFalloutSensitivity: 1.12,
    optimalUlvVmdMicrons: 125,
  },
  COWPEA_POD_BORER: {
    pestKey: 'COWPEA_POD_BORER',
    flightRegime: 'NOCTURNAL_MONSOON_MIGRANT',
    selfPoweredAirspeedKmh: 11.2,
    flightHoursPerDay: 4.8,
    minFlightCeilingTempC: 15.5,
    preferredAltitudeMetersAgl: 240,
    windTransportCoefficient: 0.72,
    itczFalloutSensitivity: 1.36,
    optimalUlvVmdMicrons: 120,
  },
  STEM_BORER: {
    pestKey: 'STEM_BORER',
    flightRegime: 'NOCTURNAL_LOCAL_DISPERSER',
    selfPoweredAirspeedKmh: 8.5,
    flightHoursPerDay: 3.5,
    minFlightCeilingTempC: 15.0,
    preferredAltitudeMetersAgl: 90,
    windTransportCoefficient: 0.52,
    itczFalloutSensitivity: 1.18,
    optimalUlvVmdMicrons: 150,
  },
  RICE_GALL_MIDGE: {
    pestKey: 'RICE_GALL_MIDGE',
    flightRegime: 'HUMID_DUSK_SWARMER',
    selfPoweredAirspeedKmh: 3.2,
    flightHoursPerDay: 2.8,
    minFlightCeilingTempC: 17.0,
    preferredAltitudeMetersAgl: 18,
    windTransportCoefficient: 0.45,
    itczFalloutSensitivity: 1.22,
    optimalUlvVmdMicrons: 140,
  },
  COCOA_MIRID_BUG: {
    pestKey: 'COCOA_MIRID_BUG',
    flightRegime: 'UNDERSTORY_CANOPY_FLIER',
    selfPoweredAirspeedKmh: 4.5,
    flightHoursPerDay: 2.2,
    minFlightCeilingTempC: 18.0,
    preferredAltitudeMetersAgl: 12,
    windTransportCoefficient: 0.35,
    itczFalloutSensitivity: 1.08,
    optimalUlvVmdMicrons: 155,
  },
  SORGHUM_MIDGE: {
    pestKey: 'SORGHUM_MIDGE',
    flightRegime: 'DAWN_PANICLE_PLUME_DRIFTER',
    selfPoweredAirspeedKmh: 3.8,
    flightHoursPerDay: 3.2,
    minFlightCeilingTempC: 16.5,
    preferredAltitudeMetersAgl: 30,
    windTransportCoefficient: 0.50,
    itczFalloutSensitivity: 1.25,
    optimalUlvVmdMicrons: 130,
  },
};

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function roundTo(val, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Simulates 24h, 48h, and 72h boundary-layer swarm trajectory waypoints and
 * Inter-Tropical Discontinuity (ITD / ITCZ) fallout concentration.
 */
function simulateMigratorySwarmTrajectory(params = {}) {
  const pestKey = String(params.pestKey || 'FALL_ARMYWORM').toUpperCase();
  const bio =
    SWARM_FLIGHT_BIOMECHANICS[pestKey] || SWARM_FLIGHT_BIOMECHANICS.FALL_ARMYWORM;

  const originLat = clamp(Number(params.originLatitude ?? 11.12), 4.2, 14.0);
  const originLon = clamp(Number(params.originLongitude ?? 7.72), 2.6, 14.8);
  const boundaryLayerWindSpeedKmh = clamp(
    Number(params.boundaryLayerWindSpeedKmh ?? 22.0),
    2.0,
    75.0
  );
  const windBearingDeg = clamp(Number(params.windBearingDeg ?? 225), 0, 360);
  const boundaryLayerTempC = clamp(Number(params.boundaryLayerTempC ?? 25.5), 8.0, 42.0);
  const itczLatitudeDeg = clamp(Number(params.itczLatitudeDeg ?? 10.8), 6.0, 15.5);

  // Flight thermal gating
  const thermalActivityScalar =
    boundaryLayerTempC < bio.minFlightCeilingTempC
      ? 0.25
      : clamp(1.0 - Math.max(0, boundaryLayerTempC - 36.0) * 0.06, 0.4, 1.0);

  // Effective ground speed (km/h) during active daily flight window
  const groundSpeedKmh =
    (bio.selfPoweredAirspeedKmh * 0.45 +
      boundaryLayerWindSpeedKmh * bio.windTransportCoefficient) *
    thermalActivityScalar;

  const dailyDisplacementKm = roundTo(groundSpeedKmh * bio.flightHoursPerDay, 1);
  const bearingRad = (windBearingDeg * Math.PI) / 180;

  const waypoints = [24, 48, 72].map((horizonHours, idx) => {
    const days = idx + 1;
    const cumulativeDistanceKm = roundTo(dailyDisplacementKm * days, 1);
    const dLat = (cumulativeDistanceKm / 111.32) * Math.cos(bearingRad);
    const dLon =
      (cumulativeDistanceKm /
        (111.32 * Math.cos((originLat * Math.PI) / 180))) *
      Math.sin(bearingRad);

    const projectedLat = roundTo(clamp(originLat + dLat, 4.1, 14.2), 3);
    const projectedLon = roundTo(clamp(originLon + dLon, 2.5, 14.9), 3);

    // Gaussian plume lateral dispersion sigma_y (km) grows with distance
    const lateralPlumeRadiusKm = roundTo(4.5 + Math.pow(cumulativeDistanceKm, 0.68) * 0.85, 1);

    // Check proximity to ITCZ / ITD convergence front (where wind shear causes mass moth/locust fallout)
    const distFromItczDeg = Math.abs(projectedLat - itczLatitudeDeg);
    const itczConvergenceZone = distFromItczDeg <= 1.25;
    const falloutConcentrationMultiplier = itczConvergenceZone
      ? bio.itczFalloutSensitivity
      : 1.0;

    return {
      horizonHours,
      cumulativeDistanceKm,
      projectedLatitude: projectedLat,
      projectedLongitude: projectedLon,
      lateralPlumeRadiusKm,
      itczConvergenceZone,
      falloutConcentrationMultiplier: roundTo(falloutConcentrationMultiplier, 2),
    };
  });

  return {
    pestKey: bio.pestKey,
    flightRegime: bio.flightRegime,
    preferredAltitudeMetersAgl: bio.preferredAltitudeMetersAgl,
    groundSpeedKmh: roundTo(groundSpeedKmh, 2),
    dailyDisplacementKm,
    total72hDisplacementKm: waypoints[2].cumulativeDistanceKm,
    itczFalloutAlert: waypoints.some((w) => w.itczConvergenceZone),
    waypoints,
  };
}

/**
 * Evaluates Drone / Tractor Ultra-Low Volume (ULV) & Hydraulic Spray Drift Physics,
 * Wet-Bulb Depression (Delta-T), and Pollinator/Aquatic Buffer Zone Width.
 */
function evaluateUlvSprayDriftAndDeltaT(params = {}) {
  const pestKey = String(params.pestKey || 'FALL_ARMYWORM').toUpperCase();
  const bio =
    SWARM_FLIGHT_BIOMECHANICS[pestKey] || SWARM_FLIGHT_BIOMECHANICS.FALL_ARMYWORM;

  const dryBulbTempC = clamp(Number(params.dryBulbTempC ?? 29.0), 10.0, 46.0);
  const relativeHumidityPct = clamp(Number(params.relativeHumidityPct ?? 58.0), 10.0, 99.0);
  const windSpeed10mKmh = clamp(Number(params.windSpeed10mKmh ?? 11.5), 0.5, 45.0);
  const releaseHeightMeters = clamp(Number(params.releaseHeightMeters ?? 2.5), 0.5, 15.0);
  const nozzleVmdMicrons = clamp(
    Number(params.nozzleVmdMicrons ?? bio.optimalUlvVmdMicrons),
    50,
    450
  );
  const oilBasedCarrier = Boolean(params.oilBasedCarrier);

  // Stull (2011) Wet-Bulb Temperature & Delta-T approximation
  const rh = relativeHumidityPct;
  const T = dryBulbTempC;
  const wetBulbTempC =
    T * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
    Math.atan(T + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;
  const deltaTC = roundTo(Math.max(0.4, T - wetBulbTempC), 2);

  // Droplet lifetime & canopy deposition efficiency (%)
  // Water droplets evaporate rapidly when Delta-T > 8°C and VMD < 150 microns
  const evaporationResistance = oilBasedCarrier ? 1.38 : 1.0;
  const deltaTPenalty = Math.max(0, (deltaTC - 6.0) * 3.8) / evaporationResistance;
  const windDriftPenalty = Math.max(0, (windSpeed10mKmh - 12.0) * 1.9);
  const fineDropletDriftLoss =
    nozzleVmdMicrons < 140 ? (140 - nozzleVmdMicrons) * 0.22 : 0;

  const canopyDepositionEfficiencyPct = clamp(
    roundTo(94.0 - deltaTPenalty - windDriftPenalty - fineDropletDriftLoss, 1),
    22.0,
    96.0
  );
  const offTargetDriftLossPct = roundTo(100 - canopyDepositionEfficiencyPct, 1);

  // Downwind mandatory pollinator & aquatic buffer zone (meters)
  const mandatoryBufferZoneMeters = Math.max(
    10,
    Math.round(
      releaseHeightMeters *
        (windSpeed10mKmh / 3.6) *
        (180 / nozzleVmdMicrons) *
        2.4
    )
  );

  let sprayWindowSuitability = 'OPTIMAL_SPRAY_WINDOW';
  if (windSpeed10mKmh > 22 || deltaTC > 10.5 || windSpeed10mKmh < 2.5) {
    sprayWindowSuitability = 'SUSPEND_SPRAYING_HIGH_DRIFT_OR_INVERSION';
  } else if (windSpeed10mKmh > 15 || deltaTC > 8.0) {
    sprayWindowSuitability = 'MARGINAL_USE_LOW_DRIFT_OIL_ADJUVANT';
  }

  return {
    pestKey: bio.pestKey,
    dryBulbTempC: roundTo(dryBulbTempC, 1),
    relativeHumidityPct: roundTo(relativeHumidityPct, 1),
    wetBulbTempC: roundTo(wetBulbTempC, 1),
    deltaTC,
    windSpeed10mKmh: roundTo(windSpeed10mKmh, 1),
    nozzleVmdMicrons,
    oilBasedCarrier,
    canopyDepositionEfficiencyPct,
    offTargetDriftLossPct,
    mandatoryBufferZoneMeters,
    sprayWindowSuitability,
  };
}

module.exports = {
  SWARM_FLIGHT_BIOMECHANICS,
  simulateMigratorySwarmTrajectory,
  evaluateUlvSprayDriftAndDeltaT,
};

