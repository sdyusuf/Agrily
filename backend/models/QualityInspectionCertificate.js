/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: QUALITY INSPECTION CERTIFICATE MODEL
 * ==============================================================================
 * 
 * Formal dockside agricultural quality inspection and grading certificate.
 * Standardizes produce physical quality verification across Nigerian agro-corridors
 * conforming to Standards Organisation of Nigeria (SON) and NAFDAC guidelines.
 * 
 * Verifies:
 *  - Moisture content % (critical for grains and pulses to prevent aflatoxin)
 *  - Defect and post-harvest spoilage rates (bruising, fungal decay, pest damage)
 *  - Core produce pulp temperature and ambient dock conditions
 *  - Standardized commercial grading (Grade A Export, Grade B Wholesale, Grade C Processing)
 * 
 * @module models/QualityInspectionCertificate
 * @author Agrily Agro-Commodity Standards Team
 * ==============================================================================
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const QUALITY_GRADES = [
  'GRADE_A_EXPORT_PREMIUM',     // Prime export-grade; zero rot, optimal maturity
  'GRADE_B_WHOLESALE_STANDARD',  // Standard domestic wholesale; minor surface cosmetic defects
  'GRADE_C_PROCESSING_ONLY',    // Industrial processing grade; partial blemish, strictly sound
  'REJECTED_UNFIT'              // Unfit for human consumption; decay exceeds 8% or mold present
];

const INSPECTION_RECOMMENDATIONS = [
  'ACCEPT_FULL_SETTLEMENT',         // Release 100% of escrow milestones to farmer
  'ACCEPT_WITH_PRO_RATA_DISCOUNT',  // Partial price adjustment negotiated due to minor variance
  'LODGE_TRIBUNAL_DISPUTE',         // Severe deviation; escalate to arbitration tribunal
  'REJECT_AND_RETURN'               // Cargo rejected outright at receiver dock
];

/**
 * Inspection Certificate Schema
 */
