/**
 * @file FleetPerformanceLog.js
 * @description Mongoose model for Fleet Logistics Performance & Turnaround Telemetry
 * Captures granular trip lifecycle timestamps, turnaround bottlenecks, fuel efficiency metrics,
 * and driver eco-behavioral telemetry across Nigerian agro-freight corridors.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const VEHICLE_TYPES = [
  'MOTORCYCLE_CARGO_200KG',
  'VAN_1_TON',
  'LIGHT_TRUCK_3_TON',
  'MEDIUM_TRUCK_8_TON',
  'REFRIGERATED_REEFER_15_TON',
  'HEAVY_HAULER_30_TON',
  'ARTICULATED_FLATBED_40_TON'
];

const PERFORMANCE_STATUSES = [
  'INITIALIZED',
  'IN_TRANSIT',
  'ARRIVED_DESTINATION',
  'OFFLOADED',
  'AUDITED_COMPLIANT',
  'AUDITED_EXCEPTION',
  'ARCHIVED'
];

const FleetPerformanceLogSchema = new mongoose.Schema(
  {
    logTrackingNumber: {
      type: String,
      unique: true,
      index: true
    },
    waybillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Waybill',
      required: false,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
      index: true
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: false,
      index: true
    },
    carrierOrganization: {
      type: String,
      trim: true,
      default: 'Independent Owner-Operator'
    },
    vehicleRegNumber: {
      type: String,
      required: [true, 'Vehicle registration number is required'],
      trim: true,
      uppercase: true,
      index: true
    },
    vehicleType: {
      type: String,
      enum: VEHICLE_TYPES,
      default: 'MEDIUM_TRUCK_8_TON'
    },
    corridorId: {
      type: String,
      trim: true,
      default: 'COR-GEN-99'
    },
    corridorName: {
      type: String,
      trim: true,
      default: 'General Agro-Logistics Corridor'
    },
    origin: {
      facilityName: { type: String, trim: true, default: 'Farm Gate / Aggregation Hub' },
      state: { type: String, required: true, trim: true, uppercase: true },
      lga: { type: String, trim: true },
      scheduledDeparture: { type: Date },
      actualDeparture: { type: Date }
    },
    destination: {
      facilityName: { type: String, trim: true, default: 'Wholesale Depot / Processing Terminal' },
      state: { type: String, required: true, trim: true, uppercase: true },
      lga: { type: String, trim: true },
      scheduledArrival: { type: Date },
      actualArrival: { type: Date }
    },
    commodityDetails: {
      commodityName: { type: String, trim: true, default: 'General Produce' },
      tonnageCarriedTonnes: { type: Number, required: true, min: 0.05, default: 1.0 },
      temperatureControlled: { type: Boolean, default: false },
      requiredTemperatureMin: { type: Number, default: 4 },
      requiredTemperatureMax: { type: Number, default: 12 }
    },
    lifecycleTimestamps: {
      gateInOrigin: { type: Date },
      loadingStarted: { type: Date },
      loadingCompleted: { type: Date },
      departureOrigin: { type: Date },
      borderCheckpointDelayMinutes: { type: Number, default: 0, min: 0 },
      gateInDestination: { type: Date },
      docksideInspectionStarted: { type: Date },
      docksideInspectionCompleted: { type: Date },
      offloadingStarted: { type: Date },
      offloadingCompleted: { type: Date },
      gateOutDestination: { type: Date }
    },
    turnaroundDurationsMinutes: {
      originLoadingTime: { type: Number, default: 0, min: 0 },
      transitTime: { type: Number, default: 0, min: 0 },
      docksideInspectionTime: { type: Number, default: 0, min: 0 },
      destinationOffloadingTime: { type: Number, default: 0, min: 0 },
      totalTurnaroundTime: { type: Number, default: 0, min: 0 },
      scheduledTransitTime: { type: Number, default: 0, min: 0 },
      transitDelayMinutes: { type: Number, default: 0 }
    },
    fuelAndEnergyTelemetry: {
      initialFuelLevelLitres: { type: Number, default: 0, min: 0 },
      refueledLitresDuringTrip: { type: Number, default: 0, min: 0 },
      finalFuelLevelLitres: { type: Number, default: 0, min: 0 },
      fuelConsumedLitres: { type: Number, default: 0, min: 0 },
      totalDistanceCoveredKm: { type: Number, required: true, min: 1.0, default: 50.0 },
      fuelEfficiencyKmPerLitre: { type: Number, default: 0, min: 0 },
      litresPerTonKm: { type: Number, default: 0, min: 0 },
      fuelCostNgn: { type: Number, default: 0, min: 0 },
      estimatedCo2EmissionsKg: { type: Number, default: 0, min: 0 }
    },
    ecoDrivingScorecard: {
      hardBrakingEventsCount: { type: Number, default: 0, min: 0 },
      rapidAccelerationCount: { type: Number, default: 0, min: 0 },
      excessiveIdlingDurationMinutes: { type: Number, default: 0, min: 0 },
      speedingExcursionsCount: { type: Number, default: 0, min: 0 },
      ecoDrivingScore: { type: Number, default: 85, min: 0, max: 100 },
      ecoTier: {
        type: String,
        enum: ['GREEN_CHAMPION', 'EFFICIENT_OPERATOR', 'MODERATE_EFFICIENCY', 'POOR_EFFICIENCY'],
        default: 'EFFICIENT_OPERATOR'
      }
    },
    temperatureCompliance: {
      totalExcursionMinutes: { type: Number, default: 0, min: 0 },
      maxRecordedTemperature: { type: Number },
      minRecordedTemperature: { type: Number },
      reeferIntegrityPassed: { type: Boolean, default: true }
    },
    status: {
      type: String,
      enum: PERFORMANCE_STATUSES,
      default: 'INITIALIZED',
      index: true
    },
    telemetryChecksum: {
      type: String,
      trim: true
    },
    auditedBy: {
      type: String,
      trim: true
    },
    auditNotes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * Generates unique trip tracking number: FLT-YYYYMMDD-HEX
 */
