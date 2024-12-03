/**
 * ==============================================================================
 * 🧪 AGRILY SPRINT 24: MULTILINGUAL AGRONOMY CHATBOT MONGOOSE MODELS UNIT TESTS
 * ==============================================================================
 */

const assert = require('assert');
const AgronomyChatSession = require('../models/AgronomyChatSession');
const MultilingualAgronomyGlossary = require('../models/MultilingualAgronomyGlossary');
const VoiceInteractiveIvrCallLog = require('../models/VoiceInteractiveIvrCallLog');

console.log(
  '🧪 Starting Sprint 24 Multilingual Agronomy Chatbot Mongoose Models Unit Tests...'
);

// 1. Test AgronomyChatSession Schema & Nested Turn Validation
{
  const session = new AgronomyChatSession({
    sessionCode: 'CHAT-AGR-1001',
    farmerId: 'USR-FARMER-2041',
    preferredLocale: 'ha-NG',
    channelType: 'PWA_OFFLINE_FIRST',
    farmerContext: {
      stateName: 'Kano',
      lgaName: 'Kura',
      agroEcologicalZone: 'SUDAN_SAVANNA',
      primaryCropKey: 'MAIZE',
      farmSizeHectares: 3.5,
    },
    turns: [
      {
        turnIndex: 1,
        senderRole: 'FARMER_USER',
        modality: 'VOICE_NOTE_OPUS',
        localeCode: 'ha-NG',
        utteranceText: 'Ganyen masara na yanaโคda launin rawaya kuma tsutsa tana cin ganyen',
        englishTranslation: 'My maize leaves are turning yellow and caterpillars are eating the leaves',
        detectedIntent: 'PEST_IPM_AND_FALL_ARMYWORM',
        intentConfidenceScore: 0.96,
        extractedEntities: {
          cropKey: 'MAIZE',
          stateName: 'Kano',
          symptomOrPest: 'FALL_ARMYWORM',
        },
        audioDurationSeconds: 11,
      },
    ],
  });

  const err = session.validateSync();
  assert.strictEqual(err, undefined, 'Valid AgronomyChatSession should pass validation');
  assert.strictEqual(session.turns.length, 1);
  assert.strictEqual(session.turns[0].localeCode, 'ha-NG');
  console.log('  ✓ AgronomyChatSession schema & nested turn validation verified');
}

// 2. Test MultilingualAgronomyGlossary Schema
{
  const glossaryEntry = new MultilingualAgronomyGlossary({
    glossaryCode: 'GLS-AGR-1001',
    canonicalConceptKey: 'FALL_ARMYWORM_SPODOPTERA',
    domainCategory: 'ENTOMOLOGY_IPM',
    scientificDefinition:
      'Spodoptera frugiperda migratory lepidopteran larva feeding on cereal whorls.',
    translations: [
      {
        localeCode: 'ha-NG',
        indigenousTerm: 'Tsutsar Masara MaiCin Ganye',
        phoneticPronunciation: 'tsu-tsar ma-sa-ra',
        exampleSentenceIndigenous: 'Tsutsar masara ta shiga gonar mu a makon nan.',
        exampleSentenceEnglish: 'Fall armyworm entered our farm this week.',
      },
      {
        localeCode: 'yo-NG',
        indigenousTerm: 'Kokoro Jẹfun-Jẹgbado',
        phoneticPronunciation: 'ko-ko-ro je-gba-do',
        exampleSentenceIndigenous: 'Kokoro jẹgbado ti ba ewe agbado jẹ.',
        exampleSentenceEnglish: 'The armyworm pest has damaged the maize leaves.',
      },
    ],
  });

  const err = glossaryEntry.validateSync();
  assert.strictEqual(err, undefined);
  assert.strictEqual(glossaryEntry.translations.length, 2);
  console.log('  ✓ MultilingualAgronomyGlossary schema validation verified');
}

// 3. Test VoiceInteractiveIvrCallLog Schema & Dynamic SNR-based WER Default
{
  const noisyCall = new VoiceInteractiveIvrCallLog({
    callLogCode: 'IVR-LOG-1001',
    selectedLocale: 'pcm-NG',
    sessionChannel: 'USSD_SHORTCODE_347_24',
    audioCodecMetrics: {
      codecType: 'AMR_NB_8KHZ',
      signalToNoiseRatioDb: 7.5,
    },
  });

  const err = noisyCall.validateSync();
  assert.strictEqual(err, undefined);
  assert.strictEqual(noisyCall.audioCodecMetrics.asrWordErrorRateEst, 0.24);
  console.log(
    '  ✓ VoiceInteractiveIvrCallLog schema & dynamic SNR-to-WER default verified'
  );
}

console.log(
  '✅ All Sprint 24 Multilingual Agronomy Chatbot Mongoose model tests passed!'
);
