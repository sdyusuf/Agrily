/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: ESCROW VAULT & TRIBUNAL REST ROUTES
 * ==============================================================================
 * 
 * Express router exposing REST endpoints for:
 *  - Tri-Party Escrow Vault initialization & milestone releases
 *  - Dock arrival logging & 48-hour countdown time-locks
 *  - Quality Inspection Certificate lodging & grading verification
 *  - Dispute Tribunal filing, evidence locker submissions & verdict adjudication
 * 
 * @module routes/escrowTribunalRoutes
 * @author Agrily Core Engineering
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { EscrowSettlementVault } = require('../models/EscrowSettlementVault');
const { QualityInspectionCertificate } = require('../models/QualityInspectionCertificate');
const { DisputeTribunalCase } = require('../models/DisputeTribunalCase');
const { InspectionGradingEngine } = require('../services/inspectionGradingEngine');
const { TribunalArbitrationEngine } = require('../services/tribunalArbitrationEngine');
const { EscrowSettlementService } = require('../services/escrowSettlementService');

// ==============================================================================
// JOI VALIDATION SCHEMAS
// ==============================================================================

const createVaultSchema = Joi.object({
  orderId: Joi.string().required(),
  waybillNumber: Joi.string().optional().allow(null, ''),
  produceSubtotal: Joi.number().min(1).required(),
  haulageFreightTariff: Joi.number().min(0).optional().default(0),
  coldChainGuaranteeFee: Joi.number().min(0).optional().default(0),
  currency: Joi.string().valid('NGN', 'KES', 'USD', 'GHS').optional().default('NGN'),
  buyer: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional().allow(null, ''),
    businessName: Joi.string().optional().allow(null, '')
  }).required(),
  farmer: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional().allow(null, ''),
    farmName: Joi.string().optional().allow(null, ''),
    payoutBankCode: Joi.string().optional().default('058'),
    payoutAccountNumber: Joi.string().optional().default('0123456789')
  }).required(),
  carrier: Joi.object({
    name: Joi.string().optional().default('Agrily Freight Logistics'),
    phone: Joi.string().optional().default('+2348030000001'),
    vehiclePlateNumber: Joi.string().optional().default('KNO-882-XA'),
    payoutBankCode: Joi.string().optional().default('011'),
    payoutAccountNumber: Joi.string().optional().default('2034567890')
  }).optional()
});

const releaseMilestoneSchema = Joi.object({
  milestoneKey: Joi.string().required(),
  signatoryPin: Joi.string().min(4).required(),
  txRef: Joi.string().optional().allow(null, '')
});

const submitInspectionSchema = Joi.object({
  produceCategory: Joi.string().valid('grains', 'tubers', 'fruits', 'vegetables', 'livestock').required(),
  produceName: Joi.string().required(),
  inspectedQuantityKg: Joi.number().min(1).required(),
  inspectedCratesBags: Joi.number().min(1).optional().default(1),
  inspectionFacility: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    state: Joi.string().required(),
    gpsCoordinates: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required()
    }).required()
  }).required(),
  inspector: Joi.object({
    name: Joi.string().required(),
    inspectorBadgeNumber: Joi.string().required(),
    contactPhone: Joi.string().required()
  }).required(),
  metrics: Joi.object({
    moistureContentPercentage: Joi.number().min(0).max(100).required(),
    foreignMatterPercentage: Joi.number().min(0).max(50).required(),
    spoilageRotPercentage: Joi.number().min(0).max(100).required(),
    pestInfestationDetected: Joi.boolean().optional().default(false),
    moldMildewDetected: Joi.boolean().optional().default(false),
    dockCoreTemperatureCelsius: Joi.number().required(),
    dockAmbientTemperatureCelsius: Joi.number().optional().default(28.0),
    sizeMaturityUniformityScore: Joi.number().min(1).max(10).optional().default(8)
  }).required(),
  inspectorDigitalSignature: Joi.string().required(),
  receiverRepresentativeSignature: Joi.object({
    name: Joi.string().required(),
    title: Joi.string().optional().default('Receiving Dock Manager')
  }).required()
});

const fileDisputeSchema = Joi.object({
  disputeCategory: Joi.string().valid(
    'PRODUCT_SPOILAGE_ROT',
    'EXCESSIVE_MOISTURE_GRAIN',
    'FOREIGN_MATTER_CONTAMINATION',
    'WEIGHT_SHORTAGE_UNDERWEIGHT',
    'TRANSIT_DELAY_PERISHABLE_LOSS',
    'COLD_CHAIN_TEMPERATURE_BREACH',
    'WRONG_PRODUCE_VARIETY'
  ).required(),
  claimant: Joi.object({
    role: Joi.string().valid('BUYER', 'FARMER', 'CARRIER').required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required()
  }).required(),
  initialClaimSummary: Joi.string().min(20).required(),
  demandedRefundAmount: Joi.number().min(0).required()
});

