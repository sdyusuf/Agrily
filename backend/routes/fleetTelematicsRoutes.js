/**
 * @file fleetTelematicsRoutes.js
 * @description REST API endpoints for Fleet Telematics Streaming, Eco-Routing Optimizer,
 * Maintenance Roadworthiness Diagnostics, Corridor Toll & Levy Inquiries, and Carbon Credit Certification.
 * Mounted at /api/fleet-telematics.
 */

const express = require('express');
const router = express.Router();

const {
  FleetTelematicsStreamingService,
  AGRO_HUB_GEOFENCES
} = require('../services/fleetTelematicsStreamingService');

const {
  FleetMaintenanceLogService,
  MAINTENANCE_INTERVALS_KM
} = require('../services/fleetMaintenanceLogService');

const {
  FleetEcoRoutingOptimizerService,
  ROAD_TERRAIN_FACTORS,
  CORRIDOR_ECO_ROUTING_GRAPH
} = require('../services/fleetEcoRoutingOptimizerService');

const {
  CorridorTollAndLevyMatrixService,
  STATE_PRODUCE_LEVIES_REGISTRY
} = require('../services/corridorTollAndLevyMatrixService');

const {
  FleetEmissionCreditCalculatorService,
  BASELINE_EMISSION_STANDARDS
} = require('../services/fleetEmissionCreditCalculatorService');

/**
 * @route   POST /api/fleet-telematics/telemetry/stream
 * @desc    Ingest real-time telematics coordinate, evaluate market geofence, and check excursions
 * @access  Public / Driver Client
 */
router.post('/telemetry/stream', (req, res) => {
  try {
    const { truckId, coordinate, speedKmh, ambientTempC, cargoTempC, targetTempMaxC } = req.body;

    if (!truckId || !coordinate || typeof coordinate.lat !== 'number' || typeof coordinate.lng !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid telematics payload. truckId and numeric coordinate { lat, lng } are required.'
      });
    }

    const result = FleetTelematicsStreamingService.ingestTelematicsPing({
      vehicleRegNumber: truckId,
      latitude: coordinate.lat,
      longitude: coordinate.lng,
      speedKmh: typeof speedKmh === 'number' ? speedKmh : 0,
      cargoTempCelsius: typeof cargoTempC === 'number' ? cargoTempC : null,
      maxPermissibleSpeedKmh: 90.0,
      temperatureControlled: targetTempMaxC !== undefined && targetTempMaxC !== null,
      maxPermissibleTemp: typeof targetTempMaxC === 'number' ? targetTempMaxC : 10.0
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Error processing telematics stream'
    });
  }
});

/**
 * @route   POST /api/fleet-telematics/maintenance/diagnose
 * @desc    Evaluate vehicle roadworthiness clearance and diagnostics
 * @access  Public / Fleet Manager
 */
router.post('/maintenance/diagnose', (req, res) => {
  try {
    const {
      truckId,
      registrationNumber,
      vehicleType,
      odometerKm,
      lastOilChangeKm,
      lastBrakeServiceKm,
      lastTireRotationKm,
      lastReeferServiceKm,
      isRefrigerated
    } = req.body;

    if (!truckId && !registrationNumber) {
      return res.status(400).json({
        success: false,
        error: 'truckId or registrationNumber is required for roadworthiness diagnostics.'
      });
    }

    const reg = registrationNumber || truckId;
    const odo = typeof odometerKm === 'number' ? odometerKm : 65000;

    const diagnosis = FleetMaintenanceLogService.assessVehicleRoadworthiness({
      vehicleRegNumber: reg,
      vehicleType: vehicleType || 'HEAVY_DUTY_30T_RIGID',
      odometerKm: odo,
      lastOilChangeKm: typeof lastOilChangeKm === 'number' ? lastOilChangeKm : (odo - 2000),
      lastBrakeServiceKm: typeof lastBrakeServiceKm === 'number' ? lastBrakeServiceKm : (odo - 5000),
      lastTireRotationKm: typeof lastTireRotationKm === 'number' ? lastTireRotationKm : (odo - 4000),
      lastReeferServiceKm: typeof lastReeferServiceKm === 'number' ? lastReeferServiceKm : (odo - 3000),
      isRefrigerated: Boolean(isRefrigerated)
    });

    return res.status(200).json({
      success: true,
      data: diagnosis
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Error executing maintenance diagnostics'
    });
  }
});

