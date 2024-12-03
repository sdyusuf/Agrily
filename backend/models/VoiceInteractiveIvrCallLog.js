/**
 * ==============================================================================
 * 📞 AGRILY SPRINT 24: VOICE INTERACTIVE IVR & 2G USSD CALL LOG MONGOOSE MODEL
 * ==============================================================================
 *
 * Tracks rural voice hotline calls (Opus/AMR-NB codecs) and *347*24# USSD
 * interactive sessions for smallholder farmers without 4G smartphone data.
 *
 * @module models/VoiceInteractiveIvrCallLog
 */

const mongoose = require('mongoose');

const AudioCodecMetricsSubSchema = new mongoose.Schema(
  {
    codecType: {
      type: String,
      enum: ['OPUS_LOW_BITRATE_12KBPS', 'AMR_NB_8KHZ', 'WAV_PCM_16KHZ'],
      default: 'OPUS_LOW_BITRATE_12KBPS',
    },
    signalToNoiseRatioDb: {
      type: Number,
      default: 18.5,
      min: -5.0,
      max: 55.0,
    },
    asrWordErrorRateEst: {
      type: Number,
      default: function () {
        return this.signalToNoiseRatioDb < 10 ? 0.24 : 0.08;
      },
    },
    ttsSynthesizerEngine: {
      type: String,
      default: 'VITS_NG_INDIGENOUS_PROSODY_V2',
    },
  },
  { _id: false }
);

const VoiceInteractiveIvrCallLogSchema = new mongoose.Schema(
  {
    callLogCode: {
      type: String,
      required: true,
      unique: true,
      match: /^IVR-LOG-\d{4,6}$/,
    },
    msisdnMasked: {
      type: String,
      required: true,
      default: '+234803***4921',
    },
    selectedLocale: {
      type: String,
      enum: ['en-NG', 'ha-NG', 'yo-NG', 'ig-NG', 'pcm-NG', 'ff-NG'],
      required: true,
      default: 'ha-NG',
    },
    sessionChannel: {
      type: String,
      enum: ['IVR_VOICE_CALL', 'USSD_SHORTCODE_347_24', 'OFFLINE_PWA_VOICE_MEMO'],
      default: 'IVR_VOICE_CALL',
    },
    dtmfKeypressPath: {
      type: String,
      default: '1*2*1',
    },
    callDurationSeconds: {
      type: Number,
      required: true,
      default: 84,
      min: 1,
      max: 3600,
    },
    audioCodecMetrics: {
      type: AudioCodecMetricsSubSchema,
      default: () => ({}),
    },
    resolvedIntent: {
      type: String,
      default: 'NPK_FERTILIZER_DOSING',
    },
    smsSummaryDispatched: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.VoiceInteractiveIvrCallLog ||
  mongoose.model(
    'VoiceInteractiveIvrCallLog',
    VoiceInteractiveIvrCallLogSchema
  );
