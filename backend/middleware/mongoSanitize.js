/**
 * ==============================================================================
 * AGRILY BACKEND - MONGODB NOSQL INJECTION SANITIZER
 * ==============================================================================
 * 
 * @module backend/middleware/mongoSanitize
 * @description
 * Middleware defending against MongoDB NoSQL operator injection vulnerabilities.
 * Recursively scans and cleans incoming request payloads (`req.body`, `req.query`,
 * `req.params`), neutralizing prohibited MongoDB query operators starting with '$'
 * or containing prohibited '.' characters.
 * 
 * Part of Sprint 7: API Security, Validation & Defense-in-Depth.
 */

const mongoSanitize = require('express-mongo-sanitize');

/**
 * Pure helper function: recursively strips '$' prefixes and '.' from object keys
 * Useful for controller-level sanitization and isolated testing.
 * 
 * @param {*} data - Target data structure
 * @param {string} [replaceWith='_'] - Replacement character
 * @returns {*} Sanitized copy of data structure
 */
function cleanNoSqlOperators(data, replaceWith = '_') {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => cleanNoSqlOperators(item, replaceWith));
  }

  const cleaned = {};
  for (const [key, val] of Object.entries(data)) {
    let safeKey = key;
    if (safeKey.startsWith('$')) {
      safeKey = safeKey.replace(/^\$/, replaceWith);
    }
    safeKey = safeKey.replace(/\./g, replaceWith);

    cleaned[safeKey] = cleanNoSqlOperators(val, replaceWith);
  }
  return cleaned;
}

/**
 * Express middleware applying NoSQL query sanitization
 */
const sanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(
      `[SECURITY AUDIT] Prohibited NoSQL operator sanitized in request: key "${key}" from IP ${req?.ip || 'unknown'}`
    );
  }
});

module.exports = sanitizeMiddleware;
module.exports.sanitizeMiddleware = sanitizeMiddleware;
module.exports.cleanNoSqlOperators = cleanNoSqlOperators;
