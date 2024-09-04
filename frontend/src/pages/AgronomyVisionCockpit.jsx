/**
 * @file AgronomyVisionCockpit.jsx
 * @description Master Agronomy AI Vision & Crop Pathology Cockpit Page.
 * Central operational hub unifying real-time foliar leaf diagnosis,
 * curative phytosanitary prescriptions, and 36-state contagion telemetry.
 */

import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import LeafPathologyScannerCard from '../components/LeafPathologyScannerCard';
import AgronomyTreatmentPlanCard from '../components/AgronomyTreatmentPlanCard';
import RegionalDiseaseHeatmapCard from '../components/RegionalDiseaseHeatmapCard';
import './AgronomyVisionCockpit.css';

export default function AgronomyVisionCockpit() {
  const [activeViewTab, setActiveViewTab] = useState('SCANNER'); // 'SCANNER', 'TREATMENT', 'HEATMAP', 'HISTORY'
  const [currentDiagnosis, setCurrentDiagnosis] = useState(null);
  const [recentDiagnoses, setRecentDiagnoses] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadDiagnoses = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await fetch('/api/agronomy-vision/diagnoses?limit=10');
        const data = await res.json();
        if (isMounted && data && data.success && data.records) {
          setRecentDiagnoses(data.records);
        }
      } catch (err) {
        if (isMounted) console.error('Failed to load recent diagnoses:', err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };

    loadDiagnoses();
    return () => { isMounted = false; };
  }, []);

  const fetchRecentDiagnoses = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/agronomy-vision/diagnoses?limit=10');
      const data = await res.json();
      if (data.success && data.records) {
        setRecentDiagnoses(data.records);
      }
    } catch (err) {
      console.error('Failed to load recent diagnoses:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDiagnosisComplete = (result) => {
    if (result && result.record) {
      setCurrentDiagnosis(result.record);
      setRecentDiagnoses((prev) => [result.record, ...prev]);
    }
  };

  const handleSelectTreatment = (record) => {
    setCurrentDiagnosis(record);
    setActiveViewTab('TREATMENT');
  };

  return (
    <div className="agronomy-cockpit-page" data-testid="agronomy-vision-cockpit-page">
      <NavBar />

      <main className="cockpit-container">
        {/* Cockpit Hero Banner */}
        <section className="cockpit-hero">
          <div className="hero-content">
            <span className="hero-pill">🌿 Enterprise Agronomy AI Suite</span>
            <h1 className="hero-heading">Agronomy Disease Vision &amp; Telemetry Cockpit</h1>
            <p className="hero-description">
              AI-driven crop foliar diagnostics across 10 Nigerian commodities, automated lesion triage staging,
              Pre-Harvest Interval (PHI) curative treatment plans, and national contagion radar.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="cockpit-kpi-grid">
            <div className="cockpit-kpi-box">
              <span className="kpi-box-num">12,480</span>
              <span className="kpi-box-label">Foliar Scans Processed</span>
            </div>
            <div className="cockpit-kpi-box">
              <span className="kpi-box-num kpi-highlight-ochre">₦184.5M</span>
              <span className="kpi-box-label">Crop Yield Saved</span>
            </div>
            <div className="cockpit-kpi-box">
              <span className="kpi-box-num">37</span>
              <span className="kpi-box-label">States Monitored</span>
            </div>
            <div className="cockpit-kpi-box">
              <span className="kpi-box-num kpi-highlight-green">94.8%</span>
              <span className="kpi-box-label">Diagnosis Accuracy</span>
            </div>
          </div>
        </section>

        {/* Cockpit Navigation Tabs */}
        <nav className="cockpit-tabs-nav" aria-label="Agronomy Dashboard Tabs">
          <button
            type="button"
            className={`tab-btn ${activeViewTab === 'SCANNER' ? 'active-tab' : ''}`}
            onClick={() => setActiveViewTab('SCANNER')}
          >
            🔬 AI Foliar Scanner
          </button>
          <button
            type="button"
            className={`tab-btn ${activeViewTab === 'TREATMENT' ? 'active-tab' : ''}`}
            onClick={() => setActiveViewTab('TREATMENT')}
          >
            💊 Treatment &amp; Dosage Matrix
          </button>
          <button
            type="button"
            className={`tab-btn ${activeViewTab === 'HEATMAP' ? 'active-tab' : ''}`}
            onClick={() => setActiveViewTab('HEATMAP')}
          >
            🗺️ Regional Outbreak Radar
          </button>
          <button
            type="button"
            className={`tab-btn ${activeViewTab === 'HISTORY' ? 'active-tab' : ''}`}
            onClick={() => setActiveViewTab('HISTORY')}
          >
            📋 Diagnostic Audit Trail
          </button>
        </nav>

        {/* Tab 1: Foliar Scanner */}
        {activeViewTab === 'SCANNER' && (
          <section className="tab-view-content" data-testid="tab-scanner-view">
            <LeafPathologyScannerCard
              onDiagnosisComplete={handleDiagnosisComplete}
              onSelectTreatment={handleSelectTreatment}
            />
          </section>
        )}

        {/* Tab 2: Treatment & Dosage Plan */}
        {activeViewTab === 'TREATMENT' && (
          <section className="tab-view-content" data-testid="tab-treatment-view">
            <AgronomyTreatmentPlanCard
              diagnosisRecord={currentDiagnosis}
              initialAcreage={currentDiagnosis ? currentDiagnosis.fieldAcreageHectares : 2.5}
            />
          </section>
        )}

        {/* Tab 3: Regional Outbreak Heatmap */}
        {activeViewTab === 'HEATMAP' && (
          <section className="tab-view-content" data-testid="tab-heatmap-view">
            <RegionalDiseaseHeatmapCard />
          </section>
        )}

        {/* Tab 4: Diagnostic History Log */}
        {activeViewTab === 'HISTORY' && (
          <section className="tab-view-content" data-testid="tab-history-view">
            <div className="history-table-card">
              <div className="history-table-header">
                <h3 className="table-card-title">Recent Crop Pathology Records</h3>
                <button
                  type="button"
                  className="refresh-btn"
                  onClick={fetchRecentDiagnoses}
                  disabled={isLoadingHistory}
                >
                  🔄 Refresh Records
                </button>
              </div>

              <div className="table-responsive">
                <table className="diagnoses-table">
                  <thead>
                    <tr>
                      <th>Diagnosis ID</th>
                      <th>Commodity</th>
                      <th>Producer / Hub</th>
                      <th>Identified Pathogen</th>
                      <th>Severity &amp; Triage</th>
                      <th>Yield Risk</th>
                      <th>Tamper Seal</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDiagnoses.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="empty-table-cell">
                          No recent pathology records found. Run a foliar scan to log a new diagnosis.
                        </td>
                      </tr>
                    ) : (
                      recentDiagnoses.map((record) => (
                        <tr key={record.diagnosisId || record._id}>
                          <td>
                            <code className="diag-id-pill">{record.diagnosisId}</code>
                          </td>
                          <td>
                            <strong>{record.cropType}</strong>
                          </td>
                          <td>
                            {record.farmerName} ({record.farmLocation ? record.farmLocation.state : 'NIG'})
                          </td>
                          <td>
                            {record.aiInference ? record.aiInference.commonDiseaseName : 'Unknown'}
                          </td>
                          <td>
                            <span className="table-severity-pill">
                              {record.aiInference ? record.aiInference.triagePriority.replace(/_/g, ' ') : 'NORMAL'}
                            </span>
                          </td>
                          <td>
                            {record.economicImpactEstimate ? `${record.economicImpactEstimate.projectedYieldLossPct}% loss` : '0%'}
                          </td>
                          <td>
                            <span className="seal-truncated" title={record.cryptographicSeal}>
                              {record.cryptographicSeal ? `${record.cryptographicSeal.substring(0, 8)}...` : 'N/A'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="view-rx-action-btn"
                              onClick={() => handleSelectTreatment(record)}
                            >
                              Prescribe
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
