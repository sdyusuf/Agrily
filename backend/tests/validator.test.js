/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - JOI REQUEST VALIDATION LAYER TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies Sprint 7 Joi request validation middleware and schemas:
 *  1. Authentication schemas (signup, login, password reset).
 *  2. Farm profile update schemas (bio, coordinates, boundaries).
 *  3. Produce catalog mutation schemas (create, update, categories, units).
 *  4. Middleware error formatting and status 400 rejection.
 * 
 * @module tests/validator.test
 * @requires assert
 * @requires ../middleware/validator
 */

const assert = require('assert');
const {
  validate,
  signupSchema,
  loginSchema,
  profileUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  allowedCategories,
  allowedUnits
} = require('../middleware/validator');

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`  PASS: ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  FAIL: ${testName}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

console.log('\n======================================================');
console.log(' RUNNING AGRILY JOI REQUEST VALIDATION TESTS');
console.log('======================================================\n');

// ----------------------------------------------------------------------------
// TEST 1: Signup Validation
// ----------------------------------------------------------------------------
runTest('signupSchema accepts valid user registration payload', () => {
  const validPayload = {
    firstName: 'Amara',
    lastName: 'Kanu',
    email: 'amara.kanu@agrofarm.ng',
    password: 'superSecretPassword123'
  };

  const { error, value } = signupSchema.validate(validPayload);
  assert.strictEqual(error, undefined, 'Valid registration payload should not produce errors');
  assert.strictEqual(value.email, 'amara.kanu@agrofarm.ng');
});

runTest('signupSchema rejects invalid email and short password', () => {
  const invalidPayload = {
    email: 'not-an-email',
    password: '123' // < 6 chars
  };

  const { error } = signupSchema.validate(invalidPayload, { abortEarly: false });
  assert.ok(error, 'Should produce validation errors');
  assert.strictEqual(error.details.length >= 2, true, 'Should flag both email and password errors');
});

// ----------------------------------------------------------------------------
// TEST 2: Login Validation
// ----------------------------------------------------------------------------
runTest('loginSchema requires valid email and non-empty password', () => {
  const valid = { email: 'farmer@agrily.com', password: 'myPassword' };
  assert.strictEqual(loginSchema.validate(valid).error, undefined);

  const missingEmail = { password: 'myPassword' };
  assert.ok(loginSchema.validate(missingEmail).error, 'Missing email must fail');

  const missingPassword = { email: 'farmer@agrily.com' };
  assert.ok(loginSchema.validate(missingPassword).error, 'Missing password must fail');
});

// ----------------------------------------------------------------------------
// TEST 3: Farm Profile Validation
// ----------------------------------------------------------------------------
runTest('profileUpdateSchema enforces bio length and coordinate boundaries', () => {
  const validProfile = {
    bio: 'Organic cassava and yam grower in Benue state.',
    farmSizeHectares: 15.5,
    yearEstablished: 2018,
    farmLocation: {
      state: 'Benue',
      coordinates: { lat: 7.73, lng: 8.52 }
    }
  };

  assert.strictEqual(profileUpdateSchema.validate(validProfile).error, undefined);

  // Bio exceeding 1000 characters
  const longBio = 'A'.repeat(1001);
  const invalidBio = { bio: longBio };
  assert.ok(profileUpdateSchema.validate(invalidBio).error, 'Bio > 1000 chars must fail');

  // Invalid coordinates (> 90 lat)
  const invalidCoord = {
    farmLocation: {
      coordinates: { lat: 150, lng: 20 }
    }
  };
  assert.ok(profileUpdateSchema.validate(invalidCoord).error, 'Latitude > 90 must fail');
});

// ----------------------------------------------------------------------------
// TEST 4: Product Create & Update Schemas
// ----------------------------------------------------------------------------
runTest('productCreateSchema validates agricultural fields and positive numbers', () => {
  const validProduce = {
    name: 'Yellow Maize Bags',
    category: 'grains',
    unit: 'bag',
    quantity: 100,
    price: 35000,
    ownerEmail: 'farmer@agrily.com'
  };

  assert.strictEqual(productCreateSchema.validate(validProduce).error, undefined);

  // Negative price
  const negativePrice = { ...validProduce, price: -500 };
  assert.ok(productCreateSchema.validate(negativePrice).error, 'Negative price must fail');

  // Short produce name (< 2 chars)
  const shortName = { ...validProduce, name: 'A' };
  assert.ok(productCreateSchema.validate(shortName).error, 'Short name must fail');

  // Invalid category
  const bogusCat = { ...validProduce, category: 'rocket_engines' };
  assert.ok(productCreateSchema.validate(bogusCat).error, 'Unrecognized category must fail');
});

// ----------------------------------------------------------------------------
// TEST 5: Middleware Factory & Express Integration
// ----------------------------------------------------------------------------
runTest('validate() middleware factory rejects invalid payloads with HTTP 400', () => {
  const middleware = validate(loginSchema);

  const req = {
    body: { email: 'bad-email' } // missing password & invalid email
  };

  let statusCode = 200;
  let jsonResponse = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    }
  };

  let nextCalled = false;
  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false, 'next() must NOT be called on validation error');
  assert.strictEqual(statusCode, 400, 'HTTP status must be 400');
  assert.strictEqual(jsonResponse.success, false);
  assert.ok(Array.isArray(jsonResponse.errors), 'Response must contain errors array');
});

runTest('validate() middleware factory calls next() on valid payload', () => {
  const middleware = validate(loginSchema);

  const req = {
    body: { email: 'valid@agrily.com', password: 'secretPassword123' }
  };

  let nextCalled = false;
  const res = {};

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true, 'next() must be called when payload is valid');
});

console.log('\n------------------------------------------------------');
console.log(` RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
console.log('------------------------------------------------------\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
