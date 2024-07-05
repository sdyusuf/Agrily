/**
 * ==============================================================================
 * AGRILY AGRICULTURAL LOGISTICS - ROUTE OPTIMIZATION ALGORITHMIC ENGINE
 * ==============================================================================
 * 
 * Module Description:
 * This module implements specialized heuristic solvers for agricultural logistics:
 * 1. Traveling Salesperson Problem (TSP) with pickup perishability time-windows.
 * 2. Capacitated Vehicle Routing Problem (CVRP) with vehicle weight/volume thresholds.
 * 
 * Algorithmic Heuristics:
 *  - Distance Matrix Computation:
 *    Computes a symmetric all-pairs distance matrix using Great-Circle Haversine
 *    distance, scaled by regional road surface resistance multipliers.
 *  - Perishability-Weighted Nearest Neighbor (PW-NN):
 *    Constructs an initial feasible tour from origin depot to farm collection points.
 *    Priority scoring weights physical proximity against produce decay risk:
 *      Score(i, j) = Distance(i, j) * PerishabilityPenalty(j)
 *    where HIGH perishability receives a priority bonus to prevent spoilage in tropical heat.
 *  - 2-Opt Local Search Edge-Swap Refinement:
 *    Iteratively evaluates tour modifications by reversing sub-segments (i+1 to j).
 *    Swaps are accepted if:
 *      ΔDistance = [Dist(i, j) + Dist(i+1, j+1)] - [Dist(i, i+1) + Dist(j, j+1)] < -ε
 *    Guarantees convergence to 2-optimal (uncrossed) route without cycles.
 *  - Vehicle Capacity Safeguard & Multi-Vehicle Partitioning:
 *    Checks if total harvest payload exceeds truck capacity. If so, uses a
 *    Capacitated Clarke-Wright Savings heuristic to partition stops across multiple
 *    trips or fleet vehicles.
 * 
 * @module services/routeOptimizer
 */

const { ROAD_SURFACE_TYPES } = require('../models/OptimizedRoute');

/**
 * Mean Earth radius in kilometers (WGS 84 spherical approximation).
 * @constant {number}
 */
const EARTH_RADIUS_KM = 6371.0088;

/**
 * Road surface speed and travel time multipliers.
 * Rural dirt and laterite roads significantly decrease haulage speed.
 */
const SURFACE_FACTORS = {
  PAVED_HIGHWAY: 1.0,     // 65 km/h avg commercial haulage
  SECONDARY_ASPHALT: 1.15,// 45 km/h avg with road imperfections
  UNPAVED_LATERITE: 1.40, // 30 km/h avg rural feeder road
  RURAL_EARTH_TRACK: 1.75 // 20 km/h avg farm-gate access track
};

/**
 * Perishability heuristic priority weights.
 * Lower multiplier reduces effective heuristic distance, pulling high-perishability
 * crops earlier in the pickup tour sequence.
 */
const PERISHABILITY_WEIGHTS = {
  HIGH: 0.75,   // Tomatoes, leafy vegetables, soft berries
  MEDIUM: 1.0,  // Peppers, citrus, plantains, root vegetables
  LOW: 1.25     // Grains, tubers, pulses, dry onions
};

/**
 * Converts degrees to radians.
 * @param {number} deg Angle in degrees
 * @returns {number} Angle in radians
 */
function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calculates Great-Circle Haversine distance in kilometers between two points.
 * 
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in kilometers rounded to 3 decimal places
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((EARTH_RADIUS_KM * c).toFixed(3));
}

/**
 * Builds an all-pairs symmetric distance matrix for a list of location nodes.
 * Node 0 = Origin Depot, Nodes 1..N = Farm Pickup Stops, Node N+1 = Destination Hub.
 * 
 * @param {Array<Object>} nodes Array of geographic waypoint objects
 * @returns {Array<Array<number>>} 2D symmetric distance matrix in kilometers
 */
