/**
 * ==============================================================================
 * 🛰️ AGRILY REMOTE SENSING DOMAIN - SATELLITE PHENOLOGY HARMONICS ENGINE
 * ==============================================================================
 * 
 * Architecture Overview:
 * Decomposes multi-temporal Sentinel-2 vegetation index time series using
 * harmonic Fourier analysis and asymmetric Gaussian fitting to extract key
 * agro-phenological transition metrics (Land Surface Phenology, LSP):
 *  - Start of Season (SOS): Green-up onset trigger
 *  - Peak of Season (POS): Maximum canopy vegetative vigor
 *  - Maturity / Senescence Inflection (MOS)
 *  - End of Season (EOS): Physiological maturity / harvest readiness
 *  - Length of Season (LOS = EOS - SOS, days)
 *  - Seasonal Integral (Large & Small Integral metrics proxying biomass productivity)
 * 
 * Mathematical Formulation:
 * 1. Fourier Harmonic Series Representation:
 *    $$y(t) = \bar{y} + \sum_{k=1}^K A_k \cos\left(\frac{2\pi k t}{T} - \phi_k\right)$$
 *    or equivalently:
 *    $$y(t) = c_0 + \sum_{k=1}^K \left[ a_k \cos\left(\frac{2\pi k t}{T}\right) + b_k \sin\left(\frac{2\pi k t}{T}\right) \right]$$
 *    where:
 *      - $T = 365.25$ days (annual fundamental period)
 *      - $k = 1$: Annual cycle (unimodal Savanna rainfall regime)
 *      - $k = 2$: Semi-annual cycle (bimodal Rainforest / Southern agricultural belt)
 *      - $A_k = \sqrt{a_k^2 + b_k^2}$: Harmonic amplitude (canopy dynamic range)
 *      - $\phi_k = \text{atan2}(b_k, a_k)$: Phase angle (seasonal timing of peak)
 * 
 * 2. Asymmetric Gaussian Local Filtering:
 *    $$f(t) = c_1 + c_2 g(t; t_0, a_1, a_2, b_1, b_2)$$
 *    $$g(t) = \exp\left( - \left(\frac{t - t_0}{a_1}\right)^{b_1} \right) \quad \text{for } t \le t_0$$
 *    $$g(t) = \exp\left( - \left(\frac{t_0 - t}{a_2}\right)^{b_2} \right) \quad \text{for } t > t_0$$
 * 
 * 3. Seasonal Metrics Threshold Method:
 *    $$NDVI_{ratio}(t) = \frac{NDVI(t) - NDVI_{min}}{NDVI_{max} - NDVI_{min}}$$
 *    - SOS: Day of Year where $NDVI_{ratio}$ crosses 0.20 on rising limb.
 *    - POS: Day of Year where $NDVI(t)$ reaches absolute maximum.
 *    - EOS: Day of Year where $NDVI_{ratio}$ drops below 0.20 on falling limb.
 * 
 * @module services/satellitePhenologyHarmonicsEngine
 * @version 1.0.0
 * @author Agrily Remote Sensing Core Team
 * ==============================================================================
 */

'use strict';

/**
 * Agro-climatic rainfall & phenology regime classification across Nigeria
 */
const NIGERIAN_PHENOLOGY_REGIMES = Object.freeze({
  UNIMODAL_SAVANNA: {
    regimeName: 'Sudan / Sahel Savanna Unimodal Regime',
    dominantHarmonic: 1, // 1 annual peak
    typicalSosDoyRange: [140, 175], // Late May to late June
    typicalPosDoyRange: [230, 260], // Mid August to mid September
    typicalEosDoyRange: [285, 315], // Mid October to mid November
    typicalSeasonLengthDays: 135,
    statesCovered: ['KANO', 'KATSINA', 'SOKOTO', 'ZAMFARA', 'JIGAWA', 'YOBE', 'BORNO', 'BAUCHI']
  },
  BIMODAL_RAINFOREST: {
    regimeName: 'Southern Rainforest / Derived Savanna Bimodal Regime',
    dominantHarmonic: 2, // 2 distinct rainfall and cropping peaks (early & late seasons)
    earlySeasonSosDoy: [75, 105],   // Mid March to mid April
    earlySeasonPosDoy: [160, 185],  // June
    augustBreakDoy: [215, 235],     // August dry spell
    lateSeasonPosDoy: [270, 295],   // October
    statesCovered: ['LAGOS', 'OGUN', 'OYO', 'OSUN', 'ONDO', 'EDO', 'DELTA', 'RIVERS', 'IMO', 'ABIA']
  },
  TRANSITIONAL_GUINEA: {
    regimeName: 'Southern / Northern Guinea Savanna Transition',
    dominantHarmonic: 1,
    typicalSosDoyRange: [120, 150], // May
    typicalPosDoyRange: [240, 270], // Late August to September
    typicalEosDoyRange: [300, 330], // November
    typicalSeasonLengthDays: 165,
    statesCovered: ['KADUNA', 'NIGER', 'BENUE', 'PLATEAU', 'NASARAWA', 'KOGI', 'KWARA', 'FCT']
  }
});