/**
 * @route   POST /api/fleet-telematics/eco-routing/optimize
 * @desc    Compare multi-route options across terrain friction and fuel consumption
 * @access  Public / Dispatch Planner
 */
router.post('/eco-routing/optimize', (req, res) => {
  try {
    const { originState, destinationState, cargoTonnage, isReefer, currentDieselPricePerLitre } = req.body;

    if (!originState || !destinationState) {
      return res.status(400).json({
        success: false,
        error: 'originState and destinationState are required.'
      });
    }

    const tonnage = typeof cargoTonnage === 'number' && cargoTonnage > 0 ? cargoTonnage : 20;
    const reefer = Boolean(isReefer);
    const dieselPrice = typeof currentDieselPricePerLitre === 'number' && currentDieselPricePerLitre > 0 ? currentDieselPricePerLitre : 1150;

    const result = FleetEcoRoutingOptimizerService.findOptimalEcoRoute({
      originState,
      destinationState,
      tonnage,
      isTemperatureControlled: reefer,
      currentDieselPriceNgn: dieselPrice
    });

    return res.status(200).json({
      success: true,
      data: {
        originState,
        destinationState,
        cargoTonnage: tonnage,
        isReefer: reefer,
        dieselPricePerLitre: dieselPrice,
        availableRoutes: result.allEvaluatedRoutes,
        recommendation: result.recommendedRoute,
        projectedSavings: result.projectedSavings
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Error optimizing eco-routes'
    });
  }
});

/**
 * @route   GET /api/fleet-telematics/corridor-tolls/:origin/:destination
 * @desc    Get detailed state produce inspection levies, tolls, and haulage VAT
 * @access  Public / Carrier & Shipper
 */
router.get('/corridor-tolls/:origin/:destination', (req, res) => {
  try {
    const { origin, destination } = req.params;
    const tonnage = parseFloat(req.query.tonnage) || 20;
    const haulageTariff = parseFloat(req.query.tariff) || 850000;

    const audit = CorridorTollAndLevyMatrixService.calculateCorridorStatutoryLevies({
      originState: origin,
      destinationState: destination,
      tonnage,
      freightHaulageTariffNgn: haulageTariff
    });

    return res.status(200).json({
      success: true,
      data: audit
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Error resolving corridor tolls and levies'
    });
  }
});

/**
 * @route   POST /api/fleet-telematics/carbon-credits/certify
 * @desc    Evaluate trip fuel efficiency against standard baseline and generate carbon credit certificate
 * @access  Public / ESG Compliance
 */
router.post('/carbon-credits/certify', (req, res) => {
  try {
    const { tripId, carrierId, originState, destinationState, distanceKm, cargoTonnage, actualFuelConsumedLitres, isReefer } = req.body;

    if (!tripId || !carrierId || !distanceKm || !actualFuelConsumedLitres) {
      return res.status(400).json({
        success: false,
        error: 'tripId, carrierId, distanceKm, and actualFuelConsumedLitres are required.'
      });
    }

    const certificate = FleetEmissionCreditCalculatorService.evaluateCarbonOffsetCredits({
      carrierCode: carrierId,
      totalDistanceKm: parseFloat(distanceKm),
      tonnageHauled: parseFloat(cargoTonnage) || 20,
      actualFuelConsumedLitres: parseFloat(actualFuelConsumedLitres)
    });

    return res.status(200).json({
      success: true,
      data: {
        tripId,
        originState: originState || 'Kano',
        destinationState: destinationState || 'Lagos',
        isReefer: Boolean(isReefer),
        certificate
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Error issuing carbon credit certificate'
    });
  }
});

/**
 * @route   GET /api/fleet-telematics/state-levies
 * @desc    Retrieve dictionary of Nigerian state produce inspection fees
 * @access  Public
 */
router.get('/state-levies', (req, res) => {
  return res.status(200).json({
    success: true,
    data: STATE_PRODUCE_LEVIES_REGISTRY
  });
});

module.exports = router;