FleetPerformanceLogSchema.methods.generateTrackingNumber = function () {
  if (!this.logTrackingNumber) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.logTrackingNumber = `FLT-${dateStr}-${randHex}`;
  }
  return this.logTrackingNumber;
};

/**
 * Computes turnaround duration breakdowns in minutes
 */
FleetPerformanceLogSchema.methods.calculateTurnaroundBreakdowns = function () {
  const ts = this.lifecycleTimestamps;
  const dur = this.turnaroundDurationsMinutes;

  if (ts.loadingStarted && ts.loadingCompleted) {
    dur.originLoadingTime = Math.max(0, Math.round((new Date(ts.loadingCompleted) - new Date(ts.loadingStarted)) / 60000));
  }

  if (ts.departureOrigin && ts.gateInDestination) {
    dur.transitTime = Math.max(0, Math.round((new Date(ts.gateInDestination) - new Date(ts.departureOrigin)) / 60000));
  }

  if (ts.docksideInspectionStarted && ts.docksideInspectionCompleted) {
    dur.docksideInspectionTime = Math.max(0, Math.round((new Date(ts.docksideInspectionCompleted) - new Date(ts.docksideInspectionStarted)) / 60000));
  }

  if (ts.offloadingStarted && ts.offloadingCompleted) {
    dur.destinationOffloadingTime = Math.max(0, Math.round((new Date(ts.offloadingCompleted) - new Date(ts.offloadingStarted)) / 60000));
  }

  const startGate = ts.gateInOrigin || ts.loadingStarted || ts.departureOrigin;
  const endGate = ts.gateOutDestination || ts.offloadingCompleted || ts.gateInDestination;

  if (startGate && endGate) {
    dur.totalTurnaroundTime = Math.max(0, Math.round((new Date(endGate) - new Date(startGate)) / 60000));
  }

  if (dur.scheduledTransitTime > 0 && dur.transitTime > 0) {
    dur.transitDelayMinutes = Math.max(0, dur.transitTime - dur.scheduledTransitTime);
  }

  return dur;
};

/**
 * Computes fuel efficiency, ton-km consumption, and carbon emissions
 */
