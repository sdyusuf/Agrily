const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { SensorPod, PRODUCE_STORAGE_PROFILES } = require('../models/SensorPod');
const { ColdChainReading } = require('../models/ColdChainReading');

// ============================================================================
// JOI VALIDATION SCHEMAS
// ============================================================================

const sensorRegistrationSchema = Joi.object({
  podId: Joi.string().min(3).max(30).required().messages({
    'any.required': 'Sensor pod identifier is required'
  }),
  deviceMac: Joi.string()
    .regex(/^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i)
    .required()
    .messages({
      'string.pattern.base': 'Device MAC must follow format XX:XX:XX:XX:XX:XX',
      'any.required': 'Device MAC is required'
    }),
  assignedConsignmentId: Joi.string().min(3).max(64).required().messages({
    'any.required': 'Assigned consignment order ID is required'
  }),
  vehicleRegistration: Joi.string().min(3).max(20).required().messages({
    'any.required': 'Vehicle registration is required'
  }),
  produceCategory: Joi.string()
    .valid(...Object.keys(PRODUCE_STORAGE_PROFILES))
    .optional()
    .default('general_produce'),
  batteryPercent: Joi.number().min(0).max(100).optional().default(100),
  batteryVoltage: Joi.number().min(2.0).max(5.0).optional().default(3.7)
});

const sensorIngestSchema = Joi.object({
  podId: Joi.string().required().messages({
    'any.required': 'Sensor pod ID is required'
  }),
  consignmentOrderId: Joi.string().required().messages({
    'any.required': 'Consignment order ID is required'
  }),
  temperatureC: Joi.number().min(-50).max(80).required().messages({
    'any.required': 'Temperature in Celsius is required',
    'number.min': 'Temperature below valid operating limits',
    'number.max': 'Temperature exceeds valid operating limits'
  }),
  humidityPercent: Joi.number().min(0).max(100).required().messages({
    'any.required': 'Humidity percentage is required',
    'number.min': 'Humidity cannot be negative',
    'number.max': 'Humidity cannot exceed 100%'
  }),
  ambientLightLux: Joi.number().min(0).optional().default(0),
  doorContactOpen: Joi.boolean().optional().default(false),
  doorOpenDurationSeconds: Joi.number().min(0).optional().default(0),
  batteryPercent: Joi.number().min(0).max(100).optional().default(100),
  recordedAt: Joi.date().iso().optional()
});

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * Register a new cold-chain sensor pod
 * POST /api/sensors/register
 */
