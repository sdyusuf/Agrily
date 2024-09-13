/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - REGIONAL AGRO-ZONE SOIL PROFILE SERVICE
 * ==============================================================================
 * 
 * Architecture Overview:
 * Geostatistical baseline database of regional pedological soil characteristics
 * across Nigeria's 7 agro-ecological zones and 36 states + FCT. Sourced from
 * historical soil survey datasets of the Federal Department of Agricultural
 * Land Resources (FDALR) and IITA pedology mappings.
 * 
 * Provides fallback regional fertility baselines when farmers have not yet
 * dispatched physical soil specimens to accredited laboratories.
 * 
 * @module services/regionalAgroZoneSoilProfileService
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 */

'use strict';

const REGIONAL_SOIL_BASELINES = Object.freeze({
  SAHEL_SAVANNA: {
    zoneKey: 'SAHEL_SAVANNA',
    name: 'Sahel Savanna (Semi-Arid Desert Fringe)',
    states: ['Borno', 'Yobe', 'Jigawa'],
    dominantSoilOrder: 'Entisols / Aridisols (Regosols)',
    typicalTexture: { sandPct: 82, siltPct: 10, clayPct: 8, class: 'SAND' },
    averageChemistry: {
      phWater: 7.2,
      organicCarbonPct: 0.45,
      totalNitrogenPct: 0.05,
      availablePhosphorusBray1MgPerKg: 7.5,
      effectiveCec: 4.5,
      baseSaturationPct: 88.0,
      exchangeableCations: { calciumCa: 2.8, magnesiumMg: 0.9, potassiumK: 0.25, sodiumNa: 0.1 }
    },
    primaryFertilityLimitation: 'Acute low organic matter, extreme water percolation, low nitrogen retention.',
    keyAmendmentAdvice: 'Incorporate animal manure / organic biochar at 5 tons/ha; use split nitrogen applications.'
  },
  SUDAN_SAVANNA: {
    zoneKey: 'SUDAN_SAVANNA',
    name: 'Sudan Savanna (Dry Sub-Humid Plains)',
    states: ['Kano', 'Katsina', 'Sokoto', 'Zamfara', 'Kebbi', 'Bauchi'],
    dominantSoilOrder: 'Alfisols (Ferruginous Tropical Soils)',
    typicalTexture: { sandPct: 70, siltPct: 18, clayPct: 12, class: 'SANDY_LOAM' },
    averageChemistry: {
      phWater: 6.4,
      organicCarbonPct: 0.65,
      totalNitrogenPct: 0.07,
      availablePhosphorusBray1MgPerKg: 10.5,
      effectiveCec: 5.8,
      baseSaturationPct: 82.0,
      exchangeableCations: { calciumCa: 3.5, magnesiumMg: 1.1, potassiumK: 0.30, sodiumNa: 0.05 }
    },
    primaryFertilityLimitation: 'Phosphorus fixation in plinthite horizons and rapid topsoil crusting.',
    keyAmendmentAdvice: 'Apply basal phosphate (DAP / SSP) banded near seeds; break surface crusts with inter-row cultivation.'
  },
  NORTHERN_GUINEA_SAVANNA: {
    zoneKey: 'NORTHERN_GUINEA_SAVANNA',
    name: 'Northern Guinea Savanna (Cereal & Grain Belt)',
    states: ['Kaduna', 'Plateau', 'Nasarawa', 'Niger', 'Gombe', 'Adamawa', 'Taraba', 'FCT'],
    dominantSoilOrder: 'Alfisols / Inceptisols',
    typicalTexture: { sandPct: 58, siltPct: 24, clayPct: 18, class: 'SANDY_LOAM' },
    averageChemistry: {
      phWater: 6.1,
      organicCarbonPct: 1.15,
      totalNitrogenPct: 0.11,
      availablePhosphorusBray1MgPerKg: 14.0,
      effectiveCec: 7.8,
      baseSaturationPct: 78.0,
      exchangeableCations: { calciumCa: 4.5, magnesiumMg: 1.5, potassiumK: 0.38, sodiumNa: 0.04 }
    },
    primaryFertilityLimitation: 'Moderate subsoil acidity, sulfur deficiency in intensive maize/sorghum rotations.',
    keyAmendmentAdvice: 'Use sulfur-bearing fertilizers (NPK 20-10-10+S or SSP) and monitor soil pH on highland plateau soils.'
  },
  SOUTHERN_GUINEA_SAVANNA: {
    zoneKey: 'SOUTHERN_GUINEA_SAVANNA',
    name: 'Southern Guinea Savanna (Transition Food Belt)',
    states: ['Benue', 'Kogi', 'Kwara', 'Oyo'],
    dominantSoilOrder: 'Alfisols / Ultisols',
    typicalTexture: { sandPct: 52, siltPct: 26, clayPct: 22, class: 'SANDY_CLAY_LOAM' },
    averageChemistry: {
      phWater: 5.9,
      organicCarbonPct: 1.35,
      totalNitrogenPct: 0.12,
      availablePhosphorusBray1MgPerKg: 12.0,
      effectiveCec: 9.2,
      baseSaturationPct: 70.0,
      exchangeableCations: { calciumCa: 4.8, magnesiumMg: 1.6, potassiumK: 0.42, sodiumNa: 0.05 }
    },
    primaryFertilityLimitation: 'Potassium depletion in continuous yam/cassava root cropping systems.',
    keyAmendmentAdvice: 'High potassium top-dressing (MOP 0-0-60) required during tuber bulking stage.'
  },
  DERIVED_SAVANNA: {
    zoneKey: 'DERIVED_SAVANNA',
    name: 'Derived Savanna (Mosaic Agro-Forest)',
    states: ['Osun', 'Ekiti', 'Ondo', 'Enugu', 'Ebonyi'],
    dominantSoilOrder: 'Ultisols (Ferralitic Soils)',
    typicalTexture: { sandPct: 48, siltPct: 28, clayPct: 24, class: 'LOAM' },
    averageChemistry: {
      phWater: 5.6,
      organicCarbonPct: 1.55,
      totalNitrogenPct: 0.13,
      availablePhosphorusBray1MgPerKg: 15.0,
      effectiveCec: 10.5,
      baseSaturationPct: 62.0,
      exchangeableCations: { calciumCa: 5.0, magnesiumMg: 1.8, potassiumK: 0.45, sodiumNa: 0.06 }
    },
    primaryFertilityLimitation: 'Progressive soil acidification and low base saturation under high rainfall leaching.',
    keyAmendmentAdvice: 'Apply maintenance dolomitic lime at 500 kg/ha every 3 seasons; prevent soil erosion.'
  },
  HUMID_RAINFOREST: {
    zoneKey: 'HUMID_RAINFOREST',
    name: 'Humid Rainforest (Tree Crop Belt)',
    states: ['Ogun', 'Lagos', 'Edo', 'Delta', 'Anambra', 'Imo', 'Abia'],
    dominantSoilOrder: 'Ultisols / Oxisols (Ferralsols)',
    typicalTexture: { sandPct: 45, siltPct: 25, clayPct: 30, class: 'CLAY_LOAM' },
    averageChemistry: {
      phWater: 5.0,
      organicCarbonPct: 1.85,
      totalNitrogenPct: 0.16,
      availablePhosphorusBray1MgPerKg: 8.5,
      effectiveCec: 8.5,
      baseSaturationPct: 48.0, // Low base saturation, high Al saturation
      exchangeableCations: { calciumCa: 2.5, magnesiumMg: 1.0, potassiumK: 0.35, sodiumNa: 0.05 }
    },
    primaryFertilityLimitation: 'Severe acid leaching, phosphorus fixation by iron/aluminum oxides, calcium deficiency.',
    keyAmendmentAdvice: 'Mandatory liming with Dolomitic Limestone at 1.0 - 1.5 tons/ha; apply rock phosphate or bone meal.'
  },
  MANGROVE_SWAMP_COASTAL: {
    zoneKey: 'MANGROVE_SWAMP_COASTAL',
    name: 'Mangrove Swamp / Coastal Belts',
    states: ['Rivers', 'Bayelsa', 'Akwa Ibom', 'Cross River'],
    dominantSoilOrder: 'Entisols / Histosols (Acid Sulfate Soils)',
    typicalTexture: { sandPct: 25, siltPct: 45, clayPct: 30, class: 'SILTY_CLAY_LOAM' },
    averageChemistry: {
      phWater: 4.6,
      organicCarbonPct: 3.20,
      totalNitrogenPct: 0.22,
      availablePhosphorusBray1MgPerKg: 6.0,
      effectiveCec: 14.0,
      baseSaturationPct: 42.0,
      exchangeableCations: { calciumCa: 3.2, magnesiumMg: 1.8, potassiumK: 0.50, sodiumNa: 0.80 }
    },
    primaryFertilityLimitation: 'Extreme acid sulfate risk upon drainage, salinity intrusion, phosphorus lockup.',
    keyAmendmentAdvice: 'Controlled water table drainage to prevent pyrite oxidation; intensive leaching and liming for rice.'
  }
});