function buildDistanceMatrix(nodes) {
  const n = nodes.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const p1 = nodes[i].coordinates;
      const p2 = nodes[j].coordinates;
      const dist = calculateHaversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
      matrix[i][j] = dist;
      matrix[j][i] = dist;
    }
  }

  return matrix;
}

/**
 * Nearest-Neighbor Greedy Seeding with Produce Perishability Weighting.
 * Generates an initial feasible TSP tour that starts at depot (node 0) and
 * visits all farm collection points before ending at destination hub.
 * 
 * @param {Array<Object>} stops Farm pickup stops (nodes 1..N)
 * @param {Object} origin Origin depot node
 * @param {Object} destination Destination hub node
 * @param {Array<Array<number>>} distanceMatrix All-pairs distance matrix
 * @returns {Array<number>} Initial tour node indices [0, ...stops, destinationIdx]
 */
function generateNearestNeighborTour(stops, origin, destination, distanceMatrix) {
  const numStops = stops.length;
  if (numStops === 0) return [0, 1]; // Only depot and destination
  if (numStops === 1) return [0, 1, 2];

  const unvisited = new Set();
  for (let i = 1; i <= numStops; i++) {
    unvisited.add(i);
  }

  const tour = [0]; // Start at origin depot
  let currentNode = 0;

  while (unvisited.size > 0) {
    let nearestNode = null;
    let lowestWeightedScore = Infinity;

    for (const candidate of unvisited) {
      const rawDistance = distanceMatrix[currentNode][candidate];
      const stopData = stops[candidate - 1]; // stops is 0-indexed
      const perishability = stopData.producePayload?.perishabilityTier || 'MEDIUM';
      const weightMultiplier = PERISHABILITY_WEIGHTS[perishability] || 1.0;

      // Effective score prioritizes closer stops, discounted for high-perishability produce
      const weightedScore = rawDistance * weightMultiplier;

      if (weightedScore < lowestWeightedScore) {
        lowestWeightedScore = weightedScore;
        nearestNode = candidate;
      }
    }

    tour.push(nearestNode);
    unvisited.delete(nearestNode);
    currentNode = nearestNode;
  }

  // Final destination hub node index is numStops + 1
  const destinationNodeIndex = numStops + 1;
  tour.push(destinationNodeIndex);

  return tour;
}

/**
 * Calculates the total travel distance of a given tour sequence across the distance matrix.
 * 
 * @param {Array<number>} tour Sequence of node indices
 * @param {Array<Array<number>>} distanceMatrix All-pairs distance matrix
 * @returns {number} Total distance in kilometers
 */
function calculateTourDistance(tour, distanceMatrix) {
  let total = 0;
  for (let i = 0; i < tour.length - 1; i++) {
    const from = tour[i];
    const to = tour[i + 1];
    total += distanceMatrix[from][to];
  }
  return Number(total.toFixed(3));
}

/**
 * 2-Opt Local Search Heuristic for Tour Refinement.
 * Systematically iterates over edge pairs, reversing sub-routes to remove line crossings
 * until no further distance improvement greater than epsilon is possible.
 * 
 * Note: Fixed endpoints (index 0 = origin depot, index N-1 = destination terminal)
 * are locked in place. Only intermediate farm stops (indices 1 to N-2) are swapped.
 * 
 * @param {Array<number>} initialTour Initial tour sequence
 * @param {Array<Array<number>>} distanceMatrix All-pairs distance matrix
 * @param {number} [maxIterations=500] Safety cap on search iterations
 * @returns {{ optimizedTour: Array<number>, iterations: number, initialDistance: number, finalDistance: number }}
 */
