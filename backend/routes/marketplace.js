const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/**
 * Builds a sanitized MongoDB query object from incoming URL query parameters
 * @param {Object} queryParams - Express req.query
 * @returns {Object} { filter: Object, sort: Object, page: number, limit: number }
 */
function buildMarketplaceQuery(queryParams = {}) {
  const {
    search,
    category,
    unit,
    minPrice,
    maxPrice,
    inStockOnly,
    sortBy,
    page = 1,
    limit = 12
  } = queryParams;

  const filter = {};

  // Default to showing active in-stock listings for public shoppers
  if (inStockOnly === 'true' || inStockOnly === true || inStockOnly === undefined) {
    filter.isSold = false;
    filter.quantity = { $gt: 0 };
  } else if (inStockOnly === 'false' || inStockOnly === false) {
    // Show all, including sold/archived
  }

  // Search keyword (case-insensitive across name and description)
  if (search && typeof search === 'string' && search.trim().length > 0) {
    const cleanSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(cleanSearch, 'i');
    filter.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  // Category filter
  if (category && category !== 'all' && typeof category === 'string') {
    filter.category = category.toLowerCase().trim();
  }

  // Unit filter
  if (unit && unit !== 'all' && typeof unit === 'string') {
    filter.unit = unit.toLowerCase().trim();
  }

  // Price range filters
  const priceFilter = {};
  if (minPrice !== undefined && minPrice !== '' && !isNaN(Number(minPrice))) {
    priceFilter.$gte = Math.max(0, Number(minPrice));
  }
  if (maxPrice !== undefined && maxPrice !== '' && !isNaN(Number(maxPrice))) {
    priceFilter.$lte = Number(maxPrice);
  }
  if (Object.keys(priceFilter).length > 0) {
    filter.price = priceFilter;
  }

  // Sorting
  let sort = { createdAt: -1 }; // default newest first
  if (sortBy === 'price_asc') {
    sort = { price: 1, createdAt: -1 };
  } else if (sortBy === 'price_desc') {
    sort = { price: -1, createdAt: -1 };
  } else if (sortBy === 'quantity_desc') {
    sort = { quantity: -1 };
  } else if (sortBy === 'oldest') {
    sort = { createdAt: 1 };
  } else if (sortBy === 'newest') {
    sort = { createdAt: -1 };
  }

  // Pagination boundaries
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  return { filter, sort, page: parsedPage, limit: parsedLimit };
}

/**
 * GET /api/marketplace
 * Public endpoint to browse, filter, search, and paginate farm produce
 */
router.get('/marketplace', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');

  try {
    const { filter, sort, page, limit } = buildMarketplaceQuery(req.query);

    const skip = (page - 1) * limit;

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalProducts / limit) || 1;

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalProducts,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      filters: {
        search: req.query.search || '',
        category: req.query.category || 'all',
        minPrice: req.query.minPrice || null,
        maxPrice: req.query.maxPrice || null,
        sortBy: req.query.sortBy || 'newest'
      },
      products
    });
  } catch (err) {
    console.error('Error fetching marketplace catalog:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve marketplace catalog.',
      error: err.message
    });
  }
});

/**
 * GET /api/marketplace/metadata
 * Returns aggregate metrics for catalog filters (price ranges, counts per category)
 */
router.get('/marketplace/metadata', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');

  try {
    const [priceStats, categoryCounts, totalActiveListings] = await Promise.all([
      Product.aggregate([
        { $match: { isSold: false, quantity: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
            avgPrice: { $avg: '$price' }
          }
        }
      ]),
      Product.aggregate([
        { $match: { isSold: false, quantity: { $gt: 0 } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Product.countDocuments({ isSold: false, quantity: { $gt: 0 } })
    ]);

    const stats = priceStats[0] || { minPrice: 0, maxPrice: 100000, avgPrice: 0 };
    const categories = {};
    categoryCounts.forEach((c) => {
      categories[c._id] = c.count;
    });

    return res.status(200).json({
      success: true,
      totalActiveListings,
      minPrice: stats.minPrice || 0,
      maxPrice: stats.maxPrice || 100000,
      avgPrice: Math.round(stats.avgPrice || 0),
      categories
    });
  } catch (err) {
    console.error('Error calculating marketplace metadata:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
module.exports.buildMarketplaceQuery = buildMarketplaceQuery;
