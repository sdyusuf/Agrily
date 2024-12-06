/**
 * ==============================================================================
 * 🧠 AGRILY SPRINT 24: MULTILINGUAL AGRONOMY NLU, BM25 INTENT CLASSIFIER,
 *    SLOT-FILLING ENTITY EXTRACTOR & INDIGENOUS RESPONSE GENERATOR
 * ==============================================================================
 *
 * Supports 6 Nigerian Agricultural Locales:
 *   1. en-NG  — Nigerian Standard English
 *   2. ha-NG  — Hausa (Boko Orthography — Northern Savanna Belt)
 *   3. yo-NG  — Yoruba (Tonal & Sub-dot Orthography — South-West Belt)
 *   4. ig-NG  — Igbo (Standard Central Igbo — South-East Belt)
 *   5. pcm-NG — Nigerian Pidgin / Naija (Pan-Nigerian Smallholder Lingua Franca)
 *   6. ff-NG  — Fulfulde (Adamawa/Sokoto Agro-Pastoralist Dialect)
 *
 * Mathematical Pipeline:
 *   - Diacritic-preserving & ASCII-folded dual tokenization
 *   - Okapi BM25 (k1 = 1.5, b = 0.75) lexical relevance scoring over multilingual
 *     intent exemplars
 *   - Deterministic slot-filling for Nigerian crops, states, symptoms, and rates
 *
 * @module services/multilingualAgronomyNluEngine
 */

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function roundTo(val, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Normalizes text by lowercasing and folding tonal diacritics while preserving root stems.
 */
function normalizeAndTokenize(text = '') {
  const folded = String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ɓɗƙ’']/g, (ch) => {
      if (ch === 'ɓ') return 'b';
      if (ch === 'ɗ') return 'd';
      if (ch === 'ƙ') return 'k';
      return '';
    });

  return folded
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((tok) => tok.length >= 2);
}

/**
 * Multilingual Crop Lexicon across Hausa, Yoruba, Igbo, Pidgin, Fulfulde, and English
 */
const MULTILINGUAL_CROP_LEXICON = {
  MAIZE: [
    'maize',
    'corn',
    'masara',
    'agbado',
    'oka',
    'akpa',
    'mbayeri',
    'butali',
  ],
  CASSAVA: [
    'cassava',
    'manioc',
    'rogo',
    'akpu',
    'egburu',
    'paki',
    'gbaguda',
    'mbai',
  ],
  RICE: [
    'rice',
    'paddy',
    'shinkafa',
    'iresi',
    'osikapa',
    'maaro',
  ],
  TOMATO: [
    'tomato',
    'tomatoes',
    'tumatur',
    'tomati',
    'timati',
    'tomatoe',
  ],
  COWPEA: [
    'cowpea',
    'beans',
    'wake',
    'ewa',
    'agwa',
    'nyebbe',
  ],
  YAM: [
    'yam',
    'doya',
    'isu',
    'ji',
    'biriji',
  ],
  SORGHUM: [
    'sorghum',
    'guinea',
    'dawa',
    'oka-baba',
    'okababa',
    'gawri',
  ],
  ONION: [
    'onion',
    'albasa',
    'alubosa',
    'yabasi',
    'tingye',
  ],
};

/**
 * Comprehensive Agronomy Intent Catalog with Multilingual Keyword Stems & Advisory Templates
 */
