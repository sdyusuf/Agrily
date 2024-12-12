import React, { useState } from 'react';
import './ExtensionOfficerEscalationModal.css';

/**
 * ExtensionOfficerEscalationModal
 * Allows farmers or cooperative leads to escalate complex field outbreaks to a
 * State Agricultural Development Programme (ADP) or NAERLS bilingual extension agent.
 */
const ExtensionOfficerEscalationModal = ({
  isOpen = false,
  onClose = () => {},
  selectedLocale = 'ha-NG',
  onSubmitEscalation = () => {},
}) => {
  const [stateAdpZone, setStateAdpZone] = useState('KANO_KNARDA_ZONE_1');
  const [urgencyLevel, setUrgencyLevel] = useState('HIGH_OUTBREAK_VISIT');
  const [farmerPhone, setFarmerPhone] = useState('+2348034459910');
  const [fieldNotes, setFieldNotes] = useState(
    'Severe whorl defoliation across 3.5 ha maize block; requesting bilingual Hausa/English extension visit.'
  );

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitEscalation({
      stateAdpZone,
      urgencyLevel,
      preferredLocale: selectedLocale,
      farmerPhone,
      fieldNotes,
    });
  };

  return (
    <div
      className="adp-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adp-escalation-modal-title"
      data-testid="extension-officer-escalation-modal"
    >
      <div className="adp-modal-container">
        <div className="adp-modal-header">
          <div>
            <span className="adp-modal-eyebrow">
              NAERLS &amp; STATE ADP BILINGUAL EXTENSION DESK
            </span>
            <h2 id="adp-escalation-modal-title" className="adp-modal-title">
              Escalate to Human Agronomy Extension Officer
            </h2>
          </div>
          <button
            type="button"
            className="adp-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            data-testid="close-escalation-modal-btn"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="adp-modal-form">
          <div className="adp-form-row">
            <label htmlFor="adp-zone-select">
              State ADP / Extension Command Zone
            </label>
            <select
              id="adp-zone-select"
              value={stateAdpZone}
              onChange={(e) => setStateAdpZone(e.target.value)}
              data-testid="adp-zone-select"
            >
              <option value="KANO_KNARDA_ZONE_1">
                Kano KNARDA Zone I (Rano / Kura / Garun Mallam — Hausa/Fulfulde)
              </option>
              <option value="KADUNA_KADP_ZARIA">
                Kaduna KADP Maigana / Zaria NAERLS Desk (Hausa/English)
              </option>
              <option value="OYO_OYSADEP_ISEYIN">
                Oyo OYSADEP Saki / Iseyin Zone (Yorùbá/English)
              </option>
              <option value="ANAMBRA_ADP_AYAMELUM">
                Anambra ADP Ayamelum / Omor Rice Belt (Igbo/Pidgin)
              </option>
            </select>
          </div>

          <div className="adp-form-row">
            <label htmlFor="adp-urgency-select">Dispatch Urgency Tier</label>
            <select
              id="adp-urgency-select"
              value={urgencyLevel}
              onChange={(e) => setUrgencyLevel(e.target.value)}
              data-testid="adp-urgency-select"
            >
              <option value="HIGH_OUTBREAK_VISIT">
                HIGH_OUTBREAK_VISIT — 24h Field Scouting &amp; IVR Callback
              </option>
              <option value="ROUTINE_SOIL_FERTIGATION_CALL">
                ROUTINE_SOIL_FERTIGATION_CALL — 48h Bilingual Phone Consultation
              </option>
            </select>
          </div>

          <div className="adp-form-row">
            <label htmlFor="adp-farmer-phone">
              Farmer Callback MSISDN (Voice / WhatsApp / SMS)
            </label>
            <input
              id="adp-farmer-phone"
              type="text"
              value={farmerPhone}
              onChange={(e) => setFarmerPhone(e.target.value)}
              data-testid="adp-farmer-phone-input"
            />
          </div>

          <div className="adp-form-row">
            <label htmlFor="adp-field-notes">
              Field Symptoms &amp; Preferred Dialect ({selectedLocale})
            </label>
            <textarea
              id="adp-field-notes"
              rows="3"
              value={fieldNotes}
              onChange={(e) => setFieldNotes(e.target.value)}
              data-testid="adp-field-notes-input"
            />
          </div>

          <div className="adp-modal-footer">
            <button
              type="button"
              className="adp-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="adp-btn-submit"
              data-testid="submit-escalation-ticket-btn"
            >
              Dispatch ADP Extension Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtensionOfficerEscalationModal;
