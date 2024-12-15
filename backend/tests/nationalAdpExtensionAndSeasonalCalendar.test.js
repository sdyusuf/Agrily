/**
 * ==============================================================================
 * 🧪 AGRILY SPRINT 24: 37-STATE ADP EXTENSION DIRECTORY, MULTILINGUAL SEASONAL
 *    CROPPING CALENDAR & RURAL FARM RADIO SCRIPT UNIT TESTS
 * ==============================================================================
 */

const assert = require('assert');
const {
  NIGERIAN_STATE_ADP_DIRECTORY,
  generateLocalizedSeasonalCalendarAndRadioScript,
} = require('../services/nationalAdpExtensionAndSeasonalCalendarEngine');

console.log(
  '🧪 Starting Sprint 24 37-State ADP Extension Directory & Seasonal Calendar Tests...'
);

// 1. Verify all 36 States + FCT Abuja ADP Directory (37 Total Agencies)
{
  assert.strictEqual(NIGERIAN_STATE_ADP_DIRECTORY.length, 37);

  const zones = new Set(
    NIGERIAN_STATE_ADP_DIRECTORY.map((a) => a.geopoliticalZone)
  );
  assert.strictEqual(zones.size, 6);

  for (const adp of NIGERIAN_STATE_ADP_DIRECTORY) {
    assert.ok(adp.adpAcronym.length >= 3);
    assert.ok(adp.farmRadioFrequencyMhz.includes('FM'));
    assert.ok(adp.extensionAgentsCount >= 500);
    assert.ok(adp.registeredFarmFamiliesCount >= 300000);
  }
  console.log(
    `  ✓ All ${NIGERIAN_STATE_ADP_DIRECTORY.length} Nigerian State/FCT ADP agencies & FM frequencies verified`
  );
}

// 2. Verify Localized 6-Stage Seasonal Cropping Calendar & Radio Script across Locales
{
  const testCases = [
    { stateName: 'Kano', localeCode: 'ha-NG', expectedAcronym: 'KNARDA' },
    { stateName: 'Oyo', localeCode: 'yo-NG', expectedAcronym: 'OYSADEP' },
    { stateName: 'Anambra', localeCode: 'ig-NG', expectedAcronym: 'ANADEP' },
    { stateName: 'Edo', localeCode: 'pcm-NG', expectedAcronym: 'EDADP' },
  ];

  for (const tc of testCases) {
    const report = generateLocalizedSeasonalCalendarAndRadioScript({
      stateName: tc.stateName,
      cropKey: 'MAIZE',
      localeCode: tc.localeCode,
    });

    assert.strictEqual(report.adpAcronym, tc.expectedAcronym);
    assert.strictEqual(report.calendarStages.length, 6);
    assert.ok(
      report.effectiveDigitalAugmentedRatio <
        report.physicalFarmersPerAgentRatio
    );
    assert.ok(report.radioBroadcastScript.includes('*347*24#'));
  }
  console.log(
    '  ✓ Localized 6-stage cropping calendar & rural FM broadcast script synthesis verified'
  );
}

console.log(
  '✅ All Sprint 24 37-State ADP Extension Directory & Seasonal Calendar tests passed!'
);
