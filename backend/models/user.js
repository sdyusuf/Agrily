/**
 * ============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * Core Domain Entity: User & Farm Profile Domain Schema
 * ============================================================================
 * 
 * @module backend/models/User
 * @description
 * Defines the core Mongoose Schema and domain entity specifications for system
 * participants across the Agrily supply network—spanning smallholder farmers,
 * agricultural cooperatives, commercial aggregators, and institutional produce buyers.
 * 
 * Agricultural Context & Verification Philosophy:
 * In sub-Saharan agricultural trade, verified trust and provenance are the primary
 * differentiators that de-risk forward contracts and spot bulk transactions. This
 * model integrates embedded farm metadata, geospatial coordinates, cooperative affiliations,
 * and multi-tiered KYC verification statuses directly into the primary identity record.
 * 
 * Key Domain Invariants:
 * 1. Email identity must remain globally unique across all system actors.
 * 2. Password hashes must never be exposed through public serialization methods.
 * 3. Farmer verification status governs marketplace badge rendering and bulk inquiry access.
 * 4. Trust score dynamically tracks historical fulfillment reliability, on-time deliveries,
 *    and dispute rates (bounded between 0 and 100).
 * 
 * @license Private / Proprietary Agrily Inc.
 */

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

/**
 * Geospatial coordinates sub-schema representing exact or approximate farm boundaries.
 * Utilized for distance calculations, regional aggregation routes, and market hub routing.
 */
const CoordinatesSchema = new mongoose.Schema(
  {
    /** Latitude coordinate in decimal degrees (-90.0 to +90.0) */
    lat: {
      type: Number,
      min: [-90, 'Latitude cannot be less than -90 degrees'],
      max: [90, 'Latitude cannot exceed 90 degrees'],
      default: 0.0
    },
    /** Longitude coordinate in decimal degrees (-180.0 to +180.0) */
    lng: {
      type: Number,
      min: [-180, 'Longitude cannot be less than -180 degrees'],
      max: [180, 'Longitude cannot exceed 180 degrees'],
      default: 0.0
    }
  },
  { _id: false }
);

/**
 * Farm location sub-schema capturing administrative divisions down to Local Government Area (LGA)
 * or municipal ward level to optimize regional logistics consolidation.
 */
const FarmLocationSchema = new mongoose.Schema(
  {
    /** State or Province of agricultural operations (e.g., 'Kaduna', 'Kano', 'Plateau', 'Oyo') */
    state: {
      type: String,
      trim: true,
      default: ''
    },
    /** Local Government Area (LGA) or County representing localized aggregation cluster */
    lga: {
      type: String,
      trim: true,
      default: ''
    },
    /** Physical road description, landmark, or farm gate access note */
    address: {
      type: String,
      trim: true,
      default: ''
    },
    /** Geo-point coordinates */
    coordinates: {
      type: CoordinatesSchema,
      default: () => ({ lat: 0.0, lng: 0.0 })
    }
  },
  { _id: false }
);

/**
 * Verification document record representing uploaded credentials (e.g., CAC certificates,
 * cooperative membership cards, land ownership deeds, or GAP certificates).
 */