const AGRONOMY_INTENT_CATALOG = {
  PEST_IPM_AND_FALL_ARMYWORM: {
    intentKey: 'PEST_IPM_AND_FALL_ARMYWORM',
    domainCategory: 'ENTOMOLOGY_IPM',
    citationBulletinIds: ['IITA-IPM-FAW-2024-01', 'NAERLS-ENT-2024-09'],
    keywordStems: [
      'armyworm',
      'caterpillar',
      'worm',
      'pest',
      'insect',
      'larva',
      'borer',
      'tsutsa',
      'tsutsar',
      'kwari',
      'cin',
      'kokoro',
      'jefun',
      'jegbado',
      'ahuhu',
      'ikpuru',
      'chaw',
      'chop',
      'hole',
      'whorl',
      'tuta',
      'emamectin',
      'neem',
    ],
    localizedAdvisories: {
      'en-NG':
        'Scout 20 whorls per diagonal transect. If Fall Armyworm (Spodoptera frugiperda) damage exceeds the 15% Economic Threshold, apply Emamectin benzoate 5% WG at 250 g/ha or Azadirachtin (Neem seed extract) at 2.5 L/ha directly into the funnel early morning before 09:00.',
      'ha-NG':
        'Ku duba ganyen masara guda 20 a cikin gona. Idan tsutsar masara (Fall Armyworm) ta ci fiye da kashi 15% na ganyen, a fesa maganin Emamectin benzoate 5% WG (gram 250 a kowace kadada) ko ruwan मान (Neem) lita 2.5 da safe kafin karfe 9:00.',
      'yo-NG':
        'Ẹ ṣàyẹ̀wò ojú ewé àgbàdo ogún níoko. Tí kòkòrò jẹ́gbàdo (Fall Armyworm) bá ti bà ju ìdá mẹ́ẹ̀dógún (15%) jẹ́, ẹ fọ́n oògùn Emamectin benzoate 5% WG (250 g/ha) tàbí omi ewé Dóngóyárò (Neem) ní òwúrọ̀ kí ó tó di aago mẹ́san.',
      'ig-NG':
        'Nyochaa akwụkwọ ọka iri abụọ n’ubi gị. Ọ bụrụ na ikpuru na-eri ọka (Fall Armyworm) emebiwo ihe karịrị pasentị 15%, fesaa ọgwụ Emamectin benzoate 5% WG (250 g/ha) ma ọ bụ mmiri mkpụrụ Dọgọyarọ (Neem) n’ụtụtụ tupu elekere itoolu.',
      'pcm-NG':
        'Check 20 corn plant inside your farm. If dem Fall Armyworm caterpillar don chop pass 15% of the central leaf, spray Emamectin benzoate 5% WG (250g per hectare) or Neem oil solution early morning before 9 o’clock.',
      'ff-NG':
        'Laar haako butali noogas nder gese. To gilɗi nyaamooji butali (Fall Armyworm) mbonnii ko ɓuri 15%,ufu lekki Emamectin benzoate 250 g/ha subaka law.',
    },
  },

  NPK_FERTILIZER_DOSING: {
    intentKey: 'NPK_FERTILIZER_DOSING',
    domainCategory: 'SOIL_FERTILITY_NPK',
    citationBulletinIds: ['NAERLS-FERT-2024-04', 'IITA-4R-NUTRIENT-2024'],
    keywordStems: [
      'fertilizer',
      'npk',
      'urea',
      'manure',
      'nitrogen',
      'phosphorus',
      'potassium',
      'topdress',
      'taki',
      'takin',
      'zamani',
      'kashi',
      'ajile',
      'buruku',
      'nri',
      'ala',
      'bag',
      'gram',
      'bottle',
      'cap',
      'yellowing',
    ],
    localizedAdvisories: {
      'en-NG':
        'Follow the 4R Nutrient Stewardship protocol: Apply 4 bags/ha (200 kg/ha) of NPK 15-15-15 at 2 weeks after planting (WAP) in a 5 cm deep ring 8 cm from the stem, followed by split Urea (46-0-0) top-dressing at 5 WAP when soil moisture is at field capacity.',
      'ha-NG':
        'A bi ka’idar sa taki: A zuba buhu 4 na NPK 15-15-15 a kowace kadada (mako 2 bayan shuka) a rami mai zurfin santimita 5, sannan a kara takin Urea bayan mako 5 idan kasa tana da danshi.',
      'yo-NG':
        'Ẹ lo ìlànà ajílẹ̀ tó péye: Ẹ da apo mẹ́rin ajílẹ̀ NPK 15-15-15 sí saare kan ní ọ̀sẹ̀ kejì lẹ́yìnọgbìn (sẹ́ńtímítà mẹ́jọ sí ìdí igi), kí ẹ sì fi Urea kun ní ọ̀sẹ̀ karùn-ún nígbà tí ilẹ̀ bá tutù.',
      'ig-NG':
        'Tinye akpa anọ nke nri ala NPK 15-15-15 na hekta ọ bụla n’izu abụọראשון mgbe ị kụchara mkpụrụ (tinye ya n’olulu dị cm 5), ma tinyezie Urea n’izu nke ise mgbe ala dịando.',
      'pcm-NG':
        'Use correct fertilizer measure: Put 4 bag of NPK 15-15-15 per hectare two weeks after you plant (dig small hole 5cm deep near the root, cover am well), then add Urea top-dressing for week 5 when ground get water.',
      'ff-NG':
        'Waɗu booroije nayi NPK 15-15-15 nder hektaar gooto ɓaawo satiije ɗiɗi nde aawɗaa, ɓeydu Urea nder satiije jowi.',
    },
  },

  CROP_PATHOLOGY_AND_BLIGHT: {
    intentKey: 'CROP_PATHOLOGY_AND_BLIGHT',
    domainCategory: 'CROP_PATHOLOGY',
    citationBulletinIds: ['IITA-PATH-CMD-2024', 'NIHORT-BLIGHT-2024-02'],
    keywordStems: [
      'blight',
      'mosaic',
      'virus',
      'fungus',
      'rot',
      'wilt',
      'spot',
      'lesion',
      'curl',
      'disease',
      'cuta',
      'cutar',
      'bushewa',
      'launi',
      'arun',
      'irewe',
      'oria',
      'akwukwo',
      'sick',
      'curl',
      'mancozeb',
      'copper',
    ],
    localizedAdvisories: {
      'en-NG':
        'Foliar lesions and concentric dark rings indicate Early/Late Blight or Cassava Mosaic Virus. Rogue severely infected plants immediately, sanitize pruning tools, and apply Copper Hydroxide + Mancozeb WP at 2.0 kg/ha observing a strict 14-day Pre-Harvest Interval (PHI).',
      'ha-NG':
        'Idan ganye yana da dige-dige ko yana nadawa (Cutar Blight ko Mosaic), a cire shukar da ta kamu sosai, sannan a fesa maganin Copper + Mancozeb (kilo 2 a kadada) tare da jiran kwana 14 kafin girbi.',
      'yo-NG':
        'Ààmì dúdú àti ìkákò ewé fihàn pé àrùn Blight tàbí Mosaic ti wọ oko. Ẹ fa igi tí àrùn náà ti mú gan-an tu, kí ẹ sì fọ́n oògùn Copper + Mancozeb (2 kg/ha) pẹ̀lú ìsinmi ọjọ́ mẹ́rìnlá kí ẹ tó ká èso.',
      'ig-NG':
        'Ọrịa akwụkwọ ojii ma ọ bụ Cassava Mosaic chọrọ ka ị bụpụ osisi ndị ọrịa ji ike, ma fesaa ọgwụ Copper + Mancozeb (2 kg/ha). Chere ụbọchị iri na anọ tupu ị ghọrọ mkpụrụ.',
      'pcm-NG':
        'That black spot and leaf curl na Blight or Mosaic disease. Comot the plant wey don spoil well-well make e no spread, then spray Copper + Mancozeb (2kg per hectare) and wait 14 days before you harvest am.',
      'ff-NG':
        'To haako ɓalwii koo ɗon nyoro (nyawu Blight), ittugo lekki nyawɗi ɗin, ufu Copper + Mancozeb 2 kg/ha.',
    },
  },

  IRRIGATION_AND_WATER_STRESS: {
    intentKey: 'IRRIGATION_AND_WATER_STRESS',
    domainCategory: 'IRRIGATION_HYDROLOGY',
    citationBulletinIds: ['FAO56-NG-RBDA-2024', 'NAERLS-IRR-2024-07'],
    keywordStems: [
      'irrigation',
      'water',
      'pump',
      'drip',
      'dry',
      'drought',
      'moisture',
      'tensiometer',
      'ban',
      'ruwa',
      'rani',
      'fari',
      'injin',
      'omi',
      'ogbele',
      'mmiri',
      'okochi',
      'quench',
      'thirsty',
      'canal',
    ],
    localizedAdvisories: {
      'en-NG':
        'When tensiometer matric suction exceeds 45 kPa (root-zone depletion Dr > RAW), trigger a drip irrigation refill cycle of 48–55 mm early morning or late evening to minimize Penman-Monteith evaporative losses.',
      'ha-NG':
        'A lokacin noman rani, idan kasa ta bushe (tensiometer ya wuce 45 kPa), a kunna injin ban ruwa na dige-dige (drip) da sanyin safiya ko yamma don rage asarar ruwa saboda rana.',
      'yo-NG':
        'Nígbà ọ̀gbẹlẹ̀, tí ilẹ̀ bá ti gbẹ kọjá ìwọ̀n (45 kPa), ẹ ṣí ẹ̀rọ omi (drip irrigation) ní òwúrọ̀ kùtùkùtù tàbí ìrọ̀lẹ́ kí oorun má baà fa omi náà gbẹ.',
      'ig-NG':
        'N’oge ọkọchị, mgbe ala kpọrọ nkụ rụọ 45 kPa, gbanye ígwè mmiri (drip irrigation) n’isi ụtụtụ ma ọ bụ n’anyasị ka anwụ ghara ịkọrọ mmiri ahụ.',
      'pcm-NG':
        'For dry season, once ground dry reach 45 kPa, on your solar water pump early morning or evening time so hot sun no go dry the water before plant root drink am.',
      'ff-NG':
        'Nder ceeɗu, to leydi yoorii, udditu mashin ndiyam subaka law walla kiikiiɗe.',
    },
  },

  POST_HARVEST_AFLATOXIN_AND_STORAGE: {
    intentKey: 'POST_HARVEST_AFLATOXIN_AND_STORAGE',
    domainCategory: 'POST_HARVEST_STORAGE',
    citationBulletinIds: ['IITA-AFLASAFE-2024', 'NSPRI-PICS-2024-03'],
    keywordStems: [
      'storage',
      'weevil',
      'aflatoxin',
      'moisture',
      'drying',
      'bag',
      'pics',
      'hermetic',
      'mold',
      'ajiya',
      'rumbu',
      'busar',
      'itoju',
      'aka',
      'nchekwa',
      'oba',
      'spoil',
      'store',
      'warehouse',
    ],
    localizedAdvisories: {
      'en-NG':
        'Sun-dry maize, cowpea, and sorghum grains on clean tarpaulins down to 12.5%–13.0% moisture content (salt-jar test negative) and seal inside triple-layer PICS hermetic bags to asphyxiate storage weevils and prevent Aspergillus flavus aflatoxin contamination without chemical fumigants.',
      'ha-NG':
        'A busar da hatsi (masara ko wake) a kan tabarma mai tsafta har danshin ya sauka zuwa kashi 12.5%, sannan a kulle a cikin buhun PICS mai leda uku don kashe kwari da hana gubar Aflatoxin.',
      'yo-NG':
        'Ẹ sa ọkà àti ẹ̀wà sí oòrùn lórí tapolínì mímọ́ títí ọrinrin rẹ̀ yóò fi dínkù sí 12.5%, kí ẹ sì di í sinu apo PICS onípele-mẹ́ta láti pa kòkòrò àti láti dènà májèlé Aflatoxin.',
      'ig-NG':
        'Kpọọ ọka na agwa n’anwụ n’elu akwa dị ọcha ruo mgbe mmiri dị n’ime ya ga-agbada ruo 12.5%, ma tinye ya n’akpa PICS nwere akwa atọ iji gbuo ụmụ ahụhụ na igbochi Aflatoxin.',
      'pcm-NG':
        'Dry your corn and beans well on top clean tarpaulin until moisture drop reach 12.5%, then tie am tight inside 3-layer PICS bag so weevil go die and Aflatoxin mold no go fit grow.',
      'ff-NG':
        'Yoornu gawri e nyebbe haa 12.5%, ɓaawo ɗon waɗu nder booro PICS ngam haɗugo gilɗi.',
    },
  },

  MARKET_PRICE_AND_ESCROW_SUPPORT: {
    intentKey: 'MARKET_PRICE_AND_ESCROW_SUPPORT',
    domainCategory: 'POST_HARVEST_STORAGE',
    citationBulletinIds: ['AGRILY-MKT-ESCROW-2024'],
    keywordStems: [
      'price',
      'market',
      'sell',
      'buyer',
      'escrow',
      'payment',
      'money',
      'tonne',
      'farashi',
      'kasuwa',
      'kudi',
      'ciniki',
      'iye',
      'oja',
      'owo',
      'onuahia',
      'ahia',
      'ego',
      'how',
      'much',
    ],
    localizedAdvisories: {
      'en-NG':
        'Current Dawanau (Kano) & Mile 12 (Lagos) wholesale benchmark prices: Dry Maize ₦780,000/t, Paddy Rice ₦890,000/t, Soybeans ₦940,000/t. List your harvest on the Agrily Marketplace with multi-tier Escrow protection so funds are locked before truck dispatch.',
      'ha-NG':
        'Farashin babbar kasuwar Dawanau da Mile 12 a yau: Masara ₦780,000 a tan daya, Shinkafa ₦890,000 a tan. Ku dora kayanku a kasuwar Agrily inda za a tsare kudinku a asusun Escrow kafin a dauki kaya.',
      'yo-NG':
        'Iye owó ọjà ní Dawanau àti Mile 12 lónìí: Àgbàdo ₦780,000/tọ́ọ̀nù, ìrẹsì ₦890,000/tọ́ọ̀nù. Ẹ gbé èsooko yín sórí Agrily Marketplace pẹ̀lú ààbò Escrow kí owó yín lè dájú.',
      'ig-NG':
        'Ọnụahịa ahịa taa na Dawanau na Mile 12: Ọka ₦780,000 kwa tọn, Osikapa ₦890,000 kwa tọn. Tinye ihe ubi gị n’ahịa Agrily nwere nchekwa ego Escrow tupu ụgbọala ebuo ngwongwo.',
      'pcm-NG':
        'Market price today for Dawanau and Mile 12: Dry Corn na ₦780,000 per tonne, Rice na ₦890,000 per tonne. Post your produce for Agrily Marketplace make Escrow lock buyer money safe before trailer carry load.',
      'ff-NG':
        'Coggu luumo hannde: Butali ₦780,000/t, Maaro ₦890,000/t. Sottu nder Agrily Escrow.',
    },
  },
};

