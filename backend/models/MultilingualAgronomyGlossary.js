/**
 * ==============================================================================
 * 📖 AGRILY SPRINT 24: MULTILINGUAL AGRONOMY GLOSSARY MONGOOSE MODEL
 * ==============================================================================
 *
 * Stores standardized agricultural terms translated across Nigerian languages
 * (Hausa, Yoruba, Igbo, Nigerian Pidgin, Fulfulde) validated by NAERLS & IITA.
 *
 * @module models/MultilingualAgronomyGlossary
 */

const mongoose = require('mongoose');

const LocalizedTermSubSchema = new mongoose.Schema(
  {
    localeCode: {
      type: String,
      enum: ['en-NG', 'ha-NG', 'yo-NG', 'ig-NG', 'pcm-NG', 'ff-NG'],
      required: true,
    },
    indigenousTerm: {
      type: String,
      required: true,
      trim: true,
    },
    phoneticPronunciation: {
      type: String,
      default: '',
    },
    exampleSentenceIndigenous: {
      type: String,
      required: true,
    },
    exampleSentenceEnglish: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const MultilingualAgronomyGlossarySchema = new mongoose.Schema(
  {
    glossaryCode: {
      type: String,
      required: true,
      unique: true,
      match: /^GLS-AGR-\d{4,6}$/,
    },
    canonicalConceptKey: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    domainCategory: {
      type: String,
      enum: [
        'CROP_PATHOLOGY',
        'SOIL_FERTILITY_NPK',
        'ENTOMOLOGY_IPM',
        'IRRIGATION_HYDROLOGY',
        'POST_HARVEST_STORAGE',
        'METEOROLOGY_CLIMATE',
      ],
      required: true,
    },
    scientificDefinition: {
      type: String,
      required: true,
    },
    translations: {
      type: [LocalizedTermSubSchema],
      default: [],
    },
    verifiedByInstitution: {
      type: String,
      default: 'NAERLS Ahmadu Bello University Zaria & IITA Ibadan',
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MultilingualAgronomyGlossary ||
  mongoose.model(
    'MultilingualAgronomyGlossary',
    MultilingualAgronomyGlossarySchema
  );
