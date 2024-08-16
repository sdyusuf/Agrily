/**
 * @file carrierRankingService.js
 * @description Logistics Carrier Ranking, Leaderboard & Incentive Bonus Service
 * Evaluates carrier fleet operational telemetry, compiles monthly leaderboards,
 * and calculates performance incentive payouts and escrow withholding rates.
 */

class CarrierRankingService {
  /**
   * Compiles and ranks carrier scorecards into an ordered monthly leaderboard
   */
  static generateMonthlyLeaderboard(scorecards = []) {
    if (!scorecards || scorecards.length === 0) {
      return {
        totalCarriersEvaluated: 0,
        platinumCount: 0,
        goldCount: 0,
        silverCount: 0,
        bronzeCount: 0,
        probationaryCount: 0,
        rankings: []
      };
    }

    // Sort descending by overallCarrierScore, then completedTrips, then onTimeReliabilityPct
    const sorted = [...scorecards].sort((a, b) => {
      const scoreA = a.compositeScores?.overallCarrierScore || 0;
      const scoreB = b.compositeScores?.overallCarrierScore || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;

      const tripsA = a.lifetimeMetrics?.completedTrips || 0;
      const tripsB = b.lifetimeMetrics?.completedTrips || 0;
      if (tripsB !== tripsA) return tripsB - tripsA;

      const onTimeA = a.compositeScores?.onTimeReliabilityPct || 0;
      const onTimeB = b.compositeScores?.onTimeReliabilityPct || 0;
      return onTimeB - onTimeA;
    });

    let platinumCount = 0;
    let goldCount = 0;
    let silverCount = 0;
    let bronzeCount = 0;
    let probationaryCount = 0;

    const rankings = sorted.map((c, index) => {
      const tier = c.tier || 'PROBATIONARY_CARRIER';
      if (tier === 'PLATINUM_AGRO_CARRIER') platinumCount++;
      else if (tier === 'GOLD_AGRO_CARRIER') goldCount++;
      else if (tier === 'SILVER_AGRO_CARRIER') silverCount++;
      else if (tier === 'BRONZE_CARRIER') bronzeCount++;
      else probationaryCount++;

      return {
        rank: index + 1,
        carrierCode: c.carrierCode,
        carrierName: c.carrierName,
        tier,
        fleetSize: c.fleetSize || 1,
        overallScore: c.compositeScores?.overallCarrierScore || 0,
        onTimeRatePct: c.compositeScores?.onTimeReliabilityPct || 0,
        safetyScore: c.compositeScores?.safetyAndPreservationScore || 0,
        ecoScore: c.compositeScores?.ecoEfficiencyScore || 0,
        completedTrips: c.lifetimeMetrics?.completedTrips || 0,
        freightBonusPct: c.incentivesAndGuarantees?.freightPaymentBonusPct || 0,
        retentionEscrowPct: c.incentivesAndGuarantees?.retentionEscrowRequiredPct || 10,
        priorityDispatchAccess: !!c.incentivesAndGuarantees?.priorityDispatchAccess
      };
    });

    return {
      totalCarriersEvaluated: scorecards.length,
      platinumCount,
      goldCount,
      silverCount,
      bronzeCount,
      probationaryCount,
      rankings
    };
  }

  /**
   * Calculates monthly carrier bonus earnings and net escrow disbursements
   */
  static calculateMonthlyCarrierPayout({ carrierScorecard, monthlyGrossFreightNgn = 0 }) {
    const gross = Math.max(0, parseFloat(monthlyGrossFreightNgn) || 0);
    const inc = carrierScorecard.incentivesAndGuarantees || {};

    const bonusPct = inc.freightPaymentBonusPct || 0;
    const bonusEarnedNgn = Math.round(gross * (bonusPct / 100));

    const retentionPct = inc.retentionEscrowRequiredPct || 0;
    const retentionWithheldNgn = Math.round(gross * (retentionPct / 100));

    const netDisbursedNgn = gross + bonusEarnedNgn - retentionWithheldNgn;

    return {
      carrierCode: carrierScorecard.carrierCode,
      carrierName: carrierScorecard.carrierName,
      tier: carrierScorecard.tier,
      monthlyGrossFreightNgn: gross,
      bonusPercentage: bonusPct,
      bonusEarnedNgn,
      retentionEscrowPercentage: retentionPct,
      retentionWithheldNgn,
      netDisbursedNgn,
      auditTimestamp: new Date().toISOString()
    };
  }
}

module.exports = CarrierRankingService;