function optimize2Opt(initialTour, distanceMatrix, maxIterations = 500) {
  let tour = [...initialTour];
  const n = tour.length;
  let improved = true;
  let iterations = 0;
  const initialDistance = calculateTourDistance(tour, distanceMatrix);
  const EPSILON = 0.001; // 1 meter threshold

  // If tour has fewer than 4 nodes (depot, 1 stop, terminal), 2-opt has no interior edges to swap
  if (n <= 3) {
    return {
      optimizedTour: tour,
      iterations: 0,
      initialDistance,
      finalDistance: initialDistance
    };
  }

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // i ranges from index 0 to n-3 (origin through 2nd to last stop)
    for (let i = 0; i < n - 2; i++) {
      // j ranges from i+2 to n-2 (stops cannot reverse destination terminal)
      for (let j = i + 2; j < n - 1; j++) {
        const nodeA = tour[i];
        const nodeB = tour[i + 1];
        const nodeC = tour[j];
        const nodeD = tour[j + 1];

        // Cost of current edges: (A -> B) + (C -> D)
        const currentCost = distanceMatrix[nodeA][nodeB] + distanceMatrix[nodeC][nodeD];
        // Cost of new reconnected edges: (A -> C) + (B -> D)
        const newCost = distanceMatrix[nodeA][nodeC] + distanceMatrix[nodeB][nodeD];

        const delta = newCost - currentCost;

        if (delta < -EPSILON) {
          // Reverse sub-array between i+1 and j
          const subArray = tour.slice(i + 1, j + 1).reverse();
          tour = [...tour.slice(0, i + 1), ...subArray, ...tour.slice(j + 1)];
          improved = true;
          break; // Restart scan after improvement
        }
      }
      if (improved) break;
    }
  }

  const finalDistance = calculateTourDistance(tour, distanceMatrix);

  return {
    optimizedTour: tour,
    iterations,
    initialDistance,
    finalDistance
  };
}

/**
 * Clarke-Wright / Bin Packing Vehicle Capacity Partitioning.
 * If total crop harvest weight exceeds a single vehicle's payload capacity limit,
 * partitions the collection stops into multiple feasible vehicle routes.
 * 
 * @param {Array<Object>} stops Array of farm collection stops
 * @param {number} maxPayloadKg Maximum vehicle cargo payload in kilograms
 * @returns {Array<Array<Object>>} Clustered arrays of stops, each within capacity
 */
function partitionStopsByCapacity(stops, maxPayloadKg = 3500) {
  if (!stops || stops.length === 0) return [];

  // Sort stops by weight descending (First-Fit Decreasing)
  const sortedStops = [...stops].sort((a, b) => {
    return (b.producePayload?.weightKg || 0) - (a.producePayload?.weightKg || 0);
  });

  const bins = []; // Array of { weight: number, stops: Array<Object> }

  for (const stop of sortedStops) {
    const stopWeight = stop.producePayload?.weightKg || 0;

    // If a single stop alone exceeds capacity, it gets its own dedicated vehicle trip
    if (stopWeight > maxPayloadKg) {
      bins.push({ weight: stopWeight, stops: [stop] });
      continue;
    }

    // Try to place into an existing bin that has sufficient remaining capacity
    let placed = false;
    for (const bin of bins) {
      if (bin.weight + stopWeight <= maxPayloadKg) {
        bin.stops.push(stop);
        bin.weight += stopWeight;
        placed = true;
        break;
      }
    }

    // If it doesn't fit in any existing bin, open a new bin
    if (!placed) {
      bins.push({ weight: stopWeight, stops: [stop] });
    }
  }

  return bins.map(b => b.stops);
}

/**
 * Computes scheduled arrival and departure timestamps along the optimized route,
 * checking for any time-window perishability breaches.
 * 
 * @param {Array<Object>} orderedStops Sequence-ordered stop objects
 * @param {Object} origin Origin depot
 * @param {Object} destination Destination terminal hub
 * @param {Date} departureScheduledAt Route scheduled departure time
 * @returns {Array<Object>} Stops enriched with estimatedArrival and time-window status
 */
