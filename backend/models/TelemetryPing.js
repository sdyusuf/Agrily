/**
 * TelemetryPing Mongoose Model
 * Captures high-frequency GPS ping telemetry from dispatch vehicles,
 * breadcrumb coordinate trails, transit speed, heading, and hardware metrics.
 */

const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude] per GeoJSON specification
    required: [true, 'Coordinates [longitude, latitude] are required'],
    validate: {
      validator: function(coords) {
        if (!Array.isArray(coords) || coords.length !== 2) return false;
        const [lng, lat] = coords;
        return (
          typeof lng === 'number' &&
          typeof lat === 'number' &&
          lng >= -180 &&
          lng <= 180 &&
          lat >= -90 &&
          lat <= 90
        );
      },
      message: 'Invalid GeoJSON coordinates: longitude must be between -180 and 180, latitude between -90 and 90'
    }
  }
}, { _id: false });

const TelemetryPingSchema = new mongoose.Schema({
  driverEmail: {
    type: String,
    required: [true, 'Driver email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid driver email address']
  },
  driverName: {
    type: String,
    trim: true,
    default: 'Fleet Operator'
  },
  consignmentOrderId: {
    type: String,
    required: [true, 'Consignment Order ID is required'],
    trim: true,
    index: true
  },
  vehicleRegistration: {
    type: String,
    trim: true,
    uppercase: true,
    default: 'UNKNOWN'
  },
  location: {
    type: PointSchema,
    required: [true, 'Geospatial location is required']
  },
  speedKmh: {
    type: Number,
    required: [true, 'Speed in km/h is required'],
    min: [0, 'Speed cannot be negative'],
    max: [200, 'Speed exceeds plausible commercial transit limits (200 km/h)']
  },
  headingDegrees: {
    type: Number,
    min: [0, 'Heading must be between 0 and 360 degrees'],
    max: [360, 'Heading must be between 0 and 360 degrees'],
    default: 0
  },
  altitudeMeters: {
    type: Number,
    default: 0
  },
  accuracyMeters: {
    type: Number,
    min: [0, 'Accuracy radius must be positive'],
    default: 5
  },
  batteryLevelPct: {
    type: Number,
    min: [0, 'Battery level cannot be less than 0%'],
    max: [100, 'Battery level cannot exceed 100%'],
    default: 100
  },
  isCharging: {
    type: Boolean,
    default: false
  },
  isStationary: {
    type: Boolean,
    default: false
  },
  odometerKm: {
    type: Number,
    min: 0,
    default: 0
  },
  ambientTemperatureC: {
    type: Number,
    default: null
  },
  cargoTemperatureC: {
    type: Number,
    default: null
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

// Indexes for high performance geospatial queries and timeline aggregation
TelemetryPingSchema.index({ location: '2dsphere' });
TelemetryPingSchema.index({ consignmentOrderId: 1, recordedAt: -1 });
TelemetryPingSchema.index({ driverEmail: 1, recordedAt: -1 });

/**
 * Instance method to get clean formatted coordinate object
 */
TelemetryPingSchema.methods.toCoordinates = function() {
  return {
    longitude: this.location.coordinates[0],
    latitude: this.location.coordinates[1],
    speedKmh: this.speedKmh,
    heading: this.headingDegrees,
    recordedAt: this.recordedAt
  };
};

/**
 * Static method to fetch the latest ping for a consignment
 */
TelemetryPingSchema.statics.getLatestForOrder = function(consignmentOrderId) {
  return this.findOne({ consignmentOrderId })
    .sort({ recordedAt: -1 })
    .exec();
};

/**
 * Static method to fetch historical breadcrumbs for route playback
 */
TelemetryPingSchema.statics.getRouteBreadcrumbs = function(consignmentOrderId, limit = 100) {
  return this.find({ consignmentOrderId })
    .sort({ recordedAt: 1 })
    .limit(limit)
    .select('location speedKmh headingDegrees accuracyMeters recordedAt batteryLevelPct cargoTemperatureC')
    .exec();
};

/**
 * Static method to fetch the latest position of all active fleet vehicles
 */
TelemetryPingSchema.statics.getActiveFleetPositions = async function(maxAgeMinutes = 60) {
  const threshold = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  
  return this.aggregate([
    { $match: { recordedAt: { $gte: threshold } } },
    { $sort: { recordedAt: -1 } },
    {
      $group: {
        _id: '$driverEmail',
        latestPing: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$latestPing' } }
  ]);
};

const TelemetryPing = mongoose.model('TelemetryPing', TelemetryPingSchema);

module.exports = {
  TelemetryPing
};
