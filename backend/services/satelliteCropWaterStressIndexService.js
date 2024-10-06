/**
 * ==============================================================================
 * 🛰️ AGRILY REMOTE SENSING DOMAIN - SATELLITE CROP WATER STRESS INDEX (CWSI)
 * ==============================================================================
 * 
 * Architecture Overview:
 * Implements the empirical and energy-balance Crop Water Stress Index (CWSI)
 * model (Jackson et al. 1981, Idso et al. 1981) integrating satellite-derived
 * Land Surface Temperature (LST), canopy thermal radiometry, and microclimatic
 * ambient atmospheric vapor pressure deficit (VPD).
 * 
 * Mathematical Formulation:
 * 1. Vapor Pressure Deficit ($VPD$, kPa):
 *    Saturation vapor pressure over liquid water (Tetens / Murray formulation):
 *    $$e_s(T_a) = 0.61078 \cdot \exp\left( \frac{17.27 \cdot T_a}{T_a + 237.3} \right)$$
 *    Actual vapor pressure:
 *    $$e_a = e_s(T_a) \cdot \frac{RH}{100}$$
 *    Vapor pressure deficit:
 *    $$VPD = e_s(T_a) - e_a = e_s(T_a) \cdot \left( 1 - \frac{RH}{100} \right)$$
 * 
 * 2. Non-Water-Stressed Baseline (NWSB) - Lower Canopy Boundary:
 *    Under unrestricted transpirational cooling, canopy temperature depressional
 *    difference $(T_c - T_a)_{lower}$ is a linear function of atmospheric VPD:
 *    $$(T_c - T_a)_{lower} = a_{nwsb} - b_{nwsb} \cdot VPD$$
 * 
 * 3. Non-Transpiring Upper Baseline - Severe Desiccation Boundary:
 *    When stomata are completely closed due to severe root-zone depletion:
 *    $$(T_c - T_a)_{upper} = a_{upper}$$
 * 
 * 4. Crop Water Stress Index ($CWSI$):
 *    $$CWSI = \frac{(T_c - T_a) - (T_c - T_a)_{lower}}{(T_c - T_a)_{upper} - (T_c - T_a)_{lower}}$$
 *    - $CWSI \in [0.0, 1.0]$:
 *      - $CWSI \le 0.20$: No water stress (vigorous transpiration).
 *      - $0.20 < CWSI \le 0.40$: Incipient mild water stress.
 *      - $0.40 < CWSI \le 0.60$: Moderate stress (stomatal conductance halved; yield penalty begins).
 *      - $0.60 < CWSI \le 0.80$: Severe moisture deficit (urgent irrigation dispatch required).
 *      - $CWSI > 0.80$: Extreme plant wilting and irreversible cell membrane damage.
 * 
 * @module services/satelliteCropWaterStressIndexService
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 * ==============================================================================
 */

'use strict';

/**
 * Empirical Non-Water-Stressed Baseline (NWSB) Coefficients for 10 Nigerian Crops
 * Parameters derived from semi-arid and tropical sub-humid micrometeorological trials.
 */
