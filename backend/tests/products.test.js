/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - PRODUCTS & CATALOG HTTP INTEGRATION TESTS (SUPERTEST)
 * ==============================================================================
 * 
 * Test Suite Description:
 * End-to-end HTTP integration tests for the Agrily Produce Catalog & Inventory routes:
 *  1. GET /api/categories public taxonomy retrieval.
 *  2. GET /api/references combined category and unit definitions.
 *  3. GET /api/marketplace catalog discovery, pagination metadata, and filters.
 *  4. GET /api/product/:id ID format validation (ObjectId guard with Bearer auth).
 *  5. POST /api/product authentication guard (401 without Bearer token).
 *  6. PUT /api/product/:id authentication guard (401 without Bearer token).
 *  7. DELETE /api/product/:id authentication guard (401 without Bearer token).
 *  8. POST /api/product validation with valid token rejecting invalid payloads.
 * 
 * @module tests/products.test
 * @requires assert
 * @requires supertest
 * @requires jsonwebtoken
 * @requires ../app
 */

const assert = require('assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runSuite() {
  console.log('\n🧪 Starting Supertest Products & Catalog HTTP Integration Tests...\n');

  // Helper to generate test JWT token
  const testSecret = process.env.JWT_SECRET || 'secretKeyFallback';
  const validToken = jwt.sign(
    { id: '60c72b2f9b1d8b2bad5e0123', email: 'farmer.test@agrily.ng' },
    testSecret,
    { expiresIn: '1h' }
  );

  // --------------------------------------------------------------------------
  // TEST 1: GET /api/categories
  // --------------------------------------------------------------------------
  await runTest('GET /api/categories returns HTTP 200 with standard taxonomy arrays', async () => {
    const res = await request(app)
      .get('/api/categories')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data), 'Response data should be an array');
    assert.ok(res.body.data.some((c) => c.id === 'grains'));
  });

  // --------------------------------------------------------------------------
  // TEST 2: GET /api/references
  // --------------------------------------------------------------------------
  await runTest('GET /api/references returns HTTP 200 with categories and units', async () => {
    const res = await request(app)
      .get('/api/references')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.categories));
    assert.ok(Array.isArray(res.body.data.units));
  });

  // Wait for MongoDB connection if currently connecting
  const mongoose = require('mongoose');
  if (mongoose.connection && mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) return resolve();
      mongoose.connection.once('open', resolve);
      setTimeout(resolve, 3000);
    });
  }

  // --------------------------------------------------------------------------
  // TEST 3: GET /api/marketplace
  // --------------------------------------------------------------------------
  await runTest('GET /api/marketplace returns HTTP 200 with produce listings and pagination', async () => {
    const res = await request(app)
      .get('/api/marketplace?category=grains&limit=10')
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.products), 'Products should be an array');
    assert.strictEqual(typeof res.body.page, 'number');
    assert.strictEqual(typeof res.body.totalPages, 'number');
  });

  // --------------------------------------------------------------------------
  // TEST 4: GET /api/product/:id rejects invalid ObjectId format
  // --------------------------------------------------------------------------
  await runTest('GET /api/product/:id rejects invalid ObjectId format with HTTP 400', async () => {
    const res = await request(app)
      .get('/api/product/not-a-valid-mongo-id')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(400);

    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Invalid product ID format'));
  });

  // --------------------------------------------------------------------------
  // TEST 5: POST /api/product requires Bearer token
  // --------------------------------------------------------------------------
  await runTest('POST /api/product without Authorization header returns HTTP 401', async () => {
    const res = await request(app)
      .post('/api/product')
      .send({ name: 'Fresh Tomatoes', price: 15000, quantity: 20 })
      .expect(401);

    assert.ok(res.body.error || res.body.message || res.text);
  });

  // --------------------------------------------------------------------------
  // TEST 6: POST /api/product rejects invalid Bearer token
  // --------------------------------------------------------------------------
  await runTest('POST /api/product with bogus token returns HTTP 401', async () => {
    await request(app)
      .post('/api/product')
      .set('Authorization', 'Bearer invalid.bogus.token')
      .send({ name: 'Fresh Tomatoes', price: 15000, quantity: 20 })
      .expect(401);
  });

  // --------------------------------------------------------------------------
  // TEST 7: PUT /api/product/:id requires Bearer token
  // --------------------------------------------------------------------------
  await runTest('PUT /api/product/:id without Authorization header returns HTTP 401', async () => {
    await request(app)
      .put('/api/product/60c72b2f9b1d8b2bad5e0123')
      .send({ price: 18000 })
      .expect(401);
  });

  // --------------------------------------------------------------------------
  // TEST 8: DELETE /api/product/:id requires Bearer token
  // --------------------------------------------------------------------------
  await runTest('DELETE /api/product/:id without Authorization header returns HTTP 401', async () => {
    await request(app)
      .delete('/api/product/60c72b2f9b1d8b2bad5e0123')
      .expect(401);
  });

  // --------------------------------------------------------------------------
  // TEST 9: POST /api/product with valid token validates Joi schema
  // --------------------------------------------------------------------------
  await runTest('POST /api/product with valid token rejects missing fields with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/product')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        // missing name, price, quantity, ownerEmail
        description: 'Just a description with no required fields'
      })
      .expect(400);

    assert.strictEqual(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors));
  });

  console.log(`\n🎉 Supertest Products Integration Tests: ${passed} passed, ${failed} failed.\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    } catch (_) {}
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