const registerSensorPod = async (req, res) => {
  try {
    const { error, value } = sensorRegistrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Sensor pod registration validation failed',
        errors: error.details.map(d => d.message)
      });
    }

    const existing = await SensorPod.findOne({ podId: value.podId.toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Sensor pod ID ${value.podId} is already registered`
      });
    }

    const pod = new SensorPod({
      ...value,
      podId: value.podId.toUpperCase(),
      deviceMac: value.deviceMac.toUpperCase(),
      vehicleRegistration: value.vehicleRegistration.toUpperCase()
    });

    await pod.save();

    return res.status(201).json({
      success: true,
      message: 'Sensor pod registered successfully',
      data: {
        podId: pod.podId,
        assignedConsignmentId: pod.assignedConsignmentId,
        vehicleRegistration: pod.vehicleRegistration,
        produceCategory: pod.produceCategory,
        targetTempRange: pod.targetTempRange,
        targetHumidityRange: pod.targetHumidityRange,
        status: pod.status
      }
    });
  } catch (err) {
    console.error('Error registering sensor pod:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while registering sensor pod'
    });
  }
};

/**
 * Ingest IoT sensor reading and evaluate excursion thresholds
 * POST /api/sensors/ingest
 */
const ingestSensorReading = async (req, res) => {
  try {
    const { error, value } = sensorIngestSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Sensor reading ingestion validation failed',
        errors: error.details.map(d => d.message)
      });
    }

    const {
      podId,
      consignmentOrderId,
      temperatureC,
      humidityPercent,
      ambientLightLux,
      doorContactOpen,
      doorOpenDurationSeconds,
      batteryPercent,
      recordedAt
    } = value;

    // Retrieve pod to check against produce thresholds
    const pod = await SensorPod.findOne({ podId: podId.toUpperCase() });
    let isBreach = false;
    let breachSeverity = 'none';
    let breachDetails = [];

    if (pod) {
      const evaluation = pod.evaluateReading(temperatureC, humidityPercent, doorOpenDurationSeconds);
      isBreach = evaluation.isBreach;
      breachSeverity = evaluation.severity;
      breachDetails = evaluation.breaches;

      // Update pod lastPing and status
      pod.lastPingAt = new Date();
      pod.batteryPercent = batteryPercent !== undefined ? batteryPercent : pod.batteryPercent;
      if (isBreach && breachSeverity === 'high_critical') {
        pod.status = 'alert_breach';
      }
      await pod.save();
    }

    const reading = new ColdChainReading({
      podId: podId.toUpperCase(),
      consignmentOrderId,
      temperatureC,
      humidityPercent,
      ambientLightLux: ambientLightLux || 0,
      doorContactOpen: Boolean(doorContactOpen),
      doorOpenDurationSeconds: doorOpenDurationSeconds || 0,
      isBreach,
      breachSeverity,
      breachDetails,
      batteryPercent: batteryPercent !== undefined ? batteryPercent : 100,
      recordedAt: recordedAt || new Date()
    });

    await reading.save();

    return res.status(201).json({
      success: true,
      message: isBreach ? 'Reading recorded with cold-chain breach detected' : 'Reading recorded successfully',
      data: {
        readingId: reading._id,
        podId: reading.podId,
        consignmentOrderId: reading.consignmentOrderId,
        temperatureC: reading.temperatureC,
        humidityPercent: reading.humidityPercent,
        isBreach: reading.isBreach,
        breachSeverity: reading.breachSeverity,
        breachDetails: reading.breachDetails,
        recordedAt: reading.recordedAt
      }
    });
  } catch (err) {
    console.error('Error ingesting sensor reading:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while ingesting sensor telemetry'
    });
  }
};

/**
 * Get latest cold-chain reading for a consignment
 * GET /api/sensors/consignment/:consignmentOrderId/latest
 */
const getLatestConsignmentReading = async (req, res) => {
  try {
    const { consignmentOrderId } = req.params;
    if (!consignmentOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Consignment order ID is required'
      });
    }

    const reading = await ColdChainReading.findOne({ consignmentOrderId })
      .sort({ recordedAt: -1 })
      .exec();

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: `No readings found for consignment order: ${consignmentOrderId}`
      });
    }

    const pod = await SensorPod.findOne({ podId: reading.podId });

    return res.status(200).json({
      success: true,
      data: {
        podId: reading.podId,
        consignmentOrderId: reading.consignmentOrderId,
        temperatureC: reading.temperatureC,
        humidityPercent: reading.humidityPercent,
        ambientLightLux: reading.ambientLightLux,
        doorContactOpen: reading.doorContactOpen,
        isBreach: reading.isBreach,
        breachSeverity: reading.breachSeverity,
        breachDetails: reading.breachDetails,
        batteryPercent: reading.batteryPercent,
        recordedAt: reading.recordedAt,
        podSpecs: pod ? {
          vehicleRegistration: pod.vehicleRegistration,
          produceCategory: pod.produceCategory,
          targetTempRange: pod.targetTempRange,
          targetHumidityRange: pod.targetHumidityRange,
          status: pod.status
        } : null
      }
    });
  } catch (err) {
    console.error('Error fetching latest reading:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving sensor reading'
    });
  }
};

/**
 * Get excursion anomaly logs for a consignment
 * GET /api/sensors/consignment/:consignmentOrderId/excursions
 */
const getConsignmentExcursions = async (req, res) => {
  try {
    const { consignmentOrderId } = req.params;
    const excursions = await ColdChainReading.getExcursionTimeline(consignmentOrderId);

    return res.status(200).json({
      success: true,
      count: excursions.length,
      consignmentOrderId,
      data: excursions
    });
  } catch (err) {
    console.error('Error fetching excursions:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving excursions'
    });
  }
};

/**
 * Get summary compliance stats for a consignment
 * GET /api/sensors/consignment/:consignmentOrderId/summary
 */
const getConsignmentComplianceSummary = async (req, res) => {
  try {
    const { consignmentOrderId } = req.params;
    const summary = await ColdChainReading.getConsignmentSummary(consignmentOrderId);

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: `No sensor telemetry data found for consignment: ${consignmentOrderId}`
      });
    }

    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    console.error('Error computing compliance summary:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while computing compliance summary'
    });
  }
};

// ============================================================================
// ROUTE REGISTRATIONS
// ============================================================================

router.post('/register', registerSensorPod);
router.post('/ingest', ingestSensorReading);
router.get('/consignment/:consignmentOrderId/latest', getLatestConsignmentReading);
router.get('/consignment/:consignmentOrderId/excursions', getConsignmentExcursions);
router.get('/consignment/:consignmentOrderId/summary', getConsignmentComplianceSummary);

module.exports = {
  router,
  sensorRegistrationSchema,
  sensorIngestSchema,
  registerSensorPod,
  ingestSensorReading,
  getLatestConsignmentReading,
  getConsignmentExcursions,
  getConsignmentComplianceSummary
};
