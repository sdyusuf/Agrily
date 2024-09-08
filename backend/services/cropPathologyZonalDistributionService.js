/**
 * @file cropPathologyZonalDistributionService.js
 * @description Nigerian Agro-Ecological Zonal Pathology Distribution & Proliferation Service.
 * Maps seasonal climatological variables (Harmattan dry winds, Monsoon rains, Savanna humidity)
 * to fungal, bacterial, and viral disease contagion rates across the 7 Nigerian agro-zones.
 */

const crypto = require('crypto');
const { AGRO_ECOLOGICAL_ZONES, SUPPORTED_CROPS } = require('../models/CropPathologyRecord');

/**
 * 7 Nigerian Agro-Ecological Zones Baseline Characteristics
 */
const AGRO_ZONE_CLIMATOLOGY = {
  SAHEL_SAVANNA: {
    name: 'Sahel Savanna (Far North Belt)',
    states: ['BORNO', 'YOBE', 'SOKOTO', 'JIGAWA'],
    meanAnnualRainfallMm: 450,
    averageRelativeHumidityPct: 35.0,
    dominantCommodities: ['SORGHUM', 'COWPEA', 'OIL_PALM'],
    primaryPathogenVectors: ['APHIDS', 'SMUT_SPORES'],
    seasonalRiskMultipliers: {
      HARMATTAN_DRY: 0.40,
      WET_MONSOON: 1.10,
      DRY_IRRIGATION: 0.75
    }
  },
  SUDAN_SAVANNA: {
    name: 'Sudan Savanna (Grain & Solanaceous Belt)',
    states: ['KANO', 'KATSINA', 'ZAMFARA', 'KEBBI'],
    meanAnnualRainfallMm: 750,
    averageRelativeHumidityPct: 52.0,
    dominantCommodities: ['TOMATO', 'MAIZE', 'RICE', 'PEPPER'],
    primaryPathogenVectors: ['ALTERNARIA_FUNGAL', 'WHITEFLY_VIRAL'],
    seasonalRiskMultipliers: {
      HARMATTAN_DRY: 0.50,
      WET_MONSOON: 1.35,
      DRY_IRRIGATION: 0.90
    }
  },
  NORTHERN_GUINEA_SAVANNA: {
    name: 'Northern Guinea Savanna',
    states: ['KADUNA', 'BAUCHI', 'NIGER'],
    meanAnnualRainfallMm: 1050,
    averageRelativeHumidityPct: 60.0,
    dominantCommodities: ['MAIZE', 'YAM', 'COWPEA', 'RICE'],
    primaryPathogenVectors: ['FALL_ARMYWORM', 'RUST_PUSTULES'],
    seasonalRiskMultipliers: {
      HARMATTAN_DRY: 0.60,
      WET_MONSOON: 1.40,
      DRY_IRRIGATION: 0.85
    }
  },
  SOUTHERN_GUINEA_SAVANNA: {
    name: 'Southern Guinea Savanna (Middle Belt Tuber Heartland)',
    states: ['BENUE', 'PLATEAU', 'NASARAWA', 'KOGI', 'KWARA', 'FCT'],
    meanAnnualRainfallMm: 1350,
    averageRelativeHumidityPct: 68.0,
    dominantCommodities: ['YAM', 'TOMATO', 'CASSAVA', 'RICE'],
    primaryPathogenVectors: ['PHYTOPHTHORA_BLIGHT', 'ANTHRACNOSE'],
    seasonalRiskMultipliers: {
      HARMATTAN_DRY: 0.65,
      WET_MONSOON: 1.65,
      DRY_IRRIGATION: 0.95
    }
  },
  DERIVED_SAVANNA: {
    name: 'Derived Savanna Transition Belt',
    states: ['OYO', 'OSUN', 'EKITI', 'ENUGU'],
    meanAnnualRainfallMm: 1550,
    averageRelativeHumidityPct: 74.0,
    dominantCommodities: ['CASSAVA', 'MAIZE', 'PEPPER', 'YAM'],
    primaryPathogenVectors: ['CASSAVA_MOSAIC_VIRUS', 'BACTERIAL_BLIGHT'],
    seasonalRiskMultipliers: {
      HARMATTAN_DRY: 0.70,
      WET_MONSOON: 1.50,
      DRY_IRRIGATION: 0.90
    }
  },
  HUMID_FOREST_BELT: {
    name: 'Humid Rainforest Belt (Cash Tree Crop Zone)',
    states: ['ONDO', 'EDO', 'DELTA', 'OGUN', 'ABIA', 'IMO', 'ANAMBRA'],
    meanAnnualRainfallMm: 2100,
    averageRelativeHumidityPct: 84.0,
    dominantCommodities: ['COCOA', 'OIL_PALM', 'CASSAVA'],
    primaryPathogenVectors: ['PHYTOPHTHORA_BLACK_POD', 'VASCULAR_WILT'],
    seasonalRiskMultipliers: {
      HARMATTAN_DRY: 0.80,
      WET_MONSOON: 1.85,
      DRY_IRRIGATION: 1.10
    }
  },
  MANGROVE_SWAMP: {
    name: 'Mangrove Coastal & Delta Swamp Belt',
    states: ['BAYELSA', 'RIVERS', 'AKWA IBOM', 'CROSS RIVER', 'LAGOS'],
    meanAnnualRainfallMm: 3200,
    averageRelativeHumidityPct: 92.0,
    dominantCommodities: ['OIL_PALM', 'RICE', 'CASSAVA'],
    primaryPathogenVectors: ['ALGAL_LEAF_SPOT', 'CURVULARIA_FOLIAR'],
    seasonalRiskMultipliers: {
      HARMATTAN_DRY: 0.85,
      WET_MONSOON: 1.95,
      DRY_IRRIGATION: 1.15
    }
  }
};

