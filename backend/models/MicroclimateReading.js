/**
 * ==============================================================================
 * 🌾 AGRILY AGROMETEOROLOGICAL TELEMETRY: MICROCLIMATE READING SCHEMA
 * ==============================================================================
 *
 * Captures sub-hourly/hourly meteorological observations and 7-day synoptic
 * forecast frames including dry-bulb/wet-bulb/dew-point temperatures, soil
 * thermal profiles, Vapor Pressure Deficit (VPD), FAO-56 Reference
 * Evapotranspiration (ET0), Delta-T spray conditions, and leaf wetness duration.
 * ==============================================================================
 */

const mongoose = require('mongoose');

const microclimateReadingSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WeatherStation',
      required: [true, 'Station ID is required'],
      index: true
    },
    stationCode: {
      type: String,
      required: [true, 'Station code is required'],
      trim: true,
      uppercase: true,
      index: true
    },
    observationTimestamp: {
      type: Date,
      required: [true, 'Observation timestamp is required'],
      default: Date.now,
      index: true
    },
    readingType: {
      type: String,
      enum: ['Observed', 'HourlyForecast', 'DailyAggregate', 'SyntheticEnsemble'],
      default: 'Observed'
    },
    airTempCelsius: {
      type: Number,
      required: [true, 'Air temperature is required'],
      min: [-40, 'Air temperature below physical bounds'],
      max: [65, 'Air temperature above physical bounds']
    },
    minTempCelsius: {
      type: Number,
      min: -45,
      max: 65
    },
    maxTempCelsius: {
      type: Number,
      min: -40,
      max: 70
    },
    canopyTempCelsius: {
      type: Number,
      min: -45,
      max: 75
    },
    soilTemp10cmCelsius: {
      type: Number,
      default: 24.5
    },
    soilTemp30cmCelsius: {
      type: Number,
      default: 23.8
    },
    relativeHumidityPct: {
      type: Number,
      required: [true, 'Relative humidity percentage is required'],
      min: [1, 'Relative humidity must be at least 1%'],
      max: [100, 'Relative humidity cannot exceed 100%']
    },
    dewPointCelsius: {
      type: Number,
      default: function () {
        const T = Number(this.airTempCelsius);
        const RH = Number(this.relativeHumidityPct);
        if (!Number.isFinite(T) || !Number.isFinite(RH) || RH <= 0) return 18.0;
        const alpha = (17.27 * T) / (237.3 + T) + Math.log(RH / 100);
        return Number(((237.3 * alpha) / (17.27 - alpha)).toFixed(2));
      }
    },
    wetBulbCelsius: {
      type: Number,
      default: function () {
        const T = Number(this.airTempCelsius);
        const RH = Number(this.relativeHumidityPct);
        if (!Number.isFinite(T) || !Number.isFinite(RH) || RH <= 0) return 20.0;
        const tw =
          T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
          Math.atan(T + RH) -
          Math.atan(RH - 1.676331) +
          0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
          4.686035;
        return Number(tw.toFixed(2));
      }
    },
    deltaTCelsius: {
      type: Number,
      default: function () {
        const T = Number(this.airTempCelsius);
        const tw = Number(this.wetBulbCelsius);
        if (!Number.isFinite(T) || !Number.isFinite(tw)) return 6.0;
        return Number(Math.max(0, T - tw).toFixed(2));
      }
    },
    vaporPressureDeficitKpa: {
      type: Number,
      min: 0,
      default: function () {
        const T = Number(this.airTempCelsius);
        const RH = Number(this.relativeHumidityPct);
        if (!Number.isFinite(T) || !Number.isFinite(RH) || RH <= 0) return 1.2;
        const es = 0.6108 * Math.exp((17.27 * T) / (T + 237.3));
        const ea = es * (RH / 100);
        return Number(Math.max(0, es - ea).toFixed(3));
      }
    },
    atmosphericPressureHpa: {
      type: Number,
      default: 1011.5,
      min: 600,
      max: 1100
    },
    windSpeedKmh: {
      type: Number,
      required: [true, 'Wind speed is required'],
      default: 8.5,
      min: 0,
      max: 250
    },
    windGustKmh: {
      type: Number,
      default: 14.0,
      min: 0,
      max: 320
    },
    windDirectionDegrees: {
      type: Number,
      default: 215,
      min: 0,
      max: 360
    },
    solarIrradianceWm2: {
      type: Number,
      default: 580,
      min: 0,
      max: 1500
    },
    photosyntheticActiveRadiationUmol: {
      type: Number,
      default: 1150,
      min: 0
    },
    cloudCoverPct: {
      type: Number,
      default: 35,
      min: 0,
      max: 100
    },
    precipitationMm: {
      type: Number,
      default: 0,
      min: 0,
      max: 600
    },
    precipitationProbabilityPct: {
      type: Number,
      default: 15,
      min: 0,
      max: 100
    },
    soilMoistureVolumetricPct: {
      type: Number,
      default: 26.5,
      min: 0,
      max: 100
    },
    leafWetnessDurationHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 24
    },
    referenceEvapotranspirationMmDay: {
      type: Number,
      default: 4.2,
      min: 0,
      max: 25
    },
    growingDegreeDaysIncrement: {
      type: Number,
      default: 12.5,
      min: 0
    },
    harmattanDustVisibilityKm: {
      type: Number,
      default: 10.0,
      min: 0.1,
      max: 50
    },
    frostRiskProbabilityPct: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    heatStressSeverity: {
      type: String,
      enum: ['Optimal', 'Mild Thermal Load', 'Moderate Heat Stress', 'Severe Heatwave', 'Critical Pollen Sterility'],
      default: 'Optimal'
    },
    sprayWindowSuitability: {
      type: String,
      enum: ['Optimal Window', 'Caution / Marginal', 'High Drift Risk', 'Rapid Evaporation Risk', 'Inversion Lockout', 'Rain Wash-Off Risk'],
      default: 'Optimal Window'
    }
  },
  {
    timestamps: true
  }
);

