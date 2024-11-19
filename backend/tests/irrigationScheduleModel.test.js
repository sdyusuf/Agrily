const assert = require('assert');
const { IrrigationZoneSchedule } = require('../models/IrrigationZoneSchedule');
const { SmartPumpRelayNode } = require('../models/SmartPumpRelayNode');
const { TensiometerSensorPod } = require('../models/TensiometerSensorPod');

console.log('🧪 Starting Sprint 23 IrrigationZoneSchedule, SmartPumpRelayNode & TensiometerSensorPod Schema Tests...');

// 1. Validate IrrigationZoneSchedule FAO-56 TAW, RAW, depletion Dr, and trigger state
const schedule = new IrrigationZoneSchedule({
  zoneCode: 'ZNE-KRIP-04',
  zoneName: 'Kano River Sector 4',
  stateCode: 'KN',
  cropKey: 'MAIZE',
  commandAreaHectares: 15.0,
  irrigationSystemType: 'SURFACE_DRIP_EMITTER',
  applicationEfficiencyFractionEa: 0.90,
  rootZoneBalance: {
    fieldCapacityVolPct: 30.0,
    wiltingPointVolPct: 14.0,
    currentVolumetricMoisturePct: 19.0,
    effectiveRootDepthMetersZr: 1.0,
    managementAllowedDepletionFractionP: 0.50,
  },
});

const schedErr = schedule.validateSync();
assert.strictEqual(schedErr, undefined, 'Expected IrrigationZoneSchedule to validate cleanly');
assert(schedule.scheduleCode.startsWith('IRR-2024-'), 'Expected IRR-2024- prefix');
assert.strictEqual(schedule.rootZoneBalance.totalAvailableWaterMmTaw, 160.0);
assert.strictEqual(schedule.rootZoneBalance.readilyAvailableWaterMmRaw, 80.0);
assert.strictEqual(schedule.rootZoneBalance.currentRootZoneDepletionMmDr, 110.0);
assert.strictEqual(schedule.irrigationTriggerState, 'TRIGGER_IRRIGATION_CYCLE_NOW');
console.log('  ✓ IrrigationZoneSchedule computes TAW (160mm), RAW (80mm), Dr (110mm), and TRIGGER_IRRIGATION_CYCLE_NOW');

// 2. Validate SmartPumpRelayNode total dynamic head (TDH) and safety interlocks
const pumpNode = new SmartPumpRelayNode({
  stationName: 'Hadejia Solar Borehole Relay #01',
  pumpRatedPowerKw: 18.5,
  hydraulicTelemetry: {
    flowRateCubicMetersPerHour: 75.0,
    staticSuctionLiftMeters: 20.0,
    dischargePressureBar: 3.0,
    pipeFrictionHeadLossMeters: 5.4,
  },
  safetyInterlocks: {
    boreholeDrawdownSensorOk: true,
    suctionStrainerDiffPressureOk: true,
    pipelineBurstLowPressureTripped: false,
    dryRunCavitationTripped: false,
  },
});

const pumpErr = pumpNode.validateSync();
assert.strictEqual(pumpErr, undefined, 'Expected SmartPumpRelayNode to validate cleanly');
assert(pumpNode.relayNodeCode.startsWith('PMP-RLY-'), 'Expected PMP-RLY- prefix');
assert(pumpNode.hydraulicTelemetry.totalDynamicHeadMeters > 55, 'Expected TDH > 55m');
assert.strictEqual(pumpNode.safetyInterlocks.interlockClearToEnergize, true);
assert.strictEqual(pumpNode.relayContactorState, 'ENERGIZED_PUMPING');
console.log('  ✓ SmartPumpRelayNode computes Total Dynamic Head (TDH) and safety interlock clearance');

// 3. Validate TensiometerSensorPod weighted matric suction and FAO-29 salinity leaching requirement
const pod = new TensiometerSensorPod({
  zoneCode: 'ZNE-KRIP-04',
  soilTextureClass: 'SANDY_CLAY_LOAM',
  irrigationWaterEcDsm: 1.1,
  cropSalinityThresholdEcDsm: 1.7,
});

const podErr = pod.validateSync();
assert.strictEqual(podErr, undefined, 'Expected TensiometerSensorPod to validate cleanly');
assert(pod.podCode.startsWith('TNS-POD-'), 'Expected TNS-POD- prefix');
assert(pod.rootZoneWeightedSuctionKpa > 30, 'Expected weighted matric suction > 30 kPa');
assert(pod.leachingRequirementFractionLr > 0.1, 'Expected positive salinity leaching fraction LR');
console.log('  ✓ TensiometerSensorPod computes multi-depth matric suction and FAO-29 salinity leaching fraction');

console.log('✅ All Sprint 23 IrrigationZoneSchedule, SmartPumpRelayNode & TensiometerSensorPod schema tests passed!');
