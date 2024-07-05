/**
 * ==============================================================================
 * ROUTE OPTIMIZER ALGORITHMIC ENGINE - COMPREHENSIVE UNIT TEST SUITE
 * ==============================================================================
 * Tests the TSP Nearest Neighbor seeding, 2-Opt local search refinement,
 * Haversine matrix generation, and CVRP vehicle capacity partitioning.
 */

const {
  calculateHaversineDistance,
  buildDistanceMatrix,
  generateNearestNeighborTour,
  optimize2Opt,
  partitionStopsByCapacity,
  computeItineraryTimeline,
  optimizeAgriculturalRoute,
  SURFACE_FACTORS,
  PERISHABILITY_WEIGHTS
} = require('../services/routeOptimizer');

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

function runOptimizerTests() {
  console.log('\n======================================================');
  console.log('   RUNNING AGRILY ROUTE OPTIMIZER ALGORITHM TESTS     ');
  console.log('======================================================\n');

  try {
    // -------------------------------------------------------------
    // 1. Constants & Factors
    // -------------------------------------------------------------
    assert(SURFACE_FACTORS.PAVED_HIGHWAY === 1.0, 'Paved highway has baseline factor 1.0');
    assert(SURFACE_FACTORS.UNPAVED_LATERITE > 1.0, 'Unpaved laterite has road penalty factor > 1.0');
    assert(PERISHABILITY_WEIGHTS.HIGH < PERISHABILITY_WEIGHTS.LOW, 'HIGH perishability has lower heuristic weight than LOW (prioritizes earlier pickup)');

    // -------------------------------------------------------------
    // 2. Haversine Calculations & Matrix
    // -------------------------------------------------------------
    const d1 = calculateHaversineDistance(11.0855, 7.7198, 12.0022, 8.4412);
    assert(d1 > 125 && d1 < 135, `Haversine distance between Zaria and Kano is ~129 km (actual: ${d1} km)`);

    const d0 = calculateHaversineDistance(10.5, 7.4, 10.5, 7.4);
    assert(d0 === 0, 'Haversine distance between identical points is exactly 0.0 km');

    const nodes = [
      { name: 'Node 0', coordinates: { lat: 10.0, lng: 7.0 } },
      { name: 'Node 1', coordinates: { lat: 10.5, lng: 7.2 } },
      { name: 'Node 2', coordinates: { lat: 11.0, lng: 7.5 } }
    ];
    const matrix = buildDistanceMatrix(nodes);
    assert(matrix.length === 3 && matrix[0].length === 3, 'buildDistanceMatrix returns 3x3 square matrix for 3 nodes');
    assert(matrix[0][0] === 0 && matrix[1][1] === 0, 'Diagonal elements of distance matrix are 0.0');
    assert(matrix[0][1] === matrix[1][0], 'Distance matrix is strictly symmetric (matrix[i][j] === matrix[j][i])');
    assert(matrix[0][2] > matrix[0][1], 'Distance to farther node is strictly greater');

    // -------------------------------------------------------------
    // 3. Nearest-Neighbor Seeding with Perishability Priority
    // -------------------------------------------------------------
    const mockDepot = { coordinates: { lat: 11.0, lng: 7.7 } };
    const mockDestination = { coordinates: { lat: 12.0, lng: 8.4 } };
    const mockStops = [
      {
        locationName: 'Far Farm',
        location: { coordinates: [7.9, 11.4] }, // [lng, lat]
        producePayload: { perishabilityTier: 'LOW', weightKg: 500 }
      },
      {
        locationName: 'Nearby Farm with Fresh Tomatoes',
        location: { coordinates: [7.75, 11.1] },
        producePayload: { perishabilityTier: 'HIGH', weightKg: 800 }
      }
    ];

    const allTourNodes = [
      mockDepot,
      { coordinates: { lat: 11.4, lng: 7.9 } },
      { coordinates: { lat: 11.1, lng: 7.75 } },
      mockDestination
    ];
    const tourMatrix = buildDistanceMatrix(allTourNodes);
    const initialTour = generateNearestNeighborTour(mockStops, mockDepot, mockDestination, tourMatrix);

    assert(initialTour[0] === 0, 'Nearest neighbor tour starts at depot (node 0)');
    assert(initialTour[initialTour.length - 1] === 3, 'Nearest neighbor tour terminates at destination hub (node 3)');
    assert(initialTour[1] === 2, 'Prioritizes nearby high-perishability tomato farm as first stop');

    // -------------------------------------------------------------
    // 4. 2-Opt Local Search Refinement
    // -------------------------------------------------------------
    // Create a 4-stop tour that deliberately has crossed paths
    // Square coordinates: Depot(0,0), A(0,10), B(10,10), C(10,0), Destination(12,0)
    const crossedNodes = [
      { name: 'Depot', coordinates: { lat: 0, lng: 0 } },
      { name: 'A', coordinates: { lat: 0, lng: 1.0 } },
      { name: 'B', coordinates: { lat: 1.0, lng: 1.0 } },
      { name: 'C', coordinates: { lat: 1.0, lng: 0 } },
      { name: 'Dest', coordinates: { lat: 0, lng: 0 } }
    ];
    const crossedMatrix = buildDistanceMatrix(crossedNodes);

    // Deliberately crossed tour: 0 -> A(1) -> C(3) -> B(2) -> Dest(4)
    // Distance with crossing is greater than uncrossed: 0 -> A(1) -> B(2) -> C(3) -> Dest(4)
    const deliberateCrossedTour = [0, 1, 3, 2, 4];
    const res2Opt = optimize2Opt(deliberateCrossedTour, crossedMatrix);

    assert(res2Opt.finalDistance <= res2Opt.initialDistance, `2-Opt reduces or maintains total distance (${res2Opt.initialDistance} km -> ${res2Opt.finalDistance} km)`);
    assert(res2Opt.optimizedTour[0] === 0, '2-Opt preserves fixed origin depot');
    assert(res2Opt.optimizedTour[res2Opt.optimizedTour.length - 1] === 4, '2-Opt preserves fixed destination terminal');

    // -------------------------------------------------------------
    // 5. CVRP Vehicle Capacity Partitioning
    // -------------------------------------------------------------
    const multiHarvestStops = [
      { locationName: 'Farm 1', producePayload: { weightKg: 1500, perishabilityTier: 'HIGH' } },
      { locationName: 'Farm 2', producePayload: { weightKg: 2000, perishabilityTier: 'MEDIUM' } },
      { locationName: 'Farm 3', producePayload: { weightKg: 1200, perishabilityTier: 'LOW' } }
    ];

    // Total weight = 4700 kg. If truck capacity is 3000 kg, must partition into 2 clusters
    const clusters = partitionStopsByCapacity(multiHarvestStops, 3000);
    assert(clusters.length === 2, `Partitions 4,700 kg harvest into 2 vehicle trips under 3,000 kg capacity limit (actual: ${clusters.length})`);
    const c1Weight = clusters[0].reduce((s, stop) => s + stop.producePayload.weightKg, 0);
    const c2Weight = clusters[1].reduce((s, stop) => s + stop.producePayload.weightKg, 0);
    assert(c1Weight <= 3000, `Cluster 1 payload (${c1Weight} kg) does not exceed 3,000 kg`);
    assert(c2Weight <= 3000, `Cluster 2 payload (${c2Weight} kg) does not exceed 3,000 kg`);

    // -------------------------------------------------------------
    // 6. Itinerary Timeline & Time Windows
    // -------------------------------------------------------------
    const timelineStops = [
      {
        location: { coordinates: [7.8, 11.2] },
        roadSurface: 'PAVED_HIGHWAY',
        timeWindow: {
          earliestArrival: new Date(),
          latestArrival: new Date(Date.now() + 7200000), // 2 hrs deadline
          estimatedLoadingMinutes: 30
        }
      }
    ];
    const enriched = computeItineraryTimeline(
      timelineStops,
      { location: { coordinates: [7.7, 11.0] } },
      { location: { coordinates: [8.0, 11.5] } },
      new Date()
    );

    assert(enriched[0].estimatedArrival instanceof Date, 'Enriched stops receive calculated estimatedArrival Date');
    assert(enriched[0].isTimeWindowBreached === false, 'Detects arrival within valid time-window');

    // -------------------------------------------------------------
    // 7. Master optimizeAgriculturalRoute Solver
    // -------------------------------------------------------------
    const sampleOrigin = {
      depotName: 'Zaria Logistics Hub',
      location: { coordinates: [7.7198, 11.0855] }
    };
    const sampleDestination = {
      depotName: 'Kano Terminal',
      location: { coordinates: [8.4412, 12.0022] }
    };
    const sampleStops = [
      {
        stopId: 'ST-01',
        locationName: 'Makarfi Tomatoes',
        location: { coordinates: [7.8500, 11.3800] },
        roadSurface: 'SECONDARY_ASPHALT',
        producePayload: { produceName: 'Tomatoes', weightKg: 1000, volumeCrates: 40, perishabilityTier: 'HIGH' },
        timeWindow: { earliestArrival: new Date(), latestArrival: new Date(Date.now() + 14400000), estimatedLoadingMinutes: 20 }
      },
      {
        stopId: 'ST-02',
        locationName: 'Ikara Onions',
        location: { coordinates: [8.1200, 11.4500] },
        roadSurface: 'UNPAVED_LATERITE',
        producePayload: { produceName: 'Onions', weightKg: 1500, volumeCrates: 60, perishabilityTier: 'LOW' },
        timeWindow: { earliestArrival: new Date(), latestArrival: new Date(Date.now() + 18000000), estimatedLoadingMinutes: 25 }
      }
    ];

    const solution = optimizeAgriculturalRoute({
      originDepot: sampleOrigin,
      destinationHub: sampleDestination,
      stops: sampleStops,
      vehicleSpecs: { maxPayloadKg: 3500, maxVolumeCrates: 150 },
      departureTime: new Date()
    });

    assert(solution.algorithm === 'TSP_NEAREST_NEIGHBOR_2OPT', 'Master optimizer confirms TSP_NEAREST_NEIGHBOR_2OPT algorithm');
    assert(solution.optimizedDistanceKm > 0, 'Solution returns positive optimized distance in km');
    assert(solution.stops.length === 2, 'Solution returns all input stops in sequence');
    assert(solution.metrics.totalPayloadWeightKg === 2500, 'Calculates total payload accurately (2,500 kg)');
    assert(solution.metrics.capacityUtilizationPct === 71.4, 'Calculates capacity utilization % accurately (~71.4%)');
    assert(solution.metrics.isOverloaded === false, 'Detects payload within 3,500 kg capacity');
    assert(solution.metrics.highPerishabilityCount === 1, 'Correctly flags 1 high perishability stop');
    assert(solution.executionTimeMs >= 0, 'Records sub-millisecond or millisecond execution latency');

  } catch (err) {
    console.error('Unexpected optimizer test error:', err);
    failedTests++;
  }

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runOptimizerTests();
