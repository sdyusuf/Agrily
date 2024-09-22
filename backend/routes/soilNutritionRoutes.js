/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - SOIL NUTRITION & FERTILITY REST API ROUTER
 * ==============================================================================
 * 
 * Architecture Overview:
 * Express router handling tropical pedology diagnostics, USDA ternary soil texture
 * classification, Liebig's Law of the Minimum fertility evaluation, Simplex
 * fertilizer bag-mix optimization, and regional agro-ecological zone baselines.
 * 
 * Endpoints:
 * - POST /api/soil-nutrition/sample : Register soil laboratory or field test record
 * - GET  /api/soil-nutrition/sample/:sampleId : Retrieve single soil sample record
 * - GET  /api/soil-nutrition/samples/farmer/:farmerEmail : Retrieve all samples for farmer
 * - POST /api/soil-nutrition/evaluate-chemistry : Perform Liebig fertility diagnostics
 * - POST /api/soil-nutrition/optimize-fertilizer : Calculate lowest-cost bag mix & schedule
 * - GET  /api/soil-nutrition/agro-zone-profile/:zone : Fetch regional baseline profile
 * - GET  /api/soil-nutrition/agro-zone-profile-by-state/:state : Resolve baseline by Nigerian state
 * - GET  /api/soil-nutrition/fertilizer-catalog : List commercial fertilizer products & prices
 * - POST /api/soil-nutrition/generate-prescription : Generate verified diagnostic prescription
 * 
 * @module routes/soilNutritionRoutes
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 */

'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');

const SoilSampleRecord = require('../models/SoilSampleRecord');
const FertilizerProductCatalog = require('../models/FertilizerProductCatalog');
const SoilPrescriptionPlan = require('../models/SoilPrescriptionPlan');
const { SoilChemistryEvaluationEngine } = require('../services/soilChemistryEvaluationEngine');
const { FertilizerOptimizationEngine, COMMERCIAL_PRODUCTS } = require('../services/fertilizerOptimizationEngine');
const { RegionalAgroZoneSoilProfileService } = require('../services/regionalAgroZoneSoilProfileService');
const { SoilCationBalanceService } = require('../services/soilCationBalanceService');
const { SoilOrganicMatterDynamicsService } = require('../services/soilOrganicMatterDynamicsService');
const { SoilMicrobiomeEnzymeActivityService } = require('../services/soilMicrobiomeEnzymeActivityService');
const { CropSpecificFertilityAdvisoryService } = require('../services/cropSpecificFertilityAdvisoryService');

/**
 * In-memory fallback caches for testing or when MongoDB is running in offline mode
 */
const IN_MEMORY_SOIL_SAMPLES = [];
const IN_MEMORY_PRESCRIPTIONS = [];

/**
 * Helper to generate unique diagnostic sample ID
 */
function generateSampleId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SL-${timestamp}-${randomSuffix}`;
}

/**
 * Helper to generate unique prescription plan ID
 */
function generatePrescriptionId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RX-SOIL-${timestamp}-${randomSuffix}`;
}

/**
 * @route   GET /api/soil-nutrition/fertilizer-catalog
 * @desc    Retrieves commercial fertilizer database with guaranteed nutrient percentages & prices
 * @access  Public
 */
