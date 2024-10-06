/**
 * ==============================================================================
 * 🛰️ AGRILY REMOTE SENSING DOMAIN - SATELLITE DROUGHT STRESS INDEX SERVICE
 * ==============================================================================
 * 
 * Architecture Overview:
 * Computes multi-spectral and thermal remote sensing drought and crop moisture
 * stress indices integrating Sentinel-2 Bottom-Of-Atmosphere (BOA) surface
 * reflectance and Land Surface Temperature (LST).
 * 
 * Mathematical Formulation:
 * 1. Vegetation Condition Index (VCI) [Kogan 1990]:
 *    $$VCI = \frac{NDVI - NDVI_{min}}{NDVI_{max} - NDVI_{min}} \times 100\%$$
 *    where $NDVI_{min}$ and $NDVI_{max}$ represent the historical multi-year
 *    phenological envelope for the target Nigerian parcel.
 * 
 * 2. Temperature Condition Index (TCI) [Kogan 1995]:
 *    $$TCI = \frac{LST_{max} - LST}{LST_{max} - LST_{min}} \times 100\%$$
 *    Higher values indicate cooler canopy surfaces, signaling adequate root-zone moisture
 *    and unrestricted evaporative cooling.
 * 
 * 3. Vegetation Health Index (VHI) [Kogan 2001]:
 *    $$VHI = \alpha \cdot VCI + (1 - \alpha) \cdot TCI$$
 *    where $\alpha \approx 0.5$ balances the biological vigor response against the thermal
 *    evaporative stress response.
 * 
 * 4. Temperature Vegetation Dryness Index (TVDI) [Sandholt et al. 2002]:
 *    Based on the empirical LST-NDVI trapezoid/triangle feature space:
 *    $$LST_{dry} = a_{dry} + b_{dry} \cdot NDVI$$
 *    $$LST_{wet} = a_{wet} + b_{wet} \cdot NDVI$$
 *    $$TVDI = \frac{LST - LST_{wet}}{LST_{dry} - LST_{wet}} = \frac{LST - (a_{wet} + b_{wet} \cdot NDVI)}{(a_{dry} + b_{dry} \cdot NDVI) - (a_{wet} + b_{wet} \cdot NDVI)}$$
 *    - TVDI = 0: Saturated wet edge (maximum soil moisture and transpiration)
 *    - TVDI = 1: Severe dry edge (complete stomatal closure and moisture depletion)
 * 
 * 5. Crop Water Deficit Index (CWDI):
 *    $$CWDI = 1 - \frac{ET_a}{ET_c} \approx 1 - \frac{VHI}{100}$$
 * 
 * 6. Drought Severity Classification (Adapted for West African Agro-ecological Zones):
 *    - D0 (Abnormally Dry): VHI 36 - 45% (Moisture deficit emerging, mild yellowing)
 *    - D1 (Moderate Drought): VHI 26 - 35% (Canopy stomatal regulation, wilting at midday)
 *    - D2 (Severe Drought): VHI 16 - 25% (Extensive leaf senescence, irreversible yield loss)
 *    - D3 (Extreme Drought): VHI 6 - 15% (Complete crop failure risk, emergency irrigation required)
 *    - D4 (Exceptional Drought): VHI < 6% (Widespread parcel defoliation and total loss)
 * 
 * @module services/satelliteDroughtStressIndexService
 * @version 1.0.0
 * @author Agrily Remote Sensing Core Team
 * ==============================================================================
 */

'use strict';

/**
 * Standard USDM-Aligned West African Drought Severity Classification Tiers
 */
