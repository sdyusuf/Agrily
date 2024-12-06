/**
 * ==============================================================================
 * 🧪 AGRILY SPRINT 24: MULTILINGUAL AGRONOMY NLU, INDIGENOUS SPEECH & USSD TESTS
 * ==============================================================================
 */

const assert = require('assert');
const {
  detectNigerianLocale,
  extractAgronomyEntities,
  classifyAndRespondMultilingualAgronomy,
} = require('../services/multilingualAgronomyNluEngine');
const {
  processIndigenousVoiceNotePacket,
  evaluateUssdAgronomySession,
} = require('../services/indigenousSpeechAndUssdBridgeService');

console.log(
  '🧪 Starting Sprint 24 Multilingual Agronomy NLU, Voice ASR/TTS & 2G USSD Unit Tests...'
);

// 1. Test Indigenous Locale Detection across Hausa, Yoruba, Igbo, and Pidgin
{
  const haLoc = detectNigerianLocale(
    'Tsutsar masara tana cin ganyen masara a gona'
  );
  const yoLoc = detectNigerianLocale(
    'Kokoro jegbado ti ba ewe agbado mi je ni oko'
  );
  const igLoc = detectNigerianLocale(
    'Ikpuru na-eri akwukwo oka na akpu n’ubi'
  );
  const pcmLoc = detectNigerianLocale(
    'Abeg caterpillar dey chop my corn leaf, wetin I go fit spray?'
  );

  assert.strictEqual(haLoc, 'ha-NG');
  assert.strictEqual(yoLoc, 'yo-NG');
  assert.strictEqual(igLoc, 'ig-NG');
  assert.strictEqual(pcmLoc, 'pcm-NG');
  console.log('  ✓ Hausa, Yoruba, Igbo & Nigerian Pidgin automatic locale detection verified');
}

// 2. Test BM25 Intent Classification & Entity Extraction across Intents
{
  const fawRes = classifyAndRespondMultilingualAgronomy({
    utteranceText: 'Tsutsar masara tana cin ganyen masara a Kano',
  });
  assert.strictEqual(fawRes.detectedIntent, 'PEST_IPM_AND_FALL_ARMYWORM');
  assert.strictEqual(fawRes.extractedEntities.cropKey, 'MAIZE');
  assert.strictEqual(fawRes.extractedEntities.stateName, 'Kano');
  assert.ok(fawRes.localizedReply.includes('Emamectin'));

  const npkRes = classifyAndRespondMultilingualAgronomy({
    utteranceText: 'Iwon ajile NPK ati Urea melo ni mo le lo fun agbado ni Oyo?',
    preferredLocale: 'yo-NG',
  });
  assert.strictEqual(npkRes.detectedIntent, 'NPK_FERTILIZER_DOSING');
  assert.strictEqual(npkRes.responseLocale, 'yo-NG');
  assert.ok(npkRes.localizedReply.includes('NPK 15-15-15'));

  const storageRes = classifyAndRespondMultilingualAgronomy({
    utteranceText: 'How I go store dry beans inside PICS bag make weevil and aflatoxin no spoil am?',
    preferredLocale: 'pcm-NG',
  });
  assert.strictEqual(
    storageRes.detectedIntent,
    'POST_HARVEST_AFLATOXIN_AND_STORAGE'
  );
  assert.strictEqual(storageRes.extractedEntities.cropKey, 'COWPEA');
  console.log(
    '  ✓ Okapi BM25 multilingual intent classifier & slot-filling entity extractor verified'
  );
}

// 3. Test Opus Voice Note ASR/TTS Framing & 2G USSD (*347*24#) State Machine
{
  const voicePacket = processIndigenousVoiceNotePacket({
    localeCode: 'ha-NG',
    audioDurationSeconds: 10.0,
    signalToNoiseRatioDb: 21.0,
    bitrateKbps: 12.0,
  });
  assert.strictEqual(voicePacket.opusPayloadKilobytes, 15.0);
  assert.ok(voicePacket.asrConfidence > 0.9);
  assert.strictEqual(
    voicePacket.nluResult.detectedIntent,
    'PEST_IPM_AND_FALL_ARMYWORM'
  );

  const ussdRoot = evaluateUssdAgronomySession({ text: '' });
  assert.strictEqual(ussdRoot.sessionState, 'CON');
  assert.ok(ussdRoot.screenText.startsWith('CON Welcome'));

  const ussdHausaMenu = evaluateUssdAgronomySession({ text: '1' });
  assert.strictEqual(ussdHausaMenu.sessionState, 'CON');
  assert.strictEqual(ussdHausaMenu.localeCode, 'ha-NG');

  const ussdTerminal = evaluateUssdAgronomySession({ text: '1*2' });
  assert.strictEqual(ussdTerminal.sessionState, 'END');
  assert.strictEqual(ussdTerminal.smsFollowupQueued, true);
  assert.ok(ussdTerminal.screenText.includes('NPK 15-15-15'));
  console.log(
    '  ✓ Opus voice note ASR/TTS processor and *347*24# USSD state machine verified'
  );
}

console.log(
  '✅ All Sprint 24 Multilingual Agronomy NLU, Voice ASR/TTS & 2G USSD tests passed!'
);
