/**
 * ==============================================================================
 * 🛰️ AGRILY REMOTE SENSING DOMAIN - SATELLITE ATMOSPHERIC CORRECTION SERVICE
 * ==============================================================================
 * 
 * Architecture Overview:
 * Implements simplified 6S (Second Simulation of the Satellite Signal in the Solar
 * Spectrum) radiative transfer approximations and topographic illumination
 * normalization for Sentinel-2 Multi-Spectral Instrument (MSI) Level-1C to
 * Level-2A Bottom-Of-Atmosphere (BOA) surface reflectance processing.
 * 
 * Radiative Transfer Physics Formulation:
 * 1. Top-Of-Atmosphere (TOA) to BOA Reflectance Inversion:
 *    $$\rho_{BOA}(\lambda) = \frac{\rho_{TOA}(\lambda) - \rho_{atm}(\lambda)}{T(\theta_s, \lambda) \cdot T(\theta_v, \lambda) \cdot \left[1 + S(\lambda) \cdot \rho_{BOA}(\lambda)\right]}$$
 *    where:
 *      - $\rho_{TOA}$: Apparent reflectance measured at sensor aperture
 *      - $\rho_{atm}$: Atmospheric path reflectance (Rayleigh + Aerosol backscatter)
 *      - $T(\theta_s), T(\theta_v)$: Downward and upward atmospheric transmittance functions
 *      - $S(\lambda)$: Spherical albedo of the atmosphere
 *      - $\theta_s, \theta_v$: Solar zenith and sensor view zenith angles
 * 
 * 2. Rayleigh Scattering Optical Thickness (Bodhaine et al. 1999):
 *    $$\tau_R(\lambda) = 0.008569 \cdot \lambda^{-4} \cdot \left(1 + 0.0113 \cdot \lambda^{-2} + 0.00013 \cdot \lambda^{-4}\right) \cdot \frac{P(z)}{P_0}$$
 *    where $\lambda$ is wavelength in $\mu\text{m}$ and $P(z)/P_0$ is barometric pressure scale height.
 * 
 * 3. Topographic Minnaert Illumination Normalization:
 *    $$\cos(i) = \cos(\theta_s) \cos(S) + \sin(\theta_s) \sin(S) \cos(\phi_s - \phi_a)$$
 *    $$\rho_{norm}(\lambda) = \rho_{BOA}(\lambda) \cdot \left( \frac{\cos(\theta_s)}{\cos(i)} \right)^{k(\lambda)}$$
 *    where $S$ is surface slope, $\phi_s - \phi_a$ is relative solar-surface azimuth,
 *    and $k(\lambda)$ is the empirical Minnaert limb-darkening exponent.
 * 
 * 4. Harmattan Aerosol Profile:
 *    Tailored for West African Sahelian dust plumes with angstrom exponent $\alpha \approx 0.35$
 *    and single scattering albedo $\omega_0 \approx 0.89$.
 * 
 * @module services/satelliteAtmosphericCorrectionService
 * @version 1.0.0
 * @author Agrily Remote Sensing Core Team
 * ==============================================================================
 */

'use strict';

/**
 * Sentinel-2 MSI Multi-Spectral Instrument Sensor Band Specifications
 */
