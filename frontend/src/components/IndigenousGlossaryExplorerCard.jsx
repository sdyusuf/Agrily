import React, { useState } from 'react';
import './IndigenousGlossaryExplorerCard.css';

const DEFAULT_GLOSSARY = [
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
 * IndigenousGlossaryExplorerCard
 * Displays NAERLS & IITA standardized agricultural terminology across Hausa,
 * Yoruba, Igbo, and Nigerian Pidgin with phonetic pronunciation guides.
 */
const IndigenousGlossaryExplorerCard = ({
  glossary = DEFAULT_GLOSSARY,
}) => {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const items = Array.isArray(glossary) && glossary.length > 0 ? glossary : DEFAULT_GLOSSARY;

  const filteredItems =
    filterCategory === 'ALL'
      ? items
      : items.filter((item) => item.domainCategory === filterCategory);

  return (
    <div
      className="glossary-explorer-card"
      data-testid="indigenous-glossary-explorer-card"
    >
      <div className="glossary-header">
        <div>
          <span className="glossary-eyebrow">
            NAERLS ZARIA &amp; IITA IBADAN VERIFIED LEXICON
          </span>
          <h3 className="glossary-title">
            Multilingual Indigenous Agronomy Terminology &amp; Phonetics Explorer
          </h3>
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="glossary-category-select"
          aria-label="Filter Glossary Domain"
          data-testid="glossary-domain-filter-select"
        >
          <option value="ALL">All Agronomy Domains ({items.length})</option>
          <option value="ENTOMOLOGY_IPM">Entomology &amp; IPM</option>
          <option value="SOIL_FERTILITY_NPK">Soil Fertility &amp; 4R NPK</option>
          <option value="POST_HARVEST_STORAGE">Post-Harvest &amp; PICS Storage</option>
        </select>
      </div>

      <div className="glossary-concepts-grid">
        {filteredItems.map((entry) => (
          <div
            key={entry.glossaryCode}
            className="glossary-concept-panel"
            data-testid={`glossary-item-${entry.glossaryCode}`}
          >
            <div className="concept-top-bar">
              <span className="concept-code-pill">{entry.glossaryCode}</span>
              <span className="concept-domain-pill">{entry.domainCategory}</span>
            </div>
            <h4 className="concept-canonical-title">
              {entry.canonicalConceptKey.replace(/_/g, ' ')}
            </h4>
            <p className="concept-sci-desc">{entry.scientificDefinition}</p>

            <div className="concept-translations-list">
              {(entry.translations || []).map((tr) => (
                <div key={tr.localeCode} className="translation-tile">
                  <div className="tr-head">
                    <span className="tr-locale-badge">{tr.localeCode}</span>
                    <strong className="tr-indigenous-term">{tr.indigenousTerm}</strong>
                    {tr.phoneticPronunciation && (
                      <small className="tr-phonetic">/{tr.phoneticPronunciation}/</small>
                    )}
                  </div>
                  <p className="tr-example-ind">{tr.exampleSentenceIndigenous}</p>
                  <p className="tr-example-eng">{tr.exampleSentenceEnglish}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndigenousGlossaryExplorerCard;
