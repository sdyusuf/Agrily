/**
 * ==============================================================================
 * 🗣️ AGRILY SPRINT 24: DIALECT CODE-SWITCHING PARSER, LEVENSHTEIN ORTHOGRAPHIC
 *    SPELL-CHECKER, TONAL DIACRITIC RESTORER & OFFLINE PWA SYNC ENGINE
 * ==============================================================================
 *
 * Implements:
 *  1. Wagner-Fischer Dynamic Programming Levenshtein Edit Distance (O(m*n))
 *     for correcting rural SMS/WhatsApp typos in Hausa, Yoruba, Igbo & Pidgin.
 *  2. Intra-Sentential Code-Switching Matrix:
 *       Computes Code-Mixing Index (CMI) after Gambäck & Das (2016):
 *       CMI = 100 * (1 - max(w_lang) / (N - u))
 *  3. Canonical Tonal & Sub-Dot Diacritic Restorer for Yoruba (ẹ, ọ, ṣ),
 *     Igbo (ị, ọ, ụ, ṅ), and Hausa glottalized consonants (ɓ, ɗ, ƙ).
 *  4. Offline-First PWA IndexedDB Quantized Int8 NLU Model Delta Sync Calculator.
 *
 * @module services/dialectCodeSwitchingAndPhoneticsEngine
 */