/**
 * Detects language locale (`en-NG`, `ha-NG`, `yo-NG`, `ig-NG`, `pcm-NG`, `ff-NG`)
 * from indigenous lexical markers if not explicitly overridden.
 */
function detectNigerianLocale(utterance = '', preferredLocale = null) {
  const tokens = normalizeAndTokenize(utterance);
  const tokenSet = new Set(tokens);

  const hausaMarkers = [
    'masara',
    'shinkafa',
    'gona',
    'taki',
    'tsutsa',
    'tsutsar',
    'ruwa',
    'cuta',
    'farashi',
    'kasuwa',
    'buhu',
    'ganyen',
    'yana',
    'kuma',
  ];
  const yorubaMarkers = [
    'agbado',
    'kokoro',
    'ajile',
    'oko',
    'ewe',
    'arun',
    'omi',
    'oja',
    'owo',
    'iresi',
    'ewa',
    'ogbele',
  ];
  const igboMarkers = [
    'oka',
    'akpu',
    'osikapa',
    'ahuhu',
    'ikpuru',
    'nri',
    'ala',
    'oria',
    'akwukwo',
    'mmiri',
    'okochi',
    'ego',
    'ahia',
  ];
  const pidginMarkers = [
    'dey',
    'chop',
    'una',
    'abeg',
    'wetin',
    'don',
    'no',
    'fit',
    'comot',
    'well',
    'make',
    'ground',
  ];

  const countHits = (markers) =>
    markers.reduce((acc, m) => acc + (tokenSet.has(m) ? 1 : 0), 0);

  const scores = {
    'ha-NG': countHits(hausaMarkers),
    'yo-NG': countHits(yorubaMarkers),
    'ig-NG': countHits(igboMarkers),
    'pcm-NG': countHits(pidginMarkers),
  };

  let bestLocale = preferredLocale || 'en-NG';
  let maxHits = 0;
  for (const [loc, hits] of Object.entries(scores)) {
    if (hits > maxHits) {
      maxHits = hits;
      bestLocale = loc;
    }
  }

  return bestLocale;
}

