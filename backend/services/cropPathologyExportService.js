/**
 * @file cropPathologyExportService.js
 * @description Digital Phytosanitary Export Passport & Pathology Certificate Service.
 * Generates official verifiable Phytosanitary Health Passports, standalone HTML inspection documents,
 * and high-density batch audit datasets for research institutes (IITA, NIHORT, NCRI, NAQS).
 */

const crypto = require('crypto');

class CropPathologyExportService {
  /**
   * Generates a formal Digital Phytosanitary Health Passport
   *
   * @param {Object} pathologyRecord
   * @param {Object} treatmentPlan
   * @returns {Object} Complete passport payload
   */
  static generatePhytosanitaryPassport(pathologyRecord = {}, treatmentPlan = {}) {
    const passportId = `PHYT-NIG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const diagnosisId = pathologyRecord.diagnosisId || 'DX-UNSPECIFIED';
    const crop = pathologyRecord.cropType || 'GENERAL_PRODUCE';
    const state = (pathologyRecord.farmLocation && pathologyRecord.farmLocation.state) || 'KANO';
    const lga = (pathologyRecord.farmLocation && pathologyRecord.farmLocation.lga) || 'General LGA';
    const farmer = pathologyRecord.farmerName || 'Registered Agricultural Cooperative';

    const inference = pathologyRecord.aiInference || {
      diseaseCode: 'NONE_HEALTHY',
      commonDiseaseName: 'Healthy Foliage',
      severityStage: 'STAGE_0_HEALTHY',
      affectedCanopyPercentage: 0,
      triagePriority: 'LOW_WATCHLIST'
    };

    const isClearedForTransit = inference.triagePriority !== 'CRITICAL_QUARANTINE_ERADICATION' &&
                                inference.affectedCanopyPercentage < 65;

    const issueDate = new Date();
    const expiryDate = new Date(issueDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14-day validity

    const passportSealPayload = [
      passportId,
      diagnosisId,
      crop,
      state,
      inference.diseaseCode,
      isClearedForTransit ? 'CLEARED' : 'RESTRICTED',
      issueDate.toISOString()
    ].join('||');

    const cryptographicPassportSeal = crypto.createHash('sha256').update(passportSealPayload).digest('hex');

    return {
      success: true,
      passportId,
      documentTitle: 'Federal Republic of Nigeria — Phytosanitary Produce Transit Passport',
      certifyingAuthority: 'Nigeria Agricultural Quarantine Service (NAQS) in partnership with Agrily OS',
      metadata: {
        diagnosisReferenceId: diagnosisId,
        commodityType: crop,
        farmerProducer: farmer,
        originFarmState: state,
        originLga: lga,
        fieldAcreageHectares: pathologyRecord.fieldAcreageHectares || 1.0,
        issueTimestamp: issueDate.toISOString(),
        validUntilTimestamp: expiryDate.toISOString()
      },
      pathologyAssessment: {
        diagnosedPathogen: inference.commonDiseaseName,
        pathogenTaxonomy: inference.pathogenType || 'FUNGAL',
        foliarCanopyInfectionPct: inference.affectedCanopyPercentage,
        severityStage: inference.severityStage,
        triagePriority: inference.triagePriority
      },
      quarantineClearance: {
        isClearedForInterstateHaulage: isClearedForTransit,
        isClearedForExportInspection: isClearedForTransit && inference.affectedCanopyPercentage < 20,
        transitClearanceCode: isClearedForTransit ? 'TRANSIT-PASS-CLEARED-GREEN' : 'QUARANTINE-HOLD-INTERDICTED-RED',
        applicableWithdrawalDelayDays: (treatmentPlan && treatmentPlan.preHarvestIntervalDays) || 0
      },
      cryptographicPassportSeal,
      qrVerificationUri: `https://verify.agrily.africa/phytosanitary/${passportId}?seal=${cryptographicPassportSeal.substring(0, 16)}`
    };
  }

  /**
   * Generates a self-contained, print-ready HTML inspection certificate
   *
   * @param {Object} passport
   * @returns {string} Raw HTML string
   */
  static generatePrintableHtmlCertificate(passport) {
    const isCleared = passport.quarantineClearance.isClearedForInterstateHaulage;
    const clearanceBadgeColor = isCleared ? '#1b4332' : '#991b1b';
    const clearanceBgColor = isCleared ? '#d8f3dc' : '#fef2f2';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${passport.passportId} — Phytosanitary Health Passport</title>
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 30px; background: #f8faf9; color: #0f172a; }
    .passport-container { max-width: 800px; margin: 0 auto; background: #ffffff; border: 2px solid #2d6a4f; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 25px; }
    .national-crest { font-size: 40px; margin-bottom: 8px; }
    .title { font-size: 20px; font-weight: 800; color: #1b4332; text-transform: uppercase; margin: 0; }
    .subtitle { font-size: 13px; color: #475569; margin: 5px 0 0 0; }
    .passport-id-badge { display: inline-block; background: #fefae0; color: #7f3b08; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 12px; margin-top: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
    .info-card { background: #f8faf9; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
    .info-card h4 { margin: 0 0 10px 0; color: #2d6a4f; font-size: 14px; text-transform: uppercase; }
    .info-item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
    .info-item span:first-child { color: #64748b; }
    .info-item span:last-child { font-weight: 600; color: #0f172a; }
    .clearance-banner { background: ${clearanceBgColor}; border: 2px solid ${clearanceBadgeColor}; color: ${clearanceBadgeColor}; padding: 16px; border-radius: 8px; text-align: center; font-size: 16px; font-weight: 800; text-transform: uppercase; margin-bottom: 25px; }
    .seal-box { background: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 11px; word-break: break-all; color: #bc6c25; margin-bottom: 20px; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e5e7eb; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="passport-container">
    <div class="header">
      <div class="national-crest">🇳🇬</div>
      <h1 class="title">${passport.documentTitle}</h1>
      <p class="subtitle">${passport.certifyingAuthority}</p>
      <div class="passport-id-badge">PASSPORT SERIAL: ${passport.passportId}</div>
    </div>

    <div class="clearance-banner">
      ${passport.quarantineClearance.transitClearanceCode.replace(/-/g, ' ')}
    </div>

    <div class="grid">
      <div class="info-card">
        <h4>Consignment Origin & Producer</h4>
        <div class="info-item"><span>Producer:</span><span>${passport.metadata.farmerProducer}</span></div>
        <div class="info-item"><span>Commodity:</span><span>${passport.metadata.commodityType}</span></div>
        <div class="info-item"><span>Origin State:</span><span>${passport.metadata.originFarmState}</span></div>
        <div class="info-item"><span>Origin LGA:</span><span>${passport.metadata.originLga}</span></div>
        <div class="info-item"><span>Field Acreage:</span><span>${passport.metadata.fieldAcreageHectares} Hectares</span></div>
      </div>

      <div class="info-card">
        <h4>Foliar Pathology Staging</h4>
        <div class="info-item"><span>Diagnosed Status:</span><span>${passport.pathologyAssessment.diagnosedPathogen}</span></div>
        <div class="info-item"><span>Pathogen Class:</span><span>${passport.pathologyAssessment.pathogenTaxonomy}</span></div>
        <div class="info-item"><span>Severity Stage:</span><span>${passport.pathologyAssessment.severityStage}</span></div>
        <div class="info-item"><span>Foliar Canopy Loss:</span><span>${passport.pathologyAssessment.foliarCanopyInfectionPct}%</span></div>
        <div class="info-item"><span>Triage Priority:</span><span>${passport.pathologyAssessment.triagePriority}</span></div>
      </div>
    </div>

    <div class="seal-box">
      CRYPTOGRAPHIC SHA-256 DIGITAL PASSPORT SEAL:<br/>
      ${passport.cryptographicPassportSeal}
    </div>

    <div class="footer">
      Issued on: ${passport.metadata.issueTimestamp} | Valid until: ${passport.metadata.validUntilTimestamp}<br/>
      Official verification portal: ${passport.qrVerificationUri}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generates a batch dataset of pathology records in CSV format
   *
   * @param {Array<Object>} records
   * @returns {string} CSV formatted string
   */
  static exportBatchCsv(records = []) {
    const headers = [
      'DiagnosisId',
      'CropType',
      'State',
      'LGA',
      'FarmerName',
      'DiseaseCode',
      'CommonDiseaseName',
      'PathogenType',
      'SeverityStage',
      'CanopyLossPct',
      'TriagePriority',
      'YieldLossPct',
      'FinancialRiskNgn',
      'CryptographicSeal'
    ];

    const rows = records.map(r => {
      const inf = r.aiInference || {};
      const eco = r.economicImpactEstimate || {};
      const loc = r.farmLocation || {};
      return [
        r.diagnosisId || '',
        r.cropType || '',
        loc.state || '',
        loc.lga || '',
        `"${(r.farmerName || '').replace(/"/g, '""')}"`,
        inf.diseaseCode || '',
        `"${(inf.commonDiseaseName || '').replace(/"/g, '""')}"`,
        inf.pathogenType || '',
        inf.severityStage || '',
        inf.affectedCanopyPercentage || 0,
        inf.triagePriority || '',
        eco.projectedYieldLossPct || 0,
        eco.estimatedFinancialLossNgn || 0,
        r.cryptographicSeal || ''
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

module.exports = {
  CropPathologyExportService
};
