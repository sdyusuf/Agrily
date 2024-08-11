/**
 * @file escrowCorridorSettlementAuditService.js
 * @description Agricultural Agro-Corridor Settlement Audit & Velocity Service
 * Evaluates escrow payout velocity, corridor risk premiums, and transit compliance
 * across major Nigerian agro-logistics trade corridors.
 */

const crypto = require('crypto');

/**
 * Standard Nigerian Agro-Logistics Corridors
 */
const AGRO_CORRIDOR_REGISTRY = {
  NORTH_WEST_GRAIN: {
    corridorId: 'COR-NW-01',
    name: 'Kano-Kaduna-Abuja-Lagos Grain Corridor',
    primaryCommodities: ['WHITE_MAIZE', 'YELLOW_MAIZE', 'SORGHUM', 'SOYBEANS', 'SESAME_SEEDS'],
    baselineTransitHours: 36,
    maximumPermissibleTransitHours: 54,
    escrowHoldingEscalationHours: 48,
    corridorRiskMultiplier: 1.05,
    recommendedReeferAssurance: false
  },
  MIDDLE_BELT_PERISHABLE: {
    corridorId: 'COR-MB-02',
    name: 'Jos-Benue-Enugu-Port Harcourt Fresh Produce Corridor',
    primaryCommodities: ['IRISH_POTATOES', 'ROMA_TOMATOES', 'FRESH_PEPPER', 'SWEET_ORANGES'],
    baselineTransitHours: 24,
    maximumPermissibleTransitHours: 36,
    escrowHoldingEscalationHours: 24,
    corridorRiskMultiplier: 1.25,
    recommendedReeferAssurance: true
  },
  SOUTH_WEST_COCOA_TUBER: {
    corridorId: 'COR-SW-03',
    name: 'Ondo-Osun-Oyo-Lagos Cash Crop Belt',
    primaryCommodities: ['COCOA_BEANS', 'WHITE_YAMS', 'CASSAVA_TUBERS', 'OIL_PALM_BUNCHES'],
    baselineTransitHours: 18,
    maximumPermissibleTransitHours: 28,
    escrowHoldingEscalationHours: 24,
    corridorRiskMultiplier: 1.02,
    recommendedReeferAssurance: false
  },
  NORTH_EAST_LIVESTOCK_PULSES: {
    corridorId: 'COR-NE-04',
    name: 'Maiduguri-Gombe-Bauchi-Jos Livestock & Cowpea Route',
    primaryCommodities: ['BROWN_BEANS', 'GUM_ARABIC', 'SESAME_SEEDS'],
    baselineTransitHours: 42,
    maximumPermissibleTransitHours: 64,
    escrowHoldingEscalationHours: 48,
    corridorRiskMultiplier: 1.30,
    recommendedReeferAssurance: false
  }
};

class EscrowCorridorSettlementAuditService {
  /**
   * Identifies appropriate corridor profile based on departure and destination states
   */
  static resolveCorridor(originState, destinationState) {
    const origin = (originState || '').toUpperCase().trim();
    const dest = (destinationState || '').toUpperCase().trim();

    if (['KANO', 'KADUNA', 'KATSINA', 'SOKOTO', 'JIGAWA'].includes(origin) &&
        ['LAGOS', 'OGUN', 'OYO', 'ABUJA', 'FCT'].includes(dest)) {
      return AGRO_CORRIDOR_REGISTRY.NORTH_WEST_GRAIN;
    }

    if (['PLATEAU', 'JOS', 'BENUE', 'NASARAWA'].includes(origin) &&
        ['RIVERS', 'PORT HARCOURT', 'ENUGU', 'IMO', 'ABIA', 'DELTA', 'BAYELSA'].includes(dest)) {
      return AGRO_CORRIDOR_REGISTRY.MIDDLE_BELT_PERISHABLE;
    }

    if (['ONDO', 'OSUN', 'EKITI', 'OGUN', 'OYO'].includes(origin) &&
        ['LAGOS', 'OGUN', 'EDO'].includes(dest)) {
      return AGRO_CORRIDOR_REGISTRY.SOUTH_WEST_COCOA_TUBER;
    }

    if (['BORNO', 'MAIDUGURI', 'YOBE', 'GOMBE', 'BAUCHI', 'ADAMAWA'].includes(origin)) {
      return AGRO_CORRIDOR_REGISTRY.NORTH_EAST_LIVESTOCK_PULSES;
    }

    // Default general interstate corridor
    return {
      corridorId: 'COR-GEN-99',
      name: `${originState || 'Domestic'} to ${destinationState || 'Domestic'} General Corridor`,
      primaryCommodities: ['GENERAL_PRODUCE'],
      baselineTransitHours: 30,
      maximumPermissibleTransitHours: 48,
      escrowHoldingEscalationHours: 36,
      corridorRiskMultiplier: 1.10,
      recommendedReeferAssurance: false
    };
  }

