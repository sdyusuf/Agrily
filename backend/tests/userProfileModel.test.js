/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - USER & FARM PROFILE DOMAIN MODEL TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies the structural integrity, embedded farm profile schema, geospatial coordinates,
 * verification enum validation, trust score boundaries, virtual full name generation,
 * and public profile security sanitization methods on the User model.
 * 
 * Verifications Executed:
 *  1. Verification of default attributes and farmProfile defaults on minimal valid user.
 *  2. Verification of strict requirement for firstName, lastName, email, passwordHash, and verificationString.
 *  3. Verification and rejection of invalid email formatting.
 *  4. Verification of rich farmProfile attributes (bio, location, cooperatives, specialties, certifications).
 *  5. Enforcement of allowed verificationStatus enums ('unverified', 'pending', 'verified', 'flagged').
 *  6. Enforcement of trust score boundaries (strictly between 0 and 100).
 *  7. Enforcement of geographic coordinate boundaries (lat -90 to +90, lng -180 to +180).
 *  8. Verification of fullName virtual getter.
 *  9. Verification of getPublicProfile() sanitization (strips passwordHash, verificationString, resetCode).
 * 10. Verification of updateVerificationStatus() method and invalid enum rejection.
 * 
 * @module tests/userProfileModel.test
 * @requires assert
 * @requires mongoose
 * @requires ../models/User
 */

const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Main execution harness for User & Farm Profile unit tests.
 * 
 * @async
 * @function runTests
 * @returns {Promise<void>}
 */
