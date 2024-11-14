import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './CrowdScoutingReportModal.css';

const CrowdScoutingReportModal = ({
  isOpen = false,
  onClose,
  pestKey = 'FALL_ARMYWORM',
  pestCommonName = 'Fall Armyworm (Spodoptera frugiperda)',
  onSubmitScoutingReport,
}) => {
  const [stateName, setStateName] = useState('Kaduna');
  const [lgaName, setLgaName] = useState('Zaria');
  const [hostCropKey, setHostCropKey] = useState('MAIZE');
  const [totalPlantsInspected, setTotalPlantsInspected] = useState(100);
  const [infestedPlantsCount, setInfestedPlantsCount] = useState(34);
  const [davisFoliarDamageScale, setDavisFoliarDamageScale] = useState(5);
  const [dominantInstarStage, setDominantInstarStage] = useState('L1_L2_EARLY_INSTAR');
  const [pheromoneTrapMothsPerNight, setPheromoneTrapMothsPerNight] = useState(22);
  const [scoutFieldNotes, setScoutFieldNotes] = useState(
    '5-station W-pattern transect completed at 07:30 WAT; fresh window-pane whorl feeding observed.'
  );
  const [submittedReport, setSubmittedReport] = useState(null);

  const liveMetrics = useMemo(() => {
    const total = Math.max(10, Number(totalPlantsInspected) || 100);
    const infested = Math.min(total, Math.max(0, Number(infestedPlantsCount) || 0));
    const incidencePct = Number(((infested / total) * 100).toFixed(1));
    const davis = Number(davisFoliarDamageScale) || 4;

    const severityTier =
      incidencePct >= 45 || davis >= 7
        ? 'SEVERE_OUTBREAK_SWARM'
        : incidencePct >= 20 || davis >= 5
        ? 'ACTION_THRESHOLD_EXCEEDED'
        : incidencePct >= 8 || davis >= 3
        ? 'WATCH_EARLY_INSTAR'
        : 'TRACE_ENDEMIC';

    return {
      incidencePct,
      severityTier,
      exceedsActionThreshold: incidencePct >= 14.0 || davis >= 5,
    };
  }, [totalPlantsInspected, infestedPlantsCount, davisFoliarDamageScale]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      reportCode: `PST-2024-${Math.floor(10000 + Math.random() * 90000)}`,
      pestSpeciesKey: pestKey,
      pestCommonName,
      hostCropKey,
      stateName,
      lgaName,
      totalPlantsInspected: Number(totalPlantsInspected),
      infestedPlantsCount: Number(infestedPlantsCount),
      infestedPlantsIncidencePct: liveMetrics.incidencePct,
      davisFoliarDamageScale: Number(davisFoliarDamageScale),
      dominantInstarStage,
      pheromoneTrapMothsPerNight: Number(pheromoneTrapMothsPerNight),
      infestationSeverityTier: liveMetrics.severityTier,
      scoutFieldNotes,
    };
    if (typeof onSubmitScoutingReport === 'function') {
      onSubmitScoutingReport(payload);
    }
    setSubmittedReport(payload);
  };

  return (
    <div
      className="scouting-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scouting-modal-title"
      data-testid="crowd-scouting-report-modal"
    >
      <div className="scouting-modal-box">
        <header className="scouting-modal-header">
          <div>
            <span className="scouting-modal-eyebrow">
              W-PATTERN FIELD TRANSECT • CROWD &amp; EXTENSION ENTOMOLOGY DISPATCH
            </span>
            <h3 id="scouting-modal-title" className="scouting-modal-title">
              Submit Field Pest Scouting Report &amp; Trigger Regional Alert
            </h3>
          </div>
          <button
            type="button"
            className="scouting-close-btn"
            onClick={onClose}
            aria-label="Close scouting modal"
          >
            ✕
          </button>
        </header>

        <form className="scouting-modal-form" onSubmit={handleSubmit}>
          <div className="scouting-form-grid">
            <div className="scouting-field">
              <label htmlFor="sc-state">State Jurisdiction</label>
              <input
                id="sc-state"
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                required
              />
            </div>

            <div className="scouting-field">
              <label htmlFor="sc-lga">Local Government Area (LGA)</label>
              <input
                id="sc-lga"
                type="text"
                value={lgaName}
                onChange={(e) => setLgaName(e.target.value)}
                required
              />
            </div>

            <div className="scouting-field">
              <label htmlFor="sc-crop">Host Crop</label>
              <select
                id="sc-crop"
                value={hostCropKey}
                onChange={(e) => setHostCropKey(e.target.value)}
              >
                <option value="MAIZE">Hybrid Maize</option>
                <option value="RICE_PADDY">Lowland Paddy Rice</option>
                <option value="SORGHUM">Sorghum (Guinea Corn)</option>
                <option value="TOMATO">Irrigated Tomato</option>
                <option value="COWPEA">Savanna Cowpea</option>
                <option value="CASSAVA">Starch Cassava</option>
              </select>
            </div>

            <div className="scouting-field">
              <label htmlFor="sc-instar">Dominant Larval Instar Stage</label>
              <select
                id="sc-instar"
                value={dominantInstarStage}
                onChange={(e) => setDominantInstarStage(e.target.value)}
              >
                <option value="EGG_MASS_BIOFIX">Egg Mass Biofix</option>
                <option value="L1_L2_EARLY_INSTAR">L1–L2 Window-Pane Instar</option>
                <option value="L3_L4_MID_INSTAR">L3–L4 Whorl Feeding</option>
                <option value="L5_L6_LATE_BORING">L5–L6 Late Cob/Stem Boring</option>
                <option value="ADULT_MOTH_SWARM">Adult Moth / Swarm Flight</option>
              </select>
            </div>

            <div className="scouting-field">
              <label htmlFor="sc-total-plants">Total Plants Inspected (W-Walk)</label>
              <input
                id="sc-total-plants"
                type="number"
                min="20"
                max="500"
                value={totalPlantsInspected}
                onChange={(e) => setTotalPlantsInspected(e.target.value)}
              />
            </div>

            <div className="scouting-field">
              <label htmlFor="sc-infested-plants">Infested Plants Count</label>
              <input
                id="sc-infested-plants"
                type="number"
                min="0"
                max="500"
                value={infestedPlantsCount}
                onChange={(e) => setInfestedPlantsCount(e.target.value)}
              />
            </div>

            <div className="scouting-field">
              <label htmlFor="sc-davis-scale">Davis Whorl Damage Scale (1–9)</label>
              <input
                id="sc-davis-scale"
                type="number"
                min="1"
                max="9"
                value={davisFoliarDamageScale}
                onChange={(e) => setDavisFoliarDamageScale(e.target.value)}
              />
            </div>

            <div className="scouting-field">
              <label htmlFor="sc-trap-catch">Pheromone Trap Catch (moths/night)</label>
              <input
                id="sc-trap-catch"
                type="number"
                min="0"
                max="500"
                value={pheromoneTrapMothsPerNight}
                onChange={(e) => setPheromoneTrapMothsPerNight(e.target.value)}
              />
            </div>
          </div>

          <div className="scouting-live-summary">
            <div>
              <span>Computed Field Incidence:</span>
              <strong data-testid="scouting-live-incidence">
                {liveMetrics.incidencePct}% ({liveMetrics.severityTier})
              </strong>
            </div>
            <div>
              <span>Threshold Status:</span>
              <strong>
                {liveMetrics.exceedsActionThreshold
                  ? 'EXCEEDS ECONOMIC THRESHOLD — DEPLOY IPM'
                  : 'BELOW ECONOMIC THRESHOLD'}
              </strong>
            </div>
          </div>

          <div className="scouting-field full">
            <label htmlFor="sc-notes">Extension Officer / Farmer Scouting Notes</label>
            <textarea
              id="sc-notes"
              rows={2}
              value={scoutFieldNotes}
              onChange={(e) => setScoutFieldNotes(e.target.value)}
            />
          </div>

          {submittedReport && (
            <div className="scouting-success-banner" role="status">
              Dispatched Report <code>{submittedReport.reportCode}</code> for{' '}
              <strong>
                {submittedReport.lgaName}, {submittedReport.stateName}
              </strong>{' '}
              ({submittedReport.infestedPlantsIncidencePct}% incidence).
            </div>
          )}

          <footer className="scouting-modal-footer">
            <button
              type="button"
              className="scouting-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="scouting-submit-btn">
              Broadcast Scouting Telemetry &amp; Generate IPM Plan
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

CrowdScoutingReportModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  pestKey: PropTypes.string,
  pestCommonName: PropTypes.string,
  onSubmitScoutingReport: PropTypes.func,
};

export default CrowdScoutingReportModal;
