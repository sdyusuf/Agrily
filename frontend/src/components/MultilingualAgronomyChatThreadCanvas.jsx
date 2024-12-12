import React, { useState } from 'react';
import './MultilingualAgronomyChatThreadCanvas.css';

const LOCALE_OPTIONS = [
  { code: 'ha-NG', label: 'Hausa (Noma)', badge: 'HA' },
  { code: 'yo-NG', label: 'Yorùbá (Àgbẹ̀)', badge: 'YO' },
  { code: 'ig-NG', label: 'Igbo (Ọrụ Ugbo)', badge: 'IG' },
  { code: 'pcm-NG', label: 'Naija Pidgin', badge: 'PCM' },
  { code: 'en-NG', label: 'English (NG)', badge: 'EN' },
  { code: 'ff-NG', label: 'Fulfulde (Demal)', badge: 'FF' },
];

const QUICK_PROMPTS_BY_LOCALE = {
  'ha-NG': [
    'Tsutsar masara tana cin ganyen masara a Kano, wane magani zan fesa?',
    'Buhu nawa na takin NPK 15-15-15 da Urea zan sa a kadada daya?',
    'Yaya zan adana masara a buhun PICS don hana Aflatoxin?',
  ],
  'yo-NG': [
    'Kòkòrò jẹ́gbàdo ti ba ewé àgbàdo mi jẹ́ ní oko, oògùn wo ni kí n lò?',
    'Àpò ajílẹ̀ NPK 15-15-15 àti Urea mélòó ni kí n lò fún saare kan?',
  ],
  'ig-NG': [
    'Ikpuru na-eri akwụkwọ ọka m n’ubi, kedụ ọgwụ m ga-efesa?',
    'Akpa nri ala NPK 15-15-15 ole ka m ga-etinye na hekta ọka?',
  ],
  'pcm-NG': [
    'Abeg caterpillar dey chop my corn leaf for farm, wetin I go spray?',
    'How many bag of NPK 15-15-15 fertilizer I go put for one hectare?',
  ],
  'en-NG': [
    'Fall armyworm is damaging my maize whorls, what is the IPM spray rate?',
    'What is the 4R NPK 15-15-15 and Urea split top-dressing schedule?',
  ],
  'ff-NG': [
    'Gilɗi ɗon nyaama haako butali am nder gese, lekki uye mbaɗam?',
  ],
};

/**
 * MultilingualAgronomyChatThreadCanvas
 * Interactive conversational agronomy assistant supporting 6 Nigerian languages,
 * dual-language (Indigenous + English translation) toggle, BM25 intent badges,
 * and IITA/NAERLS bulletin citations.
 */
const MultilingualAgronomyChatThreadCanvas = ({
  selectedLocale = 'ha-NG',
  onSelectLocale = () => {},
  turns = [],
  onSendMessage = () => {},
  showEnglishTranslation = true,
  onToggleEnglishTranslation = () => {},
}) => {
  const [draftText, setDraftText] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!draftText.trim()) return;
    onSendMessage(draftText.trim());
    setDraftText('');
  };

  const quickPrompts =
    QUICK_PROMPTS_BY_LOCALE[selectedLocale] || QUICK_PROMPTS_BY_LOCALE['ha-NG'];

  return (
    <div
      className="ml-chat-canvas-card"
      data-testid="multilingual-agronomy-chat-thread-canvas"
    >
      <div className="ml-chat-header">
        <div>
          <span className="ml-chat-eyebrow">
            OKAPI BM25 + HYBRID RAG MULTILINGUAL NLU ENGINE
          </span>
          <h3 className="ml-chat-title">
            Indigenous Agronomy Assistant (Hausa • Yorùbá • Igbo • Pidgin • Fulfulde)
          </h3>
        </div>

        <label className="ml-translation-toggle">
          <input
            type="checkbox"
            checked={showEnglishTranslation}
            onChange={(e) => onToggleEnglishTranslation(e.target.checked)}
            data-testid="toggle-english-translation-checkbox"
          />
          <span>Show Dual English Translation</span>
        </label>
      </div>

      {/* Language Selector Bar */}
      <div
        className="ml-locale-selector-bar"
        role="tablist"
        aria-label="Nigerian Language Selector"
      >
        {LOCALE_OPTIONS.map((loc) => {
          const isActive = selectedLocale === loc.code;
          return (
            <button
              key={loc.code}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`ml-locale-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectLocale(loc.code)}
              data-testid={`select-locale-btn-${loc.code}`}
            >
              <span className="locale-badge-code">{loc.badge}</span>
              <span>{loc.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Prompt Chips */}
      <div className="ml-quick-prompts-row">
        {quickPrompts.map((promptText, idx) => (
          <button
            key={idx}
            type="button"
            className="ml-quick-prompt-chip"
            onClick={() => onSendMessage(promptText)}
            data-testid={`quick-prompt-chip-${idx}`}
          >
            💬 {promptText}
          </button>
        ))}
      </div>

      {/* Chat Messages Thread */}
      <div className="ml-chat-thread-window" data-testid="chat-thread-messages-list">
        {turns.map((turn, idx) => {
          const isFarmer = turn.senderRole === 'FARMER_USER';
          return (
            <div
              key={turn.turnIndex || idx}
              className={`ml-chat-bubble-row ${isFarmer ? 'row-farmer' : 'row-ai'}`}
              data-testid={`chat-turn-bubble-${idx}`}
            >
              <div className={`ml-chat-bubble ${isFarmer ? 'bubble-farmer' : 'bubble-ai'}`}>
                <div className="bubble-meta-top">
                  <span className="bubble-sender-tag">
                    {isFarmer ? '👩🏾‍🌾 Farmer Query' : '🌾 Agrily AI Agronomist'}
                  </span>
                  <span className="bubble-locale-tag">{turn.localeCode || selectedLocale}</span>
                  {turn.detectedIntent && (
                    <span className="bubble-intent-tag" data-testid={`turn-intent-badge-${idx}`}>
                      {turn.detectedIntent}
                    </span>
                  )}
                </div>

                <p className="bubble-primary-text">{turn.utteranceText}</p>

                {showEnglishTranslation &&
                  turn.englishTranslation &&
                  turn.localeCode !== 'en-NG' && (
                    <p className="bubble-english-subtext" data-testid={`turn-english-subtext-${idx}`}>
                      <strong>EN Reference:</strong> {turn.englishTranslation}
                    </p>
                  )}

                {Array.isArray(turn.ragCitationBulletinIds) &&
                  turn.ragCitationBulletinIds.length > 0 && (
                    <div className="bubble-citations-row">
                      {turn.ragCitationBulletinIds.map((cid) => (
                        <span key={cid} className="citation-chip">
                          📚 {cid}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Composer */}
      <form onSubmit={handleFormSubmit} className="ml-chat-composer">
        <input
          type="text"
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder={`Ask an agronomy question in ${selectedLocale}...`}
          className="ml-chat-text-input"
          data-testid="multilingual-chat-input"
        />
        <button
          type="submit"
          className="ml-chat-send-btn"
          data-testid="multilingual-chat-send-btn"
        >
          Send Advisory Query
        </button>
      </form>
    </div>
  );
};

export default MultilingualAgronomyChatThreadCanvas;
