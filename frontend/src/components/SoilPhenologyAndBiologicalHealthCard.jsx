/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - SOIL PHENOLOGY & BIOLOGICAL HEALTH CARD
 * ==============================================================================
 * 
 * Component: SoilPhenologyAndBiologicalHealthCard
 * Displays:
 * 1. Soil Biological Health Index (BFI) & Enzymatic Activity Bars (DHA, Urease, ALP, FDA).
 * 2. Rhizosphere Pathogen Disease Suppressiveness Index (DSI) against wilt pathogens.
 * 3. Precision Bio-Inoculant Strains (Trichoderma, Mycorrhizae, Rhizobia, Bacillus).
 * 4. Crop Phenological Nutrient Uptake Timeline (% N, P, K partitioning per stage).
 * 5. Interactive Visual Deficiency Symptom Diagnostic and Emergency Foliar Chelate Rescue.
 * 
 * Design Standards: Strictly adheres to DESIGN_SYSTEM.md (Tactile micro-interactions,
 * lush emerald #1b4332 / #2d6a4f, warm ochre #bc6c25, slate typography).
 * 
 * @module components/SoilPhenologyAndBiologicalHealthCard
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import './SoilPhenologyAndBiologicalHealthCard.css';

const DEFAULT_PHENOLOGY_CURVES = {
  MAIZE: [
    { stage: 'Seedling to V4', days: '0-20 DAP', nPct: 10, pPct: 8, kPct: 12, focus: 'Basal starter NPK + Zinc furrow placement' },
    { stage: 'Knee-High (V6-V12)', days: '21-45 DAP', nPct: 45, pPct: 35, kPct: 45, focus: 'Primary split Urea top-dressing' },
    { stage: 'Tasseling / Silking', days: '46-70 DAP', nPct: 30, pPct: 35, kPct: 30, focus: 'Peak moisture & secondary N split' },
    { stage: 'Grain Fill & Maturity', days: '71-110 DAP', nPct: 15, pPct: 22, kPct: 13, focus: 'Stalk nutrient translocation to cobs' }
  ],
  TOMATO: [
    { stage: 'Transplant Recovery', days: '0-20 DAP', nPct: 15, pPct: 25, kPct: 10, focus: 'Starter high-P drench + Trichoderma root wash' },
    { stage: 'Flowering & First Fruit', days: '21-45 DAP', nPct: 35, pPct: 35, kPct: 40, focus: 'Calcium nitrate side-dress & Solubor spray' },
    { stage: 'Fruit Bulking & Color Turn', days: '46-75 DAP', nPct: 35, pPct: 25, kPct: 40, focus: 'Weekly potassium nitrate foliar feed' },
    { stage: 'Harvest Flush', days: '76-95 DAP', nPct: 15, pPct: 15, kPct: 10, focus: 'Steady irrigation to prevent fruit cracking' }
  ],
  CASSAVA: [
    { stage: 'Cutting Sprouting', days: '0-60 DAP', nPct: 20, pPct: 30, kPct: 15, focus: 'Basal compound NPK band around setts' },
    { stage: 'Tuber Initiation', days: '61-150 DAP', nPct: 40, pPct: 40, kPct: 50, focus: 'High potash MOP top-dressing during weeding' },
    { stage: 'Active Storage Bulking', days: '151-270 DAP', nPct: 30, pPct: 20, kPct: 30, focus: 'Avoid nitrogen; maximize starch synthesis' },
    { stage: 'Dormancy & Maturation', days: '271-330 DAP', nPct: 10, pPct: 10, kPct: 5, focus: 'Harvest tubers at peak commercial density' }
  ],
  RICE: [
    { stage: 'Establishment & Tillering', days: '0-30 DAP', nPct: 25, pPct: 35, kPct: 20, focus: 'Incorporate basal NPK + Zinc before puddling' },
    { stage: 'Panicle Initiation', days: '31-65 DAP', nPct: 45, pPct: 35, kPct: 45, focus: 'Apply urea top-dressing into 3cm water film' },
    { stage: 'Booting to Flowering', days: '66-90 DAP', nPct: 20, pPct: 20, kPct: 25, focus: 'Foliar micronutrient spray if deficient' },
    { stage: 'Ripening', days: '91-125 DAP', nPct: 10, pPct: 10, kPct: 10, focus: 'Drain paddy 10 days before grain harvest' }
  ]
};

const SYMPTOM_PRESETS = [
  { id: 'n-chlorosis', label: 'V-shaped chlorosis on lower leaves (Nitrogen)', element: 'N', recipe: 'Low-Biuret Soluble Urea 20g/L + sticker' },
  { id: 'p-purple', label: 'Purplish anthocyanin leaf margins (Phosphorus)', element: 'P', recipe: 'Mono-Potassium Phosphate (MKP 0-52-34) 10g/L' },
  { id: 'k-scorch', label: 'Marginal scorched leaf edges (Potassium)', element: 'K', recipe: 'Potassium Sulfate (SOP 0-0-50) 15g/L' },
  { id: 'ca-blossom', label: 'Blossom-end rot / cupped shoot tips (Calcium)', element: 'Ca', recipe: 'Chelated Calcium EDTA 2.5g/L or CaCl2 wash' },
  { id: 'zn-white', label: 'Bleached white bands between veins (Zinc)', element: 'Zn', recipe: 'Zinc EDTA Chelate 2.0g/L early morning mist' },
  { id: 'b-flower', label: 'Flower bud drop & hollow heart (Boron)', element: 'B', recipe: 'Solubor (20.5% Boron) 1.0g/L precision foliar' }
];

export default function SoilPhenologyAndBiologicalHealthCard({
  targetCrop = 'MAIZE',
  soilOrganicCarbonPct = 0.95,
  biologicalHealthTier = 'ADEQUATE_ACTIVE_MICROBIOME',
  className = ''
}) {
  const [activeTab, setActiveTab] = useState('BIOLOGY'); // 'BIOLOGY', 'PHENOLOGY', 'FOLIAR'
  const [selectedSymptomId, setSelectedSymptomId] = useState(null);

  const cropKey = (targetCrop || 'MAIZE').toUpperCase();
  const stages = DEFAULT_PHENOLOGY_CURVES[cropKey] || DEFAULT_PHENOLOGY_CURVES.MAIZE;

  const selectedSymptom = useMemo(() => {
    return SYMPTOM_PRESETS.find(s => s.id === selectedSymptomId) || null;
  }, [selectedSymptomId]);

  return (
    <div className={`soil-phenology-card ${className}`} id="soil-phenology-and-biology-card">
      <div className="card-header-bar">
        <div className="card-title-group">
          <span className="card-icon" aria-hidden="true">🌱</span>
          <div>
            <h3 className="card-title">Biological Vitality &amp; Phenological Uptake</h3>
            <p className="card-subtitle">
              Microbial enzyme kinetics, disease suppressiveness &amp; {cropKey} stage-specific foliar nutrition
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="tab-pill-group" role="tablist" aria-label="Phenology and Biology Navigation">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'BIOLOGY'}
            className={`tab-pill-btn ${activeTab === 'BIOLOGY' ? 'active' : ''}`}
            onClick={() => setActiveTab('BIOLOGY')}
          >
            🔬 Microbiome Vitality
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'PHENOLOGY'}
            className={`tab-pill-btn ${activeTab === 'PHENOLOGY' ? 'active' : ''}`}
            onClick={() => setActiveTab('PHENOLOGY')}
          >
            📈 Phenology Curves
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'FOLIAR'}
            className={`tab-pill-btn ${activeTab === 'FOLIAR' ? 'active' : ''}`}
            onClick={() => setActiveTab('FOLIAR')}
          >
            🩺 Visual Diagnostics
          </button>
        </div>
      </div>

      {/* TAB 1: Biological Vitality */}
      {activeTab === 'BIOLOGY' && (
        <div className="tab-content-panel biology-panel" role="tabpanel">
          <div className="biology-kpi-row">
            <div className="kpi-mini-card">
              <span className="kpi-label">Biological Fertility Index</span>
              <span className="kpi-value emerald-accent">72 / 100</span>
              <span className="status-pill status-pill-success">Thriving Rhizosphere</span>
            </div>
            <div className="kpi-mini-card">
              <span className="kpi-label">Pathogen Suppressiveness</span>
              <span className="kpi-value ochre-accent">68%</span>
              <span className="status-pill status-pill-info">Competitive Exclusion</span>
            </div>
            <div className="kpi-mini-card">
              <span className="kpi-label">Soil Organic Carbon</span>
              <span className="kpi-value">{soilOrganicCarbonPct.toFixed(2)}%</span>
              <span className="status-pill status-pill-neutral">Walkley-Black Assay</span>
            </div>
          </div>

          <h4 className="section-subheading">Soil Enzyme Kinetic Assays</h4>
          <div className="enzyme-bars-grid">
            <div className="enzyme-row">
              <div className="enzyme-header">
                <span className="enzyme-name">Dehydrogenase (DHA - Microbial Respiration)</span>
                <span className="enzyme-stat">78 µg TPF/g/24h (Adequate)</span>
              </div>
              <div className="progress-track" role="progressbar" aria-valuenow={65} aria-valuemin={0} aria-valuemax={100} aria-label="Dehydrogenase progress">
                <div className="progress-fill progress-emerald" style={{ width: '65%' }} />
              </div>
            </div>

            <div className="enzyme-row">
              <div className="enzyme-header">
                <span className="enzyme-name">Urease (Nitrogen Mineralization)</span>
                <span className="enzyme-stat">52 µg NH4-N/g/2h (Active)</span>
              </div>
              <div className="progress-track" role="progressbar" aria-valuenow={58} aria-valuemin={0} aria-valuemax={100} aria-label="Urease progress">
                <div className="progress-fill progress-emerald" style={{ width: '58%' }} />
              </div>
            </div>

            <div className="enzyme-row">
              <div className="enzyme-header">
                <span className="enzyme-name">Alkaline Phosphatase (P-Solubilization)</span>
                <span className="enzyme-stat">145 µg p-NP/g/h (Optimal)</span>
              </div>
              <div className="progress-track" role="progressbar" aria-valuenow={72} aria-valuemin={0} aria-valuemax={100} aria-label="Phosphatase progress">
                <div className="progress-fill progress-emerald" style={{ width: '72%' }} />
              </div>
            </div>

            <div className="enzyme-row">
              <div className="enzyme-header">
                <span className="enzyme-name">Fluorescein Diacetate (FDA Hydrolysis)</span>
                <span className="enzyme-stat">2.4 µg/g/h (Active Fungi/Bacteria)</span>
              </div>
              <div className="progress-track" role="progressbar" aria-valuenow={60} aria-valuemin={0} aria-valuemax={100} aria-label="FDA progress">
                <div className="progress-fill progress-ochre" style={{ width: '60%' }} />
              </div>
            </div>
          </div>

          <h4 className="section-subheading">Prescribed Regenerative Bio-Inoculants</h4>
          <div className="bio-inoculants-grid">
            <div className="bio-card">
              <div className="bio-card-top">
                <span className="bio-code">TH-NIG-042</span>
                <span className="status-pill status-pill-success">Biological Fungicide</span>
              </div>
              <h5 className="bio-strain-name">Trichoderma harzianum</h5>
              <p className="bio-desc">Suppresses Fusarium &amp; Pythium damping-off through aggressive competitive exclusion.</p>
              <div className="bio-rate">Application: <strong>2.5 kg/ha seed dressing or furrow drench</strong></div>
            </div>

            <div className="bio-card">
              <div className="bio-card-top">
                <span className="bio-code">AMF-NIG-007</span>
                <span className="status-pill status-pill-info">VAM Mycorrhizae</span>
              </div>
              <h5 className="bio-strain-name">Rhizophagus irregularis</h5>
              <p className="bio-desc">Expands root absorptive surface area 400%, solubilizing occluded rock phosphate.</p>
              <div className="bio-rate">Application: <strong>5.0 kg/ha in-furrow root matrix placement</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Phenology Curves */}
      {activeTab === 'PHENOLOGY' && (
        <div className="tab-content-panel phenology-panel" role="tabpanel">
          <div className="phenology-header-banner">
            <div>
              <span className="banner-crop-badge">{cropKey}</span>
              <h4 className="banner-heading">Stage-by-Stage Nutrient Uptake Partitioning</h4>
            </div>
            <p className="banner-desc">Synchronize fertilizer top-dressing with crop physiological demand to prevent leaching losses.</p>
          </div>

          <div className="phenology-timeline">
            {stages.map((stg, idx) => (
              <div key={idx} className="timeline-node">
                <div className="timeline-marker">{idx + 1}</div>
                <div className="timeline-card">
                  <div className="timeline-card-header">
                    <h5 className="stage-title">{stg.stage}</h5>
                    <span className="stage-days">{stg.days}</span>
                  </div>
                  <div className="stage-partition-row">
                    <div className="nutrient-chip chip-n">N: <strong>{stg.nPct}%</strong></div>
                    <div className="nutrient-chip chip-p">P2O5: <strong>{stg.pPct}%</strong></div>
                    <div className="nutrient-chip chip-k">K2O: <strong>{stg.kPct}%</strong></div>
                  </div>
                  <p className="stage-advisory">{stg.focus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Visual Diagnostics & Foliar Chelate Recipes */}
      {activeTab === 'FOLIAR' && (
        <div className="tab-content-panel foliar-panel" role="tabpanel">
          <p className="panel-instruction">
            Select an observed visual crop canopy symptom to retrieve the emergency foliar chelate rescue protocol:
          </p>

          <div className="symptom-button-grid" role="group" aria-label="Visual Deficiency Selector">
            {SYMPTOM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`symptom-select-btn ${selectedSymptomId === preset.id ? 'selected' : ''}`}
                onClick={() => setSelectedSymptomId(preset.id)}
              >
                <span className="symptom-element-bubble">{preset.element}</span>
                <span className="symptom-text">{preset.label}</span>
              </button>
            ))}
          </div>

          {selectedSymptom ? (
            <div className="foliar-prescription-box" id="foliar-rescue-box">
              <div className="prescription-badge">
                <span>🚨 EMERGENCY FOLIAR RESCUE PROTOCOL</span>
              </div>
              <h4 className="recipe-target">Element Deficit: {selectedSymptom.element}</h4>
              <p className="recipe-details"><strong>Prescribed Product:</strong> {selectedSymptom.recipe}</p>
              <div className="spray-guidelines">
                <div className="guideline-item">
                  <span className="guideline-icon">⏰</span>
                  <span><strong>Optimal Window:</strong> Apply at 06:30 - 09:30 or 16:30 - 18:30 (avoid midday heat &gt; 30°C)</span>
                </div>
                <div className="guideline-item">
                  <span className="guideline-icon">💧</span>
                  <span><strong>Water Volume:</strong> 200 Litres per hectare with non-ionic agricultural wetting surfactant</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-symptom-prompt">
              <span>👆 Click any visual symptom above to formulate an immediate knapsack foliar rescue recipe.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