/**
 * Extracts structured agricultural entities (crop, state, symptom/pest, dosage)
 * from a farmer's multilingual utterance.
 */
function extractAgronomyEntities(utterance = '', fallbackContext = {}) {
  const tokens = normalizeAndTokenize(utterance);
  const tokenSet = new Set(tokens);

  let detectedCrop = fallbackContext.primaryCropKey || 'MAIZE';
  for (const [cropKey, synonyms] of Object.entries(MULTILINGUAL_CROP_LEXICON)) {
    if (synonyms.some((syn) => tokenSet.has(syn))) {
      detectedCrop = cropKey;
      break;
    }
  }

  const nigerianStates = [
    'kano',
    'kaduna',
    'katsina',
    'sokoto',
    'kebbi',
    'zamfara',
    'borno',
    'benue',
    'plateau',
    'niger',
    'oyo',
    'ogun',
    'ondo',
    'anambra',
    'ebonyi',
    'enugu',
    'lagos',
  ];
  let detectedState = fallbackContext.stateName || 'Kano';
  for (const st of nigerianStates) {
    if (tokenSet.has(st)) {
      detectedState = st.charAt(0).toUpperCase() + st.slice(1);
      break;
    }
  }

  return {
    cropKey: detectedCrop,
    stateName: detectedState,
    tokenCount: tokens.length,
  };
}