const DROUGHT_SEVERITY_TIERS = Object.freeze({
  NO_DROUGHT: {
    tierCode: 'D_NORMAL',
    name: 'Normal to Surplus Moisture',
    vhiMin: 46.0,
    vhiMax: 100.0,
    riskLevel: 'OPTIMAL',
    badgeColor: '#2d6a4f',
    description: 'Canopy transpiration unrestricted; root-zone moisture adequate for crop vegetative and reproductive stages.'
  },
  D0_ABNORMALLY_DRY: {
    tierCode: 'D0',
    name: 'Abnormally Dry',
    vhiMin: 36.0,
    vhiMax: 45.99,
    riskLevel: 'WATCH',
    badgeColor: '#e9c46a',
    description: 'Incipient soil moisture deficit; slow growth rate; elevated canopy midday temperature.'
  },
  D1_MODERATE_DROUGHT: {
    tierCode: 'D1',
    name: 'Moderate Drought',
    vhiMin: 26.0,
    vhiMax: 35.99,
    riskLevel: 'WARNING',
    badgeColor: '#f4a261',
    description: 'Stomatal closure observed; leaf curling in maize/sorghum; irrigation advisory triggered.'
  },
  D2_SEVERE_DROUGHT: {
    tierCode: 'D2',
    name: 'Severe Drought',
    vhiMin: 16.0,
    vhiMax: 25.99,
    riskLevel: 'CRITICAL',
    badgeColor: '#e76f51',
    description: 'Extensive lower leaf firing and senescence; projected yield penalty 25-50%; urgent water allocation required.'
  },
  D3_EXTREME_DROUGHT: {
    tierCode: 'D3',
    name: 'Extreme Drought',
    vhiMin: 6.0,
    vhiMax: 15.99,
    riskLevel: 'EMERGENCY',
    badgeColor: '#d62828',
    description: 'Severe physiological desiccation; widespread crop failure impending; parametric micro-insurance trigger activated.'
  },
  D4_EXCEPTIONAL_DROUGHT: {
    tierCode: 'D4',
    name: 'Exceptional Drought',
    vhiMin: 0.0,
    vhiMax: 5.99,
    riskLevel: 'CATASTROPHIC',
    badgeColor: '#780000',
    description: 'Total canopy death; zero harvestable yield; regional disaster zone declarations warranted.'
  }
});

/**
 * Agro-ecological Zone LST-NDVI Triangle Feature Space Parameters
 * Defines empirical Dry-Edge and Wet-Edge linear boundaries across Nigeria
 */
const AGRO_ZONE_LST_FEATURE_SPACE = Object.freeze({
  SAHEL: {
    zoneName: 'Sahel Savanna (Borno, Yobe, Sokoto, Katsina)',
    dryEdgeInterceptAdry: 52.0,
    dryEdgeSlopeBdry: -18.5,
    wetEdgeInterceptAwet: 28.0,
    wetEdgeSlopeBwet: 2.5,
    baselineNdviMin: 0.08,
    baselineNdviMax: 0.55,
    baselineLstMinC: 25.0,
    baselineLstMaxC: 55.0
  },
  SUDAN_SAVANNA: {
    zoneName: 'Sudan Savanna (Kano, Jigawa, Bauchi, Zamfara, Kebbi)',
    dryEdgeInterceptAdry: 48.0,
    dryEdgeSlopeBdry: -16.0,
    wetEdgeInterceptAwet: 26.0,
    wetEdgeSlopeBwet: 2.0,
    baselineNdviMin: 0.12,
    baselineNdviMax: 0.68,
    baselineLstMinC: 24.0,
    baselineLstMaxC: 50.0
  },
  GUINEA_SAVANNA: {
    zoneName: 'Guinea Savanna / Middle Belt (Kaduna, Niger, Benue, Plateau, FCT)',
    dryEdgeInterceptAdry: 44.0,
    dryEdgeSlopeBdry: -14.5,
    wetEdgeInterceptAwet: 24.0,
    wetEdgeSlopeBwet: 1.5,
    baselineNdviMin: 0.18,
    baselineNdviMax: 0.82,
    baselineLstMinC: 22.0,
    baselineLstMaxC: 45.0
  },
  RAINFOREST: {
    zoneName: 'Tropical Rainforest / Southern Belt (Oyo, Ogun, Ondo, Edo, Imo, Abia, Enugu)',
    dryEdgeInterceptAdry: 38.0,
    dryEdgeSlopeBdry: -11.0,
    wetEdgeInterceptAwet: 22.0,
    wetEdgeSlopeBwet: 1.0,
    baselineNdviMin: 0.25,
    baselineNdviMax: 0.89,
    baselineLstMinC: 20.0,
    baselineLstMaxC: 39.0
  },
  MANGROVE_SWAMP: {
    zoneName: 'Mangrove / Coastal Belt (Lagos, Rivers, Delta, Bayelsa, Akwa Ibom)',
    dryEdgeInterceptAdry: 35.0,
    dryEdgeSlopeBdry: -8.5,
    wetEdgeInterceptAwet: 22.0,
    wetEdgeSlopeBwet: 0.5,
    baselineNdviMin: 0.30,
    baselineNdviMax: 0.92,
    baselineLstMinC: 21.0,
    baselineLstMaxC: 36.0
  }
});