const CROP_CWSI_BASELINES = Object.freeze({
  MAIZE: {
    cropName: 'Zea mays (Maize)',
    nwsbInterceptA: 1.85,
    nwsbSlopeB: 1.95,
    upperBaselineDeltaT: 4.80,
    stressThresholdTrigger: 0.42,
    criticalPhenologyStages: ['TASSELING', 'SILKING', 'GRAIN_FILL']
  },
  RICE: {
    cropName: 'Oryza sativa (Paddy / Upland Rice)',
    nwsbInterceptA: 1.20,
    nwsbSlopeB: 2.30,
    upperBaselineDeltaT: 3.50,
    stressThresholdTrigger: 0.35,
    criticalPhenologyStages: ['PANICLE_INITIATION', 'FLOWERING', 'MILK_STAGE']
  },
  CASSAVA: {
    cropName: 'Manihot esculenta (Cassava)',
    nwsbInterceptA: 2.40,
    nwsbSlopeB: 1.60,
    upperBaselineDeltaT: 6.20,
    stressThresholdTrigger: 0.55,
    criticalPhenologyStages: ['ROOT_INITIATION', 'TUBER_BULKING']
  },
  YAM: {
    cropName: 'Dioscorea rotundata (Yam)',
    nwsbInterceptA: 2.10,
    nwsbSlopeB: 1.75,
    upperBaselineDeltaT: 5.40,
    stressThresholdTrigger: 0.48,
    criticalPhenologyStages: ['VINE_DEVELOPMENT', 'TUBER_EXPANSION']
  },
  SORGHUM: {
    cropName: 'Sorghum bicolor (Guinea Sorghum)',
    nwsbInterceptA: 2.65,
    nwsbSlopeB: 1.50,
    upperBaselineDeltaT: 6.80,
    stressThresholdTrigger: 0.58,
    criticalPhenologyStages: ['BOOT_STAGE', 'ANTHESIS']
  },
  MILLET: {
    cropName: 'Pennisetum glaucum (Pearl Millet)',
    nwsbInterceptA: 2.90,
    nwsbSlopeB: 1.40,
    upperBaselineDeltaT: 7.20,
    stressThresholdTrigger: 0.62,
    criticalPhenologyStages: ['HEADING', 'FLOWERING']
  },
  COWPEA: {
    cropName: 'Vigna unguiculata (Cowpea / Beans)',
    nwsbInterceptA: 2.15,
    nwsbSlopeB: 1.80,
    upperBaselineDeltaT: 5.10,
    stressThresholdTrigger: 0.45,
    criticalPhenologyStages: ['POD_FLOWERING', 'POD_FILL']
  },
  SOYBEAN: {
    cropName: 'Glycine max (Soybean)',
    nwsbInterceptA: 1.95,
    nwsbSlopeB: 2.05,
    upperBaselineDeltaT: 4.60,
    stressThresholdTrigger: 0.40,
    criticalPhenologyStages: ['R1_BEGIN_BLOOM', 'R3_BEGIN_POD', 'R5_BEGIN_SEED']
  },
  GROUNDNUT: {
    cropName: 'Arachis hypogaea (Groundnut / Peanut)',
    nwsbInterceptA: 2.25,
    nwsbSlopeB: 1.70,
    upperBaselineDeltaT: 5.60,
    stressThresholdTrigger: 0.48,
    criticalPhenologyStages: ['PEGGING', 'POD_DEVELOPMENT']
  },
  OIL_PALM: {
    cropName: 'Elaeis guineensis (African Oil Palm)',
    nwsbInterceptA: 1.60,
    nwsbSlopeB: 1.85,
    upperBaselineDeltaT: 4.20,
    stressThresholdTrigger: 0.38,
    criticalPhenologyStages: ['FRUIT_BUNCH_DEVELOPMENT', 'INFLORESCENCE']
  }
});

class SatelliteCropWaterStressIndexService {
  /**
   * Calculates atmospheric saturation vapor pressure e_s(T_a) in kPa
   * 
   * @param {number} airTempCelsius - Ambient air temperature in degrees Celsius
   * @returns {number} Saturation vapor pressure in kPa
   */
  calculateSaturationVaporPressure(airTempCelsius) {
    if (typeof airTempCelsius !== 'number') {
      throw new Error('Numeric air temperature is required.');
    }
    // Tetens formula: e_s = 0.61078 * exp(17.27 * T / (T + 237.3))
    const es = 0.61078 * Math.exp((17.27 * airTempCelsius) / (airTempCelsius + 237.3));
    return Number(es.toFixed(4));
  }

  /**
   * Calculates atmospheric Vapor Pressure Deficit (VPD) in kPa
   * 
   * @param {number} airTempCelsius - Ambient air temperature (°C)
   * @param {number} relativeHumidityPct - Relative humidity [0 - 100%]
   * @returns {number} Vapor pressure deficit in kPa
   */
  calculateVaporPressureDeficit(airTempCelsius, relativeHumidityPct) {
    const es = this.calculateSaturationVaporPressure(airTempCelsius);
    const rh = Math.max(0.0, Math.min(100.0, Number(relativeHumidityPct) || 50.0));
    const ea = es * (rh / 100.0);
    const vpd = Math.max(0.0, es - ea);
    return Number(vpd.toFixed(3));
  }