microclimateReadingSchema.index({ stationId: 1, observationTimestamp: -1 });

/**
 * Automatically compute thermodynamic derived fields (Dew Point, Wet Bulb, Delta-T, VPD)
 * before validation if omitted by the caller.
 */
microclimateReadingSchema.pre('validate', function (next) {
  const T = Number(this.airTempCelsius);
  const RH = Number(this.relativeHumidityPct);

  if (Number.isFinite(T) && Number.isFinite(RH) && RH > 0) {
    // Saturation vapor pressure es(T) in kPa (Tetens equation)
    const es = 0.6108 * Math.exp((17.27 * T) / (T + 237.3));
    const ea = es * (RH / 100);
    const vpd = Math.max(0, es - ea);

    if (this.vaporPressureDeficitKpa === undefined || this.vaporPressureDeficitKpa === null) {
      this.vaporPressureDeficitKpa = Number(vpd.toFixed(3));
    }

    // Magnus-Tetens Dew Point approximation
    const alpha = (17.27 * T) / (237.3 + T) + Math.log(RH / 100);
    const td = (237.3 * alpha) / (17.27 - alpha);
    if (this.dewPointCelsius === undefined || this.dewPointCelsius === null) {
      this.dewPointCelsius = Number(td.toFixed(2));
    }

    // Stull (2011) empirical Wet-Bulb temperature formula
    const tw =
      T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
      Math.atan(T + RH) -
      Math.atan(RH - 1.676331) +
      0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
      4.686035;

    if (this.wetBulbCelsius === undefined || this.wetBulbCelsius === null) {
      this.wetBulbCelsius = Number(tw.toFixed(2));
    }

    if (this.deltaTCelsius === undefined || this.deltaTCelsius === null) {
      this.deltaTCelsius = Number(Math.max(0, T - this.wetBulbCelsius).toFixed(2));
    }
  }
  next();
});

/**
 * Determine instantaneous crop microclimate stress profile
 */
microclimateReadingSchema.methods.getMicroclimateSummary = function () {
  return {
    stationCode: this.stationCode,
    observationTimestamp: this.observationTimestamp,
    airTempCelsius: this.airTempCelsius,
    relativeHumidityPct: this.relativeHumidityPct,
    dewPointCelsius: this.dewPointCelsius,
    wetBulbCelsius: this.wetBulbCelsius,
    deltaTCelsius: this.deltaTCelsius,
    vaporPressureDeficitKpa: this.vaporPressureDeficitKpa,
    referenceEvapotranspirationMmDay: this.referenceEvapotranspirationMmDay,
    frostRiskProbabilityPct: this.frostRiskProbabilityPct,
    heatStressSeverity: this.heatStressSeverity,
    sprayWindowSuitability: this.sprayWindowSuitability
  };
};

module.exports =
  mongoose.models.MicroclimateReading ||
  mongoose.model('MicroclimateReading', microclimateReadingSchema);