const SENTINEL2_MSI_BANDS = Object.freeze({
  B01: {
    bandName: 'Coastal Aerosol',
    centralWavelengthNm: 443,
    bandwidthNm: 20,
    spatialResolutionM: 60,
    solarIrradianceWm2: 1913.0,
    rayleighReflectanceNominal: 0.158,
    atmosphericAbsorptionFactor: 0.024
  },
  B02: {
    bandName: 'Blue',
    centralWavelengthNm: 490,
    bandwidthNm: 65,
    spatialResolutionM: 10,
    solarIrradianceWm2: 1941.6,
    rayleighReflectanceNominal: 0.108,
    atmosphericAbsorptionFactor: 0.018
  },
  B03: {
    bandName: 'Green',
    centralWavelengthNm: 560,
    bandwidthNm: 35,
    spatialResolutionM: 10,
    solarIrradianceWm2: 1822.6,
    rayleighReflectanceNominal: 0.062,
    atmosphericAbsorptionFactor: 0.035
  },
  B04: {
    bandName: 'Red',
    centralWavelengthNm: 665,
    bandwidthNm: 30,
    spatialResolutionM: 10,
    solarIrradianceWm2: 1565.4,
    rayleighReflectanceNominal: 0.031,
    atmosphericAbsorptionFactor: 0.045
  },
  B05: {
    bandName: 'Vegetation Red Edge 1',
    centralWavelengthNm: 705,
    bandwidthNm: 15,
    spatialResolutionM: 20,
    solarIrradianceWm2: 1395.2,
    rayleighReflectanceNominal: 0.024,
    atmosphericAbsorptionFactor: 0.022
  },
  B06: {
    bandName: 'Vegetation Red Edge 2',
    centralWavelengthNm: 740,
    bandwidthNm: 15,
    spatialResolutionM: 20,
    solarIrradianceWm2: 1288.3,
    rayleighReflectanceNominal: 0.020,
    atmosphericAbsorptionFactor: 0.015
  },
  B07: {
    bandName: 'Vegetation Red Edge 3',
    centralWavelengthNm: 783,
    bandwidthNm: 20,
    spatialResolutionM: 20,
    solarIrradianceWm2: 1195.4,
    rayleighReflectanceNominal: 0.016,
    atmosphericAbsorptionFactor: 0.012
  },
  B08: {
    bandName: 'Near Infrared (NIR)',
    centralWavelengthNm: 842,
    bandwidthNm: 115,
    spatialResolutionM: 10,
    solarIrradianceWm2: 1041.2,
    rayleighReflectanceNominal: 0.012,
    atmosphericAbsorptionFactor: 0.028
  },
  B8A: {
    bandName: 'Narrow NIR',
    centralWavelengthNm: 865,
    bandwidthNm: 20,
    spatialResolutionM: 20,
    solarIrradianceWm2: 955.3,
    rayleighReflectanceNominal: 0.011,
    atmosphericAbsorptionFactor: 0.026
  },
  B09: {
    bandName: 'Water Vapour',
    centralWavelengthNm: 945,
    bandwidthNm: 20,
    spatialResolutionM: 60,
    solarIrradianceWm2: 813.5,
    rayleighReflectanceNominal: 0.007,
    atmosphericAbsorptionFactor: 0.380
  },
  B11: {
    bandName: 'SWIR 1',
    centralWavelengthNm: 1610,
    bandwidthNm: 90,
    spatialResolutionM: 20,
    solarIrradianceWm2: 247.5,
    rayleighReflectanceNominal: 0.001,
    atmosphericAbsorptionFactor: 0.018
  },
  B12: {
    bandName: 'SWIR 2',
    centralWavelengthNm: 2190,
    bandwidthNm: 180,
    spatialResolutionM: 20,
    solarIrradianceWm2: 87.2,
    rayleighReflectanceNominal: 0.0003,
    atmosphericAbsorptionFactor: 0.012
  }
});

/**
 * Standard atmospheric aerosol models encountered across Sub-Saharan Africa
 */
const AEROSOL_CLIMATOLOGY_MODELS = Object.freeze({
  CONTINENTAL_CLEAN: {
    modelName: 'Sub-Saharan Background Continental',
    angstromAlpha: 1.25,
    singleScatteringAlbedo550: 0.94,
    asymmetryFactorG: 0.64,
    typicalAod550: 0.15
  },
  SAHARAN_HARMATTAN_DUST: {
    modelName: 'West African Harmattan Mineral Dust Plume',
    angstromAlpha: 0.35,
    singleScatteringAlbedo550: 0.88,
    asymmetryFactorG: 0.72,
    typicalAod550: 0.65
  },
  BIOMASS_BURNING_SMOKE: {
    modelName: 'Dry Season Savanna Agricultural Bush Burning',
    angstromAlpha: 1.75,
    singleScatteringAlbedo550: 0.82,
    asymmetryFactorG: 0.61,
    typicalAod550: 0.45
  },
  MARITIME_COASTAL: {
    modelName: 'Gulf of Guinea Humid Marine Boundary Layer',
    angstromAlpha: 0.85,
    singleScatteringAlbedo550: 0.98,
    asymmetryFactorG: 0.76,
    typicalAod550: 0.20
  }
});