class SatelliteDroughtStressIndexService {
  /**
   * Computes the Vegetation Condition Index (VCI)
   * 
   * @param {number} currentNdvi - Current observed BOA NDVI value
   * @param {number} minNdvi - Historical minimum NDVI for the parcel/phenological window
   * @param {number} maxNdvi - Historical maximum NDVI for the parcel/phenological window
   * @returns {number} VCI percentage [0.0 - 100.0]
   */
  calculateVci(currentNdvi, minNdvi, maxNdvi) {
    if (typeof currentNdvi !== 'number' || typeof minNdvi !== 'number' || typeof maxNdvi !== 'number') {
      throw new Error('All NDVI inputs to calculateVci must be numeric.');
    }
    if (maxNdvi <= minNdvi) {
      return 50.0;
    }
    const clampedNdvi = Math.max(minNdvi, Math.min(maxNdvi, currentNdvi));
    const vci = ((clampedNdvi - minNdvi) / (maxNdvi - minNdvi)) * 100.0;
    return Number(Math.max(0.0, Math.min(100.0, vci)).toFixed(2));
  }

  /**
   * Computes the Temperature Condition Index (TCI)
   * 
   * @param {number} currentLstCelsius - Current Land Surface Temperature (°C)
   * @param {number} minLstCelsius - Historical minimum LST (°C)
   * @param {number} maxLstCelsius - Historical maximum LST (°C)
   * @returns {number} TCI percentage [0.0 - 100.0]
   */
  calculateTci(currentLstCelsius, minLstCelsius, maxLstCelsius) {
    if (typeof currentLstCelsius !== 'number' || typeof minLstCelsius !== 'number' || typeof maxLstCelsius !== 'number') {
      throw new Error('All LST inputs to calculateTci must be numeric.');
    }
    if (maxLstCelsius <= minLstCelsius) {
      return 50.0;
    }
    const clampedLst = Math.max(minLstCelsius, Math.min(maxLstCelsius, currentLstCelsius));
    // Higher LST indicates severe thermal stress, leading to lower TCI
    const tci = ((maxLstCelsius - clampedLst) / (maxLstCelsius - minLstCelsius)) * 100.0;
    return Number(Math.max(0.0, Math.min(100.0, tci)).toFixed(2));
  }

  /**
   * Computes the composite Vegetation Health Index (VHI)
   * 
   * @param {number} vci - Vegetation Condition Index [0-100]
   * @param {number} tci - Temperature Condition Index [0-100]
   * @param {number} [alpha=0.5] - Weighting parameter (0.0 to 1.0)
   * @returns {number} Composite VHI percentage [0.0 - 100.0]
   */
  calculateVhi(vci, tci, alpha = 0.5) {
    if (typeof vci !== 'number' || typeof tci !== 'number') {
      throw new Error('Numeric VCI and TCI values are required.');
    }
    const safeAlpha = Math.max(0.0, Math.min(1.0, alpha));
    const vhi = (safeAlpha * vci) + ((1.0 - safeAlpha) * tci);
    return Number(Math.max(0.0, Math.min(100.0, vhi)).toFixed(2));
  }

  /**
   * Computes the Temperature Vegetation Dryness Index (TVDI) using the LST-NDVI
   * trapezoid scatter feature space.
   * 
   * @param {number} currentNdvi - Observed NDVI value
   * @param {number} currentLstCelsius - Observed Land Surface Temperature (°C)
   * @param {string} [zoneKey='GUINEA_SAVANNA'] - Agro-ecological zone key
   * @returns {Object} TVDI value [0.0 - 1.0] and edge boundaries
   */
  calculateTvdi(currentNdvi, currentLstCelsius, zoneKey = 'GUINEA_SAVANNA') {
    const config = AGRO_ZONE_LST_FEATURE_SPACE[zoneKey] || AGRO_ZONE_LST_FEATURE_SPACE.GUINEA_SAVANNA;

    const clampedNdvi = Math.max(0.0, Math.min(1.0, currentNdvi));

    // Dry edge: LST_dry = a_dry + b_dry * NDVI
    const lstDry = config.dryEdgeInterceptAdry + (config.dryEdgeSlopeBdry * clampedNdvi);

    // Wet edge: LST_wet = a_wet + b_wet * NDVI
    const lstWet = config.wetEdgeInterceptAwet + (config.wetEdgeSlopeBwet * clampedNdvi);

    const denom = lstDry - lstWet;
    let tvdi = 0.5;

    if (denom > 0) {
      tvdi = (currentLstCelsius - lstWet) / denom;
    }

    const clampedTvdi = Number(Math.max(0.0, Math.min(1.0, tvdi)).toFixed(3));

    return {
      tvdi: clampedTvdi,
      zoneApplied: config.zoneName,
      lstObservedCelsius: currentLstCelsius,
      ndviObserved: clampedNdvi,
      lstDryBoundaryCelsius: Number(lstDry.toFixed(2)),
      lstWetBoundaryCelsius: Number(lstWet.toFixed(2)),
      moistureDeficitPct: Number((clampedTvdi * 100).toFixed(1))
    };
  }

