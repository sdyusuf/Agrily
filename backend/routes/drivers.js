const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { Driver, VEHICLE_TYPES, LICENSE_CLASSES } = require('../models/Driver');

// ============================================================================
// JOI VALIDATION SCHEMAS
// ============================================================================

const driverRegistrationSchema = Joi.object({
  userEmail: Joi.string().email().required().messages({
    'string.email': 'Valid driver email address is required',
    'any.required': 'Driver email is required'
  }),
  fullName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Full name must have at least 2 characters',
    'any.required': 'Driver full name is required'
  }),
  phone: Joi.string().min(7).max(25).required().messages({
    'any.required': 'Phone number is required'
  }),
  licenseNumber: Joi.string().min(3).max(30).required().messages({
    'any.required': 'Commercial driver license number is required'
  }),
  licenseClass: Joi.string().valid(...LICENSE_CLASSES).required().messages({
    'any.only': 'Invalid commercial license class'
  }),
  licenseExpiry: Joi.date().iso().required().messages({
    'any.required': 'License expiry date is required'
  }),
  nationalIdNumber: Joi.string().min(5).max(30).required().messages({
    'any.required': 'National ID number is required'
  }),
  vehicle: Joi.object({
    vehicleType: Joi.string().valid(...VEHICLE_TYPES).required(),
    registrationNumber: Joi.string().min(3).max(20).required(),
    make: Joi.string().min(1).max(50).required(),
    model: Joi.string().min(1).max(50).required(),
    year: Joi.number().integer().min(1990).max(2030).required(),
    payloadCapacityKg: Joi.number().min(250).max(60000).required(),
    maxVolumeCubicMeters: Joi.number().min(1).max(150).optional(),
    hasRefrigeration: Joi.boolean().optional(),
    temperatureRange: Joi.object({
      min: Joi.number().optional(),
      max: Joi.number().optional()
    }).optional(),
    insurancePolicyNumber: Joi.string().allow('').optional(),
    insuranceExpiry: Joi.date().iso().optional()
  }).required(),
  operatingRegions: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'At least one operating region must be specified'
  }),
  baseLocation: Joi.object({
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).optional(),
      lng: Joi.number().min(-180).max(180).optional()
    }).optional()
  }).optional()
});

const driverAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean().required().messages({
    'any.required': 'Availability boolean flag is required'
  })
});

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * Register a new freight driver with vehicle specs
 */
const registerDriver = async (req, res) => {
  try {
    const { error, value } = driverRegistrationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Driver registration validation failed',
        errors: error.details.map(d => d.message)
      });
    }

    const existingDriver = await Driver.findOne({ userEmail: value.userEmail.toLowerCase() });
    if (existingDriver) {
      return res.status(409).json({
        success: false,
        message: 'A driver profile already exists for this email address'
      });
    }

    const driver = new Driver(value);
    await driver.save();

    return res.status(201).json({
      success: true,
      message: 'Driver profile registered successfully! Verification is pending.',
      driver
    });
  } catch (err) {
    console.error('Driver registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while registering driver'
    });
  }
};

/**
 * Retrieve driver profile by email
 */
const getDriverProfile = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Driver email parameter is required' });
    }

    const driver = await Driver.findOne({ userEmail: email.toLowerCase() });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    return res.status(200).json({ success: true, driver });
  } catch (err) {
    console.error('Fetch driver error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve driver profile' });
  }
};

/**
 * Update driver vehicle specs or operating regions
 */
const updateDriverProfile = async (req, res) => {
  try {
    const { userEmail, vehicle, operatingRegions, baseLocation, phone } = req.body;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'userEmail is required to update driver profile' });
    }

    const driver = await Driver.findOne({ userEmail: userEmail.toLowerCase() });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    if (phone) driver.phone = phone;
    if (operatingRegions && Array.isArray(operatingRegions) && operatingRegions.length > 0) {
      driver.operatingRegions = operatingRegions;
    }
    if (baseLocation) {
      driver.baseLocation = { ...driver.baseLocation, ...baseLocation };
    }
    if (vehicle) {
      driver.vehicle = { ...driver.vehicle.toObject(), ...vehicle };
    }

    await driver.save();
    return res.status(200).json({
      success: true,
      message: 'Driver profile updated successfully',
      driver
    });
  } catch (err) {
    console.error('Update driver error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update driver profile' });
  }
};

/**
 * Toggle driver active duty status
 */
const setDriverAvailability = async (req, res) => {
  try {
    const { email } = req.params;
    const { error, value } = driverAvailabilitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const driver = await Driver.findOne({ userEmail: email.toLowerCase() });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    driver.isAvailable = value.isAvailable;
    await driver.save();

    return res.status(200).json({
      success: true,
      message: `Driver status updated to ${value.isAvailable ? 'Online' : 'Offline'}`,
      isAvailable: driver.isAvailable
    });
  } catch (err) {
    console.error('Availability update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update availability status' });
  }
};

/**
 * Query available fleet filtered by regional criteria and capacity
 */
const getAvailableFleet = async (req, res) => {
  try {
    const { region, minPayloadKg, requiresReefer } = req.query;
    const query = {
      isAvailable: true
    };

    if (region) {
      query.operatingRegions = region;
    }

    if (minPayloadKg && !isNaN(Number(minPayloadKg))) {
      query['vehicle.payloadCapacityKg'] = { $gte: Number(minPayloadKg) };
    }

    if (requiresReefer === 'true' || requiresReefer === true) {
      query['vehicle.hasRefrigeration'] = true;
    }

    const drivers = await Driver.find(query)
      .sort({ rating: -1, totalDeliveries: -1 })
      .select('-nationalIdNumber -licenseNumber');

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers
    });
  } catch (err) {
    console.error('Query available fleet error:', err);
    return res.status(500).json({ success: false, message: 'Failed to query available fleet' });
  }
};

// ============================================================================
// ROUTER BINDINGS
// ============================================================================

router.post('/drivers/register', registerDriver);
router.get('/drivers/profile/:email', getDriverProfile);
router.put('/drivers/profile', updateDriverProfile);
router.patch('/drivers/:email/availability', setDriverAvailability);
router.get('/drivers/available', getAvailableFleet);

module.exports = {
  router,
  registerDriver,
  getDriverProfile,
  updateDriverProfile,
  setDriverAvailability,
  getAvailableFleet,
  driverRegistrationSchema
};
