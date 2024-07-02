/**
 * ==============================================================================
 * AGRILY AGRICULTURAL LOGISTICS PLATFORM - ROUTE OPTIMIZATION DOMAIN MODEL
 * ==============================================================================
 * 
 * Module Description:
 * This module defines the comprehensive Mongoose schema and model for multi-stop
 * agricultural produce pickup and delivery dispatch routes. In rural smallholder
 * supply chains across West Africa, farm-to-market haulage must navigate distributed
 * farm-gate collection points, stringent produce perishability time-windows,
 * commercial vehicle payload constraints (gross weight and crate volume), and
 * unpaved rural feeder road conditions.
 * 
 * Supply Chain Domain Principles:
 *  1. Multi-Tier Perishability Management:
 *     - HIGH: Tomatoes, leafy greens, berries, fresh herbs (max 3-4 hours ambient transit).
 *     - MEDIUM: Peppers, cucumbers, citrus, plantains (max 8-12 hours ambient transit).
 *     - LOW: Grains, tubers, onions, pulses (multi-day ambient stability).
 *  2. Vehicle Payload & Volumetric Safeguards:
 *     - Overloaded freight vehicles cause dangerous breakdowns on unpaved rural roads.
 *     - Model enforces strict limits on total cumulative payload weight (kg) and
 *       volumetric crate capacities.
 *  3. Agricultural Carbon Footprint & Fuel Telemetry:
 *     - Tracks estimated fuel consumption (liters of diesel) and carbon dioxide emissions
 *       (kg CO2e) based on vehicle gross tonnage and road gradient approximations.
 *  4. Chain-of-Custody Proof of Collection:
 *     - At each farm-gate stop, drivers record verified crate counts, quality inspection
 *       sign-offs, and geostamped photo verification before advancing the route.
 * 
 * @module models/OptimizedRoute
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * Supported produce perishability tiers governing transit urgency and routing order.
 * @constant {string[]}
 */
const PERISHABILITY_TIERS = [
  'HIGH',     // Highly perishable: requires priority pickup or active cold-chain
  'MEDIUM',   // Moderately perishable: standard fresh produce transit
  'LOW'       // Shelf-stable: grains, tubers, pulses
];

/**
 * Permitted stop classification types along an agricultural logistics itinerary.
 * @constant {string[]}
 */
const STOP_TYPES = [
  'PICKUP_FARM',         // Farm-gate produce collection point
  'INTERMEDIATE_DEPOT',  // Regional sorting, grading, or cold-aggregation hub
  'DELIVERY_MARKET',     // Terminal wholesale market or buyer distribution center
  'REFUEL_MAINTENANCE'   // Commercial waypoint for fueling or vehicle check
];

/**
 * Granular lifecycle states for individual collection and delivery stops.
 * @constant {string[]}
 */
const STOP_STATUSES = [
  'PENDING',    // Scheduled stop awaiting driver arrival
  'EN_ROUTE',   // Driver currently navigating toward this waypoint
  'ARRIVED',    // Driver on-site at farm gate or warehouse dock
  'LOADING',    // Cargo loading, crate counting, or inspection underway
  'COLLECTED',  // Produce successfully loaded into vehicle cargo hold
  'DELIVERED',  // Cargo offloaded at terminal market destination
  'SKIPPED',    // Stop bypassed due to farmer cancellation or impassable road
  'FAILED'      // Delivery or collection aborted (produce rejected or absent)
];

/**
 * Route-level dispatch lifecycle state machine.
 * @constant {string[]}
 */
const ROUTE_LIFECYCLE_STATUSES = [
  'DRAFT',        // Initial collection stops added; awaiting optimization solver
  'OPTIMIZED',    // Heuristic 2-opt solver completed; stop sequence ordered
  'DISPATCHED',   // Route assigned to driver; driver alerted on mobile device
  'IN_PROGRESS',  // Driver actively servicing stops along the itinerary
  'COMPLETED',    // All scheduled stops serviced and cargo delivered
  'CANCELLED',    // Route aborted prior to departure
  'DISRUPTED'     // Severe road washout, breakdown, or security disruption
];