  /**
   * Computes the Non-Water-Stressed Baseline (lower thermal limit) (T_c - T_a)_lower
   * 
   * @param {string} cropKey - Crop identifier
   * @param {number} vpdKpa - Vapor pressure deficit in kPa
   * @returns {number} Lower delta T in °C
   */
  calculateLowerBaselineDeltaT(cropKey, vpdKpa) {
    const normalizedKey = (cropKey || 'MAIZE').toUpperCase();
    const baseline = CROP_CWSI_BASELINES[normalizedKey] || CROP_CWSI_BASELINES.MAIZE;
    const lowerDelta = baseline.nwsbInterceptA - (baseline.nwsbSlopeB * vpdKpa);
    return Number(lowerDelta.toFixed(2));
  }

  /**
   * Computes the Crop Water Stress Index (CWSI)
   * 
   * @param {Object} params - Biophysical and micrometeorological parameters
   * @param {number} params.canopyTempCelsius - Satellite or thermal sensor canopy temp (T_c, °C)
   * @param {number} params.airTempCelsius - Ambient weather station air temp (T_a, °C)
   * @param {number} params.relativeHumidityPct - Relative humidity (%)
   * @param {string} [params.cropKey='MAIZE'] - Target crop
   * @returns {Object} CWSI index, baseline limits, and irrigation trigger status
   */
  evaluateCropWaterStress({
    canopyTempCelsius,
    airTempCelsius,
    relativeHumidityPct,
    cropKey = 'MAIZE'
  }) {
    if (typeof canopyTempCelsius !== 'number' || typeof airTempCelsius !== 'number') {
      throw new Error('Both canopyTempCelsius and airTempCelsius must be numeric.');
    }

    const normalizedKey = cropKey.toUpperCase();
    const baseline = CROP_CWSI_BASELINES[normalizedKey] || CROP_CWSI_BASELINES.MAIZE;

    const deltaTObserved = canopyTempCelsius - airTempCelsius;
    const vpd = this.calculateVaporPressureDeficit(airTempCelsius, relativeHumidityPct);
    const lowerDeltaT = this.calculateLowerBaselineDeltaT(normalizedKey, vpd);
    const upperDeltaT = baseline.upperBaselineDeltaT;

    const denominator = upperDeltaT - lowerDeltaT;
    let cwsiRaw = 0.0;

    if (denominator > 0) {
      cwsiRaw = (deltaTObserved - lowerDeltaT) / denominator;
    }

    const cwsiClamped = Number(Math.max(0.0, Math.min(1.0, cwsiRaw)).toFixed(3));
    const isIrrigationRequired = cwsiClamped >= baseline.stressThresholdTrigger;

    let stressTriage;
    let actionRecommendation;

    if (cwsiClamped <= 0.20) {
      stressTriage = 'HYDRATED';
      actionRecommendation = 'Canopy fully hydrated. Maintain normal seasonal irrigation schedule.';
    } else if (cwsiClamped <= 0.40) {
      stressTriage = 'MILD_DEFICIT';
      actionRecommendation = 'Emerging evaporative stress. Plan scheduled irrigation cycle within 48 hours.';
    } else if (cwsiClamped <= 0.60) {
      stressTriage = 'MODERATE_STRESS';
      actionRecommendation = 'Stomatal conductance depressed. Dispatch 25-30 mm irrigation cycle to prevent yield penalty.';
    } else if (cwsiClamped <= 0.80) {
      stressTriage = 'SEVERE_STRESS';
      actionRecommendation = 'Critical moisture exhaustion. Dispatch priority drip or pivot irrigation immediately.';
    } else {
      stressTriage = 'ACUTE_DESICCATION';
      actionRecommendation = 'Emergency desiccation alert. Crop entering permanent wilting stage; urgent irrigation mandated.';
    }

    return {
      timestamp: new Date().toISOString(),
      cropKey: normalizedKey,
      cropName: baseline.cropName,
      inputs: {
        canopyTempCelsius,
        airTempCelsius,
        relativeHumidityPct,
        observedDeltaTCelsius: Number(deltaTObserved.toFixed(2)),
        vaporPressureDeficitKpa: vpd
      },
      baselines: {
        lowerDeltaTCelsius: lowerDeltaT,
        upperDeltaTCelsius: upperDeltaT,
        stressThresholdTrigger: baseline.stressThresholdTrigger
      },
      cwsi: cwsiClamped,
      stressTriage,
      isIrrigationRequired,
      actionRecommendation
    };
  }
}

const satelliteCropWaterStressIndexService = new SatelliteCropWaterStressIndexService();

module.exports = {
  SatelliteCropWaterStressIndexService,
  satelliteCropWaterStressIndexService,
  CROP_CWSI_BASELINES
};
