const assert = require('assert');
const Product = require('../models/Product');

async function runTests() {
  console.log('🧪 Starting Product Model Unit Tests...\n');
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

  // Test 1: Defaults and minimum required fields
  it('should assign correct default values for minimal valid product', () => {
    const product = new Product({
      name: 'Red Sorghum',
      price: 2500,
      ownerEmail: 'farmer@example.com'
    });

    const err = product.validateSync();
    assert.strictEqual(err, undefined, 'Validation should pass for minimal valid product');
    assert.strictEqual(product.category, 'other');
    assert.strictEqual(product.unit, 'kg');
    assert.strictEqual(product.quantity, 1);
    assert.strictEqual(product.minOrderQuantity, 1);
    assert.strictEqual(product.isSold, false);
    assert.strictEqual(product.imageURL, '');
  });

  // Test 2: Full valid agricultural product
  it('should validate complete produce model with agricultural fields', () => {
    const harvestDate = new Date('2024-01-10');
    const product = new Product({
      name: 'Sweet Potatoes',
      category: 'tubers',
      unit: 'crate',
      quantity: 100,
      minOrderQuantity: 5,
      price: 8500,
      harvestDate: harvestDate,
      ownerEmail: 'farmer@agrily.com',
      ownerName: 'Danladi Farms',
      description: 'Organically grown, freshly harvested orange-fleshed sweet potatoes'
    });

    const err = product.validateSync();
    assert.strictEqual(err, undefined);
    assert.strictEqual(product.name, 'Sweet Potatoes');
    assert.strictEqual(product.category, 'tubers');
    assert.strictEqual(product.unit, 'crate');
    assert.strictEqual(product.quantity, 100);
    assert.strictEqual(product.minOrderQuantity, 5);
    assert.strictEqual(product.price, 8500);
    assert.strictEqual(product.harvestDate.getTime(), harvestDate.getTime());
    assert.strictEqual(product.ownerEmail, 'farmer@agrily.com');
  });

  // Test 3: Required fields enforcement
  it('should fail validation when required fields (name, price, ownerEmail) are missing', () => {
    const product = new Product({});
    const err = product.validateSync();

    assert.ok(err, 'Expected validation error for missing fields');
    assert.ok(err.errors.name, 'Expected error for name');
    assert.strictEqual(err.errors.name.message, 'Produce name is required');
    assert.ok(err.errors.price, 'Expected error for price');
    assert.strictEqual(err.errors.price.message, 'Unit price is required');
    assert.ok(err.errors.ownerEmail, 'Expected error for ownerEmail');
    assert.strictEqual(err.errors.ownerEmail.message, 'Owner email is required');
  });

  // Test 4: Negative price rejection
  it('should reject negative price', () => {
    const product = new Product({
      name: 'Cassava',
      price: -50,
      ownerEmail: 'cassava@example.com'
    });

    const err = product.validateSync();
    assert.ok(err && err.errors.price);
    assert.strictEqual(err.errors.price.message, 'Price cannot be negative');
  });

  // Test 5: Negative quantity rejection
  it('should reject negative quantity', () => {
    const product = new Product({
      name: 'Maize',
      price: 500,
      quantity: -10,
      ownerEmail: 'maize@example.com'
    });

    const err = product.validateSync();
    assert.ok(err && err.errors.quantity);
    assert.strictEqual(err.errors.quantity.message, 'Quantity cannot be negative');
  });

  // Test 6: MinOrderQuantity constraint (< 1 rejection)
  it('should reject minOrderQuantity less than 1', () => {
    const product = new Product({
      name: 'Soybeans',
      price: 1200,
      minOrderQuantity: 0,
      ownerEmail: 'soy@example.com'
    });

    const err = product.validateSync();
    assert.ok(err && err.errors.minOrderQuantity);
    assert.strictEqual(err.errors.minOrderQuantity.message, 'Minimum order quantity must be at least 1');
  });

  // Test 7: Invalid category enum
  it('should reject unsupported categories and accept all supported categories', () => {
    const invalidProduct = new Product({
      name: 'Gadget',
      category: 'electronics',
      price: 1000,
      ownerEmail: 'seller@example.com'
    });

    const err = invalidProduct.validateSync();
    assert.ok(err && err.errors.category);
    assert.ok(err.errors.category.message.includes('not a supported produce category'));

    // Check all allowed categories pass
    for (const cat of Product.allowedCategories) {
      const validProduct = new Product({
        name: `Test ${cat}`,
        category: cat,
        price: 100,
        ownerEmail: 'test@example.com'
      });
      assert.strictEqual(validProduct.validateSync(), undefined, `Category ${cat} should be valid`);
    }
  });

  // Test 8: Invalid unit enum
  it('should reject unsupported units and accept all supported units', () => {
    const invalidProduct = new Product({
      name: 'Palm Oil',
      unit: 'barrels',
      price: 5000,
      ownerEmail: 'oil@example.com'
    });

    const err = invalidProduct.validateSync();
    assert.ok(err && err.errors.unit);
    assert.ok(err.errors.unit.message.includes('not a valid measurement unit'));

    // Check all allowed units pass
    for (const u of Product.allowedUnits) {
      const validProduct = new Product({
        name: `Test ${u}`,
        unit: u,
        price: 100,
        ownerEmail: 'test@example.com'
      });
      assert.strictEqual(validProduct.validateSync(), undefined, `Unit ${u} should be valid`);
    }
  });

  console.log(`\n🎉 All ${passed}/${total} Product Model tests passed successfully!`);
}

runTests();
