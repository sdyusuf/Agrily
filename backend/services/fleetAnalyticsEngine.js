/**
 * @file fleetAnalyticsEngine.js
 * @description Fleet Logistics Analytics, Turnaround Bottleneck & Telemetry Engine
 * Aggregates trip turnaround durations, fuel efficiencies, idling hotspots, and corridor velocities.
 */

class FleetAnalyticsEngine {
  /**
   * Analyzes turnaround bottlenecks across an array of FleetPerformanceLog records
   */
  static analyzeTurnaroundBottlenecks(performanceLogs = []) {
    if (!performanceLogs || performanceLogs.length === 0) {
      return {
        sampleSize: 0,
        averageTotalTurnaroundMinutes: 0,
        averageOriginLoadingMinutes: 0,
        averageTransitMinutes: 0,
        averageInspectionMinutes: 0,
        averageOffloadingMinutes: 0,
        primaryBottleneckStage: 'NONE',
        bottleneckPercentage: 0,
        stageBreakdownPercentages: {
          loadingPct: 0,
          transitPct: 0,
          inspectionPct: 0,
          offloadingPct: 0
        }
      };
    }

    let totalTurnaround = 0;
    let totalLoading = 0;
    let totalTransit = 0;
    let totalInspection = 0;
    let totalOffloading = 0;
    let delayedTripsCount = 0;

    for (const log of performanceLogs) {
      const dur = log.turnaroundDurationsMinutes || {};
      totalTurnaround += dur.totalTurnaroundTime || 0;
      totalLoading += dur.originLoadingTime || 0;
      totalTransit += dur.transitTime || 0;
      totalInspection += dur.docksideInspectionTime || 0;
      totalOffloading += dur.destinationOffloadingTime || 0;

      if ((dur.transitDelayMinutes || 0) > 0) {
        delayedTripsCount++;
      }
    }

    const n = performanceLogs.length;
    const avgTotal = Math.round(totalTurnaround / n);
    const avgLoading = Math.round(totalLoading / n);
    const avgTransit = Math.round(totalTransit / n);
    const avgInspection = Math.round(totalInspection / n);
    const avgOffloading = Math.round(totalOffloading / n);

    // Dwell sum excluding transit
    const sumNonTransit = avgLoading + avgInspection + avgOffloading;
    const effectiveTotal = Math.max(1, avgTotal);

    const stages = [
      { name: 'ORIGIN_LOADING', minutes: avgLoading },
      { name: 'IN_TRANSIT', minutes: avgTransit },
      { name: 'DOCKSIDE_INSPECTION', minutes: avgInspection },
      { name: 'DESTINATION_OFFLOADING', minutes: avgOffloading }
    ];

    stages.sort((a, b) => b.minutes - a.minutes);
    const primary = stages[0];

    const loadingPct = parseFloat(((avgLoading / effectiveTotal) * 100).toFixed(1));
    const transitPct = parseFloat(((avgTransit / effectiveTotal) * 100).toFixed(1));
    const inspectionPct = parseFloat(((avgInspection / effectiveTotal) * 100).toFixed(1));
    const offloadingPct = parseFloat(((avgOffloading / effectiveTotal) * 100).toFixed(1));

    return {
      sampleSize: n,
      averageTotalTurnaroundMinutes: avgTotal,
      averageOriginLoadingMinutes: avgLoading,
      averageTransitMinutes: avgTransit,
      averageInspectionMinutes: avgInspection,
      averageOffloadingMinutes: avgOffloading,
      dwellTimeTotalMinutes: sumNonTransit,
      delayedTripsCount,
      delayedTripsRatePct: parseFloat(((delayedTripsCount / n) * 100).toFixed(1)),
      primaryBottleneckStage: primary.name,
      bottleneckPercentage: parseFloat(((primary.minutes / effectiveTotal) * 100).toFixed(1)),
      stageBreakdownPercentages: {
        loadingPct,
        transitPct,
        inspectionPct,
        offloadingPct
      }
    };
  }