class CropPathologyZonalDistributionService {
  /**
   * Retrieves full zonal climatology database
   */
  static getZonalClimatology() {
    return AGRO_ZONE_CLIMATOLOGY;
  }

  /**
   * Evaluates pathogen proliferation velocity ($R_0$ index) for a crop in an agro-zone
   *
   * @param {Object} query
   * @param {string} query.agroZone - One of the 7 zones
   * @param {string} query.cropType - One of 10 supported crops
   * @param {string} [query.season] - 'WET_MONSOON', 'HARMATTAN_DRY', 'DRY_IRRIGATION'
   * @param {number} [query.relativeHumidityPct] - Optional sensor telemetry override
   * @returns {Object} Proliferation assessment
   */
  static evaluateZonalPathologyRisk(query = {}) {
    const rawZone = (query.agroZone || 'SUDAN_SAVANNA').toUpperCase().trim();
    const zoneData = AGRO_ZONE_CLIMATOLOGY[rawZone] || AGRO_ZONE_CLIMATOLOGY['SUDAN_SAVANNA'];

    const rawCrop = (query.cropType || 'TOMATO').toUpperCase().trim();
    const season = (query.season || 'WET_MONSOON').toUpperCase().trim();
    const seasonMultiplier = zoneData.seasonalRiskMultipliers[season] || 1.0;

    const humidity = query.relativeHumidityPct !== undefined ? Number(query.relativeHumidityPct) : zoneData.averageRelativeHumidityPct;

    // Basic reproductive ratio (R0) of fungal/bacterial spores modeled on humidity & season
    // R0 > 1.0 implies exponential spread; R0 < 1.0 implies self-attenuating cluster
    const baselineR0 = 1.15;
    const humidityFactor = humidity / 60.0;
    const calculatedR0 = Number((baselineR0 * humidityFactor * seasonMultiplier).toFixed(2));

    let riskPill = 'MODERATE_FOLIAR_RISK';
    let alertDescription = 'Standard preventative scouting advised.';

    if (calculatedR0 >= 2.0) {
      riskPill = 'CRITICAL_OUTBREAK_SURGE_IMMINENT';
      alertDescription = 'High relative humidity combined with monsoon precipitation creates hyper-favorable spore dissemination conditions. Immediate protective fungicide/bactericide cover mandatory.';
    } else if (calculatedR0 >= 1.4) {
      riskPill = 'HIGH_CONTAGION_ELEVATION';
      alertDescription = 'Foliar moisture duration exceeds 6 hours per day. High probability of secondary foliar lesion eruption.';
    } else if (calculatedR0 < 0.8) {
      riskPill = 'LOW_DRY_ATTENUATION';
      alertDescription = 'Dry atmospheric conditions and low foliar wetness naturally suppress fungal spore germination.';
    }

    const verificationSeal = crypto.createHash('sha256')
      .update(`${rawZone}|${rawCrop}|${season}|${calculatedR0}`)
      .digest('hex');

    return {
      success: true,
      agroZone: rawZone,
      zoneName: zoneData.name,
      statesInZone: zoneData.states,
      evaluatedCommodity: rawCrop,
      climateSeason: season,
      telemetryContext: {
        relativeHumidityPct: humidity,
        annualRainfallMm: zoneData.meanAnnualRainfallMm,
        seasonalMultiplier: seasonMultiplier
      },
      epidemiologyModel: {
        calculatedR0ProliferationIndex: calculatedR0,
        riskClassification: riskPill,
        alertAdvisory: alertDescription,
        primaryVectorsMonitored: zoneData.primaryPathogenVectors
      },
      cryptographicZonalSeal: verificationSeal
    };
  }
}

module.exports = {
  CropPathologyZonalDistributionService,
  AGRO_ZONE_CLIMATOLOGY
};
