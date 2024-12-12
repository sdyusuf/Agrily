import React, { useState } from 'react';
import './IndigenousVoiceWaveformAndUssdCard.css';

/**
 * IndigenousVoiceWaveformAndUssdCard
 * Interactive rural voice & feature-phone telephony simulator:
 *  1. Low-bitrate Opus (12 kbps) Voice Note Recorder & VITS Neural TTS Synthesizer
 *     with SVG acoustic waveform visualization and SNR-to-WER confidence metrics.
 *  2. Stateful 2G GSM USSD (*347*24#) Interactive Feature-Phone Screen Emulator.
 */
const IndigenousVoiceWaveformAndUssdCard = ({
  selectedLocale = 'ha-NG',
  onDispatchVoiceNote = () => {},
  onOpenEscalationModal = () => {},
}) => {
  const [signalToNoiseDb, setSignalToNoiseDb] = useState(21);
  const [ussdHopPath, setUssdHopPath] = useState('1');
  const [ussdKeypadInput, setUssdKeypadInput] = useState('1');

  const USSD_SCREENS = {
    '': 'CON Welcome to Agrily AI (*347*24#)\n1. Hausa (Noma)\n2. Yoruba (Agbe)\n3. Igbo (Oru Ugbo)\n4. Naija Pidgin\n5. English',
    '1': 'CON Zabi matsalar gona:\n1. Maganin Tsutsar Masara\n2. Yawan Takin NPK/Urea\n3. Ban Ruwa (Rani)\n4. Farashin Kasuwa',
    '2': 'CON E yan iranlowo:\n1. Ogun Kokoro Agbado\n2. Iwọn Ajile NPK/Urea\n3. Omi Oko (Ogbele)\n4. Iye Owo Oja',
    '3': 'CON Họrọ enyemaka:\n1. Ọgwụ Ikpuru Ọka\n2. Nri Ala NPK/Urea\n3. Mmiri Ubi (Ọkọchị)\n4. Ọnụahịa Ahịa',
    '4': 'CON Choose farm help:\n1. Corn Caterpillar Medicine\n2. NPK/Urea Fertilizer Measure\n3. Dry Season Water Pump\n4. Market Price Today',
    '1*1':
      'END Fesa Emamectin 5% WG (250g/ha) ko ruwan Neem 2.5L/ha da safe kafin karfe 9. An turo cikakken bayani ta SMS.',
    '1*2':
      'END Sa buhu 4 na NPK 15-15-15 a kadada (mako 2 bayan shuka) da Urea a mako na 5.',
    '2*1':
      'END E fon Emamectin 5% WG (250g/ha) tabi omi Dongoyaro ni owuro ki o to di aago mesan. SMS ti wa.',
    '3*1':
      'END Fesaa Emamectin 5% WG (250g/ha) ma ọ bụ mmiri Neem n’ụtụtụ tupu elekere 9. Ezipụla SMS.',
    '4*1':
      'END Spray Emamectin 5% WG (250g/ha) or Neem oil early morning before 9am. Full SMS don land.',
  };

  const currentScreenText =
    USSD_SCREENS[ussdHopPath] ||
    USSD_SCREENS['1*1'];

  const estimatedAsrConfidence = Math.min(
    97.5,
    Math.max(68.0, 82 + Number(signalToNoiseDb) * 0.65)
  ).toFixed(1);

  const handleDialUssdHop = () => {
    const nextPath = ussdHopPath
      ? `${ussdHopPath}*${ussdKeypadInput}`
      : ussdKeypadInput;
    setUssdHopPath(USSD_SCREENS[nextPath] ? nextPath : '1*1');
  };

  return (
    <div
      className="voice-ussd-card"
      data-testid="indigenous-voice-waveform-and-ussd-card"
    >
      <div className="voice-ussd-header">
        <div>
          <span className="voice-ussd-eyebrow">
            OPUS 12-KBPS VOICE ASR/TTS &amp; 2G GSM USSD (*347*24#) GATEWAY
          </span>
          <h3 className="voice-ussd-title">
            Offline Voice Note Transcriber &amp; Feature-Phone USSD Emulator
          </h3>
        </div>
        <span className="voice-codec-pill" data-testid="voice-tts-profile-badge">
          VITS-{selectedLocale.toUpperCase()}-NEURAL
        </span>
      </div>

      {/* SVG Acoustic Waveform & SNR Slider */}
      <div className="voice-waveform-box">
        <svg
          viewBox="0 0 360 64"
          className="voice-waveform-svg"
          role="img"
          aria-label="Indigenous voice note acoustic waveform"
        >
          {[
            14, 26, 42, 30, 52, 46, 22, 38, 56, 48, 28, 18, 36, 50, 40, 24, 32,
            44, 20, 14,
          ].map((h, idx) => (
            <rect
              key={idx}
              x={12 + idx * 17}
              y={(64 - h) / 2}
              width="9"
              height={h}
              rx="4"
              fill={idx % 3 === 0 ? '#bc6c25' : '#2d6a4f'}
            />
          ))}
        </svg>

        <div className="voice-snr-row">
          <label htmlFor="voice-snr-slider">
            <span>Field Acoustic SNR (Wind/Tractor Noise Filter)</span>
            <strong>{signalToNoiseDb} dB</strong>
          </label>
          <input
            id="voice-snr-slider"
            type="range"
            min="5"
            max="35"
            value={signalToNoiseDb}
            onChange={(e) => setSignalToNoiseDb(Number(e.target.value))}
            data-testid="voice-snr-slider"
          />
        </div>

        <div className="voice-metrics-strip">
          <div>
            <span>Quantized Whisper ASR Confidence:</span>{' '}
            <strong data-testid="asr-confidence-readout">
              {estimatedAsrConfidence}%
            </strong>
          </div>
          <div>
            <span>2G EDGE Packet Size:</span> <strong>14.2 KB (Opus)</strong>
          </div>
        </div>

        <button
          type="button"
          className="voice-transcribe-btn"
          onClick={() =>
            onDispatchVoiceNote({
              localeCode: selectedLocale,
              signalToNoiseRatioDb: signalToNoiseDb,
              audioDurationSeconds: 9.5,
            })
          }
          data-testid="simulate-voice-note-btn"
        >
          🎙️ Simulate {selectedLocale} Voice Note &amp; Neural TTS Playback
        </button>
      </div>

      {/* 2G GSM USSD (*347*24#) Interactive Screen Emulator */}
      <div className="ussd-emulator-box">
        <div className="ussd-emulator-top">
          <span className="ussd-shortcode-tag">📠 GSM USSD: *347*24#</span>
          <button
            type="button"
            className="ussd-reset-btn"
            onClick={() => setUssdHopPath('')}
            data-testid="ussd-reset-root-btn"
          >
            Reset to Root Menu
          </button>
        </div>

        <pre className="ussd-lcd-screen" data-testid="ussd-lcd-screen-text">
          {currentScreenText}
        </pre>

        <div className="ussd-keypad-controls">
          <select
            value={ussdKeypadInput}
            onChange={(e) => setUssdKeypadInput(e.target.value)}
            aria-label="USSD Menu Option"
            data-testid="ussd-option-select"
          >
            <option value="1">Press 1 (Hausa / Option 1)</option>
            <option value="2">Press 2 (Yoruba / Option 2)</option>
            <option value="3">Press 3 (Igbo / Option 3)</option>
            <option value="4">Press 4 (Pidgin / Option 4)</option>
          </select>
          <button
            type="button"
            className="ussd-send-hop-btn"
            onClick={handleDialUssdHop}
            data-testid="ussd-send-hop-btn"
          >
            Send USSD Reply
          </button>
        </div>
      </div>

      <button
        type="button"
        className="escalate-adp-btn"
        onClick={onOpenEscalationModal}
        data-testid="open-extension-escalation-modal-btn"
      >
        👩🏾‍🔬 Escalate to State ADP / NAERLS Human Extension Officer
      </button>
    </div>
  );
};

export default IndigenousVoiceWaveformAndUssdCard;