  /**
   * Evaluates corridor transit delay impact on perishable produce escrow releases
   */
  static evaluateCorridorTransitImpact({ originState, destinationState, transitDurationHours, commodityKey, reeferActive }) {
    const corridor = this.resolveCorridor(originState, destinationState);
    const duration = parseFloat(transitDurationHours) || 0;
    const isPerishable = corridor.recommendedReeferAssurance || ['ROMA_TOMATOES', 'IRISH_POTATOES', 'FRESH_PEPPER'].includes(commodityKey);

    let delayHours = Math.max(0, duration - corridor.baselineTransitHours);
    let isExceededMaxPermissible = duration > corridor.maximumPermissibleTransitHours;
    let riskFactor = 1.0;

    if (delayHours > 0) {
      if (isPerishable && !reeferActive) {
        // Severe risk acceleration for ambient perishables
        riskFactor = Math.min(3.0, 1.0 + (delayHours / corridor.baselineTransitHours) * 2.5);
      } else {
        riskFactor = Math.min(2.0, 1.0 + (delayHours / corridor.baselineTransitHours) * 0.8);
      }
    }

    // Escrow recommendation
    let escrowDisposition = 'PROCEED_AUTOMATIC_RELEASE';
    let suggestedPenaltyDeductionPct = 0;

    if (isExceededMaxPermissible) {
      if (isPerishable && !reeferActive) {
        escrowDisposition = 'HOLD_MANDATORY_QUALITY_INSPECTION';
        suggestedPenaltyDeductionPct = 25.0;
      } else {
        escrowDisposition = 'FLAG_FOR_CONSIGNEE_REVIEW';
        suggestedPenaltyDeductionPct = 5.0;
      }
    } else if (delayHours > (corridor.baselineTransitHours * 0.25)) {
      escrowDisposition = 'INSPECTION_CONFIRMATION_REQUIRED';
      suggestedPenaltyDeductionPct = 0;
    }

    return {
      corridorId: corridor.corridorId,
      corridorName: corridor.name,
      baselineHours: corridor.baselineTransitHours,
      actualHours: duration,
      delayHours: parseFloat(delayHours.toFixed(1)),
      isExceededMaxPermissible,
      riskMultiplier: parseFloat((corridor.corridorRiskMultiplier * riskFactor).toFixed(2)),
      escrowDisposition,
      suggestedPenaltyDeductionPct,
      auditTimestamp: new Date().toISOString()
    };
  }

  /**
   * Calculates corridor carrier performance rating and dynamic freight settlement modifier
   */
  static calculateCarrierCorridorRating({ completedWaybills, onTimeDeliveries, coldChainExcursions, averageTransitHours, corridorBaselineHours }) {
    if (!completedWaybills || completedWaybills <= 0) {
      return {
        carrierScore: 100,
        tier: 'PROBATIONARY_CARRIER',
        freightPaymentBonusPct: 0,
        retentionEscrowRequiredPct: 15
      };
    }

    const onTimeRate = (onTimeDeliveries / completedWaybills) * 100;
    const excursionPenalty = (coldChainExcursions || 0) * 8.5;
    const speedRatio = averageTransitHours / (corridorBaselineHours || 36);

    // On-time rate accounts for up to 85 points, transit velocity contributes up to 15 points
    const velocityBonus = Math.max(0, Math.min(15, (1.2 - speedRatio) * 45));
    let rawScore = (onTimeRate * 0.85) + velocityBonus - excursionPenalty;
    let finalScore = Math.max(10, Math.min(100, Math.round(rawScore)));

    let tier = 'BRONZE_CARRIER';
    let freightPaymentBonusPct = 0;
    let retentionEscrowRequiredPct = 10;

    if (finalScore >= 90) {
      tier = 'PLATINUM_AGRO_CARRIER';
      freightPaymentBonusPct = 3.5;
      retentionEscrowRequiredPct = 0;
    } else if (finalScore >= 80) {
      tier = 'GOLD_AGRO_CARRIER';
      freightPaymentBonusPct = 1.5;
      retentionEscrowRequiredPct = 2.5;
    } else if (finalScore >= 65) {
      tier = 'SILVER_AGRO_CARRIER';
      freightPaymentBonusPct = 0;
      retentionEscrowRequiredPct = 5.0;
    } else {
      tier = 'HIGH_RISK_CARRIER';
      freightPaymentBonusPct = 0;
      retentionEscrowRequiredPct = 20.0;
    }

    return {
      carrierScore: finalScore,
      tier,
      onTimeRatePct: parseFloat(onTimeRate.toFixed(1)),
      freightPaymentBonusPct,
      retentionEscrowRequiredPct
    };
  }

  /**
   * Generates a tamper-evident Corridor Escrow Settlement Audit Certificate
   */
  static generateCorridorAuditCertificate({ vaultNumber, corridor, carrierMetrics, transitImpact, totalDisbursement }) {
    const payload = JSON.stringify({
      vaultNumber,
      corridorId: corridor?.corridorId || 'COR-GEN-99',
      carrierTier: carrierMetrics?.tier,
      disposition: transitImpact?.escrowDisposition,
      disbursement: totalDisbursement
    });

    const digitalSeal = crypto.createHash('sha256').update(payload).digest('hex');

    return {
      certificateId: `COR-AUDIT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      vaultNumber,
      corridorName: corridor?.name || 'Standard Agro Corridor',
      carrierTier: carrierMetrics?.tier || 'STANDARD',
      carrierScore: carrierMetrics?.carrierScore || 85,
      disposition: transitImpact?.escrowDisposition || 'PROCEED_AUTOMATIC_RELEASE',
      suggestedPenaltyPct: transitImpact?.suggestedPenaltyDeductionPct || 0,
      freightBonusPct: carrierMetrics?.freightPaymentBonusPct || 0,
      totalDisbursedNgn: totalDisbursement,
      digitalSeal,
      issuedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  EscrowCorridorSettlementAuditService,
  AGRO_CORRIDOR_REGISTRY
};