const { normalizeAndTokenize } = require('./multilingualAgronomyNluEngine');

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function roundTo(val, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Canonical Dictionary of Indigenous Agronomy Terms with Tonal/Glottal Diacritics
 */
const CANONICAL_INDIGENOUS_ORTHOGRAPHY = {
  // Hausa (ha-NG)
  tsutsa: { canonical: 'tsutsa', locale: 'ha-NG', gloss: 'caterpillar / worm' },
  tsutsar: { canonical: 'tsutsar', locale: 'ha-NG', gloss: 'caterpillar of' },
  masara: { canonical: 'masara', locale: 'ha-NG', gloss: 'maize' },
  shinkafa: { canonical: 'shinkafa', locale: 'ha-NG', gloss: 'rice' },
  rogo: { canonical: 'rogo', locale: 'ha-NG', gloss: 'cassava' },
  taki: { canonical: 'taki', locale: 'ha-NG', gloss: 'fertilizer' },
  kasa: { canonical: 'ƙasa', locale: 'ha-NG', gloss: 'soil' },
  buhu: { canonical: 'buhu', locale: 'ha-NG', gloss: 'sack / bag' },
  kwari: { canonical: 'ƙwari', locale: 'ha-NG', gloss: 'insect pests' },
  banruwa: { canonical: 'ban-ruwa', locale: 'ha-NG', gloss: 'irrigation' },

  // Yoruba (yo-NG)
  kokoro: { canonical: 'kòkòrò', locale: 'yo-NG', gloss: 'insect pest' },
  jegbado: { canonical: 'jẹ́gbàdo', locale: 'yo-NG', gloss: 'maize-eater (armyworm)' },
  agbado: { canonical: 'àgbàdo', locale: 'yo-NG', gloss: 'maize' },
  ajile: { canonical: 'ajílẹ̀', locale: 'yo-NG', gloss: 'fertilizer' },
  ewe: { canonical: 'ewé', locale: 'yo-NG', gloss: 'foliage / leaf' },
  arun: { canonical: 'àrùn', locale: 'yo-NG', gloss: 'crop disease' },
  ogbele: { canonical: 'ọ̀gbẹlẹ̀', locale: 'yo-NG', gloss: 'drought / dry season' },
  iresi: { canonical: 'ìrẹsì', locale: 'yo-NG', gloss: 'rice' },
  ewa: { canonical: 'ẹ̀wà', locale: 'yo-NG', gloss: 'cowpea / beans' },

  // Igbo (ig-NG)
  ikpuru: { canonical: 'ikpuru', locale: 'ig-NG', gloss: 'caterpillar / larva' },
  ahuhu: { canonical: 'ụmụ ahụhụ', locale: 'ig-NG', gloss: 'insects' },
  oka: { canonical: 'ọka', locale: 'ig-NG', gloss: 'maize' },
  akpu: { canonical: 'akpụ', locale: 'ig-NG', gloss: 'cassava' },
  osikapa: { canonical: 'osikapa', locale: 'ig-NG', gloss: 'rice' },
  akwukwo: { canonical: 'akwụkwọ', locale: 'ig-NG', gloss: 'leaf' },
  oria: { canonical: 'ọrịa', locale: 'ig-NG', gloss: 'disease' },
  okochi: { canonical: 'ọkọchị', locale: 'ig-NG', gloss: 'dry season' },
  mmiri: { canonical: 'mmiri', locale: 'ig-NG', gloss: 'water / irrigation' },

  // Nigerian Pidgin (pcm-NG)
  abeg: { canonical: 'abeg', locale: 'pcm-NG', gloss: 'please' },
  wetin: { canonical: 'wetin', locale: 'pcm-NG', gloss: 'what' },
  chop: { canonical: 'chop', locale: 'pcm-NG', gloss: 'eat / damage' },
  comot: { canonical: 'comot', locale: 'pcm-NG', gloss: 'remove / rogue' },
};

/**
 * Computes Wagner-Fischer Levenshtein edit distance between two strings.
 */
function computeLevenshteinDistance(strA = '', strB = '') {
  const a = String(strA).toLowerCase();
  const b = String(strB).toLowerCase();
  const m = a.length;
  const n = b.length;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Performs fuzzy orthographic spell-correction and tonal diacritic restoration
 * on noisy rural SMS/WhatsApp farmer text, and computes Gambäck-Das Code-Mixing Index (CMI).
 */
function analyzeCodeSwitchingAndRestoreOrthography(params = {}) {
  const rawUtterance = String(
    params.rawUtterance || 'Abeg kokro jegbdo don chop my agbdo leaf for Oyo'
  );
  const tokens = normalizeAndTokenize(rawUtterance);
  const knownKeys = Object.keys(CANONICAL_INDIGENOUS_ORTHOGRAPHY);

  const localeTokenCounts = {
    'ha-NG': 0,
    'yo-NG': 0,
    'ig-NG': 0,
    'pcm-NG': 0,
    'en-NG': 0,
  };

  const correctedTokens = [];
  const diacriticRestoredTokens = [];
  const spellCorrections = [];

  for (const tok of tokens) {
    if (CANONICAL_INDIGENOUS_ORTHOGRAPHY[tok]) {
      const entry = CANONICAL_INDIGENOUS_ORTHOGRAPHY[tok];
      localeTokenCounts[entry.locale] =
        (localeTokenCounts[entry.locale] || 0) + 1;
      correctedTokens.push(tok);
      diacriticRestoredTokens.push(entry.canonical);
      continue;
    }

    // Fuzzy Levenshtein match for tokens of length >= 4 (max edit distance = 1 or 2 for >=6 chars)
    let bestKey = null;
    let bestDist = 99;
    if (tok.length >= 4) {
      for (const k of knownKeys) {
        if (Math.abs(k.length - tok.length) > 2) continue;
        const dist = computeLevenshteinDistance(tok, k);
        const maxAllowed = k.length >= 6 ? 2 : 1;
        if (dist <= maxAllowed && dist < bestDist && tok[0] === k[0]) {
          bestDist = dist;
          bestKey = k;
        }
      }
    }

    if (bestKey) {
      const entry = CANONICAL_INDIGENOUS_ORTHOGRAPHY[bestKey];
      localeTokenCounts[entry.locale] =
        (localeTokenCounts[entry.locale] || 0) + 1;
      correctedTokens.push(bestKey);
      diacriticRestoredTokens.push(entry.canonical);
      spellCorrections.push({
        originalToken: tok,
        correctedAscii: bestKey,
        restoredCanonical: entry.canonical,
        editDistance: bestDist,
        locale: entry.locale,
      });
    } else {
      localeTokenCounts['en-NG'] += 1;
      correctedTokens.push(tok);
      diacriticRestoredTokens.push(tok);
    }
  }

  // Compute Gambäck & Das (2016) Code-Mixing Index (CMI)
  const totalWords = Math.max(1, tokens.length);
  const maxSingleLangWords = Math.max(...Object.values(localeTokenCounts));
  const codeMixingIndexCmi = roundTo(
    100 * (1 - maxSingleLangWords / totalWords),
    1
  );

  const activeLocales = Object.entries(localeTokenCounts)
    .filter(([, count]) => count > 0)
    .map(([loc]) => loc);

  return {
    rawUtterance,
    correctedAsciiSentence: correctedTokens.join(' '),
    diacriticRestoredSentence: diacriticRestoredTokens.join(' '),
    spellCorrections,
    localeTokenCounts,
    activeLocales,
    isCodeSwitched: activeLocales.length >= 2 && codeMixingIndexCmi > 12,
    codeMixingIndexCmi,
  };
}

/**
 * Estimates offline-first PWA IndexedDB quantized Int8 NLU & glossary pack size
 * and delta synchronization time over rural 2G EDGE / 3G HSPA networks.
 */
function estimateOfflinePwaModelSyncMetrics(params = {}) {
  const installedLocales = Array.isArray(params.installedLocales)
    ? params.installedLocales
    : ['ha-NG', 'yo-NG', 'ig-NG', 'pcm-NG', 'en-NG'];
  const networkThroughputKbps = clamp(
    Number(params.networkThroughputKbps ?? 32.0), // 2G EDGE typical rural throughput
    8.0,
    5000.0
  );
  const deltaChangedBulletinCount = clamp(
    Number(params.deltaChangedBulletinCount ?? 4),
    0,
    50
  );

  const baseQuantizedBm25AndEmbedKb = 420;
  const perLocaleLexiconAndProsodyKb = 185;
  const fullOfflineBundleKilobytes =
    baseQuantizedBm25AndEmbedKb +
    installedLocales.length * perLocaleLexiconAndProsodyKb;

  // Broom/Brotli delta patch size (approx. 6.5 KB per updated extension bulletin)
  const deltaPatchKilobytes = roundTo(
    Math.max(4.5, deltaChangedBulletinCount * 6.5),
    1
  );

  const deltaSyncDurationSeconds = roundTo(
    (deltaPatchKilobytes * 8) / networkThroughputKbps,
    2
  );

  return {
    installedLocales,
    fullOfflineBundleKilobytes,
    deltaPatchKilobytes,
    networkThroughputKbps,
    deltaSyncDurationSeconds,
    offlineReadyState:
      deltaSyncDurationSeconds <= 15
        ? 'FAST_2G_DELTA_SYNC_READY'
        : 'DEFERRED_BACKGROUND_SYNC_QUEUED',
  };
}

module.exports = {
  CANONICAL_INDIGENOUS_ORTHOGRAPHY,
  computeLevenshteinDistance,
  analyzeCodeSwitchingAndRestoreOrthography,
  estimateOfflinePwaModelSyncMetrics,
};
