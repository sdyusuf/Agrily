/**
 * ColdChainReading Mongoose Model
 * Stores time-series environmental telemetry emitted by transit sensor pods.
 */

const mongoose = require('mongoose');

const ColdChainReadingSchema = new mongoose.Schema({
  podId: {
    type: String,
    required: [true, 'Sensor pod identifier is required'],
    trim: true,
    uppercase: true,
    index: true
  },
  consignmentOrderId: {
    type: String,
    required: [true, 'Consignment order ID is required'],
    trim: true,
    index: true
  },
  temperatureC: {
    type: Number,
    required: [true, 'Temperature in Celsius is required'],
    min: [-50, 'Temperature below realistic reefer limits'],
    max: [80, 'Temperature exceeds realistic cargo limits']
  },
  humidityPercent: {
    type: Number,
    required: [true, 'Relative humidity percentage is required'],
    min: [0, 'Humidity cannot be negative'],
    max: [100, 'Humidity cannot exceed 100%']
  },
  ambientLightLux: {
    type: Number,
    min: 0,
    default: 0
  },
  doorContactOpen: {
    type: Boolean,
    default: false
  },
  doorOpenDurationSeconds: {
    type: Number,
    min: 0,
    default: 0
  },
  isBreach: {
    type: Boolean,
    default: false,
    index: true
  },
  breachSeverity: {
    type: String,
    enum: ['none', 'low_warning', 'high_critical'],
    default: 'none'
  },
  breachDetails: {
    type: [String],
    default: []
  },
  batteryPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  recordedAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// High-speed compound index for timeline reconstruction and anomaly queries
ColdChainReadingSchema.index({ consignmentOrderId: 1, recordedAt: -1 });
ColdChainReadingSchema.index({ podId: 1, recordedAt: -1 });
ColdChainReadingSchema.index({ consignmentOrderId: 1, isBreach: 1 });

/**
 * Static query helper to get chronological excursion history
 */
ColdChainReadingSchema.statics.getExcursionTimeline = function(consignmentOrderId) {
  return this.find({
    consignmentOrderId,
    isBreach: true
  })
    .sort({ recordedAt: -1 })
    .select('podId temperatureC humidityPercent breachSeverity breachDetails doorContactOpen recordedAt')
    .exec();
};

/**
 * Static aggregation helper to compute consignment environmental compliance statistics
 */
ColdChainReadingSchema.statics.getConsignmentSummary = async function(consignmentOrderId) {
  const stats = await this.aggregate([
    { $match: { consignmentOrderId } },
    {
      $group: {
        _id: '$consignmentOrderId',
        totalReadings: { $sum: 1 },
        breachCount: { $sum: { $cond: ['$isBreach', 1, 0] } },
        avgTemp: { $avg: '$temperatureC' },
        minTemp: { $min: '$temperatureC' },
        maxTemp: { $max: '$temperatureC' },
        avgHumidity: { $avg: '$humidityPercent' },
        latestReading: { $first: '$$ROOT' }
      }
    }
  ]);

  if (!stats || stats.length === 0) return null;

  const summary = stats[0];
  const complianceRate = summary.totalReadings > 0
    ? (((summary.totalReadings - summary.breachCount) / summary.totalReadings) * 100).toFixed(1)
    : 100;

  return {
    consignmentOrderId,
    totalReadings: summary.totalReadings,
    breachCount: summary.breachCount,
    compliancePercent: parseFloat(complianceRate),
    tempStats: {
      average: parseFloat(summary.avgTemp.toFixed(2)),
      minimum: summary.minTemp,
      maximum: summary.maxTemp
    },
    avgHumidity: parseFloat(summary.avgHumidity.toFixed(1))
  };
};

const ColdChainReading = mongoose.model('ColdChainReading', ColdChainReadingSchema);

module.exports = {
  ColdChainReading
};