class SatelliteAtmosphericCorrectionService {
  /**
   * Calculates atmospheric optical thickness of molecular Rayleigh scattering
   * 
   * @param {number} wavelengthMicrons - Wavelength in micrometers (e.g. 0.665 for B04)
   * @param {number} elevationMeters - Elevation above mean sea level
   * @returns {number} Rayleigh optical depth tau_R
   */
  static calculateRayleighOpticalDepth(wavelengthMicrons, elevationMeters = 0) {
    const lam = Math.max(0.35, Math.min(2.5, Number(wavelengthMicrons)));
    const z = Math.max(-100, Math.min(6000, Number(elevationMeters)));

    // Standard barometric pressure ratio: P(z) / P_0 = exp(-z / 8434.5)
    const scaleHeight = 8434.5;
    const pressureRatio = Math.exp(-z / scaleHeight);

    // Bodhaine precision formula
    const lam2 = lam * lam;
    const lam4 = lam2 * lam2;
    const rayleighSeaLevel = 0.008569 * (1.0 / lam4) * (1.0 + 0.0113 * (1.0 / lam2) + 0.00013 * (1.0 / lam4));

    return parseFloat((rayleighSeaLevel * pressureRatio).toFixed(5));
  }

  /**
   * Calculates aerosol optical depth (AOD) extrapolated from 550nm reference via Angstrom law
   * 
   * @param {number} wavelengthMicrons - Wavelength in microns
   * @param {number} aod550 - Aerosol optical depth at 550nm
   * @param {number} angstromAlpha - Angstrom wavelength exponent
   * @returns {number} Aerosol optical depth tau_A
   */
  static calculateAerosolOpticalDepth(wavelengthMicrons, aod550 = 0.20, angstromAlpha = 1.25) {
    const lam = Math.max(0.35, Number(wavelengthMicrons));
    const tau550 = Math.max(0.01, Math.min(3.0, Number(aod550)));
    const alpha = Number(angstromAlpha);

    // Angstrom power-law relation: tau(lam) = tau(0.55) * (lam / 0.55)^(-alpha)
    const tauAerosol = tau550 * Math.pow(lam / 0.55, -alpha);
    return parseFloat(tauAerosol.toFixed(5));
  }

  /**
   * Computes downward direct and diffuse atmospheric transmittance
   * 
   * @param {number} totalOpticalDepth - Sum of Rayleigh + Aerosol + Ozone depths
   * @param {number} zenithAngleDeg - Solar or sensor zenith angle in degrees
   * @returns {number} Transmittance factor T (0.0 to 1.0)
   */
  static calculateAtmosphericTransmittance(totalOpticalDepth, zenithAngleDeg = 30) {
    const thetaRad = (Math.max(0, Math.min(85, Number(zenithAngleDeg))) * Math.PI) / 180.0;
    const airMass = 1.0 / (Math.cos(thetaRad) + 0.50572 * Math.pow(96.07995 - (thetaRad * 180 / Math.PI), -1.6364));

    // Beer-Lambert transmittance with diffuse forward-scatter recovery
    const directTrans = Math.exp(-totalOpticalDepth * airMass);
    const diffuseFraction = 0.55 * (1.0 - Math.exp(-0.85 * totalOpticalDepth * airMass));
    const totalTrans = directTrans + diffuseFraction;

    return Math.max(0.05, Math.min(1.0, parseFloat(totalTrans.toFixed(4))));
  }

