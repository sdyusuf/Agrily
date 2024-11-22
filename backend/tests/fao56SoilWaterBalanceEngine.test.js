const assert = require('assert');
const {
  SOIL_HYDRAULIC_PROFILES,
  IRRIGATED_CROP_FAO56_CATALOG,
  computeVanGenuchtenMoistureFromSuction,
  evaluateFao56RootZoneSchedule,
  simulateSevenDayIrrigationLedger,
} = require('../services/fao56SoilWaterBalanceEngine');
const {
  computeSmartPumpHydraulicsAndEnergy,
  executeSmartPumpRelayCommand,
} = require('../services/smartPumpHydraulicsAndRelayService');

console.log('🧪 Starting Sprint 23 FAO-56 Root-Zone Water Balance, Van Genuchten & Pump Hydraulics Unit Tests...');

// 1. Verify catalogs
assert.strictEqual(Object.keys(SOIL_HYDRAULIC_PROFILES).length, 6);
assert.strictEqual(Object.keys(IRRIGATED_CROP_FAO56_CATALOG).length, 9);

// 2. Verify Van Genuchten SWRC monotonicity (higher suction kPa -> lower volumetric moisture %)
const wetSuction = computeVanGenuchtenMoistureFromSuction({
  textureKey: 'SANDY_CLAY_LOAM',
  matricSuctionKpa: 15.0,
});
const drySuction = computeVanGenuchtenMoistureFromSuction({
  textureKey: 'SANDY_CLAY_LOAM',
  matricSuctionKpa: 120.0,
});
assert(
  wetSuction.volumetricMoisturePct > drySuction.volumetricMoisturePct,
  'Expected lower matric suction (15 kPa) to correspond to higher volumetric moisture than 120 kPa'
);
console.log('  ✓ Van Genuchten soil water retention curve theta(psi) verified');

// 3. Verify FAO-56 Dual Kc root-zone water balance & Ks stress response
const adequateSchedule = evaluateFao56RootZoneSchedule({
  cropKey: 'MAIZE',
  textureKey: 'SANDY_CLAY_LOAM',
  currentMoistureVolPct: 27.5,
  commandAreaHectares: 12.0,
});
assert.strictEqual(adequateSchedule.waterStressCoeffKs, 1.0);
assert.strictEqual(adequateSchedule.triggerDecision, 'HOLD_IRRIGATION_ADEQUATE_MOISTURE');

const depletedSchedule = evaluateFao56RootZoneSchedule({
  cropKey: 'MAIZE',
  textureKey: 'SANDY_CLAY_LOAM',
  currentMoistureVolPct: 18.0,
  commandAreaHectares: 12.0,
});
assert(depletedSchedule.waterStressCoeffKs < 1.0, 'Expected Ks < 1.0 when Dr > RAW');
assert(depletedSchedule.grossIrrigationDepthMm > depletedSchedule.netIrrigationDepthMm);
assert.strictEqual(depletedSchedule.triggerDecision, 'ACTIVATE_SMART_PUMP_RELAY_CYCLE');
console.log('  ✓ FAO-56 Dual Kc root-zone depletion, Ks stress scalar, and trigger decision verified');

// 4. Verify 7-day rolling irrigation ledger
const ledger7d = simulateSevenDayIrrigationLedger({
  cropKey: 'TOMATO',
  textureKey: 'LOAM',
  currentMoistureVolPct: 18.5,
});
assert.strictEqual(ledger7d.dailyLedger.length, 7);
assert(ledger7d.totalAppliedIrrigationMm > 0, 'Expected automatic refill irrigation during 7-day dry spell');
console.log('  ✓ 7-day rolling FAO-56 soil water balance & auto-refill verified');

// 5. Verify Hazen-Williams hydraulics and safety-interlocked relay state machine
const smallPipe = computeSmartPumpHydraulicsAndEnergy({
  flowRateM3PerHour: 65,
  pipeLengthMeters: 400,
  pipeInnerDiameterMm: 75,
});
const largePipe = computeSmartPumpHydraulicsAndEnergy({
  flowRateM3PerHour: 65,
  pipeLengthMeters: 400,
  pipeInnerDiameterMm: 140,
});
assert(
  smallPipe.totalFrictionHeadLossM > largePipe.totalFrictionHeadLossM,
  'Expected smaller 75mm pipe to incur higher Hazen-Williams friction loss than 140mm pipe'
);

const relayOk = executeSmartPumpRelayCommand({
  relayNodeCode: 'PMP-RLY-1001',
  commandAction: 'ENERGIZE_PUMP',
  boreholeDrawdownOk: true,
  filterDifferentialPressureBar: 0.25,
});
assert.strictEqual(relayOk.commandAccepted, true);
assert.strictEqual(relayOk.newContactorState, 'ENERGIZED_PUMPING');

const relayLockout = executeSmartPumpRelayCommand({
  relayNodeCode: 'PMP-RLY-1001',
  commandAction: 'ENERGIZE_PUMP',
  boreholeDrawdownOk: false,
});
assert.strictEqual(relayLockout.commandAccepted, false);
assert.strictEqual(relayLockout.newContactorState, 'SAFETY_INTERLOCK_TRIPPED');
console.log('  ✓ Hazen-Williams friction hydraulics and dry-run safety interlock verified');

console.log('✅ All Sprint 23 FAO-56 Root-Zone Water Balance, Van Genuchten & Pump Hydraulics tests passed!');
