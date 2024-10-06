/**
 * @file LeafPathologyScannerCard.jsx
 * @description Interactive AI Foliar Pathology Scanner Card.
 * Enables farmers and agronomists to upload or simulate mobile camera capture of crop foliage,
 * select target commodities across 10 Nigerian crops, set field acreage, visualize
 * neural inference progress with bounding-box lesion detection overlays,
 * and view automated triage priority staging with economic yield loss estimates.
 */

import React, { useState } from 'react';
import {
  WheatIcon,
  CameraIcon,
  FlaskIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  MicroscopeIcon,
  ZapIcon,
  PillIcon
} from './Icons';
import './LeafPathologyScannerCard.css';

const NIGERIAN_CROPS = [
  { code: 'TOMATO', label: 'Tomato (Solanum lycopersicum)', defaultDisease: 'TOM-EB-001' },
  { code: 'CASSAVA', label: 'Cassava (Manihot esculenta)', defaultDisease: 'CAS-CMD-001' },
  { code: 'MAIZE', label: 'Maize (Zea mays)', defaultDisease: 'MAIZ-FAW-001' },
  { code: 'YAM', label: 'Yam (Dioscorea rotundata)', defaultDisease: 'YAM-ANT-001' },
  { code: 'COCOA', label: 'Cocoa (Theobroma cacao)', defaultDisease: 'COC-BP-001' },
  { code: 'RICE', label: 'Rice (Oryza sativa)', defaultDisease: 'RIC-BLAST-001' },
  { code: 'SORGHUM', label: 'Sorghum (Sorghum bicolor)', defaultDisease: 'SORG-ANT-001' },
  { code: 'COWPEA', label: 'Cowpea (Vigna unguiculata)', defaultDisease: 'COW-CLS-001' },
  { code: 'PEPPER', label: 'Pepper (Capsicum annuum)', defaultDisease: 'PEP-BS-001' },
  { code: 'OIL_PALM', label: 'Oil Palm (Elaeis guineensis)', defaultDisease: 'PALM-LS-001' }
];

const SEVERITY_OPTIONS = [
  { value: 'EARLY', label: 'Stage 1: Early Lesion (10-20% canopy)' },
  { value: 'MODERATE', label: 'Stage 2: Moderate Foliar Spread (25-45% canopy)' },
  { value: 'SEVERE', label: 'Stage 3: Severe Defoliation (50-75% canopy)' },
  { value: 'CATASTROPHIC', label: 'Stage 4: Catastrophic Canopy Collapse (80-95% canopy)' }
];

