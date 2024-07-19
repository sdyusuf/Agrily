/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-LOGISTICS PLATFORM: DIGITAL WAYBILL & INVOICE REST API ROUTES
 * ==============================================================================
 *
 * @module routes/waybillRoutes
 * @description
 * RESTful controllers and route definitions for Digital Waybill creation,
 * query filtering, public cryptographic QR verification, chain-of-custody handovers,
 * commercial invoice retrieval, and print rendering.
 *
 * Base Path: /api/waybills
 *
 * Endpoints:
 *  - POST   /api/waybills                     : Create new digital waybill
 *  - GET    /api/waybills                     : Query waybills with pagination & filters
 *  - GET    /api/waybills/:id                 : Get waybill by ID or waybillNumber
 *  - GET    /api/waybills/:id/verify          : Verify waybill QR code and hash
 *  - POST   /api/waybills/:id/custody-transfer: Record verifiable custody hand-off
 *  - GET    /api/waybills/:id/invoice         : Retrieve or generate commercial invoice
 *  - PATCH  /api/waybills/:id/status          : Update operational lifecycle status
 *  - GET    /api/waybills/:id/print           : Render official print-ready HTML
 *
 * @version 1.0.0
 * @author Agrily Engineering Core
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { DigitalWaybill, WAYBILL_STATUSES, CUSTODY_ROLES } = require('../models/DigitalWaybill');
const { CommercialInvoice } = require('../models/CommercialInvoice');
const {
  createWaybillFromRoute,
  generateCommercialInvoiceForWaybill,
  advanceWaybillCustody,
  generateWaybillHtmlPrintout
} = require('../services/waybillGenerator');
const {
  verifyWaybillToken,
  generateQrSvg,
  assessColdChainCompliance
} = require('../services/qrVerificationService');

/**
 * Joi Schema for Waybill Creation
 */
const createWaybillSchema = Joi.object({
  routeId: Joi.string().allow(null, '').optional(),
  orderId: Joi.string().allow(null, '').optional(),
  expectedDeliveryDate: Joi.date().iso().required(),
  shipper: Joi.object({
    farmerId: Joi.string().allow(null, '').optional(),
    cooperativeName: Joi.string().default('Agro Cooperative Syndicate'),
    contactPerson: Joi.string().required(),
    contactPhone: Joi.string().required(),
    pickupAddress: Joi.string().required(),
    state: Joi.string().default('Kaduna'),
    country: Joi.string().default('Nigeria')
  }).required(),
  consignee: Joi.object({
    buyerId: Joi.string().allow(null, '').optional(),
    businessName: Joi.string().required(),
    contactPerson: Joi.string().required(),
    contactPhone: Joi.string().required(),
    deliveryAddress: Joi.string().required(),
    state: Joi.string().default('Kano'),
    country: Joi.string().default('Nigeria')
  }).required(),
  carrier: Joi.object({
    driverId: Joi.string().allow(null, '').optional(),
    driverName: Joi.string().required(),
    driverPhone: Joi.string().required(),
    driverLicenseNumber: Joi.string().default('DL-AGR-882194'),
    vehicleRegistrationPlate: Joi.string().required(),
    vehicleType: Joi.string().default('3.5T Insulated Truck'),
    refrigerationUnitOperational: Joi.boolean().default(false)
  }).required(),
  originDepot: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().allow('').optional(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required(),
  destinationHub: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().allow('').optional(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required()
  }).required(),
  consignments: Joi.array().items(
    Joi.object({
      commodityName: Joi.string().required(),
      variety: Joi.string().default('Standard Grade A'),
      category: Joi.string().default('vegetables'),
      packagingType: Joi.string().default('PLASTIC_CRATE'),
      unitOfMeasure: Joi.string().default('kg'),
      declaredQuantity: Joi.number().positive().required(),
      grossWeightKg: Joi.number().positive().required(),
      tareWeightKg: Joi.number().min(0).default(0),
      netWeightKg: Joi.number().positive().required(),
      numberOfCrates: Joi.number().min(0).default(1),
      temperatureClass: Joi.string().default('AMBIENT'),
      targetMinTempC: Joi.number().default(4.0),
      targetMaxTempC: Joi.number().default(12.0),
      perishabilityPriority: Joi.string().default('MEDIUM')
    })
  ).min(1).required(),
  estimatedDistanceKm: Joi.number().min(0).default(0),
  estimatedTransitTimeHours: Joi.number().min(0).default(0),
  handlingInstructions: Joi.string().allow('').optional()
});

