/**
 * ==============================================================================
 * ROUTE DISPATCH REST CONTROLLER - COMPREHENSIVE UNIT TEST SUITE
 * ==============================================================================
 * Tests REST endpoints for route optimization, creation, listing, re-sequencing,
 * status transitions, driver dispatching, collection proofs, and cargo manifests.
 */

const {
  OptimizedRoute
} = require('../models/OptimizedRoute');
const { DispatchManifest } = require('../models/DispatchManifest');
const routesRouter = require('../routes/routes');

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

// Lightweight HTTP Mocking Utility
function createMockReq(options = {}) {
  return {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    user: options.user || { email: 'dispatcher@agrily.com', role: 'admin' },
    ...options
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    },
    setHeader: function(key, val) {
      this.headers[key] = val;
      return this;
    }
  };
  return res;
}

// Route Handler Extraction Helper
function getRouteHandler(method, path) {
  const routeLayer = routesRouter.stack.find(
    layer => layer.route && layer.route.path === path && layer.route.methods[method.toLowerCase()]
  );
  if (!routeLayer) {
    throw new Error(`Handler for ${method} ${path} not found in routesRouter`);
  }
  return routeLayer.route.stack[0].handle;
}

async function runRouteControllerTests() {
  console.log('\n======================================================');
  console.log('   RUNNING AGRILY ROUTE REST CONTROLLER TESTS        ');
  console.log('======================================================\n');

  try {
    const optimizeHandler = getRouteHandler('POST', '/optimize');
    const createRouteHandler = getRouteHandler('POST', '/');
    const listRoutesHandler = getRouteHandler('GET', '/');
    const getRouteHandlerFn = getRouteHandler('GET', '/:id');
    const reorderStopsHandler = getRouteHandler('PATCH', '/:id/reorder');
    const updateStatusHandler = getRouteHandler('PATCH', '/:id/status');
    const dispatchHandler = getRouteHandler('POST', '/:id/dispatch');
    const updateStopHandler = getRouteHandler('PATCH', '/:id/stops/:stopId');
    const getManifestHandler = getRouteHandler('GET', '/:id/manifest');

    const sampleDepot = {
      depotName: 'Zaria Logistics Hub',
      facilityCode: 'ZAR-01',
      address: 'Old Jos Road',
      city: 'Zaria',
      state: 'Kaduna',
      contactPerson: 'Malam Ibrahim',
      contactPhone: '+2348031112233',
      location: { type: 'Point', coordinates: [7.7198, 11.0855] }
    };

    const sampleDestination = {
      depotName: 'Dawanau Terminal',
      facilityCode: 'KAN-01',
      address: 'Dawanau Market',
      city: 'Kano',
      state: 'Kano',
      contactPerson: 'Alhaji Sani',
      contactPhone: '+2348029998877',
      location: { type: 'Point', coordinates: [8.4412, 12.0022] }
    };

    const sampleStops = [
      {
        stopId: 'ST-TEST-01',
        locationName: 'Makarfi Tomato Cluster',
        contactName: 'Farmer Musa',
        contactPhone: '+2348011223344',
        address: 'Makarfi Gate 1',
        state: 'Kaduna',
        location: { type: 'Point', coordinates: [7.8500, 11.3800] },
        roadSurface: 'SECONDARY_ASPHALT',
        producePayload: {
          produceName: 'Roma Tomatoes',
          produceCategory: 'Vegetables',
          weightKg: 1000,
          volumeCrates: 40,
          perishabilityTier: 'HIGH'
        },
        timeWindow: {
          earliestArrival: new Date().toISOString(),
          latestArrival: new Date(Date.now() + 14400000).toISOString(),
          estimatedLoadingMinutes: 20
        }
      },
      {
        stopId: 'ST-TEST-02',
        locationName: 'Ikara Onion Outgrowers',
        contactName: 'Farmer Danjuma',
        contactPhone: '+2348055667788',
        address: 'Ikara Central Farm',
        state: 'Kaduna',
        location: { type: 'Point', coordinates: [8.1200, 11.4500] },
        roadSurface: 'UNPAVED_LATERITE',
        producePayload: {
          produceName: 'Red Creole Onions',
          produceCategory: 'Vegetables',
          weightKg: 1500,
          volumeCrates: 60,
          perishabilityTier: 'LOW'
        },
        timeWindow: {
          earliestArrival: new Date().toISOString(),
          latestArrival: new Date(Date.now() + 18000000).toISOString(),
          estimatedLoadingMinutes: 25
        }
      }
    ];

    // -------------------------------------------------------------
    // 1. POST /api/routes/optimize
    // -------------------------------------------------------------
    // Validation failure: missing stops
    const badOptReq = createMockReq({ body: { originDepot: sampleDepot } });
    const badOptRes = createMockRes();
    await optimizeHandler(badOptReq, badOptRes);
    assert(badOptRes.statusCode === 400, 'POST /api/routes/optimize rejects payload missing required fields with HTTP 400');
    assert(badOptRes.body.success === false, 'Returns success: false on validation error');

    // Successful optimization
    const goodOptReq = createMockReq({
      body: {
        originDepot: sampleDepot,
        destinationHub: sampleDestination,
        stops: sampleStops,
        vehicleSpecs: { maxPayloadKg: 3500, maxVolumeCrates: 120 }
      }
    });
    const goodOptRes = createMockRes();
    await optimizeHandler(goodOptReq, goodOptRes);
    assert(goodOptRes.statusCode === 200, 'POST /api/routes/optimize returns HTTP 200 on successful optimization');
    assert(goodOptRes.body.success === true, 'Returns success: true on optimization');
    assert(goodOptRes.body.data.optimizedDistanceKm > 0, 'Returns computed optimizedDistanceKm');
    assert(goodOptRes.body.data.stops.length === 2, 'Returns re-ordered stops in solution');

    // -------------------------------------------------------------
    // 2. POST /api/routes (Create Route)
    // -------------------------------------------------------------
    const origSave = OptimizedRoute.prototype.save;
    OptimizedRoute.prototype.save = async function() {
      this._id = '60d5ec49f1b2c82b8c8e49a1';
      return this;
    };

    const createReq = createMockReq({
      body: {
        routeName: 'Kaduna Vegetable Express Route',
        originDepot: sampleDepot,
        destinationHub: sampleDestination,
        stops: sampleStops,
        departureScheduledAt: new Date(Date.now() + 3600000).toISOString()
      }
    });
    const createRes = createMockRes();
    await createRouteHandler(createReq, createRes);
    assert(createRes.statusCode === 201, 'POST /api/routes creates new route and returns HTTP 201');
    assert(createRes.body.data.routeCode.startsWith('AGR-'), 'Generates standard AGR- routeCode');
    assert(createRes.body.data.status === 'DRAFT', 'Initial saved route status is DRAFT');

    // -------------------------------------------------------------
    // 3. GET /api/routes (List Routes)
    // -------------------------------------------------------------
    const origFind = OptimizedRoute.find;
    const origCount = OptimizedRoute.countDocuments;

    OptimizedRoute.find = () => ({
      populate: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: async () => [{ routeCode: 'AGR-20240702-001', routeName: 'Route 1' }]
            })
          })
        })
      })
    });
    OptimizedRoute.countDocuments = async () => 1;

    const listReq = createMockReq({ query: { status: 'DRAFT', page: 1, limit: 10 } });
    const listRes = createMockRes();
    await listRoutesHandler(listReq, listRes);
    assert(listRes.statusCode === 200, 'GET /api/routes returns HTTP 200 with route list');
    assert(listRes.body.totalCount === 1, 'Returns totalCount metric');
    assert(listRes.body.data.length === 1, 'Returns paginated route array');

    // -------------------------------------------------------------
    // 4. GET /api/routes/:id (Get Single Route)
    // -------------------------------------------------------------
    OptimizedRoute.findById = (id) => ({
      populate: async () => {
        if (id === 'non-existent') return null;
        return {
          _id: id,
          routeCode: 'AGR-20240702-001',
          routeName: 'Kaduna Vegetable Express Route',
          stops: sampleStops
        };
      }
    });

    const notFoundReq = createMockReq({ params: { id: 'non-existent' } });
    const notFoundRes = createMockRes();
    await getRouteHandlerFn(notFoundReq, notFoundRes);
    assert(notFoundRes.statusCode === 404, 'GET /api/routes/:id returns HTTP 404 when route does not exist');

    const foundReq = createMockReq({ params: { id: '60d5ec49f1b2c82b8c8e49a1' } });
    const foundRes = createMockRes();
    await getRouteHandlerFn(foundReq, foundRes);
    assert(foundRes.statusCode === 200, 'GET /api/routes/:id returns HTTP 200 with route details');
    assert(foundRes.body.data.routeCode === 'AGR-20240702-001', 'Returns matching routeCode');

    // -------------------------------------------------------------
    // 5. PATCH /api/routes/:id/reorder (Manual Stop Reorder)
    // -------------------------------------------------------------
    const mockRouteForReorder = {
      _id: '60d5ec49f1b2c82b8c8e49a1',
      status: 'OPTIMIZED',
      originDepot: sampleDepot,
      destinationHub: sampleDestination,
      stops: [...sampleStops],
      recalculateMetrics: function() { return {}; },
      save: async function() { return this; }
    };

    OptimizedRoute.findById = async () => mockRouteForReorder;

    const reorderReq = createMockReq({
      params: { id: '60d5ec49f1b2c82b8c8e49a1' },
      body: { orderedStopIds: ['ST-TEST-02', 'ST-TEST-01'] }
    });
    const reorderRes = createMockRes();
    await reorderStopsHandler(reorderReq, reorderRes);
    assert(reorderRes.statusCode === 200, 'PATCH /api/routes/:id/reorder returns HTTP 200');
    assert(mockRouteForReorder.stops[0].stopId === 'ST-TEST-02', 'Reorders stops with ST-TEST-02 first');

    // -------------------------------------------------------------
    // 6. PATCH /api/routes/:id/status (Lifecycle Transitions)
    // -------------------------------------------------------------
    const mockRouteForStatus = {
      _id: '60d5ec49f1b2c82b8c8e49a1',
      status: 'DRAFT',
      advanceStatus: async function(target) {
        this.status = target;
        return this;
      }
    };
    OptimizedRoute.findById = async () => mockRouteForStatus;

    const statusReq = createMockReq({
      params: { id: '60d5ec49f1b2c82b8c8e49a1' },
      body: { status: 'OPTIMIZED' }
    });
    const statusRes = createMockRes();
    await updateStatusHandler(statusReq, statusRes);
    assert(statusRes.statusCode === 200, 'PATCH /api/routes/:id/status updates status to OPTIMIZED');
    assert(mockRouteForStatus.status === 'OPTIMIZED', 'Status is advanced on route model');

    // -------------------------------------------------------------
    // 7. POST /api/routes/:id/dispatch (Dispatch & Manifest Generation)
    // -------------------------------------------------------------
    const origManifestSave = DispatchManifest.prototype.save;
    DispatchManifest.prototype.save = async function() {
      this._id = '60d5ec49f1b2c82b8c8e49b2';
      return this;
    };

    const mockRouteForDispatch = {
      _id: '60d5ec49f1b2c82b8c8e49a1',
      routeCode: 'AGR-20240702-DISPATCH',
      status: 'OPTIMIZED',
      originDepot: sampleDepot,
      destinationHub: sampleDestination,
      assignedVehicle: { maxPayloadKg: 4000 },
      stops: [...sampleStops],
      validateCapacity: () => ({ isValid: true, excessWeightKg: 0 }),
      advanceStatus: async function(s) { this.status = s; return this; }
    };
    OptimizedRoute.findById = async () => mockRouteForDispatch;

    const dispatchReq = createMockReq({
      params: { id: '60d5ec49f1b2c82b8c8e49a1' },
      body: {
        driverId: '60d5ec49f1b2c82b8c8e4999',
        vehicleRegistrationNumber: 'KBL-892-XA',
        sealNumber: 'SEAL-KD-9821'
      }
    });
    const dispatchRes = createMockRes();
    await dispatchHandler(dispatchReq, dispatchRes);
    assert(dispatchRes.statusCode === 200, 'POST /api/routes/:id/dispatch returns HTTP 200 on valid dispatch');
    assert(mockRouteForDispatch.status === 'DISPATCHED', 'Route status advanced to DISPATCHED');
    assert(dispatchRes.body.data.manifest !== undefined, 'Issues official DispatchManifest upon dispatch');

    // -------------------------------------------------------------
    // 8. PATCH /api/routes/:id/stops/:stopId (Stop Collection Proof)
    // -------------------------------------------------------------
    const mockRouteForStopProof = {
      _id: '60d5ec49f1b2c82b8c8e49a1',
      status: 'IN_PROGRESS',
      stops: [
        {
          stopId: 'ST-TEST-01',
          status: 'PENDING',
          collectionProof: {}
        }
      ],
      recalculateMetrics: function() {},
      save: async function() { return this; }
    };
    OptimizedRoute.findById = async () => mockRouteForStopProof;

    const stopProofReq = createMockReq({
      params: { id: '60d5ec49f1b2c82b8c8e49a1', stopId: 'ST-TEST-01' },
      body: {
        status: 'COLLECTED',
        verifiedCratesCount: 40,
        verifiedWeightKg: 1000,
        farmerSignoffName: 'Farmer Musa',
        driverNotes: 'Produce graded A1 condition'
      }
    });
    const stopProofRes = createMockRes();
    await updateStopHandler(stopProofReq, stopProofRes);
    assert(stopProofRes.statusCode === 200, 'PATCH /api/routes/:id/stops/:stopId updates stop to COLLECTED');
    assert(mockRouteForStopProof.stops[0].status === 'COLLECTED', 'Stop status set to COLLECTED');
    assert(mockRouteForStopProof.stops[0].collectionProof.verifiedCratesCount === 40, 'Records verified crates count');

    // -------------------------------------------------------------
    // 9. GET /api/routes/:id/manifest (Retrieve Cargo Manifest)
    // -------------------------------------------------------------
    DispatchManifest.findOne = async () => ({
      manifestNumber: 'MNF-20240702-ABCD',
      routeCode: 'AGR-20240702-DISPATCH',
      status: 'ISSUED'
    });

    const manifestReq = createMockReq({ params: { id: '60d5ec49f1b2c82b8c8e49a1' } });
    const manifestRes = createMockRes();
    await getManifestHandler(manifestReq, manifestRes);
    assert(manifestRes.statusCode === 200, 'GET /api/routes/:id/manifest returns HTTP 200 with manifest');
    assert(manifestRes.body.data.manifestNumber === 'MNF-20240702-ABCD', 'Returns correct manifestNumber');

    // Restore original stubs
    OptimizedRoute.prototype.save = origSave;
    DispatchManifest.prototype.save = origManifestSave;
    OptimizedRoute.find = origFind;
    OptimizedRoute.countDocuments = origCount;

  } catch (err) {
    console.error('Unexpected route controller test error:', err);
    failedTests++;
  }

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runRouteControllerTests();
