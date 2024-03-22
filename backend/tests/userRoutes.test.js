/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - USER PROFILE ROUTES & CONTROLLERS TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies profile payload validation, public profile retrieval with data sanitization,
 * farmer profile updates (bio, location coordinates, crops, cooperatives), and Express
 * route mapping.
 * 
 * Verifications Executed:
 *  1. validateProfilePayload() verifies valid payloads and cleans whitespace.
 *  2. validateProfilePayload() rejects bios exceeding 1000 characters.
 *  3. validateProfilePayload() rejects out-of-bound geographic coordinates.
 *  4. validateProfilePayload() rejects negative farm hectare sizes.
 *  5. validateProfilePayload() rejects invalid establishment years.
 *  6. getUserProfileController() returns HTTP 400 when email parameter is missing.
 *  7. getUserProfileController() returns HTTP 404 when user is not found.
 *  8. getUserProfileController() returns HTTP 200 with sanitized profile data.
 *  9. updateUserProfileController() returns HTTP 400 when email is omitted.
 * 10. updateUserProfileController() returns HTTP 400 on payload validation failure.
 * 11. updateUserProfileController() returns HTTP 404 when target user does not exist.
 * 12. updateUserProfileController() updates user document and returns HTTP 200.
 * 13. Router registers GET /api/users/profile/:email and PUT /api/users/profile.
 * 
 * @module tests/userRoutes.test
 * @requires assert
 * @requires ../routes/user
 */

const assert = require('assert');
const userRouter = require('../routes/user');
const {
  validateProfilePayload,
  getUserProfileController,
  updateUserProfileController
} = userRouter;

/**
 * Mock Response Factory for testing Express controllers in isolation.
 * 
 * @returns {Object} Mock Express response object with spy handlers
 */
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    send(data) {
      this.jsonData = data;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      return this;
    },
    header(name, val) {
      this.headers[name] = val;
      return this;
    }
  };
  return res;
}

/**
 * Main execution harness for User Profile Router unit tests.
 * 
 * @async
 * @function runTests
 * @returns {Promise<void>}
 */
