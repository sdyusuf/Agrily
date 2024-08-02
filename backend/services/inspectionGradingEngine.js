/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: INSPECTION GRADING ENGINE SERVICE
 * ==============================================================================
 * 
 * Expert agricultural commodity inspection, quality grading, and defect
 * scoring service calibrated for Nigerian wholesale agricultural markets.
 * Conforms to SON (Standards Organisation of Nigeria) and CODEX standards.
 * 
 * Supported Commodity Specific Evaluators:
 *  - Grains (Maize, Sorghum, Rice, Cowpea): Moisture %, Foreign Matter %, Aflatoxin Risk
 *  - Vegetables & Perishables (Tomatoes, Peppers, Onions): Rot %, Firmness, Cold Chain Pulp Temp
 *  - Tubers (White Yam, Cassava): Soft rot %, Bruising, Dry Matter Uniformity
 * 
 * @module services/inspectionGradingEngine
 * @author Agrily Agro-Commodity Standards Team
 * ==============================================================================
 */

const crypto = require('crypto');
const { QualityInspectionCertificate, QUALITY_GRADES, INSPECTION_RECOMMENDATIONS } = require('../models/QualityInspectionCertificate');

/**
 * Statutory Quality Standards Presets
 */
const COMMODITY_STANDARDS = {
  grains: {
    maxMoistureOptimal: 12.5,
    maxMoistureAcceptable: 13.5,
    maxMoistureHazardous: 15.0,
    maxForeignMatterPercent: 2.0,
    maxDefectPercent: 3.5,
    idealStorageTempMaxC: 25.0
  },
  vegetables: {
    maxMoistureOptimal: 94.0,
    maxMoistureAcceptable: 95.5,
    maxMoistureHazardous: 98.0,
    maxForeignMatterPercent: 1.5,
    maxDefectPercent: 4.0,
    idealStorageTempMaxC: 10.0 // Cold-chain refrigerated limit
  },
  tubers: {
    maxMoistureOptimal: 65.0,
    maxMoistureAcceptable: 70.0,
    maxMoistureHazardous: 75.0,
    maxForeignMatterPercent: 3.0,
    maxDefectPercent: 5.0,
    idealStorageTempMaxC: 18.0
  },
  fruits: {
    maxMoistureOptimal: 88.0,
    maxMoistureAcceptable: 91.0,
    maxMoistureHazardous: 94.0,
    maxForeignMatterPercent: 1.0,
    maxDefectPercent: 3.0,
    idealStorageTempMaxC: 8.0
  },
  livestock: {
    maxMoistureOptimal: 50.0,
    maxMoistureAcceptable: 55.0,
    maxMoistureHazardous: 60.0,
    maxForeignMatterPercent: 0.5,
    maxDefectPercent: 2.0,
    idealStorageTempMaxC: 4.0
  }
};

