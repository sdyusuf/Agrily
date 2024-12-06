/**
 * ==============================================================================
 * 🎙️ AGRILY SPRINT 24: INDIGENOUS SPEECH (ASR/TTS) & 2G GSM USSD (*347*24#)
 *    TELEPHONY BRIDGE SERVICE
 * ==============================================================================
 *
 * Implements:
 *  1. Low-Bitrate Opus (12 kbps) & AMR-NB (8 kHz) Rural Voice Note Framing
 *     and Quantized Whisper-NG ASR Confidence / WER Estimator.
 *  2. Stateful 2G GSM USSD (*347*24#) Interactive Menu State Machine supporting
 *     CON (continue) and END (terminal) screens across Nigerian languages.
 *
 * @module services/indigenousSpeechAndUssdBridgeService
 */

const {
  classifyAndRespondMultilingualAgronomy,
} = require('./multilingualAgronomyNluEngine');

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function roundTo(val, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Simulates offline/edge quantized ASR transcription and VITS neural TTS synthesis
 * for a farmer's voice note across Nigerian languages.
 */
function processIndigenousVoiceNotePacket(params = {}) {
  const localeCode = String(params.localeCode || 'ha-NG');
  const audioDurationSeconds = clamp(
    Number(params.audioDurationSeconds ?? 9.5),
    1.0,
    180.0
  );
  const signalToNoiseRatioDb = clamp(
    Number(params.signalToNoiseRatioDb ?? 19.0),
    -2.0,
    45.0
  );
  const bitrateKbps = clamp(Number(params.bitrateKbps ?? 12.0), 4.75, 64.0);

  const defaultVoiceTranscripts = {
    'ha-NG': 'Tsutsar masara tana cin ganyen masara a gonata a Kura, wane magani zan fesa?',
    'yo-NG': 'Kokoro jegbado ti ba ewe agbado mi je ni oko, egbogi wo ni ki n lo?',
    'ig-NG': 'Ikpuru na-eri akwụkwọ ọka m n’ubi, kedụ ọgwụ m ga-efesa?',
    'pcm-NG': 'Abeg caterpillar dey chop my corn leaf for farm, wetin I go spray?',
    'en-NG': 'Fall armyworm caterpillars are eating my maize whorl leaves, what spray rate should I apply?',
    'ff-NG': 'Gilɗi ɗon nyaama haako butali am nder gese, lekkiuye mbaɗam?',
  };

  const transcriptText =
    params.simulatedTranscript ||
    defaultVoiceTranscripts[localeCode] ||
    defaultVoiceTranscripts['ha-NG'];

  // Estimate ASR Word Error Rate (WER) from SNR (dB) and codec bitrate
  const snrPenalty = Math.max(0, (25 - signalToNoiseRatioDb) * 0.008);
  const estimatedAsrWer = clamp(roundTo(0.045 + snrPenalty, 3), 0.03, 0.35);
  const asrConfidence = roundTo(1 - estimatedAsrWer, 3);

  // Compute compressed Opus audio payload size in KB for 2G EDGE sync
  const opusPayloadKilobytes = roundTo(
    (audioDurationSeconds * bitrateKbps) / 8,
    2
  );

  // Run NLU classification & response generation on transcribed text
  const nluResult = classifyAndRespondMultilingualAgronomy({
    utteranceText: transcriptText,
    preferredLocale: localeCode,
    farmerContext: params.farmerContext || {},
  });

  return {
    localeCode,
    audioDurationSeconds,
    signalToNoiseRatioDb,
    bitrateKbps,
    opusPayloadKilobytes,
    estimatedAsrWer,
    asrConfidence,
    transcriptText,
    ttsVoiceProfile: `VITS-${localeCode.toUpperCase()}-NEURAL-V2`,
    nluResult,
  };
}

/**
 * Evaluates a 2G GSM USSD (*347*24#) interactive session string (e.g. "", "1", "1*2")
 * and returns telecom-standard CON / END screen text (<= 182 characters per GSM page).
 */
function evaluateUssdAgronomySession(params = {}) {
  const serviceCode = String(params.serviceCode || '*347*24#');
  const sessionId = String(params.sessionId || 'USSD-SES-9001');
  const phoneNumber = String(params.phoneNumber || '+2348030001122');
  const rawText = String(params.text || '').trim();

  const hops = rawText === '' ? [] : rawText.split('*');

  // Level 0: Language Selection Root Menu
  if (hops.length === 0) {
    return {
      sessionId,
      serviceCode,
      phoneNumber,
      sessionState: 'CON',
      localeCode: 'en-NG',
      screenText:
        'CON Welcome to Agrily AI (*347*24#)\n1. Hausa (Noma)\n2. Yoruba (Agbe)\n3. Igbo (Oru Ugbo)\n4. Naija Pidgin\n5. English',
    };
  }

  const langChoice = hops[0];
  const localeMap = {
    '1': 'ha-NG',
    '2': 'yo-NG',
    '3': 'ig-NG',
    '4': 'pcm-NG',
    '5': 'en-NG',
  };
  const localeCode = localeMap[langChoice] || 'en-NG';

  // Level 1: Topic Menu in chosen language
  if (hops.length === 1) {
    const topicMenus = {
      'ha-NG':
        'CON Zabi matsalar gona:\n1. Maganin Tsutsar Masara\n2. Yawan Takin NPK/Urea\n3. Ban Ruwa (Rani)\n4. Farashin Kasuwa',
      'yo-NG':
        'CON E yan iranlowo:\n1. Ogun Kokoro Agbado\n2. Iwọn Ajile NPK/Urea\n3. Omi Oko (Ogbele)\n4. Iye Owo Oja',
      'ig-NG':
        'CON Họrọ enyemaka:\n1. Ọgwụ Ikpuru Ọka\n2. Nri Ala NPK/Urea\n3. Mmiri Ubi (Ọkọchị)\n4. Ọnụahịa Ahịa',
      'pcm-NG':
        'CON Choose farm help:\n1. Corn Caterpillar Medicine\n2. NPK/Urea Fertilizer Measure\n3. Dry Season Water Pump\n4. Market Price Today',
      'en-NG':
        'CON Select Agronomy Advisory:\n1. Fall Armyworm Spray\n2. NPK/Urea Fertilizer Rate\n3. Dry-Season Irrigation\n4. Live Market Prices',
    };

    return {
      sessionId,
      serviceCode,
      phoneNumber,
      sessionState: 'CON',
      localeCode,
      screenText: topicMenus[localeCode] || topicMenus['en-NG'],
    };
  }

  // Level 2: Terminal Advisory Response (END) + SMS Dispatch Flag
  const topicChoice = hops[1];
  const terminalReplies = {
    '1': {
      'ha-NG':
        'END Fesa Emamectin 5% WG (250g/ha) ko ruwan Neem 2.5L/ha da safe kafin karfe 9. An turo cikakken bayani ta SMS.',
      'yo-NG':
        'END E fon Emamectin 5% WG (250g/ha) tabi omi Dongoyaro ni owuro ki o to di aago mesan. SMS ti wa.',
      'ig-NG':
        'END Fesaa Emamectin 5% WG (250g/ha) ma ọ bụ mmiri Neem n’ụtụtụ tupu elekere 9. Ezipụla SMS.',
      'pcm-NG':
        'END Spray Emamectin 5% WG (250g/ha) or Neem oil early morning before 9am. Full SMS don land.',
      'en-NG':
        'END Apply Emamectin benzoate 5% WG at 250g/ha or Neem extract 2.5L/ha before 09:00. Full guide sent via SMS.',
    },
    '2': {
      'ha-NG':
        'END Sa buhu 4 na NPK 15-15-15 a kadada (mako 2 bayan shuka) da Urea a mako na 5.',
      'yo-NG':
        'END E lo apo merin NPK 15-15-15 ni ose keji leyin ogbin, ki e fi Urea kun ni ose karun-un.',
      'ig-NG':
        'END Tinye akpa 4 NPK 15-15-15 n’izu 2 mgbe ị kụchara mkpụrụ, tinye Urea n’izu 5.',
      'pcm-NG':
        'END Put 4 bag NPK 15-15-15 per hectare for Week 2, then add Urea top-dressing for Week 5.',
      'en-NG':
        'END Apply 4 bags/ha (200kg) NPK 15-15-15 at 2 WAP in a 5cm ring, then top-dress Urea at 5 WAP.',
    },
    '3': {
      'ha-NG':
        'END Kunna injin ban ruwa (48-55mm) da sanyin safiya idan kasa ta kai bushewar 45 kPa.',
      'yo-NG':
        'END E si ero omi (48-55mm) ni owuro kutukutu nigba ti ile ba gbe de 45 kPa.',
      'ig-NG':
        'END Gbanye ígwè mmiri (48-55mm) n’isi ụtụtụ mgbe ala kpọrọ nkụ rụọ 45 kPa.',
      'pcm-NG':
        'END On your water pump (48-55mm) early morning once soil dry reach 45 kPa tension.',
      'en-NG':
        'END Trigger 48-55mm drip refill early morning when tensiometer suction exceeds 45 kPa.',
    },
    '4': {
      'ha-NG':
        'END Farashin yau: Masara N780,000/t, Shinkafa N890,000/t, Waken Soya N940,000/t.',
      'yo-NG':
        'END Iye oja loni: Agbado N780,000/t, Iresi N890,000/t, Soya N940,000/t.',
      'ig-NG':
        'END Ọnụahịa taa: Ọka N780,000/t, Osikapa N890,000/t, Soya N940,000/t.',
      'pcm-NG':
        'END Market price today: Dry Corn N780,000/t, Paddy Rice N890,000/t, Soybean N940,000/t.',
      'en-NG':
        'END Benchmark Prices: Dry Maize N780,000/t, Paddy Rice N890,000/t, Soybeans N940,000/t.',
    },
  };

  const selectedTopicGroup = terminalReplies[topicChoice] || terminalReplies['1'];
  const screenText =
    selectedTopicGroup[localeCode] || selectedTopicGroup['en-NG'];

  return {
    sessionId,
    serviceCode,
    phoneNumber,
    sessionState: 'END',
    localeCode,
    smsFollowupQueued: true,
    screenText,
  };
}

module.exports = {
  processIndigenousVoiceNotePacket,
  evaluateUssdAgronomySession,
};
