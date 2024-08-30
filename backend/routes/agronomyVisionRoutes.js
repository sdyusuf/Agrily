/**
 * @file agronomyVisionRoutes.js
 * @description Express Router for Agronomy AI Leaf Disease Vision,
 * Treatment Advisor, and Regional Outbreak Contagion Telemetry APIs.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { LeafPathologyInferenceEngine } = require('../services/leafPathologyInferenceEngine');
const { AgronomyTreatmentAdvisorService } = require('../services/agronomyTreatmentAdvisorService');
const { CropOutbreakContagionService } = require('../services/cropOutbreakContagionService');
const {
  CropPathologyRecord,
  SUPPORTED_CROPS,
  PATHOGEN_TYPES,
  SEVERITY_STAGES,
  TRIAGE_PRIORITIES,
  AGRO_ECOLOGICAL_ZONES
} = require('../models/CropPathologyRecord');

/**
 * In-memory fallback cache for diagnoses when MongoDB is in mock or offline mode during testing
 */
const IN_MEMORY_DIAGNOSES = [];

/**
 * @route   GET /api/agronomy-vision/supported-taxonomies
 * @desc    Retrieves all supported crops, pathogen types, severity tiers, and knowledge graph taxonomy
 * @access  Public
 */
router.get('/supported-taxonomies', (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      supportedCrops: SUPPORTED_CROPS,
      pathogenTypes: PATHOGEN_TYPES,
      severityStages: SEVERITY_STAGES,
      triagePriorities: TRIAGE_PRIORITIES,
      agroEcologicalZones: AGRO_ECOLOGICAL_ZONES,
      taxonomyGraph: LeafPathologyInferenceEngine.getTaxonomy()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/agronomy-vision/diagnose
 * @desc    Executes AI leaf pathology inference on submitted foliar image
 * @access  Public / Farmer
 */
router.post('/diagnose', async (req, res) => {
  try {
    const {
      cropType,
      farmerName,
      farmLocation,
      fieldAcreageHectares,
      imageUrl,
      imagePayload,
      capturedVia,
      forcedDiseaseCode,
      severityLevel
    } = req.body;

    if (!cropType) {
      return res.status(400).json({ success: false, error: 'Target crop commodity is required.' });
    }

    // 1. Run neural inference engine
    const inferenceResult = LeafPathologyInferenceEngine.inferLeafPathology({
      cropType,
      imageUrl: imageUrl || 'https://cdn.agrily.africa/default-leaf.jpg',
      imagePayload,
      forcedDiseaseCode,
      severityLevel,
      fieldAcreageHectares: fieldAcreageHectares || 1.0
    });

    const parsedAcreage = Number(fieldAcreageHectares) || 1.0;
    const resolvedFarmerName = farmerName || 'Anonymous Agro-Producer';
    const state = (farmLocation && farmLocation.state) ? farmLocation.state.toUpperCase() : 'KANO';
    const lga = (farmLocation && farmLocation.lga) ? farmLocation.lga : 'General LGA';

    // 2. Build pathology record
    const recordPayload = {
      farmerName: resolvedFarmerName,
      farmLocation: {
        state,
        lga,
        agroZone: (farmLocation && farmLocation.agroZone) || 'SUDAN_SAVANNA',
        coordinates: (farmLocation && farmLocation.coordinates) || { latitude: 11.9964, longitude: 8.5167 }
      },
      cropType: inferenceResult.cropType,
      fieldAcreageHectares: parsedAcreage,
      imageMetadata: {
        imageUrl: imageUrl || 'https://cdn.agrily.africa/default-leaf.jpg',
        capturedVia: capturedVia || 'MOBILE_CAMERA'
      },
      aiInference: {
        diseaseCode: inferenceResult.diagnosis.diseaseCode,
        commonDiseaseName: inferenceResult.diagnosis.commonDiseaseName,
        pathogenType: inferenceResult.diagnosis.pathogenType,
        confidenceScore: inferenceResult.diagnosis.confidenceScore,
        severityStage: inferenceResult.diagnosis.severityStage,
        affectedCanopyPercentage: inferenceResult.diagnosis.affectedCanopyPercentage,
        triagePriority: inferenceResult.diagnosis.triagePriority,
        modelEngineVersion: inferenceResult.visionTelemetry.modelEngine
      },
      economicImpactEstimate: {
        projectedYieldLossPct: inferenceResult.economicImpact.projectedYieldLossPct,
        estimatedFinancialLossNgn: inferenceResult.economicImpact.estimatedFinancialLossNgn
      },
      treatmentPrescription: {
        recommendedActionPlan: `Initiate recommended phytosanitary treatment for ${inferenceResult.diagnosis.commonDiseaseName}.`,
        isContagionReported: inferenceResult.diagnosis.requiresImmediateQuarantine
      }
    };

    // 3. Persist to MongoDB if active connection, else in-memory cache
    let savedDoc;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const record = new CropPathologyRecord(recordPayload);
        savedDoc = await record.save();
      } catch (dbErr) {
        console.warn('Pathology DB save fallback:', dbErr.message);
      }
    }

    if (!savedDoc) {
      const mockDoc = new CropPathologyRecord(recordPayload);
      mockDoc.computeTriageAndSeal();
      IN_MEMORY_DIAGNOSES.unshift(mockDoc);
      savedDoc = mockDoc;
    }

    return res.status(201).json({
      success: true,
      message: 'Leaf pathology AI diagnosis successfully generated.',
      record: savedDoc,
      visionTelemetry: inferenceResult.visionTelemetry,
      cryptographicSeal: savedDoc.cryptographicSeal || inferenceResult.cryptographicSeal
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/agronomy-vision/diagnoses
 * @desc    List recent crop leaf diagnoses with filtering
 * @access  Public
 */
router.get('/diagnoses', async (req, res) => {
  try {
    const { crop, state, triagePriority, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (crop) filter.cropType = crop.toUpperCase();
    if (state) filter['farmLocation.state'] = state.toUpperCase();
    if (triagePriority) filter['aiInference.triagePriority'] = triagePriority;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
        const records = await CropPathologyRecord.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10));

        const total = await CropPathologyRecord.countDocuments(filter);
        return res.status(200).json({
          success: true,
          count: records.length,
          total,
          records
        });
      } catch (err) {
        console.warn('DB list error, using cache:', err.message);
      }
    }

    // In-memory fallback
    let filtered = [...IN_MEMORY_DIAGNOSES];
    if (filter.cropType) filtered = filtered.filter(r => r.cropType === filter.cropType);
    if (filter['farmLocation.state']) filtered = filtered.filter(r => r.farmLocation && r.farmLocation.state === filter['farmLocation.state']);
    if (filter['aiInference.triagePriority']) filtered = filtered.filter(r => r.aiInference && r.aiInference.triagePriority === filter['aiInference.triagePriority']);

    return res.status(200).json({
      success: true,
      count: filtered.length,
      total: filtered.length,
      records: filtered.slice(0, parseInt(limit, 10))
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/agronomy-vision/diagnoses/:id
 * @desc    Fetch individual pathology record by diagnosisId
 * @access  Public
 */
router.get('/diagnoses/:id', async (req, res) => {
  try {
    const idParam = req.params.id;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const query = mongoose.isValidObjectId(idParam)
          ? { $or: [{ _id: idParam }, { diagnosisId: idParam.toUpperCase() }] }
          : { diagnosisId: idParam.toUpperCase() };

        const doc = await CropPathologyRecord.findOne(query);
        if (doc) {
          return res.status(200).json({ success: true, record: doc });
        }
      } catch (err) {
        console.warn('DB find error:', err.message);
      }
    }

    // Check memory cache
    const cached = IN_MEMORY_DIAGNOSES.find(
      r => (r.diagnosisId && r.diagnosisId.toUpperCase() === idParam.toUpperCase()) ||
           (r._id && r._id.toString() === idParam)
    );

    if (!cached) {
      return res.status(404).json({ success: false, error: `Pathology record "${idParam}" not found.` });
    }

    return res.status(200).json({ success: true, record: cached });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/agronomy-vision/treatment-prescription
 * @desc    Generates dynamic treatment prescription by disease and field acreage
 * @access  Public
 */
router.post('/treatment-prescription', (req, res) => {
  try {
    const { diseaseCode, cropType, fieldAcreageHectares, preferOrganicOnly } = req.body;

    if (!diseaseCode) {
      return res.status(400).json({ success: false, error: 'Disease classification code is required.' });
    }

    const prescription = AgronomyTreatmentAdvisorService.generatePrescription({
      diseaseCode,
      cropType,
      fieldAcreageHectares,
      preferOrganicOnly
    });

    return res.status(200).json(prescription);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/agronomy-vision/outbreak-telemetry
 * @desc    Retrieves 36-state national disease outbreak heatmap and contagion statistics
 * @access  Public
 */
router.get('/outbreak-telemetry', (req, res) => {
  try {
    const summary = CropOutbreakContagionService.getOutbreakTelemetrySummary();
    return res.status(200).json(summary);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/agronomy-vision/corridor-clearance/:state
 * @desc    Checks phytosanitary haulage transit clearance for a specific state
 * @access  Public / Logistics
 */
router.get('/corridor-clearance/:state', (req, res) => {
  try {
    const stateName = req.params.state;
    const clearance = CropOutbreakContagionService.checkCorridorPhytosanitaryClearance(stateName);
    return res.status(200).json({ success: true, clearance });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/agronomy-vision/report-outbreak
 * @desc    Registers new localized disease outbreak cluster report
 * @access  Public / Field Officers
 */
router.post('/report-outbreak', (req, res) => {
  try {
    const incident = req.body;
    const report = CropOutbreakContagionService.reportOutbreakCluster(incident);
    return res.status(201).json(report);
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
