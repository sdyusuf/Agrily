/**
 * @file fleetEcosystemExportService.js
 * @description Comprehensive Fleet Telemetry & Haulage Audit Dossier Service
 * Generates tamper-evident digital audit reports and corridor compliance certificates
 * for commercial haulers, agricultural cooperatives, and institutional off-takers.
 */

const crypto = require('crypto');

class FleetEcosystemExportService {
  /**
   * Generates cryptographic digital signature for a fleet audit dossier
   */
  static calculateDossierDigitalSeal(dossierPayload) {
    const serialized = typeof dossierPayload === 'string' ? dossierPayload : JSON.stringify(dossierPayload);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Compiles an end-to-end Fleet Trip Telemetry & Turnaround Audit Dossier
   */
  static compileTripAuditDossier({
    performanceLog,
    carrierScorecard,
    tariffQuote,
    regulatoryInspectorName = 'FRSC / Agrily Certified Logistics Auditor'
  }) {
    if (!performanceLog) {
      throw new Error('performanceLog is required to generate trip audit dossier.');
    }

    const trackingNum = performanceLog.logTrackingNumber || 'FLT-UNTRACKED';
    const dossierId = `DOSSIER-${trackingNum}-${Date.now().toString(36).toUpperCase()}`;

    const turnaround = performanceLog.turnaroundDurationsMinutes || {};
    const fuel = performanceLog.fuelAndEnergyTelemetry || {};
    const eco = performanceLog.ecoDrivingScorecard || {};
    const temp = performanceLog.temperatureCompliance || {};

    const payloadForSealing = {
      dossierId,
      trackingNumber: trackingNum,
      vehicleRegNumber: performanceLog.vehicleRegNumber,
      carrier: performanceLog.carrierOrganization,
      totalTurnaroundMinutes: turnaround.totalTurnaroundTime,
      totalDistanceKm: fuel.totalDistanceCoveredKm,
      fuelConsumedLitres: fuel.fuelConsumedLitres,
      ecoDrivingScore: eco.ecoDrivingScore,
      reeferIntegrityPassed: temp.reeferIntegrityPassed
    };

    const digitalSeal = this.calculateDossierDigitalSeal(payloadForSealing);

    return {
      dossierId,
      trackingNumber: trackingNum,
      auditTimestamp: new Date().toISOString(),
      auditor: regulatoryInspectorName,
      digitalSeal,
      vehicleProfile: {
        registrationNumber: performanceLog.vehicleRegNumber,
        vehicleType: performanceLog.vehicleType,
        carrierOrganization: performanceLog.carrierOrganization
      },
      corridorTransitSummary: {
        corridorId: performanceLog.corridorId,
        corridorName: performanceLog.corridorName,
        originState: performanceLog.origin?.state,
        originFacility: performanceLog.origin?.facilityName,
        destinationState: performanceLog.destination?.state,
        destinationFacility: performanceLog.destination?.facilityName,
        totalDistanceKm: fuel.totalDistanceCoveredKm
      },
      turnaroundAudit: {
        originLoadingMinutes: turnaround.originLoadingTime,
        transitMinutes: turnaround.transitTime,
        docksideInspectionMinutes: turnaround.docksideInspectionTime,
        destinationOffloadingMinutes: turnaround.destinationOffloadingTime,
        totalTurnaroundMinutes: turnaround.totalTurnaroundTime,
        transitDelayMinutes: turnaround.transitDelayMinutes || 0,
        dwellEfficiencyRating: turnaround.totalTurnaroundTime <= 2400 ? 'OPTIMAL' : 'CONGESTED'
      },
      fuelAndEmissionsAudit: {
        fuelConsumedLitres: fuel.fuelConsumedLitres,
        fuelEfficiencyKmL: fuel.fuelEfficiencyKmPerLitre,
        litresPerTonKm: fuel.litresPerTonKm,
        fuelExpenditureNgn: fuel.fuelCostNgn,
        co2EmissionsKg: fuel.estimatedCo2EmissionsKg
      },
      driverBehaviorScorecard: {
        ecoScore: eco.ecoDrivingScore,
        ecoTier: eco.ecoTier,
        hardBrakingEvents: eco.hardBrakingEventsCount,
        rapidAccelerationEvents: eco.rapidAccelerationCount,
        idlingMinutes: eco.excessiveIdlingDurationMinutes
      },
      coldChainCompliance: {
        reeferPassed: temp.reeferIntegrityPassed,
        excursionMinutes: temp.totalExcursionMinutes || 0,
        maxTempRecorded: temp.maxRecordedTemperature,
        minTempRecorded: temp.minRecordedTemperature
      },
      carrierRatingSnapshot: carrierScorecard ? {
        carrierCode: carrierScorecard.carrierCode,
        carrierTier: carrierScorecard.tier,
        overallScore: carrierScorecard.compositeScores?.overallCarrierScore,
        freightBonusPct: carrierScorecard.incentivesAndGuarantees?.freightPaymentBonusPct
      } : null,
      freightFinancials: tariffQuote ? {
        quoteId: tariffQuote.quoteId,
        baseHaulageNgn: tariffQuote.rawBaseFreightNgn,
        fuelSurchargeNgn: tariffQuote.fuelSurchargeNgn,
        reeferPremiumNgn: tariffQuote.reeferPremiumNgn,
        securityEscortNgn: tariffQuote.securitySurchargeNgn,
        statutoryTollsNgn: tariffQuote.statutoryTollsNgn,
        totalTariffBilledNgn: tariffQuote.finalTariffNgn
      } : null
    };
  }

  /**
   * Generates a printable, standalone HTML Fleet Audit Report
   */
  static generateFleetAuditReportHtml(dossier) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Agrily Fleet Telemetry Audit Dossier - ${dossier.trackingNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 40px; background: #f8faf9; }
    .report-card { background: #ffffff; border: 1px solid #2d6a4f; border-radius: 16px; padding: 36px; max-width: 850px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2d6a4f; padding-bottom: 20px; }
    .brand-title { font-size: 26px; font-weight: 800; color: #1b4332; margin: 0; }
    .dossier-tag { font-size: 13px; font-weight: 700; color: #bc6c25; text-transform: uppercase; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .meta-box { background: #f8faf9; border-radius: 8px; padding: 14px; border: 1px solid #e2e8f0; }
    .meta-lbl { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .meta-val { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px; }
    .section-title { font-size: 16px; font-weight: 800; color: #1b4332; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th { text-align: left; padding: 8px; background: #f1f5f9; color: #475569; font-weight: 700; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    .seal-box { margin-top: 30px; padding: 16px; background: #f0fdf4; border: 1px dashed #2d6a4f; border-radius: 8px; }
    .seal-lbl { font-size: 11px; color: #166534; font-weight: 800; text-transform: uppercase; }
    .seal-code { font-family: monospace; font-size: 11px; color: #15803d; word-break: break-all; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="report-card">
    <div class="header">
      <div>
        <h1 class="brand-title">🌾 AGRILY LOGISTICS OS</h1>
        <span class="dossier-tag">Fleet Telemetry &amp; Freight Yield Audit Dossier</span>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 800; font-size: 16px;">${dossier.trackingNumber}</div>
        <div style="font-size: 12px; color: #64748b;">${dossier.dossierId}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <div class="meta-lbl">Vehicle &amp; Carrier</div>
        <div class="meta-val">${dossier.vehicleProfile.registrationNumber} (${dossier.vehicleProfile.vehicleType})</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${dossier.vehicleProfile.carrierOrganization}</div>
      </div>
      <div class="meta-box">
        <div class="meta-lbl">Corridor Route</div>
        <div class="meta-val">${dossier.corridorTransitSummary.originState} ➔ ${dossier.corridorTransitSummary.destinationState}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${dossier.corridorTransitSummary.distanceKm} km (${dossier.corridorTransitSummary.corridorName})</div>
      </div>
    </div>

    <div class="section-title">⏱️ Turnaround &amp; Dwell Time Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>Trip Stage</th>
          <th>Duration</th>
          <th>Corridor Assessment</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Origin Gate-In &amp; Loading</td><td>${dossier.turnaroundAudit.originLoadingMinutes} mins</td><td>Standard Dispatch</td></tr>
        <tr><td>Interstate Freight Transit</td><td>${dossier.turnaroundAudit.transitMinutes} mins</td><td>Delay: +${dossier.turnaroundAudit.transitDelayMinutes}m</td></tr>
        <tr><td>Dockside Quality Grading</td><td>${dossier.turnaroundAudit.docksideInspectionMinutes} mins</td><td>Inspection Completed</td></tr>
        <tr><td>Destination Offloading</td><td>${dossier.turnaroundAudit.destinationOffloadingMinutes} mins</td><td>Terminal Gate-Out</td></tr>
        <tr style="font-weight: 800; background: #f8faf9;">
          <td>Total Lifecycle Turnaround</td>
          <td>${dossier.turnaroundAudit.totalTurnaroundMinutes} mins</td>
          <td>${dossier.turnaroundAudit.dwellEfficiencyRating}</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">⚡ Fuel Economy &amp; Carbon Footprint</div>
    <table>
      <tbody>
        <tr><td>Fuel Consumed</td><td>${dossier.fuelAndEmissionsAudit.fuelConsumedLitres} Litres</td></tr>
        <tr><td>Fuel Economy</td><td>${dossier.fuelAndEmissionsAudit.fuelEfficiencyKmL} km/L</td></tr>
        <tr><td>Ton-Km Consumption</td><td>${dossier.fuelAndEmissionsAudit.litresPerTonKm} L/ton-km</td></tr>
        <tr><td>CO2 Carbon Footprint</td><td>${dossier.fuelAndEmissionsAudit.co2EmissionsKg} kg CO2</td></tr>
        <tr><td>Driver Eco-Score</td><td>${dossier.driverBehaviorScorecard.ecoScore} / 100 (${dossier.driverBehaviorScorecard.ecoTier})</td></tr>
      </tbody>
    </table>

    <div class="seal-box">
      <div class="seal-lbl">Tamper-Evident SHA-256 Dossier Seal</div>
      <div class="seal-code">${dossier.digitalSeal}</div>
      <div style="font-size: 11px; color: #166534; margin-top: 4px;">Audited By: ${dossier.auditor} | Issued: ${dossier.auditTimestamp}</div>
    </div>
  </div>
</body>
</html>`;
  }
}

module.exports = FleetEcosystemExportService;
