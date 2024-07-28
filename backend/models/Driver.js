/**
 * Driver and Logistics Fleet Mongoose Model
 * Manages commercial freight drivers, vehicle capacity specs, operating regions, and duty status
 */

const mongoose = require('mongoose');

const VEHICLE_TYPES = [
  'pickup_truck',
  'box_truck',
  'flatbed',
  'refrigerated_van',
  'cargo_van'
];

const LICENSE_CLASSES = [
  'light_goods',
  'medium_truck',
  'heavy_duty',
  'refrigerated_cargo'
];

const VERIFICATION_STATUSES = [
  'pending',
  'verified',
  'suspended',
  'rejected'
];

// Nested Vehicle Specifications Schema
const VehicleSchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: {
      values: VEHICLE_TYPES,
      message: '{VALUE} is not a recognized vehicle type'
    }
  },
  registrationNumber: {
    type: String,
    required: [true, 'Vehicle registration number is required'],
    trim: true,
    uppercase: true
  },
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Vehicle manufacture year is required'],
    min: [1990, 'Year must be 1990 or newer'],
    max: [2030, 'Year cannot exceed 2030']
  },
  payloadCapacityKg: {
    type: Number,
    required: [true, 'Payload capacity in kg is required'],
    min: [250, 'Minimum payload capacity is 250 kg'],
    max: [60000, 'Maximum payload capacity is 60,000 kg']
  },
  maxVolumeCubicMeters: {
    type: Number,
    default: 10,
    min: [1, 'Volume must be at least 1 m³'],
    max: [150, 'Volume cannot exceed 150 m³']
  },
  hasRefrigeration: {
    type: Boolean,
    default: false
  },
  temperatureRange: {
    min: { type: Number, default: -20 },
    max: { type: Number, default: 15 }
  },
  insurancePolicyNumber: {
    type: String,
    trim: true,
    default: ''
  },
  insuranceExpiry: {
    type: Date
  }
}, { _id: false });

// Driver Profile Schema
const DriverSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: [true, 'Driver user email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  fullName: {
    type: String,
    required: [true, 'Driver full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Contact phone number is required'],
    trim: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'Commercial driver license number is required'],
    trim: true,
    uppercase: true
  },
  licenseClass: {
    type: String,
    required: [true, 'Driver license class is required'],
    enum: {
      values: LICENSE_CLASSES,
      message: '{VALUE} is not a recognized license class'
    }
  },
  licenseExpiry: {
    type: Date,
    required: [true, 'License expiry date is required']
  },
  nationalIdNumber: {
    type: String,
    required: [true, 'National ID number is required'],
    trim: true
  },
  vehicle: {
    type: VehicleSchema,
    required: [true, 'Vehicle specifications are required']
  },
  operatingRegions: {
    type: [String],
    default: ['Lagos State'],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Driver must specify at least one operating region'
    }
  },
  baseLocation: {
    city: { type: String, default: 'Lagos' },
    state: { type: String, default: 'Lagos State' },
    coordinates: {
      lat: { type: Number, min: -90, max: 90, default: 6.5244 },
      lng: { type: Number, min: -180, max: 180, default: 3.3792 }
    }
  },
  verificationStatus: {
    type: String,
    enum: {
      values: VERIFICATION_STATUSES,
      message: '{VALUE} is not a valid verification status'
    },
    default: 'pending'
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  currentConsignmentId: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    default: 5.0,
    min: [0, 'Rating cannot be below 0'],
    max: [5, 'Rating cannot exceed 5.0']
  },
  totalDeliveries: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDistanceKm: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Helper instance method to determine cargo compatibility
DriverSchema.methods.canCarryPayload = function(weightKg, requiresReefer = false) {
  if (requiresReefer && !this.vehicle.hasRefrigeration) {
    return false;
  }
  return this.vehicle.payloadCapacityKg >= weightKg;
};

// Instance method to update duty status safely
DriverSchema.methods.setAvailability = async function(available) {
  if (available && this.verificationStatus !== 'verified') {
    throw new Error('Only verified drivers can be set to active duty');
  }
  this.isAvailable = Boolean(available);
  return this.save();
};

// Static helper to query available drivers by dispatch criteria
DriverSchema.statics.findAvailableFleet = function(region, minPayloadKg = 0, requiresReefer = false) {
  const query = {
    isAvailable: true,
    verificationStatus: 'verified'
  };

  if (region) {
    query.operatingRegions = region;
  }

  if (minPayloadKg > 0) {
    query['vehicle.payloadCapacityKg'] = { $gte: minPayloadKg };
  }

  if (requiresReefer) {
    query['vehicle.hasRefrigeration'] = true;
  }

  return this.find(query).sort({ rating: -1, totalDeliveries: -1 });
};

const Driver = mongoose.model('Driver', DriverSchema);

module.exports = {
  Driver,
  VEHICLE_TYPES,
  LICENSE_CLASSES,
  VERIFICATION_STATUSES
};
