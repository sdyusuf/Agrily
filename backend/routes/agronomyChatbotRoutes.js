/**
 * ==============================================================================
 * 💬 AGRILY SPRINT 24: MULTILINGUAL AGRONOMY CHATBOT REST API ROUTES
 * ==============================================================================
 *
 * Endpoints:
 *   GET  /api/agronomy-chatbot/sessions         - List active multilingual farmer dialogue sessions
 *   GET  /api/agronomy-chatbot/glossary         - List NAERLS/IITA indigenous agronomy glossary terms
 *   POST /api/agronomy-chatbot/message          - Classify farmer utterance & return localized + English RAG reply
 *   POST /api/agronomy-chatbot/voice-transcribe - Process Opus/AMR voice note & synthesize VITS neural TTS response
 *   POST /api/agronomy-chatbot/ussd-session     - Handle stateful 2G GSM USSD (*347*24#) interactive menu hops
 *
 * @module routes/agronomyChatbotRoutes
 */

const express = require('express');
const router = express.Router();

const {
  AGRONOMY_INTENT_CATALOG,
  classifyAndRespondMultilingualAgronomy,
} = require('../services/multilingualAgronomyNluEngine');
const {
  processIndigenousVoiceNotePacket,
  evaluateUssdAgronomySession,
} = require('../services/indigenousSpeechAndUssdBridgeService');

const SEED_CHAT_SESSIONS = [
  {
    sessionCode: 'CHAT-AGR-1001',
    farmerName: 'Malam Musa Danjuma',
    preferredLocale: 'ha-NG',
    channelType: 'PWA_OFFLINE_FIRST',
    farmerContext: {
      stateName: 'Kano',
      lgaName: 'Kura',
      agroEcologicalZone: 'SUDAN_SAVANNA',
      primaryCropKey: 'MAIZE',
      farmSizeHectares: 3.5,
      offlineCacheSynced: true,
    },
    turns: [
      {
        turnIndex: 1,
        senderRole: 'FARMER_USER',
        modality: 'VOICE_NOTE_OPUS',
        localeCode: 'ha-NG',
        utteranceText:
          'Sannu Agrily, tsutsar masara tana cin ganyen masara a gonata a Kura, wane magani zan fesa?',
        englishTranslation:
          'Hello Agrily, fall armyworm caterpillars are eating my maize leaves on my farm in Kura, what medicine should I spray?',
        detectedIntent: 'PEST_IPM_AND_FALL_ARMYWORM',
        intentConfidenceScore: 0.96,
      },
      {
        turnIndex: 2,
        senderRole: 'AGRONOMY_AI_ASSISTANT',
        modality: 'TEXT_MESSAGE',
        localeCode: 'ha-NG',
        utteranceText:
          AGRONOMY_INTENT_CATALOG.PEST_IPM_AND_FALL_ARMYWORM.localizedAdvisories[
            'ha-NG'
          ],
        englishTranslation:
          AGRONOMY_INTENT_CATALOG.PEST_IPM_AND_FALL_ARMYWORM.localizedAdvisories[
            'en-NG'
          ],
        detectedIntent: 'PEST_IPM_AND_FALL_ARMYWORM',
        intentConfidenceScore: 0.96,
        ragCitationBulletinIds: ['IITA-IPM-FAW-2024-01', 'NAERLS-ENT-2024-09'],
      },
    ],
  },
  {
    sessionCode: 'CHAT-AGR-1002',
    farmerName: 'Chief Mrs. Folake Adeyemi',
    preferredLocale: 'yo-NG',
    channelType: 'WHATSAPP_BRIDGE',
    farmerContext: {
      stateName: 'Oyo',
      lgaName: 'Iseyin',
      agroEcologicalZone: 'DERIVED_SAVANNA',
      primaryCropKey: 'MAIZE',
      farmSizeHectares: 5.0,
      offlineCacheSynced: true,
    },
    turns: [
      {
        turnIndex: 1,
        senderRole: 'FARMER_USER',
        modality: 'TEXT_MESSAGE',
        localeCode: 'yo-NG',
        utteranceText:
          'E kaaro, iwon ajile NPK 15-15-15 ati Urea melo ni mo le lo fun saare agbado kan?',
        englishTranslation:
          'Good morning, how many bags of NPK 15-15-15 and Urea should I apply per hectare of maize?',
        detectedIntent: 'NPK_FERTILIZER_DOSING',
        intentConfidenceScore: 0.95,
      },
      {
        turnIndex: 2,
        senderRole: 'AGRONOMY_AI_ASSISTANT',
        modality: 'TEXT_MESSAGE',
        localeCode: 'yo-NG',
        utteranceText:
          AGRONOMY_INTENT_CATALOG.NPK_FERTILIZER_DOSING.localizedAdvisories['yo-NG'],
        englishTranslation:
          AGRONOMY_INTENT_CATALOG.NPK_FERTILIZER_DOSING.localizedAdvisories['en-NG'],
        detectedIntent: 'NPK_FERTILIZER_DOSING',
        intentConfidenceScore: 0.95,
        ragCitationBulletinIds: ['NAERLS-FERT-2024-04', 'IITA-4R-NUTRIENT-2024'],
      },
    ],
  },
];