const qualityInspectionCertificateSchema = new mongoose.Schema({
  certificateNumber: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
    default: function() {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      return `CERT-${dateStr}-${randomHex}`;
    }
  },
  vaultNumber: {
    type: String,
    required: [true, 'Associated escrow vault number is required'],
    trim: true,
    index: true
  },
  waybillNumber: {
    type: String,
    required: [true, 'Associated digital waybill number is required'],
    trim: true,
    index: true
  },
  orderId: {
    type: String,
    required: [true, 'Associated order identifier is required'],
    trim: true
  },

  // --- COMMODITY SPECIFICATIONS ---
  produceCategory: {
    type: String,
    required: true,
    enum: ['grains', 'tubers', 'fruits', 'vegetables', 'livestock']
  },
  produceName: {
    type: String,
    required: true,
    trim: true
  },
  inspectedQuantityKg: {
    type: Number,
    required: true,
    min: [1, 'Inspected quantity must be positive']
  },
  inspectedCratesBags: {
    type: Number,
    default: 1,
    min: 1
  },

  // --- INSPECTION DOCK LOCATION ---
  inspectionFacility: {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    gpsCoordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },

  // --- INSPECTOR IDENTIFICATION ---
  inspector: {
    name: { type: String, required: true, trim: true },
    inspectorBadgeNumber: { type: String, required: true, trim: true },
    organization: { type: String, default: 'Agrily Verified Inspection Corps (AVIC)' },
    contactPhone: { type: String, required: true, trim: true }
  },

  // --- QUANTITATIVE METRICS ---
  metrics: {
    moistureContentPercentage: {
      type: Number,
      required: true,
      min: [0, 'Moisture percentage cannot be negative'],
      max: [100, 'Moisture percentage cannot exceed 100%']
    },
    foreignMatterPercentage: {
      type: Number,
      required: true,
      min: [0, 'Foreign matter percentage cannot be negative'],
      max: [50, 'Foreign matter percentage cannot exceed 50%']
    },
    spoilageRotPercentage: {
      type: Number,
      required: true,
      min: [0, 'Spoilage percentage cannot be negative'],
      max: [100, 'Spoilage percentage cannot exceed 100%']
    },
    pestInfestationDetected: {
      type: Boolean,
      default: false
    },
    moldMildewDetected: {
      type: Boolean,
      default: false
    },
    dockCoreTemperatureCelsius: {
      type: Number,
      required: true
    },
    dockAmbientTemperatureCelsius: {
      type: Number,
      default: 28.5
    },
    sizeMaturityUniformityScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 8
    }
  },

  // --- CALCULATED EVALUATION & GRADE ---
  overallGrade: {
    type: String,
    enum: QUALITY_GRADES,
    default: function() {
      if (this.evaluateQualityMetrics) this.evaluateQualityMetrics();
      return this.overallGrade || 'GRADE_B_WHOLESALE_STANDARD';
    }
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: function() {
      if (this.evaluateQualityMetrics) this.evaluateQualityMetrics();
      return this.qualityScore || 80;
    }
  },
  recommendation: {
    type: String,
    enum: INSPECTION_RECOMMENDATIONS,
    default: function() {
      if (this.evaluateQualityMetrics) this.evaluateQualityMetrics();
      return this.recommendation || 'ACCEPT_FULL_SETTLEMENT';
    }
  },
  recommendedPriceAdjustmentPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // --- EVIDENCE & ATTACHMENTS ---
  photoEvidence: [{
    photoUrl: { type: String, required: true },
    sampleType: { type: String, enum: ['CORE_PULP', 'SURFACE_DEFECT', 'PACKAGING', 'WEIGH_SCALE', 'MOISTURE_METER'] },
    sha256Hash: { type: String, required: true },
    capturedAt: { type: Date, default: Date.now }
  }],

  // --- DIGITAL SIGNATURES ---
  inspectorDigitalSignature: {
    type: String,
    required: true
  },
  receiverRepresentativeSignature: {
    name: { type: String, required: true },
    title: { type: String, default: 'Receiving Dock Manager' },
    signedAt: { type: Date, default: Date.now }
  },

  // --- AUDIT TRAIL ---
  inspectionTimestamp: {
    type: Date,
    default: Date.now
  },
  certificateIntegrityToken: {
    type: String,
    default: function() {
      return this.generateIntegrityToken ? this.generateIntegrityToken() : null;
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Pre-validation: Auto-assign Certificate Code and compute integrity token
 */
qualityInspectionCertificateSchema.pre('validate', function(next) {
  if (!this.certificateNumber) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.certificateNumber = `CERT-${dateStr}-${randomHex}`;
  }

  // Derive overall grade if not pre-assigned
  if (!this.overallGrade && this.metrics) {
    this.evaluateQualityMetrics();
  }

  // Build tamper-evident cryptographic token
  this.certificateIntegrityToken = this.generateIntegrityToken();

  next();
});

/**
 * Calculate grade and quality score based on standardized agricultural thresholds
 */
qualityInspectionCertificateSchema.methods.evaluateQualityMetrics = function() {
  const m = this.metrics || {};
  const spoilage = m.spoilageRotPercentage || 0;
  const moisture = m.moistureContentPercentage || 0;
  const foreign = m.foreignMatterPercentage || 0;
  const pest = m.pestInfestationDetected || false;
  const mold = m.moldMildewDetected || false;

  let baseScore = 100;
  baseScore -= (spoilage * 5); // Severe penalty for rot
  baseScore -= (foreign * 3);  // Foreign matter penalty
  if (pest) baseScore -= 30;   // Quarantine penalty
  if (mold) baseScore -= 40;   // Aflatoxin / mold hazard penalty

  // Produce category moisture penalties
  if (this.produceCategory === 'grains' && moisture > 13.0) {
    baseScore -= ((moisture - 13.0) * 4); // Grain moisture penalty > 13%
  }

  this.qualityScore = Math.max(0, Math.min(100, Math.round(baseScore)));

  // Classify grade
  if (pest || mold || spoilage > 8.0 || this.qualityScore < 50) {
    this.overallGrade = 'REJECTED_UNFIT';
    this.recommendation = 'LODGE_TRIBUNAL_DISPUTE';
    this.recommendedPriceAdjustmentPercentage = 100;
  } else if (spoilage > 4.5 || this.qualityScore < 70) {
    this.overallGrade = 'GRADE_C_PROCESSING_ONLY';
    this.recommendation = 'ACCEPT_WITH_PRO_RATA_DISCOUNT';
    this.recommendedPriceAdjustmentPercentage = Math.round(spoilage * 1.5);
  } else if (spoilage > 2.0 || this.qualityScore < 85) {
    this.overallGrade = 'GRADE_B_WHOLESALE_STANDARD';
    this.recommendation = 'ACCEPT_FULL_SETTLEMENT';
    this.recommendedPriceAdjustmentPercentage = 0;
  } else {
    this.overallGrade = 'GRADE_A_EXPORT_PREMIUM';
    this.recommendation = 'ACCEPT_FULL_SETTLEMENT';
    this.recommendedPriceAdjustmentPercentage = 0;
  }

  return this;
};

/**
 * Generate HMAC-SHA256 integrity token for the certificate
 */
qualityInspectionCertificateSchema.methods.generateIntegrityToken = function() {
  const payload = [
    this.certificateNumber,
    this.vaultNumber,
    this.waybillNumber,
    this.overallGrade,
    this.qualityScore,
    this.recommendation,
    this.metrics?.spoilageRotPercentage,
    this.metrics?.moistureContentPercentage,
    this.inspector?.badgeNumber || 'INSP-DEF'
  ].join('#');

  return crypto.createHmac('sha256', 'agrily_inspection_seal_secret').update(payload).digest('hex');
};

/**
 * Virtual: Checks if certificate passes minimum statutory acceptance criteria
 */
qualityInspectionCertificateSchema.virtual('isAcceptableForCommerce').get(function() {
  return this.overallGrade !== 'REJECTED_UNFIT' && !this.metrics.moldMildewDetected;
});

const QualityInspectionCertificate = mongoose.model('QualityInspectionCertificate', qualityInspectionCertificateSchema);

module.exports = {
  QualityInspectionCertificate,
  QUALITY_GRADES,
  INSPECTION_RECOMMENDATIONS
};