class RegionalAgroZoneSoilProfileService {
  /**
   * Retrieves regional soil baseline profile by zone key
   * 
   * @param {string} zoneKey - One of the 7 Nigerian agro-zones
   * @returns {Object}
   */
  static getProfileByZone(zoneKey = '') {
    const cleanKey = (zoneKey || 'NORTHERN_GUINEA_SAVANNA').toUpperCase().trim();
    return REGIONAL_SOIL_BASELINES[cleanKey] || REGIONAL_SOIL_BASELINES.NORTHERN_GUINEA_SAVANNA;
  }

  /**
   * Resolves agro-ecological zone and baseline soil chemistry from state name
   * 
   * @param {string} state - Nigerian state name
   * @returns {Object}
   */
  static getProfileByState(state = '') {
    const cleanState = (state || '').trim().toLowerCase();

    for (const [zoneKey, profile] of Object.entries(REGIONAL_SOIL_BASELINES)) {
      if (profile.states.some((s) => s.toLowerCase() === cleanState)) {
        return profile;
      }
    }

    // Default to Northern Guinea Savanna if unmatched
    return REGIONAL_SOIL_BASELINES.NORTHERN_GUINEA_SAVANNA;
  }

  /**
   * Lists all 7 agro-ecological soil zones
   * 
   * @returns {Array<Object>}
   */
  static listAllZones() {
    return Object.values(REGIONAL_SOIL_BASELINES);
  }
}

module.exports = {
  RegionalAgroZoneSoilProfileService,
  REGIONAL_SOIL_BASELINES
};