const SEED_MULTILINGUAL_GLOSSARY = [
  {
    glossaryCode: 'GLS-AGR-1001',
    canonicalConceptKey: 'FALL_ARMYWORM_SPODOPTERA',
    domainCategory: 'ENTOMOLOGY_IPM',
    scientificDefinition:
      'Spodoptera frugiperda migratory lepidopteran larva feeding inside cereal whorls.',
    translations: [
      {
        localeCode: 'ha-NG',
        indigenousTerm: 'Tsutsar Masara (Mai Cin Ganye)',
        phoneticPronunciation: 'tsu-tsar ma-sa-ra',
        exampleSentenceIndigenous: 'Tsutsar masara ta shiga gonar mu a makon nan.',
        exampleSentenceEnglish: 'Fall armyworm entered our farm this week.',
      },
      {
        localeCode: 'yo-NG',
        indigenousTerm: 'Kòkòrò Jẹ́gbàdo',
        phoneticPronunciation: 'ko-ko-ro je-gba-do',
        exampleSentenceIndigenous: 'Kòkòrò jẹ́gbàdo ti ba ewé àgbàdo jẹ́.',
        exampleSentenceEnglish: 'The armyworm pest has damaged the maize leaves.',
      },
      {
        localeCode: 'ig-NG',
        indigenousTerm: 'Ikpuru Na-Eri Ọka',
        phoneticPronunciation: 'i-kpu-ru na e-ri o-ka',
        exampleSentenceIndigenous: 'Ikpuru na-eri ọka emebiwo akwụkwọ ọka.',
        exampleSentenceEnglish: 'Fall armyworm has damaged the maize foliage.',
      },
      {
        localeCode: 'pcm-NG',
        indigenousTerm: 'Corn Whorl Caterpillar',
        phoneticPronunciation: 'korn ka-ta-pi-la',
        exampleSentenceIndigenous: 'Dem caterpillar dey chop central corn leaf.',
        exampleSentenceEnglish: 'The caterpillars are feeding on the central maize whorl.',
      },
    ],
  },
  {
    glossaryCode: 'GLS-AGR-1002',
    canonicalConceptKey: 'SPLIT_UREA_TOP_DRESSING',
    domainCategory: 'SOIL_FERTILITY_NPK',
    scientificDefinition:
      'Subsurface side-banding of Urea (46% N) at vegetative knee-high stage to prevent ammonia volatilization.',
    translations: [
      {
        localeCode: 'ha-NG',
        indigenousTerm: 'Takin Zamani Na Urea (Rufewa A Rami)',
        phoneticPronunciation: 'ta-kin u-re-a',
        exampleSentenceIndigenous: 'A binne takin Urea a rami mai zurfin santimita 5.',
        exampleSentenceEnglish: 'Bury Urea fertilizer in a 5 cm deep trench.',
      },
      {
        localeCode: 'yo-NG',
        indigenousTerm: 'Ajílẹ̀ Urea Onípele Kejì',
        phoneticPronunciation: 'a-ji-le u-re-a',
        exampleSentenceIndigenous: 'Ẹ bo ajílẹ̀ Urea mọ́ inú ilẹ̀ kí oorun má baà gba agbára rẹ̀.',
        exampleSentenceEnglish: 'Cover Urea fertilizer with soil to prevent volatilization.',
      },
      {
        localeCode: 'ig-NG',
        indigenousTerm: 'Nri Ala Urea Nke Abụọ',
        phoneticPronunciation: 'n-ri a-la u-re-a',
        exampleSentenceIndigenous: 'Lie nri ala Urea n’ime ala dị cm 5.',
        exampleSentenceEnglish: 'Bury Urea fertilizer 5 cm deep in the soil.',
      },
      {
        localeCode: 'pcm-NG',
        indigenousTerm: 'Second-Round Urea Top-Dressing',
        phoneticPronunciation: 'u-re-a top dre-sin',
        exampleSentenceIndigenous: 'Bury the Urea inside small hole near root cover am.',
        exampleSentenceEnglish: 'Bury the Urea in a small hole near the root and cover it.',
      },
    ],
  },
  {
    glossaryCode: 'GLS-AGR-1003',
    canonicalConceptKey: 'HERMETIC_PICS_AFLATOXIN_BARRIER',
    domainCategory: 'POST_HARVEST_STORAGE',
    scientificDefinition:
      'Triple-layer high-density polyethylene hermetic storage bag that depletes oxygen to <2% and halts Aspergillus flavus.',
    translations: [
      {
        localeCode: 'ha-NG',
        indigenousTerm: 'Buhun Ajiya Mai Leda Uku (PICS)',
        phoneticPronunciation: 'bu-hun piks',
        exampleSentenceIndigenous: 'Buhun PICS yana kashe kwari ba tare da maganin feshin guba ba.',
        exampleSentenceEnglish: 'PICS bags kill weevils without toxic chemical fumigants.',
      },
      {
        localeCode: 'yo-NG',
        indigenousTerm: 'Àpò Ìpamọ́ Onípele-Mẹ́ta (PICS)',
        phoneticPronunciation: 'a-po piks',
        exampleSentenceIndigenous: 'Àpò PICS máa ń pa kòkòrò ọkà láìsí oògùn olóró.',
        exampleSentenceEnglish: 'PICS bags suffocate grain pests without toxic chemicals.',
      },
      {
        localeCode: 'ig-NG',
        indigenousTerm: 'Akpa Nchekwa PICS Nwere Akwa Atọ',
        phoneticPronunciation: 'a-kpa piks',
        exampleSentenceIndigenous: 'Akpa PICS na-egbochi ụmụ ahụhụ na Aflatoxin.',
        exampleSentenceEnglish: 'PICS bags prevent storage weevils and aflatoxin.',
      },
      {
        localeCode: 'pcm-NG',
        indigenousTerm: 'Three-Nylon Airtight PICS Bag',
        phoneticPronunciation: 'tri nai-lon piks bag',
        exampleSentenceIndigenous: 'Tie your dry corn inside PICS bag make weevil quench.',
        exampleSentenceEnglish: 'Seal your dry maize inside a PICS bag to suffocate weevils.',
      },
    ],
  },
];