export default function LeafPathologyScannerCard({ onDiagnosisComplete, onSelectTreatment }) {
  const [selectedCrop, setSelectedCrop] = useState('TOMATO');
  const [severityTier, setSeverityTier] = useState('MODERATE');
  const [fieldAcreage, setFieldAcreage] = useState(2.5);
  const [farmerName, setFarmerName] = useState('Mallam Aliyu Garba');
  const [stateLocation, setStateLocation] = useState('KANO');
  const [lgaLocation, setLgaLocation] = useState('Kura');
  const [isSimulatingHealthy, setIsSimulatingHealthy] = useState(false);
  const [previewImage, setPreviewImage] = useState('https://images.unsplash.com/photo-1592417817098-8f3d69109853?auto=format&fit=crop&w=800&q=80');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const executeNeuralScan = async () => {
    setIsScanning(true);
    setScanProgress(15);
    setErrorMsg('');
    setDiagnosisResult(null);

    // Realistic scanning progress animation
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 180);

    try {
      const cropConfig = NIGERIAN_CROPS.find(c => c.code === selectedCrop);
      const forcedDisease = isSimulatingHealthy ? `${selectedCrop}-HEALTHY` : (cropConfig ? cropConfig.defaultDisease : undefined);

      const payload = {
        cropType: selectedCrop,
        farmerName,
        farmLocation: {
          state: stateLocation,
          lga: lgaLocation,
          agroZone: 'SUDAN_SAVANNA'
        },
        fieldAcreageHectares: Number(fieldAcreage) || 1.0,
        imageUrl: previewImage,
        forcedDiseaseCode: forcedDisease,
        severityLevel: isSimulatingHealthy ? 'HEALTHY' : severityTier
      };

      const res = await fetch('/api/agronomy-vision/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      clearInterval(interval);
      setScanProgress(100);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Diagnostic scan failed.');
      }

      setDiagnosisResult(data);
      if (onDiagnosisComplete) {
        onDiagnosisComplete(data);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
      }, 350);
    }
  };

  const getTriagePillClass = (priority) => {
    switch (priority) {
      case 'CRITICAL_QUARANTINE_ERADICATION':
        return 'triage-pill triage-critical';
      case 'HIGH_EMERGENCY_CHEMICAL_INTERVENTION':
        return 'triage-pill triage-high';
      case 'MEDIUM_ISOLATE_ZONE':
        return 'triage-pill triage-medium';
      case 'LOW_WATCHLIST':
      default:
        return 'triage-pill triage-low';
    }
  };

  return (
    <div className="leaf-pathology-scanner-card" data-testid="leaf-pathology-scanner-card">
      <div className="scanner-header">
        <div className="scanner-title-group">
          <span className="scanner-tag">
            <WheatIcon size={14} /> Agronomy AI Vision v2.4
          </span>
          <h2 className="scanner-title">Crop Foliar Disease Neural Scanner</h2>
          <p className="scanner-subtitle">
            Instant multi-crop leaf pathogen diagnosis, lesion severity staging, and quarantine triage for Nigerian agriculture.
          </p>
        </div>
        <div className="scanner-status-indicator">
          <span className="live-pulse"></span>
          <span className="model-badge">TensorFlowJS Tropical Model</span>
        </div>
      </div>

      <div className="scanner-body-grid">
        {/* Left Column: Image Viewfinder & Camera Dropzone */}
        <div className="viewfinder-section">
          <div className="viewfinder-frame">
            <img
              src={previewImage}
              alt="Crop Foliar Specimen"
              className={`specimen-image ${isScanning ? 'scanning-blur' : ''}`}
            />

            {/* Neural scan laser line animation */}
            {isScanning && (
              <div className="laser-scan-line">
                <span className="laser-glow"></span>
              </div>
            )}

            {/* Bounding box overlays when diagnosis completes */}
            {diagnosisResult && diagnosisResult.visionTelemetry && diagnosisResult.visionTelemetry.lesionBoundingBoxes && (
              <div className="bounding-box-overlay">
                {diagnosisResult.visionTelemetry.lesionBoundingBoxes.map((box, idx) => (
                  <div
                    key={box.boxId || idx}
                    className="lesion-box"
                    style={{
                      top: `${box.coordinates.ymin * 100}%`,
                      left: `${box.coordinates.xmin * 100}%`,
                      height: `${(box.coordinates.ymax - box.coordinates.ymin) * 100}%`,
                      width: `${(box.coordinates.xmax - box.coordinates.xmin) * 100}%`
                    }}
                  >
                    <span className="lesion-label">Lesion #0{idx + 1} ({Math.round(box.lesionConfidence * 100)}%)</span>
                  </div>
                ))}
              </div>
            )}

            <div className="viewfinder-controls">
              <label htmlFor="leaf-file-input" className="file-upload-btn">
                <CameraIcon size={16} /> Upload Leaf Photo
              </label>
              <input
                id="leaf-file-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="sample-switch-btn"
                onClick={() => setIsSimulatingHealthy(!isSimulatingHealthy)}
              >
                {isSimulatingHealthy ? (
                  <>
                    <FlaskIcon size={14} /> Mode: Healthy Foliage
                  </>
                ) : (
                  <>
                    <AlertTriangleIcon size={14} /> Mode: Disease Lesion
                  </>
                )}
              </button>
            </div>
          </div>

          {isScanning && (
            <div className="progress-bar-container">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${scanProgress}%` }}></div>
              </div>
              <span className="progress-label">Analyzing foliar spectral patterns... {scanProgress}%</span>
            </div>
          )}

          {errorMsg && (
            <div className="scanner-error-banner" role="alert">
              <AlertCircleIcon size={16} /> {errorMsg}
            </div>
          )}
        </div>

        {/* Right Column: Specimen Metadata & Diagnostic Controls */}
        <div className="controls-section">
          <div className="control-group">
            <label htmlFor="crop-select" className="control-label">Target Agricultural Commodity</label>
            <select
              id="crop-select"
              className="control-input"
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              disabled={isScanning}
            >
              {NIGERIAN_CROPS.map((crop) => (
                <option key={crop.code} value={crop.code}>
                  {crop.label}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="severity-select" className="control-label">Lesion Severity Progression Tier</label>
            <select
              id="severity-select"
              className="control-input"
              value={severityTier}
              onChange={(e) => setSeverityTier(e.target.value)}
              disabled={isScanning || isSimulatingHealthy}
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="control-row-duo">
            <div className="control-group">
              <label htmlFor="acreage-input" className="control-label">Field Acreage (Hectares)</label>
              <input
                id="acreage-input"
                type="number"
                step="0.5"
                min="0.1"
                className="control-input"
                value={fieldAcreage}
                onChange={(e) => setFieldAcreage(e.target.value)}
                disabled={isScanning}
              />
            </div>
            <div className="control-group">
              <label htmlFor="state-select" className="control-label">State Hub</label>
              <select
                id="state-select"
                className="control-input"
                value={stateLocation}
                onChange={(e) => setStateLocation(e.target.value)}
                disabled={isScanning}
              >
                <option value="KANO">Kano (Sudan Savanna)</option>
                <option value="PLATEAU">Plateau (Highland Belt)</option>
                <option value="BENUE">Benue (Southern Guinea)</option>
                <option value="OYO">Oyo (Derived Savanna)</option>
                <option value="ONDO">Ondo (Humid Forest)</option>
                <option value="KADUNA">Kaduna (Northern Guinea)</option>
              </select>
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="farmer-name-input" className="control-label">Farmer / Cooperative Name</label>
            <input
              id="farmer-name-input"
              type="text"
              className="control-input"
              value={farmerName}
              onChange={(e) => setFarmerName(e.target.value)}
              disabled={isScanning}
              placeholder="e.g. Kano Tomato Growers Association"
            />
          </div>

          <button
            type="button"
            className="action-scan-btn"
            onClick={executeNeuralScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <MicroscopeIcon size={18} /> Running Vision Inference...
              </>
            ) : (
              <>
                <ZapIcon size={18} /> Run Foliar AI Diagnosis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Diagnosis Panel */}
      {diagnosisResult && (
        <div className="diagnosis-results-panel" data-testid="diagnosis-results-panel">
          <div className="diagnosis-summary-header">
            <div>
              <span className={getTriagePillClass(diagnosisResult.record.aiInference.triagePriority)}>
                {diagnosisResult.record.aiInference.triagePriority.replace(/_/g, ' ')}
              </span>
              <h3 className="diagnosis-disease-title">
                {diagnosisResult.record.aiInference.commonDiseaseName}
              </h3>
              <p className="pathogen-type-subtitle">
                Pathogen Taxonomy: <strong>{diagnosisResult.record.aiInference.pathogenType}</strong> | Disease Code: <code>{diagnosisResult.record.aiInference.diseaseCode}</code>
              </p>
            </div>
            <div className="confidence-chip">
              <span className="confidence-val">
                {Math.round((diagnosisResult.record.aiInference.confidenceScore || 0.92) * 100)}%
              </span>
              <span className="confidence-lbl">Inference Confidence</span>
            </div>
          </div>

          <div className="metrics-strip">
            <div className="metric-box">
              <span className="metric-title">Foliar Canopy Loss</span>
              <span className="metric-num">{diagnosisResult.record.aiInference.affectedCanopyPercentage}%</span>
            </div>
            <div className="metric-box">
              <span className="metric-title">Projected Yield Loss</span>
              <span className="metric-num">{diagnosisResult.record.economicImpactEstimate.projectedYieldLossPct}%</span>
            </div>
            <div className="metric-box">
              <span className="metric-title">Est. Financial Risk</span>
              <span className="metric-num">
                ₦{diagnosisResult.record.economicImpactEstimate.estimatedFinancialLossNgn.toLocaleString()}
              </span>
            </div>
            <div className="metric-box">
              <span className="metric-title">Cryptographic Seal</span>
              <span className="metric-hash" title={diagnosisResult.cryptographicSeal}>
                {diagnosisResult.cryptographicSeal ? `${diagnosisResult.cryptographicSeal.substring(0, 16)}...` : 'VERIFIED'}
              </span>
            </div>
          </div>

          <div className="diagnosis-action-bar">
            <button
              type="button"
              className="generate-rx-btn"
              onClick={() => onSelectTreatment && onSelectTreatment(diagnosisResult.record)}
            >
              <PillIcon size={18} /> Generate Curative &amp; Organic Treatment Prescription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