async function runTests() {
  console.log('🧪 Starting User Profile Routes & Controllers Unit Tests...\n');
  let passed = 0;
  let total = 0;

  function it(description, fn) {
    total++;
    try {
      const res = fn();
      if (res && typeof res.then === 'function') {
        return res
          .then(() => {
            console.log(`  ✓ ${description}`);
            passed++;
          })
          .catch((err) => {
            console.error(`  ✗ ${description}`);
            console.error(`    Error: ${err.message}`);
            throw err;
          });
      }
      console.log(`  ✓ ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${description}`);
      console.error(`    Error: ${err.message}`);
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: validateProfilePayload Valid Data
  // --------------------------------------------------------------------------
  it('validateProfilePayload should accept valid payload and trim whitespace', () => {
    const raw = {
      bio: '   Specializing in organic sweet potatoes.   ',
      cooperativeName: '  Kano Valley Farmers  ',
      contactPhone: ' +234800000000 ',
      cropSpecialties: [' Sweet Potatoes ', 'Onions'],
      certifications: [' Organic Standard '],
      farmSizeHectares: 12.5,
      yearEstablished: 2018,
      farmLocation: {
        state: 'Kano',
        lga: 'Dawakin Kudu',
        address: 'Plot 4 Agro Hub',
        coordinates: { lat: 11.95, lng: 8.58 }
      }
    };

    const result = validateProfilePayload(raw);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.cleanData.bio, 'Specializing in organic sweet potatoes.');
    assert.strictEqual(result.cleanData.cooperativeName, 'Kano Valley Farmers');
    assert.strictEqual(result.cleanData.contactPhone, '+234800000000');
    assert.deepStrictEqual(result.cleanData.cropSpecialties, ['Sweet Potatoes', 'Onions']);
    assert.strictEqual(result.cleanData.farmSizeHectares, 12.5);
    assert.strictEqual(result.cleanData.yearEstablished, 2018);
  });

  // --------------------------------------------------------------------------
  // TEST 2: validateProfilePayload Bio Limit
  // --------------------------------------------------------------------------
  it('validateProfilePayload should reject bios exceeding 1000 characters', () => {
    const longBio = 'A'.repeat(1001);
    const result = validateProfilePayload({ bio: longBio });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes('cannot exceed 1000 characters')));
  });

  // --------------------------------------------------------------------------
  // TEST 3: validateProfilePayload Coordinates Boundary
  // --------------------------------------------------------------------------
  it('validateProfilePayload should reject out-of-bounds geographic coordinates', () => {
    const invalidCoords = {
      farmLocation: {
        coordinates: { lat: 95.0, lng: -200.0 }
      }
    };
    const result = validateProfilePayload(invalidCoords);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes('Latitude must be between -90 and +90')));
    assert.ok(result.errors.some((e) => e.includes('Longitude must be between -180 and +180')));
  });

  // --------------------------------------------------------------------------
  // TEST 4: validateProfilePayload Farm Size
  // --------------------------------------------------------------------------
  it('validateProfilePayload should reject negative farm hectare sizes', () => {
    const result = validateProfilePayload({ farmSizeHectares: -4 });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes('must be a non-negative number')));
  });

  // --------------------------------------------------------------------------
  // TEST 5: validateProfilePayload Year Established
  // --------------------------------------------------------------------------
  it('validateProfilePayload should reject invalid establishment years', () => {
    const result = validateProfilePayload({ yearEstablished: 1850 });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes('Year established must be between 1900 and')));
  });

  // --------------------------------------------------------------------------
  // TEST 6: getUserProfileController Missing Email
  // --------------------------------------------------------------------------
  await it('getUserProfileController should return HTTP 400 when email parameter is missing', async () => {
    const req = { params: {} };
    const res = createMockRes();

    await getUserProfileController(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.success, false);
    assert.ok(res.jsonData.message.includes('Valid user email parameter is required'));
  });

  // --------------------------------------------------------------------------
  // TEST 7: getUserProfileController User Not Found
  // --------------------------------------------------------------------------
  await it('getUserProfileController should return HTTP 404 when user is not found', async () => {
    const req = { params: { email: 'unknown@farmer.ng' } };
    const res = createMockRes();
    const MockUser = {
      findOne: async () => null
    };

    await getUserProfileController(req, res, MockUser);
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.jsonData.success, false);
  });

  // --------------------------------------------------------------------------
  // TEST 8: getUserProfileController Success Sanitized Profile
  // --------------------------------------------------------------------------
  await it('getUserProfileController should return HTTP 200 with sanitized profile data', async () => {
    const req = { params: { email: 'amina@dan-farms.ng' } };
    const res = createMockRes();
    const mockUserDoc = {
      _id: 'user123',
      firstName: 'Amina',
      lastName: 'Danjuma',
      fullName: 'Amina Danjuma',
      email: 'amina@dan-farms.ng',
      passwordHash: 'confidential_hash',
      getPublicProfile: () => ({
        id: 'user123',
        firstName: 'Amina',
        lastName: 'Danjuma',
        fullName: 'Amina Danjuma',
        email: 'amina@dan-farms.ng',
        farmProfile: {
          bio: 'Heirloom grain producer',
          verificationStatus: 'verified'
        }
      })
    };
    const MockUser = {
      findOne: async () => mockUserDoc
    };

    await getUserProfileController(req, res, MockUser);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.profile.fullName, 'Amina Danjuma');
    assert.strictEqual(res.jsonData.profile.passwordHash, undefined);
  });

  // --------------------------------------------------------------------------
  // TEST 9: updateUserProfileController Missing Target Email
  // --------------------------------------------------------------------------
  await it('updateUserProfileController should return HTTP 400 when email is omitted', async () => {
    const req = { body: {} };
    const res = createMockRes();

    await updateUserProfileController(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.success, false);
  });

  // --------------------------------------------------------------------------
  // TEST 10: updateUserProfileController Validation Failure
  // --------------------------------------------------------------------------
  await it('updateUserProfileController should return HTTP 400 on payload validation failure', async () => {
    const req = {
      body: {
        email: 'farmer@test.ng',
        farmSizeHectares: -10
      }
    };
    const res = createMockRes();

    await updateUserProfileController(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.success, false);
    assert.ok(res.jsonData.errors.length > 0);
  });

  // --------------------------------------------------------------------------
  // TEST 11: updateUserProfileController User Not Found
  // --------------------------------------------------------------------------
  await it('updateUserProfileController should return HTTP 404 when target user does not exist', async () => {
    const req = {
      body: {
        email: 'nonexistent@test.ng',
        bio: 'Valid bio'
      }
    };
    const res = createMockRes();
    const MockUser = {
      findOne: async () => null
    };

    await updateUserProfileController(req, res, MockUser);
    assert.strictEqual(res.statusCode, 404);
  });

  // --------------------------------------------------------------------------
  // TEST 12: updateUserProfileController Success
  // --------------------------------------------------------------------------
  await it('updateUserProfileController should update user document and return HTTP 200', async () => {
    let saved = false;
    const mockUserDoc = {
      email: 'musa@kainji.ng',
      farmProfile: { bio: 'Old bio' },
      save: async () => {
        saved = true;
      },
      getPublicProfile: function () {
        return {
          email: this.email,
          farmProfile: this.farmProfile
        };
      }
    };

    const MockUser = {
      findOne: async () => mockUserDoc
    };

    const req = {
      body: {
        email: 'musa@kainji.ng',
        bio: 'Updated high-yield cassava and yam producer.'
      }
    };
    const res = createMockRes();

    await updateUserProfileController(req, res, MockUser);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(saved, true);
    assert.strictEqual(mockUserDoc.farmProfile.bio, 'Updated high-yield cassava and yam producer.');
  });

  // --------------------------------------------------------------------------
  // TEST 13: Express Router Route Registration
  // --------------------------------------------------------------------------
  it('userRouter should register GET /api/users/profile/:email and PUT /api/users/profile', () => {
    assert.ok(userRouter.stack, 'Router stack should exist');
    const routes = userRouter.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods)
      }));

    const hasGetProfile = routes.some((r) => r.path === '/api/users/profile/:email' && r.methods.includes('get'));
    const hasPutProfile = routes.some((r) => r.path === '/api/users/profile' && r.methods.includes('put'));

    assert.ok(hasGetProfile, 'GET /api/users/profile/:email must be registered');
    assert.ok(hasPutProfile, 'PUT /api/users/profile must be registered');
  });

  console.log(`\n🎉 All ${passed}/${total} User Profile Routes & Controllers tests passed successfully!`);
}

if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal Test Suite Error:', err);
      process.exit(1);
    });
}

module.exports = { runTests };
