import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './WeighbridgeCalibrationModal.css';

const DEFAULT_MOISTURE_STANDARDS = {
  MAIZE: 13.5,
  RICE_PADDY: 14.0,
  SORGHUM: 13.0,
  SOYBEAN: 12.0,
  COWPEA: 12.5,
  GROUNDNUT: 9.0,
  CASSAVA: 65.0,
  SESAME: 8.0,
  MILLET: 12.5,
};

const WeighbridgeCalibrationModal = ({
  isOpen = false,
  onClose,
  forecastSummary = {},
  onSubmitCalibration,
}) => {
  const cropKey = (forecastSummary?.cropKey || 'MAIZE').toUpperCase();
  const standardMoisture = DEFAULT_MOISTURE_STANDARDS[cropKey] || 13.5;

  const [weighbridgeTicketCode, setWeighbridgeTicketCode] = useState('WBT-2024-88412');
  const [grossWeightKg, setGrossWeightKg] = useState(41850);
  const [tareWeightKg, setTareWeightKg] = useState(14200);
  const [measuredMoisturePct, setMeasuredMoisturePct] = useState(16.8);
  const [foreignMatterPct, setForeignMatterPct] = useState(1.4);
  const [combineLossEstimatePct, setCombineLossEstimatePct] = useState(3.2);
  const [harvestedAreaHectares, setHarvestedAreaHectares] = useState(
    Number(forecastSummary?.areaHectares || 6.5)
  );
  const [buyerGradeTier, setBuyerGradeTier] = useState('GRADE_1_EXPORT');
  const [operatorNotes, setOperatorNotes] = useState(
    'Verified across dual-axle digital weighbridge at Zaria Grain Aggregation Silo #3.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState(null);

  const liveShrinkageMetrics = useMemo(() => {
    const gross = Math.max(0, Number(grossWeightKg) || 0);
    const tare = Math.max(0, Number(tareWeightKg) || 0);
    const wetNetKg = Math.max(0, gross - tare);
    const moisture = Math.min(45, Math.max(5, Number(measuredMoisturePct) || standardMoisture));
    const foreignMatter = Math.min(20, Math.max(0, Number(foreignMatterPct) || 0));
    const areaHa = Math.max(0.25, Number(harvestedAreaHectares) || 1);

    // Commercial grain shrinkage equation: W_std = W_wet * (100 - M_wet) / (100 - M_std)
    const moistureAdjustmentFactor = (100 - moisture) / (100 - standardMoisture);
    const foreignMatterDeductionKg = wetNetKg * (foreignMatter / 100);
    const cleanWetWeightKg = Math.max(0, wetNetKg - foreignMatterDeductionKg);
    const standardDryNetKg = cleanWetWeightKg * moistureAdjustmentFactor;
    const moistureShrinkageLossKg = Math.max(0, cleanWetWeightKg - standardDryNetKg);

    const actualDryYieldTonsHa = (standardDryNetKg / 1000) / areaHa;
    const predictedP50TonsHa = Number(forecastSummary?.predictedP50TonsHa || 4.35);
    const residualErrorTonsHa = actualDryYieldTonsHa - predictedP50TonsHa;
    const absolutePercentageErrorPct =
      predictedP50TonsHa > 0
        ? (Math.abs(residualErrorTonsHa) / predictedP50TonsHa) * 100
        : 0;

    const dryingEnergyMcal = moisture > standardMoisture
      ? moistureShrinkageLossKg * 1.18
      : 0;

    return {
      wetNetKg: Math.round(wetNetKg),
      foreignMatterDeductionKg: Math.round(foreignMatterDeductionKg),
      moistureShrinkageLossKg: Math.round(moistureShrinkageLossKg),
      standardDryNetKg: Math.round(standardDryNetKg),
      standardDryNetTons: Number((standardDryNetKg / 1000).toFixed(2)),
      actualDryYieldTonsHa: Number(actualDryYieldTonsHa.toFixed(2)),
      predictedP50TonsHa: Number(predictedP50TonsHa.toFixed(2)),
      residualErrorTonsHa: Number(residualErrorTonsHa.toFixed(2)),
      absolutePercentageErrorPct: Number(absolutePercentageErrorPct.toFixed(2)),
      dryingEnergyMcal: Math.round(dryingEnergyMcal),
      calibrationGrade:
        absolutePercentageErrorPct <= 6
          ? 'GOLD_CALIBRATED'
          : absolutePercentageErrorPct <= 12
          ? 'SILVER_ACCEPTABLE'
          : 'RECALIBRATION_REQUIRED',
    };
  }, [
    grossWeightKg,
    tareWeightKg,
    measuredMoisturePct,
    foreignMatterPct,
    harvestedAreaHectares,
    standardMoisture,
    forecastSummary,
  ]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      weighbridgeTicketCode,
      cropKey,
      parcelName: forecastSummary?.parcelName || 'Kaduna North Block A',
      areaHectares: Number(harvestedAreaHectares),
      grossWeightKg: Number(grossWeightKg),
      tareWeightKg: Number(tareWeightKg),
      measuredMoisturePct: Number(measuredMoisturePct),
      standardMoisturePct: standardMoisture,
      foreignMatterPct: Number(foreignMatterPct),
      combineLossEstimatePct: Number(combineLossEstimatePct),
      buyerGradeTier,
      operatorNotes,
      predictedP50TonsHa: liveShrinkageMetrics.predictedP50TonsHa,
      actualYieldTonsHa: liveShrinkageMetrics.actualDryYieldTonsHa,
      standardDryNetTons: liveShrinkageMetrics.standardDryNetTons,
    };

    try {
      if (typeof onSubmitCalibration === 'function') {
        const res = await onSubmitCalibration(payload);
        setCalibrationResult(res || payload);
      } else {
        setCalibrationResult(payload);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="weighbridge-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weighbridge-modal-title"
      data-testid="weighbridge-calibration-modal"
    >
      <div className="weighbridge-modal-container">
        <header className="weighbridge-modal-header">
          <div>
            <span className="weighbridge-modal-eyebrow">
              POST-HARVEST WEIGHBRIDGE &amp; MOISTURE SHRINKAGE RECONCILIATION
            </span>
            <h3 id="weighbridge-modal-title" className="weighbridge-modal-title">
              Weighbridge Ticket Calibration &amp; Ridge Model Feedback Loop
            </h3>
          </div>
          <button
            type="button"
            className="weighbridge-close-btn"
            onClick={onClose}
            aria-label="Close weighbridge modal"
          >
            ✕
          </button>
        </header>

        <form className="weighbridge-modal-body" onSubmit={handleSubmit}>
          <div className="weighbridge-form-grid">
            <div className="weighbridge-field">
              <label htmlFor="wb-ticket-code">Weighbridge Ticket ID</label>
              <input
                id="wb-ticket-code"
                type="text"
                value={weighbridgeTicketCode}
                onChange={(e) => setWeighbridgeTicketCode(e.target.value)}
                required
              />
            </div>

            <div className="weighbridge-field">
              <label htmlFor="wb-harvested-area">Harvested Area (ha)</label>
              <input
                id="wb-harvested-area"
                type="number"
                step="0.1"
                min="0.25"
                value={harvestedAreaHectares}
                onChange={(e) => setHarvestedAreaHectares(e.target.value)}
                required
              />
            </div>

            <div className="weighbridge-field">
              <label htmlFor="wb-gross-weight">Truck Gross Weight (kg)</label>
              <input
                id="wb-gross-weight"
                type="number"
                step="50"
                min="500"
                value={grossWeightKg}
                onChange={(e) => setGrossWeightKg(e.target.value)}
                required
              />
            </div>

            <div className="weighbridge-field">
              <label htmlFor="wb-tare-weight">Truck Tare Weight (kg)</label>
              <input
                id="wb-tare-weight"
                type="number"
                step="50"
                min="100"
                value={tareWeightKg}
                onChange={(e) => setTareWeightKg(e.target.value)}
                required
              />
            </div>

            <div className="weighbridge-field">
              <label htmlFor="wb-moisture">
                Measured Grain Moisture (%) [Std: {standardMoisture}%]
              </label>
              <input
                id="wb-moisture"
                type="number"
                step="0.1"
                min="6"
                max="40"
                value={measuredMoisturePct}
                onChange={(e) => setMeasuredMoisturePct(e.target.value)}
                required
              />
            </div>

            <div className="weighbridge-field">
              <label htmlFor="wb-foreign-matter">Foreign Matter / Chaff (%)</label>
              <input
                id="wb-foreign-matter"
                type="number"
                step="0.1"
                min="0"
                max="18"
                value={foreignMatterPct}
                onChange={(e) => setForeignMatterPct(e.target.value)}
              />
            </div>

            <div className="weighbridge-field">
              <label htmlFor="wb-combine-loss">Combine Threshing Loss (%)</label>
              <input
                id="wb-combine-loss"
                type="number"
                step="0.1"
                min="0"
                max="15"
                value={combineLossEstimatePct}
                onChange={(e) => setCombineLossEstimatePct(e.target.value)}
              />
            </div>

            <div className="weighbridge-field">
              <label htmlFor="wb-buyer-grade">Commercial Silo Grade Tier</label>
              <select
                id="wb-buyer-grade"
                value={buyerGradeTier}
                onChange={(e) => setBuyerGradeTier(e.target.value)}
              >
                <option value="GRADE_1_EXPORT">Grade 1 Export Standard</option>
                <option value="GRADE_2_MILLING">Grade 2 Industrial Milling</option>
                <option value="GRADE_3_FEED">Grade 3 Livestock Feed</option>
              </select>
            </div>
          </div>

          <div className="weighbridge-shrinkage-ledger">
            <div className="shrinkage-metric-box">
              <span className="shrinkage-label">Wet Scale Net</span>
              <strong className="shrinkage-value">
                {liveShrinkageMetrics.wetNetKg.toLocaleString()} kg
              </strong>
              <span className="shrinkage-sub">Gross minus tare</span>
            </div>

            <div className="shrinkage-metric-box">
              <span className="shrinkage-label">Moisture + Chaff Shrinkage</span>
              <strong className="shrinkage-value warning">
                -
                {(
                  liveShrinkageMetrics.moistureShrinkageLossKg +
                  liveShrinkageMetrics.foreignMatterDeductionKg
                ).toLocaleString()}{' '}
                kg
              </strong>
              <span className="shrinkage-sub">
                Drying energy: {liveShrinkageMetrics.dryingEnergyMcal} Mcal
              </span>
            </div>

            <div className="shrinkage-metric-box highlight">
              <span className="shrinkage-label">Standardized Dry Net</span>
              <strong className="shrinkage-value emerald" data-testid="wb-dry-net-tons">
                {liveShrinkageMetrics.standardDryNetTons} t (
                {liveShrinkageMetrics.actualDryYieldTonsHa} t/ha)
              </strong>
              <span className="shrinkage-sub">At {standardMoisture}% commercial moisture</span>
            </div>

            <div className="shrinkage-metric-box">
              <span className="shrinkage-label">Model Residual vs. P50</span>
              <strong className="shrinkage-value">
                {liveShrinkageMetrics.residualErrorTonsHa >= 0 ? '+' : ''}
                {liveShrinkageMetrics.residualErrorTonsHa} t/ha (
                {liveShrinkageMetrics.absolutePercentageErrorPct}% APE)
              </strong>
              <span className="shrinkage-sub">{liveShrinkageMetrics.calibrationGrade}</span>
            </div>
          </div>

          <div className="weighbridge-field full-width">
            <label htmlFor="wb-notes">Silo Weighmaster Audit Notes</label>
            <textarea
              id="wb-notes"
              rows={2}
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
            />
          </div>

          {calibrationResult && (
            <div className="weighbridge-calibration-banner" role="status">
              <strong>Calibration Committed:</strong> Ticket{' '}
              <code>{weighbridgeTicketCode}</code> reconciled at{' '}
              <strong>{liveShrinkageMetrics.actualDryYieldTonsHa} t/ha</strong> dry basis. Ridge
              regression weights updated for {cropKey}.
            </div>
          )}

          <footer className="weighbridge-modal-footer">
            <button
              type="button"
              className="weighbridge-secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="weighbridge-primary-btn"
              disabled={submitting}
            >
              {submitting
                ? 'Committing Weighbridge Calibration...'
                : 'Commit Weighbridge Ticket & Recalibrate Model'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

WeighbridgeCalibrationModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  forecastSummary: PropTypes.shape({
    cropKey: PropTypes.string,
    parcelName: PropTypes.string,
    areaHectares: PropTypes.number,
    predictedP50TonsHa: PropTypes.number,
  }),
  onSubmitCalibration: PropTypes.func,
};

export default WeighbridgeCalibrationModal;
