/**
 * @file fleetEcoRoutingOptimizerService.js
 * @description Eco-Routing & Fuel Efficiency Optimization Service
 * Analyzes topological elevation, road surface friction indices, and congestion windows
 * to compute optimal eco-routes minimizing diesel burn and carbon emissions across Nigeria.
 */

const crypto = require('crypto');

/**
 * Road terrain friction coefficients (Higher coefficient = increased fuel consumption)
 */
const ROAD_TERRAIN_FACTORS = {
  DUAL_CARRIAGEWAY_PAVED_SMOOTH: { frictionCoeff: 1.00, avgSpeedKmh: 75, riskFactor: 1.0 },
  SINGLE_LANE_PAVED_STANDARD: { frictionCoeff: 1.10, avgSpeedKmh: 60, riskFactor: 1.05 },
  RURAL_FEEDER_ROAD_UNPAVED: { frictionCoeff: 1.35, avgSpeedKmh: 35, riskFactor: 1.25 },
  DEGRADED_POTHOLE_CORRIDOR: { frictionCoeff: 1.50, avgSpeedKmh: 25, riskFactor: 1.40 },
  URBAN_CONGESTED_TRUNK: { frictionCoeff: 1.40, avgSpeedKmh: 20, riskFactor: 1.15 }
};

/**
 * Eco-corridor route variants between primary agro-commercial nodes
 */
const CORRIDOR_ECO_ROUTING_GRAPH = {
  'KANO-LAGOS': [
    {
      routeVariantId: 'KN-LG-EXPRESSWAY',
      name: 'Standard Interstate Trunk: Kano ➔ Kaduna ➔ Abuja ➔ Lokoja ➔ Ibadan ➔ Lagos',
      distanceKm: 995,
      terrainProfile: 'DUAL_CARRIAGEWAY_PAVED_SMOOTH',
      estimatedHours: 34,
      tollPlazaCount: 8,
      recommendedTonnageMax: 40.0,
      ecoEfficiencyRating: 'RECOMMENDED_STANDARD'
    },
    {
      routeVariantId: 'KN-LG-WESTERN-BYPASS',
      name: 'Western Agronomy Bypass: Kano ➔ Funtua ➔ Kotangora ➔ Ilorin ➔ Oyo ➔ Lagos',
      distanceKm: 940,
      terrainProfile: 'SINGLE_LANE_PAVED_STANDARD',
      estimatedHours: 31,
      tollPlazaCount: 4,
      recommendedTonnageMax: 20.0,
      ecoEfficiencyRating: 'HIGHEST_FUEL_SAVING'
    },
    {
      routeVariantId: 'KN-LG-HEAVY-CARGO',
      name: 'Heavy Industrial Corridor: Kano ➔ Zaria ➔ Minna ➔ Bida ➔ Mokwa ➔ Jebba ➔ Lagos',
      distanceKm: 1040,
      terrainProfile: 'DEGRADED_POTHOLE_CORRIDOR',
      estimatedHours: 42,
      tollPlazaCount: 6,
      recommendedTonnageMax: 45.0,
      ecoEfficiencyRating: 'HEAVY_HAULAGE_ONLY'
    }
  ],
  'JOS-RIVERS': [
    {
      routeVariantId: 'JS-PH-EASTERN-EXPRESS',
      name: 'Eastern Fresh Produce Route: Jos ➔ Akwanga ➔ Makurdi ➔ Enugu ➔ Aba ➔ Port Harcourt',
      distanceKm: 760,
      terrainProfile: 'SINGLE_LANE_PAVED_STANDARD',
      estimatedHours: 26,
      tollPlazaCount: 6,
      recommendedTonnageMax: 30.0,
      ecoEfficiencyRating: 'OPTIMAL_COLD_CHAIN'
    },
    {
      routeVariantId: 'JS-PH-CENTRAL-BYPASS',
      name: 'Middle Belt Bypass: Jos ➔ Lafia ➔ Otukpo ➔ Obolo-Afor ➔ Okigwe ➔ Owerri ➔ Port Harcourt',
      distanceKm: 730,
      terrainProfile: 'DEGRADED_POTHOLE_CORRIDOR',
      estimatedHours: 28,
      tollPlazaCount: 3,
      recommendedTonnageMax: 15.0,
      ecoEfficiencyRating: 'LIGHT_TRUCK_ONLY'
    }
  ],
  'BENUE-LAGOS': [
    {
      routeVariantId: 'BN-LG-STANDARD',
      name: 'Yam Trunk: Makurdi ➔ Ankpa ➔ Ajaokuta ➔ Okene ➔ Owo ➔ Akure ➔ Sagamu ➔ Lagos',
      distanceKm: 680,
      terrainProfile: 'SINGLE_LANE_PAVED_STANDARD',
      estimatedHours: 22,
      tollPlazaCount: 5,
      recommendedTonnageMax: 35.0,
      ecoEfficiencyRating: 'RECOMMENDED_STANDARD'
    }
  ]
};

