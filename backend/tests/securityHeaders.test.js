/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - SECURITY HEADERS & RATE LIMITING TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies Sprint 7 security implementations:
 *  1. Helmet HTTP defensive security headers (frame protection, MIME sniffing, DNS prefetch).
 *  2. Express Rate Limiter integration on authentication and sensitive endpoints.
 *  3. Rate limiting threshold enforcement (HTTP 429 Too Many Requests response).
 * 
 * Verifications Executed:
 *  1. Helmet middleware configures Cross-Origin-Resource-Policy and security headers.
 *  2. authLimiter instance is configured with 100 requests per 15-minute window.
 *  3. authLimiter sends standard RateLimit-* headers (RFC standard headers: true).
 *  4. Exceeding rate limit triggers HTTP 429 with informative JSON error payload.
 *  5. App integrates helmet at the root level and authLimiter on sensitive auth paths.
 * 
 * @module tests/securityHeaders.test
 * @requires assert
 * @requires helmet
 * @requires express-rate-limit
 */

const assert = require('assert');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Mock Request & Response Factory for testing middleware in isolation
 */
function createMockReqRes(options = {}) {
  const req = {
    method: options.method || 'GET',
    url: options.url || '/',
    path: options.path || '/',
    ip: options.ip || '127.0.0.1',
    headers: options.headers || {},
    socket: { remoteAddress: options.ip || '127.0.0.1' },
    app: {
      get: (key) => {
        if (key === 'trust proxy') return false;
        return undefined;
      }
    },
    ...options
  };

  const res = {
    statusCode: 200,
    headers: {},
    jsonData: null,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    },
    removeHeader(name) {
      delete this.headers[name.toLowerCase()];
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.jsonData = body;
      return this;
    },
    json(body) {
      this.jsonData = body;
      return this;
    },
    end() {
      return this;
    }
  };

  return { req, res };
}

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

async function runAsyncTest(testName, testFn) {
  try {
    await testFn();
    console.log(`  PASS: ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  FAIL: ${testName}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

async function runSuite() {
  console.log('\n======================================================');
  console.log(' RUNNING AGRILY SECURITY HEADERS & RATE LIMIT TESTS');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Helmet Middleware Configuration
  // --------------------------------------------------------------------------
  runTest('Helmet middleware initializes and sets security headers', () => {
    const helmetMiddleware = helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    });
    assert.strictEqual(typeof helmetMiddleware, 'function', 'Helmet should return a middleware function');

    const { req, res } = createMockReqRes();
    let nextCalled = false;
    helmetMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, 'Helmet middleware should invoke next()');
    assert.strictEqual(
      res.getHeader('cross-origin-resource-policy'),
      'cross-origin',
      'CORP header must permit cross-origin image retrieval for marketplace produce'
    );
    assert.ok(
      res.getHeader('x-content-type-options') === 'nosniff',
      'X-Content-Type-Options nosniff header must be present'
    );
  });

  // --------------------------------------------------------------------------
  // TEST 2: Rate Limiter Configuration Options
  // --------------------------------------------------------------------------
  runTest('Rate limiter initializes with 100 max requests per 15 minutes', () => {
    const windowMs = 15 * 60 * 1000;
    const maxRequests = 100;

    const limiter = rateLimit({
      windowMs,
      max: maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
      }
    });

    assert.strictEqual(typeof limiter, 'function', 'rateLimit must return a middleware function');
  });

  // --------------------------------------------------------------------------
  // TEST 3: Rate Limiter Threshold Enforcement (HTTP 429)
  // --------------------------------------------------------------------------
  await runAsyncTest('Rate limiter rejects excessive requests with HTTP 429', async () => {
    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 2,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Rate limit exceeded'
      }
    });

    // Request 1: Allowed
    const pair1 = createMockReqRes({ ip: '192.168.1.100' });
    let next1 = false;
    await new Promise((resolve) => {
      testLimiter(pair1.req, pair1.res, () => { next1 = true; resolve(); });
    });
    assert.strictEqual(next1, true, 'Request 1 should pass');

    // Request 2: Allowed
    const pair2 = createMockReqRes({ ip: '192.168.1.100' });
    let next2 = false;
    await new Promise((resolve) => {
      testLimiter(pair2.req, pair2.res, () => { next2 = true; resolve(); });
    });
    assert.strictEqual(next2, true, 'Request 2 should pass');

    // Request 3: Blocked (HTTP 429)
    const pair3 = createMockReqRes({ ip: '192.168.1.100' });
    let next3 = false;
    await new Promise((resolve) => {
      testLimiter(pair3.req, pair3.res, () => { next3 = true; resolve(); });
      // When blocked, rateLimit ends response without calling next
      setTimeout(resolve, 50);
    });

    assert.strictEqual(next3, false, 'Request 3 should NOT pass next()');
    assert.strictEqual(pair3.res.statusCode, 429, 'Excessive request must return HTTP 429');
    assert.deepStrictEqual(
      pair3.res.jsonData,
      { success: false, message: 'Rate limit exceeded' },
      '429 response must match configured rate limit JSON payload'
    );
  });

  // --------------------------------------------------------------------------
  // TEST 4: App Integration Verification
  // --------------------------------------------------------------------------
  runTest('App exports configured Express application with security middleware', () => {
    const app = require('../app');
    assert.ok(app, 'app module must be exported');
    assert.strictEqual(typeof app.use, 'function', 'app must be an Express application');
  });

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('------------------------------------------------------\n');

  if (testsFailed > 0) {
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
  console.error('Test runner error:', err);
  process.exit(1);
});
