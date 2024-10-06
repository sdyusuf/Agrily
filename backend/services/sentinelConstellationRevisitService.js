/**
 * ==============================================================================
 * 🛰️ AGRILY REMOTE SENSING DOMAIN - SENTINEL CONSTELLATION REVISIT SERVICE
 * ==============================================================================
 * 
 * Architecture Overview:
 * Models the dual-satellite Sentinel-2 constellation (Sentinel-2A and Sentinel-2B)
 * orbital mechanics, sun-synchronous ground-track geometry, Military Grid Reference
 * System (MGRS) UTM tiling across Nigeria, and temporal gap-filling algorithms
 * (Whittaker filter and Savitzky-Golay polynomial smoothing) for irregular
 * satellite vegetation index time series.
 * 
 * Orbital Mechanics & Optical Configuration:
 * 1. Constellation Configuration:
 *    - Satellites: Sentinel-2A (launched 23 June 2015), Sentinel-2B (launched 7 March 2017)
 *    - Phasing: 180° phased orbital plane
 *    - Altitude: 786 km nominal mean altitude
 *    - Orbit: Sun-synchronous, circular, near-polar
 *    - Inclination: 98.62°
 *    - Local Time of Descending Node (LTDN): 10:30 AM mean local solar time
 *    - Orbital Repeat Cycle: 143 orbits per 10-day cycle per satellite
 *    - Dual-satellite Revisit Frequency: 5 days at equator under cloud-free conditions
 *    - Field of View (Swath Width): 290 km using push-broom Multi-Spectral Instrument (MSI)
 * 
 * 2. Solar Illumination Geometry:
 *    - Solar Declination ($\delta$):
 *      $$\delta = 23.45^\circ \cdot \sin\left(\frac{360^\circ}{365} \cdot (DOY + 284)\right)$$
 *    - Equation of Time ($EoT$, minutes):
 *      $$B = \frac{360^\circ}{365} \cdot (DOY - 81)$$
 *      $$EoT = 9.87 \cdot \sin(2B) - 7.53 \cdot \cos(B) - 1.5 \cdot \sin(B)$$
 *    - Solar Zenith Angle ($\theta_s$):
 *      $$\cos(\theta_s) = \sin(\phi) \cdot \sin(\delta) + \cos(\phi) \cdot \cos(\delta) \cdot \cos(\omega)$$
 *    - Solar Azimuth Angle ($\phi_s$):
 *      $$\cos(\phi_s) = \frac{\sin(\delta) \cdot \cos(\phi) - \cos(\delta) \cdot \sin(\phi) \cdot \cos(\omega)}{\sin(\theta_s)}$$
 * 
 * 3. Temporal Trajectory Reconstruction:
 *    - Whittaker Smoother (Penalized Least Squares):
 *      $$Q = \sum_{i=1}^m w_i \cdot (y_i - z_i)^2 + \lambda \sum_{i=1}^{m-d} (\Delta^d z_i)^2$$
 *      balances fidelity to valid SCL-filtered observations ($w_i = 1$) against curve roughness ($\lambda$).
 *    - Savitzky-Golay Filtering (Local Quadratic Moving Window):
 *      Fits a local least-squares second-degree polynomial $P(t) = c_0 + c_1 t + c_2 t^2$
 *      over a sliding window $2m+1$ points to suppress residual high-frequency cloud noise.
 * 
 * 4. Nigerian Territorial Coverage:
 *    - Encompasses UTM Zones 31N, 32N, and 33N spanning Longitudes 2°40'E to 14°40'E and Latitudes 4°15'N to 13°55'N.
 *    - Primary relative orbit tracks: R037, R080, R094, R123, R137.
 * 
 * @module services/sentinelConstellationRevisitService
 * @version 1.0.0
 * @author Agrily Remote Sensing Core Team
 * ==============================================================================
 */

'use strict';

/**
 * Sentinel-2 Constellation Orbital Constants
 */
const SENTINEL_ORBITAL_CONSTANTS = Object.freeze({
  ALTITUDE_KM: 786.0,
  INCLINATION_DEG: 98.62,
  ORBITS_PER_CYCLE: 143,
  CYCLE_DAYS: 10,
  DUAL_REVISIT_NOMINAL_DAYS: 5,
  SWATH_WIDTH_KM: 290.0,
  EQUATOR_CROSSING_TIME_LOCAL: '10:30',
  PLATFORMS: Object.freeze({
    SENTINEL_2A: {
      platformId: 'S2A',
      launchDate: '2015-06-23',
      cosparId: '2015-028A',
      orbitalPhaseDeg: 0.0
    },
    SENTINEL_2B: {
      platformId: 'S2B',
      launchDate: '2017-03-07',
      cosparId: '2017-013A',
      orbitalPhaseDeg: 180.0
    }
  })
});