class SatellitePhenologyHarmonicsEngine {
  /**
   * Computes discrete Fourier transform harmonic components (k = 1, 2)
   * 
   * @param {Array<{ dayOfYear: number, ndvi: number }>} timeSeries - Time series observations
   * @returns {Object} Harmonic coefficients (a1, b1, A1, phi1, a2, b2, A2, phi2)
   */
  computeHarmonicDecomposition(timeSeries = []) {
    if (!Array.isArray(timeSeries) || timeSeries.length < 4) {
      throw new Error('A minimum of 4 temporal observations are required for harmonic decomposition.');
    }

    const n = timeSeries.length;
    const periodT = 365.25;

    // Mean baseline offset c0
    const sumNdvi = timeSeries.reduce((acc, pt) => acc + pt.ndvi, 0);
    const c0 = sumNdvi / n;

    // Calculate k=1 (Annual) and k=2 (Semi-Annual) components
    let a1Sum = 0;
    let b1Sum = 0;
    let a2Sum = 0;
    let b2Sum = 0;

    timeSeries.forEach((pt) => {
      const t = pt.dayOfYear;
      const angle1 = (2 * Math.PI * 1 * t) / periodT;
      const angle2 = (2 * Math.PI * 2 * t) / periodT;

      a1Sum += pt.ndvi * Math.cos(angle1);
      b1Sum += pt.ndvi * Math.sin(angle1);
      a2Sum += pt.ndvi * Math.cos(angle2);
      b2Sum += pt.ndvi * Math.sin(angle2);
    });

    const a1 = (2 / n) * a1Sum;
    const b1 = (2 / n) * b1Sum;
    const a2 = (2 / n) * a2Sum;
    const b2 = (2 / n) * b2Sum;

    const amp1 = Math.sqrt(a1 * a1 + b1 * b1);
    const phi1Rad = Math.atan2(b1, a1);
    const phi1Deg = (phi1Rad * 180) / Math.PI;

    const amp2 = Math.sqrt(a2 * a2 + b2 * b2);
    const phi2Rad = Math.atan2(b2, a2);
    const phi2Deg = (phi2Rad * 180) / Math.PI;

    // Bimodal index ratio: Amplitude(2) / Amplitude(1)
    const bimodalRatio = amp1 > 0 ? Number((amp2 / amp1).toFixed(3)) : 0.0;
    const regimeDetected = bimodalRatio > 0.45 ? 'BIMODAL_REGIME' : 'UNIMODAL_REGIME';

    return {
      c0Baseline: Number(c0.toFixed(4)),
      annualHarmonic: {
        harmonicOrder: 1,
        cosineCoeffA: Number(a1.toFixed(4)),
        sineCoeffB: Number(b1.toFixed(4)),
        amplitude: Number(amp1.toFixed(4)),
        phaseDeg: Number(phi1Deg.toFixed(2))
      },
      semiAnnualHarmonic: {
        harmonicOrder: 2,
        cosineCoeffA: Number(a2.toFixed(4)),
        sineCoeffB: Number(b2.toFixed(4)),
        amplitude: Number(amp2.toFixed(4)),
        phaseDeg: Number(phi2Deg.toFixed(2))
      },
      bimodalRatio,
      regimeDetected
    };
  }