/**
 * Standard road surface classification influencing speed and fuel consumption models.
 * @constant {string[]}
 */
const ROAD_SURFACE_TYPES = [
  'PAVED_HIGHWAY',     // Interstate paved dual carriageway (1.0x baseline factor)
  'SECONDARY_ASPHALT', // State paved road with occasional potholes (1.15x factor)
  'UNPAVED_LATERITE',  // Graded dirt or laterite rural feeder road (1.40x factor)
  'RURAL_EARTH_TRACK'  // Rugged farm track, impassable in heavy rain (1.75x factor)
];

/**
 * Schema defining GeoJSON point coordinates with latitude and longitude constraints.
 */
const GeoPointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude] per GeoJSON RFC 7946 standard
    required: [true, 'GeoJSON coordinates are required'],
    validate: {
      validator: function(coords) {
        if (!Array.isArray(coords) || coords.length !== 2) return false;
        const [lng, lat] = coords;
        return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
      },
      message: 'Coordinates must be valid [longitude, latitude] within [-180..180, -90..90]'
    }
  }
}, { _id: false });

/**
 * Schema defining operational depot or hub origin/destination properties.
 */
const DepotLocationSchema = new mongoose.Schema({
  depotName: {
    type: String,
    required: [true, 'Depot name is required'],
    trim: true,
    maxlength: 120
  },
  facilityCode: {
    type: String,
    required: [true, 'Facility code is required'],
    trim: true,
    uppercase: true,
    maxlength: 30
  },
  address: {
    type: String,
    required: [true, 'Depot physical address is required'],
    trim: true,
    maxlength: 250
  },
  city: {
    type: String,
    required: [true, 'Depot city is required'],
    trim: true,
    maxlength: 80
  },
  state: {
    type: String,
    required: [true, 'Depot state/province is required'],
    trim: true,
    maxlength: 80
  },
  country: {
    type: String,
    default: 'Nigeria',
    trim: true,
    maxlength: 80
  },
  contactPerson: {
    type: String,
    required: [true, 'Depot manager or contact person is required'],
    trim: true
  },
  contactPhone: {
    type: String,
    required: [true, 'Depot contact telephone number is required'],
    trim: true
  },
  operatingHours: {
    openingTime: { type: String, default: '06:00' }, // HH:mm format
    closingTime: { type: String, default: '20:00' }  // HH:mm format
  },
  location: {
    type: GeoPointSchema,
    required: [true, 'Depot GeoJSON coordinates are required']
  }
}, { _id: false });

/**
 * Produce Cargo Sub-Schema detailing agricultural consignments collected at a stop.
 */
const ProducePayloadSubSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  orderNumber: {
    type: String,
    trim: true,
    default: ''
  },
  produceName: {
    type: String,
    required: [true, 'Produce commodity name is required'],
    trim: true,
    maxlength: 100
  },
  produceCategory: {
    type: String,
    required: [true, 'Produce category is required'],
    trim: true,
    maxlength: 60
  },
  weightKg: {
    type: Number,
    required: [true, 'Produce consignment weight in kg is required'],
    min: [0.1, 'Consignment weight must be greater than zero'],
    max: [50000, 'Consignment weight cannot exceed 50,000 kg per stop']
  },
  volumeCrates: {
    type: Number,
    default: 1,
    min: [0, 'Volume in crates cannot be negative'],
    max: [5000, 'Crates cannot exceed 5,000 per stop']
  },
  packagingType: {
    type: String,
    default: 'plastic_crate',
    enum: ['plastic_crate', 'jute_bag', 'carton_box', 'wooden_crate', 'bulk_bin', 'mesh_sack']
  },
  perishabilityTier: {
    type: String,
    required: [true, 'Perishability tier is required'],
    enum: {
      values: PERISHABILITY_TIERS,
      message: '{VALUE} is not a valid perishability tier'
    },
    default: 'MEDIUM'
  },
  requiresRefrigeration: {
    type: Boolean,
    default: false
  },
  targetTemperatureCelsius: {
    min: { type: Number, default: null },
    max: { type: Number, default: null }
  }
}, { _id: false });

