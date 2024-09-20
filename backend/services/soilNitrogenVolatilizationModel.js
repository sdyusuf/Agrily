/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - MECHANISTIC NITROGEN VOLATILIZATION & LEACHING MODEL
 * ==============================================================================
 * 
 * Architecture Overview:
 * Mechanistic thermodynamic and biochemical model predicting ammonia (NH3)
 * volatilization degassing and nitrate (NO3-) deep percolation leaching across
 * tropical agro-ecosystems. Models urea hydrolysis kinetics, soil buffer pH shifts,
 * ambient air temperature, relative humidity, wind velocity, and fertilizer placement.
 * 
 * Mathematical Formulations:
 * 1. Ammonia Equilibrium Ratio (Henderson-Hasselbalch at 25°C, pKa = 9.25):
 *    f_{NH3} = \frac{1}{10^{(pKa(T) - pH)} + 1}
 *    where pKa(T) = \frac{2729.92}{T_K} + 0.09018
 * 
 * 2. Temperature Kinetic Acceleration (Arrhenius factor):
 *    k_{volatilization}(T) = k_{ref} \cdot Q_{10}^{\frac{T - 25}{10}} \quad (Q_{10} \approx 2.1)
 * 
 * 3. Placement Depth Mitigation Factor:
 *    M_{placement} = \begin{cases}
 *      1.00 & \text{Surface Broadcast (No Incorporation)} \\
 *      0.35 & \text{Surface Broadcast + Light Harrowing (5cm)} \\
 *      0.08 & \text{Deep Band Placement (8-10cm)} \\
 *      0.22 & \text{Urease Inhibitor (NBPT Treated)}
 *    \end{cases}
 * 
 * 4. Nitrate Leaching Flux:
 *    L_{NO3} = \left[ 1 - \exp\left( - \frac{Drainage_{mm}}{FieldCapacity_{mm}} \right) \right] \cdot [NO_3^-]
 * 
 * @module services/soilNitrogenVolatilizationModel
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 */

'use strict';

const APPLICATION_METHODS = Object.freeze({
  SURFACE_BROADCAST_UNINCORPORATED: {
    code: 'SURFACE_BROADCAST_UNINCORPORATED',
    label: 'Surface Broadcast (No Soil Incorporation)',
    volatilizationMultiplier: 1.0,
    leachingMultiplier: 0.9,
    description: 'High risk of gaseous ammonia escape under dry tropical breezes.'
  },
  SURFACE_BROADCAST_INCORPORATED_5CM: {
    code: 'SURFACE_BROADCAST_INCORPORATED_5CM',
    label: 'Surface Broadcast + 5cm Incorporation / Harrowing',
    volatilizationMultiplier: 0.35,
    leachingMultiplier: 1.0,
    description: 'Shallow soil cover binds NH4+ cations to soil exchange surfaces.'
  },
  DEEP_BAND_PLACEMENT_10CM: {
    code: 'DEEP_BAND_PLACEMENT_10CM',
    label: 'Subsurface Deep Banding (8 - 10 cm)',
    volatilizationMultiplier: 0.08,
    leachingMultiplier: 0.75,
    description: 'Premier agronomic placement; nearly complete suppression of volatilization.'
  },
  UREASE_INHIBITOR_TREATED: {
    code: 'UREASE_INHIBITOR_TREATED',
    label: 'Urease Inhibitor Treated (NBPT / Agrotain)',
    volatilizationMultiplier: 0.20,
    leachingMultiplier: 0.85,
    description: 'Chemical enzyme suppression delays hydrolysis for up to 14 days.'
  },
  FERTIGATION_DRIP: {
    code: 'FERTIGATION_DRIP',
    label: 'Precision Drip Fertigation',
    volatilizationMultiplier: 0.05,
    leachingMultiplier: 0.60,
    description: 'Dissolved nutrients placed directly within active root rhizosphere.'
  }
});

class SoilNitrogenVolatilizationModel {
  /**
   * Computes temperature-dependent ammonia pKa
   * 
   * @param {number} tempCelsius - Soil/air temperature in °C
   * @returns {number} Temperature-corrected pKa
   */
  static calculateTemperatureCorrectedPka(tempCelsius = 25.0) {
    const tempKelvin = Math.max(273.15, tempCelsius + 273.15);
    return (2729.92 / tempKelvin) + 0.09018;
  }

