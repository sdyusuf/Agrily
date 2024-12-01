/**
 * ==============================================================================
 * 🧪 AGRILY SPRINT 23: KELLER-KARMELI DRIP EMISSION UNIFORMITY, LANGELIER
 *    SATURATION INDEX (LSI) & DUAL-TANK VENTURI FERTIGATION UNIT TESTS
 * ==============================================================================
 */

const assert = require('assert');
const {
  evaluateKellerKarmeliEmissionUniformity,
  evaluateLangelierCloggingAndMaintenance,
  evaluateDualTankVenturiFertigation,
  simulateHydrocycloneBackflushAndSolarMpptCurve,
} = require('../services/dripEmitterCloggingAndFertigationEngine');

console.log(
  '🧪 Starting Sprint 23 Keller-Karmeli EU, Langelier LSI & Venturi Fertigation Tests...'
);

// 1. Test Keller-Karmeli Emission Uniformity (PC vs. Non-PC Drip Tape)
{
  const pcEmitter = evaluateKellerKarmeliEmissionUniformity({
    emitterCode: 'PC_HEAVY_DRIPLINE_2L',
    nominalOperatingHeadMeters: 15.0,
    lateralFrictionHeadLossMeters: 4.5,
    lateralElevationChangeMeters: 1.5,
    emittersPerPlant: 2,
    agingFoulingFactor: 1.05,
  });

  const nonPcEmitter = evaluateKellerKarmeliEmissionUniformity({
    emitterCode: 'NON_PC_TURBULENT_TAPE_1_6L',
    nominalOperatingHeadMeters: 10.0,
    lateralFrictionHeadLossMeters: 5.5,
    lateralElevationChangeMeters: 2.5,
    emittersPerPlant: 1,
    agingFoulingFactor: 1.6,
  });

  assert.ok(
    pcEmitter.emissionUniformityEuPct > nonPcEmitter.emissionUniformityEuPct
  );
  assert.ok(pcEmitter.emissionUniformityEuPct > 90);
  assert.ok(pcEmitter.christiansenUniformityCuPct > 90);
  console.log(
    '  ✓ Keller-Karmeli Emission Uniformity (EU) & Christiansen Uniformity (CU) verified'
  );
}

// 2. Test Langelier Saturation Index (LSI) & Acid/Chlorine Maintenance Dosing
{
  const scalingWater = evaluateLangelierCloggingAndMaintenance({
    waterPh: 8.3,
    waterTempCelsius: 31.0,
    tdsMgL: 920,
    calciumHardnessAsCaCo3MgL: 310,
    alkalinityAsCaCo3MgL: 340,
    dissolvedIronMgL: 1.8,
  });

  const balancedWater = evaluateLangelierCloggingAndMaintenance({
    waterPh: 6.8,
    waterTempCelsius: 24.0,
    tdsMgL: 280,
    calciumHardnessAsCaCo3MgL: 85,
    alkalinityAsCaCo3MgL: 90,
    dissolvedIronMgL: 0.1,
  });

  assert.ok(scalingWater.langelierSaturationIndexLsi > 0.8);
  assert.strictEqual(
    scalingWater.cloggingHazardLevel,
    'SEVERE_SCALING_AND_OCHRE_SLIME_HAZARD'
  );
  assert.ok(scalingWater.phosphoricAcidLitersPer1000M3 > 50);
  assert.strictEqual(balancedWater.cloggingHazardLevel, 'LOW_CLOGGING_RISK');
  console.log(
    '  ✓ Langelier Saturation Index (LSI) CaCO3 scaling & phosphoric acid titration verified'
  );
}

// 3. Test Dual-Tank Venturi Fertigation Compatibility Interlocks
{
  const safeSeparation = evaluateDualTankVenturiFertigation({
    mainLineFlowM3PerHour: 60.0,
    stockTankVolumeLiters: 1000,
    selectedSalts: [
      { saltCode: 'CALCIUM_NITRATE', massKg: 50, targetTank: 'TANK_A' },
      { saltCode: 'MONOAMMONIUM_PHOSPHATE', massKg: 40, targetTank: 'TANK_B' },
    ],
  });

  const unsafeCoMixing = evaluateDualTankVenturiFertigation({
    mainLineFlowM3PerHour: 60.0,
    stockTankVolumeLiters: 1000,
    selectedSalts: [
      { saltCode: 'CALCIUM_NITRATE', massKg: 50, targetTank: 'TANK_A' },
      { saltCode: 'MONOAMMONIUM_PHOSPHATE', massKg: 40, targetTank: 'TANK_A' },
    ],
  });

  assert.strictEqual(safeSeparation.safeToInject, true);
  assert.strictEqual(safeSeparation.compatibilityConflicts.length, 0);
  assert.strictEqual(unsafeCoMixing.safeToInject, false);
  assert.ok(
    unsafeCoMixing.compatibilityConflicts.some((c) =>
      c.includes('PRECIPITATION_LOCKOUT')
    )
  );
  console.log(
    '  ✓ Dual-Tank (Tank A Calcium vs. Tank B Phosphate/Sulfate) precipitation interlock verified'
  );
}

// 4. Test Hydrocyclone Sand Separation & Diurnal Solar-MPPT Pump Curve
{
  const mpptSim = simulateHydrocycloneBackflushAndSolarMpptCurve({
    suspendedSandPpm: 120,
    organicAlgaeLoadPpm: 35,
    systemFlowM3PerHour: 72.0,
    peakSolarIrradianceWm2: 960,
    installedPvArrayKwp: 18.5,
    ambientTempCelsius: 35.0,
  });

  assert.strictEqual(mpptSim.hourlyMpptCurve.length, 13);
  assert.ok(mpptSim.dailyCumulativePumpedM3 > 400);
  assert.ok(mpptSim.residualSandEnteringDiscFilterPpm < 10);
  console.log(
    '  ✓ Hydrocyclone sand separator, auto-backflush interval & Solar-MPPT curve verified'
  );
}

console.log(
  '✅ All Sprint 23 Keller-Karmeli EU, Langelier LSI & Venturi Fertigation tests passed!'
);