  /**
   * Maps a computed Vegetation Health Index (VHI) to its formal USDM-equivalent
   * drought severity tier and generates actionable agronomic prescriptions.
   * 
   * @param {number} vhi - Vegetation Health Index [0-100]
   * @param {string} [cropType='MAIZE'] - Crop type for tailored guidance
   * @returns {Object} Complete drought classification and advisory payload
   */
  classifyDroughtSeverity(vhi, cropType = 'MAIZE') {
    const clampedVhi = Math.max(0.0, Math.min(100.0, vhi));
    let matchedTier = DROUGHT_SEVERITY_TIERS.NO_DROUGHT;

    if (clampedVhi < 6.0) {
      matchedTier = DROUGHT_SEVERITY_TIERS.D4_EXCEPTIONAL_DROUGHT;
    } else if (clampedVhi < 16.0) {
      matchedTier = DROUGHT_SEVERITY_TIERS.D3_EXTREME_DROUGHT;
    } else if (clampedVhi < 26.0) {
      matchedTier = DROUGHT_SEVERITY_TIERS.D2_SEVERE_DROUGHT;
    } else if (clampedVhi < 36.0) {
      matchedTier = DROUGHT_SEVERITY_TIERS.D1_MODERATE_DROUGHT;
    } else if (clampedVhi < 46.0) {
      matchedTier = DROUGHT_SEVERITY_TIERS.D0_ABNORMALLY_DRY;
    }

    // Generate crop-specific drought mitigation advisory
    const advisory = this.generateAgronomicDroughtAdvisory(matchedTier.tierCode, cropType);

    return {
      vhi: clampedVhi,
      droughtTier: matchedTier.tierCode,
      tierName: matchedTier.name,
      riskLevel: matchedTier.riskLevel,
      badgeColor: matchedTier.badgeColor,
      description: matchedTier.description,
      advisory
    };
  }

  /**
   * Generates actionable farmer-centric agronomic prescriptions based on drought tier
   * 
   * @param {string} tierCode - USDM Drought Tier Code ('D0', 'D1', 'D2', 'D3', 'D4', 'D_NORMAL')
   * @param {string} cropType - Crop name
   * @returns {Object} Actionable irrigation, mulching, and fertility recommendations
   */
  generateAgronomicDroughtAdvisory(tierCode, cropType) {
    const cropUpper = (cropType || 'MAIZE').toUpperCase();

    switch (tierCode) {
      case 'D0':
        return {
          urgency: 'MONITOR_CLOSELY',
          irrigationPrescription: 'Apply supplemental maintenance irrigation of 15-20 mm every 4-5 days during early morning hours to curtail midday evaporative loss.',
          soilMoistureConservation: 'Introduce light organic mulching (straw or millet residue) around root zones to maintain topsoil moisture retention.',
          fertilizerModifications: 'Suspend high-dose synthetic granular nitrogen top-dressing until moisture status normalizes to avoid fertilizer burn.',
          yieldImpactRisk: 'Low (< 5% potential yield drag if rectified within 7 days).'
        };
      case 'D1':
        return {
          urgency: 'ACTION_RECOMMENDED',
          irrigationPrescription: 'Elevate irrigation scheduling to 25-30 mm every 3 days. Prioritize critical reproductive phenology stages (tasseling/silking in maize, panicle initiation in rice).',
          soilMoistureConservation: 'Apply heavy mulch cover (5-7 cm depth) across parcel ridges. Implement contour bunding to harvest any erratic convective rainfall.',
          fertilizerModifications: 'Apply foliar potassium nitrate (KNO3 @ 1.5%) spray to enhance plant stomatal regulation and osmotic adjustment under water deficit.',
          yieldImpactRisk: 'Moderate (10-20% yield reduction without prompt supplemental irrigation).'
        };
      case 'D2':
        return {
          urgency: 'URGENT_INTERVENTION',
          irrigationPrescription: 'Implement deficit irrigation strategy: concentrate all available water supplies onto prime productive parcels, maintaining minimum 35 mm weekly application.',
          soilMoistureConservation: 'Inter-row tillage to break capillary crust and curtail subsoil water wick evaporation.',
          fertilizerModifications: 'Completely halt dry-soil fertilization. Apply foliar biostimulants containing amino acids or glycine betaine to stabilize photosynthetic complexes.',
          yieldImpactRisk: 'High (25-45% yield penalty; potential early vegetative harvest for silage or fodder).'
        };
      case 'D3':
      case 'D4':
        return {
          urgency: 'EMERGENCY_RESCUE',
          irrigationPrescription: 'Emergency water trucking or deep solar borehole pumping required immediately. Focus exclusively on salvageable crop blocks.',
          soilMoistureConservation: 'Strip lower desiccated canopy leaves to reduce total transpiration surface area.',
          fertilizerModifications: 'No fertilizer application. Prepare insurance claim documentation.',
          yieldImpactRisk: 'Catastrophic (50-100% loss). File immediate parametric drought insurance claim with local extension agent.'
        };
      default:
        return {
          urgency: 'NORMAL_OPERATIONS',
          irrigationPrescription: 'Maintain standard seasonal irrigation schedule according to evapotranspiration demand (ETc).',
          soilMoistureConservation: 'Standard weeding and routine field maintenance.',
          fertilizerModifications: 'Proceed with scheduled split fertilizer applications (e.g., Urea 46-0-0 top dressing).',
          yieldImpactRisk: 'None. Optimal canopy vigor and moisture equilibrium.'
        };
    }
  }

