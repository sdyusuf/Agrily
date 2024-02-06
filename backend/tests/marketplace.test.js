const assert = require('assert');
const marketplaceRouter = require('../routes/marketplace');
const { buildMarketplaceQuery } = marketplaceRouter;

async function runTests() {
  console.log('🧪 Starting Marketplace Router & Query Builder Unit Tests...\n');
  let passed = 0;
  let total = 0;

  function it(description, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${description}`);
      console.error(`    Error: ${err.message}`);
      throw err;
    }
  }

  // Test 1: Default Query Parameters
  it('should generate default marketplace filter for active in-stock listings', () => {
    const { filter, sort, page, limit } = buildMarketplaceQuery({});

    assert.strictEqual(filter.isSold, false);
    assert.deepStrictEqual(filter.quantity, { $gt: 0 });
    assert.deepStrictEqual(sort, { createdAt: -1 });
    assert.strictEqual(page, 1);
    assert.strictEqual(limit, 12);
  });

  // Test 2: Search keyword matching
  it('should build regex query across name and description for search terms', () => {
    const { filter } = buildMarketplaceQuery({ search: 'Millet' });

    assert.ok(filter.$or, 'Expected $or condition for search');
    assert.strictEqual(filter.$or.length, 2);
    assert.ok(filter.$or[0].name.test('Golden Millet'));
    assert.ok(filter.$or[1].description.test('Clean organic millet grains'));
  });

  // Test 3: Category and Unit filtering
  it('should filter by specific category and measurement unit', () => {
    const { filter } = buildMarketplaceQuery({ category: 'TUBERS', unit: 'CRATE' });

    assert.strictEqual(filter.category, 'tubers');
    assert.strictEqual(filter.unit, 'crate');
  });

  // Test 4: Price range filtering
  it('should filter by minPrice and maxPrice boundaries', () => {
    const { filter } = buildMarketplaceQuery({ minPrice: '2500', maxPrice: '15000' });

    assert.ok(filter.price);
    assert.strictEqual(filter.price.$gte, 2500);
    assert.strictEqual(filter.price.$lte, 15000);
  });

  // Test 5: Sorting modes
  it('should apply correct sort orders for price_asc, price_desc, and quantity_desc', () => {
    const sortAsc = buildMarketplaceQuery({ sortBy: 'price_asc' }).sort;
    assert.strictEqual(sortAsc.price, 1);

    const sortDesc = buildMarketplaceQuery({ sortBy: 'price_desc' }).sort;
    assert.strictEqual(sortDesc.price, -1);

    const sortQty = buildMarketplaceQuery({ sortBy: 'quantity_desc' }).sort;
    assert.strictEqual(sortQty.quantity, -1);
  });

  // Test 6: Pagination bounds and limits
  it('should constrain pagination and clamp limits (max 50, min 1)', () => {
    const { page, limit } = buildMarketplaceQuery({ page: '-5', limit: '100' });

    assert.strictEqual(page, 1, 'Page should be clamped to 1');
    assert.strictEqual(limit, 50, 'Limit should be clamped to 50 max');
  });

  // Test 7: Router export verification
  it('should export valid Express router with buildMarketplaceQuery function', () => {
    assert.strictEqual(typeof marketplaceRouter, 'function');
    assert.strictEqual(typeof marketplaceRouter.buildMarketplaceQuery, 'function');
  });

  console.log(`\n🎉 All ${passed}/${total} Marketplace Router tests passed successfully!`);
}

runTests();
