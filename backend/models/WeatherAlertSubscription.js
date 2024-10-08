/**
 * ==============================================================================
 * 🌾 AGRILY AGROMETEOROLOGICAL TELEMETRY: WEATHER ALERT SUBSCRIPTION SCHEMA
 * ==============================================================================
 *
 * Stores farmer-specific hyperlocal hazard threshold triggers (frost, heatwave,
 * convective downpour, dry spell, Harmattan desiccation, and fungal leaf wetness)
 * alongside multi-channel push/SMS/WhatsApp/email dispatch preferences.
 * ==============================================================================
 */

const mongoose = require('mongoose');

const thresholdRuleSchema = new mongoose.Schema(
  {
    frostTemperatureThresholdCelsius: {
      type: Number,
      default: 3.5,
      min: -10,
      max: 12
    },
    heatwaveTemperatureThresholdCelsius: {
      type: Number,
      default: 36.5,
      min: 28,
      max: 55
    },
    maxSprayWindSpeedKmh: {
      type: Number,
      default: 15.0,
      min: 5,
      max: 45
    },
    heavyRainfallThresholdMmHour: {
      type: Number,
      default: 25.0,
      min: 5,
      max: 200
    },
    droughtConsecutiveDryDays: {
      type: Number,
      default: 10,
      min: 3,
      max: 90
    },
    criticalVpdKpa: {
      type: Number,
      default: 2.8,
      min: 1.0,
      max: 6.0
    },
    fungalLeafWetnessHours: {
      type: Number,
      default: 8,
      min: 2,
      max: 24
    }
  },
  { _id: false }
);

const dispatchAuditLogSchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true },
    hazardType: {
      type: String,
      enum: [
        'RADIATIVE_FROST',
        'ADVECTIVE_FREEZE',
        'HEATWAVE_POLLEN_STERILITY',
        'FLASH_FLOOD_WATERLOGGING',
        'DROUGHT_DEFICIT',
        'HARMATTAN_DESICCATION',
        'SPRAY_DRIFT_LOCKOUT',
        'FUNGAL_BLIGHT_WETNESS'
      ],
      required: true
    },
    severity: {
      type: String,
      enum: ['Advisory', 'Watch', 'Warning', 'Critical Emergency'],
      default: 'Warning'
    },
    channelsDispatched: {
      type: [String],
      default: ['Push', 'SMS']
    },
    headline: { type: String, required: true },
    dispatchedAt: { type: Date, default: Date.now },
    acknowledgedByFarmer: { type: Boolean, default: false }
  },
  { _id: false }
);

const weatherAlertSubscriptionSchema = new mongoose.Schema(
  {
    subscriberEmail: {
      type: String,
      required: [true, 'Subscriber email is required'],
      trim: true,
      lowercase: true,
      index: true
    },
    farmerName: {
      type: String,
      default: 'Registered Agrily Producer',
      trim: true
    },
    phoneNumber: {
      type: String,
      default: '+2348030000000',
      trim: true
    },
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WeatherStation',
      index: true
    },
    stationCode: {
      type: String,
      required: [true, 'Station code is required'],
      trim: true,
      uppercase: true
    },
    cropType: {
      type: String,
      default: 'Maize',
      trim: true
    },
    phenologyStage: {
      type: String,
      enum: ['Emergence', 'Vegetative', 'Flowering / Anthesis', 'Grain Fill / Tuber Bulking', 'Maturity / Harvest'],
      default: 'Flowering / Anthesis'
    },
    channels: {
      pushNotification: { type: Boolean, default: true },
      smsGateway: { type: Boolean, default: true },
      whatsappBot: { type: Boolean, default: true },
      emailDigest: { type: Boolean, default: true },
      webhookUrl: { type: String, default: '' }
    },
    preferredLanguage: {
      type: String,
      enum: ['English', 'Hausa', 'Yoruba', 'Igbo', 'Pidgin'],
      default: 'English'
    },
    thresholds: {
      type: thresholdRuleSchema,
      default: () => ({})
    },
    isActive: {
      type: Boolean,
      default: true
    },
    dispatchHistory: {
      type: [dispatchAuditLogSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

/**
 * Return active delivery channels array
 */
weatherAlertSubscriptionSchema.methods.getActiveChannelsList = function () {
  const active = [];
  if (this.channels?.pushNotification) active.push('Push');
  if (this.channels?.smsGateway) active.push('SMS');
  if (this.channels?.whatsappBot) active.push('WhatsApp');
  if (this.channels?.emailDigest) active.push('Email');
  if (this.channels?.webhookUrl) active.push('Webhook');
  return active;
};

/**
 * Append a dispatched alert record and cap history at 50 entries
 */
weatherAlertSubscriptionSchema.methods.recordAlertDispatch = function (alertPayload) {
  const entry = {
    alertId: alertPayload.alertId || `ALT-${Date.now()}`,
    hazardType: alertPayload.hazardType || 'RADIATIVE_FROST',
    severity: alertPayload.severity || 'Warning',
    channelsDispatched: this.getActiveChannelsList(),
    headline: alertPayload.headline || 'Hyperlocal Weather Hazard Alert',
    dispatchedAt: new Date(),
    acknowledgedByFarmer: false
  };
  this.dispatchHistory.unshift(entry);
  if (this.dispatchHistory.length > 50) {
    this.dispatchHistory = this.dispatchHistory.slice(0, 50);
  }
  return entry;
};

module.exports =
  mongoose.models.WeatherAlertSubscription ||
  mongoose.model('WeatherAlertSubscription', weatherAlertSubscriptionSchema);
