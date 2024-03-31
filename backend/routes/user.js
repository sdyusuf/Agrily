/**
 * ============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * User Authentication, Identity & Farm Profile Router
 * ============================================================================
 * 
 * @module backend/routes/user
 * @description
 * Express router handling user registration, credentials authentication, email verification,
 * password recovery workflows, and producer farm profile management.
 * 
 * Architectural & Security Principles:
 * 1. Passwords are never stored in plaintext; salted with 10 rounds of bcrypt hashing.
 * 2. Tokens are signed with JWT using configured application secrets (2-day TTL).
 * 3. Public profile retrieval rigorously sanitizes internal security tokens and password hashes.
 * 4. Input payloads for farm profiles are sanitized against schema boundary rules.
 * 
 * @license Private / Proprietary Agrily Inc.
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { sendMail, sendMailFull } = require('../utils/sendMail');
const { v4: uuidv4 } = require('uuid');

/**
 * Controller helper: Sanitizes and validates farm profile update payload.
 * 
 * @param {Object} payload - Update payload submitted by client
 * @returns {{ isValid: boolean, errors: string[], cleanData: Object }} Validation outcome and sanitized data
 */
function validateProfilePayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: ['Profile payload must be a non-null JSON object.'], cleanData: {} };
  }

  const cleanData = {};

  if (payload.bio !== undefined) {
    if (typeof payload.bio !== 'string') {
      errors.push('Bio must be a string value.');
    } else if (payload.bio.length > 1000) {
      errors.push('Bio cannot exceed 1000 characters.');
    } else {
      cleanData.bio = payload.bio.trim();
    }
  }

  if (payload.cooperativeName !== undefined) {
    if (typeof payload.cooperativeName !== 'string') {
      errors.push('Cooperative name must be a string.');
    } else {
      cleanData.cooperativeName = payload.cooperativeName.trim();
    }
  }

  if (payload.contactPhone !== undefined) {
    if (typeof payload.contactPhone !== 'string') {
      errors.push('Contact phone must be a string.');
    } else {
      cleanData.contactPhone = payload.contactPhone.trim();
    }
  }

  if (payload.cropSpecialties !== undefined) {
    if (!Array.isArray(payload.cropSpecialties)) {
      errors.push('Crop specialties must be an array of strings.');
    } else {
      cleanData.cropSpecialties = payload.cropSpecialties.map((s) => String(s).trim()).filter(Boolean);
    }
  }

  if (payload.certifications !== undefined) {
    if (!Array.isArray(payload.certifications)) {
      errors.push('Certifications must be an array of strings.');
    } else {
      cleanData.certifications = payload.certifications.map((c) => String(c).trim()).filter(Boolean);
    }
  }

  if (payload.farmSizeHectares !== undefined) {
    const size = Number(payload.farmSizeHectares);
    if (isNaN(size) || size < 0) {
      errors.push('Farm size must be a non-negative number.');
    } else {
      cleanData.farmSizeHectares = size;
    }
  }

  if (payload.yearEstablished !== undefined) {
    const year = parseInt(payload.yearEstablished, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear) {
      errors.push(`Year established must be between 1900 and ${currentYear}.`);
    } else {
      cleanData.yearEstablished = year;
    }
  }

  if (payload.farmLocation && typeof payload.farmLocation === 'object') {
    cleanData.farmLocation = {
      state: String(payload.farmLocation.state || '').trim(),
      lga: String(payload.farmLocation.lga || '').trim(),
      address: String(payload.farmLocation.address || '').trim(),
      coordinates: {
        lat: Number(payload.farmLocation.coordinates?.lat || 0),
        lng: Number(payload.farmLocation.coordinates?.lng || 0)
      }
    };

    if (cleanData.farmLocation.coordinates.lat < -90 || cleanData.farmLocation.coordinates.lat > 90) {
      errors.push('Latitude must be between -90 and +90 degrees.');
    }
    if (cleanData.farmLocation.coordinates.lng < -180 || cleanData.farmLocation.coordinates.lng > 180) {
      errors.push('Longitude must be between -180 and +180 degrees.');
    }
  }

  if (payload.avatar !== undefined) {
    cleanData.avatar = String(payload.avatar).trim();
  }

  if (payload.bannerImage !== undefined) {
    cleanData.bannerImage = String(payload.bannerImage).trim();
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanData
  };
}

/**
 * Controller: Handles GET /api/users/profile/:email
 * Exposes public profile with credentials and sensitive hashes omitted.
 */
async function getUserProfileController(req, res, UserClass = User) {
  try {
    const email = (req.params.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Valid user email parameter is required.' });
    }

    const user = await UserClass.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const profileData = typeof user.getPublicProfile === 'function' ? user.getPublicProfile() : user;
    return res.status(200).json({
      success: true,
      profile: profileData
    });
  } catch (error) {
    console.error('Error in getUserProfileController:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving user profile.' });
  }
}

/**
 * Controller: Handles PUT /api/users/profile
 * Updates producer farm bio, location, crop specialties, and administrative metadata.
 */