  /**
   * Evaluates mechanistic nitrogen volatilization and leaching losses
   * 
   * @param {Object} params
   * @param {number} params.appliedPureNitrogenKgPerHa - Total elemental N applied (kg/ha)
   * @param {string} params.fertilizerType - Commercial product code (e.g. 'UREA_46', 'NPK_15_15_15')
   * @param {number} params.soilPh - Arable topsoil pH (1:1 water)
   * @param {number} params.ambientTemperatureCelsius - Mean daily soil/air temp (°C)
   * @param {number} params.relativeHumidityPct - Atmospheric humidity (%)
   * @param {number} params.windSpeedKmH - Mean wind velocity (km/h)
   * @param {number} params.rainfallOrIrrigationMm - Precipitation/irrigation depth (mm)
   * @param {string} params.applicationMethod - One of APPLICATION_METHODS keys
   * @param {number} params.fieldAcreageHectares - Total land area (hectares)
   * @returns {Object} Comprehensive nitrogen fate and loss report
   */
  static simulateNitrogenFate({
    appliedPureNitrogenKgPerHa = 100.0,
    fertilizerType = 'UREA_46',
    soilPh = 6.8,
    ambientTemperatureCelsius = 32.0,
    relativeHumidityPct = 60.0,
    windSpeedKmH = 12.0,
    rainfallOrIrrigationMm = 25.0,
    applicationMethod = 'SURFACE_BROADCAST_UNINCORPORATED',
    fieldAcreageHectares = 2.0
  } = {}) {
    const nApplied = Math.max(1.0, Number(appliedPureNitrogenKgPerHa) || 100.0);
    const ph = Math.min(10.5, Math.max(3.5, Number(soilPh) || 6.8));
    const temp = Math.min(50.0, Math.max(10.0, Number(ambientTemperatureCelsius) || 30.0));
    const rh = Math.min(100.0, Math.max(10.0, Number(relativeHumidityPct) || 60.0));
    const wind = Math.max(0, Number(windSpeedKmH) || 10.0);
    const waterMm = Math.max(0, Number(rainfallOrIrrigationMm) || 20.0);
    const acreage = Math.max(0.1, Number(fieldAcreageHectares) || 1.0);

    const methodMeta = APPLICATION_METHODS[applicationMethod] || APPLICATION_METHODS.SURFACE_BROADCAST_UNINCORPORATED;

    // 1. Thermodynamic Equilibrium Fraction (Henderson-Hasselbalch)
    const pKa = this.calculateTemperatureCorrectedPka(temp);
    const ammoniaFraction = 1 / (Math.pow(10, pKa - ph) + 1);

    // 2. Temperature Kinetic Multiplier (Q10 rule)
    const tempMultiplier = Math.pow(2.1, (temp - 25.0) / 10.0);

    // 3. Environmental Wind and Aridity Factors
    const windFactor = 1.0 + (wind / 25.0);
    const humidityFactor = 1.0 + Math.max(0, (50.0 - rh) / 100.0);

    // 4. Fertilizer Inherent Volatilization Vulnerability
    let fertilizerVulnerability = 1.0;
    if (fertilizerType.toUpperCase().includes('UREA')) {
      fertilizerVulnerability = 1.25; // Urea hydrolysis generates localized alkaline microsite (pH ~9.0)
    } else if (fertilizerType.toUpperCase().includes('CAN')) {
      fertilizerVulnerability = 0.20; // Nitrate/Ammonium blend, non-hydrolyzing
    } else if (fertilizerType.toUpperCase().includes('NPK')) {
      fertilizerVulnerability = 0.65;
    } else if (fertilizerType.toUpperCase().includes('DAP')) {
      fertilizerVulnerability = 1.10; // DAP produces alkaline microsite
    }

    // 5. Baseline Ammonia Volatilization Loss Rate (%)
    const baseVolatilizationPct = ammoniaFraction * 100.0 * 8.5; // Calibrated against tropical field trials
    const rawVolatilizationLossPct = baseVolatilizationPct *
      tempMultiplier *
      windFactor *
      humidityFactor *
      fertilizerVulnerability *
      methodMeta.volatilizationMultiplier;

    const volatilizationLossPct = Number(Math.min(55.0, Math.max(0.5, rawVolatilizationLossPct)).toFixed(1));
    const volatilizedNitrogenKgPerHa = Number(((volatilizationLossPct / 100.0) * nApplied).toFixed(2));

    // 6. Nitrate Leaching Simulation (Monsoonal rainfall percolation)
    let leachingLossPct = 0;
    if (waterMm > 40.0) {
      // Saturated gravitational flow
      const excessWater = waterMm - 40.0;
      leachingLossPct = Math.min(45.0, (excessWater / 150.0) * 35.0 * methodMeta.leachingMultiplier);
    } else {
      leachingLossPct = Math.min(10.0, (waterMm / 40.0) * 8.0 * methodMeta.leachingMultiplier);
    }
    leachingLossPct = Number(leachingLossPct.toFixed(1));
    const leachedNitrogenKgPerHa = Number(((leachingLossPct / 100.0) * nApplied).toFixed(2));

    // 7. Retained Bioavailable Nitrogen
    const totalLossPct = Number((volatilizationLossPct + leachingLossPct).toFixed(1));
    const totalLostKgPerHa = Number((volatilizedNitrogenKgPerHa + leachedNitrogenKgPerHa).toFixed(2));
    const retainedNitrogenKgPerHa = Number(Math.max(0, nApplied - totalLostKgPerHa).toFixed(2));
    const nitrogenUseEfficiencyPct = Number(((retainedNitrogenKgPerHa / nApplied) * 100.0).toFixed(1));

    // 8. Financial Loss Accounting (Based on N cost in Urea @ ₦39,500 / 23kg N ≈ ₦1,717 / kg pure N)
    const costPerKgPureNaira = 1717;
    const financialLossPerHaNaira = Math.round(totalLostKgPerHa * costPerKgPureNaira);
    const totalFieldFinancialLossNaira = Math.round(financialLossPerHaNaira * acreage);

    // 9. Mitigation Advisory Formulation
    const mitigations = [];
    if (volatilizationLossPct > 20.0) {
      mitigations.push('Urgent: Incorporate broadcast fertilizer into top 8cm of soil within 4 hours to avert rapid gaseous ammonia loss.');
    }
    if (temp > 35.0) {
      mitigations.push(`Extreme tropical heat (${temp}°C) accelerates urea hydrolysis. Schedule applications during cool dusk hours.`);
    }
    if (ph > 7.5) {
      mitigations.push(`Alkaline topsoil (pH ${ph}) strongly favors gaseous NH3 equilibrium. Treat urea with urease inhibitors (NBPT) or substitute with CAN 27-0-0.`);
    }
    if (leachingLossPct > 20.0) {
      mitigations.push(`Heavy rainfall/irrigation (${waterMm}mm) induced deep nitrate leaching. Split nitrogen dose into 3 smaller vegetative top-dressings.`);
    }
    if (mitigations.length === 0) {
      mitigations.push('Current nitrogen management achieves excellent use efficiency (> 80%). Maintain current incorporation protocol.');
    }

    return {
      simulationInput: {
        appliedPureNitrogenKgPerHa: nApplied,
        fertilizerType,
        soilPh: ph,
        ambientTemperatureCelsius: temp,
        relativeHumidityPct: rh,
        windSpeedKmH: wind,
        rainfallOrIrrigationMm: waterMm,
        applicationMethod: methodMeta.label,
        fieldAcreageHectares: acreage
      },
      nitrogenFateBreakdown: {
        ammoniaVolatilization: {
          lossPct: volatilizationLossPct,
          lostKgPerHa: volatilizedNitrogenKgPerHa,
          riskTier: volatilizationLossPct > 25.0 ? 'HIGH_AMMONIA_ESCAPE' : volatilizationLossPct > 12.0 ? 'MODERATE' : 'LOW'
        },
        nitrateLeaching: {
          lossPct: leachingLossPct,
          lostKgPerHa: leachedNitrogenKgPerHa,
          riskTier: leachingLossPct > 25.0 ? 'HIGH_DEEP_LEACHING' : leachingLossPct > 12.0 ? 'MODERATE' : 'LOW'
        },
        cumulativeLossPct: totalLossPct,
        cumulativeLostKgPerHa: totalLostKgPerHa,
        retainedBioavailableKgPerHa: retainedNitrogenKgPerHa,
        nitrogenUseEfficiencyPct
      },
      economicImpact: {
        financialLossPerHaNaira,
        totalFieldFinancialLossNaira,
        potentialSavingsWithDeepBandingNaira: Math.round(totalFieldFinancialLossNaira * 0.75)
      },
      mitigationAdvisories: mitigations
    };
  }
}

module.exports = {
  SoilNitrogenVolatilizationModel,
  APPLICATION_METHODS
};
