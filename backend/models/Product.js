const mongoose = require('mongoose');

const allowedCategories = [
  'grains',
  'tubers',
  'fruits',
  'vegetables',
  'livestock',
  'poultry',
  'dairy',
  'other'
];

const allowedUnits = [
  'kg',
  'bag',
  'crate',
  'ton',
  'basket',
  'piece',
  'liter'
];

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Produce name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: {
        values: allowedCategories,
        message: '{VALUE} is not a supported produce category'
      },
      default: 'other',
      lowercase: true,
      trim: true
    },
    unit: {
      type: String,
      enum: {
        values: allowedUnits,
        message: '{VALUE} is not a valid measurement unit'
      },
      default: 'kg',
      lowercase: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 1
    },
    minOrderQuantity: {
      type: Number,
      min: [1, 'Minimum order quantity must be at least 1'],
      default: 1
    },
    price: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Price cannot be negative']
    },
    harvestDate: {
      type: Date
    },
    imageURL: {
      type: String,
      default: ''
    },
    ownerEmail: {
      type: String,
      required: [true, 'Owner email is required'],
      lowercase: true,
      trim: true
    },
    ownerName: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isSold: {
      type: Boolean,
      default: false
    },
    soldDate: {
      type: String
    },
    soldTo: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

productSchema.statics.allowedCategories = allowedCategories;
productSchema.statics.allowedUnits = allowedUnits;

module.exports = mongoose.model('Product', productSchema);