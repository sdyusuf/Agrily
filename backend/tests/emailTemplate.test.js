/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - BRANDED EMAIL TEMPLATE UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Validates responsive email rendering, design tokens, graphics integration,
 * and CTA accessibility across all transactional email variations.
 * 
 * @module tests/emailTemplate.test
 * @requires assert
 * @requires ../utils/emailTemplate
 */

const assert = require('assert');
const {
  renderEmailShell,
  buildVerificationEmail,
  buildPasswordResetEmail,
  getVerificationGraphicCard,
  getPasswordResetGraphicCard
} = require('../utils/emailTemplate');
const { sendMail, sendMailFull } = require('../utils/sendMail');

async function runTests() {
  console.log('🧪 Starting Branded Email Template Unit Tests...\n');
  let passed = 0;
  let total = 0;

  async function it(description, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${description}`);
      console.error(`    Error: ${err.message}`);
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // TEST CASE 1: Shell Structure & Design Tokens
  // --------------------------------------------------------------------------
  await it('renderEmailShell should produce valid responsive HTML with Agrily brand elements', () => {
    const html = renderEmailShell({
      headline: 'Harvest Notification',
      subheadline: 'Your crop has arrived.',
      contentHtml: '<p>Inspection details here.</p>',
      ctaText: 'View Details',
      ctaUrl: 'https://agrily.com/orders/123'
    });

    assert.ok(html.includes('<!DOCTYPE html>'), 'Must start with standard doctype');
    assert.ok(html.includes('AGRILY'), 'Must display Agrily brand wordmark');
    assert.ok(html.includes('#1b4332'), 'Must include brand primary forest emerald token');
    assert.ok(html.includes('#2d6a4f'), 'Must include brand secondary emerald token');
    assert.ok(html.includes('Agrily Escrow'), 'Must include Agrily Escrow trust guarantee');
    assert.ok(html.includes('Farm Provenance'), 'Must include Farm Provenance guarantee');
    assert.ok(html.includes('yusuf.hilside@gmail.com'), 'Must reference official support email');
    assert.ok(html.includes('https://agrily.com/orders/123'), 'Must embed CTA destination');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 2: Account Verification Email Generation
  // --------------------------------------------------------------------------
  await it('buildVerificationEmail should contain graphic card, verification button and security disclaimer', () => {
    const verifyUrl = 'http://localhost:3001/verify/test-uuid-12345';
    const email = 'farmer@kadunagrains.ng';
    const html = buildVerificationEmail({ verifyUrl, email });

    assert.ok(html.includes(verifyUrl), 'HTML must contain direct verification link');
    assert.ok(html.includes('Activate Produce Account'), 'HTML must feature activation button label');
    assert.ok(html.includes('farmer@kadunagrains.ng'), 'HTML must mention user email in security notice');
    assert.ok(html.includes('🌱'), 'Must include sprout graphic element');
    assert.ok(html.includes('48 hours'), 'Must inform user of 48h validity');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 3: Password Recovery Email Generation
  // --------------------------------------------------------------------------
  await it('buildPasswordResetEmail should render recovery graphic and security notice', () => {
    const resetUrl = 'http://localhost:3001/reset-password/sample-reset-token';
    const html = buildPasswordResetEmail({ resetUrl, email: 'buyer@lagosfood.ng' });

    assert.ok(html.includes(resetUrl), 'HTML must include password reset link');
    assert.ok(html.includes('Reset My Password'), 'HTML must render password reset CTA');
    assert.ok(html.includes('🔐'), 'Must render security lock graphic');
    assert.ok(html.includes('buyer@lagosfood.ng'), 'Must reference recipient email address');
    assert.ok(html.includes('safely ignore this message'), 'Must include ignore advisory if not requested');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 4: Graphic Cards Render Cleanly
  // --------------------------------------------------------------------------
  await it('Graphic card helpers should produce valid inline HTML with styling', () => {
    const vCard = getVerificationGraphicCard();
    const pCard = getPasswordResetGraphicCard();

    assert.ok(vCard.includes('linear-gradient'), 'Verification graphic must use vibrant gradient');
    assert.ok(pCard.includes('linear-gradient'), 'Password graphic must use warm harvest gradient');
    assert.ok(vCard.includes('Marketplace Access'), 'Verification card must highlight marketplace access');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 5: sendMail & sendMailFull Function Signature Integrity
  // --------------------------------------------------------------------------
  await it('sendMail and sendMailFull should be valid callable async functions', () => {
    assert.strictEqual(typeof sendMail, 'function');
    assert.strictEqual(typeof sendMailFull, 'function');
  });

  console.log(`\n🎉 All ${passed}/${total} Branded Email Template Unit Tests Passed Successfully!\n`);
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = { runTests };
