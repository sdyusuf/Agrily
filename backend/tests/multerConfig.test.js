const assert = require('assert');
const multerConfig = require('../middleware/multer-config');

async function runTests() {
  console.log('🧪 Starting Multer Image Validation Unit Tests...\n');
  let passed = 0;
  let total = 0;

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

  // Test 1: Permitted MIME types
  it('should accept valid image MIME types (JPEG, PNG, WebP)', () => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    validTypes.forEach((mimetype) => {
      let accepted = null;
      let error = null;

      multerConfig.fileFilter({}, { mimetype }, (err, result) => {
        error = err;
        accepted = result;
      });

      assert.strictEqual(error, null, `Should not error on ${mimetype}`);
      assert.strictEqual(accepted, true, `Should accept ${mimetype}`);
    });
  });

  // Test 2: Reject unpermitted MIME types
  it('should reject unpermitted file types (PDF, GIF, MP4, text/plain)', () => {
    const invalidTypes = ['application/pdf', 'image/gif', 'video/mp4', 'text/plain', 'application/zip'];

    invalidTypes.forEach((mimetype) => {
      let accepted = null;
      let error = null;

      multerConfig.fileFilter({}, { mimetype }, (err, result) => {
        error = err;
        accepted = result;
      });

      assert.ok(error, `Should return error for ${mimetype}`);
      assert.strictEqual(accepted, false, `Should reject ${mimetype}`);
      assert.strictEqual(error.code, 'LIMIT_FILE_TYPE');
      assert.ok(error.message.includes('Only JPEG, PNG, and WebP images up to 5MB are permitted'));
    });
  });

  // Test 3: 5MB maximum file size limit
  it('should enforce 5MB maximum file size limit (5,242,880 bytes)', () => {
    assert.strictEqual(multerConfig.MAX_FILE_SIZE, 5 * 1024 * 1024);
  });

  // Test 4: Filename sanitization
  it('should generate sanitized filenames with appropriate extensions', () => {
    const file = {
      originalname: 'Sweet Potato Harvest #1 (2024).jpg',
      mimetype: 'image/jpeg'
    };

    multerConfig.storage.getFilename({}, file, (err, filename) => {
      assert.strictEqual(err, null);
      assert.ok(filename.endsWith('.jpg'), 'Generated filename should end with .jpg');
      assert.ok(!filename.includes(' '), 'Generated filename should not contain spaces');
      assert.ok(!filename.includes('#'), 'Generated filename should not contain special character #');
      assert.ok(!filename.includes('('), 'Generated filename should not contain parenthesis');
    });
  });

  console.log(`\n🎉 All ${passed}/${total} Multer Validation tests passed successfully!`);
}

runTests();