/**
 * Time Window constraints governing harvest readiness and pickup deadlines.
 */
const TimeWindowSubSchema = new mongoose.Schema({
  earliestArrival: {
    type: Date,
    required: [true, 'Earliest allowable arrival timestamp is required']
  },
  latestArrival: {
    type: Date,
    required: [true, 'Latest allowable arrival timestamp (perishability deadline) is required']
  },
  estimatedLoadingMinutes: {
    type: Number,
    default: 20,
    min: [5, 'Loading time must be at least 5 minutes'],
    max: [240, 'Loading time cannot exceed 4 hours']
  },
  actualArrival: {
    type: Date,
    default: null
  },
  actualDeparture: {
    type: Date,
    default: null
  }
}, { _id: false });

/**
 * Proof of Collection sub-schema recording driver verification at farm-gate.
 */
const CollectionProofSubSchema = new mongoose.Schema({
  verifiedCratesCount: {
    type: Number,
    default: 0
  },
  verifiedWeightKg: {
    type: Number,
    default: 0
  },
  driverNotes: {
    type: String,
    trim: true,
    default: ''
  },
  farmerSignoffName: {
    type: String,
    trim: true,
    default: ''
  },
  photoUrl: {
    type: String,
    trim: true,
    default: null
  },
  recordedAt: {
    type: Date,
    default: null
  }
}, { _id: false });

/**
 * Individual Route Stop Sub-Schema representing waypoints in the TSP tour sequence.
 */
const RouteStopSchema = new mongoose.Schema({
  stopId: {
    type: String,
    required: [true, 'Unique stop identifier is required'],
    trim: true
  },
  stopSequence: {
    type: Number,
    required: [true, 'Stop sequence index is required'],
    min: [0, 'Sequence index must be non-negative']
  },
  stopType: {
    type: String,
    required: [true, 'Stop type classification is required'],
    enum: {
      values: STOP_TYPES,
      message: '{VALUE} is not a valid stop type'
    },
    default: 'PICKUP_FARM'
  },
  locationName: {
    type: String,
    required: [true, 'Location name or farm name is required'],
    trim: true,
    maxlength: 150
  },
  contactName: {
    type: String,
    required: [true, 'Stop contact person name is required'],
    trim: true,
    maxlength: 100
  },
  contactPhone: {
    type: String,
    required: [true, 'Stop contact telephone number is required'],
    trim: true,
    maxlength: 30
  },
  address: {
    type: String,
    required: [true, 'Physical road or farm-gate description is required'],
    trim: true,
    maxlength: 250
  },
  lga: {
    type: String,
    trim: true,
    default: ''
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: 80
  },
  location: {
    type: GeoPointSchema,
    required: [true, 'Stop geographic coordinates are required']
  },
  roadSurface: {
    type: String,
    enum: ROAD_SURFACE_TYPES,
    default: 'SECONDARY_ASPHALT'
  },
  producePayload: {
    type: ProducePayloadSubSchema,
    required: [true, 'Produce payload specifications are required']
  },
  timeWindow: {
    type: TimeWindowSubSchema,
    required: [true, 'Time window constraints are required']
  },
  status: {
    type: String,
    enum: {
      values: STOP_STATUSES,
      message: '{VALUE} is not a recognized stop status'
    },
    default: 'PENDING'
  },
  collectionProof: {
    type: CollectionProofSubSchema,
    default: () => ({})
  },
  cumulativeDistanceKm: {
    type: Number,
    default: 0,
    min: 0
  },
  estimatedArrival: {
    type: Date,
    default: null
  },
  delayMinutes: {
    type: Number,
    default: 0
  }
}, { _id: false });

/**
 * Route Telemetry and Aggregated Performance Metrics Schema.
 */