  /**
   * Performs BOA surface reflectance retrieval from TOA reflectance for a given Sentinel-2 band
   * 
   * @param {Object} params
   * @param {string} params.bandKey - e.g. 'B04', 'B08', 'B02', 'B03'
   * @param {number} params.toaReflectance - Measured TOA reflectance (0.0 to 1.0)
   * @param {number} [params.sunZenithDeg] - Solar zenith angle
   * @param {number} [params.viewZenithDeg] - Satellite view zenith angle
   * @param {number} [params.elevationMeters] - Plot elevation
   * @param {string} [params.aerosolModelKey] - Key from AEROSOL_CLIMATOLOGY_MODELS
   * @param {number} [params.customAod550] - Optional custom measured AOD
   * @returns {Object} Corrected BOA reflectance and atmospheric transmission terms
   */
  static performBandAtmosphericCorrection(params = {}) {
    const bandKey = (params.bandKey || 'B04').toUpperCase();
    const bandSpec = SENTINEL2_MSI_BANDS[bandKey] || SENTINEL2_MSI_BANDS.B04;
    const toa = Math.max(0.0, Math.min(1.2, Number(params.toaReflectance) || 0.10));
    const sunZenith = Number(params.sunZenithDeg !== undefined ? params.sunZenithDeg : 32.0);
    const viewZenith = Number(params.viewZenithDeg !== undefined ? params.viewZenithDeg : 6.5);
    const elevation = Number(params.elevationMeters || 350);

    const modelKey = params.aerosolModelKey || 'CONTINENTAL_CLEAN';
    const aerosolModel = AEROSOL_CLIMATOLOGY_MODELS[modelKey] || AEROSOL_CLIMATOLOGY_MODELS.CONTINENTAL_CLEAN;
    const aod550 = params.customAod550 !== undefined ? Number(params.customAod550) : aerosolModel.typicalAod550;

    const lamMicrons = bandSpec.centralWavelengthNm / 1000.0;
    const tauRayleigh = this.calculateRayleighOpticalDepth(lamMicrons, elevation);
    const tauAerosol = this.calculateAerosolOpticalDepth(lamMicrons, aod550, aerosolModel.angstromAlpha);
    const tauTotal = tauRayleigh + tauAerosol + bandSpec.atmosphericAbsorptionFactor;

    const transSun = this.calculateAtmosphericTransmittance(tauTotal, sunZenith);
    const transView = this.calculateAtmosphericTransmittance(tauTotal, viewZenith);
    const twoWayTransmittance = transSun * transView;

    // Atmospheric path radiance reflectance approximation
    const pathReflectance = (bandSpec.rayleighReflectanceNominal * 0.45) + (tauAerosol * 0.08);

    // Spherical albedo S of atmosphere
    const sphericalAlbedo = 0.5 * (tauRayleigh + 0.3 * tauAerosol);

    // Invert radiative transfer equation: rho_BOA = (rho_TOA - rho_atm) / (T_two_way * (1 + S * rho_BOA))
    const rawNumerator = Math.max(0.001, toa - pathReflectance);
    let boaReflectance = rawNumerator / (twoWayTransmittance * (1.0 + sphericalAlbedo * toa));
    boaReflectance = Math.max(0.002, Math.min(0.98, parseFloat(boaReflectance.toFixed(4))));

    return {
      success: true,
      bandKey,
      centralWavelengthNm: bandSpec.centralWavelengthNm,
      toaReflectance: toa,
      boaReflectance,
      correctionTerms: {
        tauRayleigh,
        tauAerosol,
        tauTotal: parseFloat(tauTotal.toFixed(4)),
        pathReflectance: parseFloat(pathReflectance.toFixed(4)),
        twoWayTransmittance: parseFloat(twoWayTransmittance.toFixed(4)),
        sphericalAlbedo: parseFloat(sphericalAlbedo.toFixed(4))
      },
      aerosolContext: {
        modelName: aerosolModel.modelName,
        aod550Used: aod550
      }
    };
  }

