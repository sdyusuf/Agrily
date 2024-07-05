/**
 * ==============================================================================
 * AGRILY AGRICULTURAL LOGISTICS PLATFORM - ROUTE DISPATCH REST CONTROLLER
 * ==============================================================================
 * 
 * Module Description:
 * Express router exposing endpoints for heuristic route optimization, dispatching,
 * manual stop re-sequencing, farm-gate collection proof recording, and legal cargo
 * manifests generation.
 * 
 * Endpoints:
 *  - POST   /api/routes/optimize         Run TSP/CVRP heuristic solver on unassigned stops
 *  - POST   /api/routes                  Persist a new planned route
 *  - GET    /api/routes                  Query dispatch routes with pagination & filters
 *  - GET    /api/routes/:id              Fetch single route details and metrics
 *  - PATCH  /api/routes/:id/reorder      Reorder stops with metric re-computation
 *  - PATCH  /api/routes/:id/status       Advance route lifecycle state
 *  - POST   /api/routes/:id/dispatch     Assign driver and issue dispatch cargo manifest
 *  - PATCH  /api/routes/:id/stops/:stopId Update stop collection status & proof
 *  - GET    /api/routes/:id/manifest     Retrieve official cargo manifest for transit
 * 
 * @module routes/routes
 * @requires express
 * @requires joi
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const {
  OptimizedRoute,
  PERISHABILITY_TIERS,
  STOP_TYPES,
  STOP_STATUSES,
  ROUTE_LIFECYCLE_STATUSES,
  ROAD_SURFACE_TYPES
} = require('../models/OptimizedRoute');
const { DispatchManifest } = require('../models/DispatchManifest');
const { Driver } = require('../models/Driver');
const { optimizeAgriculturalRoute } = require('../services/routeOptimizer');

// ------------------------------------------------------------------------------
// JOI VALIDATION SCHEMAS
// ------------------------------------------------------------------------------

const geoPointJoiSchema = Joi.object({
  type: Joi.string().valid('Point').default('Point'),
  coordinates: Joi.array().items(Joi.number()).length(2).required()
});

const depotLocationJoiSchema = Joi.object({
  depotName: Joi.string().trim().max(120).required(),
  facilityCode: Joi.string().trim().uppercase().max(30).required(),
  address: Joi.string().trim().max(250).required(),
  city: Joi.string().trim().max(80).required(),
  state: Joi.string().trim().max(80).required(),
  country: Joi.string().trim().default('Nigeria'),
  contactPerson: Joi.string().trim().required(),
  contactPhone: Joi.string().trim().required(),
  operatingHours: Joi.object({
    openingTime: Joi.string().default('06:00'),
    closingTime: Joi.string().default('20:00')
  }).default({ openingTime: '06:00', closingTime: '20:00' }),
  location: geoPointJoiSchema.required()
});

const producePayloadJoiSchema = Joi.object({
  orderId: Joi.string().allow(null, '').optional(),
  orderNumber: Joi.string().allow('').optional(),
  produceName: Joi.string().trim().required(),
  produceCategory: Joi.string().trim().required(),
  weightKg: Joi.number().positive().max(50000).required(),
  volumeCrates: Joi.number().min(0).default(1),
  packagingType: Joi.string().default('plastic_crate'),
  perishabilityTier: Joi.string().valid(...PERISHABILITY_TIERS).default('MEDIUM'),
  requiresRefrigeration: Joi.boolean().default(false),
  targetTemperatureCelsius: Joi.object({
    min: Joi.number().allow(null),
    max: Joi.number().allow(null)
  }).optional()
});

const timeWindowJoiSchema = Joi.object({
  earliestArrival: Joi.date().iso().required(),
  latestArrival: Joi.date().iso().required(),
  estimatedLoadingMinutes: Joi.number().min(5).max(240).default(20)
});

const routeStopJoiSchema = Joi.object({
  stopId: Joi.string().trim().required(),
  stopSequence: Joi.number().min(0).default(0),
  stopType: Joi.string().valid(...STOP_TYPES).default('PICKUP_FARM'),
  locationName: Joi.string().trim().required(),
  contactName: Joi.string().trim().required(),
  contactPhone: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  lga: Joi.string().allow('').optional(),
  state: Joi.string().trim().required(),
  location: geoPointJoiSchema.required(),
  roadSurface: Joi.string().valid(...ROAD_SURFACE_TYPES).default('SECONDARY_ASPHALT'),
  producePayload: producePayloadJoiSchema.required(),
  timeWindow: timeWindowJoiSchema.required()
});

const optimizeRequestSchema = Joi.object({
  originDepot: depotLocationJoiSchema.required(),
  destinationHub: depotLocationJoiSchema.required(),
  stops: Joi.array().items(routeStopJoiSchema).min(1).required(),
  vehicleSpecs: Joi.object({
    maxPayloadKg: Joi.number().positive().default(3500),
    maxVolumeCrates: Joi.number().positive().default(120),
    hasRefrigeration: Joi.boolean().default(false)
  }).default({ maxPayloadKg: 3500, maxVolumeCrates: 120, hasRefrigeration: false }),
  departureTime: Joi.date().iso().default(() => new Date())
});

const createRouteSchema = Joi.object({
  routeName: Joi.string().trim().max(150).required(),
  serviceRegion: Joi.string().trim().default('Kaduna-Kano Produce Belt'),
  originDepot: depotLocationJoiSchema.required(),
  destinationHub: depotLocationJoiSchema.required(),
  assignedDriver: Joi.string().allow(null, '').optional(),
  assignedVehicle: Joi.object({
    registrationNumber: Joi.string().trim().uppercase().allow(''),
    vehicleType: Joi.string().trim().default('box_truck'),
    maxPayloadKg: Joi.number().positive().default(3500),
    maxVolumeCrates: Joi.number().positive().default(120),
    hasRefrigeration: Joi.boolean().default(false)
  }).default({ registrationNumber: '', vehicleType: 'box_truck', maxPayloadKg: 3500, maxVolumeCrates: 120, hasRefrigeration: false }),
  stops: Joi.array().items(routeStopJoiSchema).min(1).required(),
  departureScheduledAt: Joi.date().iso().required(),
  notes: Joi.string().allow('').max(1000).optional()
});

const reorderStopsSchema = Joi.object({
  orderedStopIds: Joi.array().items(Joi.string()).min(1).required()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...ROUTE_LIFECYCLE_STATUSES).required(),
  reason: Joi.string().allow('').optional()
});

const dispatchRouteSchema = Joi.object({
  driverId: Joi.string().required(),
  vehicleRegistrationNumber: Joi.string().trim().uppercase().required(),
  sealNumber: Joi.string().trim().uppercase().default('SEAL-0001'),
  phytosanitaryPermitNumber: Joi.string().trim().allow(null, '').optional()
});

const updateStopStatusSchema = Joi.object({
  status: Joi.string().valid(...STOP_STATUSES).required(),
  verifiedCratesCount: Joi.number().min(0).optional(),
  verifiedWeightKg: Joi.number().min(0).optional(),
  driverNotes: Joi.string().allow('').optional(),
  farmerSignoffName: Joi.string().allow('').optional(),
  photoUrl: Joi.string().allow(null, '').optional()
});

// ------------------------------------------------------------------------------
// ROUTE HANDLERS
// ------------------------------------------------------------------------------

/**
 * POST /api/routes/optimize
 * Runs the TSP Nearest-Neighbor and 2-Opt solver on unassigned pickup stops.
 */
