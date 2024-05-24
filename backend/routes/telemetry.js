const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { TelemetryPing } = require('../models/TelemetryPing');

// ============================================================================
// JOI VALIDATION SCHEMAS
// ============================================================================

const telemetryPingSchema = Joi.object({
  driverEmail: Joi.string().email().required().messages({
    'string.email': 'Valid driver email address is required',
    'any.required': 'Driver email is required'
  }),
  driverName: Joi.string().max(100).optional(),
  consignmentOrderId: Joi.string().min(3).max(64).required().messages({
    'any.required': 'Consignment order ID is required'
  }),
  vehicleRegistration: Joi.string().max(20).optional(),
  coordinates: Joi.object({
    lng: Joi.number().min(-180).max(180).required().messages({
      'any.required': 'Longitude is required (-180 to 180)'
    }),
    lat: Joi.number().min(-90).max(90).required().messages({
      'any.required': 'Latitude is required (-90 to 90)'
    })
  }).required(),
  speedKmh: Joi.number().min(0).max(200).required().messages({
    'any.required': 'Speed in km/h is required',
    'number.min': 'Speed cannot be negative',
    'number.max': 'Speed exceeds plausible commercial transit limits'
  }),
  headingDegrees: Joi.number().min(0).max(360).optional().default(0),
  altitudeMeters: Joi.number().optional().default(0),
  accuracyMeters: Joi.number().min(0).optional().default(5),
  batteryLevelPct: Joi.number().min(0).max(100).optional().default(100),
  isCharging: Joi.boolean().optional().default(false),
  isStationary: Joi.boolean().optional().default(false),
  odometerKm: Joi.number().min(0).optional().default(0),
  ambientTemperatureC: Joi.number().optional().allow(null),
  cargoTemperatureC: Joi.number().optional().allow(null),
  recordedAt: Joi.date().iso().optional()
});

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * Ingest high-frequency GPS telemetry ping
 * POST /api/telemetry/ping
 */
const recordTelemetryPing = async (req, res) => {
  try {
    const { error, value } = telemetryPingSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Telemetry payload validation failed',
        errors: error.details.map(d => d.message)
      });
    }

    const {
      driverEmail,
      driverName,
      consignmentOrderId,
      vehicleRegistration,
      coordinates,
      speedKmh,
      headingDegrees,
      altitudeMeters,
      accuracyMeters,
      batteryLevelPct,
      isCharging,
      isStationary,
      odometerKm,
      ambientTemperatureC,
      cargoTemperatureC,
      recordedAt
    } = value;

    const ping = new TelemetryPing({
      driverEmail,
      driverName: driverName || 'Fleet Operator',
      consignmentOrderId,
      vehicleRegistration: vehicleRegistration || 'UNKNOWN',
      location: {
        type: 'Point',
        coordinates: [coordinates.lng, coordinates.lat]
      },
      speedKmh,
      headingDegrees: headingDegrees || 0,
      altitudeMeters: altitudeMeters || 0,
      accuracyMeters: accuracyMeters || 5,
      batteryLevelPct: batteryLevelPct !== undefined ? batteryLevelPct : 100,
      isCharging: Boolean(isCharging),
      isStationary: Boolean(isStationary),
      odometerKm: odometerKm || 0,
      ambientTemperatureC: ambientTemperatureC || null,
      cargoTemperatureC: cargoTemperatureC || null,
      recordedAt: recordedAt || new Date()
    });

    await ping.save();

    return res.status(201).json({
      success: true,
      message: 'Telemetry ping recorded successfully',
      data: {
        pingId: ping._id,
        consignmentOrderId: ping.consignmentOrderId,
        coordinates: {
          lng: coordinates.lng,
          lat: coordinates.lat
        },
        speedKmh: ping.speedKmh,
        headingDegrees: ping.headingDegrees,
        recordedAt: ping.recordedAt
      }
    });
  } catch (err) {
    console.error('Error recording telemetry ping:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing telemetry ping'
    });
  }
};

