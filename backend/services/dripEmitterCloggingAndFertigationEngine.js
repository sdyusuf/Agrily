/**
 * ==============================================================================
 * 🧪 AGRILY SPRINT 23: KELLER-KARMELI DRIP EMISSION UNIFORMITY (EU), LANGELIER
 *    SATURATION INDEX (LSI) CLOGGING & DUAL-TANK VENTURI FERTIGATION ENGINE
 * ==============================================================================
 *
 * Implements:
 *  1. Keller-Karmeli (1974) Emission Uniformity (EU) & Christiansen Uniformity (CU):
 *       q = k * (H ^ x)
 *       EU (%) = 100 * (1 - 1.27 * (CV_m / sqrt(n_e))) * (q_min / q_avg)
 *  2. Langelier Saturation Index (LSI) & Emitter Biofilm/Scaling Maintenance:
 *       LSI = pH - pH_s
 *       pH_s = (9.3 + A + B) - (C + D)
 *       Prescribes phosphoric/nitric acid titration and NaOCl biofilm chlorination.
 *  3. Dual-Tank (Tank A Calcium/Iron vs. Tank B Phosphate/Sulfate) Venturi
 *     Fertigation Compatibility & EC Injection Dosing Calculator.
 *
 * @module services/dripEmitterCloggingAndFertigationEngine
 */

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function roundTo(val, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Catalog of Drip Tape & Micro-Sprinkler Emitter Specifications
 */
const DRIP_EMITTER_SPEC_CATALOG = {
  PC_HEAVY_DRIPLINE_2L: {
    emitterCode: 'PC_HEAVY_DRIPLINE_2L',
    emitterName: 'Pressure-Compensating (PC) Cylindrical Dripper 2.0 L/h',
    nominalDischargeLh: 2.0,
    dischargeExponentX: 0.06, // PC diaphragm keeps flow flat across 0.8 - 3.5 bar
    manufacturerCv: 0.03,
    emitterSpacingMeters: 0.3,
    orificeDiameterMm: 1.15,
    recommendedFiltrationMesh: 120,
  },
  NON_PC_TURBULENT_TAPE_1_6L: {
    emitterCode: 'NON_PC_TURBULENT_TAPE_1_6L',
    emitterName: 'Non-PC Turbulent Labyrinth Thin-Wall Drip Tape 1.6 L/h',
    nominalDischargeLh: 1.6,
    dischargeExponentX: 0.48,
    manufacturerCv: 0.05,
    emitterSpacingMeters: 0.2,
    orificeDiameterMm: 0.85,
    recommendedFiltrationMesh: 150,
  },
  MICRO_SPRINKLER_35L: {
    emitterCode: 'MICRO_SPRINKLER_35L',
    emitterName: 'Under-Tree Pressure-Regulated Micro-Sprinkler 35 L/h',
    nominalDischargeLh: 35.0,
    dischargeExponentX: 0.42,
    manufacturerCv: 0.04,
    emitterSpacingMeters: 4.0,
    orificeDiameterMm: 1.8,
    recommendedFiltrationMesh: 100,
  },
};

/**
 * Catalog of Water-Soluble Fertigation Salts & Tank A / Tank B Assignment Rules
 * Tank A: Calcium, Ammonium, Iron chelates (nitrate/chloride salts)
 * Tank B: Phosphates, Sulfates, Magnesium, Micronutrient sulfates
 */
const SOLUBLE_FERTILIZER_CATALOG = {
  CALCIUM_NITRATE: {
    saltCode: 'CALCIUM_NITRATE',
    chemicalName: 'Calcium Nitrate [Ca(NO3)2 · 4H2O]',
    gradeNpk: '15.5-0-0 + 19% Ca',
    assignedTank: 'TANK_A_CALCIUM',
    solubilityGramPerLiter20C: 1210,
    ecContributionDsmPerGramL: 1.2,
    incompatibleWith: ['MONOAMMONIUM_PHOSPHATE', 'POTASSIUM_SULFATE', 'MAGNESIUM_SULFATE'],
  },
  MONOAMMONIUM_PHOSPHATE: {
    saltCode: 'MONOAMMONIUM_PHOSPHATE',
    chemicalName: 'Technical Grade Monoammonium Phosphate (MAP)',
    gradeNpk: '12-61-0',
    assignedTank: 'TANK_B_PHOSPHATE_SULFATE',
    solubilityGramPerLiter20C: 370,
    ecContributionDsmPerGramL: 0.82,
    incompatibleWith: ['CALCIUM_NITRATE'],
  },
  POTASSIUM_NITRATE: {
    saltCode: 'POTASSIUM_NITRATE',
    chemicalName: 'Soluble Potassium Nitrate (KNO3)',
    gradeNpk: '13-0-46',
    assignedTank: 'EITHER_TANK_A_OR_B',
    solubilityGramPerLiter20C: 316,
    ecContributionDsmPerGramL: 1.3,
    incompatibleWith: [],
  },
  POTASSIUM_SULFATE: {
    saltCode: 'POTASSIUM_SULFATE',
    chemicalName: 'Soluble Potassium Sulfate (K2SO4)',
    gradeNpk: '0-0-50 + 18% S',
    assignedTank: 'TANK_B_PHOSPHATE_SULFATE',
    solubilityGramPerLiter20C: 110,
    ecContributionDsmPerGramL: 1.5,
    incompatibleWith: ['CALCIUM_NITRATE'],
  },
  MAGNESIUM_SULFATE: {
    saltCode: 'MAGNESIUM_SULFATE',
    chemicalName: 'Heptahydrate Magnesium Sulfate (Epsom Salt MgSO4·7H2O)',
    gradeNpk: '0-0-0 + 9.8% Mg + 13% S',
    assignedTank: 'TANK_B_PHOSPHATE_SULFATE',
    solubilityGramPerLiter20C: 710,
    ecContributionDsmPerGramL: 0.95,
    incompatibleWith: ['CALCIUM_NITRATE'],
  },
  UREA_LOW_BIURET: {
    saltCode: 'UREA_LOW_BIURET',
    chemicalName: 'Low-Biuret Soluble Urea [CO(NH2)2]',
    gradeNpk: '46-0-0',
    assignedTank: 'EITHER_TANK_A_OR_B',
    solubilityGramPerLiter20C: 1050,
    ecContributionDsmPerGramL: 0.08, // non-ionic prior to hydrolysis
    incompatibleWith: [],
  },
};

/**
 * Computes Keller-Karmeli Emission Uniformity (EU) & Christiansen Uniformity (CU)
 * along a drip lateral given inlet pressure, friction loss, and terrain slope.
 */
function evaluateKellerKarmeliEmissionUniformity(params = {}) {
  const emitterCode = String(
    params.emitterCode || 'PC_HEAVY_DRIPLINE_2L'
  ).toUpperCase();
  const spec =
    DRIP_EMITTER_SPEC_CATALOG[emitterCode] ||
    DRIP_EMITTER_SPEC_CATALOG.PC_HEAVY_DRIPLINE_2L;

  const nominalOperatingHeadMeters = clamp(
    Number(params.nominalOperatingHeadMeters ?? 15.0), // 1.5 bar
    4.0,
    45.0
  );
  const lateralFrictionHeadLossMeters = clamp(
    Number(params.lateralFrictionHeadLossMeters ?? 2.4),
    0.1,
    18.0
  );
  const lateralElevationChangeMeters = clamp(
    Number(params.lateralElevationChangeMeters ?? -0.5), // negative = downhill gain, positive = uphill loss
    -10.0,
    10.0
  );
  const emittersPerPlant = clamp(Number(params.emittersPerPlant ?? 2), 1, 12);
  const agingFoulingFactor = clamp(
    Number(params.agingFoulingFactor ?? 1.15), // CV multiplier from partial biofilm/silt
    1.0,
    2.5
  );

  // Calibrate emitter proportionality constant k from nominal head (10 m = 1 bar)
  const kCoeff =
    spec.nominalDischargeLh / Math.pow(10.0, spec.dischargeExponentX);

  const minHeadMeters = Math.max(
    2.0,
    nominalOperatingHeadMeters -
      0.75 * lateralFrictionHeadLossMeters -
      Math.max(0, lateralElevationChangeMeters)
  );
  const maxHeadMeters =
    nominalOperatingHeadMeters +
    0.25 * lateralFrictionHeadLossMeters +
    Math.max(0, -lateralElevationChangeMeters);
  const avgHeadMeters = (minHeadMeters + maxHeadMeters) / 2;

  const qMinLh = kCoeff * Math.pow(minHeadMeters, spec.dischargeExponentX);
  const qMaxLh = kCoeff * Math.pow(maxHeadMeters, spec.dischargeExponentX);
  const qAvgLh = kCoeff * Math.pow(avgHeadMeters, spec.dischargeExponentX);

  const effectiveCv = spec.manufacturerCv * agingFoulingFactor;
  const variationTerm = Math.max(
    0.5,
    1 - (1.27 * effectiveCv) / Math.sqrt(emittersPerPlant)
  );

  const emissionUniformityEuPct = clamp(
    100 * variationTerm * (qMinLh / Math.max(0.1, qAvgLh)),
    40.0,
    99.2
  );

  // Christiansen Uniformity CU (%) approximation from hydraulic & manufacturing CV
  const hydraulicCv = (qMaxLh - qMinLh) / Math.max(0.2, 2.5 * qAvgLh);
  const totalSystemCv = Math.sqrt(
    effectiveCv * effectiveCv + hydraulicCv * hydraulicCv
  );
  const christiansenUniformityCuPct = clamp(
    100 * (1 - 0.798 * totalSystemCv),
    50.0,
    99.5
  );

  let uniformityClassification = 'EXCELLENT_ASABE_DESIGN_UNIFORMITY';
  if (emissionUniformityEuPct < 75) {
    uniformityClassification = 'POOR_UNIFORMITY_FLUSH_AND_REGULATE_PRESSURE';
  } else if (emissionUniformityEuPct < 88) {
    uniformityClassification = 'ACCEPTABLE_FIELD_UNIFORMITY';
  }

  return {
    emitterCode: spec.emitterCode,
    emitterName: spec.emitterName,
    dischargeExponentX: spec.dischargeExponentX,
    effectiveManufacturerCv: roundTo(effectiveCv, 4),
    qMinLh: roundTo(qMinLh, 2),
    qAvgLh: roundTo(qAvgLh, 2),
    qMaxLh: roundTo(qMaxLh, 2),
    emissionUniformityEuPct: roundTo(emissionUniformityEuPct, 2),
    christiansenUniformityCuPct: roundTo(christiansenUniformityCuPct, 2),
    recommendedFiltrationMesh: spec.recommendedFiltrationMesh,
    uniformityClassification,
  };
}

/**
 * Evaluates Langelier Saturation Index (LSI) CaCO3 scaling risk, iron/bacterial
 * slime hazard, and prescribes phosphoric/nitric acid + NaOCl maintenance doses.
 */
function evaluateLangelierCloggingAndMaintenance(params = {}) {
  const waterPh = clamp(Number(params.waterPh ?? 7.85), 5.0, 9.5);
  const waterTempCelsius = clamp(Number(params.waterTempCelsius ?? 28.0), 10.0, 45.0);
  const tdsMgL = clamp(Number(params.tdsMgL ?? 640), 50, 8000);
  const calciumHardnessAsCaCo3MgL = clamp(
    Number(params.calciumHardnessAsCaCo3MgL ?? 195),
    10,
    1500
  );
  const alkalinityAsCaCo3MgL = clamp(
    Number(params.alkalinityAsCaCo3MgL ?? 220),
    10,
    1500
  );
  const dissolvedIronMgL = clamp(Number(params.dissolvedIronMgL ?? 0.35), 0.0, 10.0);
  const hydrogenSulfideMgL = clamp(
    Number(params.hydrogenSulfideMgL ?? 0.12),
    0.0,
    5.0
  );

  // Standard Langelier logarithmic empirical constants A, B, C, D
  const factorA = (Math.log10(tdsMgL) - 1) / 10;
  const factorB = -13.12 * Math.log10(waterTempCelsius + 273) + 34.55;
  const factorC = Math.log10(calciumHardnessAsCaCo3MgL) - 0.4;
  const factorD = Math.log10(alkalinityAsCaCo3MgL);

  const saturationPhs = 9.3 + factorA + factorB - (factorC + factorD);
  const langelierSaturationIndexLsi = waterPh - saturationPhs;

  // Phosphoric acid (85% H3PO4) titration dose to neutralize excess bicarbonate to pH 6.2
  const excessAlkalinityMeqL = Math.max(0, (alkalinityAsCaCo3MgL - 60) / 50);
  const phosphoricAcidLitersPer1000M3 =
    langelierSaturationIndexLsi > 0.2 ? roundTo(excessAlkalinityMeqL * 38.5, 1) : 0;

  // Sodium hypochlorite (12% NaOCl) dose for Fe/S bacterial slime control (target 2 ppm free Cl2 residual)
  const targetChlorinePpm =
    dissolvedIronMgL > 0.4 || hydrogenSulfideMgL > 0.2 ? 12.0 : 4.0;
  const sodiumHypochloriteLitersPer1000M3 = roundTo(
    (targetChlorinePpm / 0.12) * 1.0,
    1
  );

  let cloggingHazardLevel = 'LOW_CLOGGING_RISK';
  if (langelierSaturationIndexLsi >= 0.8 || dissolvedIronMgL >= 1.5) {
    cloggingHazardLevel = 'SEVERE_SCALING_AND_OCHRE_SLIME_HAZARD';
  } else if (langelierSaturationIndexLsi >= 0.25 || dissolvedIronMgL >= 0.3) {
    cloggingHazardLevel = 'MODERATE_CACO3_PRECIPITATION_ACIDIFY_LINE';
  }

  return {
    waterPh: roundTo(waterPh, 2),
    saturationPhs: roundTo(saturationPhs, 2),
    langelierSaturationIndexLsi: roundTo(langelierSaturationIndexLsi, 2),
    cloggingHazardLevel,
    phosphoricAcidLitersPer1000M3,
    sodiumHypochloriteLitersPer1000M3,
  };
}

/**
 * Evaluates Dual-Tank (Tank A vs. Tank B) Venturi Fertigation compatibility,
 * solubility limits, and electrical conductivity (EC) dosing trim.
 */
function evaluateDualTankVenturiFertigation(params = {}) {
  const mainLineFlowM3PerHour = clamp(
    Number(params.mainLineFlowM3PerHour ?? 55.0),
    2.0,
    500.0
  );
  const stockTankVolumeLiters = clamp(
    Number(params.stockTankVolumeLiters ?? 1000),
    100,
    10000
  );
  const selectedSalts = Array.isArray(params.selectedSalts)
    ? params.selectedSalts
    : [
        { saltCode: 'CALCIUM_NITRATE', massKg: 45, targetTank: 'TANK_A' },
        { saltCode: 'MONOAMMONIUM_PHOSPHATE', massKg: 35, targetTank: 'TANK_B' },
      ];

  const compatibilityConflicts = [];
  const tankASalts = [];
  const tankBSalts = [];
  let totalStockEcBoostDsm = 0;

  for (const item of selectedSalts) {
    const code = String(item.saltCode || '').toUpperCase();
    const spec = SOLUBLE_FERTILIZER_CATALOG[code];
    if (!spec) continue;

    const targetTank = String(item.targetTank || 'TANK_A').toUpperCase();
    if (targetTank === 'TANK_A' || targetTank.endsWith('_A')) {
      tankASalts.push(code);
    } else {
      tankBSalts.push(code);
    }

    const concentrationGramL =
      (Number(item.massKg || 10) * 1000) / stockTankVolumeLiters;
    if (concentrationGramL > spec.solubilityGramPerLiter20C) {
      compatibilityConflicts.push(
        `${code}_EXCEEDS_SOLUBILITY_LIMIT_${spec.solubilityGramPerLiter20C}G_L`
      );
    }

    // Assuming 1:100 Venturi dilution ratio into irrigation mainline
    totalStockEcBoostDsm +=
      (concentrationGramL / 100) * spec.ecContributionDsmPerGramL;
  }

  // Check if incompatible salts were accidentally placed in the same tank
  const checkTankList = (list, tankLabel) => {
    for (let i = 0; i < list.length; i++) {
      const specA = SOLUBLE_FERTILIZER_CATALOG[list[i]];
      for (let j = i + 1; j < list.length; j++) {
        if (specA.incompatibleWith.includes(list[j])) {
          compatibilityConflicts.push(
            `PRECIPITATION_LOCKOUT_${list[i]}_WITH_${list[j]}_IN_${tankLabel}`
          );
        }
      }
    }
  };

  checkTankList(tankASalts, 'TANK_A');
  checkTankList(tankBSalts, 'TANK_B');

  const venturiSuctionRateLitersPerHour = roundTo(
    mainLineFlowM3PerHour * 10, // 1% (1:100) proportional Venturi injection
    1
  );

  return {
    safeToInject: compatibilityConflicts.length === 0,
    compatibilityConflicts,
    tankASalts,
    tankBSalts,
    venturiSuctionRateLitersPerHour,
    incrementalFertigationEcDsm: roundTo(totalStockEcBoostDsm, 2),
  };
}

/**
 * Evaluates Hydrocyclone Centrifugal Sand Separator & Automatic Disc Filter
 * Backflush Cycle Hydraulics + Diurnal Solar-MPPT Pump Output Curve (06:00 - 18:00).
 */
function simulateHydrocycloneBackflushAndSolarMpptCurve(params = {}) {
  const suspendedSandPpm = clamp(Number(params.suspendedSandPpm ?? 85), 0, 1500);
  const organicAlgaeLoadPpm = clamp(
    Number(params.organicAlgaeLoadPpm ?? 28),
    0,
    500
  );
  const systemFlowM3PerHour = clamp(
    Number(params.systemFlowM3PerHour ?? 68.0),
    5.0,
    400.0
  );
  const peakSolarIrradianceWm2 = clamp(
    Number(params.peakSolarIrradianceWm2 ?? 940),
    250,
    1150
  );
  const installedPvArrayKwp = clamp(
    Number(params.installedPvArrayKwp ?? 18.0),
    2.0,
    250.0
  );
  const ambientTempCelsius = clamp(
    Number(params.ambientTempCelsius ?? 34.0),
    15.0,
    48.0
  );

  // 1. Hydrocyclone sand separation efficiency (Stokes centrifugal settling, typically 92-98% for >75 micron sand)
  const hydrocycloneRemovalEfficiencyPct =
    suspendedSandPpm > 40 ? 95.5 : 89.0;
  const residualSandEnteringDiscFilterPpm =
    suspendedSandPpm * (1 - hydrocycloneRemovalEfficiencyPct / 100);

  // 2. Disc Filter Cake Accumulation & Backflush Interval (hours between 0.55 bar delta-P triggers)
  const totalSolidsLoadIndex =
    residualSandEnteringDiscFilterPpm + organicAlgaeLoadPpm * 1.4;
  const hoursBetweenAutoBackflush = clamp(
    roundTo(180 / Math.max(8, totalSolidsLoadIndex), 2),
    0.75,
    12.0
  );
  const backflushWaterRejectedLitersPerCycle = roundTo(
    systemFlowM3PerHour * 14.5,
    0
  );

  // 3. Diurnal Solar-MPPT Submersible Pump Curve (Hours 6 to 18)
  // Accounts for silicon cell temperature coefficient (-0.38% / °C above 25°C STC)
  const cellTempCelsius = ambientTempCelsius + 22.0;
  const thermalDeratingFactor = clamp(
    1 - 0.0038 * Math.max(0, cellTempCelsius - 25.0),
    0.72,
    1.0
  );

  const hourlyMpptCurve = [];
  let dailyCumulativePumpedM3 = 0;

  for (let hour = 6; hour <= 18; hour++) {
    const solarElevationSin = Math.max(
      0,
      Math.sin(((hour - 6) / 12) * Math.PI)
    );
    const irradianceWm2 = peakSolarIrradianceWm2 * solarElevationSin;
    const mpptElectricalKw =
      installedPvArrayKwp *
      (irradianceWm2 / 1000) *
      thermalDeratingFactor *
      0.96; // 96% MPPT inverter efficiency

    // Affinity law flow scaling (Q proportional to P^(1/3) above cut-in threshold)
    const cutInPowerKw = installedPvArrayKwp * 0.18;
    const hourlyFlowM3 =
      mpptElectricalKw >= cutInPowerKw
        ? systemFlowM3PerHour *
          Math.min(
            1.1,
            Math.pow(mpptElectricalKw / (installedPvArrayKwp * 0.75), 0.65)
          )
        : 0;

    dailyCumulativePumpedM3 += hourlyFlowM3;
    hourlyMpptCurve.push({
      hourOfDay: `${String(hour).padStart(2, '0')}:00`,
      irradianceWm2: Math.round(irradianceWm2),
      mpptElectricalKw: roundTo(mpptElectricalKw, 2),
      pumpedVolumeM3: roundTo(hourlyFlowM3, 1),
    });
  }

  return {
    suspendedSandPpm,
    hydrocycloneRemovalEfficiencyPct,
    residualSandEnteringDiscFilterPpm: roundTo(
      residualSandEnteringDiscFilterPpm,
      2
    ),
    hoursBetweenAutoBackflush,
    backflushWaterRejectedLitersPerCycle,
    thermalDeratingFactor: roundTo(thermalDeratingFactor, 3),
    dailyCumulativePumpedM3: roundTo(dailyCumulativePumpedM3, 1),
    hourlyMpptCurve,
  };
}

module.exports = {
  DRIP_EMITTER_SPEC_CATALOG,
  SOLUBLE_FERTILIZER_CATALOG,
  evaluateKellerKarmeliEmissionUniformity,
  evaluateLangelierCloggingAndMaintenance,
  evaluateDualTankVenturiFertigation,
  simulateHydrocycloneBackflushAndSolarMpptCurve,
};