router.post('/optimize', async (req, res) => {
  try {
    const { error, value } = optimizeRequestSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid optimization request payload',
        details: error.details.map(d => d.message)
      });
    }

    const optimizationResult = optimizeAgriculturalRoute(value);

    return res.status(200).json({
      success: true,
      message: 'Route optimized successfully using 2-Opt local search heuristic',
      data: optimizationResult
    });
  } catch (err) {
    console.error('Route optimization error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to optimize route',
      error: err.message
    });
  }
});

/**
 * POST /api/routes
 * Persists a newly planned or optimized route.
 */
router.post('/', async (req, res) => {
  try {
    const { error, value } = createRouteSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error creating route',
        details: error.details.map(d => d.message)
      });
    }

    const routeCode = OptimizedRoute.generateRouteCode();

    const newRoute = new OptimizedRoute({
      ...value,
      routeCode,
      status: 'DRAFT'
    });

    // Compute metrics
    newRoute.recalculateMetrics();

    await newRoute.save();

    return res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: newRoute
    });
  } catch (err) {
    console.error('Create route error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create route',
      error: err.message
    });
  }
});

/**
 * GET /api/routes
 * Lists routes with filtering by status, driver, and region.
 */
router.get('/', async (req, res) => {
  try {
    const { status, driverId, serviceRegion, limit = 20, page = 1 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (driverId) query.assignedDriver = driverId;
    if (serviceRegion) query.serviceRegion = new RegExp(serviceRegion, 'i');

    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const skip = (pageNum - 1) * limitNum;

    const [routes, totalCount] = await Promise.all([
      OptimizedRoute.find(query)
        .populate('assignedDriver', 'fullName email phone vehicle')
        .sort({ departureScheduledAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      OptimizedRoute.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      data: routes
    });
  } catch (err) {
    console.error('List routes error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve routes',
      error: err.message
    });
  }
});

/**
 * GET /api/routes/:id
 * Fetches complete details for a single route.
 */
router.get('/:id', async (req, res) => {
  try {
    const route = await OptimizedRoute.findById(req.params.id)
      .populate('assignedDriver', 'fullName email phone vehicle');

    if (!route) {
      return res.status(404).json({
        success: false,
        message: `Route not found with ID: ${req.params.id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: route
    });
  } catch (err) {
    console.error('Get route error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch route',
      error: err.message
    });
  }
});

/**
 * PATCH /api/routes/:id/reorder
 * Re-orders stops according to a list of ordered stop IDs, updating metrics.
 */
router.patch('/:id/reorder', async (req, res) => {
  try {
    const { error, value } = reorderStopsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reorder payload',
        details: error.details.map(d => d.message)
      });
    }

    const route = await OptimizedRoute.findById(req.params.id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    if (route.status === 'COMPLETED' || route.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `Cannot reorder stops on a route with status: ${route.status}`
      });
    }

    const stopMap = new Map();
    route.stops.forEach(s => stopMap.set(s.stopId, s));

    const reordered = [];
    for (const stopId of value.orderedStopIds) {
      const existing = stopMap.get(stopId);
      if (existing) {
        reordered.push(existing);
        stopMap.delete(stopId);
      }
    }

    // Append any unmentioned stops
    for (const remaining of stopMap.values()) {
      reordered.push(remaining);
    }

    route.stops = reordered;
    route.recalculateMetrics();

    await route.save();

    return res.status(200).json({
      success: true,
      message: 'Stops reordered and metrics recalculated successfully',
      data: route
    });
  } catch (err) {
    console.error('Reorder stops error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reorder stops',
      error: err.message
    });
  }
});

/**
 * PATCH /api/routes/:id/status
 * Updates the overall route lifecycle state machine.
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { error, value } = updateStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status update payload',
        details: error.details.map(d => d.message)
      });
    }

    const route = await OptimizedRoute.findById(req.params.id);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    await route.advanceStatus(value.status);

    return res.status(200).json({
      success: true,
      message: `Route status updated to ${value.status}`,
      data: route
    });
  } catch (err) {
    console.error('Update route status error:', err);
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

/**
 * POST /api/routes/:id/dispatch
 * Assigns driver, validates capacity, advances status to DISPATCHED, and issues manifest.
 */
router.post('/:id/dispatch', async (req, res) => {
  try {
    const { error, value } = dispatchRouteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dispatch parameters',
        details: error.details.map(d => d.message)
      });
    }

    const route = await OptimizedRoute.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    // Capacity validation check
    const cap = route.validateCapacity();
    if (!cap.isValid) {
      return res.status(400).json({
        success: false,
        message: cap.message,
        excessWeightKg: cap.excessWeightKg
      });
    }

    // Assign driver & vehicle
    route.assignedDriver = value.driverId;
    route.assignedVehicle.registrationNumber = value.vehicleRegistrationNumber;
    await route.advanceStatus('DISPATCHED');

    // Create legal dispatch manifest
    const manifestNumber = DispatchManifest.generateManifestNumber();
    const consignments = route.stops.map((stop, index) => ({
      orderId: stop.producePayload?.orderId || null,
      stopSequence: index,
      farmerName: stop.contactName,
      farmerPhone: stop.contactPhone,
      farmLocation: stop.locationName,
      produceName: stop.producePayload?.produceName || 'Agricultural Produce',
      produceCategory: stop.producePayload?.produceCategory || 'General',
      manifestedWeightKg: stop.producePayload?.weightKg || 0,
      cratesCount: stop.producePayload?.volumeCrates || 1,
      packagingType: stop.producePayload?.packagingType || 'plastic_crate',
      perishabilityTier: stop.producePayload?.perishabilityTier || 'MEDIUM'
    }));

    const manifest = new DispatchManifest({
      manifestNumber,
      routeId: route._id,
      routeCode: route.routeCode,
      driverId: value.driverId,
      driverFullName: 'Assigned Haulage Driver',
      driverLicenseNumber: 'COMM-FRG-0982',
      vehicleRegistrationNumber: value.vehicleRegistrationNumber,
      departureDepot: {
        facilityName: route.originDepot.depotName,
        address: route.originDepot.address,
        cityState: `${route.originDepot.city}, ${route.originDepot.state}`
      },
      destinationTerminal: {
        facilityName: route.destinationHub.depotName,
        address: route.destinationHub.address,
        cityState: `${route.destinationHub.city}, ${route.destinationHub.state}`
      },
      consignments,
      summaryTotals: {
        totalWeightKg: route.metrics?.totalPayloadWeightKg || 0,
        totalCratesCount: route.metrics?.totalPayloadVolumeCrates || 0,
        totalStopsCount: route.stops.length
      },
      securitySeals: [{
        sealNumber: value.sealNumber,
        appliedBy: 'Agrily Dispatch Supervisor'
      }],
      phytosanitaryPermitNumber: value.phytosanitaryPermitNumber || null,
      status: 'ISSUED'
    });

    await manifest.save();

    return res.status(200).json({
      success: true,
      message: 'Route dispatched successfully and legal cargo manifest issued',
      data: {
        route,
        manifest
      }
    });
  } catch (err) {
    console.error('Dispatch route error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch route',
      error: err.message
    });
  }
});

/**
 * PATCH /api/routes/:id/stops/:stopId
 * Updates collection proof and status at a specific stop.
 */
router.patch('/:id/stops/:stopId', async (req, res) => {
  try {
    const { error, value } = updateStopStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stop update data',
        details: error.details.map(d => d.message)
      });
    }

    const route = await OptimizedRoute.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    const stop = route.stops.find(s => s.stopId === req.params.stopId);
    if (!stop) {
      return res.status(404).json({
        success: false,
        message: `Stop not found with ID: ${req.params.stopId}`
      });
    }

    stop.status = value.status;

    if (!stop.collectionProof) stop.collectionProof = {};
    if (value.verifiedCratesCount !== undefined) stop.collectionProof.verifiedCratesCount = value.verifiedCratesCount;
    if (value.verifiedWeightKg !== undefined) stop.collectionProof.verifiedWeightKg = value.verifiedWeightKg;
    if (value.driverNotes) stop.collectionProof.driverNotes = value.driverNotes;
    if (value.farmerSignoffName) stop.collectionProof.farmerSignoffName = value.farmerSignoffName;
    if (value.photoUrl) stop.collectionProof.photoUrl = value.photoUrl;
    stop.collectionProof.recordedAt = new Date();

    // Check if all stops are collected or delivered
    const allFinished = route.stops.every(s => s.status === 'COLLECTED' || s.status === 'DELIVERED' || s.status === 'SKIPPED');
    if (allFinished && route.status === 'IN_PROGRESS') {
      route.status = 'COMPLETED';
      route.completedAt = new Date();
    }

    route.recalculateMetrics();
    await route.save();

    return res.status(200).json({
      success: true,
      message: `Stop ${req.params.stopId} updated to ${value.status}`,
      data: route
    });
  } catch (err) {
    console.error('Update stop error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update stop status',
      error: err.message
    });
  }
});

/**
 * GET /api/routes/:id/manifest
 * Fetches the cargo manifest associated with this route.
 */
router.get('/:id/manifest', async (req, res) => {
  try {
    const manifest = await DispatchManifest.findOne({ routeId: req.params.id });
    if (!manifest) {
      return res.status(404).json({
        success: false,
        message: `No cargo manifest found for route ID: ${req.params.id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: manifest
    });
  } catch (err) {
    console.error('Get manifest error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch manifest',
      error: err.message
    });
  }
});

module.exports = router;