/**
 * Joi Schema for Custody Handover
 */
const custodyTransferSchema = Joi.object({
  fromParty: Joi.object({
    name: Joi.string().required(),
    role: Joi.string().valid(...Object.values(CUSTODY_ROLES)).required(),
    contactPhone: Joi.string().allow('').optional()
  }).required(),
  toParty: Joi.object({
    name: Joi.string().required(),
    role: Joi.string().valid(...Object.values(CUSTODY_ROLES)).required(),
    contactPhone: Joi.string().allow('').optional()
  }).required(),
  locationName: Joi.string().required(),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).default(0),
    longitude: Joi.number().min(-180).max(180).default(0)
  }).default({ latitude: 0, longitude: 0 }),
  transferAction: Joi.string().valid(
    'GATE_DISPATCH',
    'HIGHWAY_CHECKPOINT',
    'CROSS_DOCK_RELOAD',
    'COLD_STORE_INTAKE',
    'FINAL_DELIVERY'
  ).default('GATE_DISPATCH'),
  sealNumberVerified: Joi.string().allow('').optional(),
  sealIntact: Joi.boolean().default(true),
  recordedCargoTempC: Joi.number().allow(null).optional(),
  notes: Joi.string().allow('').optional()
});

/**
 * POST /api/waybills
 * Issues a new DigitalWaybill.
 */
router.post('/', async (req, res) => {
  try {
    const { error, value } = createWaybillSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Waybill payload validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const waybill = new DigitalWaybill(value);
    waybill.recalculateTotals();
    waybill.generateIntegrityHash();
    await waybill.save();

    return res.status(201).json({
      success: true,
      message: 'Digital waybill issued successfully',
      data: waybill
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to issue digital waybill',
      error: err.message
    });
  }
});

/**
 * GET /api/waybills
 * Returns filtered list of waybills.
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      search,
      driverName,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};
    if (status && Object.values(WAYBILL_STATUSES).includes(status)) {
      query.status = status;
    }
    if (driverName) {
      query['carrier.driverName'] = new RegExp(driverName, 'i');
    }
    if (search) {
      query.$or = [
        { waybillNumber: new RegExp(search, 'i') },
        { 'consignee.businessName': new RegExp(search, 'i') },
        { 'shipper.contactPerson': new RegExp(search, 'i') },
        { 'carrier.vehicleRegistrationPlate': new RegExp(search, 'i') }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [waybills, total] = await Promise.all([
      DigitalWaybill.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean({ virtuals: true }),
      DigitalWaybill.countDocuments(query)
    ]);

    return res.json({
      success: true,
      count: waybills.length,
      totalCount: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: waybills
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to query waybills',
      error: err.message
    });
  }
});

/**
 * GET /api/waybills/:id
 * Fetches a single waybill by ObjectId or waybillNumber.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let waybill;

    if (id.startsWith('WB-')) {
      waybill = await DigitalWaybill.findOne({ waybillNumber: id });
    } else {
      waybill = await DigitalWaybill.findById(id);
    }

    if (!waybill) {
      return res.status(404).json({
        success: false,
        message: `Waybill not found for identifier: ${id}`
      });
    }

    const coldChainAudit = assessColdChainCompliance(waybill);

    return res.json({
      success: true,
      data: waybill,
      coldChainAudit
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch waybill details',
      error: err.message
    });
  }
});

/**
 * GET /api/waybills/:id/verify
 * Public verification endpoint for QR code scanners.
 */
router.get('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    let waybill;
    if (id.startsWith('WB-')) {
      waybill = await DigitalWaybill.findOne({ waybillNumber: id });
    } else {
      waybill = await DigitalWaybill.findById(id);
    }

    if (!waybill) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Invalid Waybill: Consignment record not found in Agrily registry'
      });
    }

    // Verify token matches cryptographic signature
    const isValidToken = token
      ? verifyWaybillToken(waybill.waybillNumber, waybill.integrityHash, token)
      : false;

    const coldChain = assessColdChainCompliance(waybill);

    return res.json({
      success: true,
      verified: isValidToken,
      waybillNumber: waybill.waybillNumber,
      status: waybill.status,
      issuedAt: waybill.issuedAt,
      expectedDeliveryDate: waybill.expectedDeliveryDate,
      carrier: {
        driverName: waybill.carrier?.driverName,
        vehiclePlate: waybill.carrier?.vehicleRegistrationPlate
      },
      origin: waybill.originDepot?.name,
      destination: waybill.destinationHub?.name,
      totalNetWeightKg: waybill.totalNetWeightKg,
      totalCratesCount: waybill.totalCratesCount,
      consignments: (waybill.consignments || []).map(c => ({
        commodityName: c.commodityName,
        netWeightKg: c.netWeightKg,
        numberOfCrates: c.numberOfCrates,
        temperatureClass: c.temperatureClass
      })),
      integrityHash: waybill.integrityHash,
      securitySeals: waybill.securitySeals,
      coldChainCompliant: coldChain.compliant,
      message: isValidToken
        ? 'Waybill authenticity verified. Cryptographic SHA-256 seal matches Agrily central authority.'
        : 'Warning: Verification token missing or invalid. Potential tamper detected.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      verified: false,
      message: 'Cryptographic verification check failed',
      error: err.message
    });
  }
});