const submitEvidenceSchema = Joi.object({
  evidenceType: Joi.string().valid(
    'QUALITY_INSPECTION_CERT',
    'IOT_TEMPERATURE_LOG',
    'DIGITAL_WAYBILL_CUSTODY',
    'HIGH_RES_PHOTO',
    'WEIGHBRIDGE_TICKET',
    'WRITTEN_STATEMENT'
  ).required(),
  submittedByRole: Joi.string().valid('BUYER', 'FARMER', 'CARRIER', 'INSPECTOR', 'SYSTEM_AUDITOR').required(),
  submittedByName: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  attachmentUrl: Joi.string().optional().allow(null, ''),
  telemetryMetadata: Joi.object().optional()
});

// ==============================================================================
// CONTROLLER ENDPOINTS
// ==============================================================================

/**
 * POST /api/escrow-vault/create
 * Initialize a new multi-tier escrow settlement vault
 */
router.post('/create', async (req, res) => {
  try {
    const { error, value } = createVaultSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const vault = await EscrowSettlementService.initializeVault(value);
    await vault.save();

    return res.status(201).json({
      success: true,
      message: 'Escrow settlement vault successfully initialized and funds locked.',
      data: vault
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/escrow-vault
 * Query list of vaults with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const { status, buyerEmail, farmerEmail, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (buyerEmail) filter['buyer.email'] = buyerEmail.toLowerCase();
    if (farmerEmail) filter['farmer.email'] = farmerEmail.toLowerCase();

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const vaults = await EscrowSettlementVault.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const totalCount = await EscrowSettlementVault.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: vaults.length,
      totalCount,
      data: vaults
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/escrow-vault/:id
 * Retrieve a single vault by ID or vaultNumber
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('VAULT-') ? { vaultNumber: id } : { _id: id };
    const vault = await EscrowSettlementVault.findOne(query);

    if (!vault) {
      return res.status(404).json({ success: false, message: 'Escrow vault not found' });
    }

    return res.status(200).json({ success: true, data: vault });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/escrow-vault/:id/dock-arrival
 * Record receiver dock arrival and initiate 48-hour inspection countdown
 */
router.post('/:id/dock-arrival', async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('VAULT-') ? { vaultNumber: id } : { _id: id };
    const vault = await EscrowSettlementVault.findOne(query);

    if (!vault) {
      return res.status(404).json({ success: false, message: 'Escrow vault not found' });
    }

    const arrivalResult = EscrowSettlementService.recordDockArrival(vault, new Date());
    await vault.save();

    return res.status(200).json({
      success: true,
      message: 'Dock arrival registered; 48-hour inspection countdown initiated.',
      data: arrivalResult
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/escrow-vault/:id/inspect
 * Submit dock inspection report and generate QualityInspectionCertificate
 */
router.post('/:id/inspect', async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('VAULT-') ? { vaultNumber: id } : { _id: id };
    const vault = await EscrowSettlementVault.findOne(query);

    if (!vault) {
      return res.status(404).json({ success: false, message: 'Escrow vault not found' });
    }

    const { error, value } = submitInspectionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const certificate = await InspectionGradingEngine.createCertificate({
      ...value,
      vaultNumber: vault.vaultNumber,
      waybillNumber: vault.waybillNumber || 'WB-DOCK-DIRECT',
      orderId: vault.orderId
    });

    await certificate.save();

    vault.inspectionCertificateId = certificate._id;
    vault.inspectionPassed = certificate.isAcceptableForCommerce;
    vault.recalculateFinancials();
    await vault.save();

    return res.status(201).json({
      success: true,
      message: `Inspection certificate lodged. Overall Grade: ${certificate.overallGrade}`,
      data: certificate
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/escrow-vault/:id/release-milestone
 * Authorize release of a specific milestone with PIN
 */
router.post('/:id/release-milestone', async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('VAULT-') ? { vaultNumber: id } : { _id: id };
    const vault = await EscrowSettlementVault.findOne(query);

    if (!vault) {
      return res.status(404).json({ success: false, message: 'Escrow vault not found' });
    }

    const { error, value } = releaseMilestoneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const result = await EscrowSettlementService.releaseMilestone(
      vault,
      value.milestoneKey,
      value.signatoryPin,
      value.txRef
    );

    await vault.save();

    return res.status(200).json({
      success: true,
      message: `Milestone '${value.milestoneKey}' released successfully.`,
      data: result
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/escrow-vault/:id/dispute
 * File formal dispute arbitration case and lock vault
 */
router.post('/:id/dispute', async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('VAULT-') ? { vaultNumber: id } : { _id: id };
    const vault = await EscrowSettlementVault.findOne(query);

    if (!vault) {
      return res.status(404).json({ success: false, message: 'Escrow vault not found' });
    }

    if (vault.status === 'ARBITRATION_LOCKED') {
      return res.status(400).json({ success: false, message: 'Dispute is already active for this vault.' });
    }

    const { error, value } = fileDisputeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const respondentRole = value.claimant.role === 'BUYER' ? 'FARMER' : 'BUYER';
    const respondentInfo = respondentRole === 'FARMER'
      ? { role: 'FARMER', name: vault.farmer.name, email: vault.farmer.email, phone: vault.farmer.phone }
      : { role: 'BUYER', name: vault.buyer.name, email: vault.buyer.email, phone: vault.buyer.phone };

    const tribunalCase = new DisputeTribunalCase({
      vaultNumber: vault.vaultNumber,
      orderId: vault.orderId,
      waybillNumber: vault.waybillNumber,
      disputeCategory: value.disputeCategory,
      claimant: value.claimant,
      respondent: respondentInfo,
      carrierParty: {
        driverName: vault.carrier.name,
        vehiclePlateNumber: vault.carrier.vehiclePlateNumber
      },
      initialClaimSummary: value.initialClaimSummary,
      demandedRefundAmount: value.demandedRefundAmount,
      totalEscrowDisputed: vault.totalEscrowAmount
    });

    await tribunalCase.save();

    vault.lockForArbitration(tribunalCase._id, tribunalCase.docketNumber);
    await vault.save();

    return res.status(201).json({
      success: true,
      message: `Arbitration case lodged under Docket ${tribunalCase.docketNumber}. Escrow vault locked.`,
      data: tribunalCase
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/escrow-vault/:id/tribunal/evidence
 * Submit evidence attachment to active tribunal case
 */
router.post('/:id/tribunal/evidence', async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('VAULT-') ? { vaultNumber: id } : { _id: id };
    const vault = await EscrowSettlementVault.findOne(query);

    if (!vault || !vault.activeTribunalCaseId) {
      return res.status(404).json({ success: false, message: 'No active tribunal case linked to this vault.' });
    }

    const tribunalCase = await DisputeTribunalCase.findById(vault.activeTribunalCaseId);
    if (!tribunalCase) {
      return res.status(404).json({ success: false, message: 'Tribunal case document not found.' });
    }

    const { error, value } = submitEvidenceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    tribunalCase.addEvidenceItem(value);
    await tribunalCase.save();

    return res.status(200).json({
      success: true,
      message: 'Evidence successfully attached to tribunal evidence locker.',
      data: tribunalCase
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/escrow-vault/:id/tribunal/adjudicate
 * Execute expert tribunal adjudication and issue verdict
 */
router.post('/:id/tribunal/adjudicate', async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('VAULT-') ? { vaultNumber: id } : { _id: id };
    const vault = await EscrowSettlementVault.findOne(query);

    if (!vault || !vault.activeTribunalCaseId) {
      return res.status(404).json({ success: false, message: 'No active dispute linked to this vault.' });
    }

    const tribunalCase = await DisputeTribunalCase.findById(vault.activeTribunalCaseId);
    if (!tribunalCase) {
      return res.status(404).json({ success: false, message: 'Tribunal case not found.' });
    }

    // Pull inspection certificate if present
    let certificate = null;
    if (vault.inspectionCertificateId) {
      certificate = await QualityInspectionCertificate.findById(vault.inspectionCertificateId);
    }

    const evaluation = TribunalArbitrationEngine.evaluateDisputeLiability({
      tribunalCase,
      inspectionCertificate: certificate,
      coldChainAudit: req.body.coldChainAudit || null,
      totalVaultEscrow: vault.totalEscrowAmount
    });

    TribunalArbitrationEngine.adjudicateAndSealCase(
      tribunalCase,
      evaluation,
      req.body.arbitratorName || 'Hon. Ibrahim Galadima (Senior Agronomy Arbitrator)'
    );

    await tribunalCase.save();

    return res.status(200).json({
      success: true,
      message: `Verdict issued under Docket ${tribunalCase.docketNumber}. Ruling: ${tribunalCase.arbitrationVerdict.outcome}`,
      data: tribunalCase
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/escrow-vault/:id/tribunal/execute
 * Execute financial disbursement ordered by tribunal verdict
 */
router.post('/:id/tribunal/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('VAULT-') ? { vaultNumber: id } : { _id: id };
    const vault = await EscrowSettlementVault.findOne(query);

    if (!vault || !vault.activeTribunalCaseId) {
      return res.status(404).json({ success: false, message: 'No active dispute linked to this vault.' });
    }

    const tribunalCase = await DisputeTribunalCase.findById(vault.activeTribunalCaseId);
    if (!tribunalCase) {
      return res.status(404).json({ success: false, message: 'Tribunal case not found.' });
    }

    const executionResult = EscrowSettlementService.executeTribunalSettlement(vault, tribunalCase);
    await vault.save();
    await tribunalCase.save();

    return res.status(200).json({
      success: true,
      message: 'Tribunal settlement executed and funds disbursed.',
      data: executionResult
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/escrow-vault/:id/certificate-print
 * Compile standalone printable settlement certificate HTML
 */
router.get('/:id/certificate-print', async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('VAULT-') ? { vaultNumber: id } : { _id: id };
    const vault = await EscrowSettlementVault.findOne(query);

    if (!vault) {
      return res.status(404).send('Escrow vault not found.');
    }

    const html = EscrowSettlementService.generateSettlementAuditReportHtml(vault);
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

module.exports = router;