  /**
   * Normalizes BOA surface reflectance across sloped agricultural terrain using Minnaert topographic algorithm
   * 
   * @param {Object} params
   * @param {number} params.boaReflectance - Uncorrected BOA reflectance
   * @param {number} params.slopeDeg - Terrain slope in degrees (0 to 60)
   * @param {number} params.aspectDeg - Terrain aspect azimuth (0 to 360, 0=North, 90=East)
   * @param {number} params.sunZenithDeg - Solar zenith angle
   * @param {number} params.sunAzimuthDeg - Solar azimuth angle
   * @param {number} [params.minnaertK] - Empirical limb darkening parameter (default 0.75 for crop foliage)
   * @returns {Object} Topographically normalized reflectance
   */
  static normalizeTopographicIllumination(params = {}) {
    const boa = Math.max(0.001, Math.min(1.0, Number(params.boaReflectance) || 0.25));
    const slopeRad = (Math.max(0, Math.min(60, Number(params.slopeDeg) || 0)) * Math.PI) / 180.0;
    const aspectRad = ((Number(params.aspectDeg) || 0) * Math.PI) / 180.0;
    const sunZenithRad = ((Number(params.sunZenithDeg) || 30) * Math.PI) / 180.0;
    const sunAzimuthRad = ((Number(params.sunAzimuthDeg) || 120) * Math.PI) / 180.0;
    const minnaertK = Math.max(0.2, Math.min(1.0, Number(params.minnaertK || 0.75)));

    // Cosine of incidence angle i on sloped terrain
    // cos(i) = cos(theta_s) * cos(slope) + sin(theta_s) * sin(slope) * cos(phi_s - aspect)
    const cosThetaS = Math.cos(sunZenithRad);
    const cosI = (cosThetaS * Math.cos(slopeRad)) + 
      (Math.sin(sunZenithRad) * Math.sin(slopeRad) * Math.cos(sunAzimuthRad - aspectRad));

    const safeCosI = Math.max(0.05, cosI);
    const illuminationRatio = cosThetaS / safeCosI;

    // Minnaert correction: rho_norm = rho_BOA * (cos(theta_s) / cos(i))^k
    const correctionFactor = Math.pow(illuminationRatio, minnaertK);
    const normalizedReflectance = Math.max(0.002, Math.min(0.98, parseFloat((boa * correctionFactor).toFixed(4))));

    return {
      success: true,
      originalBoaReflectance: boa,
      normalizedReflectance,
      solarIncidenceCosine: parseFloat(safeCosI.toFixed(4)),
      illuminationRatio: parseFloat(illuminationRatio.toFixed(3)),
      correctionFactorApplied: parseFloat(correctionFactor.toFixed(3)),
      isShadowedSlope: cosI < 0.10
    };
  }

  /**
   * Corrects a full set of multi-spectral bands from TOA to BOA for agricultural remote sensing
   * 
   * @param {Object} rawToaBands - Object mapping band keys to TOA reflectance (e.g. { B02: 0.12, B03: 0.14, B04: 0.16, B08: 0.65 })
   * @param {Object} environmentalContext - Sensor geometry, elevation, and aerosol parameters
   * @returns {Object} Cleaned BOA reflectances
   */
  static processMultiSpectralSceneTOAtoBOA(rawToaBands = {}, environmentalContext = {}) {
    const correctedBands = {};
    const metadata = {};

    Object.keys(rawToaBands).forEach((bandKey) => {
      const upper = bandKey.toUpperCase();
      if (SENTINEL2_MSI_BANDS[upper]) {
        const result = this.performBandAtmosphericCorrection({
          bandKey: upper,
          toaReflectance: rawToaBands[bandKey],
          sunZenithDeg: environmentalContext.sunZenithAngle,
          viewZenithDeg: environmentalContext.viewZenithAngle,
          elevationMeters: environmentalContext.elevationMeters,
          aerosolModelKey: environmentalContext.aerosolModelKey,
          customAod550: environmentalContext.customAod550
        });
        correctedBands[upper] = result.boaReflectance;
        metadata[upper] = result.correctionTerms;
      }
    });

    return {
      success: true,
      correctedBands,
      environmentalContext,
      atmosphericCorrectionEngine: 'Agrily 6S-MSI Fast Inversion v1.0',
      processedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  SatelliteAtmosphericCorrectionService,
  SENTINEL2_MSI_BANDS,
  AEROSOL_CLIMATOLOGY_MODELS
};