router.get('/fertilizer-catalog', async (req, res) => {
  try {
    let catalog = [];
    if (mongoose.connection.readyState === 1) {
      catalog = await FertilizerProductCatalog.find({ isActive: true }).lean();
    }
    
    // Fallback to embedded catalog if database catalog is empty
    if (!catalog || catalog.length === 0) {
      catalog = Object.values(COMMERCIAL_PRODUCTS).map((p) => ({
        productCode: p.code,
        brandName: p.name,
        formula: p.code,
        nitrogenPct: Number(((p.nKgPerBag / 50) * 100).toFixed(1)),
        phosphatePct: Number(((p.p2o5KgPerBag / 50) * 100).toFixed(1)),
        potashPct: Number(((p.k2oKgPerBag / 50) * 100).toFixed(1)),
        sulfurPct: Number(((p.sulfurKgPerBag / 50) * 100).toFixed(1)),
        unitBagWeightKg: 50,
        pricePerBagNaira: p.pricePerBagNGN,
        preferredApplicationTiming: p.preferredTiming,
        applicationInstructions: p.instructions,
        isSubsidized: false,
        isActive: true
      }));
    }

    return res.status(200).json({
      success: true,
      count: catalog.length,
      catalog
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/soil-nutrition/agro-zone-profile/:zone
 * @desc    Fetches regional pedological baseline profile by zone key
 * @access  Public
 */
router.get('/agro-zone-profile/:zone', (req, res) => {
  try {
    const { zone } = req.params;
    const profile = RegionalAgroZoneSoilProfileService.getProfileByZone(zone);
    return res.status(200).json({
      success: true,
      zone: profile.zoneKey,
      profile
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/soil-nutrition/agro-zone-profile-by-state/:state
 * @desc    Resolves agro-ecological zone and baseline chemistry from Nigerian state name
 * @access  Public
 */
router.get('/agro-zone-profile-by-state/:state', (req, res) => {
  try {
    const { state } = req.params;
    const profile = RegionalAgroZoneSoilProfileService.getProfileByState(state);
    return res.status(200).json({
      success: true,
      queriedState: state,
      profile
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/soil-nutrition/agro-zones
 * @desc    Lists all 7 Nigerian agro-ecological soil zones with pedological summaries
 * @access  Public
 */
router.get('/agro-zones', (req, res) => {
  try {
    const zones = RegionalAgroZoneSoilProfileService.listAllZones();
    return res.status(200).json({
      success: true,
      count: zones.length,
      zones
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/soil-nutrition/sample
 * @desc    Registers a new laboratory or telemetry soil sample record with USDA ternary texture and cryptographic seal
 * @access  Public / Farmer
 */
router.post('/sample', async (req, res) => {
  try {
    const {
      farmerEmail,
      farmerName,
      farmLocation,
      fieldAcreageHectares,
      targetCrop,
      soilPhysics,
      soilChemistry,
      samplingMethod
    } = req.body;

    if (!farmerEmail || !farmLocation?.state || !targetCrop || !soilChemistry?.phWater) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: farmerEmail, farmLocation.state, targetCrop, and soilChemistry.phWater are mandatory.'
      });
    }

    const sampleId = req.body.sampleId || generateSampleId();

    // Physical fractions
    const sand = Number(soilPhysics?.sandPercentage ?? soilPhysics?.sandPct ?? 60);
    const silt = Number(soilPhysics?.siltPercentage ?? soilPhysics?.siltPct ?? 25);
    const clay = Number(soilPhysics?.clayPercentage ?? soilPhysics?.clayPct ?? 15);
    const textureClass = SoilSampleRecord.classifySoilTexture(sand, silt, clay);

    // Cation concentrations
    const ca = Number(soilChemistry.exchangeableCalciumCa ?? soilChemistry.exchangeableCations?.calciumCa ?? 3.8);
    const mg = Number(soilChemistry.exchangeableMagnesiumMg ?? soilChemistry.exchangeableCations?.magnesiumMg ?? 1.4);
    const k = Number(soilChemistry.exchangeablePotassiumK ?? soilChemistry.exchangeableCations?.potassiumK ?? 0.35);
    const na = Number(soilChemistry.exchangeableSodiumNa ?? soilChemistry.exchangeableCations?.sodiumNa ?? 0.05);
    const acidity = Number(soilChemistry.exchangeableAcidityAlPlusH ?? 0.15);

    const agroZone = farmLocation.agroEcologicalZone || RegionalAgroZoneSoilProfileService.getProfileByState(farmLocation.state).zoneKey;

    const newRecord = new SoilSampleRecord({
      sampleId,
      farmerEmail: farmerEmail.toLowerCase().trim(),
      farmerName: farmerName || 'Agrily Certified Grower',
      farmLocation: {
        state: farmLocation.state.toUpperCase().trim(),
        lga: farmLocation.lga || 'General LGA',
        villageOrTown: farmLocation.farmName || farmLocation.villageOrTown || 'Agrily Farm Hub',
        coordinates: farmLocation.coordinates || { latitude: 9.082, longitude: 8.6753 }
      },
      agroEcologicalZone: agroZone,
      fieldAcreageHectares: Number(fieldAcreageHectares) || 2.0,
      targetCrop: targetCrop.toUpperCase().trim(),
      soilPhysics: {
        sandPct: sand,
        siltPct: silt,
        clayPct: clay,
        textureClass,
        bulkDensityGPerCm3: Number(soilPhysics?.bulkDensityGramsPerCm3 ?? soilPhysics?.bulkDensityGPerCm3 ?? 1.35)
      },
      soilChemistry: {
        phWater: Number(soilChemistry.phWater),
        organicCarbonPct: Number(soilChemistry.organicCarbonPct || 0.8),
        totalNitrogenPct: Number(soilChemistry.totalNitrogenPct || 0.08),
        availablePhosphorusBray1MgPerKg: Number(soilChemistry.availablePhosphorusBray1MgPerKg || 12.0),
        exchangeableAcidityAlPlusH: acidity,
        exchangeableCations: {
          calciumCa: ca,
          magnesiumMg: mg,
          potassiumK: k,
          sodiumNa: na
        }
      },
      micronutrientsPpm: {
        sulfurS: Number(soilChemistry.sulfateSulfurMgPerKg ?? soilChemistry.sulfurPpm ?? 8.5),
        zincZn: Number(soilChemistry.zincPpm ?? 1.8),
        boronB: Number(soilChemistry.boronPpm ?? 0.4)
      }
    });

    // Compute diagnostics and seal
    newRecord.computeDiagnosticsAndSeal();

    if (mongoose.connection.readyState === 1) {
      await newRecord.save();
    }

    const recordObj = newRecord.toObject({ virtuals: true });
    
    // Enrich with ergonomic aliases for consumers & tests
    recordObj.soilPhysics.texturalClass = recordObj.soilPhysics.textureClass;
    recordObj.cationExchangeProperties = {
      effectiveCec: recordObj.soilChemistry.effectiveCec,
      baseSaturationPct: recordObj.soilChemistry.baseSaturationPct
    };
    recordObj.cryptographicSeal = {
      hashSha256: newRecord.cryptographicSeal,
      signature: newRecord.cryptographicSeal
    };

    IN_MEMORY_SOIL_SAMPLES.push(recordObj);

    return res.status(201).json({
      success: true,
      message: 'Soil sample record validated and sealed successfully.',
      sampleId: newRecord.sampleId,
      record: recordObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/soil-nutrition/sample/:sampleId
 * @desc    Retrieves single soil sample record by ID
 * @access  Public
 */
router.get('/sample/:sampleId', async (req, res) => {
  try {
    const { sampleId } = req.params;

    let record = null;
    if (mongoose.connection.readyState === 1) {
      record = await SoilSampleRecord.findOne({ sampleId }).lean();
    }

    if (!record) {
      record = IN_MEMORY_SOIL_SAMPLES.find((s) => s.sampleId === sampleId);
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        error: `Soil sample record with ID ${sampleId} not found.`
      });
    }

    return res.status(200).json({
      success: true,
      record
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/soil-nutrition/samples/farmer/:farmerEmail
 * @desc    Retrieves all soil sample records for a given farmer email
 * @access  Public / Farmer
 */
router.get('/samples/farmer/:farmerEmail', async (req, res) => {
  try {
    const { farmerEmail } = req.params;

    let records = [];
    if (mongoose.connection.readyState === 1) {
      records = await SoilSampleRecord.find({ farmerEmail }).lean();
    }

    const inMemoryMatches = IN_MEMORY_SOIL_SAMPLES.filter(
      (s) => s.farmerEmail && s.farmerEmail.toLowerCase() === farmerEmail.toLowerCase()
    );

    const combined = [...records, ...inMemoryMatches];
    const uniqueRecords = Array.from(new Map(combined.map((item) => [item.sampleId, item])).values());

    return res.status(200).json({
      success: true,
      count: uniqueRecords.length,
      records: uniqueRecords
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/soil-nutrition/evaluate-chemistry
 * @desc    Executes Liebig Law of the Minimum evaluation, soil fertility indexing, and liming requirement
 * @access  Public
 */
router.post('/evaluate-chemistry', (req, res) => {
  try {
    const { crop, soilChemistry } = req.body;

    if (!crop || !soilChemistry) {
      return res.status(400).json({
        success: false,
        error: 'Crop commodity and soilChemistry object are required.'
      });
    }

    const evaluation = SoilChemistryEvaluationEngine.evaluateSoilFertility(soilChemistry, crop);

    return res.status(200).json({
      success: true,
      evaluation
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/soil-nutrition/optimize-fertilizer
 * @desc    Executes Simplex fertilizer bag-mix optimization to satisfy elemental deficit with minimum commercial 50kg bags
 * @access  Public
 */
router.post('/optimize-fertilizer', (req, res) => {
  try {
    const {
      crop,
      soilChemistry,
      fieldAcreageHectares,
      targetYieldTonsPerHa,
      preferredBasalType
    } = req.body;

    if (!crop || !soilChemistry) {
      return res.status(400).json({
        success: false,
        error: 'Crop commodity and soilChemistry parameters are required.'
      });
    }

    const optimization = FertilizerOptimizationEngine.optimizeBagMix({
      crop,
      soilChemistry,
      fieldAcreageHectares: fieldAcreageHectares || 1.0,
      targetYieldTonsPerHa,
      preferredBasalType: preferredBasalType || 'NPK_15_15_15'
    });

    return res.status(200).json({
      success: true,
      optimization
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/soil-nutrition/generate-prescription
 * @desc    Creates and cryptographically seals a complete diagnostic soil prescription plan record
 * @access  Public / Farmer
 */
router.post('/generate-prescription', async (req, res) => {
  try {
    const {
      sampleId,
      farmerEmail,
      farmerName,
      crop,
      fieldAcreageHectares,
      targetYieldTonsPerHa,
      soilChemistry,
      preferredBasalType
    } = req.body;

    if (!crop || !farmerEmail || !soilChemistry) {
      return res.status(400).json({
        success: false,
        error: 'Crop, farmerEmail, and soilChemistry are required to generate prescription plan.'
      });
    }

    const acreage = Number(fieldAcreageHectares || 1.0);
    const targetCrop = crop.toUpperCase().trim();

    // 1. Evaluate Chemistry
    const chemistryEval = SoilChemistryEvaluationEngine.evaluateSoilFertility(soilChemistry, targetCrop);

    // 2. Optimize Commercial Bag Mix
    const optimization = FertilizerOptimizationEngine.optimizeBagMix({
      crop: targetCrop,
      soilChemistry,
      fieldAcreageHectares: acreage,
      targetYieldTonsPerHa: Number(targetYieldTonsPerHa) || 0,
      preferredBasalType: preferredBasalType || 'NPK_15_15_15'
    });

    const prescriptionId = req.body.prescriptionId || generatePrescriptionId();

    // 3. Format Prescription Document
    const prescriptionDoc = new SoilPrescriptionPlan({
      prescriptionId,
      farmerEmail: farmerEmail.toLowerCase().trim(),
      farmerName: farmerName || 'Agrily Certified Grower',
      targetCrop,
      targetYieldTonsPerHa: optimization.targetYieldTonsPerHa,
      fieldAcreageHectares: acreage,
      elementalDeficitKgPerHa: {
        netNitrogenN: optimization.elementalDeficitKgPerHa.netNitrogenN,
        netPhosphateP2O5: optimization.elementalDeficitKgPerHa.netPhosphateP2O5,
        netPotashK2O: optimization.elementalDeficitKgPerHa.netPotashK2O
      },
      recommendedCommercialMix: {
        programName: optimization.recommendedCommercialMix.programName,
        items: optimization.recommendedCommercialMix.items.map((i) => ({
          productCode: i.productCode,
          brandName: i.brandName || i.productName,
          bagsPerHectare: i.bagsPerHectare,
          totalBagsForField: i.totalBagsForField,
          applicationTiming: i.applicationTiming || 'BASAL_AT_PLANTING',
          applicationInstructions: i.applicationInstructions,
          unitCostNaira: i.unitCostNaira || i.unitPriceNGN,
          lineTotalNaira: i.lineTotalNaira || i.lineItemTotalNGN
        }))
      },
      soilAmendmentPlan: {
        requiresLiming: chemistryEval.limingRecommendation.requiresLiming,
        amendmentMaterial: chemistryEval.limingRecommendation.recommendedMaterial,
        dosageTonsPerHa: chemistryEval.limingRecommendation.recommendedDoseTonsPerHa,
        totalLimeTonsForField: Number((chemistryEval.limingRecommendation.recommendedDoseTonsPerHa * acreage).toFixed(2))
      },
      economicImpact: {
        totalFertilizerCostNaira: optimization.economics.totalFertilizerCostNaira,
        projectedGrossRevenueNaira: acreage * (optimization.targetYieldTonsPerHa * 250000)
      }
    });

    // Compute costs and seal
    prescriptionDoc.computeCostAndSeal();

    if (mongoose.connection.readyState === 1) {
      await prescriptionDoc.save();
    }

    const prescriptionObj = prescriptionDoc.toObject();

    // Ergonomic aliases for API clients
    prescriptionObj.recommendedBagMix = prescriptionObj.recommendedCommercialMix.items;
    prescriptionObj.splitApplicationSchedule = [
      {
        stageName: 'BASAL_PLANTING',
        daysAfterPlanting: 0,
        recommendedProducts: prescriptionObj.recommendedBagMix
          .filter((i) => i.applicationTiming.includes('BASAL'))
          .map((i) => `${i.productCode} (${i.bagsPerHectare} bags/ha)`),
        instructions: 'Band placement 5cm away from seed furrow at planting.'
      },
      {
        stageName: 'VEGETATIVE_TOP_DRESS',
        daysAfterPlanting: 21,
        recommendedProducts: prescriptionObj.recommendedBagMix
          .filter((i) => i.applicationTiming.includes('FIRST_TOP_DRESS'))
          .map((i) => `${i.productCode} (${i.bagsPerHectare} bags/ha)`),
        instructions: 'Side dress 10cm from plant stem and cover with soil to minimize volatilization.'
      }
    ];
    prescriptionObj.financialSummary = {
      totalFertilizerCostNaira: prescriptionDoc.economicImpact.totalFertilizerCostNaira,
      estimatedReturnOnInvestmentPct: Number((prescriptionDoc.economicImpact.returnOnInvestmentMultiplier * 100).toFixed(1)),
      netProfitNaira: prescriptionDoc.economicImpact.projectedNetProfitNaira
    };
    prescriptionObj.cryptographicValidationSeal = {
      verificationHash: prescriptionDoc.cryptographicValidationSeal,
      sealString: prescriptionDoc.cryptographicValidationSeal
    };

    IN_MEMORY_PRESCRIPTIONS.push(prescriptionObj);

    return res.status(201).json({
      success: true,
      message: 'Diagnostic soil prescription plan generated and cryptographically sealed.',
      prescriptionId: prescriptionDoc.prescriptionId,
      prescription: prescriptionObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/soil-nutrition/cation-balance
 * @desc    Calculates Albrecht Base Cation Saturation Ratio (BCSR), dispersion risk, and gypsum reclamation
 * @access  Public
 */
router.post('/cation-balance', async (req, res) => {
  try {
    const { exchangeableCations, exchangeableAcidity, fieldAcreageHectares } = req.body;
    if (!exchangeableCations) {
      return res.status(400).json({ success: false, error: 'exchangeableCations payload required.' });
    }

    const normalizedCations = {
      calciumCa: exchangeableCations.calciumCa ?? exchangeableCations.calcium ?? 3.8,
      magnesiumMg: exchangeableCations.magnesiumMg ?? exchangeableCations.magnesium ?? 1.2,
      potassiumK: exchangeableCations.potassiumK ?? exchangeableCations.potassium ?? 0.35,
      sodiumNa: exchangeableCations.sodiumNa ?? exchangeableCations.sodium ?? 0.05
    };

    const acidity = exchangeableAcidity ?? exchangeableCations.exchangeableAcidity ?? exchangeableCations.acidity ?? 0.15;
    const balance = SoilCationBalanceService.evaluateCationBalance(normalizedCations, acidity);

    let gypsumRec = null;
    if (balance.sodicityAndDispersion && balance.sodicityAndDispersion.hazardTier !== 'NONE_NORMAL') {
      gypsumRec = SoilCationBalanceService.calculateGypsumRequirement({
        effectiveCec: balance.effectiveCec,
        currentEspPct: balance.sodicityAndDispersion.exchangeableSodiumPercentage,
        fieldAcreageHectares: fieldAcreageHectares || 1.0
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...balance,
        effectiveCationExchangeCapacity: balance.effectiveCec,
        cationSaturationPercentages: {
          calciumPct: balance.albrechtSaturationPercentages.calcium.measuredPct,
          magnesiumPct: balance.albrechtSaturationPercentages.magnesium.measuredPct,
          potassiumPct: balance.albrechtSaturationPercentages.potassium.measuredPct,
          sodiumPct: balance.albrechtSaturationPercentages.sodium.measuredPct,
          ...balance.albrechtSaturationPercentages
        },
        dispersionRisk: {
          riskLevel: balance.sodicityAndDispersion.hazardTier,
          ...balance.sodicityAndDispersion
        },
        gypsumReclamation: gypsumRec
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/soil-nutrition/carbon-dynamics
 * @desc    Simulates multi-year soil organic matter turnover kinetics and carbon sequestration
 * @access  Public
 */
router.post('/carbon-dynamics', async (req, res) => {
  try {
    const { currentOrganicCarbonPct, baselineOrganicMatterPct, primaryRegenerativePractice, managementPractice, simulationYears, fieldAcreageHectares } = req.body;

    const socPct = currentOrganicCarbonPct ?? (baselineOrganicMatterPct ? baselineOrganicMatterPct / 1.724 : 0.85);
    const practice = primaryRegenerativePractice || managementPractice || 'ORGANIC_COMPOST_MANURE';

    const trajectory = SoilOrganicMatterDynamicsService.simulateCarbonSequestrationTrajectory({
      currentOrganicCarbonPct: socPct,
      primaryRegenerativePractice: practice,
      simulationYears: simulationYears || 5,
      fieldAcreageHectares: fieldAcreageHectares || 2.0
    });

    return res.status(200).json({
      success: true,
      data: {
        ...trajectory,
        simulationHorizonYears: trajectory.simulationMetadata.simulationHorizonYears,
        annualTrajectory: trajectory.yearlyTrajectory,
        summary: {
          netCarbonSequestrationTonsPerHa: trajectory.economicAndClimateValuation.netSequestrationTonsCo2ePerHa,
          ...trajectory.economicAndClimateValuation
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/soil-nutrition/microbial-enzymes
 * @desc    Assesses biological soil health index (BFI) and prescribes targeted bio-inoculants
 * @access  Public
 */
router.post('/microbial-enzymes', async (req, res) => {
  try {
    const { enzymaticAssays, soilOrganicCarbonPct, targetCrop } = req.body;

    const evaluation = SoilMicrobiomeEnzymeActivityService.evaluateMicrobialFertility(
      enzymaticAssays || {},
      soilOrganicCarbonPct ?? 0.85,
      targetCrop || 'MAIZE'
    );

    return res.status(200).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/soil-nutrition/crop-phenology/:crop
 * @desc    Retrieves phenological stage-by-stage nutrient partition curves for staple crops
 * @access  Public
 */
router.get('/crop-phenology/:crop', async (req, res) => {
  try {
    const { crop } = req.params;
    const { stage } = req.query;

    const uptakeCurve = CropSpecificFertilityAdvisoryService.getCropUptakeCurve(crop, stage || null);

    return res.status(200).json({
      success: true,
      data: uptakeCurve
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/soil-nutrition/diagnose-symptoms
 * @desc    Diagnoses visual plant nutritional deficiency symptoms and returns foliar chelate recipes
 * @access  Public
 */
router.post('/diagnose-symptoms', async (req, res) => {
  try {
    const { crop, observedKeywords, affectedCanopyPosition, fieldAcreageHectares } = req.body;

    const diagnosis = CropSpecificFertilityAdvisoryService.diagnoseDeficiencySymptom(
      crop || 'MAIZE',
      Array.isArray(observedKeywords) ? observedKeywords : [],
      affectedCanopyPosition || 'LOWER_OLD'
    );

    let foliarPrescription = null;
    if (diagnosis.topDiagnosis) {
      foliarPrescription = CropSpecificFertilityAdvisoryService.formulateFoliarRescuePrescription(
        crop || 'MAIZE',
        [diagnosis.topDiagnosis.deficiencyKey],
        fieldAcreageHectares || 1.0
      );
    }

    return res.status(200).json({
      success: true,
      diagnosis,
      emergencyFoliarPrescription: foliarPrescription
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/soil-nutrition/nutrient-removal-budget
 * @desc    Calculates harvest removal balances and multi-year soil nutrient depletion budget
 * @access  Public
 */
router.post('/nutrient-removal-budget', async (req, res) => {
  try {
    const { crop, targetedYieldTonsPerHa, fieldAcreageHectares } = req.body;

    const budget = CropSpecificFertilityAdvisoryService.computeCriticalNutrientRemovalBalances(
      crop || 'MAIZE',
      targetedYieldTonsPerHa ?? 4.0,
      fieldAcreageHectares ?? 1.0
    );

    return res.status(200).json({
      success: true,
      data: budget
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