const RouteMetricsSchema = new mongoose.Schema({
  totalDistanceKm: {
    type: Number,
    default: 0,
    min: [0, 'Total distance cannot be negative']
  },
  estimatedDurationMinutes: {
    type: Number,
    default: 0,
    min: [0, 'Duration cannot be negative']
  },
  actualDurationMinutes: {
    type: Number,
    default: null
  },
  totalPayloadWeightKg: {
    type: Number,
    default: 0,
    min: [0, 'Total weight payload cannot be negative']
  },
  totalPayloadVolumeCrates: {
    type: Number,
    default: 0,
    min: [0, 'Total volume crates cannot be negative']
  },
  capacityUtilizationPct: {
    type: Number,
    default: 0,
    min: [0, 'Capacity utilization cannot be negative'],
    max: [100, 'Capacity utilization cannot exceed 100%']
  },
  estimatedFuelConsumptionLiters: {
    type: Number,
    default: 0,
    min: [0, 'Estimated fuel consumption cannot be negative']
  },
  estimatedCarbonFootprintKg: {
    type: Number,
    default: 0,
    min: [0, 'Estimated carbon footprint cannot be negative']
  },
  stopsCount: {
    type: Number,
    default: 0,
    min: [0, 'Stops count cannot be negative']
  },
  completedStopsCount: {
    type: Number,
    default: 0,
    min: [0, 'Completed stops count cannot be negative']
  }
}, { _id: false });

/**
 * Master Mongoose Schema for Optimized Logistics Routes.
 */
