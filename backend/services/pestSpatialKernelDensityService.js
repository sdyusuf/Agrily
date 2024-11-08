/**
 * ==============================================================================
 * 🗺️ AGRILY SPRINT 22: 2D GAUSSIAN KERNEL DENSITY & WIND DISPERSAL PLUME SERVICE
 * ==============================================================================
 *
 * Computes regional pest infestation intensity surfaces using 2D Gaussian /
 * Epanechnikov Kernel Density Estimation (KDE) and projects 72-hour downwind
 * moth/locust/quelea dispersal corridors across Nigeria's agro-ecological zones.
 *
 * @module services/pestSpatialKernelDensityService
 */

const REGIONAL_PEST_SENTINEL_CORRIDORS = [
  { corridorId: 'COR-KD-ZARIA', stateCode: 'KD', stateName: 'Kaduna', lgaName: 'Zaria / Giwa', agroZone: 'NORTHERN_GUINEA_SAVANNA', latitude: 11.11, longitude: 7.72, dominantPestKey: 'FALL_ARMYWORM', baselineIncidencePct: 34.5, trapMothsPerNight: 28, windSpeedKmh: 16.5, windBearingDeg: 225 },
  { corridorId: 'COR-KN-KURA', stateCode: 'KN', stateName: 'Kano', lgaName: 'Kura / Garun Mallam', agroZone: 'SUDAN_SAVANNA', latitude: 11.77, longitude: 8.43, dominantPestKey: 'TUTA_ABSOLUTA', baselineIncidencePct: 41.2, trapMothsPerNight: 39, windSpeedKmh: 19.0, windBearingDeg: 210 },
  { corridorId: 'COR-JG-HADEJIA', stateCode: 'JG', stateName: 'Jigawa', lgaName: 'Hadejia / Auyo Wetland', agroZone: 'SUDAN_SAVANNA', latitude: 12.45, longitude: 10.04, dominantPestKey: 'QUELEA_BIRDS', baselineIncidencePct: 46.8, trapMothsPerNight: 52, windSpeedKmh: 22.4, windBearingDeg: 235 },
  { corridorId: 'COR-BO-LAKECHAD', stateCode: 'BO', stateName: 'Borno', lgaName: 'Kukawa / Lake Chad Basin', agroZone: 'SAHEL_SAVANNA', latitude: 12.92, longitude: 13.56, dominantPestKey: 'DESERT_LOCUST', baselineIncidencePct: 38.0, trapMothsPerNight: 44, windSpeedKmh: 26.0, windBearingDeg: 240 },
  { corridorId: 'COR-BN-GBOKO', stateCode: 'BN', stateName: 'Benue', lgaName: 'Gboko / Buruku', agroZone: 'SOUTHERN_GUINEA_SAVANNA', latitude: 7.33, longitude: 9.00, dominantPestKey: 'BEMISIA_WHITEFLY', baselineIncidencePct: 29.4, trapMothsPerNight: 21, windSpeedKmh: 12.8, windBearingDeg: 45 },
  { corridorId: 'COR-PL-BARKIN', stateCode: 'PL', stateName: 'Plateau', lgaName: 'Barkin Ladi / Bokkos', agroZone: 'NORTHERN_GUINEA_SAVANNA', latitude: 9.53, longitude: 8.90, dominantPestKey: 'TUTA_ABSOLUTA', baselineIncidencePct: 31.8, trapMothsPerNight: 25, windSpeedKmh: 15.2, windBearingDeg: 195 },
  { corridorId: 'COR-KB-ARGUNGU', stateCode: 'KB', stateName: 'Kebbi', lgaName: 'Argungu / Birnin Kebbi', agroZone: 'SUDAN_SAVANNA', latitude: 12.74, longitude: 4.52, dominantPestKey: 'RICE_GALL_MIDGE', baselineIncidencePct: 27.6, trapMothsPerNight: 19, windSpeedKmh: 17.5, windBearingDeg: 215 },
  { corridorId: 'COR-OY-ISEYIN', stateCode: 'OY', stateName: 'Oyo', lgaName: 'Iseyin / Saki', agroZone: 'DERIVED_SAVANNA', latitude: 7.97, longitude: 3.60, dominantPestKey: 'FALL_ARMYWORM', baselineIncidencePct: 33.2, trapMothsPerNight: 27, windSpeedKmh: 13.4, windBearingDeg: 35 },
  { corridorId: 'COR-OD-IDANRE', stateCode: 'OD', stateName: 'Ondo', lgaName: 'Idanre / Owo Cocoa Belt', agroZone: 'HUMID_FOREST', latitude: 7.11, longitude: 5.10, dominantPestKey: 'COCOA_MIRID_BUG', baselineIncidencePct: 24.5, trapMothsPerNight: 16, windSpeedKmh: 10.5, windBearingDeg: 30 },
  { corridorId: 'COR-KT-FUNTUA', stateCode: 'KT', stateName: 'Katsina', lgaName: 'Funtua / Bakori', agroZone: 'NORTHERN_GUINEA_SAVANNA', latitude: 11.52, longitude: 7.31, dominantPestKey: 'COWPEA_POD_BORER', baselineIncidencePct: 30.8, trapMothsPerNight: 24, windSpeedKmh: 18.2, windBearingDeg: 220 },
  { corridorId: 'COR-NG-MOKWA', stateCode: 'NG', stateName: 'Niger', lgaName: 'Mokwa / Bida', agroZone: 'SOUTHERN_GUINEA_SAVANNA', latitude: 9.29, longitude: 5.05, dominantPestKey: 'STEM_BORER', baselineIncidencePct: 26.4, trapMothsPerNight: 18, windSpeedKmh: 14.0, windBearingDeg: 55 },
  { corridorId: 'COR-GM-GOMBE', stateCode: 'GM', stateName: 'Gombe', lgaName: 'Yamaltu / Deba', agroZone: 'SUDAN_SAVANNA', latitude: 10.22, longitude: 11.38, dominantPestKey: 'SORGHUM_MIDGE', baselineIncidencePct: 28.9, trapMothsPerNight: 22, windSpeedKmh: 17.8, windBearingDeg: 205 },
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function roundTo(val, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Computes 2D Gaussian Kernel Density Estimation (KDE) contagion intensity
 * and 72-hour wind-advected pest migration plume vectors.
 */
function generatePestOutbreakKdeSurface(params = {}) {
  const filterPestKey = params.pestKey ? String(params.pestKey).toUpperCase() : null;
  const bandwidthKm = Math.max(40, Number(params.bandwidthKm ?? 185));

  const corridors = REGIONAL_PEST_SENTINEL_CORRIDORS.map((item) => {
    const speciesBoost =
      filterPestKey && item.dominantPestKey === filterPestKey ? 1.18 : 1.0;
    const adjustedIncidence = Math.min(
      95,
      roundTo(item.baselineIncidencePct * speciesBoost, 1)
    );

    // Compute Gaussian KDE influence from neighboring sentinel corridors
    let kdeScoreSum = 0;
    for (const neighbor of REGIONAL_PEST_SENTINEL_CORRIDORS) {
      const distKm = haversineKm(
        item.latitude,
        item.longitude,
        neighbor.latitude,
        neighbor.longitude
      );
      const gaussianKernelWeight = Math.exp(
        -0.5 * Math.pow(distKm / bandwidthKm, 2)
      );
      kdeScoreSum += neighbor.baselineIncidencePct * gaussianKernelWeight;
    }

    const normalizedKdeIntensity = Math.min(
      100,
      roundTo(kdeScoreSum * 1.45 * speciesBoost, 1)
    );

    // 72-hour wind-assisted adult flight / swarm displacement (km)
    // Nocturnal moths fly ~3.5 hrs/night at 65% of geostrophic wind speed
    const displacement72hKm = roundTo(item.windSpeedKmh * 0.65 * 10.5, 1);
    const bearingRad = (item.windBearingDeg * Math.PI) / 180;
    const destLat = roundTo(
      item.latitude + (displacement72hKm / 111.32) * Math.cos(bearingRad),
      3
    );
    const destLon = roundTo(
      item.longitude +
        (displacement72hKm / (111.32 * Math.cos((item.latitude * Math.PI) / 180))) *
          Math.sin(bearingRad),
      3
    );

    const hotspotAlertLevel =
      normalizedKdeIntensity >= 72 || adjustedIncidence >= 40
        ? 'CRITICAL_EPIDEMIC_PLUME'
        : normalizedKdeIntensity >= 48 || adjustedIncidence >= 28
        ? 'ACTIVE_CONTAGION_CLUSTER'
        : 'ENDEMIC_SURVEILLANCE';

    return {
      ...item,
      adjustedIncidencePct: adjustedIncidence,
      kdeIntensityScore: normalizedKdeIntensity,
      displacement72hKm,
      projectedPlumeEndpoint: {
        latitude: destLat,
        longitude: destLon,
      },
      hotspotAlertLevel,
    };
  });

  // Also generate an 8x8 sub-regional KDE grid for interactive canvas rendering
  const gridCells = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cellLat = roundTo(13.2 - row * 1.05, 2);
      const cellLon = roundTo(3.8 + col * 1.35, 2);

      let cellKde = 0;
      for (const c of corridors) {
        const dist = haversineKm(cellLat, cellLon, c.latitude, c.longitude);
        cellKde += c.adjustedIncidencePct * Math.exp(-0.5 * Math.pow(dist / 240, 2));
      }

      const hotspotIndex = Math.min(100, Math.max(6, Math.round(cellKde * 1.32)));
      gridCells.push({
        cellCode: `KDE-R${row + 1}-C${col + 1}`,
        row: row + 1,
        col: col + 1,
        latitude: cellLat,
        longitude: cellLon,
        hotspotIndex,
        estimatedLarvalDensityPerM2: roundTo(hotspotIndex * 0.14, 1),
        windAdvectionRisk:
          hotspotIndex >= 70
            ? 'HIGH_SWARM_INCURSION'
            : hotspotIndex >= 42
            ? 'MODERATE_MOTH_FLIGHT'
            : 'LOW_BACKGROUND',
      });
    }
  }

  return {
    filterPestKey: filterPestKey || 'ALL_SPECIES',
    bandwidthKm,
    corridorCount: corridors.length,
    criticalCorridorsCount: corridors.filter(
      (c) => c.hotspotAlertLevel === 'CRITICAL_EPIDEMIC_PLUME'
    ).length,
    corridors,
    gridCells,
  };
}

module.exports = {
  REGIONAL_PEST_SENTINEL_CORRIDORS,
  generatePestOutbreakKdeSurface,
};
