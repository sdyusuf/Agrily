/**
 * ==============================================================================
 * ⚙️ AGRILY SPRINT 23: SMART SOLAR/VFD PUMP & SOLENOID VALVE RELAY NODE SCHEMA
 * ==============================================================================
 *
 * Models IoT-actuated submersible borehole pumps, surface centrifugal booster
 * pumps, and LoRaWAN / Modbus RS-485 latching solenoid manifold valves with
 * Hazen-Williams hydraulic telemetry and dry-run cavitation protection interlocks.
 *
 * @module models/SmartPumpRelayNode
 */

const mongoose = require('mongoose');

const HydraulicTelemetrySubSchema = new mongoose.Schema(
  {
    flowRateCubicMetersPerHour: { type: Number, min: 0, max: 1200, default: 68.5 },
    staticSuctionLiftMeters: { type: Number, min: 0, max: 180, default: 18.0 },
    dischargePressureBar: { type: Number, min: 0, max: 16, default: 2.8 },
    pipeFrictionHeadLossMeters: { type: Number, min: 0, max: 60, default: 4.6 },
    totalDynamicHeadMeters: {
      type: Number,
      default: function () {
        const lift = this.staticSuctionLiftMeters ?? 18.0;
        const pBar = this.dischargePressureBar ?? 2.8;
        const friction = this.pipeFrictionHeadLossMeters ?? 4.6;
        return Number((lift + pBar * 10.197 + friction).toFixed(2));
      },
    },
  },
  { _id: false }
);

const SafetyInterlocksSubSchema = new mongoose.Schema(
  {
    boreholeDrawdownSensorOk: { type: Boolean, default: true },
    suctionStrainerDiffPressureOk: { type: Boolean, default: true },
    pipelineBurstLowPressureTripped: { type: Boolean, default: false },
    dryRunCavitationTripped: { type: Boolean, default: false },
    interlockClearToEnergize: {
      type: Boolean,
      default: function () {
        return (
          this.boreholeDrawdownSensorOk !== false &&
          this.suctionStrainerDiffPressureOk !== false &&
          !this.pipelineBurstLowPressureTripped &&
          !this.dryRunCavitationTripped
        );
      },
    },
  },
  { _id: false }
);

const SmartPumpRelayNodeSchema = new mongoose.Schema(
  {
    relayNodeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: function () {
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `PMP-RLY-${rand}`;
      },
    },
    stationName: {
      type: String,
      required: true,
      trim: true,
      default: 'Kura Canal Solar VFD Booster Station #02',
    },
    powerSourceType: {
      type: String,
      enum: [
        'SOLAR_PV_MPPT_VFD',
        'HYBRID_SOLAR_BATTERY_GRID',
        'DIESEL_CENTRIFUGAL_SET',
      ],
      default: 'SOLAR_PV_MPPT_VFD',
    },
    pumpRatedPowerKw: {
      type: Number,
      required: true,
      min: 0.5,
      max: 250,
      default: 15.0,
    },
    pumpEfficiencyEta: {
      type: Number,
      min: 0.4,
      max: 0.92,
      default: 0.74,
    },
    motorEfficiencyEta: {
      type: Number,
      min: 0.7,
      max: 0.98,
      default: 0.91,
    },
    hydraulicTelemetry: {
      type: HydraulicTelemetrySubSchema,
      default: () => ({}),
    },
    safetyInterlocks: {
      type: SafetyInterlocksSubSchema,
      default: () => ({}),
    },
    relayContactorState: {
      type: String,
      enum: [
        'ENERGIZED_PUMPING',
        'STANDBY_READY',
        'FERTIGATION_VENTURI_DOSING',
        'SAFETY_INTERLOCK_TRIPPED',
      ],
      default: function () {
        const s = this.safetyInterlocks || {};
        if (s.pipelineBurstLowPressureTripped || s.dryRunCavitationTripped) {
          return 'SAFETY_INTERLOCK_TRIPPED';
        }
        return 'ENERGIZED_PUMPING';
      },
    },
    solenoidManifoldValves: [
      {
        valveId: { type: String, required: true },
        blockName: { type: String, required: true },
        positionState: {
          type: String,
          enum: ['OPEN_FLOWING', 'CLOSED_LATCHED', 'MODULATING_PRESSURE_REG'],
          default: 'OPEN_FLOWING',
        },
        targetRuntimeMinutes: { type: Number, default: 180 },
        elapsedRuntimeMinutes: { type: Number, default: 65 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = {
  SmartPumpRelayNode:
    mongoose.models.SmartPumpRelayNode ||
    mongoose.model('SmartPumpRelayNode', SmartPumpRelayNodeSchema),
};