/**
 * GET /api/agronomy-chatbot/sessions
 * Returns active multilingual farmer chat sessions.
 */
router.get('/sessions', (req, res) => {
  res.status(200).json({
    success: true,
    count: SEED_CHAT_SESSIONS.length,
    sessions: SEED_CHAT_SESSIONS,
  });
});

/**
 * GET /api/agronomy-chatbot/glossary
 * Returns NAERLS & IITA verified indigenous agronomy glossary entries.
 */
router.get('/glossary', (req, res) => {
  const { localeCode, domainCategory } = req.query;
  let entries = [...SEED_MULTILINGUAL_GLOSSARY];

  if (domainCategory) {
    entries = entries.filter(
      (g) => g.domainCategory.toUpperCase() === String(domainCategory).toUpperCase()
    );
  }
  if (localeCode) {
    entries = entries.map((g) => ({
      ...g,
      translations: g.translations.filter((t) => t.localeCode === localeCode),
    }));
  }

  res.status(200).json({
    success: true,
    count: entries.length,
    glossary: entries,
  });
});

/**
 * POST /api/agronomy-chatbot/message
 * Classifies a farmer's multilingual text query and generates an indigenous + English response.
 */
router.post('/message', (req, res) => {
  const body = req.body || {};
  if (!body.utteranceText || !String(body.utteranceText).trim()) {
    return res.status(400).json({
      success: false,
      message: 'utteranceText is required.',
    });
  }

  const nluResponse = classifyAndRespondMultilingualAgronomy({
    utteranceText: body.utteranceText,
    preferredLocale: body.preferredLocale || null,
    farmerContext: body.farmerContext || {},
  });

  res.status(200).json({
    success: true,
    nluResponse,
  });
});

/**
 * POST /api/agronomy-chatbot/voice-transcribe
 * Processes a low-bitrate Opus/AMR voice note and returns ASR transcript + VITS TTS response.
 */
router.post('/voice-transcribe', (req, res) => {
  const body = req.body || {};
  const voiceResult = processIndigenousVoiceNotePacket(body);

  res.status(200).json({
    success: true,
    voiceResult,
  });
});

/**
 * POST /api/agronomy-chatbot/ussd-session
 * Evaluates a stateful 2G GSM USSD (*347*24#) session hop.
 */
router.post('/ussd-session', (req, res) => {
  const body = req.body || {};
  const ussdResult = evaluateUssdAgronomySession(body);

  res.status(200).json({
    success: true,
    ussdResult,
  });
});

module.exports = router;