class FleetEcoRoutingOptimizerService {
  /**
   * Evaluates fuel consumption and carbon footprint for a specific route variant
   */
  static evaluateRouteEcoMetrics({
    distanceKm,
    terrainProfileKey = 'SINGLE_LANE_PAVED_STANDARD',
    tonnage = 10.0,
    vehicleBaselineKmL = 3.5,
    pumpPriceNgn = 950
  }) {
    const terrain = ROAD_TERRAIN_FACTORS[terrainProfileKey] || ROAD_TERRAIN_FACTORS.SINGLE_LANE_PAVED_STANDARD;
    const tons = Math.max(0.5, parseFloat(tonnage) || 1.0);
    const dist = Math.max(1, parseFloat(distanceKm) || 100);

    // Friction penalty decreases km/L efficiency
    const effectiveKmL = Math.max(1.5, parseFloat((vehicleBaselineKmL / terrain.frictionCoeff).toFixed(2)));
    // Additional tonnage fuel consumption penalty (+2% per ton above 5T)
    const tonnagePenaltyFactor = 1 + (Math.max(0, tons - 5) * 0.018);
    const adjustedKmL = Math.max(1.2, parseFloat((effectiveKmL / tonnagePenaltyFactor).toFixed(2)));

    const fuelConsumedLitres = parseFloat((dist / adjustedKmL).toFixed(1));
    const fuelCostNgn = Math.round(fuelConsumedLitres * pumpPriceNgn);
    const co2Kg = parseFloat((fuelConsumedLitres * 2.68).toFixed(1));
    const tonKm = dist * tons;
    const litresPerTonKm = parseFloat((fuelConsumedLitres / Math.max(1, tonKm)).toFixed(4));

    return {
      distanceKm: dist,
      terrainProfile: terrainProfileKey,
      terrainFrictionCoeff: terrain.frictionCoeff,
      effectiveFuelEfficiencyKmL: adjustedKmL,
      estimatedFuelConsumedLitres: fuelConsumedLitres,
      estimatedFuelCostNgn: fuelCostNgn,
      estimatedCo2EmissionsKg: co2Kg,
      litresPerTonKm
    };
  }

  /**
   * Compares all available route variants and recommends optimal eco-path
   */
  static findOptimalEcoRoute({
    originState,
    destinationState,
    tonnage = 10.0,
    isTemperatureControlled = false,
    currentDieselPriceNgn = 950
  }) {
    const orig = (originState || '').toUpperCase().trim();
    const dest = (destinationState || '').toUpperCase().trim();
    const corridorKey = `${orig}-${dest}`;

    const variants = CORRIDOR_ECO_ROUTING_GRAPH[corridorKey] || [
      {
        routeVariantId: `GEN-${orig.slice(0, 3)}-${dest.slice(0, 3)}-01`,
        name: `${orig} to ${dest} Direct Interstate Highway`,
        distanceKm: orig === dest ? 85 : 580,
        terrainProfile: 'SINGLE_LANE_PAVED_STANDARD',
        estimatedHours: orig === dest ? 2.5 : 18,
        tollPlazaCount: 4,
        recommendedTonnageMax: 35.0,
        ecoEfficiencyRating: 'RECOMMENDED_STANDARD'
      }
    ];

    const evaluatedVariants = variants.map((v) => {
      const eco = this.evaluateRouteEcoMetrics({
        distanceKm: v.distanceKm,
        terrainProfileKey: v.terrainProfile,
        tonnage,
        vehicleBaselineKmL: isTemperatureControlled ? 3.0 : 3.8,
        pumpPriceNgn: currentDieselPriceNgn
      });

      return {
        ...v,
        ecoMetrics: eco
      };
    });

    // Sort ascending by fuel consumed to pick greenest path
    evaluatedVariants.sort((a, b) => a.ecoMetrics.estimatedFuelConsumedLitres - b.ecoMetrics.estimatedFuelConsumedLitres);
    const recommendedGreenest = evaluatedVariants[0];

    // Compute potential diesel and carbon savings vs worst variant
    const worstVariant = evaluatedVariants[evaluatedVariants.length - 1];
    const fuelSavedLitres = parseFloat((worstVariant.ecoMetrics.estimatedFuelConsumedLitres - recommendedGreenest.ecoMetrics.estimatedFuelConsumedLitres).toFixed(1));
    const costSavedNgn = Math.round(fuelSavedLitres * currentDieselPriceNgn);
    const co2SavedKg = parseFloat((fuelSavedLitres * 2.68).toFixed(1));

    const optimizationId = `ECO-OPT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    return {
      optimizationId,
      corridorKey,
      originState: orig,
      destinationState: dest,
      tonnageCarried: tonnage,
      isReeferColdChain: isTemperatureControlled,
      dieselPumpPriceNgn: currentDieselPriceNgn,
      recommendedRoute: recommendedGreenest,
      allEvaluatedRoutes: evaluatedVariants,
      projectedSavings: {
        fuelSavedLitres,
        costSavedNgn,
        co2SavedKg,
        savingsPercentage: worstVariant.ecoMetrics.estimatedFuelConsumedLitres > 0
          ? parseFloat(((fuelSavedLitres / worstVariant.ecoMetrics.estimatedFuelConsumedLitres) * 100).toFixed(1))
          : 0
      },
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  FleetEcoRoutingOptimizerService,
  ROAD_TERRAIN_FACTORS,
  CORRIDOR_ECO_ROUTING_GRAPH
};
