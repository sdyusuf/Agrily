/**
 * ==============================================================================
 * 🌾 AGRILY AGROMETEOROLOGICAL TELEMETRY: WEATHER STATION SCHEMA
 * ==============================================================================
 *
 * Represents either a physical IoT Automated Weather Station (AWS) deployed on a
 * farm corridor or a hyperlocal OpenWeatherMap / NiMet virtual synoptic grid node.
 * Supports 2dsphere geospatial indexing, sensor array calibration metadata,
 * power/solar battery diagnostics, and agro-ecological zone classification.
 * ==============================================================================
 */

const mongoose = require('mongoose');

const sensorCalibrationSchema = new mongoose.Schema(
  {
    anemometerHeightMeters: {
      type: Number,
      default: 2.0,
      min: [0.5, 'Anemometer height must be at least 0.5 meters'],
      max: [50.0, 'Anemometer height cannot exceed 50 meters']
    },
    rainGaugeResolutionMm: {
      type: Number,
      default: 0.2,
      min: [0.05, 'Rain gauge resolution must be positive']
    },
    pyranometerCalibrationFactor: {
      type: Number,
      default: 1.0,
      min: [0.5, 'Calibration factor out of bounds'],
      max: [1.5, 'Calibration factor out of bounds']
    },
    soilProbeDepthsCm: {
      type: [Number],
      default: [10, 30, 60]
    },
    lastCalibratedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const weatherStationSchema = new mongoose.Schema(
  {
    stationCode: {
      type: String,
      required: [true, 'Station code is required'],
      trim: true,
      uppercase: true,
      index: true,
      default: function () {
        const prefix = (this.stateRegion || 'NGN').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'NGN';
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `AWS-${prefix}-${rand}`;
      }
    },
    stationName: {
      type: String,
      required: [true, 'Station name is required'],
      trim: true,
      maxlength: 140
    },
    stationType: {
      type: String,
      enum: [
        'Automated Weather Station (AWS)',
        'OpenWeatherMap Virtual Grid Node',
        'NiMet Synoptic Observatory',
        'On-Farm LoRaWAN Micro-Node',
        'Eddy Covariance Flux Tower'
      ],
      default: 'Automated Weather Station (AWS)'
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FarmParcel',
      index: true
    },
    stateRegion: {
      type: String,
      required: [true, 'State or region is required'],
      trim: true
    },
    agroEcologicalZone: {
      type: String,
      enum: [
        'Sahel Savannah',
        'Sudan Savannah',
        'Northern Guinea Savannah',
        'Southern Guinea Savannah',
        'Derived Savannah',
        'Humid Forest',
        'Mid-Altitude Montane',
        'Coastal Mangrove'
      ],
      default: 'Northern Guinea Savannah'
    },
    primaryCropFocus: {
      type: String,
      default: 'Maize',
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'GeoJSON [longitude, latitude] coordinates are required'],
        validate: {
          validator: function (coords) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: 'Coordinates must be valid [longitude, latitude] pairs'
        }
      }
    },
    elevationMeters: {
      type: Number,
      default: 250,
      min: [-50, 'Elevation cannot be below -50m'],
      max: [5500, 'Elevation cannot exceed 5500m']
    },
    wmoSynopticId: {
      type: String,
      trim: true,
      default: '65046'
    },
    openWeatherGridId: {
      type: String,
      trim: true,
      default: 'OWM-NG-GRID'
    },
    calibration: {
      type: sensorCalibrationSchema,
      default: () => ({})
    },
    telemetryIntervalMinutes: {
      type: Number,
      default: 15,
      min: 1,
      max: 1440
    },
    batteryVoltageVolts: {
      type: Number,
      default: 12.8,
      min: 0,
      max: 48
    },
    solarChargingMilliAmps: {
      type: Number,
      default: 420,
      min: 0
    },
    signalStrengthRssiDbm: {
      type: Number,
      default: -72
    },
    operationalStatus: {
      type: String,
      enum: ['Online', 'Degraded', 'Maintenance', 'Offline'],
      default: 'Online'
    },
    lastHeartbeatAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

weatherStationSchema.index({ location: '2dsphere' });

weatherStationSchema.pre('validate', function (next) {
  if (!this.stationCode && this.stateRegion) {
    const prefix = this.stateRegion.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'NGN';
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.stationCode = `AWS-${prefix}-${rand}`;
  }
  next();
});

/**
 * Virtual returning standard { latitude, longitude } object from GeoJSON Point
 */
weatherStationSchema.virtual('coordinatesLatLng').get(function () {
  if (this.location && Array.isArray(this.location.coordinates) && this.location.coordinates.length === 2) {
    return {
      longitude: this.location.coordinates[0],
      latitude: this.location.coordinates[1]
    };
  }
  return { longitude: 0, latitude: 0 };
});

/**
 * Compute standard barometric pressure (kPa) at station elevation per FAO-56 Eq. 7
 */
weatherStationSchema.methods.computeStandardAtmosphericPressureKpa = function () {
  const z = Number(this.elevationMeters || 0);
  const p = 101.3 * Math.pow((293 - 0.0065 * z) / 293, 5.26);
  return Number(p.toFixed(3));
};

/**
 * Evaluate station power and telemetry health status
 */
weatherStationSchema.methods.evaluateHardwareDiagnostics = function () {
  const voltage = Number(this.batteryVoltageVolts || 0);
  const rssi = Number(this.signalStrengthRssiDbm || -95);
  let batteryHealth = 'Optimal';
  if (voltage < 11.4) {
    batteryHealth = 'Critical Low';
  } else if (voltage < 12.0) {
    batteryHealth = 'Low Reserve';
  }

  let linkQuality = 'Strong';
  if (rssi < -105) {
    linkQuality = 'Weak';
  } else if (rssi < -88) {
    linkQuality = 'Moderate';
  }

  return {
    stationCode: this.stationCode,
    operationalStatus: this.operationalStatus,
    batteryVoltageVolts: voltage,
    batteryHealth,
    signalStrengthRssiDbm: rssi,
    linkQuality,
    atmosphericPressureBaselineKpa: this.computeStandardAtmosphericPressureKpa()
  };
};

module.exports = mongoose.models.WeatherStation || mongoose.model('WeatherStation', weatherStationSchema);
