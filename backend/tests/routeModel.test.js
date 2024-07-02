/**
 * ==============================================================================
 * ROUTE OPTIMIZATION DOMAIN MODEL - COMPREHENSIVE UNIT TEST SUITE
 * ==============================================================================
 * Tests validation constraints, defaults, Haversine computations, payload limits,
 * metrics recalculation, and lifecycle state machines for OptimizedRoute and
 * DispatchManifest models.
 */

const mongoose = require('mongoose');
const {
  OptimizedRoute,
  PERISHABILITY_TIERS,
  STOP_TYPES,
  STOP_STATUSES,
  ROUTE_LIFECYCLE_STATUSES,
  ROAD_SURFACE_TYPES
} = require('../models/OptimizedRoute');
const { DispatchManifest } = require('../models/DispatchManifest');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  FAIL: ${message}`);
    failedTests++;
  }
}

async function runRouteModelTests() {
  console.log('\n======================================================');
  console.log('   RUNNING AGRILY ROUTE & MANIFEST MODEL TESTS       ');
  console.log('======================================================\n');

  try {
    const sampleOriginDepot = {
      depotName: 'Zaria Central Ag Logistics Hub',
      facilityCode: 'ZAR-HUB-01',
      address: 'Old Jos Road, Industrial Estate',
      city: 'Zaria',
      state: 'Kaduna',
      contactPerson: 'Malam Ibrahim Danjuma',
      contactPhone: '+2348031112233',
      location: {
        type: 'Point',
        coordinates: [7.7198, 11.0855] // [lng, lat]
      }
    };

    const sampleDestinationHub = {
      depotName: 'Dawanau Grain & Vegetable Terminal',
      facilityCode: 'KAN-DWN-01',
      address: 'Dawanau International Market Road',
      city: 'Kano',
      state: 'Kano',
      contactPerson: 'Alhaji Sani Bello',
      contactPhone: '+2348029998877',
      location: {
        type: 'Point',
        coordinates: [8.4412, 12.0022] // [lng, lat]
      }
    };

    const createSampleStop = (seq, name, lng, lat, weightKg, perishability = 'MEDIUM', roadSurface = 'SECONDARY_ASPHALT') => ({
      stopId: `STOP-TEST-${seq}`,
      stopSequence: seq,
      stopType: 'PICKUP_FARM',
      locationName: name,
      contactName: `Farmer ${seq}`,
      contactPhone: '+234800000000',
      address: `Farm Gate Road, Km ${seq * 5}`,
      state: 'Kaduna',
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      roadSurface,
      producePayload: {
        produceName: 'Roma Plum Tomatoes',
        produceCategory: 'Vegetables',
        weightKg,
        volumeCrates: Math.ceil(weightKg / 25),
        packagingType: 'plastic_crate',
        perishabilityTier: perishability
      },
      timeWindow: {
        earliestArrival: new Date(Date.now() + 3600000),
        latestArrival: new Date(Date.now() + 14400000),
        estimatedLoadingMinutes: 20
      }
    });

    // -------------------------------------------------------------
    // 1. Constants & Enums Verification
    // -------------------------------------------------------------
    assert(
      PERISHABILITY_TIERS.includes('HIGH') && PERISHABILITY_TIERS.includes('MEDIUM') && PERISHABILITY_TIERS.includes('LOW'),
      'OptimizedRoute exposes HIGH, MEDIUM, and LOW perishability tiers'
    );
    assert(
      STOP_TYPES.includes('PICKUP_FARM') && STOP_TYPES.includes('INTERMEDIATE_DEPOT') && STOP_TYPES.includes('DELIVERY_MARKET'),
      'OptimizedRoute exposes farm, depot, and terminal market stop types'
    );
    assert(
      ROUTE_LIFECYCLE_STATUSES.includes('DRAFT') && ROUTE_LIFECYCLE_STATUSES.includes('OPTIMIZED') && ROUTE_LIFECYCLE_STATUSES.includes('DISPATCHED') && ROUTE_LIFECYCLE_STATUSES.includes('IN_PROGRESS') && ROUTE_LIFECYCLE_STATUSES.includes('COMPLETED'),
      'OptimizedRoute supports full route lifecycle states'
    );
    assert(
      ROAD_SURFACE_TYPES.includes('PAVED_HIGHWAY') && ROAD_SURFACE_TYPES.includes('UNPAVED_LATERITE') && ROAD_SURFACE_TYPES.includes('RURAL_EARTH_TRACK'),
      'OptimizedRoute supports highway, laterite, and rural earth track surfaces'
    );

    // -------------------------------------------------------------
    // 2. Static Utilities (Haversine & Code Generators)
    // -------------------------------------------------------------
    const dist = OptimizedRoute.haversineDistance(11.0855, 7.7198, 12.0022, 8.4412);
    assert(dist > 125 && dist < 135, `Haversine distance between Zaria and Kano is ~129 km (computed: ${dist} km)`);

    const zeroDist = OptimizedRoute.haversineDistance(11.0855, 7.7198, 11.0855, 7.7198);
    assert(zeroDist === 0, 'Haversine distance between identical coordinates returns 0.0');

    const routeCode = OptimizedRoute.generateRouteCode();
    assert(/^AGR-\d{8}-[A-Z0-9]{4}$/.test(routeCode), `Generated route code conforms to AGR-YYYYMMDD-XXXX (${routeCode})`);

    const manifestNumber = DispatchManifest.generateManifestNumber();
    assert(/^MNF-\d{8}-[A-Z0-9]{4}$/.test(manifestNumber), `Generated manifest number conforms to MNF-YYYYMMDD-XXXX (${manifestNumber})`);

    // -------------------------------------------------------------
    // 3. Schema Validation & Defaults
    // -------------------------------------------------------------
    const emptyRoute = new OptimizedRoute({});
    const emptyErr = emptyRoute.validateSync();
    assert(
      emptyErr && emptyErr.errors.routeCode && emptyErr.errors.routeName && emptyErr.errors.originDepot && emptyErr.errors.destinationHub && emptyErr.errors.departureScheduledAt,
      'Validates required route fields: code, name, origin, destination, scheduled departure'
    );

    const validRoute = new OptimizedRoute({
      routeCode: 'AGR-20240702-TEST',
      routeName: 'Makarfi - Ikara Vegetable Collection Run',
      originDepot: sampleOriginDepot,
      destinationHub: sampleDestinationHub,
      departureScheduledAt: new Date(Date.now() + 7200000)
    });
    const validErr = validRoute.validateSync();
    assert(!validErr, 'OptimizedRoute validates cleanly with complete payload');
    assert(validRoute.status === 'DRAFT', 'Default route status is DRAFT');
    assert(validRoute.assignedVehicle.maxPayloadKg === 3500, 'Default assigned vehicle maxPayloadKg is 3500 kg');
    assert(validRoute.assignedVehicle.maxVolumeCrates === 120, 'Default assigned vehicle maxVolumeCrates is 120');

    const invalidCoordRoute = new OptimizedRoute({
      routeCode: 'AGR-20240702-FAIL',
      routeName: 'Invalid Coordinates Route',
      originDepot: {
        ...sampleOriginDepot,
        location: { type: 'Point', coordinates: [200, 100] }
      },
      destinationHub: sampleDestinationHub,
      departureScheduledAt: new Date()
    });
    const coordErr = invalidCoordRoute.validateSync();
    assert(coordErr && coordErr.errors['originDepot.location.coordinates'], 'Rejects out-of-bounds geographic coordinates (> 180 lng, > 90 lat)');

    // -------------------------------------------------------------
    // 4. Metric Recalculation & Surface Multipliers
    // -------------------------------------------------------------
    const metricRoute = new OptimizedRoute({
      routeCode: 'AGR-20240702-METRIC',
      routeName: 'Northern Kaduna Farms Run',
      originDepot: sampleOriginDepot,
      destinationHub: sampleDestinationHub,
      departureScheduledAt: new Date(),
      assignedVehicle: {
        registrationNumber: 'KBL-892-XA',
        vehicleType: 'box_truck',
        maxPayloadKg: 4000,
        maxVolumeCrates: 150
      },
      stops: [
        createSampleStop(0, 'Makarfi Cooperative Farm', 7.8500, 11.3800, 1200, 'HIGH', 'UNPAVED_LATERITE'),
        createSampleStop(1, 'Ikara Onion Outgrower Cluster', 8.1200, 11.4500, 1500, 'MEDIUM', 'SECONDARY_ASPHALT')
      ]
    });

    const metrics = metricRoute.recalculateMetrics();
    assert(metrics.totalPayloadWeightKg === 2700, 'Calculates total payload weight accurately (2,700 kg)');
    assert(metrics.totalPayloadVolumeCrates === (Math.ceil(1200 / 25) + Math.ceil(1500 / 25)), 'Calculates total crates volume accurately (108 crates)');
    assert(metrics.totalDistanceKm > 100, `Computes total route distance across waypoints and terminal return (${metrics.totalDistanceKm} km)`);
    assert(metrics.estimatedDurationMinutes > 120, `Computes transit time with road surface factors and loading delays (${metrics.estimatedDurationMinutes} mins)`);
    assert(metrics.capacityUtilizationPct === 67.5, `Computes vehicle capacity utilization percentage accurately (${metrics.capacityUtilizationPct}%)`);
    assert(metrics.estimatedFuelConsumptionLiters > 20, `Computes diesel fuel consumption based on payload and distance (${metrics.estimatedFuelConsumptionLiters} L)`);
    assert(metrics.estimatedCarbonFootprintKg > 50, `Computes carbon emissions based on diesel emission coefficients (${metrics.estimatedCarbonFootprintKg} kg CO2)`);
    assert(metricRoute.stops[0].cumulativeDistanceKm > 0, 'Populates cumulative distance milestone on each stop');
    assert(metricRoute.stops[1].cumulativeDistanceKm > metricRoute.stops[0].cumulativeDistanceKm, 'Ensures monotonic increase in cumulative distance across stops');

    // -------------------------------------------------------------
    // 5. Vehicle Payload Capacity Guardrails
    // -------------------------------------------------------------
    const capacityRoute = new OptimizedRoute({
      routeCode: 'AGR-20240702-CAP',
      routeName: 'Capacity Test Run',
      originDepot: sampleOriginDepot,
      destinationHub: sampleDestinationHub,
      departureScheduledAt: new Date(),
      assignedVehicle: { maxPayloadKg: 2000 },
      stops: [
        createSampleStop(0, 'Farm A', 7.80, 11.20, 900),
        createSampleStop(1, 'Farm B', 7.90, 11.30, 800)
      ]
    });

    let cap = capacityRoute.validateCapacity();
    assert(cap.isValid === true && cap.excessWeightKg === 0, 'Approves harvest payload within vehicle limits (1,700 kg <= 2,000 kg)');

    capacityRoute.stops.push(createSampleStop(2, 'Farm C', 8.00, 11.40, 600));
    cap = capacityRoute.validateCapacity();
    assert(cap.isValid === false && cap.excessWeightKg === 300, 'Detects payload overload (2,300 kg > 2,000 kg) with exact excess of 300 kg');

    // -------------------------------------------------------------
    // 6. State Machine Guardrails & Virtuals
    // -------------------------------------------------------------
    const stateRoute = new OptimizedRoute({
      routeCode: 'AGR-20240702-STATE',
      routeName: 'State Machine Test',
      originDepot: sampleOriginDepot,
      destinationHub: sampleDestinationHub,
      departureScheduledAt: new Date()
    });
    stateRoute.save = async function() { return this; };

    await stateRoute.advanceStatus('OPTIMIZED');
    assert(stateRoute.status === 'OPTIMIZED', 'Advances route from DRAFT to OPTIMIZED');

    let dispatchErrorCaught = false;
    try {
      await stateRoute.advanceStatus('DISPATCHED');
    } catch (e) {
      dispatchErrorCaught = true;
    }
    assert(dispatchErrorCaught, 'Enforces driver assignment guardrail before DISPATCHED status');

    stateRoute.assignedDriver = new mongoose.Types.ObjectId();
    await stateRoute.advanceStatus('DISPATCHED');
    assert(stateRoute.status === 'DISPATCHED', 'Allows DISPATCHED transition once driver is assigned');

    await stateRoute.advanceStatus('IN_PROGRESS');
    assert(stateRoute.status === 'IN_PROGRESS' && stateRoute.actualDepartureAt instanceof Date, 'IN_PROGRESS automatically records actual departure timestamp');

    await stateRoute.advanceStatus('COMPLETED');
    assert(stateRoute.status === 'COMPLETED' && stateRoute.completedAt instanceof Date, 'COMPLETED records completion timestamp and actual elapsed duration');

    // Virtual checks
    const virtRoute = new OptimizedRoute({
      routeCode: 'AGR-20240702-VIRT',
      routeName: 'Virtuals Test',
      originDepot: sampleOriginDepot,
      destinationHub: sampleDestinationHub,
      departureScheduledAt: new Date(),
      status: 'IN_PROGRESS',
      stops: [
        createSampleStop(0, 'Farm 1', 7.8, 11.2, 500),
        createSampleStop(1, 'Farm 2', 7.9, 11.3, 500)
      ]
    });
    assert(virtRoute.isActive === true, 'Virtual isActive returns true for IN_PROGRESS route');
    assert(virtRoute.remainingStopsCount === 2, 'Virtual remainingStopsCount correctly counts pending stops');
    virtRoute.stops[0].status = 'COLLECTED';
    assert(virtRoute.remainingStopsCount === 1, 'Virtual remainingStopsCount updates when stop is marked COLLECTED');

    // -------------------------------------------------------------
    // 7. DispatchManifest Validation
    // -------------------------------------------------------------
    const manifest = new DispatchManifest({
      manifestNumber: 'MNF-20240702-ABCD',
      routeId: new mongoose.Types.ObjectId(),
      routeCode: 'AGR-20240702-TEST',
      driverId: new mongoose.Types.ObjectId(),
      driverFullName: 'Musa Abdullahi',
      driverLicenseNumber: 'KAD-90821-BC',
      vehicleRegistrationNumber: 'KBL-892-XA',
      departureDepot: {
        facilityName: 'Zaria Logistics Hub',
        address: 'Old Jos Road',
        cityState: 'Zaria, Kaduna'
      },
      destinationTerminal: {
        facilityName: 'Dawanau Grain Terminal',
        address: 'Dawanau Market',
        cityState: 'Kano, Kano'
      },
      consignments: [{
        stopSequence: 0,
        farmerName: 'Garba Bello',
        farmerPhone: '+2348011223344',
        farmLocation: 'Makarfi Farm Cluster',
        produceName: 'Roma Plum Tomatoes',
        produceCategory: 'Vegetables',
        manifestedWeightKg: 1200,
        cratesCount: 48
      }],
      summaryTotals: {
        totalWeightKg: 1200,
        totalCratesCount: 48,
        totalStopsCount: 1
      },
      securitySeals: [{
        sealNumber: 'SEAL-KD-98231',
        appliedBy: 'Zaria Dispatch Supervisor'
      }]
    });

    const manifestErr = manifest.validateSync();
    assert(!manifestErr, 'DispatchManifest validates cleanly with complete cargo and seal details');
    assert(manifest.status === 'ISSUED', 'Default manifest status is ISSUED');
    assert(manifest.securitySeals[0].tamperDetected === false, 'Default seal status records tamperDetected as false');

  } catch (err) {
    console.error('Unexpected test runner error:', err);
    failedTests++;
  }

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runRouteModelTests();
