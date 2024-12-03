/**
 * ==============================================================================
 * 💬 AGRILY SPRINT 24: MULTILINGUAL AGRONOMY CHAT SESSION MONGOOSE MODEL
 * ==============================================================================
 *
 * Persists conversational agronomy advisory threads across 6 Nigerian locales:
 *   - en-NG (Nigerian English)
 *   - ha-NG (Hausa — Boko / Ajami romanized)
 *   - yo-NG (Yoruba — with tonal & sub-dot diacritics)
 *   - ig-NG (Igbo — Standard Central Igbo)
 *   - pcm-NG (Nigerian Pidgin / Naija)
 *   - ff-NG (Fulfulde / Adamawa-Sokoto Pastoralist)
 *
 * @module models/AgronomyChatSession
 */

const mongoose = require('mongoose');

const ChatTurnSubSchema = new mongoose.Schema(
  {
    turnIndex: {
      type: Number,
      required: true,
      min: 1,
    },
    senderRole: {
      type: String,
      enum: ['FARMER_USER', 'AGRONOMY_AI_ASSISTANT', 'EXTENSION_OFFICER'],
      required: true,
    },
    modality: {
      type: String,
      enum: ['TEXT_MESSAGE', 'VOICE_NOTE_OPUS', 'USSD_SHORTCODE_MENU'],
      default: 'TEXT_MESSAGE',
    },
    localeCode: {
      type: String,
      enum: ['en-NG', 'ha-NG', 'yo-NG', 'ig-NG', 'pcm-NG', 'ff-NG'],
      default: 'ha-NG',
    },
    utteranceText: {
      type: String,
      required: true,
      trim: true,
    },
    englishTranslation: {
      type: String,
      default: '',
    },
    detectedIntent: {
      type: String,
      default: 'GENERAL_AGRONOMY_QUERY',
    },
    intentConfidenceScore: {
      type: Number,
      default: 0.92,
      min: 0.0,
      max: 1.0,
    },
    extractedEntities: {
      cropKey: { type: String, default: null },
      stateName: { type: String, default: null },
      symptomOrPest: { type: String, default: null },
      dosageOrUnit: { type: String, default: null },
    },
    ragCitationBulletinIds: {
      type: [String],
      default: [],
    },
    audioDurationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const FarmerContextSubSchema = new mongoose.Schema(
  {
    stateName: {
      type: String,
      required: true,
      default: 'Kano',
    },
    lgaName: {
      type: String,
      default: 'Kura',
    },
    agroEcologicalZone: {
      type: String,
      enum: [
        'SAHEL_SAVANNA',
        'SUDAN_SAVANNA',
        'NORTHERN_GUINEA_SAVANNA',
        'SOUTHERN_GUINEA_SAVANNA',
        'DERIVED_SAVANNA',
        'HUMID_RAINFOREST',
        'MANGROVE_SWAMP',
      ],
      default: 'SUDAN_SAVANNA',
    },
    primaryCropKey: {
      type: String,
      default: 'MAIZE',
    },
    farmSizeHectares: {
      type: Number,
      default: 2.5,
      min: 0.1,
    },
    offlineCacheSynced: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const AgronomyChatSessionSchema = new mongoose.Schema(
  {
    sessionCode: {
      type: String,
      required: true,
      unique: true,
      match: /^CHAT-AGR-\d{4,6}$/,
    },
    farmerId: {
      type: String,
      required: true,
      default: 'USR-FARMER-1001',
    },
    preferredLocale: {
      type: String,
      enum: ['en-NG', 'ha-NG', 'yo-NG', 'ig-NG', 'pcm-NG', 'ff-NG'],
      required: true,
      default: 'ha-NG',
    },
    channelType: {
      type: String,
      enum: ['PWA_OFFLINE_FIRST', 'WHATSAPP_BRIDGE', 'USSD_2G_GATEWAY', 'IVR_VOICE_HOTLINE'],
      default: 'PWA_OFFLINE_FIRST',
    },
    farmerContext: {
      type: FarmerContextSubSchema,
      default: () => ({}),
    },
    turns: {
      type: [ChatTurnSubSchema],
      default: [],
    },
    escalationStatus: {
      type: String,
      enum: [
        'AI_AUTONOMOUS_RESOLVED',
        'PENDING_EXTENSION_OFFICER_REVIEW',
        'ESCALATED_TO_STATE_ADP_AGENT',
      ],
      default: 'AI_AUTONOMOUS_RESOLVED',
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AgronomyChatSession ||
  mongoose.model('AgronomyChatSession', AgronomyChatSessionSchema);
