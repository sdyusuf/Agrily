const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const multer = require('../middleware/multer-config.js');
const { validateProductInput } = require('../middleware/productValidator.js');
const { validate, productCreateSchema, productUpdateSchema } = require('../middleware/validator');

/**
 * GET /api/products
 * Fetch all available products across marketplace
 */
router.get('/products', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');

  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/product/:id
 * Retrieve single produce listing by ID
 */
router.get('/product/:id', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (err) {
    console.error('Error fetching single product:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/:email
 * Retrieve all produce listings owned by a specific farmer
 */
router.get('/products/:email', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');

  try {
    const email = String(req.params.email).toLowerCase().trim();
    const products = await Product.find({
      $or: [{ ownerEmail: email }, { email: email }]
    }).sort({ createdAt: -1 });

    return res.status(200).json(products);
  } catch (err) {
    console.error('Error fetching farmer products by email:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/product
 * Create new produce listing with validation
 */
router.post('/product', validate(productCreateSchema), validateProductInput, async (req, res) => {
  try {
    const imageURL = req.file
      ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      : req.body.imageURL || '';

    const product = new Product({
      name: req.body.name,
      category: req.body.category || 'other',
      unit: req.body.unit || 'kg',
      quantity: req.body.quantity,
      minOrderQuantity: req.body.minOrderQuantity || 1,
      harvestDate: req.body.harvestDate || null,
      imageURL,
      ownerEmail: String(req.body.ownerEmail).toLowerCase().trim(),
      ownerName: req.body.ownerName || '',
      description: req.body.description || '',
      price: req.body.price,
      isSold: false,
      soldDate: null,
      soldTo: null
    });

    const savedProduct = await product.save();
    return res.status(201).json({
      success: true,
      message: 'Product saved successfully!',
      product: savedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/product/:id
 * Update existing produce details (price, quantity, status, description)
 */
router.put('/product/:id', multer, validate(productUpdateSchema), validateProductInput, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Determine image URL: new file upload takes priority over body string
    let imageURL = existingProduct.imageURL;
    if (req.file) {
      imageURL = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
    } else if (req.body.imageURL !== undefined) {
      imageURL = req.body.imageURL;
    }

    const updateData = {
      name: req.body.name,
      category: req.body.category,
      unit: req.body.unit,
      quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : undefined,
      minOrderQuantity: req.body.minOrderQuantity !== undefined ? Number(req.body.minOrderQuantity) : undefined,
      price: req.body.price !== undefined ? Number(req.body.price) : undefined,
      harvestDate: req.body.harvestDate,
      imageURL,
      ownerEmail: req.body.ownerEmail,
      ownerName: req.body.ownerName,
      description: req.body.description,
      isSold: req.body.isSold !== undefined ? req.body.isSold : undefined,
      soldDate: req.body.soldDate,
      soldTo: req.body.soldTo
    };

    // Strip undefined properties to avoid wiping unpassed fields
    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/product/:id
 * Archive produce listing (soft-delete) or permanently remove from catalog
 * Query param: ?archive=true (default: true for safe archiving)
 */
router.delete('/product/:id', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID format' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const isPermanent = req.query.permanent === 'true' || req.body?.permanent === true;

    if (isPermanent) {
      await Product.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: 'Product permanently deleted successfully!',
        id
      });
    }

    // Soft-delete / Archive by setting isSold flag and recording archive timestamp
    product.isSold = true;
    product.soldDate = new Date().toISOString();
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product archived successfully!',
      product
    });
  } catch (err) {
    console.error('Error archiving/deleting product:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;