  /**
   * Aggregates fleet fuel consumption, cost, and carbon footprints
   */
  static aggregateFuelAndCarbonMetrics(performanceLogs = []) {
    if (!performanceLogs || performanceLogs.length === 0) {
      return {
        sampleSize: 0,
        totalDistanceCoveredKm: 0,
        totalFuelConsumedLitres: 0,
        totalFuelCostNgn: 0,
        totalCo2EmissionsKg: 0,
        averageFuelEfficiencyKmPerLitre: 0,
        averageLitresPerTonKm: 0,
        averageEcoScore: 85
      };
    }

    let totalDist = 0;
    let totalFuel = 0;
    let totalCost = 0;
    let totalCo2 = 0;
    let totalTonKm = 0;
    let totalEco = 0;

    for (const log of performanceLogs) {
      const f = log.fuelAndEnergyTelemetry || {};
      const eco = log.ecoDrivingScorecard || {};
      const tons = log.commodityDetails?.tonnageCarriedTonnes || 1.0;

      const dist = f.totalDistanceCoveredKm || 0;
      const consumed = f.fuelConsumedLitres || 0;

      totalDist += dist;
      totalFuel += consumed;
      totalCost += f.fuelCostNgn || 0;
      totalCo2 += f.estimatedCo2EmissionsKg || (consumed * 2.68);
      totalTonKm += dist * tons;
      totalEco += eco.ecoDrivingScore || 85;
    }

    const n = performanceLogs.length;
    const avgEfficiency = totalFuel > 0 ? parseFloat((totalDist / totalFuel).toFixed(2)) : 0;
    const avgLitresPerTonKm = totalTonKm > 0 ? parseFloat((totalFuel / totalTonKm).toFixed(4)) : 0;
    const avgEcoScore = Math.round(totalEco / n);

    return {
      sampleSize: n,
      totalDistanceCoveredKm: Math.round(totalDist),
      totalFuelConsumedLitres: parseFloat(totalFuel.toFixed(1)),
      totalFuelCostNgn: Math.round(totalCost),
      totalCo2EmissionsKg: parseFloat(totalCo2.toFixed(1)),
      averageFuelEfficiencyKmPerLitre: avgEfficiency,
      averageLitresPerTonKm: avgLitresPerTonKm,
      averageEcoScore: avgEcoScore
    };
  }

  /**
   * Aggregates transit speed, reefer compliance, and corridor performance
   */
  static aggregateCorridorPerformance(performanceLogs = []) {
    const corridorMap = {};

    for (const log of performanceLogs) {
      const key = log.corridorId || 'COR-GEN-99';
      if (!corridorMap[key]) {
        corridorMap[key] = {
          corridorId: key,
          corridorName: log.corridorName || 'General Agro Corridor',
          tripsCount: 0,
          totalTransitHours: 0,
          totalDistanceKm: 0,
          excursionTripsCount: 0
        };
      }

      const durHours = (log.turnaroundDurationsMinutes?.transitTime || 0) / 60;
      const dist = log.fuelAndEnergyTelemetry?.totalDistanceCoveredKm || 0;
      const hadExcursion = (log.temperatureCompliance?.totalExcursionMinutes || 0) > 0;

      corridorMap[key].tripsCount++;
      corridorMap[key].totalTransitHours += durHours;
      corridorMap[key].totalDistanceKm += dist;
      if (hadExcursion) corridorMap[key].excursionTripsCount++;
    }

    return Object.values(corridorMap).map(c => {
      const avgSpeed = c.totalTransitHours > 0 ? parseFloat((c.totalDistanceKm / c.totalTransitHours).toFixed(1)) : 0;
      const excursionRate = c.tripsCount > 0 ? parseFloat(((c.excursionTripsCount / c.tripsCount) * 100).toFixed(1)) : 0;
      return {
        corridorId: c.corridorId,
        corridorName: c.corridorName,
        tripsCount: c.tripsCount,
        averageTransitHours: parseFloat((c.totalTransitHours / c.tripsCount).toFixed(1)),
        averageSpeedKmh: avgSpeed,
        coldChainExcursionRatePct: excursionRate
      };
    });
  }
}

module.exports = FleetAnalyticsEngine;
