/**
 * ==============================================================================
 * 🧪 AGRILY SPRINT 24: NATIONAL MULTILINGUAL CORPUS PERMUTATION MATRIX &
 *    CODE-SWITCHING / LEVENSHTEIN ORTHOGRAPHY UNIT TESTS
 * ==============================================================================
 */

const assert = require('assert');
const {
  AGRONOMY_INTENT_CATALOG,
  classifyAndRespondMultilingualAgronomy,
} = require('../services/multilingualAgronomyNluEngine');
const {
  computeLevenshteinDistance,
  analyzeCodeSwitchingAndRestoreOrthography,
  estimateOfflinePwaModelSyncMetrics,
} = require('../services/dialectCodeSwitchingAndPhoneticsEngine');

console.log(
  '🧪 Starting Sprint 24 National Multilingual Corpus Permutation & Code-Switching Tests...'
);

// 1. Test 6 Locales × 6 Intents × 6 Agro-Ecological Zones Permutation Matrix (216 Permutations)
{
  const locales = ['en-NG', 'ha-NG', 'yo-NG', 'ig-NG', 'pcm-NG', 'ff-NG'];
  const agroZones = [
    'SAHEL_SAVANNA',
    'SUDAN_SAVANNA',
    'NORTHERN_GUINEA_SAVANNA',
    'SOUTHERN_GUINEA_SAVANNA',
    'DERIVED_SAVANNA',
    'HUMID_RAINFOREST',
  ];
  const sampleQueriesByIntent = {
    PEST_IPM_AND_FALL_ARMYWORM: 'Tsutsar masara caterpillar eating maize whorl',
    NPK_FERTILIZER_DOSING: 'Takin NPK 15-15-15 da Urea fertilizer bags per hectare',
    CROP_PATHOLOGY_AND_BLIGHT: 'Cassava mosaic virus and tomato leaf blight spots',
    IRRIGATION_AND_WATER_STRESS: 'Ban ruwa drip irrigation pump tensiometer drought',
    POST_HARVEST_AFLATOXIN_AND_STORAGE: 'Ajiya PICS hermetic bag weevil and aflatoxin storage',
    MARKET_PRICE_AND_ESCROW_SUPPORT: 'Farashi kasuwa market price tonne escrow payment',
  };

  let permutationCount = 0;
  for (const locale of locales) {
    for (const [expectedIntent, queryText] of Object.entries(sampleQueriesByIntent)) {
      for (const agroZone of agroZones) {
        const res = classifyAndRespondMultilingualAgronomy({
          utteranceText: queryText,
          preferredLocale: locale,
          farmerContext: {
            agroEcologicalZone: agroZone,
            stateName: 'Kano',
          },
        });
        assert.strictEqual(res.detectedIntent, expectedIntent);
        assert.strictEqual(res.responseLocale, locale);
        assert.ok(res.localizedReply.length > 20);
        assert.ok(res.ragCitationBulletinIds.length >= 1);
        permutationCount += 1;
      }
    }
  }

  assert.strictEqual(permutationCount, 216);
  console.log(
    `  ✓ All ${permutationCount} Multilingual (6 Locales × 6 Intents × 6 Agro-Zones) permutations verified`
  );
}

// 2. Test Wagner-Fischer Levenshtein Edit Distance & Fuzzy Spell-Correction
{
  assert.strictEqual(computeLevenshteinDistance('kokro', 'kokoro'), 1);
  assert.strictEqual(computeLevenshteinDistance('tsutsa', 'tsutsa'), 0);

  const codeSwitchAnalysis = analyzeCodeSwitchingAndRestoreOrthography({
    rawUtterance: 'Abeg kokro jegbdo don chop my agbdo ewe for Oyo',
  });

  assert.strictEqual(codeSwitchAnalysis.isCodeSwitched, true);
  assert.ok(codeSwitchAnalysis.codeMixingIndexCmi > 20);
  assert.ok(codeSwitchAnalysis.spellCorrections.length >= 3);
  assert.ok(codeSwitchAnalysis.diacriticRestoredSentence.includes('kòkòrò'));
  assert.ok(codeSwitchAnalysis.diacriticRestoredSentence.includes('àgbàdo'));
  console.log(
    '  ✓ Wagner-Fischer Levenshtein typo correction, tonal diacritic restoration & CMI verified'
  );
}

// 3. Test Offline-First PWA Quantized Model Pack & 2G EDGE Sync Calculator
{
  const syncMetrics = estimateOfflinePwaModelSyncMetrics({
    installedLocales: ['ha-NG', 'yo-NG', 'ig-NG', 'pcm-NG', 'en-NG'],
    networkThroughputKbps: 32.0,
    deltaChangedBulletinCount: 3,
  });

  assert.ok(syncMetrics.fullOfflineBundleKilobytes > 1000);
  assert.ok(syncMetrics.deltaSyncDurationSeconds < 10);
  assert.strictEqual(syncMetrics.offlineReadyState, 'FAST_2G_DELTA_SYNC_READY');
  console.log('  ✓ Offline-first PWA IndexedDB quantized delta sync calculator verified');
}

console.log(
  '✅ All Sprint 24 National Multilingual Corpus Permutation & Code-Switching tests passed!'
);