/**
 * Comprehensive Nigerian Federal States & FCT Geolocation & MGRS Tile Registry
 * Maps each jurisdiction to UTM Zone, Primary/Secondary MGRS tiles, and Relative Orbit Tracks.
 */
const NIGERIAN_STATE_ORBITAL_REGISTRY = Object.freeze({
  ABIA: {
    stateName: 'Abia',
    capital: 'Umuahia',
    geoCenter: { lat: 5.4527, lon: 7.5248 },
    utmZone: '32N',
    primaryMgrsTile: '32NNF',
    secondaryMgrsTiles: ['32NMF', '32NNG'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'RAINFOREST',
    cloudCoverRiskFactor: 0.72
  },
  ADAMAWA: {
    stateName: 'Adamawa',
    capital: 'Yola',
    geoCenter: { lat: 9.3265, lon: 12.3984 },
    utmZone: '33N',
    primaryMgrsTile: '33NVB',
    secondaryMgrsTiles: ['33NVA', '33NVC'],
    relativeOrbits: ['R094', 'R137'],
    agroEcologicalZone: 'GUINEA_SAVANNA',
    cloudCoverRiskFactor: 0.45
  },
  AKWA_IBOM: {
    stateName: 'Akwa Ibom',
    capital: 'Uyo',
    geoCenter: { lat: 5.0377, lon: 7.9128 },
    utmZone: '32N',
    primaryMgrsTile: '32NNF',
    secondaryMgrsTiles: ['32NNE', '32NPE'],
    relativeOrbits: ['R037', 'R123'],
    agroEcologicalZone: 'MANGROVE_SWAMP',
    cloudCoverRiskFactor: 0.78
  },
  ANAMBRA: {
    stateName: 'Anambra',
    capital: 'Awka',
    geoCenter: { lat: 6.2209, lon: 7.0700 },
    utmZone: '32N',
    primaryMgrsTile: '32NMG',
    secondaryMgrsTiles: ['32NNG', '32NMF'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'DERIVED_SAVANNA',
    cloudCoverRiskFactor: 0.65
  },
  BAUCHI: {
    stateName: 'Bauchi',
    capital: 'Bauchi',
    geoCenter: { lat: 10.3158, lon: 9.8442 },
    utmZone: '32N',
    primaryMgrsTile: '32NPN',
    secondaryMgrsTiles: ['32NPP', '33NTA'],
    relativeOrbits: ['R094', 'R137'],
    agroEcologicalZone: 'SUDAN_SAVANNA',
    cloudCoverRiskFactor: 0.38
  },
  BAYELSA: {
    stateName: 'Bayelsa',
    capital: 'Yenagoa',
    geoCenter: { lat: 4.7719, lon: 6.0699 },
    utmZone: '32N',
    primaryMgrsTile: '32NLE',
    secondaryMgrsTiles: ['32NLF', '32NME'],
    relativeOrbits: ['R037', 'R123'],
    agroEcologicalZone: 'MANGROVE_SWAMP',
    cloudCoverRiskFactor: 0.82
  },
  BENUE: {
    stateName: 'Benue',
    capital: 'Makurdi',
    geoCenter: { lat: 7.7322, lon: 8.5214 },
    utmZone: '32N',
    primaryMgrsTile: '32NNH',
    secondaryMgrsTiles: ['32NPH', '32NNJ'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'SOUTHERN_GUINEA_SAVANNA',
    cloudCoverRiskFactor: 0.58
  },
  BORNO: {
    stateName: 'Borno',
    capital: 'Maiduguri',
    geoCenter: { lat: 11.8333, lon: 13.1500 },
    utmZone: '33N',
    primaryMgrsTile: '33NVE',
    secondaryMgrsTiles: ['33NVD', '33NVF'],
    relativeOrbits: ['R094', 'R137'],
    agroEcologicalZone: 'SAHEL',
    cloudCoverRiskFactor: 0.22
  },
  CROSS_RIVER: {
    stateName: 'Cross River',
    capital: 'Calabar',
    geoCenter: { lat: 5.9631, lon: 8.3302 },
    utmZone: '32N',
    primaryMgrsTile: '32NPF',
    secondaryMgrsTiles: ['32NPG', '32NNF'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'TROPICAL_RAINFOREST',
    cloudCoverRiskFactor: 0.75
  },
  DELTA: {
    stateName: 'Delta',
    capital: 'Asaba',
    geoCenter: { lat: 5.5325, lon: 5.8987 },
    utmZone: '32N',
    primaryMgrsTile: '32NLF',
    secondaryMgrsTiles: ['32NLG', '32NMF'],
    relativeOrbits: ['R037', 'R123'],
    agroEcologicalZone: 'FRESHWATER_SWAMP',
    cloudCoverRiskFactor: 0.74
  },
  EBONYI: {
    stateName: 'Ebonyi',
    capital: 'Abakaliki',
    geoCenter: { lat: 6.3249, lon: 8.1137 },
    utmZone: '32N',
    primaryMgrsTile: '32NNG',
    secondaryMgrsTiles: ['32NPG', '32NNH'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'DERIVED_SAVANNA',
    cloudCoverRiskFactor: 0.62
  },
  EDO: {
    stateName: 'Edo',
    capital: 'Benin City',
    geoCenter: { lat: 6.5438, lon: 5.8987 },
    utmZone: '32N',
    primaryMgrsTile: '32NLG',
    secondaryMgrsTiles: ['32NLH', '32NMG'],
    relativeOrbits: ['R037', 'R123'],
    agroEcologicalZone: 'RAINFOREST',
    cloudCoverRiskFactor: 0.68
  },
  EKITI: {
    stateName: 'Ekiti',
    capital: 'Ado-Ekiti',
    geoCenter: { lat: 7.6211, lon: 5.2215 },
    utmZone: '31N',
    primaryMgrsTile: '31NEH',
    secondaryMgrsTiles: ['31NFH', '32NLH'],
    relativeOrbits: ['R080', 'R123'],
    agroEcologicalZone: 'RAINFOREST',
    cloudCoverRiskFactor: 0.64
  },
  ENUGU: {
    stateName: 'Enugu',
    capital: 'Enugu',
    geoCenter: { lat: 6.4584, lon: 7.5464 },
    utmZone: '32N',
    primaryMgrsTile: '32NNG',
    secondaryMgrsTiles: ['32NMG', '32NNH'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'DERIVED_SAVANNA',
    cloudCoverRiskFactor: 0.61
  },
  FCT: {
    stateName: 'Federal Capital Territory',
    capital: 'Abuja',
    geoCenter: { lat: 9.0765, lon: 7.3986 },
    utmZone: '32N',
    primaryMgrsTile: '32NMJ',
    secondaryMgrsTiles: ['32NNJ', '32NMK'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'SOUTHERN_GUINEA_SAVANNA',
    cloudCoverRiskFactor: 0.48
  },
  GOMBE: {
    stateName: 'Gombe',
    capital: 'Gombe',
    geoCenter: { lat: 10.2897, lon: 11.1673 },
    utmZone: '32N',
    primaryMgrsTile: '32NQP',
    secondaryMgrsTiles: ['33NTA', '33NUA'],
    relativeOrbits: ['R094', 'R137'],
    agroEcologicalZone: 'SUDAN_SAVANNA',
    cloudCoverRiskFactor: 0.36
  },
  IMO: {
    stateName: 'Imo',
    capital: 'Owerri',
    geoCenter: { lat: 5.4858, lon: 7.0351 },
    utmZone: '32N',
    primaryMgrsTile: '32NMF',
    secondaryMgrsTiles: ['32NNF', '32NLE'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'RAINFOREST',
    cloudCoverRiskFactor: 0.73
  },
  JIGAWA: {
    stateName: 'Jigawa',
    capital: 'Dutse',
    geoCenter: { lat: 12.2280, lon: 9.5616 },
    utmZone: '32N',
    primaryMgrsTile: '32NPR',
    secondaryMgrsTiles: ['32NPS', '32NNR'],
    relativeOrbits: ['R094', 'R137'],
    agroEcologicalZone: 'SUDAN_SAVANNA',
    cloudCoverRiskFactor: 0.28
  },
  KADUNA: {
    stateName: 'Kaduna',
    capital: 'Kaduna',
    geoCenter: { lat: 10.5105, lon: 7.4165 },
    utmZone: '32N',
    primaryMgrsTile: '32NML',
    secondaryMgrsTiles: ['32NNL', '32NMM'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'NORTHERN_GUINEA_SAVANNA',
    cloudCoverRiskFactor: 0.42
  },
  KANO: {
    stateName: 'Kano',
    capital: 'Kano',
    geoCenter: { lat: 11.9964, lon: 8.5167 },
    utmZone: '32N',
    primaryMgrsTile: '32NNQ',
    secondaryMgrsTiles: ['32NNP', '32NPQ'],
    relativeOrbits: ['R094', 'R137'],
    agroEcologicalZone: 'SUDAN_SAVANNA',
    cloudCoverRiskFactor: 0.31
  },
  KATSINA: {
    stateName: 'Katsina',
    capital: 'Katsina',
    geoCenter: { lat: 12.9908, lon: 7.6018 },
    utmZone: '32N',
    primaryMgrsTile: '32NMR',
    secondaryMgrsTiles: ['32NMS', '32NNR'],
    relativeOrbits: ['R094', 'R137'],
    agroEcologicalZone: 'SAHEL_SAVANNA',
    cloudCoverRiskFactor: 0.25
  },
  KEBBI: {
    stateName: 'Kebbi',
    capital: 'Birnin Kebbi',
    geoCenter: { lat: 12.4504, lon: 4.1975 },
    utmZone: '31N',
    primaryMgrsTile: '31PDR',
    secondaryMgrsTiles: ['31PDS', '31PER'],
    relativeOrbits: ['R080', 'R123'],
    agroEcologicalZone: 'SUDAN_SAVANNA',
    cloudCoverRiskFactor: 0.29
  },
  KOGI: {
    stateName: 'Kogi',
    capital: 'Lokoja',
    geoCenter: { lat: 7.7969, lon: 6.7405 },
    utmZone: '32N',
    primaryMgrsTile: '32NLH',
    secondaryMgrsTiles: ['32NMH', '32NLJ'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'SOUTHERN_GUINEA_SAVANNA',
    cloudCoverRiskFactor: 0.55
  },
  KWARA: {
    stateName: 'Kwara',
    capital: 'Ilorin',
    geoCenter: { lat: 8.4799, lon: 4.5418 },
    utmZone: '31N',
    primaryMgrsTile: '31NFJ',
    secondaryMgrsTiles: ['31NEJ', '31NFK'],
    relativeOrbits: ['R080', 'R123'],
    agroEcologicalZone: 'SOUTHERN_GUINEA_SAVANNA',
    cloudCoverRiskFactor: 0.52
  },
  LAGOS: {
    stateName: 'Lagos',
    capital: 'Ikeja',
    geoCenter: { lat: 6.5244, lon: 3.3792 },
    utmZone: '31N',
    primaryMgrsTile: '31NDF',
    secondaryMgrsTiles: ['31NEF', '31NDG'],
    relativeOrbits: ['R080', 'R123'],
    agroEcologicalZone: 'COASTAL_LAGOON',
    cloudCoverRiskFactor: 0.79
  },
  NASARAWA: {
    stateName: 'Nasarawa',
    capital: 'Lafia',
    geoCenter: { lat: 8.4983, lon: 8.5247 },
    utmZone: '32N',
    primaryMgrsTile: '32NNJ',
    secondaryMgrsTiles: ['32NPJ', '32NNK'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'SOUTHERN_GUINEA_SAVANNA',
    cloudCoverRiskFactor: 0.51
  },
  NIGER: {
    stateName: 'Niger',
    capital: 'Minna',
    geoCenter: { lat: 9.9309, lon: 5.5983 },
    utmZone: '31N',
    primaryMgrsTile: '31PFL',
    secondaryMgrsTiles: ['32NLL', '31PFK'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'NORTHERN_GUINEA_SAVANNA',
    cloudCoverRiskFactor: 0.46
  },
  OGUN: {
    stateName: 'Ogun',
    capital: 'Abeokuta',
    geoCenter: { lat: 7.1475, lon: 3.3619 },
    utmZone: '31N',
    primaryMgrsTile: '31NDG',
    secondaryMgrsTiles: ['31NEG', '31NDH'],
    relativeOrbits: ['R080', 'R123'],
    agroEcologicalZone: 'RAINFOREST',
    cloudCoverRiskFactor: 0.70
  },
  ONDO: {
    stateName: 'Ondo',
    capital: 'Akure',
    geoCenter: { lat: 7.2571, lon: 5.2058 },
    utmZone: '31N',
    primaryMgrsTile: '31NFH',
    secondaryMgrsTiles: ['31NEH', '32NLH'],
    relativeOrbits: ['R080', 'R123'],
    agroEcologicalZone: 'RAINFOREST',
    cloudCoverRiskFactor: 0.67
  },
  OSUN: {
    stateName: 'Osun',
    capital: 'Osogbo',
    geoCenter: { lat: 7.5629, lon: 4.5200 },
    utmZone: '31N',
    primaryMgrsTile: '31NEH',
    secondaryMgrsTiles: ['31NFH', '31NEG'],
    relativeOrbits: ['R080', 'R123'],
    agroEcologicalZone: 'RAINFOREST',
    cloudCoverRiskFactor: 0.66
  },
  OYO: {
    stateName: 'Oyo',
    capital: 'Ibadan',
    geoCenter: { lat: 7.3775, lon: 3.9470 },
    utmZone: '31N',
    primaryMgrsTile: '31NEG',
    secondaryMgrsTiles: ['31NDG', '31NEH'],
    relativeOrbits: ['R080', 'R123'],
    agroEcologicalZone: 'DERIVED_SAVANNA',
    cloudCoverRiskFactor: 0.63
  },
  PLATEAU: {
    stateName: 'Plateau',
    capital: 'Jos',
    geoCenter: { lat: 9.8965, lon: 8.8583 },
    utmZone: '32N',
    primaryMgrsTile: '32NNL',
    secondaryMgrsTiles: ['32NPL', '32NNK'],
    relativeOrbits: ['R037', 'R080'],
    agroEcologicalZone: 'JOS_PLATEAU_MONTANE',
    cloudCoverRiskFactor: 0.54
  },
  RIVERS: {
    stateName: 'Rivers',
    capital: 'Port Harcourt',
    geoCenter: { lat: 4.8156, lon: 7.0498 },
    utmZone: '32N',
    primaryMgrsTile: '32NME',
    secondaryMgrsTiles: ['32NNE', '32NMF'],
    relativeOrbits: ['R037', 'R123'],
    agroEcologicalZone: 'MANGROVE_SWAMP',
    cloudCoverRiskFactor: 0.81
  },
  SOKOTO: {
    stateName: 'Sokoto',
    capital: 'Sokoto',
    geoCenter: { lat: 13.0609, lon: 5.2476 },
    utmZone: '31N',
    primaryMgrsTile: '31PER',
    secondaryMgrsTiles: ['31PES', '31PFR'],
    relativeOrbits: ['R080', 'R123'],
    agroEcologicalZone: 'SAHEL_SAVANNA',
    cloudCoverRiskFactor: 0.23
  },
  TARABA: {
    stateName: 'Taraba',
    capital: 'Jalingo',
    geoCenter: { lat: 8.8937, lon: 11.3596 },
    utmZone: '32N',
    primaryMgrsTile: '32NQK',
    secondaryMgrsTiles: ['33NTB', '32NQJ'],
    relativeOrbits: ['R094', 'R137'],
    agroEcologicalZone: 'SOUTHERN_GUINEA_SAVANNA',
    cloudCoverRiskFactor: 0.53
  },
  YOBE: {
    stateName: 'Yobe',
    capital: 'Damaturu',
    geoCenter: { lat: 12.0000, lon: 11.5000 },
    utmZone: '32N',
    primaryMgrsTile: '32NQS',
    secondaryMgrsTiles: ['32NQR', '33NUC'],
    relativeOrbits: ['R094', 'R137'],
    agroEcologicalZone: 'SAHEL_SAVANNA',
    cloudCoverRiskFactor: 0.26
  },
  ZAMFARA: {
    stateName: 'Zamfara',
    capital: 'Gusau',
    geoCenter: { lat: 12.1628, lon: 6.6614 },
    utmZone: '32N',
    primaryMgrsTile: '32NLQ',
    secondaryMgrsTiles: ['32NLR', '32NMQ'],
    relativeOrbits: ['R080', 'R123'],
    agroEcologicalZone: 'SUDAN_SAVANNA',
    cloudCoverRiskFactor: 0.30
  }
});

class SentinelConstellationRevisitService {
  /**
   * Retrieves orbital registry metadata for a given Nigerian State or FCT
   * 
   * @param {string} stateKey - Name or key of the state (case-insensitive)
   * @returns {Object} State orbital configuration and MGRS footprint
   */
  getStateOrbitalProfile(stateKey) {
    if (!stateKey || typeof stateKey !== 'string') {
      throw new Error('A valid Nigerian state string identifier is required.');
    }

    const normalizedKey = stateKey.trim().toUpperCase().replace(/\s+/g, '_');
    const profile = NIGERIAN_STATE_ORBITAL_REGISTRY[normalizedKey];

    if (!profile) {
      const match = Object.values(NIGERIAN_STATE_ORBITAL_REGISTRY).find(
        (s) => s.stateName.toLowerCase() === stateKey.trim().toLowerCase()
      );
      if (match) return { ...match };
      throw new Error(`Unrecognized Nigerian state or territorial region: "${stateKey}"`);
    }

    return { ...profile };
  }

  /**
   * Computes precise solar illumination geometry for a geographical coordinate
   * at nominal Sentinel-2 descending node overpass time (10:30 AM local solar time).
   * 
   * @param {number} latitudeDeg - Latitude in decimal degrees [-90 to +90]
   * @param {number} longitudeDeg - Longitude in decimal degrees [-180 to +180]
   * @param {Date|string} observationDate - Calendar date of satellite pass
   * @returns {Object} Solar zenith, azimuth, elevation, and declination angles
   */
  calculateSolarGeometry(latitudeDeg, longitudeDeg, observationDate) {
    const dateObj = new Date(observationDate);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid observation date supplied for solar geometry calculation.');
    }

    // Day of Year (DOY, 1-366)
    const startOfYear = new Date(dateObj.getUTCFullYear(), 0, 1);
    const dayOfYear = Math.floor((dateObj - startOfYear) / (24 * 60 * 60 * 1000)) + 1;

    // Fractional year parameter gamma (radians)
    const gamma = (2 * Math.PI / 365) * (dayOfYear - 1);

    // Solar Declination delta (Spencer 1971 formulation, radians)
    const deltaRad = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
      - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
      - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

    const declinationDeg = (deltaRad * 180) / Math.PI;

    // Equation of Time (EoT, minutes)
    const eotMinutes = 229.18 * (
      0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
      - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma)
    );

    // Sentinel-2 descends at 10:30 AM local solar time (630 minutes from midnight)
    // Local Solar Time (LST) = 10.5 hours
    // Hour Angle omega = 15° * (LST - 12) = -22.5°
    const hourAngleDeg = -22.5;
    const hourAngleRad = (hourAngleDeg * Math.PI) / 180;
    const latRad = (latitudeDeg * Math.PI) / 180;

    // Solar Elevation Angle alpha_s
    const sinElevation = Math.sin(latRad) * Math.sin(deltaRad)
      + Math.cos(latRad) * Math.cos(deltaRad) * Math.cos(hourAngleRad);

    const elevationRad = Math.asin(Math.max(-1, Math.min(1, sinElevation)));
    const elevationDeg = (elevationRad * 180) / Math.PI;

    // Solar Zenith Angle theta_s = 90° - elevation
    const zenithDeg = 90 - elevationDeg;
    const zenithRad = (zenithDeg * Math.PI) / 180;

    // Solar Azimuth Angle phi_s (degrees clockwise from North)
    const cosAzimuth = (Math.sin(deltaRad) * Math.cos(latRad) - Math.cos(deltaRad) * Math.sin(latRad) * Math.cos(hourAngleRad))
      / Math.cos(elevationRad);
    
    let azimuthDeg = (Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * 180) / Math.PI;
    if (Math.sin(hourAngleRad) > 0) {
      azimuthDeg = 360 - azimuthDeg;
    }

    // Top-Of-Atmosphere Solar Earth-Sun distance correction factor (d_es^2)
    const earthSunDistanceAu = 1.000110 + 0.034221 * Math.cos(gamma) + 0.001280 * Math.sin(gamma)
      + 0.000719 * Math.cos(2 * gamma) + 0.000077 * Math.sin(2 * gamma);

    return {
      dayOfYear,
      declinationDeg: Number(declinationDeg.toFixed(3)),
      solarElevationDeg: Number(elevationDeg.toFixed(2)),
      solarZenithDeg: Number(zenithDeg.toFixed(2)),
      solarAzimuthDeg: Number(azimuthDeg.toFixed(2)),
      equationOfTimeMinutes: Number(eotMinutes.toFixed(2)),
      earthSunDistanceCorrection: Number(earthSunDistanceAu.toFixed(5)),
      descendingNodeLocalTime: '10:30 AM'
    };
  }

  /**
   * Generates a 30-day forward or retrospective satellite revisit schedule
   * for a target location in Nigeria under dual-platform Sentinel-2A/2B geometry.
   * 
   * @param {Object} options - Parameter configuration
   * @param {number} options.latitude - Latitude in decimal degrees
   * @param {number} options.longitude - Longitude in decimal degrees
   * @param {string} [options.stateKey] - Optional state name for MGRS context
   * @param {Date|string} [options.startDate] - Start of scheduling window
   * @param {number} [options.horizonDays=30] - Schedule duration in days
   * @returns {Object} Forecasted satellite overpass passes with platform and solar geometry
   */
  generateConstellationRevisitSchedule({
    latitude,
    longitude,
    stateKey,
    startDate = new Date(),
    horizonDays = 30
  }) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Numeric latitude and longitude coordinates are mandatory.');
    }

    const stateProfile = stateKey ? this.getStateOrbitalProfile(stateKey) : null;
    const start = new Date(startDate);
    const passes = [];

    // Reference epoch for Sentinel-2 10-day orbital cycle
    const epochReference = new Date('2024-01-01T10:30:00Z');
    const dayMs = 24 * 60 * 60 * 1000;

    for (let dayOffset = 0; dayOffset < horizonDays; dayOffset++) {
      const candidateDate = new Date(start.getTime() + dayOffset * dayMs);
      const daysSinceEpoch = Math.floor((candidateDate - epochReference) / dayMs);

      // Sentinel-2A visits every 10 days on cycle offset 0
      // Sentinel-2B visits every 10 days on cycle offset 5 (180° phased)
      const cycleModulus = ((daysSinceEpoch % 10) + 10) % 10;
      let platform = null;

      if (cycleModulus === 0) {
        platform = SENTINEL_ORBITAL_CONSTANTS.PLATFORMS.SENTINEL_2A;
      } else if (cycleModulus === 5) {
        platform = SENTINEL_ORBITAL_CONSTANTS.PLATFORMS.SENTINEL_2B;
      }

      if (platform) {
        const solarGeo = this.calculateSolarGeometry(latitude, longitude, candidateDate);
        const cloudFactor = stateProfile ? stateProfile.cloudCoverRiskFactor : 0.50;

        // Estimated probability of acquisition success based on agro-ecological cloud factor
        const clearSkyProbability = Math.max(0.15, Math.min(0.95, 1.0 - cloudFactor));

        passes.push({
          passId: `${platform.platformId}_${candidateDate.toISOString().slice(0, 10).replace(/-/g, '')}`,
          platform: platform.platformId,
          cosparId: platform.cosparId,
          date: candidateDate.toISOString().slice(0, 10),
          nominalTimeUtc: '09:45:00Z',
          nominalTimeLocal: '10:45:00 WAT',
          mgrsTile: stateProfile ? stateProfile.primaryMgrsTile : '32NNG',
          relativeOrbit: stateProfile ? stateProfile.relativeOrbits[0] : 'R037',
          solarZenithDeg: solarGeo.solarZenithDeg,
          solarAzimuthDeg: solarGeo.solarAzimuthDeg,
          clearSkyProbability: Number(clearSkyProbability.toFixed(2)),
          sensorInstrument: 'MSI (Multi-Spectral Instrument)'
        });
      }
    }

    return {
      queryCoordinates: { latitude, longitude },
      stateContext: stateProfile ? stateProfile.stateName : 'Custom Coordinates',
      mgrsPrimaryTile: stateProfile ? stateProfile.primaryMgrsTile : 'UNKNOWN',
      horizonDays,
      totalPassesScheduled: passes.length,
      averageRevisitIntervalDays: Number((horizonDays / Math.max(1, passes.length)).toFixed(1)),
      passes
    };
  }

  /**
   * Applies Savitzky-Golay quadratic moving-window polynomial filter
   * to smooth erratic or cloud-contaminated vegetation index time series.
   * 
   * @param {Array<number>} values - Unfiltered time series values (e.g., raw NDVI)
   * @param {number} [windowHalfWidth=2] - Half-width m of the filter (window size = 2m + 1 = 5)
   * @returns {Array<number>} Smoothed time series array
   */
  applySavitzkyGolayFilter(values, windowHalfWidth = 2) {
    if (!Array.isArray(values) || values.length === 0) {
      return [];
    }

    const n = values.length;
    const windowSize = 2 * windowHalfWidth + 1;

    // For short series smaller than window, return clamped clone
    if (n < windowSize) {
      return values.map((v) => Number(v.toFixed(4)));
    }

    // Standard Savitzky-Golay convolution coefficients for quadratic/cubic polynomial
    // For m = 2 (window size 5): [-3, 12, 17, 12, -3] / 35
    // For m = 3 (window size 7): [-2, 3, 6, 7, 6, 3, -2] / 21
    let weights;
    let normalizationDivisor;

    if (windowHalfWidth === 2) {
      weights = [-3, 12, 17, 12, -3];
      normalizationDivisor = 35;
    } else if (windowHalfWidth === 3) {
      weights = [-2, 3, 6, 7, 6, 3, -2];
      normalizationDivisor = 21;
    } else {
      weights = [-3, 12, 17, 12, -3];
      normalizationDivisor = 35;
      windowHalfWidth = 2;
    }

    const smoothed = new Array(n);

    for (let i = 0; i < n; i++) {
      let weightedSum = 0;
      let effectiveWeightTotal = 0;

      for (let k = -windowHalfWidth; k <= windowHalfWidth; k++) {
        const targetIdx = i + k;
        const weight = weights[k + windowHalfWidth];

        if (targetIdx >= 0 && targetIdx < n) {
          weightedSum += values[targetIdx] * weight;
          effectiveWeightTotal += weight;
        } else {
          // Symmetric boundary reflection
          const reflectedIdx = targetIdx < 0 ? Math.abs(targetIdx) : 2 * n - targetIdx - 2;
          const safeIdx = Math.max(0, Math.min(n - 1, reflectedIdx));
          weightedSum += values[safeIdx] * weight;
          effectiveWeightTotal += weight;
        }
      }

      const smoothedVal = effectiveWeightTotal !== 0 ? weightedSum / normalizationDivisor : values[i];
      // Clamp smoothed NDVI to physically valid range [-1.0, +1.0]
      smoothed[i] = Number(Math.max(-1.0, Math.min(1.0, smoothedVal)).toFixed(4));
    }

    return smoothed;
  }

  /**
   * Whittaker Smoother (Penalized Least Squares) algorithm for regularizing
   * vegetation index trajectories with missing cloud data and varying observation weights.
   * 
   * @param {Array<number>} observations - Raw observations array
   * @param {Array<number>} weights - Quality weights (1.0 = clear sky, 0.0 = cloud/shadow)
   * @param {number} [lambda=10.0] - Smoothing parameter (higher = smoother curve)
   * @returns {Array<number>} Whittaker-smoothed vegetation trajectory
   */
  applyWhittakerSmoother(observations, weights, lambda = 10.0) {
    if (!Array.isArray(observations) || observations.length === 0) {
      return [];
    }

    const m = observations.length;
    if (m === 1) return [observations[0]];

    const w = weights && weights.length === m
      ? weights
      : new Array(m).fill(1.0);

    // Tridiagonal system solver for 2nd-order difference penalized least squares
    // (W + lambda * D' * D) * z = W * y
    // For small-to-medium series, compute using Jacobi iterative relaxation
    let z = [...observations];
    const maxIterations = 50;
    const tolerance = 1e-4;

    for (let iter = 0; iter < maxIterations; iter++) {
      let maxDelta = 0;
      const nextZ = [...z];

      for (let i = 0; i < m; i++) {
        const weight = w[i];
        let diffNeighbors = 0;
        let diffWeight = 0;

        if (i > 0) {
          diffNeighbors += z[i - 1];
          diffWeight += lambda;
        }
        if (i < m - 1) {
          diffNeighbors += z[i + 1];
          diffWeight += lambda;
        }

        const denominator = weight + diffWeight;
        const numerator = (weight * observations[i]) + (lambda * diffNeighbors);

        const updatedVal = denominator > 0 ? numerator / denominator : z[i];
        const delta = Math.abs(updatedVal - z[i]);
        if (delta > maxDelta) maxDelta = delta;
        nextZ[i] = updatedVal;
      }

      z = nextZ;
      if (maxDelta < tolerance) break;
    }

    return z.map((val) => Number(Math.max(-1.0, Math.min(1.0, val)).toFixed(4)));
  }
}

const sentinelConstellationRevisitService = new SentinelConstellationRevisitService();

module.exports = {
  SentinelConstellationRevisitService,
  sentinelConstellationRevisitService,
  SENTINEL_ORBITAL_CONSTANTS,
  NIGERIAN_STATE_ORBITAL_REGISTRY
};
