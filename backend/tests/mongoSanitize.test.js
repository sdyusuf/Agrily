/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - NOSQL INJECTION SANITIZATION TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies Sprint 7 NoSQL injection mitigation:
 *  1. Stripping prohibited operator keys like "$gt", "$ne", "$where".
 *  2. Stripping dot notations used in path traversing like "user.role".
 *  3. Recursive cleaning of deeply nested objects and arrays.
 *  4. Middleware interception on Express request payloads.
 * 
 * @module tests/mongoSanitize.test
 * @requires assert
 * @requires ../middleware/mongoSanitize
 */

const assert = require('assert');
const { cleanNoSqlOperators, sanitizeMiddleware } = require('../middleware/mongoSanitize');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n🧪 Starting NoSQL Injection Sanitization Unit Tests...\n');

// ----------------------------------------------------------------------------
// TEST 1: Stripping '$' operator keys
// ----------------------------------------------------------------------------
runTest('cleanNoSqlOperators replaces leading $ in injection payloads', () => {
  const malicious = {
    email: { $gt: '' },
    password: { $ne: null }
  };

  const cleaned = cleanNoSqlOperators(malicious);
  assert.strictEqual(cleaned.email.$gt, undefined, '$gt operator must not exist');
  assert.strictEqual(cleaned.email._gt, '', '$gt must be sanitized to _gt');
  assert.strictEqual(cleaned.password.$ne, undefined, '$ne operator must not exist');
  assert.strictEqual(cleaned.password._ne, null, '$ne must be sanitized to _ne');
});

// ----------------------------------------------------------------------------
// TEST 2: Stripping dot notation in keys
// ----------------------------------------------------------------------------
runTest('cleanNoSqlOperators replaces dot notation in prohibited object keys', () => {
  const malicious = {
    'user.role': 'admin',
    'farmProfile.isVerified': true
  };

  const cleaned = cleanNoSqlOperators(malicious);
  assert.strictEqual(cleaned['user.role'], undefined, 'Dot notation key must be stripped');
  assert.strictEqual(cleaned['user_role'], 'admin');
  assert.strictEqual(cleaned['farmProfile_isVerified'], true);
});

// ----------------------------------------------------------------------------
// TEST 3: Recursive nested objects and arrays
// ----------------------------------------------------------------------------
runTest('cleanNoSqlOperators recursively sanitizes nested arrays and sub-documents', () => {
  const nested = {
    filters: [
      { category: 'grains', $or: [{ price: 5000 }] },
      { 'nested.key': 'val' }
    ]
  };

  const cleaned = cleanNoSqlOperators(nested);
  assert.strictEqual(cleaned.filters[0].$or, undefined);
  assert.strictEqual(cleaned.filters[0]._or[0].price, 5000);
  assert.strictEqual(cleaned.filters[1]['nested.key'], undefined);
  assert.strictEqual(cleaned.filters[1]['nested_key'], 'val');
});

// ----------------------------------------------------------------------------
// TEST 4: Middleware Integration
// ----------------------------------------------------------------------------
runTest('sanitizeMiddleware function properly executes and invokes next()', () => {
  const req = {
    body: { email: { $gt: '' } },
    query: { search: 'maize' },
    params: {},
    headers: {}
  };

  const res = {};
  let nextCalled = false;

  sanitizeMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true, 'next() must be called by sanitizeMiddleware');
  assert.strictEqual(req.body.email.$gt, undefined, '$gt must be sanitized out of req.body');
});

console.log(`\n🎉 NoSQL Sanitization Tests: ${passed} passed, ${failed} failed.\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
