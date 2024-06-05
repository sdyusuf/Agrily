/**
 * SensorPod Mongoose Model
 * Manages IoT environmental hardware devices installed in cold-chain reefers,
 * transit containers, and aggregation storage hubs.
 */

const mongoose = require('mongoose');

const PRODUCE_STORAGE_PROFILES = {
  berries: { minTemp: 0.5, maxTemp: 3.0, optimalTemp: 1.5, minHum: 90, maxHum: 95 },
  leafy_greens: { minTemp: 1.0, maxTemp: 4.0, optimalTemp: 2.0, minHum: 95, maxHum: 98 },
  dairy: { minTemp: 1.0, maxTemp: 4.0, optimalTemp: 2.5, minHum: 65, maxHum: 80 },
  tomatoes: { minTemp: 10.0, maxTemp: 14.0, optimalTemp: 12.0, minHum: 85, maxHum: 90 },
  tubers: { minTemp: 12.0, maxTemp: 16.0, optimalTemp: 14.0, minHum: 80, maxHum: 85 },
  grains: { minTemp: 12.0, maxTemp: 22.0, optimalTemp: 18.0, minHum: 45, maxHum: 65 },
  meat_poultry: { minTemp: -2.0, maxTemp: 2.0, optimalTemp: 0.0, minHum: 85, maxHum: 90 },
  general_produce: { minTemp: 2.0, maxTemp: 8.0, optimalTemp: 4.0, minHum: 70, maxHum: 85 }
};

const POD_STATUSES = ['active', 'standby', 'calibrating', 'alert_breach', 'decommissioned'];

const SensorPodSchema = new mongoose.Schema({
  podId: {
    type: String,
    required: [true, 'Sensor pod identifier is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  deviceMac: {
    type: String,
    required: [true, 'Device MAC address is required'],
    trim: true,
    uppercase: true,
    match: [/^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/, 'Invalid MAC address format']
  },
  assignedConsignmentId: {
    type: String,
    required: [true, 'Assigned consignment order ID is required'],
    trim: true,
    index: true
  },
  vehicleRegistration: {
    type: String,
    required: [true, 'Vehicle registration is required'],
    trim: true,
    uppercase: true
  },
  hardwareModel: {
    type: String,
    default: 'Agrily-IoT-ReeferSense-Pro'
  },
  firmwareVersion: {
    type: String,
    default: '2.4.1'
  },
  produceCategory: {
    type: String,
    enum: Object.keys(PRODUCE_STORAGE_PROFILES),
    default: 'general_produce'
  },
  targetTempRange: {
    min: {
      type: Number,
      default: function() {
        const profile = PRODUCE_STORAGE_PROFILES[this.produceCategory] || PRODUCE_STORAGE_PROFILES.general_produce;
        return profile.minTemp;
      }
    },
    max: {
      type: Number,
      default: function() {
        const profile = PRODUCE_STORAGE_PROFILES[this.produceCategory] || PRODUCE_STORAGE_PROFILES.general_produce;
        return profile.maxTemp;
      }
    },
    optimal: {
      type: Number,
      default: function() {
        const profile = PRODUCE_STORAGE_PROFILES[this.produceCategory] || PRODUCE_STORAGE_PROFILES.general_produce;
        return profile.optimalTemp;
      }
    }
  },
  targetHumidityRange: {
    min: {
      type: Number,
      default: function() {
        const profile = PRODUCE_STORAGE_PROFILES[this.produceCategory] || PRODUCE_STORAGE_PROFILES.general_produce;
        return profile.minHum;
      }
    },
    max: {
      type: Number,
      default: function() {
        const profile = PRODUCE_STORAGE_PROFILES[this.produceCategory] || PRODUCE_STORAGE_PROFILES.general_produce;
        return profile.maxHum;
      }
    }
  },
  batteryPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  batteryVoltage: {
    type: Number,
    min: 2.0,
    max: 5.0,
    default: 3.7
  },
  status: {
    type: String,
    enum: POD_STATUSES,
    default: 'active'
  },
  doorAlertThresholdSeconds: {
    type: Number,
    default: 180 // 3 minutes maximum safe open duration during cross-docking
  },
  lastPingAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Pre-validation hook to automatically apply agricultural storage profiles
 */
SensorPodSchema.pre('validate', function(next) {
  if (this.produceCategory && PRODUCE_STORAGE_PROFILES[this.produceCategory]) {
    const profile = PRODUCE_STORAGE_PROFILES[this.produceCategory];
    if (this.targetTempRange?.min === undefined || this.targetTempRange?.max === undefined) {
      this.targetTempRange = {
        min: profile.minTemp,
        max: profile.maxTemp,
        optimal: profile.optimalTemp
      };
    }
    if (this.targetHumidityRange?.min === undefined || this.targetHumidityRange?.max === undefined) {
      this.targetHumidityRange = {
        min: profile.minHum,
        max: profile.maxHum
      };
    }
  }
  next();
});

/**
 * Evaluates whether an environmental reading triggers a cold-chain breach
 */
SensorPodSchema.methods.evaluateReading = function(temperatureC, humidityPercent, doorOpenSeconds = 0) {
  const breaches = [];
  let severity = 'none';

  if (temperatureC > this.targetTempRange.max) {
    const diff = temperatureC - this.targetTempRange.max;
    breaches.push(`High temperature excursion: ${temperatureC}°C exceeds max limit (${this.targetTempRange.max}°C)`);
    severity = diff >= 3.0 ? 'high_critical' : 'low_warning';
  } else if (temperatureC < this.targetTempRange.min) {
    const diff = this.targetTempRange.min - temperatureC;
    breaches.push(`Low temperature excursion: ${temperatureC}°C below freezing/chilling floor (${this.targetTempRange.min}°C)`);
    severity = diff >= 2.0 ? 'high_critical' : 'low_warning';
  }

  if (humidityPercent > this.targetHumidityRange.max) {
    breaches.push(`High humidity breach: ${humidityPercent}% exceeds threshold (${this.targetHumidityRange.max}%)`);
    if (severity === 'none') severity = 'low_warning';
  } else if (humidityPercent < this.targetHumidityRange.min) {
    breaches.push(`Low humidity dehydration risk: ${humidityPercent}% below threshold (${this.targetHumidityRange.min}%)`);
    if (severity === 'none') severity = 'low_warning';
  }

  if (doorOpenSeconds > this.doorAlertThresholdSeconds) {
    breaches.push(`Door open breach: Reefer cargo door open for ${doorOpenSeconds}s (threshold: ${this.doorAlertThresholdSeconds}s)`);
    severity = 'high_critical';
  }

  return {
    isBreach: breaches.length > 0,
    severity,
    breaches
  };
};

const SensorPod = mongoose.model('SensorPod', SensorPodSchema);

module.exports = {
  SensorPod,
  PRODUCE_STORAGE_PROFILES,
  POD_STATUSES
};
