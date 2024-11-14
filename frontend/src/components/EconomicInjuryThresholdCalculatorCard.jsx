/**
 * ==============================================================================
 * ⚖️ AGRILY SPRINT 22: PEDIGO ECONOMIC INJURY LEVEL (EIL) & DEGREE-DAY CLOCK CARD
 * ==============================================================================
 *
 * Interactive bio-economic threshold simulator computing:
 *  - Pedigo et al. (1986) EIL = C / (V * I * D * K) & Economic Threshold (ET = 0.75 * EIL)
 *  - Baskerville-Emin degree-day (GDD) larval instar stage & biocontrol susceptibility
 *  - Untreated revenue loss vs. IPM intervention Benefit-Cost Ratio (BCR)
 * ==============================================================================
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './EconomicInjuryThresholdCalculatorCard.css';

const INSTAR_STAGES = [
  { code: 'EGG_MASS_BIOFIX', minGdd: 0, maxGdd: 55, label: 'Foliar Egg Mass (Biofix)', susceptibilityPct: 96 },
  { code: 'L1_L2_EARLY_INSTAR', minGdd: 56, maxGdd: 150, label: 'L1–L2 Window-Pane Instar (Optimal Biocontrol Window)', susceptibilityPct: 92 },
  { code: 'L3_L4_MID_INSTAR', minGdd: 151, maxGdd: 255, label: 'L3–L4 Whorl Migration & Frass Plugging', susceptibilityPct: 64 },
  { code: 'L5_L6_LATE_BORING', minGdd: 256, maxGdd: 365, label: 'L5–L6 Cryptic Cob/Stem Boring', susceptibilityPct: 28 },
  { code: 'PUPA_ADULT', minGdd: 366, maxGdd: 999, label: 'Soil Pupation to Adult Moth Flight', susceptibilityPct: 42 },
];

const EconomicInjuryThresholdCalculatorCard = ({
  pestKey = 'FALL_ARMYWORM',
  pestCommonName = 'Fall Armyworm (Spodoptera frugiperda)',
  defaultYieldTonsHa = 4.5,
  defaultCropPriceNgnTon = 685000,
  onEvaluationChange,
}) => {
  const [observedIncidencePct, setObservedIncidencePct] = useState(28);
  const [davisDamageScale, setDavisDamageScale] = useState(4);
  const [accumulatedGdd, setAccumulatedGdd] = useState(118);
  const [controlCostNgnHa, setControlCostNgnHa] = useState(28500);
  const [controlEfficacyPct, setControlEfficacyPct] = useState(84);

  const metrics = useMemo(() => {
    const grossCropValueNgnHa = defaultYieldTonsHa * defaultCropPriceNgnTon;
    const efficacyK = Math.max(0.35, Number(controlEfficacyPct) / 100);

    // Pedigo EIL equation with physiological foliar compensation
    const netInjurySlopePerPct = 0.0042 * 0.58 * 0.22;
    const rawEilPct =
      Number(controlCostNgnHa) /
      (grossCropValueNgnHa * netInjurySlopePerPct * efficacyK);
    const eilPct = Number(Math.min(60, Math.max(3, rawEilPct)).toFixed(1));
    const etPct = Number((eilPct * 0.75).toFixed(1));

    const untreatedLossFraction = Math.min(
      0.8,
      Number(observedIncidencePct) *
        netInjurySlopePerPct *
        (1 + (Number(davisDamageScale) - 1) * 0.08)
    );
    const untreatedLossNgnHa = Math.round(grossCropValueNgnHa * untreatedLossFraction);
    const preventedLossNgnHa = Math.round(untreatedLossNgnHa * efficacyK);
    const benefitCostRatio = Number(
      (preventedLossNgnHa / Math.max(1, Number(controlCostNgnHa))).toFixed(2)
    );

    const activeInstar =
      INSTAR_STAGES.find(
        (st) => Number(accumulatedGdd) >= st.minGdd && Number(accumulatedGdd) <= st.maxGdd
      ) || INSTAR_STAGES[INSTAR_STAGES.length - 1];

    const exceedsEil = Number(observedIncidencePct) >= eilPct;
    const exceedsEt = Number(observedIncidencePct) >= etPct;

    return {
      eilPct,
      etPct,
      exceedsEil,
      exceedsEt,
      untreatedLossNgnHa,
      preventedLossNgnHa,
      benefitCostRatio,
      activeInstar,
      decisionLabel: exceedsEil
        ? 'IMMEDIATE_IPM_AND_TARGETED_KNOCKDOWN'
        : exceedsEt
        ? 'EXECUTE_BIOCONTROL_RELEASE_NOW'
        : 'CONTINUE_WEEKLY_W_SCOUTING',
    };
  }, [
    defaultYieldTonsHa,
    defaultCropPriceNgnTon,
    observedIncidencePct,
    davisDamageScale,
    accumulatedGdd,
    controlCostNgnHa,
    controlEfficacyPct,
  ]);

  const handleSliderUpdate = (setter) => (e) => {
    const val = Number(e.target.value);
    setter(val);
    if (typeof onEvaluationChange === 'function') {
      onEvaluationChange({
        pestKey,
        observedIncidencePct,
        davisDamageScale,
        accumulatedGdd,
      });
    }
  };

  return (
    <section
      className="eil-calculator-card"
      data-testid="eil-threshold-calculator-card"
      aria-label="Pedigo Economic Injury Level and Degree-Day Larval Clock"
    >
      <header className="eil-card-header">
        <div>
          <span className="eil-eyebrow">
            PEDIGO EIL / ET BIO-ECONOMICS • BASKERVILLE-EMIN DEGREE-DAY CLOCK
          </span>
          <h3 className="eil-card-title">
            Economic Injury Threshold &amp; Larval Instar Susceptibility Simulator
          </h3>
          <p className="eil-card-subtitle">
            Species: <strong>{pestCommonName}</strong> • Action Status:{' '}
            <strong data-testid="eil-action-decision">{metrics.decisionLabel}</strong>
          </p>
        </div>

        <div className="eil-bcr-pill" data-testid="eil-bcr-badge">
          <span>Intervention BCR:</span>
          <strong>{metrics.benefitCostRatio}× ROI</strong>
        </div>
      </header>

      <div className="eil-threshold-strip">
        <div className="eil-stat-box">
          <span className="eil-stat-tag">ECONOMIC THRESHOLD (ET)</span>
          <strong className="eil-stat-main emerald" data-testid="eil-et-value">
            {metrics.etPct}% Infested
          </strong>
          <small>Preventive Biocontrol Trigger (0.75 × EIL)</small>
        </div>

        <div className="eil-stat-box">
          <span className="eil-stat-tag">ECONOMIC INJURY LEVEL (EIL)</span>
          <strong className="eil-stat-main ochre" data-testid="eil-eil-value">
            {metrics.eilPct}% Infested
          </strong>
          <small>Break-Even Damage Density</small>
        </div>

        <div className="eil-stat-box">
          <span className="eil-stat-tag">OBSERVED FIELD INCIDENCE</span>
          <strong
            className={`eil-stat-main ${
              metrics.exceedsEil ? 'danger' : metrics.exceedsEt ? 'ochre' : 'emerald'
            }`}
            data-testid="eil-observed-incidence"
          >
            {observedIncidencePct}% (Davis {davisDamageScale}/9)
          </strong>
          <small>
            Prevented Loss: ₦{metrics.preventedLossNgnHa.toLocaleString()}/ha
          </small>
        </div>
      </div>

      <div className="eil-sliders-grid">
        <div className="eil-slider-group">
          <div className="eil-slider-label">
            <label htmlFor="eil-incidence-slider">
              Scouted Infested Plants (%)
            </label>
            <strong>{observedIncidencePct}%</strong>
          </div>
          <input
            id="eil-incidence-slider"
            type="range"
            min="2"
            max="85"
            step="1"
            value={observedIncidencePct}
            onChange={handleSliderUpdate(setObservedIncidencePct)}
            data-testid="eil-incidence-slider"
          />
        </div>

        <div className="eil-slider-group">
          <div className="eil-slider-label">
            <label htmlFor="eil-davis-slider">
              Davis Foliar Whorl Damage Scale (1–9)
            </label>
            <strong>Score {davisDamageScale} / 9</strong>
          </div>
          <input
            id="eil-davis-slider"
            type="range"
            min="1"
            max="9"
            step="1"
            value={davisDamageScale}
            onChange={handleSliderUpdate(setDavisDamageScale)}
            data-testid="eil-davis-slider"
          />
        </div>

        <div className="eil-slider-group">
          <div className="eil-slider-label">
            <label htmlFor="eil-gdd-slider">
              Accumulated Degree-Days Since Biofix (°C·d)
            </label>
            <strong>{accumulatedGdd} GDD</strong>
          </div>
          <input
            id="eil-gdd-slider"
            type="range"
            min="15"
            max="440"
            step="5"
            value={accumulatedGdd}
            onChange={handleSliderUpdate(setAccumulatedGdd)}
            data-testid="eil-gdd-slider"
          />
        </div>

        <div className="eil-slider-group">
          <div className="eil-slider-label">
            <label htmlFor="eil-cost-slider">
              IPM Treatment Cost (₦/ha) [Efficacy {controlEfficacyPct}%]
            </label>
            <strong>₦{Number(controlCostNgnHa).toLocaleString()}/ha</strong>
          </div>
          <input
            id="eil-cost-slider"
            type="range"
            min="15000"
            max="65000"
            step="1500"
            value={controlCostNgnHa}
            onChange={handleSliderUpdate(setControlCostNgnHa)}
            data-testid="eil-cost-slider"
          />
        </div>
      </div>

      <div className="eil-instar-banner" data-testid="eil-instar-banner">
        <div>
          <span className="instar-eyebrow">ACTIVE THERMAL PHENOLOGY STAGE</span>
          <strong className="instar-stage-name">
            {metrics.activeInstar.code} — {metrics.activeInstar.label}
          </strong>
        </div>
        <div className="instar-susceptibility-pill">
          Biocontrol Susceptibility: <strong>{metrics.activeInstar.susceptibilityPct}%</strong>
        </div>
      </div>
    </section>
  );
};

EconomicInjuryThresholdCalculatorCard.propTypes = {
  pestKey: PropTypes.string,
  pestCommonName: PropTypes.string,
  defaultYieldTonsHa: PropTypes.number,
  defaultCropPriceNgnTon: PropTypes.number,
  onEvaluationChange: PropTypes.func,
};

export default EconomicInjuryThresholdCalculatorCard;
