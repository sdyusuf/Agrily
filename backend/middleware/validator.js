/**
 * ==============================================================================
 * AGRILY BACKEND - JOI REQUEST VALIDATION LAYER
 * ==============================================================================
 * 
 * @module backend/middleware/validator
 * @description
 * Centralized declarative request validation middleware powered by Joi.
 * Intercepts incoming HTTP mutations (POST, PUT, PATCH), sanitizes inputs, enforces
 * schema constraints, and returns standard HTTP 400 Bad Request error envelopes.
 * 
 * Architected for Sprint 7 API Security & Boundary Validation.
 */

const Joi = require('joi');

/**
 * Reusable Express middleware factory validating request properties against a Joi schema
 * 
 * @param {Joi.ObjectSchema} schema - Joi schema definition
 * @param {'body'|'query'|'params'} [property='body'] - Target property on Express req
 * @returns {Function} Express middleware function (req, res, next)
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    if (!schema || typeof schema.validate !== 'function') {
      return next();
    }

    const targetData = req[property] || {};
    const { error, value } = schema.validate(targetData, {
      abortEarly: false,
      stripUnknown: false,
      allowUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) =>
        detail.message.replace(/['"]/g, '')
      );

      return res.status(400).json({
        success: false,
        message: 'Request payload validation failed',
        errors: errorMessages
      });
    }

    // Merge validated/coerced values back
    req[property] = { ...req[property], ...value };
    next();
  };
}

// ----------------------------------------------------------------------------
// AUTHENTICATION & IDENTITY SCHEMAS
// ----------------------------------------------------------------------------

const signupSchema = Joi.object({
  firstName: Joi.string().max(60).allow('', null).optional(),
  lastName: Joi.string().max(60).allow('', null).optional(),
  email: Joi.string().email().required().messages({
    'string.email': 'A valid email address is required',
    'any.required': 'Email address is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Valid email address is required',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Valid email address is required for verification link resend',
    'any.required': 'Email is required'
  })
});

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required'
  })
});

// ----------------------------------------------------------------------------
// FARM PROFILE SCHEMA
// ----------------------------------------------------------------------------

const profileUpdateSchema = Joi.object({
  firstName: Joi.string().max(60).allow('', null).optional(),
  lastName: Joi.string().max(60).allow('', null).optional(),
  email: Joi.string().email().optional(),
  bio: Joi.string().max(1000).allow('', null).optional().messages({
    'string.max': 'Bio cannot exceed 1000 characters'
  }),
  cooperativeName: Joi.string().max(120).allow('', null).optional(),
  contactPhone: Joi.string().max(30).allow('', null).optional(),
  cropSpecialties: Joi.array().items(Joi.string()).optional(),
  certifications: Joi.array().items(Joi.string()).optional(),
  farmSizeHectares: Joi.number().min(0).optional().messages({
    'number.min': 'Farm size must be a non-negative number'
  }),
  yearEstablished: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional().messages({
    'number.min': 'Year established must be after 1900',
    'number.max': `Year established cannot exceed ${new Date().getFullYear()}`
  }),
  farmLocation: Joi.object({
    state: Joi.string().allow('', null).optional(),
    lga: Joi.string().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).optional().messages({
        'number.min': 'Latitude must be between -90 and 90',
        'number.max': 'Latitude must be between -90 and 90'
      }),
      lng: Joi.number().min(-180).max(180).optional().messages({
        'number.min': 'Longitude must be between -180 and 180',
        'number.max': 'Longitude must be between -180 and 180'
      })
    }).optional()
  }).optional(),
  avatar: Joi.string().allow('', null).optional(),
  bannerImage: Joi.string().allow('', null).optional()
});

// ----------------------------------------------------------------------------
// PRODUCE INVENTORY SCHEMAS
// ----------------------------------------------------------------------------

const allowedCategories = [
  'grains', 'tubers', 'fruits', 'vegetables',
  'legumes', 'cash_crops', 'livestock', 'dairy', 'poultry', 'other'
];

const allowedUnits = [
  'kg', 'bag', 'crate', 'ton', 'piece', 'bundle', 'basket'
];

const productCreateSchema = Joi.object({
  name: Joi.string().min(2).max(120).required().messages({
    'string.min': 'Produce name must be at least 2 characters long',
    'string.max': 'Produce name cannot exceed 120 characters',
    'any.required': 'Produce name is required'
  }),
  category: Joi.string().valid(...allowedCategories).optional(),
  unit: Joi.string().valid(...allowedUnits).optional(),
  quantity: Joi.number().min(0).required().messages({
    'number.min': 'Quantity must be a non-negative number',
    'any.required': 'Quantity is required'
  }),
  minOrderQuantity: Joi.number().min(1).optional().messages({
    'number.min': 'Minimum order quantity must be at least 1'
  }),
  price: Joi.number().min(0).required().messages({
    'number.min': 'Price must be a valid positive number',
    'any.required': 'Price is required'
  }),
  harvestDate: Joi.date().iso().allow(null, '').optional(),
  ownerEmail: Joi.string().email().required().messages({
    'string.email': 'Valid owner email is required',
    'any.required': 'Owner email is required'
  }),
  ownerName: Joi.string().allow('', null).optional(),
  description: Joi.string().max(2000).allow('', null).optional()
});

const productUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(120).optional(),
  category: Joi.string().valid(...allowedCategories).optional(),
  unit: Joi.string().valid(...allowedUnits).optional(),
  quantity: Joi.number().min(0).optional(),
  minOrderQuantity: Joi.number().min(1).optional(),
  price: Joi.number().min(0).optional(),
  harvestDate: Joi.date().iso().allow(null, '').optional(),
  ownerEmail: Joi.string().email().optional(),
  ownerName: Joi.string().allow('', null).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  isSold: Joi.boolean().optional(),
  soldDate: Joi.string().allow(null, '').optional(),
  soldTo: Joi.string().allow(null, '').optional()
});

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  profileUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  allowedCategories,
  allowedUnits
};
