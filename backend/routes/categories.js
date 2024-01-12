const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Comprehensive Agricultural produce taxonomy reference data
const CATEGORY_DEFINITIONS = [
  {
    id: 'grains',
    label: 'Grains & Cereals',
    icon: '🌾',
    description: 'Maize, rice, millet, sorghum, and other cereal grains',
    recommendedUnits: ['bag', 'kg', 'ton']
  },
  {
    id: 'tubers',
    label: 'Tubers & Roots',
    icon: '🥔',
    description: 'Yam, cassava, sweet potatoes, cocoyam, and Irish potatoes',
    recommendedUnits: ['bag', 'ton', 'piece']
  },
  {
    id: 'fruits',
    label: 'Fresh Fruits',
    icon: '🍎',
    description: 'Citrus, mangoes, pineapples, watermelon, bananas, and papaya',
    recommendedUnits: ['crate', 'basket', 'piece', 'kg']
  },
  {
    id: 'vegetables',
    label: 'Vegetables & Greens',
    icon: '🥬',
    description: 'Tomatoes, bell peppers, onions, spinach, and leafy greens',
    recommendedUnits: ['basket', 'crate', 'bag', 'kg']
  },
  {
    id: 'livestock',
    label: 'Livestock',
    icon: '🐄',
    description: 'Cattle, goats, sheep, pigs, and pasture livestock',
    recommendedUnits: ['piece', 'kg']
  },
  {
    id: 'poultry',
    label: 'Poultry & Eggs',
    icon: '🐔',
    description: 'Broilers, layers, cockerels, turkeys, and crates of eggs',
    recommendedUnits: ['crate', 'piece']
  },
  {
    id: 'dairy',
    label: 'Dairy Produce',
    icon: '🥛',
    description: 'Fresh cow milk, artisanal cheeses, butter, and yogurt',
    recommendedUnits: ['liter', 'kg']
  },
  {
    id: 'other',
    label: 'Other Farm Produce',
    icon: '📦',
    description: 'Agro-forestry, raw spices, seeds, honey, and artisanal goods',
    recommendedUnits: ['kg', 'bag', 'liter', 'piece']
  }
];

const UNIT_DEFINITIONS = [
  { id: 'kg', label: 'Kilogram (kg)', type: 'weight' },
  { id: 'bag', label: 'Bag (50kg / 100kg)', type: 'packaging' },
  { id: 'crate', label: 'Crate', type: 'packaging' },
  { id: 'ton', label: 'Metric Ton (1,000kg)', type: 'bulk' },
  { id: 'basket', label: 'Traditional Basket', type: 'packaging' },
  { id: 'piece', label: 'Single Piece / Unit', type: 'count' },
  { id: 'liter', label: 'Liter (L)', type: 'volume' }
];

/**
 * @route   GET /api/categories
 * @desc    Get all supported produce categories
 * @access  Public
 */
router.get('/categories', (req, res) => {
  res.status(200).json({
    success: true,
    count: CATEGORY_DEFINITIONS.length,
    data: CATEGORY_DEFINITIONS
  });
});

/**
 * @route   GET /api/units
 * @desc    Get all supported measurement units
 * @access  Public
 */
router.get('/units', (req, res) => {
  res.status(200).json({
    success: true,
    count: UNIT_DEFINITIONS.length,
    data: UNIT_DEFINITIONS
  });
});

/**
 * @route   GET /api/references
 * @desc    Get combined categories and units for frontend form dropdowns
 * @access  Public
 */
router.get('/references', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      categories: CATEGORY_DEFINITIONS,
      units: UNIT_DEFINITIONS,
      schemaAllowedCategories: Product.allowedCategories,
      schemaAllowedUnits: Product.allowedUnits
    }
  });
});

module.exports = router;