const VerificationDocSchema = new mongoose.Schema(
  {
    /** Category of document submitted (e.g., 'National ID', 'Cooperative Certificate', 'Land Title') */
    docType: {
      type: String,
      required: [true, 'Document type is required'],
      trim: true
    },
    /** Secure cloud storage URL or asset path pointing to encrypted document file */
    url: {
      type: String,
      required: [true, 'Document storage reference URL is required'],
      trim: true
    },
    /** Timestamp when document was submitted for compliance verification */
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    /** Review status of the individual credential */
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { _id: true }
);

/**
 * Comprehensive farm profile sub-schema embedded directly inside the user document.
 * This pattern eliminates costly cross-table joins during produce catalog lookups and
 * public marketplace vendor profile renderings.
 */
const FarmProfileSchema = new mongoose.Schema(
  {
    /** Agricultural biography or farm mission statement (max 1000 characters) */
    bio: {
      type: String,
      maxlength: [1000, 'Farm bio cannot exceed 1000 characters'],
      trim: true,
      default: ''
    },
    /** Primary farm operational location and administrative jurisdiction */
    farmLocation: {
      type: FarmLocationSchema,
      default: () => ({ state: '', lga: '', address: '', coordinates: { lat: 0.0, lng: 0.0 } })
    },
    /** Registered agricultural cooperative, union, or grower association affiliation */
    cooperativeName: {
      type: String,
      trim: true,
      default: ''
    },
    /** Primary crop families and produce categories cultivated (e.g., 'Grains', 'Tubers', 'Vegetables') */
    cropSpecialties: {
      type: [String],
      default: []
    },
    /**
     * Producer trust and compliance status across the Agrily platform:
     * - 'unverified': Newly registered user with basic credentials.
     * - 'pending': KYC identity and farm documents submitted, awaiting inspection review.
     * - 'verified': Field-inspected or cooperative-vouched producer with official trust badge.
     * - 'flagged': Temporarily suspended due to order fulfillment breach or dispute inquiry.
     */
    verificationStatus: {
      type: String,
      enum: {
        values: ['unverified', 'pending', 'verified', 'flagged'],
        message: '{VALUE} is not a valid producer verification status'
      },
      default: 'unverified'
    },
    /** Date on which official verified producer status was granted */
    verifiedAt: {
      type: Date,
      default: null
    },
    /** Historical compliance and KYC documentation attachments */
    verificationDocuments: {
      type: [VerificationDocSchema],
      default: []
    },
    /**
     * Algorithmic trust score calculated based on on-time delivery rate, produce freshness
     * ratings, buyer feedback, and order dispute frequency. Scaled from 0 to 100.
     */
    trustScore: {
      type: Number,
      min: [0, 'Trust score cannot be below 0'],
      max: [100, 'Trust score cannot exceed 100'],
      default: 100
    },
    /** Direct commercial dispatch phone number */
    contactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    /** Third-party agricultural certifications held by the producer */
    certifications: {
      type: [String],
      default: []
    },
    /** Cover banner image showcasing farmlands, storage facilities, or harvest operations */
    bannerImage: {
      type: String,
      trim: true,
      default: ''
    },
    /** Producer portrait or cooperative emblem avatar URL */
    avatar: {
      type: String,
      trim: true,
      default: ''
    },
    /** Total farm area under active cultivation in hectares */
    farmSizeHectares: {
      type: Number,
      min: [0, 'Farm size cannot be negative'],
      default: 0
    },
    /** Year when farm operations or farming career commenced */
    yearEstablished: {
      type: Number,
      min: [1900, 'Establishment year must be after 1900'],
      default: 2020
    }
  },
  { _id: false }
);

/**
 * Primary Agrily User Identity Schema.
 * Encapsulates authentication credentials, verification tokens, security hashes,
 * and the rich embedded agricultural farm profile.
 */
const userSchema = new mongoose.Schema(
  {
    /** Legal given name of the account holder */
    firstName: {
      type: String,
      required: [true, 'First name is strictly required'],
      trim: true
    },
    /** Legal family name of the account holder */
    lastName: {
      type: String,
      required: [true, 'Last name is strictly required'],
      trim: true
    },
    /** Primary communication and authentication email address (globally unique) */
    email: {
      type: String,
      required: [true, 'Email address is strictly required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address format']
    },
    /** Bcrypt password hash (10 rounds standard salt) */
    passwordHash: {
      type: String,
      required: [true, 'Password hash is strictly required']
    },
    /** Global email confirmation flag */
    isVerified: {
      type: Boolean,
      default: false
    },
    /** UUID verification token sent via email confirmation pipeline */
    verificationString: {
      type: String,
      required: [true, 'Verification security string is required']
    },
    /** Ephemeral password reset token (cleared upon password reset completion) */
    passwordResetCode: {
      type: String,
      default: ''
    },
    /** User role within the agricultural marketplace ecosystem */
    role: {
      type: String,
      enum: ['farmer', 'buyer', 'aggregator', 'admin'],
      default: 'farmer'
    },
    /** Embedded farm metadata, credentials, trust score, and geolocation */
    farmProfile: {
      type: FarmProfileSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Virtual property calculating the user's full display name.
 */
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

/**
 * Instance Method: Returns a sanitized public profile payload safe for open marketplace
 * consumer display without exposing sensitive cryptographic hashes or internal tokens.
 * 
 * @returns {Object} Public profile record
 */
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    email: this.email,
    role: this.role,
    isVerified: this.isVerified,
    farmProfile: {
      bio: this.farmProfile?.bio || '',
      farmLocation: this.farmProfile?.farmLocation || { state: '', lga: '', address: '', coordinates: { lat: 0, lng: 0 } },
      cooperativeName: this.farmProfile?.cooperativeName || '',
      cropSpecialties: this.farmProfile?.cropSpecialties || [],
      verificationStatus: this.farmProfile?.verificationStatus || 'unverified',
      verifiedAt: this.farmProfile?.verifiedAt || null,
      trustScore: this.farmProfile?.trustScore ?? 100,
      contactPhone: this.farmProfile?.contactPhone || '',
      certifications: this.farmProfile?.certifications || [],
      bannerImage: this.farmProfile?.bannerImage || '',
      avatar: this.farmProfile?.avatar || '',
      farmSizeHectares: this.farmProfile?.farmSizeHectares || 0,
      yearEstablished: this.farmProfile?.yearEstablished || 2020
    },
    createdAt: this.createdAt
  };
};

/**
 * Instance Method: Updates producer verification status and sets timestamp.
 * 
 * @param {('unverified'|'pending'|'verified'|'flagged')} newStatus - New verification status
 * @returns {Promise<User>} Updated user document
 */
userSchema.methods.updateVerificationStatus = function (newStatus) {
  if (!['unverified', 'pending', 'verified', 'flagged'].includes(newStatus)) {
    throw new Error(`Invalid verification status: ${newStatus}`);
  }
  this.farmProfile.verificationStatus = newStatus;
  if (newStatus === 'verified') {
    this.farmProfile.verifiedAt = new Date();
  }
  return this.save();
};

/**
 * Plugin unique validator for friendly constraint error handling on duplicate emails.
 */
userSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' });

module.exports = mongoose.model('User', userSchema);