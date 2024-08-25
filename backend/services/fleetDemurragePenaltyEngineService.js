/**
 * @file fleetDemurragePenaltyEngineService.js
 * @description Offload Dwell Congestion & Demurrage Penalty Engine
 * Computes terminal dwell times, free-time allowance compliance, detention surcharges,
 * and carrier compensation claims across Nigerian agricultural terminal markets.
 */

const crypto = require('crypto');

/**
 * Standard Nigerian Agro-Terminal Free Dwell Windows & Demurrage Rates (Naira / Hour)
 */
const TERMINAL_DEMURRAGE_STANDARDS = {
  DRY_GRAIN_AGGREGATION: {
    freeDwellHours: 4.0,
    rigidTruckRatePerHourNgn: 15000,
    articulatedTruckRatePerHourNgn: 25000,
    nightStayoverSurchargeNgn: 30000
  },
  PERISHABLE_COLD_CHAIN: {
    freeDwellHours: 2.0,
    rigidTruckRatePerHourNgn: 22000,
    articulatedTruckRatePerHourNgn: 38000,
    nightStayoverSurchargeNgn: 50000
  },
  TUBER_BULK_TERMINAL: {
    freeDwellHours: 5.0,
    rigidTruckRatePerHourNgn: 12000,
    articulatedTruckRatePerHourNgn: 20000,
    nightStayoverSurchargeNgn: 25000
  },
  EXPORT_SEAPORT_CORRIDOR: {
    freeDwellHours: 6.0,
    rigidTruckRatePerHourNgn: 30000,
    articulatedTruckRatePerHourNgn: 50000,
    nightStayoverSurchargeNgn: 75000
  }
};

class FleetDemurragePenaltyEngineService {
  /**
   * Evaluates terminal dwell duration and computes detention surcharges
   */
  static calculateTerminalDemurrage({
    tripId,
    carrierCode,
    vehicleType = 'HEAVY_DUTY_30T_RIGID',
    cargoCategory = 'DRY_GRAIN_AGGREGATION',
    gateInTime,
    gateOutTime,
    hasReeferAuxEngineRunning = false,
    waiverHoursGranted = 0
  }) {
    if (!tripId || !carrierCode || !gateInTime || !gateOutTime) {
      throw new Error('tripId, carrierCode, gateInTime, and gateOutTime are required.');
    }

    const gateInMs = new Date(gateInTime).getTime();
    const gateOutMs = new Date(gateOutTime).getTime();

    if (isNaN(gateInMs) || isNaN(gateOutMs) || gateOutMs < gateInMs) {
      throw new Error('Invalid gateInTime or gateOutTime timestamp sequence.');
    }

    const totalDwellHours = parseFloat(((gateOutMs - gateInMs) / (1000 * 60 * 60)).toFixed(2));
    const rules = TERMINAL_DEMURRAGE_STANDARDS[cargoCategory] || TERMINAL_DEMURRAGE_STANDARDS.DRY_GRAIN_AGGREGATION;

    const effectiveFreeHours = rules.freeDwellHours + Math.max(0, parseFloat(waiverHoursGranted) || 0);
    const billableDetentionHours = Math.max(0, parseFloat((totalDwellHours - effectiveFreeHours).toFixed(2)));

    const isArticulated = vehicleType.includes('ARTICULATED') || vehicleType.includes('30T') || vehicleType.includes('40T');
    const hourlyRateNgn = isArticulated ? rules.articulatedTruckRatePerHourNgn : rules.rigidTruckRatePerHourNgn;

    let baseDetentionFeeNgn = Math.round(billableDetentionHours * hourlyRateNgn);

    // Night stayover surcharge if dwell extends past 18 hours
    const nightStayoverCount = Math.floor(totalDwellHours / 18);
    const nightStayoverTotalNgn = nightStayoverCount * rules.nightStayoverSurchargeNgn;

    // Additional aux fuel penalty for refrigerated loads held at terminal
    let reeferDieselLossNgn = 0;
    if (hasReeferAuxEngineRunning && billableDetentionHours > 0) {
      // Reefer consumes ~3.5L diesel per hour while stationary
      const reeferDieselLitres = parseFloat((billableDetentionHours * 3.5).toFixed(1));
      reeferDieselLossNgn = Math.round(reeferDieselLitres * 1150);
    }

    const totalDemurragePayableNgn = baseDetentionFeeNgn + nightStayoverTotalNgn + reeferDieselLossNgn;

    let detentionClassification = 'WITHIN_FREE_WINDOW';
    if (billableDetentionHours > 12) {
      detentionClassification = 'SEVERE_TERMINAL_GRIDLOCK';
    } else if (billableDetentionHours > 0) {
      detentionClassification = 'STANDARD_DETENTION_APPLIED';
    }

    const auditPayload = `${tripId}|${carrierCode}|${totalDwellHours}|${billableDetentionHours}|${totalDemurragePayableNgn}`;
    const demurrageSeal = crypto.createHash('sha256').update(auditPayload).digest('hex');

    return {
      demurrageInvoiceId: `DEM-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      tripId,
      carrierCode,
      cargoCategory,
      vehicleType,
      timestamps: {
        gateIn: new Date(gateInMs).toISOString(),
        gateOut: new Date(gateOutMs).toISOString(),
        totalDwellHours,
        freeDwellAllowanceHours: effectiveFreeHours,
        billableDetentionHours
      },
      ratesApplied: {
        hourlyDetentionRateNgn: hourlyRateNgn,
        nightStayoverRateNgn: rules.nightStayoverSurchargeNgn,
        nightStayoversCount: nightStayoverCount
      },
      financialBreakdown: {
        baseDetentionFeeNgn,
        nightStayoverSurchargeTotalNgn: nightStayoverTotalNgn,
        reeferDieselAuxPenaltyNgn: reeferDieselLossNgn,
        totalDemurragePayableNgn
      },
      carrierCompensationPayoutNgn: Math.round(totalDemurragePayableNgn * 0.90), // 90% payout to driver/carrier, 10% platform handling
      detentionClassification,
      isCarrierCompensationEligible: totalDemurragePayableNgn > 0,
      demurrageSeal,
      auditedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  FleetDemurragePenaltyEngineService,
  TERMINAL_DEMURRAGE_STANDARDS
};
