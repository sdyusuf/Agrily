/**
 * ==============================================================================
 * ⚡ AGRILY SPRINT 23: HAZEN-WILLIAMS PUMP HYDRAULICS & SMART RELAY SERVICE
 * ==============================================================================
 *
 * Computes:
 *  1. Hazen-Williams Pipeline Friction Loss (SI Units):
 *       h_f = 10.67 * L * (Q_m3s ^ 1.852) / ( (C ^ 1.852) * (D_m ^ 4.8704) )
 *  2. Total Dynamic Head (TDH), Hydraulic Power (kW), Shaft Brake Power (kW),
 *     and Solar PV MPPT Array vs. Diesel Pump Energy Cost Comparison.
 *  3. Safety-Interlocked Solenoid Valve & Contactor Relay State Machine.
 *
 * @module services/smartPumpHydraulicsAndRelayService
 */

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function roundTo(val, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Computes Hazen-Williams pipeline friction head loss, Total Dynamic Head (TDH),
 * pump shaft power (kW), solar PV array demand, and pumping runtime hours.
 */
function computeSmartPumpHydraulicsAndEnergy(params = {}) {
  const flowRateM3PerHour = clamp(Number(params.flowRateM3PerHour ?? 65.0), 2.0, 900.0);
  const pipeLengthMeters = clamp(Number(params.pipeLengthMeters ?? 420.0), 10.0, 5000.0);
  const pipeInnerDiameterMm = clamp(
    Number(params.pipeInnerDiameterMm ?? 110.0),
    25.0,
    500.0
  );
  const hazenWilliamsCoeffC = clamp(
    Number(params.hazenWilliamsCoeffC ?? 145), // HDPE / uPVC smooth pipe C = 145-150
    80,
    155
  );
  const staticSuctionLiftMeters = clamp(
    Number(params.staticSuctionLiftMeters ?? 18.5),
    0.0,
    160.0
  );
  const emitterOperatingPressureBar = clamp(
    Number(params.emitterOperatingPressureBar ?? 2.2),
    0.5,
    8.5
  );
  const requiredWaterVolumeM3 = Math.max(
    10,
    Number(params.requiredWaterVolumeM3 ?? 540)
  );
  const pumpEfficiencyEta = clamp(Number(params.pumpEfficiencyEta ?? 0.74), 0.45, 0.90);
  const motorEfficiencyEta = clamp(
    Number(params.motorEfficiencyEta ?? 0.91),
    0.75,
    0.97
  );

  // Convert Q to m^3/s and D to meters for SI Hazen-Williams equation
  const flowM3s = flowRateM3PerHour / 3600;
  const diameterMeters = pipeInnerDiameterMm / 1000;

  const mainLineFrictionLossM =
    (10.67 * pipeLengthMeters * Math.pow(flowM3s, 1.852)) /
    (Math.pow(hazenWilliamsCoeffC, 1.852) * Math.pow(diameterMeters, 4.8704));

  // Add 15% minor losses for fittings, check valves, hydrocyclone & screen filters
  const totalFrictionHeadLossM = mainLineFrictionLossM * 1.15;
  const pressureHeadMeters = emitterOperatingPressureBar * 10.197;
  const totalDynamicHeadMeters =
    staticSuctionLiftMeters + pressureHeadMeters + totalFrictionHeadLossM;

  // Hydraulic Power P_hyd (kW) = (rho * g * Q_m3h * TDH) / 3.6e6 = (Q_m3h * TDH) / 367.2
  const hydraulicPowerKw =
    (flowRateM3PerHour * totalDynamicHeadMeters) / 367.2;
  const wireToWaterEfficiency = pumpEfficiencyEta * motorEfficiencyEta;
  const electricalInputPowerKw = hydraulicPowerKw / wireToWaterEfficiency;

  // Solar PV array sizing (with 1.28 thermal & inverter derating factor)
  const recommendedSolarPvArrayKwp = electricalInputPowerKw * 1.28;

  const pumpingDurationHours = requiredWaterVolumeM3 / flowRateM3PerHour;
  const totalEnergyKwh = electricalInputPowerKw * pumpingDurationHours;

  // Equivalent diesel consumption (0.28 L/kWh specific fuel consumption)
  const equivalentDieselLiters = totalEnergyKwh * 0.28;
  const dieselFuelCostSavedNgn = Math.round(equivalentDieselLiters * 1350);

  return {
    flowRateM3PerHour: roundTo(flowRateM3PerHour, 1),
    pipeLengthMeters: roundTo(pipeLengthMeters, 1),
    pipeInnerDiameterMm: roundTo(pipeInnerDiameterMm, 1),
    totalFrictionHeadLossM: roundTo(totalFrictionHeadLossM, 2),
    pressureHeadMeters: roundTo(pressureHeadMeters, 2),
    totalDynamicHeadMeters: roundTo(totalDynamicHeadMeters, 2),
    hydraulicPowerKw: roundTo(hydraulicPowerKw, 2),
    electricalInputPowerKw: roundTo(electricalInputPowerKw, 2),
    recommendedSolarPvArrayKwp: roundTo(recommendedSolarPvArrayKwp, 2),
    pumpingDurationHours: roundTo(pumpingDurationHours, 2),
    totalEnergyKwh: roundTo(totalEnergyKwh, 1),
    equivalentDieselLiters: roundTo(equivalentDieselLiters, 1),
    dieselFuelCostSavedNgn,
  };
}

/**
 * Evaluates safety interlocks and dispatches a command to a smart pump relay node.
 */
function executeSmartPumpRelayCommand(params = {}) {
  const relayNodeCode = String(params.relayNodeCode || 'PMP-RLY-1001');
  const commandAction = String(params.commandAction || 'ENERGIZE_PUMP').toUpperCase();
  const targetRuntimeMinutes = clamp(
    Number(params.targetRuntimeMinutes ?? 180),
    5,
    1440
  );
  const boreholeDrawdownOk = params.boreholeDrawdownOk !== false;
  const filterDifferentialPressureBar = Number(
    params.filterDifferentialPressureBar ?? 0.28
  );
  const dischargePressureBar = Number(params.dischargePressureBar ?? 2.6);

  if (!boreholeDrawdownOk) {
    return {
      relayNodeCode,
      commandAccepted: false,
      newContactorState: 'SAFETY_INTERLOCK_TRIPPED',
      faultReason: 'LOW_WELL_WATER_LEVEL_CAVITATION_LOCKOUT',
      targetRuntimeMinutes: 0,
    };
  }

  if (filterDifferentialPressureBar > 0.75) {
    return {
      relayNodeCode,
      commandAccepted: false,
      newContactorState: 'SAFETY_INTERLOCK_TRIPPED',
      faultReason: 'DISC_FILTER_CLOGGED_BACKFLUSH_REQUIRED',
      targetRuntimeMinutes: 0,
    };
  }

  if (commandAction === 'EMERGENCY_STOP' || commandAction === 'DE_ENERGIZE') {
    return {
      relayNodeCode,
      commandAccepted: true,
      newContactorState: 'STANDBY_READY',
      faultReason: null,
      targetRuntimeMinutes: 0,
    };
  }

  const newContactorState =
    commandAction === 'FERTIGATION_PULSE'
      ? 'FERTIGATION_VENTURI_DOSING'
      : 'ENERGIZED_PUMPING';

  return {
    relayNodeCode,
    commandAccepted: true,
    newContactorState,
    dischargePressureBar: roundTo(dischargePressureBar, 2),
    filterDifferentialPressureBar: roundTo(filterDifferentialPressureBar, 2),
    faultReason: null,
    targetRuntimeMinutes,
  };
}

module.exports = {
  computeSmartPumpHydraulicsAndEnergy,
  executeSmartPumpRelayCommand,
};