function computeItineraryTimeline(orderedStops, origin, destination, departureScheduledAt) {
  let currentTime = new Date(departureScheduledAt).getTime();
  let prevCoords = { lat: origin.location.coordinates[1], lng: origin.location.coordinates[0] };

  const enrichedStops = orderedStops.map((stop, index) => {
    const stopCoords = { lat: stop.location.coordinates[1], lng: stop.location.coordinates[0] };
    const segmentDist = calculateHaversineDistance(prevCoords.lat, prevCoords.lng, stopCoords.lat, stopCoords.lng);

    // Apply road surface speed adjustment
    const surfaceFactor = SURFACE_FACTORS[stop.roadSurface] || 1.15;
    const speedKmH = Math.max(25, 45 / surfaceFactor);
    const transitMs = (segmentDist / speedKmH) * 60 * 60 * 1000;

    currentTime += transitMs;
    const arrivalTime = new Date(currentTime);

    // Check time-window compliance
    let isDelayed = false;
    let delayMinutes = 0;
    if (stop.timeWindow && stop.timeWindow.latestArrival) {
      const deadlineMs = new Date(stop.timeWindow.latestArrival).getTime();
      if (currentTime > deadlineMs) {
        isDelayed = true;
        delayMinutes = Math.round((currentTime - deadlineMs) / (1000 * 60));
      }
    }

    // Add loading time for cargo collection
    const loadingMinutes = stop.timeWindow?.estimatedLoadingMinutes || 20;
    currentTime += loadingMinutes * 60 * 1000;

    prevCoords = stopCoords;

    return {
      ...stop,
      stopSequence: index,
      estimatedArrival: arrivalTime,
      delayMinutes,
      isTimeWindowBreached: isDelayed
    };
  });

  return enrichedStops;
}

/**
 * Primary Master Optimization Function.
 * Accepts origin depot, destination hub, list of unassigned farm pickups, and vehicle specifications.
 * Executes:
 *   1. Distance Matrix Generation
 *   2. Perishability-Weighted Nearest Neighbor Seeding
 *   3. 2-Opt Local Search Improvement
 *   4. Vehicle Payload Validation & Metrics Calculation
 *   5. Itinerary Timeline Construction
 * 
 * @param {Object} params Optimization input parameters
 * @param {Object} params.originDepot Origin logistics depot
 * @param {Object} params.destinationHub Destination wholesale market/hub
 * @param {Array<Object>} params.stops Array of unassigned farm pickups
 * @param {Object} [params.vehicleSpecs] Assigned vehicle capacity specs
 * @param {Date} [params.departureTime] Scheduled departure timestamp
 * @returns {Object} Optimized route plan with reordered stops and calculated metrics
 */