  /**
   * Executes a complete satellite drought diagnostic assessment for a parcel
   * 
   * @param {Object} params - Ingest parameters
   * @param {number} params.ndvi - Observed NDVI
   * @param {number} params.lstCelsius - Observed Land Surface Temperature (°C)
   * @param {string} [params.zoneKey='GUINEA_SAVANNA'] - Agro-ecological zone
   * @param {string} [params.cropType='MAIZE'] - Crop name
   * @param {Object} [params.historicalEnvelope] - Optional parcel min/max historical values
   * @returns {Object} Comprehensive drought and moisture assessment report
   */
  evaluateParcelDroughtStress({
    ndvi,
    lstCelsius,
    zoneKey = 'GUINEA_SAVANNA',
    cropType = 'MAIZE',
    historicalEnvelope
  }) {
    if (typeof ndvi !== 'number' || typeof lstCelsius !== 'number') {
      throw new Error('Both ndvi and lstCelsius numeric parameters are required.');
    }

    const zoneConfig = AGRO_ZONE_LST_FEATURE_SPACE[zoneKey] || AGRO_ZONE_LST_FEATURE_SPACE.GUINEA_SAVANNA;

    const minNdvi = historicalEnvelope?.minNdvi ?? zoneConfig.baselineNdviMin;
    const maxNdvi = historicalEnvelope?.maxNdvi ?? zoneConfig.baselineNdviMax;
    const minLst = historicalEnvelope?.minLst ?? zoneConfig.baselineLstMinC;
    const maxLst = historicalEnvelope?.maxLst ?? zoneConfig.baselineLstMaxC;

    const vci = this.calculateVci(ndvi, minNdvi, maxNdvi);
    const tci = this.calculateTci(lstCelsius, minLst, maxLst);
    const vhi = this.calculateVhi(vci, tci, 0.5);
    const tvdiData = this.calculateTvdi(ndvi, lstCelsius, zoneKey);
    const classification = this.classifyDroughtSeverity(vhi, cropType);

    // Crop Water Deficit Index (CWDI) proxy: 1.0 - (VHI / 100)
    const cwdi = Number(Math.max(0.0, Math.min(1.0, 1.0 - (vhi / 100.0))).toFixed(3));

    return {
      timestamp: new Date().toISOString(),
      cropType,
      agroEcologicalZone: zoneConfig.zoneName,
      inputs: {
        observedNdvi: ndvi,
        observedLstCelsius: lstCelsius,
        referenceEnvelope: { minNdvi, maxNdvi, minLst, maxLst }
      },
      indices: {
        vci,
        tci,
        vhi,
        tvdi: tvdiData.tvdi,
        cwdi,
        moistureDeficitPct: tvdiData.moistureDeficitPct
      },
      droughtClassification: classification
    };
  }
}

const satelliteDroughtStressIndexService = new SatelliteDroughtStressIndexService();

module.exports = {
  SatelliteDroughtStressIndexService,
  satelliteDroughtStressIndexService,
  DROUGHT_SEVERITY_TIERS,
  AGRO_ZONE_LST_FEATURE_SPACE
};