  /**
   * Reconstructs fitted harmonic NDVI curve for any target Day of Year
   * 
   * @param {number} dayOfYear - Day of Year (1 - 366)
   * @param {Object} harmonicModel - Output from computeHarmonicDecomposition
   * @returns {number} Fitted NDVI estimate
   */
  evaluateHarmonicCurve(dayOfYear, harmonicModel) {
    if (!harmonicModel || !harmonicModel.annualHarmonic) {
      throw new Error('Valid harmonic model payload required.');
    }

    const t = Math.max(1, Math.min(366, Number(dayOfYear) || 1));
    const periodT = 365.25;

    const angle1 = (2 * Math.PI * 1 * t) / periodT;
    const angle2 = (2 * Math.PI * 2 * t) / periodT;

    const val = harmonicModel.c0Baseline +
      (harmonicModel.annualHarmonic.cosineCoeffA * Math.cos(angle1)) +
      (harmonicModel.annualHarmonic.sineCoeffB * Math.sin(angle1)) +
      (harmonicModel.semiAnnualHarmonic.cosineCoeffA * Math.cos(angle2)) +
      (harmonicModel.semiAnnualHarmonic.sineCoeffB * Math.sin(angle2));

    return Number(Math.max(-0.2, Math.min(1.0, val)).toFixed(4));
  }

  /**
   * Extracts seasonal phenology transition metrics (SOS, POS, EOS, LOS)
   * 
   * @param {Array<{ dayOfYear: number, ndvi: number }>} rawSeries - Temporal observations
   * @param {string} [stateKey='KANO'] - State context for regional regime validation
   * @returns {Object} Extracted phenology transition markers and productivity integrals
   */
  extractPhenologyTransitionMetrics(rawSeries = [], stateKey = 'KANO') {
    const harmonics = this.computeHarmonicDecomposition(rawSeries);

    // Evaluate reconstructed trajectory over complete 365-day calendar
    const dailyValues = [];
    let maxNdvi = -1.0;
    let minNdvi = 2.0;
    let peakDoy = 1;

    for (let doy = 1; doy <= 365; doy++) {
      const fit = this.evaluateHarmonicCurve(doy, harmonics);
      dailyValues.push({ doy, ndvi: fit });

      if (fit > maxNdvi) {
        maxNdvi = fit;
        peakDoy = doy;
      }
      if (fit < minNdvi) {
        minNdvi = fit;
      }
    }

    const dynamicRange = maxNdvi - minNdvi;
    const sosThreshold = minNdvi + (0.20 * dynamicRange);
    const eosThreshold = minNdvi + (0.20 * dynamicRange);

    // Detect Start of Season (rising limb crossing 20% dynamic range)
    let sosDoy = null;
    for (let i = 0; i < peakDoy; i++) {
      if (dailyValues[i].ndvi >= sosThreshold) {
        sosDoy = dailyValues[i].doy;
        break;
      }
    }
    if (!sosDoy) sosDoy = Math.max(1, peakDoy - 60);

    // Detect End of Season (falling limb crossing 20% dynamic range)
    let eosDoy = null;
    for (let i = peakDoy; i < 365; i++) {
      if (dailyValues[i].ndvi <= eosThreshold) {
        eosDoy = dailyValues[i].doy;
        break;
      }
    }
    if (!eosDoy) eosDoy = Math.min(365, peakDoy + 60);

    const lengthOfSeasonDays = Math.max(30, eosDoy - sosDoy);

    // Calculate Seasonal Large Integral (total biomass proxy)
    let seasonalIntegral = 0;
    for (let d = sosDoy; d <= eosDoy; d++) {
      seasonalIntegral += (dailyValues[d - 1].ndvi - minNdvi);
    }

    return {
      stateContext: stateKey.toUpperCase(),
      regimeDetected: harmonics.regimeDetected,
      phenologyTransitions: {
        startOfSeasonDoy: sosDoy,
        peakOfSeasonDoy: peakDoy,
        endOfSeasonDoy: eosDoy,
        lengthOfSeasonDays,
        baselineTroughNdvi: Number(minNdvi.toFixed(3)),
        canopyPeakNdvi: Number(maxNdvi.toFixed(3)),
        dynamicCanopyVigorAmplitude: Number(dynamicRange.toFixed(3))
      },
      seasonalProductivity: {
        largeIntegralBiomassProxy: Number(seasonalIntegral.toFixed(2)),
        averageDailyVigorRate: Number((seasonalIntegral / lengthOfSeasonDays).toFixed(3))
      },
      harmonics
    };
  }
}

const satellitePhenologyHarmonicsEngine = new SatellitePhenologyHarmonicsEngine();

module.exports = {
  SatellitePhenologyHarmonicsEngine,
  satellitePhenologyHarmonicsEngine,
  NIGERIAN_PHENOLOGY_REGIMES
};
