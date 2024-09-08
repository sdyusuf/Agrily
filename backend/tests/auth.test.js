/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - AUTHENTICATION HTTP INTEGRATION TESTS (SUPERTEST)
 * ==============================================================================
 * 
 * Test Suite Description:
 * End-to-end HTTP integration tests for the Agrily Authentication subsystem:
 *  1. POST /api/signup input validation rejection and response headers.
 *  2. POST /api/login credential checks and unauthorized rejections.
 *  3. POST /api/resend-verification validation rules.
 *  4. PUT /verify email token validation.
 *  5. Rate-limiting and Helmet security headers on auth endpoints.
 * 
 * @module tests/auth.test
 * @requires assert
 * @requires supertest
 * @requires ../app
 */

const assert = require('assert');
const request = require('supertest');
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
  console.log('\n🧪 Starting Supertest Authentication HTTP Integration Tests...\n');

  // --------------------------------------------------------------------------
  // TEST 1: POST /api/signup with invalid inputs returns 400
  // --------------------------------------------------------------------------
  await runTest('POST /api/signup should reject missing email and short password with 400', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({ email: 'invalid-email', password: '123' })
      .expect(400);

    assert.strictEqual(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors), 'Response must contain errors array');
    assert.ok(res.body.errors.some((e) => e.toLowerCase().includes('email')));
  });

  // --------------------------------------------------------------------------
  // TEST 2: POST /api/signup rejects empty body with 400
  // --------------------------------------------------------------------------
  await runTest('POST /api/signup should reject empty request body with 400', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({})
      .expect(400);

    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.errors.length > 0);
  });

  // --------------------------------------------------------------------------
  // TEST 3: POST /api/login with invalid email formatting returns 400
  // --------------------------------------------------------------------------
  await runTest('POST /api/login should reject malformed email with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'not-valid-address', password: 'password123' })
      .expect(400);

    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.errors.some((e) => e.toLowerCase().includes('email')));
  });

  // --------------------------------------------------------------------------
  // TEST 4: POST /api/login with missing password returns 400
  // --------------------------------------------------------------------------
  await runTest('POST /api/login should reject missing password with HTTP 400', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'farmer@agrily.com' })
      .expect(400);

    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.errors.some((e) => e.toLowerCase().includes('password')));
  });

  // Wait for MongoDB connection if currently connecting or not ready
  const mongoose = require('mongoose');
  if (mongoose.connection && mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) return resolve();
      mongoose.connection.once('open', resolve);
      setTimeout(resolve, 10000); // timeout fallback
    });
  }

  // --------------------------------------------------------------------------
  // TEST 5: POST /api/login with non-existent user returns 401
  // --------------------------------------------------------------------------
  await runTest('POST /api/login should reject non-existent user with HTTP 401', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'unregistered.ghost.account@agrily.ng',
        password: 'ValidPassword123!'
      });

    assert.strictEqual(res.statusCode, 401, 'Unregistered user must be denied with HTTP 401');
  });

  // --------------------------------------------------------------------------
  // TEST 6: POST /api/resend-verification validation
  // --------------------------------------------------------------------------
  await runTest('POST /api/resend-verification should reject missing email with 400', async () => {
    const res = await request(app)
      .post('/api/resend-verification')
      .send({})
      .expect(400);

    assert.strictEqual(res.body.success, false);
  });

  // --------------------------------------------------------------------------
  // TEST 7: PUT /verify rejects empty verification string with 401
  // --------------------------------------------------------------------------
  await runTest('PUT /verify should reject empty verification string with HTTP 401', async () => {
    const res = await request(app)
      .put('/verify')
      .send({ verificationString: '' })
      .expect(401);

    assert.ok(res.body.message.includes('empty'));
  });

  // --------------------------------------------------------------------------
  // TEST 8: Security & Rate Limit Headers Present on Auth Route
  // --------------------------------------------------------------------------
  await runTest('Auth endpoints emit Helmet security headers and RateLimit metadata', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'test@agrily.com', password: 'test' });

    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['x-frame-options'] !== undefined || res.headers['cross-origin-resource-policy'] !== undefined);
    assert.strictEqual(res.headers['ratelimit-limit'], '100');
  });

  console.log(`\n🎉 Supertest Auth Integration Tests: ${passed} passed, ${failed} failed.\n`);

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
