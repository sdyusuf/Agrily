const mongoose = require('mongoose');

const rasterCellSchema = new mongoose.Schema(
  {
    cellId: { type: String },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    lat: { type: Number },
    lng: { type: Number },
    ndvi: { type: Number, required: true },
    evi: { type: Number, default: 0 },
    savi: { type: Number, default: 0 },
    ndwi: { type: Number, default: 0 },
    scl: { type: Number, default: 4 }, // SCL: 4 = Vegetation
    isMasked: { type: Boolean, default: false },
    chlorophyllScore: { type: Number, default: 0 },
    stressSeverity: {
      type: String,
      enum: ['Severe Stress', 'Moderate Stress', 'Healthy Vegetation', 'Dense Canopy', 'Masked Cloud'],
      default: 'Healthy Vegetation'
    }
  },
  { _id: false }
);

const ndviZonalReadingSchema = new mongoose.Schema(
  {
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FarmParcel',
      required: [true, 'Parcel ID is required'],
      index: true
    },
    passId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SatellitePassRecord',
      required: [true, 'Satellite Pass Record reference is required'],
      index: true
    },
    readingDate: {
      type: Date,
      required: [true, 'Reading date is required'],
      index: true
    },
    meanNdvi: {
      type: Number,
      required: true,
      min: -1,
      max: 1
    },
    minNdvi: { type: Number, min: -1, max: 1 },
    maxNdvi: { type: Number, min: -1, max: 1 },
    stdDevNdvi: { type: Number, default: 0 },
    medianNdvi: { type: Number, default: 0 },

    meanEvi: { type: Number, default: 0 },
    meanSavi: { type: Number, default: 0 },
    meanNdwi: { type: Number, default: 0 },
    meanGndvi: { type: Number, default: 0 },
    meanNdre: { type: Number, default: 0 },

    cloudMaskPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    chlorophyllIndex: {
      type: Number,
      default: 0
    },
    waterStressIndex: {
      type: Number,
      default: 0
    },
    canopyCoverPercentage: {
      type: Number,
      default: 85,
      min: 0,
      max: 100
    },
    vigorDistribution: {
      severeStressHectares: { type: Number, default: 0 },
      moderateStressHectares: { type: Number, default: 0 },
      healthyHectares: { type: Number, default: 0 },
      hyperDenseHectares: { type: Number, default: 0 }
    },
    historicalDeviationZScore: {
      type: Number,
      default: 0
    },
    gridRaster: [rasterCellSchema]
  },
  {
    timestamps: true
  }
);

ndviZonalReadingSchema.index({ parcelId: 1, readingDate: -1 });
ndviZonalReadingSchema.index({ meanNdvi: 1, waterStressIndex: 1 });

module.exports = mongoose.model('NdviZonalReading', ndviZonalReadingSchema);
