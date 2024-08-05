/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: QUALITY INSPECTION MODAL COMPONENT
 * ==============================================================================
 * 
 * Interactive dockside produce inspection sheet and grading calculator.
 * Strictly adheres to DESIGN_SYSTEM.md ("Earth & Innovation" tokens).
 * 
 * Features:
 *  - Real-time agricultural grade calculation (Grade A Export, Grade B, Grade C, Rejected).
 *  - Dynamic moisture, spoilage, and dock temperature parameter controls.
 *  - SON/NAFDAC statutory defect threshold validation.
 *  - Inspector digital signature and proof attachment simulation.
 * 
 * @module components/QualityInspectionModal
 * @author Agrily Frontend Engineering
 * ==============================================================================
 */

import React, { useState, useMemo } from 'react';
import './QualityInspectionModal.css';

const baseSvgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

const ShieldCheckIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} {...baseSvgProps} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const AlertTriangleIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} {...baseSvgProps} className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ThermometerIcon = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} {...baseSvgProps} className={className}>
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

const DropletIcon = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} {...baseSvgProps} className={className}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const CloseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} {...baseSvgProps}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function QualityInspectionModal({
  show,
  onClose,
  vault,
  onSubmitInspection,
  isSubmitting = false
}) {
  const [produceCategory, setProduceCategory] = useState(vault?.produceCategory || 'vegetables');
  const [produceName, setProduceName] = useState(vault?.produceName || 'Roma Tomatoes (Plum)');
  const [inspectedQuantityKg, setInspectedQuantityKg] = useState(vault?.quantityKg || 3500);
  const [inspectedCratesBags, setInspectedCratesBags] = useState(vault?.cratesBags || 120);

  // Inspection metrics state
  const [moistureContent, setMoistureContent] = useState(92.5);
  const [foreignMatter, setForeignMatter] = useState(1.0);
  const [spoilageRot, setSpoilageRot] = useState(1.5);
  const [coreTemp, setCoreTemp] = useState(7.5);
  const [moldDetected, setMoldDetected] = useState(false);
  const [pestDetected, setPestDetected] = useState(false);
  const [uniformityScore, setUniformityScore] = useState(8);

  // Inspector signature
  const [inspectorName, setInspectorName] = useState('Chinedu Eze');
  const [inspectorBadge, setInspectorBadge] = useState('INSP-LAG-044');
  const [inspectorPhone, setInspectorPhone] = useState('+2348039991122');
  const [dockFacility, setDockFacility] = useState('Mile 12 Central Agro-Receiving Hub');
  const [errorMsg, setErrorMsg] = useState('');

  // Live evaluated grade & score
  const computedEvaluation = useMemo(() => {
    let score = 100;
    score -= (spoilageRot * 6.5);
    score -= (foreignMatter * 3.5);
    if (moldDetected) score -= 45;
    if (pestDetected) score -= 35;
    if (produceCategory === 'grains' && moistureContent > 13.0) {
      score -= ((moistureContent - 13.0) * 5.0);
    }
    if (coreTemp > 10.0 && produceCategory === 'vegetables') {
      score -= Math.min(25, (coreTemp - 10.0) * 3);
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    let grade = 'GRADE_A_EXPORT_PREMIUM';
    let gradeLabel = 'Grade A: Export Premium';
    let badgeClass = 'badge-grade-a';
    let recommendation = 'ACCEPT_FULL_SETTLEMENT';
    let discountPct = 0;

    if (moldDetected || pestDetected || spoilageRot > 8.0 || finalScore < 50) {
      grade = 'REJECTED_UNFIT';
      gradeLabel = 'Rejected: Unfit for Commerce';
      badgeClass = 'badge-grade-reject';
      recommendation = 'LODGE_TRIBUNAL_DISPUTE';
      discountPct = 100;
    } else if (spoilageRot > 4.5 || finalScore < 70) {
      grade = 'GRADE_C_PROCESSING_ONLY';
      gradeLabel = 'Grade C: Processing Grade';
      badgeClass = 'badge-grade-c';
      recommendation = 'ACCEPT_WITH_PRO_RATA_DISCOUNT';
      discountPct = Math.round(spoilageRot * 1.5);
    } else if (spoilageRot > 2.0 || finalScore < 85) {
      grade = 'GRADE_B_WHOLESALE_STANDARD';
      gradeLabel = 'Grade B: Wholesale Standard';
      badgeClass = 'badge-grade-b';
      recommendation = 'ACCEPT_FULL_SETTLEMENT';
      discountPct = 0;
    }

    return {
      finalScore,
      grade,
      gradeLabel,
      badgeClass,
      recommendation,
      discountPct
    };
  }, [produceCategory, moistureContent, foreignMatter, spoilageRot, coreTemp, moldDetected, pestDetected]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!inspectorName.trim() || !inspectorBadge.trim()) {
      setErrorMsg('Inspector name and badge credential are required.');
      return;
    }

    const payload = {
      produceCategory,
      produceName,
      inspectedQuantityKg: Number(inspectedQuantityKg),
      inspectedCratesBags: Number(inspectedCratesBags),
      inspectionFacility: {
        name: dockFacility,
        address: 'Ikorodu Road, Ketu, Lagos',
        state: 'Lagos',
        gpsCoordinates: { latitude: 6.6018, longitude: 3.3934 }
      },
      inspector: {
        name: inspectorName,
        inspectorBadgeNumber: inspectorBadge,
        contactPhone: inspectorPhone
      },
      metrics: {
        moistureContentPercentage: Number(moistureContent),
        foreignMatterPercentage: Number(foreignMatter),
        spoilageRotPercentage: Number(spoilageRot),
        pestInfestationDetected: Boolean(pestDetected),
        moldMildewDetected: Boolean(moldDetected),
        dockCoreTemperatureCelsius: Number(coreTemp),
        dockAmbientTemperatureCelsius: 28.5,
        sizeMaturityUniformityScore: Number(uniformityScore)
      },
      inspectorDigitalSignature: `SIG-${inspectorBadge}-${Date.now()}`,
      receiverRepresentativeSignature: {
        name: inspectorName,
        title: 'Receiving Dock Quality Inspector'
      }
    };

    if (onSubmitInspection) {
      onSubmitInspection(payload);
    }
  };

  return (
    <div className="inspection-modal-overlay" role="dialog" aria-modal="true" data-testid="quality-inspection-modal">
      <div className="inspection-modal-container">
        {/* Modal Header */}
        <div className="inspection-modal-header">
          <div className="header-branding">
            <span className="modal-icon-badge">
              <ShieldCheckIcon size={22} />
            </span>
            <div>
              <h2 className="modal-title">Official Agricultural Quality Inspection</h2>
              <p className="modal-subtitle">
                Receiver Dock Verification for Vault <strong>{vault?.vaultNumber || 'VAULT-ACTIVE'}</strong>
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="inspection-modal-body">
            {errorMsg && (
              <div className="inspection-alert-box error" role="alert">
                <AlertTriangleIcon size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Top Grade Summary Ribbon */}
            <div className={`grade-summary-ribbon ${computedEvaluation.badgeClass}`}>
              <div className="ribbon-left">
                <span className="ribbon-badge-label">{computedEvaluation.gradeLabel}</span>
                <span className="ribbon-score">Composite Quality Index: <strong>{computedEvaluation.finalScore} / 100</strong></span>
              </div>
              <div className="ribbon-right">
                {computedEvaluation.discountPct > 0 ? (
                  <span className="ribbon-discount-pill">
                    Rec. Price Adjustment: -{computedEvaluation.discountPct}%
                  </span>
                ) : (
                  <span className="ribbon-pass-pill">
                    Standard Full Release
                  </span>
                )}
              </div>
            </div>

            {/* Commodity Info Row */}
            <div className="input-grid two-col">
              <div className="form-group">
                <label className="input-label">Commodity Taxonomy</label>
                <select
                  className="form-control"
                  value={produceCategory}
                  onChange={(e) => setProduceCategory(e.target.value)}
                  data-testid="select-produce-category"
                >
                  <option value="vegetables">Vegetables & Fresh Greens</option>
                  <option value="grains">Cereal Grains & Pulses</option>
                  <option value="tubers">Root Tubers & Yams</option>
                  <option value="fruits">Orchard & Citrus Fruits</option>
                </select>
              </div>

              <div className="form-group">
                <label className="input-label">Produce Variety</label>
                <input
                  type="text"
                  className="form-control"
                  value={produceName}
                  onChange={(e) => setProduceName(e.target.value)}
                />
              </div>
            </div>

            {/* Quantitative Sliders Section */}
            <div className="metrics-card-section">
              <h3 className="section-heading">Dockside Physical Measurements</h3>

              <div className="input-grid two-col">
                <div className="metric-slider-box">
                  <div className="slider-label-row">
                    <span><DropletIcon size={16} /> Moisture Content (%)</span>
                    <strong className="slider-val" data-testid="moisture-display">{moistureContent}%</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="98"
                    step="0.5"
                    value={moistureContent}
                    onChange={(e) => setMoistureContent(parseFloat(e.target.value))}
                    className="metric-range"
                    data-testid="input-moisture"
                  />
                  <div className="slider-range-subtext">Grain Std: &le;13.0% | Veg: &le;95.0%</div>
                </div>

                <div className="metric-slider-box">
                  <div className="slider-label-row">
                    <span><AlertTriangleIcon size={16} /> Spoilage & Rot Rate (%)</span>
                    <strong className={`slider-val ${spoilageRot > 4.5 ? 'text-danger' : ''}`} data-testid="spoilage-display">
                      {spoilageRot}%
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="0.5"
                    value={spoilageRot}
                    onChange={(e) => setSpoilageRot(parseFloat(e.target.value))}
                    className="metric-range"
                    data-testid="input-spoilage"
                  />
                  <div className="slider-range-subtext">&le;2% Grade A | &gt;8% Auto-Dispute</div>
                </div>

                <div className="metric-slider-box">
                  <div className="slider-label-row">
                    <span>Foreign Matter / Chaff (%)</span>
                    <strong className="slider-val">{foreignMatter}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.2"
                    value={foreignMatter}
                    onChange={(e) => setForeignMatter(parseFloat(e.target.value))}
                    className="metric-range"
                  />
                  <div className="slider-range-subtext">Statutory limit: &le;2.0%</div>
                </div>

                <div className="metric-slider-box">
                  <div className="slider-label-row">
                    <span><ThermometerIcon size={16} /> Core Pulp Temperature (°C)</span>
                    <strong className={`slider-val ${coreTemp > 12 ? 'text-danger' : ''}`}>
                      {coreTemp}°C
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="35"
                    step="0.5"
                    value={coreTemp}
                    onChange={(e) => setCoreTemp(parseFloat(e.target.value))}
                    className="metric-range"
                  />
                  <div className="slider-range-subtext">Cold-chain reefer target: &le;10.0°C</div>
                </div>
              </div>

              {/* Pathological Flag Checkboxes */}
              <div className="hazard-checkbox-group">
                <label className="hazard-check-label">
                  <input
                    type="checkbox"
                    checked={moldDetected}
                    onChange={(e) => setMoldDetected(e.target.checked)}
                    data-testid="check-mold"
                  />
                  <span className="hazard-text">Mold / Mycotoxin Contamination Present (Immediate Reject)</span>
                </label>

                <label className="hazard-check-label">
                  <input
                    type="checkbox"
                    checked={pestDetected}
                    onChange={(e) => setPestDetected(e.target.checked)}
                  />
                  <span className="hazard-text">Live Insect Infestation Detected</span>
                </label>
              </div>
            </div>

            {/* Inspector Identity & Certification */}
            <div className="inspector-credentials-section">
              <h3 className="section-heading">Inspector Credential Sign-Off</h3>
              <div className="input-grid three-col">
                <div className="form-group">
                  <label className="input-label">Lead Inspector</label>
                  <input
                    type="text"
                    className="form-control"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Inspector Badge #</label>
                  <input
                    type="text"
                    className="form-control"
                    value={inspectorBadge}
                    onChange={(e) => setInspectorBadge(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Receiving Terminal</label>
                  <input
                    type="text"
                    className="form-control"
                    value={dockFacility}
                    onChange={(e) => setDockFacility(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="inspection-modal-footer">
            <button type="button" className="btn-agrily-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-agrily-primary"
              disabled={isSubmitting}
              data-testid="btn-submit-inspection"
            >
              {isSubmitting ? 'Lodging Certificate...' : 'Stamp & Lodge Inspection Certificate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QualityInspectionModal;