/**
 * POST /api/waybills/:id/custody-transfer
 * Records a verifiable chain-of-custody hand-off event.
 */
router.post('/:id/custody-transfer', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = custodyTransferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid custody transfer payload',
        details: error.details.map(d => d.message)
      });
    }

    let waybill;
    if (id.startsWith('WB-')) {
      waybill = await DigitalWaybill.findOne({ waybillNumber: id });
    } else {
      waybill = await DigitalWaybill.findById(id);
    }

    if (!waybill) {
      return res.status(404).json({
        success: false,
        message: `Waybill not found for identifier: ${id}`
      });
    }

    const { record, status } = advanceWaybillCustody(waybill, value);
    await waybill.save();

    return res.json({
      success: true,
      message: 'Custody transfer recorded and cryptographically signed',
      status,
      transferRecord: record,
      currentHolder: waybill.currentHolder
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to record custody transfer',
      error: err.message
    });
  }
});

/**
 * GET /api/waybills/:id/invoice
 * Retrieves or generates the commercial invoice for a waybill.
 */
router.get('/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;

    let waybill;
    if (id.startsWith('WB-')) {
      waybill = await DigitalWaybill.findOne({ waybillNumber: id });
    } else {
      waybill = await DigitalWaybill.findById(id);
    }

    if (!waybill) {
      return res.status(404).json({
        success: false,
        message: `Waybill not found for identifier: ${id}`
      });
    }

    // Look for existing invoice or generate a new one
    let invoice;
    if (waybill.invoiceId) {
      invoice = await CommercialInvoice.findById(waybill.invoiceId);
    }

    if (!invoice) {
      invoice = generateCommercialInvoiceForWaybill(waybill);
      await invoice.save();
      waybill.invoiceId = invoice._id;
      await waybill.save();
    }

    return res.json({
      success: true,
      data: invoice
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process commercial invoice',
      error: err.message
    });
  }
});

/**
 * PATCH /api/waybills/:id/status
 * Manually updates status lifecycle with validation.
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status || !Object.values(WAYBILL_STATUSES).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(WAYBILL_STATUSES).join(', ')}`
      });
    }

    let waybill;
    if (id.startsWith('WB-')) {
      waybill = await DigitalWaybill.findOne({ waybillNumber: id });
    } else {
      waybill = await DigitalWaybill.findById(id);
    }

    if (!waybill) {
      return res.status(404).json({
        success: false,
        message: `Waybill not found: ${id}`
      });
    }

    waybill.status = status;
    if (notes) waybill.notes = notes;
    if (status === WAYBILL_STATUSES.DELIVERED && !waybill.actualDeliveryDate) {
      waybill.actualDeliveryDate = new Date();
    }

    waybill.generateIntegrityHash();
    await waybill.save();

    return res.json({
      success: true,
      message: `Waybill status updated to ${status}`,
      data: waybill
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update waybill status',
      error: err.message
    });
  }
});

/**
 * GET /api/waybills/:id/print
 * Returns official print-ready HTML layout.
 */
router.get('/:id/print', async (req, res) => {
  try {
    const { id } = req.params;

    let waybill;
    if (id.startsWith('WB-')) {
      waybill = await DigitalWaybill.findOne({ waybillNumber: id });
    } else {
      waybill = await DigitalWaybill.findById(id);
    }

    if (!waybill) {
      return res.status(404).send('<h1>Waybill Not Found</h1>');
    }

    const html = generateWaybillHtmlPrintout(waybill);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    return res.status(500).send(`<h1>Error generating printout: ${err.message}</h1>`);
  }
});

module.exports = router;