const OptimizedRouteSchema = new mongoose.Schema({
  routeCode: {
    type: String,
    required: [true, 'Route code identifier is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  routeName: {
    type: String,
    required: [true, 'Human-readable route title is required'],
    trim: true,
    maxlength: 150
  },
  serviceRegion: {
    type: String,
    required: [true, 'Operating agricultural service region is required'],
    trim: true,
    default: 'Kaduna-Kano Produce Belt'
  },
  originDepot: {
    type: DepotLocationSchema,
    required: [true, 'Origin depot facility information is required']
  },
  destinationHub: {
    type: DepotLocationSchema,
    required: [true, 'Destination terminal hub facility information is required']
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null,
    index: true
  },
  assignedVehicle: {
    registrationNumber: { type: String, trim: true, uppercase: true, default: '' },
    vehicleType: { type: String, trim: true, default: 'box_truck' },
    maxPayloadKg: { type: Number, default: 3500, min: 100 },
    maxVolumeCrates: { type: Number, default: 120, min: 1 },
    hasRefrigeration: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: {
      values: ROUTE_LIFECYCLE_STATUSES,
      message: '{VALUE} is not a valid route status'
    },
    default: 'DRAFT',
    index: true
  },
  stops: {
    type: [RouteStopSchema],
    default: [],
    validate: {
      validator: function(stops) {
        return Array.isArray(stops);
      },
      message: 'Stops must be provided as a structured array'
    }
  },
  metrics: {
    type: RouteMetricsSchema,
    default: () => ({})
  },
  solverParameters: {
    algorithm: {
      type: String,
      default: 'TSP_NEAREST_NEIGHBOR_2OPT',
      enum: ['TSP_NEAREST_NEIGHBOR_2OPT', 'SAVINGS_CVRP', 'MANUAL_SEQUENCED']
    },
    iterationsRun: {
      type: Number,
      default: 0
    },
    optimizationTimestamp: {
      type: Date,
      default: null
    },
    executionTimeMs: {
      type: Number,
      default: 0
    }
  },
  departureScheduledAt: {
    type: Date,
    required: [true, 'Scheduled departure date and time is required']
  },
  actualDepartureAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  disruptionLog: [{
    reason: { type: String, trim: true, required: true },
    reportedBy: { type: String, trim: true, required: true },
    locationCoordinates: { type: [Number], default: [] },
    timestamp: { type: Date, default: Date.now },
    impactDescription: { type: String, trim: true, default: '' }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ------------------------------------------------------------------------------
// INDEXES & VIRTUALS
// ------------------------------------------------------------------------------

OptimizedRouteSchema.index({ status: 1, departureScheduledAt: 1 });
OptimizedRouteSchema.index({ serviceRegion: 1, status: 1 });
OptimizedRouteSchema.index({ 'originDepot.location': '2dsphere' });

/**
 * Virtual indicating whether the route is currently active on the road.
 */
OptimizedRouteSchema.virtual('isActive').get(function() {
  return this.status === 'DISPATCHED' || this.status === 'IN_PROGRESS';
});

/**
 * Virtual calculating the remaining stops count.
 */
OptimizedRouteSchema.virtual('remainingStopsCount').get(function() {
  if (!this.stops || this.stops.length === 0) return 0;
  return this.stops.filter(s => s.status === 'PENDING' || s.status === 'EN_ROUTE' || s.status === 'ARRIVED').length;
});

// ------------------------------------------------------------------------------
// STATIC UTILITY METHODS
// ------------------------------------------------------------------------------

/**
 * Calculates Great-Circle distance in kilometers between two geographic coordinates
 * using the Haversine formula.
 * 
 * @param {number} lat1 Latitude of first point in decimal degrees
 * @param {number} lon1 Longitude of first point in decimal degrees
 * @param {number} lat2 Latitude of second point in decimal degrees
 * @param {number} lon2 Longitude of second point in decimal degrees
 * @returns {number} Distance in kilometers
 */
OptimizedRouteSchema.statics.haversineDistance = function(lat1, lon1, lat2, lon2) {
  const EARTH_RADIUS_KM = 6371.0088; // Earth mean radius in kilometers
  const toRadians = deg => (deg * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((EARTH_RADIUS_KM * c).toFixed(3));
};

/**
 * Generates an automated route code with prefix, date, and random alphanumeric string.
 * Format: AGR-YYYYMMDD-XXXX
 * 
 * @returns {string} Unique route code
 */
OptimizedRouteSchema.statics.generateRouteCode = function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AGR-${year}${month}${day}-${randomSuffix}`;
};

// ------------------------------------------------------------------------------
// INSTANCE METHODS
// ------------------------------------------------------------------------------

/**
 * Recalculates all route metrics based on the current sequence of stops and vehicle specs.
 * Computes total weight, volume, capacity utilization %, total distance, duration,
 * fuel consumption, and carbon footprint.
 */
OptimizedRouteSchema.methods.recalculateMetrics = function() {
  let totalWeight = 0;
  let totalCrates = 0;
  let totalDistance = 0;
  let totalDurationMinutes = 0;

  const vehicleCapacityKg = this.assignedVehicle?.maxPayloadKg || 3500;
  const stops = this.stops || [];

  // Track coordinates for distance summation
  let prevLat = this.originDepot.location.coordinates[1];
  let prevLng = this.originDepot.location.coordinates[0];

  stops.forEach((stop, index) => {
    // Ensure 0-indexed sequential ordering
    stop.stopSequence = index;

    // Aggregate cargo payload
    const weight = stop.producePayload?.weightKg || 0;
    const crates = stop.producePayload?.volumeCrates || 0;
    totalWeight += weight;
    totalCrates += crates;

    // Distance calculation
    const stopLat = stop.location.coordinates[1];
    const stopLng = stop.location.coordinates[0];
    const segmentDistance = OptimizedRouteSchema.statics.haversineDistance(prevLat, prevLng, stopLat, stopLng);

    // Apply road surface factor
    let surfaceMultiplier = 1.0;
    if (stop.roadSurface === 'SECONDARY_ASPHALT') surfaceMultiplier = 1.15;
    else if (stop.roadSurface === 'UNPAVED_LATERITE') surfaceMultiplier = 1.40;
    else if (stop.roadSurface === 'RURAL_EARTH_TRACK') surfaceMultiplier = 1.75;

    totalDistance += segmentDistance;
    stop.cumulativeDistanceKm = Number(totalDistance.toFixed(2));

    // Estimated transit speed in rural agricultural zones: ~45 km/h avg with road adjustments
    const avgSpeedKmH = Math.max(25, 45 / surfaceMultiplier);
    const transitTimeMinutes = (segmentDistance / avgSpeedKmH) * 60;
    const loadingTimeMinutes = stop.timeWindow?.estimatedLoadingMinutes || 20;

    totalDurationMinutes += transitTimeMinutes + loadingTimeMinutes;

    prevLat = stopLat;
    prevLng = stopLng;
  });

  // Final leg to destination terminal hub
  const destLat = this.destinationHub.location.coordinates[1];
  const destLng = this.destinationHub.location.coordinates[0];
  const returnLegDistance = OptimizedRouteSchema.statics.haversineDistance(prevLat, prevLng, destLat, destLng);
  totalDistance += returnLegDistance;
  totalDurationMinutes += (returnLegDistance / 50) * 60; // 50 km/h on terminal return highway

  // Capacity utilization
  const capacityUtilization = Math.min(100, Number(((totalWeight / vehicleCapacityKg) * 100).toFixed(1)));

  // Fuel telemetry: Heavy light-commercial diesel burns ~0.24 L/km base + weight penalty
  const fuelConsumptionLiters = Number(((totalDistance * 0.24) * (1 + (totalWeight / 10000))).toFixed(2));
  // Diesel emission factor: ~2.68 kg CO2 per liter burned
  const carbonFootprintKg = Number((fuelConsumptionLiters * 2.68).toFixed(2));

  const completedStops = stops.filter(s => s.status === 'COLLECTED' || s.status === 'DELIVERED').length;

  this.metrics = {
    totalDistanceKm: Number(totalDistance.toFixed(2)),
    estimatedDurationMinutes: Math.round(totalDurationMinutes),
    actualDurationMinutes: this.metrics?.actualDurationMinutes || null,
    totalPayloadWeightKg: Number(totalWeight.toFixed(2)),
    totalPayloadVolumeCrates: Math.round(totalCrates),
    capacityUtilizationPct: capacityUtilization,
    estimatedFuelConsumptionLiters: fuelConsumptionLiters,
    estimatedCarbonFootprintKg: carbonFootprintKg,
    stopsCount: stops.length,
    completedStopsCount: completedStops
  };

  return this.metrics;
};

/**
 * Validates whether the proposed stops exceed vehicle payload constraints.
 * 
 * @returns {{ isValid: boolean, message: string, excessWeightKg: number }}
 */
OptimizedRouteSchema.methods.validateCapacity = function() {
  const maxPayload = this.assignedVehicle?.maxPayloadKg || 3500;
  const currentPayload = this.stops.reduce((sum, s) => sum + (s.producePayload?.weightKg || 0), 0);

  if (currentPayload > maxPayload) {
    const excess = currentPayload - maxPayload;
    return {
      isValid: false,
      message: `Payload overload: Proposed harvest load (${currentPayload} kg) exceeds vehicle capacity limit (${maxPayload} kg) by ${excess} kg.`,
      excessWeightKg: excess
    };
  }

  return {
    isValid: true,
    message: 'Payload within vehicle operating specifications.',
    excessWeightKg: 0
  };
};

/**
 * Transitions route status to a new lifecycle state with sanity checks.
 * 
 * @param {string} targetStatus Destination state
 * @returns {Promise<OptimizedRoute>} Updated route instance
 */
OptimizedRouteSchema.methods.advanceStatus = async function(targetStatus) {
  if (!ROUTE_LIFECYCLE_STATUSES.includes(targetStatus)) {
    throw new Error(`Invalid target route status: ${targetStatus}`);
  }

  // State machine transition guardrails
  if (targetStatus === 'DISPATCHED' && !this.assignedDriver) {
    throw new Error('Cannot dispatch route without an assigned logistics driver.');
  }

  if (targetStatus === 'IN_PROGRESS' && !this.actualDepartureAt) {
    this.actualDepartureAt = new Date();
  }

  if (targetStatus === 'COMPLETED') {
    this.completedAt = new Date();
    // Calculate actual elapsed minutes
    if (this.actualDepartureAt) {
      const elapsedMs = this.completedAt - this.actualDepartureAt;
      this.metrics.actualDurationMinutes = Math.round(elapsedMs / (1000 * 60));
    }
  }

  this.status = targetStatus;
  return this.save();
};

const OptimizedRoute = mongoose.model('OptimizedRoute', OptimizedRouteSchema);

module.exports = {
  OptimizedRoute,
  PERISHABILITY_TIERS,
  STOP_TYPES,
  STOP_STATUSES,
  ROUTE_LIFECYCLE_STATUSES,
  ROAD_SURFACE_TYPES
};
