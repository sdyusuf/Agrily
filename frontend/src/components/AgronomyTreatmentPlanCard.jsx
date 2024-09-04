/**
 * @file AgronomyTreatmentPlanCard.jsx
 * @description Curative and Organic Phytosanitary Treatment Plan Component.
 * Visualizes targeted chemical and organic bio-treatments, Pre-Harvest Interval (PHI)
 * safety countdowns, dosage calculators per field acreage, PPE safety requirements,
 * and NAFDAC regulatory compliance seals.
 */

import React, { useState, useEffect } from 'react';
import './AgronomyTreatmentPlanCard.css';

export default function AgronomyTreatmentPlanCard({ diagnosisRecord, initialAcreage = 2.5 }) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'CHEMICAL', 'ORGANIC'
  const [acreage, setAcreage] = useState(initialAcreage);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSeal, setCopiedSeal] = useState(false);

  const diseaseCode = (diagnosisRecord && diagnosisRecord.aiInference && diagnosisRecord.aiInference.diseaseCode) || 'TOM-EB-001';
  const cropType = (diagnosisRecord && diagnosisRecord.cropType) || 'TOMATO';

  useEffect(() => {
    let isMounted = true;
    const fetchPrescription = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/agronomy-vision/treatment-prescription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            diseaseCode,
            cropType,
            fieldAcreageHectares: Number(acreage) || 1.0,
            preferOrganicOnly: false
          })
        });

        const data = await res.json();
        if (isMounted && data && data.success) {
          setPrescriptionData(data);
        }
      } catch (err) {
        if (isMounted) console.error('Failed to load prescription:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPrescription();
    return () => { isMounted = false; };
  }, [diseaseCode, acreage]);

  const copySeal = () => {
    if (prescriptionData && prescriptionData.phytosanitaryClearanceSeal) {
      navigator.clipboard.writeText(prescriptionData.phytosanitaryClearanceSeal);
      setCopiedSeal(true);
      setTimeout(() => setCopiedSeal(false), 2000);
    }
  };

  const filteredTreatments = prescriptionData && prescriptionData.treatments
    ? prescriptionData.treatments.filter(t => {
        if (activeTab === 'CHEMICAL') return !t.organicCertified;
        if (activeTab === 'ORGANIC') return t.organicCertified;
        return true;
      })
    : [];

  return (
    <div className="agronomy-treatment-plan-card" data-testid="agronomy-treatment-plan-card">
      <div className="rx-header">
        <div className="rx-badge-group">
          <span className="rx-tag">💊 Phytosanitary Advisory Matrix</span>
          <span className="nafdac-compliance-badge">🛡️ NAFDAC & SON Standard Compliant</span>
        </div>
        <h2 className="rx-title">
          Treatment & Dosage Plan: {prescriptionData ? prescriptionData.diseaseName : 'Crop Foliar Disease'}
        </h2>
        <p className="rx-subtitle">
          Scientifically targeted chemical and biological curative recommendations with strict Pre-Harvest Interval (PHI) withdrawal windows.
        </p>
      </div>

      {/* Acreage Dosage Slider & Controls */}
      <div className="rx-dosage-adjuster">
        <div className="adjuster-label-row">
          <label htmlFor="acreage-slider" className="adjuster-label">
            Calculated for Field Acreage: <strong>{acreage} Hectares</strong> ({Math.round(acreage * 2.471)} Acres)
          </label>
          <div className="preset-buttons">
            <button type="button" className={`preset-btn ${acreage === 1.0 ? 'active' : ''}`} onClick={() => setAcreage(1.0)}>1.0 Ha</button>
            <button type="button" className={`preset-btn ${acreage === 2.5 ? 'active' : ''}`} onClick={() => setAcreage(2.5)}>2.5 Ha</button>
            <button type="button" className={`preset-btn ${acreage === 5.0 ? 'active' : ''}`} onClick={() => setAcreage(5.0)}>5.0 Ha</button>
            <button type="button" className={`preset-btn ${acreage === 10.0 ? 'active' : ''}`} onClick={() => setAcreage(10.0)}>10.0 Ha</button>
          </div>
        </div>
        <input
          id="acreage-slider"
          type="range"
          min="0.5"
          max="20.0"
          step="0.5"
          className="dosage-slider"
          value={acreage}
          onChange={(e) => setAcreage(parseFloat(e.target.value))}
        />
      </div>

      {/* Treatment Type Filter Tabs */}
      <div className="rx-tabs">
        <button
          type="button"
          className={`rx-tab ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          All Recommended Solutions ({prescriptionData && prescriptionData.treatments ? prescriptionData.treatments.length : 0})
        </button>
        <button
          type="button"
          className={`rx-tab ${activeTab === 'CHEMICAL' ? 'active' : ''}`}
          onClick={() => setActiveTab('CHEMICAL')}
        >
          🧪 Systemic Chemical Solutions
        </button>
        <button
          type="button"
          className={`rx-tab ${activeTab === 'ORGANIC' ? 'active' : ''}`}
          onClick={() => setActiveTab('ORGANIC')}
        >
          🌿 100% Organic Bio-Controls
        </button>
      </div>

      {/* Treatment Protocols List */}
      <div className="treatments-grid">
        {filteredTreatments.map((treatment) => (
          <div
            key={treatment.protocolCode}
            className={`treatment-card ${treatment.organicCertified ? 'organic-card' : 'chemical-card'}`}
          >
            <div className="treatment-top">
              <div className="treatment-badge-row">
                <span className={`treatment-type-pill ${treatment.organicCertified ? 'pill-organic' : 'pill-chem'}`}>
                  {treatment.organicCertified ? '🌿 ORGANIC CERTIFIED' : '🧪 SYSTEMIC CHEMICAL'}
                </span>
                <span className="efficacy-pill">
                  🎯 {treatment.curativeEfficacyPct}% Curative Efficacy
                </span>
              </div>
              <h3 className="treatment-name">{treatment.treatmentName}</h3>
              <p className="active-ingredient">
                Active Ingredient: <strong>{treatment.activeIngredient}</strong>
              </p>
            </div>

            {/* Dosage Calculation Strip */}
            <div className="dosage-specs-box">
              <div className="spec-item">
                <span className="spec-title">Required Product</span>
                <span className="spec-value">
                  {treatment.acreageCalculations.totalChemicalProductRequired} {treatment.dosageUnit === 'KG_PER_HA' ? 'kg' : 'Litres'}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-title">Dilution Water</span>
                <span className="spec-value">
                  {treatment.acreageCalculations.totalDilutionWaterLiters} Litres
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-title">20L Knapsack Sprayers</span>
                <span className="spec-value">
                  ~{treatment.acreageCalculations.estimated20LKnapsackLoads} Tanks
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-title">Est. Treatment Cost</span>
                <span className="spec-value cost-value">
                  ₦{treatment.acreageCalculations.estimatedTreatmentCostNgn.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Pre-Harvest Interval (PHI) Food Safety Alert */}
            <div className={`phi-safety-banner ${treatment.preHarvestIntervalDays === 0 ? 'phi-zero' : 'phi-window'}`}>
              <div className="phi-icon">
                {treatment.preHarvestIntervalDays === 0 ? '✅' : '⏳'}
              </div>
              <div className="phi-info">
                <span className="phi-title">
                  {treatment.preHarvestIntervalDays === 0
                    ? 'Zero Harvest Delay (Safe for Immediate Picking)'
                    : `Pre-Harvest Interval (PHI): Mandatory ${treatment.preHarvestIntervalDays}-Day Safety Withdrawal`}
                </span>
                <p className="phi-dates">
                  Earliest Safe Harvest Date: <strong>{treatment.safetyClearance.safeHarvestEarliestDate}</strong>
                </p>
              </div>
            </div>

            {/* Application Instructions */}
            <div className="instructions-section">
              <span className="instructions-heading">Application Protocol & Knapsack Guidance:</span>
              <p className="instructions-text">{treatment.instructions}</p>
            </div>

            {/* PPE Safety Badges */}
            <div className="ppe-badges-section">
              <span className="ppe-heading">Mandatory PPE:</span>
              <div className="ppe-tags">
                {treatment.requiredPPE.map((ppe, i) => (
                  <span key={i} className="ppe-tag">🥽 {ppe}</span>
                ))}
                <span className="nafdac-tag">📜 {treatment.nafdacRegNumber}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Seal and Certificate Export */}
      {prescriptionData && (
        <div className="rx-footer">
          <div className="seal-display">
            <span className="seal-label">Phytosanitary Digital Clearance Hash:</span>
            <code className="seal-code">{prescriptionData.phytosanitaryClearanceSeal}</code>
            <button type="button" className="copy-seal-btn" onClick={copySeal}>
              {copiedSeal ? '✓ Copied' : '📋 Copy Seal'}
            </button>
          </div>
          <button
            type="button"
            className="print-rx-btn"
            onClick={() => window.print()}
          >
            🖨️ Print Phytosanitary Prescription Certificate
          </button>
        </div>
      )}
    </div>
  );
}