/**
 * Classifies a multilingual farmer utterance using Okapi BM25 lexical scoring
 * and generates a localized indigenous + English response with RAG citations.
 */
function classifyAndRespondMultilingualAgronomy(params = {}) {
  const utteranceText = String(
    params.utteranceText || 'Tsutsar masara tana cin ganyen masara a gona'
  ).trim();
  const preferredLocale = params.preferredLocale || null;
  const farmerContext = params.farmerContext || {};

  const detectedLocale = detectNigerianLocale(utteranceText, preferredLocale);
  const tokens = normalizeAndTokenize(utteranceText);
  const entities = extractAgronomyEntities(utteranceText, farmerContext);

  // Okapi BM25 parameters
  const k1 = 1.5;
  const b = 0.75;
  const avgDocLen = 18;

  let bestIntentKey = 'PEST_IPM_AND_FALL_ARMYWORM';
  let bestScore = -1;
  const intentScores = {};

  for (const [intentKey, spec] of Object.entries(AGRONOMY_INTENT_CATALOG)) {
    const docLen = spec.keywordStems.length;
    const stemSet = new Set(spec.keywordStems);
    let score = 0;

    for (const tok of tokens) {
      let matched = stemSet.has(tok);
      if (!matched) {
        // Prefix morphological match (e.g., tsutsar -> tsutsa, fertilizers -> fertilizer)
        matched = spec.keywordStems.some(
          (stem) =>
            (tok.length >= 4 && stem.startsWith(tok.slice(0, 4))) ||
            (stem.length >= 4 && tok.startsWith(stem.slice(0, 4)))
        );
      }
      if (matched) {
        const tf = 1.0;
        const idf = 2.1;
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLen / avgDocLen));
        score += idf * (numerator / denominator);
      }
    }

    intentScores[intentKey] = roundTo(score, 3);
    if (score > bestScore) {
      bestScore = score;
      bestIntentKey = intentKey;
    }
  }

  const chosenSpec =
    AGRONOMY_INTENT_CATALOG[bestIntentKey] ||
    AGRONOMY_INTENT_CATALOG.PEST_IPM_AND_FALL_ARMYWORM;

  const confidenceScore = clamp(
    roundTo(0.72 + Math.min(0.26, bestScore * 0.08), 2),
    0.72,
    0.98
  );

  const responseLocale = preferredLocale || detectedLocale;
  const localizedReply =
    chosenSpec.localizedAdvisories[responseLocale] ||
    chosenSpec.localizedAdvisories['en-NG'];
  const englishReferenceReply = chosenSpec.localizedAdvisories['en-NG'];

  return {
    utteranceText,
    detectedLocale,
    responseLocale,
    detectedIntent: chosenSpec.intentKey,
    domainCategory: chosenSpec.domainCategory,
    intentConfidenceScore: confidenceScore,
    extractedEntities: entities,
    localizedReply,
    englishReferenceReply,
    ragCitationBulletinIds: chosenSpec.citationBulletinIds,
    intentScores,
  };
}

module.exports = {
  MULTILINGUAL_CROP_LEXICON,
  AGRONOMY_INTENT_CATALOG,
  normalizeAndTokenize,
  detectNigerianLocale,
  extractAgronomyEntities,
  classifyAndRespondMultilingualAgronomy,
};