FleetPerformanceLogSchema.methods.calculateFuelAndCarbonMetrics = function (pumpPricePerLitreNgn = 950) {
  const fuel = this.fuelAndEnergyTelemetry;
  const tonnage = this.commodityDetails.tonnageCarriedTonnes || 1.0;
  const distance = fuel.totalDistanceCoveredKm || 1.0;

  if (fuel.fuelConsumedLitres <= 0 && fuel.initialFuelLevelLitres > 0) {
    const grossFuel = (fuel.initialFuelLevelLitres + fuel.refueledLitresDuringTrip) - fuel.finalFuelLevelLitres;
    fuel.fuelConsumedLitres = parseFloat(Math.max(0, grossFuel).toFixed(2));
  }

  if (fuel.fuelConsumedLitres > 0) {
    fuel.fuelEfficiencyKmPerLitre = parseFloat((distance / fuel.fuelConsumedLitres).toFixed(2));
    const tonKm = distance * tonnage;
    fuel.litresPerTonKm = parseFloat((fuel.fuelConsumedLitres / Math.max(1, tonKm)).toFixed(4));
    fuel.fuelCostNgn = Math.round(fuel.fuelConsumedLitres * pumpPricePerLitreNgn);
    // 1 Litre of diesel yields approx 2.68 kg CO2
    fuel.estimatedCo2EmissionsKg = parseFloat((fuel.fuelConsumedLitres * 2.68).toFixed(2));
  }

  return fuel;
};

/**
 * Evaluates eco-driving performance score (0-100) and assigns eco-tier
 */
FleetPerformanceLogSchema.methods.evaluateEcoDrivingScore = function () {
  const eco = this.ecoDrivingScorecard;
  const distance = this.fuelAndEnergyTelemetry.totalDistanceCoveredKm || 100;
  const distanceHundreds = Math.max(0.5, distance / 100);

  // Normalized deductions per 100km
  const hardBrakingRate = eco.hardBrakingEventsCount / distanceHundreds;
  const accelerationRate = eco.rapidAccelerationCount / distanceHundreds;
  const speedingRate = eco.speedingExcursionsCount / distanceHundreds;
  const idlingHours = eco.excessiveIdlingDurationMinutes / 60;

  let score = 100;
  score -= hardBrakingRate * 4.0;
  score -= accelerationRate * 3.5;
  score -= speedingRate * 5.0;
  score -= idlingHours * 3.0;

  eco.ecoDrivingScore = Math.max(10, Math.min(100, Math.round(score)));

  if (eco.ecoDrivingScore >= 88) {
    eco.ecoTier = 'GREEN_CHAMPION';
  } else if (eco.ecoDrivingScore >= 75) {
    eco.ecoTier = 'EFFICIENT_OPERATOR';
  } else if (eco.ecoDrivingScore >= 60) {
    eco.ecoTier = 'MODERATE_EFFICIENCY';
  } else {
    eco.ecoTier = 'POOR_EFFICIENCY';
  }

  return eco;
};

/**
 * Computes tamper-evident SHA-256 telemetry checksum
 */
FleetPerformanceLogSchema.methods.calculateTelemetryChecksum = function () {
  const payload = [
    this.logTrackingNumber,
    this.vehicleRegNumber,
    this.fuelAndEnergyTelemetry.totalDistanceCoveredKm,
    this.fuelAndEnergyTelemetry.fuelConsumedLitres,
    this.turnaroundDurationsMinutes.totalTurnaroundTime,
    this.ecoDrivingScorecard.ecoDrivingScore,
    this.status
  ].join('|');

  this.telemetryChecksum = crypto.createHash('sha256').update(payload).digest('hex');
  return this.telemetryChecksum;
};

FleetPerformanceLogSchema.pre('validate', function (next) {
  this.generateTrackingNumber();
  this.calculateTurnaroundBreakdowns();
  this.calculateFuelAndCarbonMetrics();
  this.evaluateEcoDrivingScore();
  this.calculateTelemetryChecksum();
  next();
});

module.exports = mongoose.model('FleetPerformanceLog', FleetPerformanceLogSchema);
