const Product = require('../models/Product');

/**
 * Middleware validating produce creation and update payloads
 */
const validateProductInput = (req, res, next) => {
  const {
    name,
    price,
    quantity,
    minOrderQuantity,
    category,
    unit,
    harvestDate,
    ownerEmail
  } = req.body;

  const errors = [];

  // Validate Produce Name
  if (req.method === 'POST' || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Produce name is required and must be at least 2 characters long.');
    } else if (name.trim().length > 120) {
      errors.push('Produce name cannot exceed 120 characters.');
    }
  }

  // Validate Price
  if (req.method === 'POST' || price !== undefined) {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      errors.push('Price must be a valid positive number.');
    }
  }

  // Validate Quantity
  if (req.method === 'POST' || quantity !== undefined) {
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity < 0) {
      errors.push('Quantity must be a non-negative number.');
    }
  }

  // Validate Minimum Order Quantity
  if (minOrderQuantity !== undefined && minOrderQuantity !== null && minOrderQuantity !== '') {
    const numMin = Number(minOrderQuantity);
    if (isNaN(numMin) || numMin < 1) {
      errors.push('Minimum order quantity must be at least 1.');
    } else if (quantity !== undefined && Number(quantity) > 0 && numMin > Number(quantity)) {
      errors.push('Minimum order quantity cannot exceed total available quantity.');
    }
  }

  // Validate Category against allowed taxonomy
  if (category !== undefined && category !== null && category !== '') {
    const normalizedCategory = String(category).toLowerCase().trim();
    if (Product.allowedCategories && !Product.allowedCategories.includes(normalizedCategory)) {
      errors.push(
        `Category '${category}' is invalid. Allowed: ${Product.allowedCategories.join(', ')}.`
      );
    }
  }

  // Validate Measurement Unit against allowed units
  if (unit !== undefined && unit !== null && unit !== '') {
    const normalizedUnit = String(unit).toLowerCase().trim();
    if (Product.allowedUnits && !Product.allowedUnits.includes(normalizedUnit)) {
      errors.push(
        `Measurement unit '${unit}' is invalid. Allowed: ${Product.allowedUnits.join(', ')}.`
      );
    }
  }

  // Validate Harvest Date if provided
  if (harvestDate) {
    const parsedDate = new Date(harvestDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Harvest date must be a valid calendar date.');
    }
  }

  // Validate Owner Email on creation
  if (req.method === 'POST') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!ownerEmail || !emailRegex.test(String(ownerEmail).trim())) {
      errors.push('A valid owner email is required.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Product validation failed.',
      errors
    });
  }

  next();
};

module.exports = {
  validateProductInput
};