class InspectionGradingEngine {
  /**
   * Evaluate produce physical metrics and compute formal grading report
   */
  static evaluateMetrics(produceCategory, metrics = {}) {
    const categoryKey = (produceCategory || 'vegetables').toLowerCase();
    const standards = COMMODITY_STANDARDS[categoryKey] || COMMODITY_STANDARDS.vegetables;

    const moisture = Number(metrics.moistureContentPercentage || 0);
    const foreign = Number(metrics.foreignMatterPercentage || 0);
    const spoilage = Number(metrics.spoilageRotPercentage || 0);
    const pest = Boolean(metrics.pestInfestationDetected);
    const mold = Boolean(metrics.moldMildewDetected);
    const coreTemp = Number(metrics.dockCoreTemperatureCelsius || 25);

    let compositeScore = 100;
    const deductions = [];

    // 1. Spoilage / Decay Deductions (Heaviest Weight)
    if (spoilage > 0) {
      const spoilagePenalty = Number((spoilage * 6.5).toFixed(1));
      compositeScore -= spoilagePenalty;
      deductions.push({ factor: 'SPOILAGE_ROT', deduction: spoilagePenalty, value: `${spoilage}%` });
    }

    // 2. Foreign Matter Deductions
    if (foreign > standards.maxForeignMatterPercent) {
      const foreignExcess = foreign - standards.maxForeignMatterPercent;
      const foreignPenalty = Number((foreignExcess * 4.0).toFixed(1));
      compositeScore -= foreignPenalty;
      deductions.push({ factor: 'FOREIGN_MATTER_EXCESS', deduction: foreignPenalty, value: `${foreign}%` });
    }

    // 3. Moisture Threshold Deviations
    if (categoryKey === 'grains') {
      if (moisture > standards.maxMoistureHazardous) {
        compositeScore -= 35;
        deductions.push({ factor: 'SEVERE_GRAIN_MOISTURE_AFLATOXIN_RISK', deduction: 35, value: `${moisture}%` });
      } else if (moisture > standards.maxMoistureAcceptable) {
        const excess = moisture - standards.maxMoistureAcceptable;
        const moisturePenalty = Number((excess * 6.0).toFixed(1));
        compositeScore -= moisturePenalty;
        deductions.push({ factor: 'ELEVATED_MOISTURE', deduction: moisturePenalty, value: `${moisture}%` });
      }
    }

    // 4. Biological Hazard Penalties
    if (pest) {
      compositeScore -= 40;
      deductions.push({ factor: 'PEST_QUARANTINE_VIOLATION', deduction: 40, value: 'INFESTATION_PRESENT' });
    }

    if (mold) {
      compositeScore -= 50;
      deductions.push({ factor: 'FUNGAL_MOLD_CONTAMINATION', deduction: 50, value: 'MYCOTOXIN_HAZARD' });
    }

    // 5. Cold-Chain Dock Breach Penalty
    if (coreTemp > standards.idealStorageTempMaxC) {
      const tempDelta = coreTemp - standards.idealStorageTempMaxC;
      const tempPenalty = Number(Math.min(25, (tempDelta * 2.5)).toFixed(1));
      compositeScore -= tempPenalty;
      deductions.push({ factor: 'COLD_CHAIN_TEMPERATURE_BREACH', deduction: tempPenalty, value: `${coreTemp}°C` });
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(compositeScore)));

    // Categorize Grade & Commercial Recommendation
    let overallGrade;
    let recommendation;
    let priceAdjustmentPercentage = 0;

    if (pest || mold || spoilage > 8.0 || finalScore < 50) {
      overallGrade = 'REJECTED_UNFIT';
      recommendation = 'LODGE_TRIBUNAL_DISPUTE';
      priceAdjustmentPercentage = 100; // Full escrow lock / refund
    } else if (spoilage > 4.5 || finalScore < 70) {
      overallGrade = 'GRADE_C_PROCESSING_ONLY';
      recommendation = 'ACCEPT_WITH_PRO_RATA_DISCOUNT';
      priceAdjustmentPercentage = Number(Math.min(35, Math.round(spoilage * 1.5 + (foreign * 1.2))).toFixed(1));
    } else if (spoilage > 2.0 || finalScore < 85) {
      overallGrade = 'GRADE_B_WHOLESALE_STANDARD';
      recommendation = 'ACCEPT_FULL_SETTLEMENT';
      priceAdjustmentPercentage = 0;
    } else {
      overallGrade = 'GRADE_A_EXPORT_PREMIUM';
      recommendation = 'ACCEPT_FULL_SETTLEMENT';
      priceAdjustmentPercentage = 0;
    }

    return {
      categoryKey,
      finalScore,
      overallGrade,
      recommendation,
      priceAdjustmentPercentage,
      deductions,
      standards
    };
  }

  /**
   * Create and persist Quality Inspection Certificate
   */
  static async createCertificate(payload) {
    const evaluation = this.evaluateMetrics(payload.produceCategory, payload.metrics);

    const cert = new QualityInspectionCertificate({
      ...payload,
      overallGrade: evaluation.overallGrade,
      qualityScore: evaluation.finalScore,
      recommendation: evaluation.recommendation,
      recommendedPriceAdjustmentPercentage: evaluation.priceAdjustmentPercentage
    });

    await cert.validate();
    return cert;
  }

  /**
   * Verify authenticity of cryptographic certificate token
   */
  static verifyCertificateSignature(certificate) {
    if (!certificate || !certificate.certificateIntegrityToken) {
      return { valid: false, reason: 'Missing cryptographic seal' };
    }

    const expectedToken = certificate.generateIntegrityToken();
    const matches = (expectedToken === certificate.certificateIntegrityToken);

    return {
      valid: matches,
      certificateNumber: certificate.certificateNumber,
      overallGrade: certificate.overallGrade,
      qualityScore: certificate.qualityScore,
      recommendation: certificate.recommendation,
      tampered: !matches
    };
  }
}

module.exports = {
  InspectionGradingEngine,
  COMMODITY_STANDARDS
};