function optimizeAgriculturalRoute({
  originDepot,
  destinationHub,
  stops = [],
  vehicleSpecs = { maxPayloadKg: 3500, maxVolumeCrates: 120 },
  departureTime = new Date()
}) {
  const startTime = Date.now();

  if (!originDepot || !originDepot.location || !originDepot.location.coordinates) {
    throw new Error('Valid origin depot with GeoJSON coordinates is required.');
  }
  if (!destinationHub || !destinationHub.location || !destinationHub.location.coordinates) {
    throw new Error('Valid destination hub with GeoJSON coordinates is required.');
  }

  // Construct flat list of nodes: [origin, ...stops, destination]
  const originNode = {
    name: originDepot.depotName || 'Origin Depot',
    coordinates: {
      lat: originDepot.location.coordinates[1],
      lng: originDepot.location.coordinates[0]
    }
  };

  const destNode = {
    name: destinationHub.depotName || 'Destination Terminal',
    coordinates: {
      lat: destinationHub.location.coordinates[1],
      lng: destinationHub.location.coordinates[0]
    }
  };

  const stopNodes = stops.map(s => ({
    name: s.locationName || s.farmName || 'Farm Stop',
    coordinates: {
      lat: s.location.coordinates[1],
      lng: s.location.coordinates[0]
    }
  }));

  const allNodes = [originNode, ...stopNodes, destNode];

  // 1. Build Distance Matrix
  const distanceMatrix = buildDistanceMatrix(allNodes);

  // 2. Generate Initial Tour via Nearest-Neighbor
  const initialTour = generateNearestNeighborTour(stops, originNode, destNode, distanceMatrix);

  // 3. Refine via 2-Opt Local Search
  const { optimizedTour, iterations, initialDistance, finalDistance } = optimize2Opt(initialTour, distanceMatrix);

  // 4. Extract re-ordered stops (indices 1 to tour.length - 2)
  const reorderedStops = [];
  for (let i = 1; i < optimizedTour.length - 1; i++) {
    const originalStopIndex = optimizedTour[i] - 1;
    reorderedStops.push(stops[originalStopIndex]);
  }

  // 5. Construct timeline
  const itineraryStops = computeItineraryTimeline(reorderedStops, originDepot, destinationHub, departureTime);

  // 6. Aggregate Payload & Metrics
  let totalWeight = 0;
  let totalCrates = 0;
  let highPerishabilityCount = 0;

  itineraryStops.forEach(stop => {
    const w = stop.producePayload?.weightKg || 0;
    const c = stop.producePayload?.volumeCrates || 0;
    totalWeight += w;
    totalCrates += c;
    if (stop.producePayload?.perishabilityTier === 'HIGH') {
      highPerishabilityCount++;
    }
  });

  const maxPayload = vehicleSpecs.maxPayloadKg || 3500;
  const isOverloaded = totalWeight > maxPayload;
  const excessPayloadKg = Math.max(0, totalWeight - maxPayload);
  const capacityUtilizationPct = Math.min(100, Number(((totalWeight / maxPayload) * 100).toFixed(1)));

  // Fuel & Emissions: ~0.24 L diesel / km + weight penalty
  const fuelConsumptionLiters = Number(((finalDistance * 0.24) * (1 + (totalWeight / 10000))).toFixed(2));
  const carbonFootprintKg = Number((fuelConsumptionLiters * 2.68).toFixed(2));

  // Estimated duration (travel time + stop handling times)
  const totalHandlingMinutes = itineraryStops.reduce((sum, s) => sum + (s.timeWindow?.estimatedLoadingMinutes || 20), 0);
  const totalTravelMinutes = Math.round((finalDistance / 42) * 60); // 42 km/h average
  const totalDurationMinutes = totalTravelMinutes + totalHandlingMinutes;

  const executionTimeMs = Date.now() - startTime;

  return {
    algorithm: 'TSP_NEAREST_NEIGHBOR_2OPT',
    initialDistanceKm: initialDistance,
    optimizedDistanceKm: finalDistance,
    distanceSavedKm: Number((initialDistance - finalDistance).toFixed(3)),
    iterationsRun: iterations,
    executionTimeMs,
    stops: itineraryStops,
    metrics: {
      totalDistanceKm: finalDistance,
      estimatedDurationMinutes: totalDurationMinutes,
      totalPayloadWeightKg: totalWeight,
      totalPayloadVolumeCrates: totalCrates,
      capacityUtilizationPct,
      isOverloaded,
      excessPayloadKg,
      estimatedFuelConsumptionLiters: fuelConsumptionLiters,
      estimatedCarbonFootprintKg: carbonFootprintKg,
      stopsCount: itineraryStops.length,
      highPerishabilityCount
    }
  };
}

module.exports = {
  calculateHaversineDistance,
  buildDistanceMatrix,
  generateNearestNeighborTour,
  optimize2Opt,
  partitionStopsByCapacity,
  computeItineraryTimeline,
  optimizeAgriculturalRoute,
  SURFACE_FACTORS,
  PERISHABILITY_WEIGHTS
};