async function runTests() {
  console.log('🧪 Starting User Model & Farm Profile Unit Tests...\n');
  let passed = 0;
  let total = 0;

  /**
   * Helper function to execute an assertion block and track success/failure tallies.
   * 
   * @param {string} description - Readable summary of test intent.
   * @param {Function} fn - Assertion function to execute.
   */
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

  // --------------------------------------------------------------------------
  // TEST 1: Minimal Valid User Schema & Default Farm Profile Generation
  // --------------------------------------------------------------------------
  it('should validate a user with complete credentials and generate default farmProfile', () => {
    const user = new User({
      firstName: 'Ibrahim',
      lastName: 'Musa',
      email: 'ibrahim.musa@kainji-farms.ng',
      passwordHash: '$2b$10$e8w.xQ.hashedPasswordSampleToken',
      verificationString: 'uuid-auth-token-12345'
    });

    const err = user.validateSync();
    assert.strictEqual(err, undefined, 'User validation should pass without errors');
    assert.strictEqual(user.firstName, 'Ibrahim');
    assert.strictEqual(user.lastName, 'Musa');
    assert.strictEqual(user.fullName, 'Ibrahim Musa');
    assert.strictEqual(user.email, 'ibrahim.musa@kainji-farms.ng');
    assert.strictEqual(user.role, 'farmer');
    assert.strictEqual(user.isVerified, false);

    // Verify default farmProfile attributes
    assert.ok(user.farmProfile, 'farmProfile object should exist');
    assert.strictEqual(user.farmProfile.verificationStatus, 'unverified');
    assert.strictEqual(user.farmProfile.trustScore, 100);
    assert.strictEqual(user.farmProfile.farmLocation.state, '');
    assert.strictEqual(user.farmProfile.farmLocation.lga, '');
    assert.strictEqual(user.farmProfile.farmLocation.coordinates.lat, 0.0);
    assert.strictEqual(user.farmProfile.farmLocation.coordinates.lng, 0.0);
    assert.strictEqual(Array.isArray(user.farmProfile.cropSpecialties), true);
    assert.strictEqual(user.farmProfile.cropSpecialties.length, 0);
    assert.strictEqual(user.farmProfile.farmSizeHectares, 0);
    assert.strictEqual(user.farmProfile.yearEstablished, 2020);
  });

  // --------------------------------------------------------------------------
  // TEST 2: Required Identity Attributes
  // --------------------------------------------------------------------------
  it('should enforce required constraints on core identity fields', () => {
    const user = new User({});
    const err = user.validateSync();

    assert.ok(err, 'Validation error should be returned for empty user');
    assert.ok(err.errors['firstName'], 'firstName must be required');
    assert.ok(err.errors['lastName'], 'lastName must be required');
    assert.ok(err.errors['email'], 'email must be required');
    assert.ok(err.errors['passwordHash'], 'passwordHash must be required');
    assert.ok(err.errors['verificationString'], 'verificationString must be required');
  });

  // --------------------------------------------------------------------------
  // TEST 3: Email Format Validation
  // --------------------------------------------------------------------------
  it('should reject invalid email formatting', () => {
    const user = new User({
      firstName: 'Bello',
      lastName: 'Garba',
      email: 'invalid-email-format-without-at',
      passwordHash: 'hashed_pw',
      verificationString: 'uuid-123'
    });

    const err = user.validateSync();
    assert.ok(err, 'Validation should fail on malformed email');
    assert.ok(err.errors['email'], 'email error should be present');
    assert.ok(
      err.errors['email'].message.includes('valid email address format'),
      'Should report invalid email format message'
    );
  });

  // --------------------------------------------------------------------------
  // TEST 4: Rich FarmProfile Attributes & Coordinate Assignment
  // --------------------------------------------------------------------------
  it('should accept rich farm profile attributes and custom coordinates', () => {
    const user = new User({
      firstName: 'Amina',
      lastName: 'Danjuma',
      email: 'amina@dan-farms.ng',
      passwordHash: '$2b$10$hashedpw',
      verificationString: 'uuid-string',
      role: 'farmer',
      farmProfile: {
        bio: 'Third generation heirloom grain producer cultivating white maize, sorghum, and cowpeas.',
        farmLocation: {
          state: 'Kaduna',
          lga: 'Zaria',
          address: 'KM 14, Samaru Agricultural Belt',
          coordinates: {
            lat: 11.0855,
            lng: 7.7199
          }
        },
        cooperativeName: 'Northern Grains Growers Cooperative Society',
        cropSpecialties: ['White Maize', 'Sorghum', 'Cowpeas', 'Millet'],
        verificationStatus: 'verified',
        verifiedAt: new Date('2024-01-15T08:00:00Z'),
        trustScore: 98,
        contactPhone: '+234 803 123 4567',
        certifications: ['National Agricultural Seeds Council Certified', 'Global GAP Compliance'],
        farmSizeHectares: 25.5,
        yearEstablished: 2012
      }
    });

    const err = user.validateSync();
    assert.strictEqual(err, undefined, 'Validation should succeed for rich farm profile');
    assert.ok(user.farmProfile.bio.includes('heirloom grain producer'));
    assert.strictEqual(user.farmProfile.farmLocation.state, 'Kaduna');
    assert.strictEqual(user.farmProfile.farmLocation.lga, 'Zaria');
    assert.strictEqual(user.farmProfile.farmLocation.coordinates.lat, 11.0855);
    assert.strictEqual(user.farmProfile.farmLocation.coordinates.lng, 7.7199);
    assert.strictEqual(user.farmProfile.cropSpecialties.length, 4);
    assert.strictEqual(user.farmProfile.verificationStatus, 'verified');
    assert.strictEqual(user.farmProfile.trustScore, 98);
    assert.strictEqual(user.farmProfile.farmSizeHectares, 25.5);
    assert.strictEqual(user.farmProfile.yearEstablished, 2012);
  });

  // --------------------------------------------------------------------------
  // TEST 5: Verification Status Enum Enforcement
  // --------------------------------------------------------------------------
  it('should reject invalid verificationStatus enum values', () => {
    const user = new User({
      firstName: 'Test',
      lastName: 'Farmer',
      email: 'test@farm.ng',
      passwordHash: 'hash',
      verificationString: 'uuid',
      farmProfile: {
        verificationStatus: 'super-verified-ultra'
      }
    });

    const err = user.validateSync();
    assert.ok(err, 'Validation must fail for invalid status enum');
    assert.ok(
      err.errors['farmProfile.verificationStatus'],
      'Verification status error should exist'
    );
  });

  // --------------------------------------------------------------------------
  // TEST 6: Trust Score Boundary Enforcement
  // --------------------------------------------------------------------------
  it('should reject trust scores outside the 0 to 100 boundaries', () => {
    const userNegative = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'neg@test.ng',
      passwordHash: 'hash',
      verificationString: 'uuid',
      farmProfile: { trustScore: -5 }
    });
    const errNegative = userNegative.validateSync();
    assert.ok(errNegative.errors['farmProfile.trustScore'], 'Negative trust score must be rejected');

    const userExcessive = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'excess@test.ng',
      passwordHash: 'hash',
      verificationString: 'uuid',
      farmProfile: { trustScore: 150 }
    });
    const errExcessive = userExcessive.validateSync();
    assert.ok(errExcessive.errors['farmProfile.trustScore'], 'Trust score > 100 must be rejected');
  });

  // --------------------------------------------------------------------------
  // TEST 7: Coordinate Boundary Enforcement
  // --------------------------------------------------------------------------
  it('should reject coordinates outside valid geographic boundaries', () => {
    const userInvalidLat = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'lat@test.ng',
      passwordHash: 'hash',
      verificationString: 'uuid',
      farmProfile: {
        farmLocation: {
          coordinates: { lat: 105.0, lng: 5.0 }
        }
      }
    });
    const errLat = userInvalidLat.validateSync();
    assert.ok(
      errLat.errors['farmProfile.farmLocation.coordinates.lat'],
      'Latitude > 90 must be rejected'
    );

    const userInvalidLng = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'lng@test.ng',
      passwordHash: 'hash',
      verificationString: 'uuid',
      farmProfile: {
        farmLocation: {
          coordinates: { lat: 10.0, lng: 195.0 }
        }
      }
    });
    const errLng = userInvalidLng.validateSync();
    assert.ok(
      errLng.errors['farmProfile.farmLocation.coordinates.lng'],
      'Longitude > 180 must be rejected'
    );
  });

  // --------------------------------------------------------------------------
  // TEST 8: Full Name Virtual Property
  // --------------------------------------------------------------------------
  it('should compute virtual fullName correctly', () => {
    const user = new User({
      firstName: 'Fatima',
      lastName: 'Aliyu',
      email: 'fatima@aliyu.ng',
      passwordHash: 'hash',
      verificationString: 'uuid'
    });
    assert.strictEqual(user.fullName, 'Fatima Aliyu');
  });

  // --------------------------------------------------------------------------
  // TEST 9: Public Profile Sanitization
  // --------------------------------------------------------------------------
  it('getPublicProfile() should strip sensitive security hashes and tokens', () => {
    const user = new User({
      firstName: 'Kabir',
      lastName: 'Shehu',
      email: 'kabir@greenvalley.ng',
      passwordHash: 'ultra_confidential_bcrypt_hash_token_string',
      verificationString: 'confidential_uuid_token',
      passwordResetCode: 'confidential_reset_code',
      farmProfile: {
        bio: 'Organic greenhouse tomato and bell pepper grower.',
        cooperativeName: 'Jos Plateau Horticulture Cluster',
        verificationStatus: 'verified',
        trustScore: 95
      }
    });

    const publicProfile = user.getPublicProfile();

    assert.strictEqual(publicProfile.passwordHash, undefined, 'passwordHash must never be exposed');
    assert.strictEqual(publicProfile.verificationString, undefined, 'verificationString must not be exposed');
    assert.strictEqual(publicProfile.passwordResetCode, undefined, 'passwordResetCode must not be exposed');

    assert.strictEqual(publicProfile.firstName, 'Kabir');
    assert.strictEqual(publicProfile.lastName, 'Shehu');
    assert.strictEqual(publicProfile.fullName, 'Kabir Shehu');
    assert.strictEqual(publicProfile.email, 'kabir@greenvalley.ng');
    assert.strictEqual(publicProfile.farmProfile.verificationStatus, 'verified');
    assert.strictEqual(publicProfile.farmProfile.trustScore, 95);
    assert.strictEqual(publicProfile.farmProfile.cooperativeName, 'Jos Plateau Horticulture Cluster');
  });

  // --------------------------------------------------------------------------
  // TEST 10: Verification Status Mutation Validation
  // --------------------------------------------------------------------------
  it('updateVerificationStatus() should throw when supplied an invalid status', () => {
    const user = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@domain.ng',
      passwordHash: 'hash',
      verificationString: 'uuid'
    });

    assert.throws(
      () => {
        user.updateVerificationStatus('non_existent_status');
      },
      /Invalid verification status: non_existent_status/,
      'Should throw error for non-existent status'
    );
  });

  console.log(`\n🎉 All ${passed}/${total} User Model & Farm Profile tests passed successfully!`);
}

// Execute tests if executed directly from CLI
if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal Test Suite Error:', err);
      process.exit(1);
    });
}

module.exports = { runTests };
