const mongoose = require('mongoose');

const satellitePassRecordSchema = new mongoose.Schema(
  {
    tileId: {
      type: String,
      required: [true, 'Satellite Tile ID is required'],
      unique: true,
      trim: true,
      index: true
    },
    satelliteSource: {
      type: String,
      enum: ['Sentinel-2A', 'Sentinel-2B', 'Landsat-8', 'Landsat-9', 'PlanetScope Dove', 'MODIS Terra'],
      default: 'Sentinel-2B',
      required: true
    },
    acquisitionDate: {
      type: Date,
      required: [true, 'Acquisition date is required'],
      index: true
    },
    cloudCoveragePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0
    },
    cloudShadowPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    sunZenithAngle: {
      type: Number,
      default: 32.5,
      min: 0,
      max: 90
    },
    sunAzimuthAngle: {
      type: Number,
      default: 118.4,
      min: 0,
      max: 360
    },
    processingLevel: {
      type: String,
      enum: ['L1C_TopAtmosphere', 'L2A_SurfaceReflectance', 'AnalysisReadyData_ARD'],
      default: 'L2A_SurfaceReflectance'
    },
    radiometricCalibrationAccuracy: {
      type: String,
      enum: ['Nominal', 'Sub-optimal', 'Exceeded_Threshold'],
      default: 'Nominal'
    },
    dataQualityStatus: {
      type: String,
      enum: ['Verified', 'Degraded_Cloud', 'Partial_Coverage', 'Sensor_Error', 'Reprocessed'],
      default: 'Verified',
      index: true
    },
    bandReflectanceSummary: {
      b02BlueMean: { type: Number, default: 0.045 },
      b03GreenMean: { type: Number, default: 0.072 },
      b04RedMean: { type: Number, default: 0.088 },
      b05RedEdgeMean: { type: Number, default: 0.185 },
      b08NirMean: { type: Number, default: 0.640 },
      b11SwirMean: { type: Number, default: 0.210 },
      b12SwirMean: { type: Number, default: 0.125 }
    },
    sceneBoundingBox: {
      minLatitude: { type: Number },
      maxLatitude: { type: Number },
      minLongitude: { type: Number },
      maxLongitude: { type: Number }
    },
    rawMetadataPayloadUri: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

satellitePassRecordSchema.index({ satelliteSource: 1, acquisitionDate: -1 });
satellitePassRecordSchema.index({ cloudCoveragePercentage: 1, dataQualityStatus: 1 });

module.exports = mongoose.model('SatellitePassRecord', satellitePassRecordSchema);
