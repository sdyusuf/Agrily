/**
 * @file corridorTollAndLevyMatrixService.js
 * @description Statutory Agro-Haulage Tolls, State Produce Levies & Transit Tax Matrix
 * Evaluates state agricultural produce inspection permits, LGA environmental forestry stamps,
 * FRSC weighbridge tariffs, and haulage service VAT compliance across Nigeria.
 */

const crypto = require('crypto');

/**
 * Standard Nigerian State Produce Haulage Tariff Registry (Per Consignment)
 */
const STATE_PRODUCE_LEVIES_REGISTRY = {
  KANO: { produceInspectionFeeNgn: 4500, stateForestryLevyNgn: 1500, lgaSanitationPermitNgn: 1000 },
  KADUNA: { produceInspectionFeeNgn: 4000, stateForestryLevyNgn: 1500, lgaSanitationPermitNgn: 1000 },
  PLATEAU: { produceInspectionFeeNgn: 3500, stateForestryLevyNgn: 2000, lgaSanitationPermitNgn: 1200 },
  BENUE: { produceInspectionFeeNgn: 5000, stateForestryLevyNgn: 2500, lgaSanitationPermitNgn: 1500 },
  OYO: { produceInspectionFeeNgn: 4000, stateForestryLevyNgn: 1500, lgaSanitationPermitNgn: 1000 },
  ONDO: { produceInspectionFeeNgn: 4500, stateForestryLevyNgn: 3000, lgaSanitationPermitNgn: 1200 },
  LAGOS: { produceInspectionFeeNgn: 6000, stateForestryLevyNgn: 1000, lgaSanitationPermitNgn: 2500 },
  RIVERS: { produceInspectionFeeNgn: 5500, stateForestryLevyNgn: 1500, lgaSanitationPermitNgn: 2000 },
  ABUJA: { produceInspectionFeeNgn: 3000, stateForestryLevyNgn: 1000, lgaSanitationPermitNgn: 1500 },
  BORNO: { produceInspectionFeeNgn: 5000, stateForestryLevyNgn: 2000, lgaSanitationPermitNgn: 1000 },
  SOKOTO: { produceInspectionFeeNgn: 4000, stateForestryLevyNgn: 1500, lgaSanitationPermitNgn: 1000 },
  OGUN: { produceInspectionFeeNgn: 4500, stateForestryLevyNgn: 2000, lgaSanitationPermitNgn: 1500 },
  ENUGU: { produceInspectionFeeNgn: 4000, stateForestryLevyNgn: 1500, lgaSanitationPermitNgn: 1200 }
};

class CorridorTollAndLevyMatrixService {
  /**
   * Resolves state produce levy breakdown
   */
  static getStateLevy(stateName) {
    const key = (stateName || '').toUpperCase().trim();
    return STATE_PRODUCE_LEVIES_REGISTRY[key] || {
      produceInspectionFeeNgn: 3500,
      stateForestryLevyNgn: 1500,
      lgaSanitationPermitNgn: 1000
    };
  }

  /**
   * Calculates complete statutory tolls, checkpoint taxes, and haulage service VAT
   */
  static calculateCorridorStatutoryLevies({
    originState,
    transitStates = [],
    destinationState,
    freightHaulageTariffNgn = 250000,
    tonnage = 10.0,
    vehicleType = 'MEDIUM_TRUCK_8_TON'
  }) {
    const origLevy = this.getStateLevy(originState);
    const destLevy = this.getStateLevy(destinationState);

    // 1. Origin Farm Gate Produce Inspection & Clearance
    const originProduceFee = origLevy.produceInspectionFeeNgn;
    const originForestryFee = origLevy.stateForestryLevyNgn;
    const originLgaFee = origLevy.lgaSanitationPermitNgn;
    const originSubtotal = originProduceFee + originForestryFee + originLgaFee;

    // 2. Interstate Transit Toll Plazas (e.g. Lekki, Federal Highway Tolls, Bridge Tolls)
    const transitCount = Math.max(1, (transitStates || []).length);
    const federalBridgeTollsNgn = transitCount * 2500;

    // 3. Destination Market Terminal Inflow Permit
    const destinationMarketInflowNgn = destLevy.produceInspectionFeeNgn;
    const destinationTerminalDischargeNgn = destLevy.lgaSanitationPermitNgn;
    const destinationSubtotal = destinationMarketInflowNgn + destinationTerminalDischargeNgn;

    // 4. Weighbridge Compliance Tariff (Tiered by vehicle tonnage)
    let weighbridgeFeeNgn = 2000;
    if (tonnage > 25.0) weighbridgeFeeNgn = 5000;
    else if (tonnage > 10.0) weighbridgeFeeNgn = 3500;

    // 5. Statutory Haulage Freight Service VAT (7.5%)
    // Note: Raw produce itself is 0% VAT exempt; VAT applies strictly to the haulage freight service
    const statutoryServiceVatRatePct = 7.5;
    const freightServiceVatNgn = Math.round(freightHaulageTariffNgn * (statutoryServiceVatRatePct / 100));

    // Grand total statutory outlays
    const totalGovernmentLeviesNgn = originSubtotal + federalBridgeTollsNgn + destinationSubtotal + weighbridgeFeeNgn;
    const totalStatutoryWithholdingNgn = totalGovernmentLeviesNgn + freightServiceVatNgn;

    const receiptPayload = [
      originState,
      destinationState,
      tonnage,
      freightHaulageTariffNgn,
      freightServiceVatNgn,
      totalGovernmentLeviesNgn
    ].join('|');

    const taxComplianceSeal = crypto.createHash('sha256').update(receiptPayload).digest('hex');

    return {
      taxComplianceCertificateId: `TAX-NG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      originState,
      destinationState,
      tonnage,
      vehicleType,
      statutoryLevyBreakdown: {
        originStateClearance: {
          produceInspectionFeeNgn: originProduceFee,
          stateForestryLevyNgn: originForestryFee,
          lgaSanitationPermitNgn: originLgaFee,
          subtotalNgn: originSubtotal
        },
        transitTollsAndBridges: {
          interstateCorridorBridgesNgn: federalBridgeTollsNgn,
          frscWeighbridgeTariffNgn: weighbridgeFeeNgn
        },
        destinationOffloadLevies: {
          marketEntryProduceClearanceNgn: destinationMarketInflowNgn,
          terminalDischargeSanitationNgn: destinationTerminalDischargeNgn,
          subtotalNgn: destinationSubtotal
        }
      },
      freightHaulageTariffNgn,
      haulageServiceVatRatePct: statutoryServiceVatRatePct,
      haulageServiceVatNgn: freightServiceVatNgn,
      totalGovernmentLeviesAndTollsNgn: totalGovernmentLeviesNgn,
      grandTotalStatutoryTariffNgn: totalStatutoryWithholdingNgn,
      produceVatStatus: 'EXEMPT_ZERO_RATED_AGRICULTURAL_PRODUCE',
      taxComplianceSeal,
      issuedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  CorridorTollAndLevyMatrixService,
  STATE_PRODUCE_LEVIES_REGISTRY
};
