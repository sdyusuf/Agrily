const mongoose = require('mongoose');

const farmParcelSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer ID is required'],
      index: true
    },
    parcelName: {
      type: String,
      required: [true, 'Parcel name is required'],
      trim: true,
      maxlength: 120
    },
    parcelCode: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true
    },
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      enum: [
        'Maize',
        'Cassava',
        'Yam',
        'Rice',
        'Sorghum',
        'Millet',
        'Soybean',
        'Groundnut',
        'Cowpea',
        'Sesame',
        'Tomato',
        'Pepper',
        'Onion',
        'Oil Palm',
        'Cocoa',
        'Cashew',
        'Fallow'
      ]
    },
    cropVariety: {
      type: String,
      default: 'Standard Regional Variety',
      trim: true
    },
    plantingDate: {
      type: Date,
      default: Date.now
    },
    expectedHarvestDate: {
      type: Date
    },
    areaHectares: {
      type: Number,
      required: [true, 'Area in hectares is required'],
      min: [0.05, 'Parcel area must be at least 0.05 hectares']
    },
    boundary: {
      type: {
        type: String,
        enum: ['Polygon', 'MultiPolygon'],
        required: true,
        default: 'Polygon'
      },
      coordinates: {
        type: SchemaTypeCoordinates(),
        required: true
      }
    },
    centroid: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    elevationMeters: {
      type: Number,
      default: 0
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
    soilClassification: {
      type: String,
      default: 'Ferric Luvisol'
    },
    irrigationType: {
      type: String,
      enum: ['Rainfed', 'Drip Irrigation', 'Center Pivot', 'Furrow Surface', 'Manual Sprinkler', 'Solar Micro-Sprinkler'],
      default: 'Rainfed'
    },
    topographySlopePercentage: {
      type: Number,
      default: 1.5,
      min: 0,
      max: 60
    },
    previousCropRotation: {
      type: String,
      default: 'Cowpea'
    },
    status: {
      type: String,
      enum: ['Active', 'Fallow', 'Harvested', 'Quarantined', 'Archived'],
      default: 'Active'
    },
    notes: {
      type: String,
      maxlength: 1000
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

function SchemaTypeCoordinates() {
  return mongoose.Schema.Types.Mixed;
}

// 2dsphere index for geospatial GIS boundary queries
farmParcelSchema.index({ boundary: '2dsphere' });
farmParcelSchema.index({ farmerId: 1, status: 1 });
farmParcelSchema.index({ agroEcologicalZone: 1, cropType: 1 });

// Automatically compute centroid if not explicitly supplied
farmParcelSchema.pre('save', function (next) {
  if (this.boundary && this.boundary.coordinates && (!this.centroid || !this.centroid.latitude)) {
    try {
      const ring = this.boundary.type === 'Polygon' 
        ? this.boundary.coordinates[0] 
        : this.boundary.coordinates[0][0];

      if (ring && ring.length > 0) {
        let sumLng = 0;
        let sumLat = 0;
        const count = ring.length;
        for (let i = 0; i < count; i++) {
          sumLng += ring[i][0];
          sumLat += ring[i][1];
        }
        this.centroid = {
          longitude: parseFloat((sumLng / count).toFixed(6)),
          latitude: parseFloat((sumLat / count).toFixed(6))
        };
      }
    } catch (e) {
      // Fallback gracefully without breaking save
    }
  }
  if (!this.parcelCode) {
    const prefix = (this.cropType || 'PRC').substring(0, 3).toUpperCase();
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    this.parcelCode = `NG-${prefix}-${randomHex}`;
  }
  next();
});

module.exports = mongoose.model('FarmParcel', farmParcelSchema);