async function updateUserProfileController(req, res, UserClass = User) {
  try {
    const { email, ...profileUpdates } = req.body || {};
    const targetEmail = (email || req.user?.email || '').trim().toLowerCase();

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required to identify the profile for update.'
      });
    }

    const validation = validateProfilePayload(profileUpdates);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Profile validation failed.',
        errors: validation.errors
      });
    }

    const user = await UserClass.findOne({ email: targetEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Profile record not found for email: ${targetEmail}`
      });
    }

    // Merge clean updates into user farmProfile
    user.farmProfile = user.farmProfile || {};
    Object.assign(user.farmProfile, validation.cleanData);

    // If firstName or lastName submitted, update top-level identity attributes
    if (profileUpdates.firstName) user.firstName = String(profileUpdates.firstName).trim();
    if (profileUpdates.lastName) user.lastName = String(profileUpdates.lastName).trim();

    await user.save();

    const sanitized = typeof user.getPublicProfile === 'function' ? user.getPublicProfile() : user;
    return res.status(200).json({
      success: true,
      message: 'Farmer profile updated successfully.',
      profile: sanitized
    });
  } catch (error) {
    console.error('Error in updateUserProfileController:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error updating user profile.'
    });
  }
}

// ----------------------------------------------------------------------------
// EXISTING AUTHENTICATION ROUTE HANDLERS
// ----------------------------------------------------------------------------

router.post('/api/signup', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');

  try {
    const { firstName, lastName, email, password } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({ message: 'User already exists!' });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const verificationString = uuidv4();

    const userData = new User({
      firstName,
      lastName,
      email,
      passwordHash,
      isVerified: false,
      verificationString
    });

    const result = await userData.save();
    const { _id } = result;

    try {
      await sendMail(email, verificationString);
    } catch (e) {
      console.log(e);
    }

    jwt.sign(
      {
        id: _id,
        firstName,
        lastName,
        email,
        isVerified: false,
        verificationString
      },
      process.env.JWT_SECRET || 'secretKeyFallback',
      { expiresIn: '2d' },
      (err, token) => {
        if (err) {
          return res.status(500).send(err);
        }
        res.status(200).json({ token });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

router.post('/api/login', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.sendStatus(401);

    const { _id, isVerified, passwordHash } = user;

    const isCorrect = await bcrypt.compare(password, passwordHash);

    if (isCorrect) {
      jwt.sign(
        {
          id: _id,
          firstName: user.firstName,
          lastName: user.lastName,
          email,
          isVerified
        },
        process.env.JWT_SECRET || 'secretKeyFallback',
        { expiresIn: '2d' },
        (err, token) => {
          if (err) {
            return res.status(500).json(err);
          }
          res.status(200).json({ token });
        }
      );
    } else {
      res.sendStatus(401);
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/verify', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  const { verificationString } = req.body;

  if (!verificationString) return res.status(401).json({ message: 'verification string is empty' });

  const result = await User.findOne({ verificationString });

  if (!result) return res.status(401).json({ message: 'The email verification code is incorrect!' });

  const { _id: id, email, isVerified } = result;

  await User.updateOne(
    { _id: id },
    {
      isVerified: true
    }
  );

  jwt.sign({ id, email, isVerified: true }, process.env.JWT_SECRET || 'secretKeyFallback', { expiresIn: '2d' }, (err, token) => {
    if (err) return res.sendStatus(500);
    res.status(200).json({ token });
  });
});

/**
 * Resend verification email endpoint
 */
router.post('/api/resend-verification', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account registered with this email address' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This account has already been verified' });
    }

    let verificationString = user.verificationString;
    if (!verificationString) {
      verificationString = uuidv4();
      user.verificationString = verificationString;
      await user.save();
    }

    await sendMail(email, verificationString);
    res.status(200).json({ success: true, message: 'Verification link has been sent to your email' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ success: false, message: 'Unable to resend email at this time. Please retry.' });
  }
});

router.put('/api/forgot-password/:email', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  const { email } = req.params;

  const passwordResetCode = uuidv4();

  const result = await User.updateOne({ email }, { passwordResetCode });

  if (result.modifiedCount > 0) {
    try {
      await sendMailFull(
        email,
        'Agrily - Reset your password',
        `To reset your password click this link http://localhost:3000/reset-password/`,
        passwordResetCode
      );
    } catch (e) {
      return res.sendStatus(500);
    }
    return res.sendStatus(200);
  }
  return res.sendStatus(404);
});

router.put('/api/users/:passwordResetCode/reset-password', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');

  try {
    const { passwordResetCode } = req.params;
    const { newPassword } = req.body;

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const result = await User.updateOne(
      { passwordResetCode },
      {
        passwordHash: newPasswordHash,
        passwordResetCode: ''
      }
    );

    if (result.modifiedCount === 0) return res.sendStatus(404);

    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(404);
  }
});

// ----------------------------------------------------------------------------
// NEW SPRINT 6 FARM PROFILE ENDPOINTS
// ----------------------------------------------------------------------------

/**
 * GET /api/users/profile/:email
 * Public profile endpoint returning sanitized producer metadata and trust status.
 */
router.get('/api/users/profile/:email', (req, res) => getUserProfileController(req, res));

/**
 * PUT /api/users/profile
 * Farmer profile update endpoint for editing biography, geolocation, and crops.
 */
router.put('/api/users/profile', (req, res) => updateUserProfileController(req, res));

module.exports = router;
module.exports.validateProfilePayload = validateProfilePayload;
module.exports.getUserProfileController = getUserProfileController;
module.exports.updateUserProfileController = updateUserProfileController;