/**
 * Get latest live position for a consignment order
 * GET /api/telemetry/order/:consignmentOrderId/latest
 */
const getLatestOrderTelemetry = async (req, res) => {
  try {
    const { consignmentOrderId } = req.params;
    if (!consignmentOrderId || consignmentOrderId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Consignment order ID is required'
      });
    }

    const latestPing = await TelemetryPing.getLatestForOrder(consignmentOrderId);
    if (!latestPing) {
      return res.status(404).json({
        success: false,
        message: `No telemetry found for consignment order: ${consignmentOrderId}`
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        consignmentOrderId: latestPing.consignmentOrderId,
        driverEmail: latestPing.driverEmail,
        driverName: latestPing.driverName,
        vehicleRegistration: latestPing.vehicleRegistration,
        coordinates: {
          lng: latestPing.location.coordinates[0],
          lat: latestPing.location.coordinates[1]
        },
        speedKmh: latestPing.speedKmh,
        headingDegrees: latestPing.headingDegrees,
        batteryLevelPct: latestPing.batteryLevelPct,
        cargoTemperatureC: latestPing.cargoTemperatureC,
        isStationary: latestPing.isStationary,
        recordedAt: latestPing.recordedAt
      }
    });
  } catch (err) {
    console.error('Error fetching latest order telemetry:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving telemetry'
    });
  }
};

/**
 * Get chronological breadcrumbs trail for a consignment order
 * GET /api/telemetry/order/:consignmentOrderId/breadcrumbs
 */
const getOrderBreadcrumbs = async (req, res) => {
  try {
    const { consignmentOrderId } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit || '100', 10), 1), 500);

    if (!consignmentOrderId || consignmentOrderId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Consignment order ID is required'
      });
    }

    const breadcrumbs = await TelemetryPing.getRouteBreadcrumbs(consignmentOrderId, limit);

    return res.status(200).json({
      success: true,
      count: breadcrumbs.length,
      consignmentOrderId,
      data: breadcrumbs.map(b => ({
        coordinates: {
          lng: b.location.coordinates[0],
          lat: b.location.coordinates[1]
        },
        speedKmh: b.speedKmh,
        headingDegrees: b.headingDegrees,
        accuracyMeters: b.accuracyMeters,
        cargoTemperatureC: b.cargoTemperatureC,
        recordedAt: b.recordedAt
      }))
    });
  } catch (err) {
    console.error('Error fetching breadcrumbs trail:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving breadcrumbs'
    });
  }
};

/**
 * Get latest locations of all active fleet vehicles
 * GET /api/telemetry/fleet/active
 */
const getActiveFleetTelemetry = async (req, res) => {
  try {
    const maxAgeMinutes = parseInt(req.query.maxAgeMinutes || '60', 10);
    const fleetPings = await TelemetryPing.getActiveFleetPositions(maxAgeMinutes);

    return res.status(200).json({
      success: true,
      count: fleetPings.length,
      data: fleetPings.map(p => ({
        driverEmail: p.driverEmail,
        driverName: p.driverName,
        consignmentOrderId: p.consignmentOrderId,
        vehicleRegistration: p.vehicleRegistration,
        coordinates: {
          lng: p.location.coordinates[0],
          lat: p.location.coordinates[1]
        },
        speedKmh: p.speedKmh,
        headingDegrees: p.headingDegrees,
        batteryLevelPct: p.batteryLevelPct,
        recordedAt: p.recordedAt
      }))
    });
  } catch (err) {
    console.error('Error fetching active fleet telemetry:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while querying active fleet'
    });
  }
};

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

router.post('/ping', recordTelemetryPing);
router.get('/order/:consignmentOrderId/latest', getLatestOrderTelemetry);
router.get('/order/:consignmentOrderId/breadcrumbs', getOrderBreadcrumbs);
router.get('/fleet/active', getActiveFleetTelemetry);

module.exports = {
  router,
  telemetryPingSchema,
  recordTelemetryPing,
  getLatestOrderTelemetry,
  getOrderBreadcrumbs,
  getActiveFleetTelemetry
};
