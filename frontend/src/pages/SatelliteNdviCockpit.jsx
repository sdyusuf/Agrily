import React, { useState, useEffect, useCallback } from 'react';
import './SatelliteNdviCockpit.css';
import SatelliteCanopyVigorMap from '../components/SatelliteCanopyVigorMap';
import ZonalCropHealthMetricsCard from '../components/ZonalCropHealthMetricsCard';
import SpectralBandSelector from '../components/SpectralBandSelector';
import PhenologyTimelineChart from '../components/PhenologyTimelineChart';
import SatelliteBandInspectorModal from '../components/SatelliteBandInspectorModal';
import SatelliteDroughtRiskCard from '../components/SatelliteDroughtRiskCard';
import { SatelliteDishIcon, LayersIcon, AlertTriangleIcon, SproutIcon, DownloadIcon } from '../components/Icons';

export default function SatelliteNdviCockpit() {
  const [parcels, setParcels] = useState([]);
  const [selectedParcelId, setSelectedParcelId] = useState('');
  const [activeBand, setActiveBand] = useState('NDVI');
  const [selectedDate, setSelectedDate] = useState('2024-09-28');
  const [gridCells, setGridCells] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [showBandInspectorModal, setShowBandInspectorModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  // 1. Fetch registered parcels
  const fetchParcels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/satellite/parcels');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setParcels(data.data);
        if (!selectedParcelId) {
          setSelectedParcelId(String(data.data[0]._id));
        }
      }
    } catch (err) {
      console.warn('Failed to load live parcels, using offline fallback:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedParcelId]);

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  // Active parcel object
  const activeParcel = parcels.find((p) => String(p._id) === String(selectedParcelId)) || parcels[0] || {
    _id: 'default',
    parcelCode: 'NG-MAI-KANO4B',
    parcelName: 'Kano North Irrigation Plot 4B',
    cropType: 'Maize',
    areaHectares: 24.5,
    agroEcologicalZone: 'Sudan Savannah',
    soilClassification: 'Ferric Luvisol',
    irrigationType: 'Center Pivot'
  };

  // 2. Fetch Zonal Grid for active parcel & band
  const fetchZonalGrid = useCallback(async (parcelId, band) => {
    if (!parcelId) return;
    try {
      const res = await fetch(`/api/satellite/parcels/${parcelId}/zonal-grid?band=${band}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.cells)) {
        setGridCells(data.cells);
      }
    } catch (err) {
      console.warn('Error fetching zonal grid:', err);
    }
  }, []);

  // 3. Fetch Phenology Timeline
  const fetchTimeline = useCallback(async (parcelId) => {
    if (!parcelId) return;
    try {
      const res = await fetch(`/api/satellite/parcels/${parcelId}/ndvi-timeline`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTimelineData(data.data);
        if (data.data.length > 0) {
          setSelectedDate(data.data[data.data.length - 1].readingDate);
        }
      }
    } catch (err) {
      console.warn('Error fetching timeline:', err);
    }
  }, []);

  // 4. Fetch Anomaly Alerts
  const fetchAnomalies = useCallback(async (parcelId) => {
    if (!parcelId) return;
    try {
      const res = await fetch(`/api/satellite/parcels/${parcelId}/vigor-alerts`);
      const data = await res.json();
      if (data.success && data.report && Array.isArray(data.report.anomalies)) {
        setAnomalies(data.report.anomalies);
      }
    } catch (err) {
      console.warn('Error fetching anomaly alerts:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedParcelId) {
      fetchZonalGrid(selectedParcelId, activeBand);
      fetchTimeline(selectedParcelId);
      fetchAnomalies(selectedParcelId);
    }
  }, [selectedParcelId, activeBand, fetchZonalGrid, fetchTimeline, fetchAnomalies]);

  // Ingest fresh Sentinel-2 pass simulation
  const handleIngestPass = async () => {
    if (!selectedParcelId) return;
    try {
      setIngesting(true);
      const res = await fetch('/api/satellite/ingest-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelId: selectedParcelId,
          tileId: `T32PQR_${Date.now()}`,
          acquisitionDate: new Date().toISOString(),
          baseNdvi: 0.72 + (Math.random() * 0.1 - 0.05),
          cloudPercent: 2.0
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotificationMsg('New Sentinel-2 L2A satellite pass successfully ingested and analyzed!');
        fetchZonalGrid(selectedParcelId, activeBand);
        fetchTimeline(selectedParcelId);
        setTimeout(() => setNotificationMsg(''), 4000);
      }
    } catch (err) {
      console.error('Ingestion failed:', err);
    } finally {
      setIngesting(false);
    }
  };

  // Derive metrics from current grid
  const currentZonalMetrics = {
    meanNdvi: gridCells.length > 0
      ? parseFloat((gridCells.reduce((a, c) => a + (c.ndvi || 0), 0) / gridCells.length).toFixed(2))
      : 0.68,
    minNdvi: gridCells.length > 0 ? Math.min(...gridCells.map((c) => c.ndvi || 0)) : 0.22,
    maxNdvi: gridCells.length > 0 ? Math.max(...gridCells.map((c) => c.ndvi || 0)) : 0.89,
    stdDevNdvi: 0.11,
    meanNdwi: 0.18,
    chlorophyllIndex: 4.8,
    waterStressIndex: 0.22,
    canopyUniformityIndex: 0.84,
    cloudMaskPercentage: 1.5,
    vigorDistribution: {
      severeStressHectares: parseFloat(((activeParcel.areaHectares || 24.5) * 0.08).toFixed(1)),
      moderateStressHectares: parseFloat(((activeParcel.areaHectares || 24.5) * 0.16).toFixed(1)),
      healthyHectares: parseFloat(((activeParcel.areaHectares || 24.5) * 0.54).toFixed(1)),
      hyperDenseHectares: parseFloat(((activeParcel.areaHectares || 24.5) * 0.22).toFixed(1))
    },
    advisoryReport: `Optimal chlorophyll assimilation for ${activeParcel.cropType || 'Crop'}. Recommended to maintain routine irrigation schedule.`
  };

  return (
    <div className="satellite-cockpit-page" data-testid="satellite-ndvi-cockpit-page">
      {/* Cockpit Header Banner */}
      <header className="cockpit-header">
        <div className="cockpit-header-content">
          <div className="cockpit-hero-badge">
            <SatelliteDishIcon size={18} color="var(--color-primary-700)" />
            <span>Sentinel-2 Satellite Agronomy Telemetry</span>
          </div>
          <h1 className="cockpit-title">Farm Canopy Vigor & NDVI Radar</h1>
          <p className="cockpit-lead">
            Precision multi-spectral crop vigor tracking, SCL cloud-gap interpolation, and phenology anomaly detection.
          </p>
        </div>

        <div className="cockpit-actions">
          <button
            type="button"
            className="action-btn secondary"
            onClick={() => setShowBandInspectorModal(true)}
            data-testid="open-band-inspector-btn"
          >
            <LayersIcon size={16} />
            Inspect 12 Bands
          </button>
          <button
            type="button"
            className="action-btn secondary"
            onClick={handleIngestPass}
            disabled={ingesting}
            data-testid="ingest-pass-btn"
          >
            <SatelliteDishIcon size={16} />
            {ingesting ? 'Ingesting Tile...' : 'Ingest Sentinel Revisit'}
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="cockpit-alert-toast" data-testid="cockpit-notification-toast">
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Parcel Selector Strip */}
      <section className="parcel-selector-strip">
        <div className="parcel-select-group">
          <label htmlFor="parcel-picker" className="parcel-select-label">
            Active Farm Parcel:
          </label>
          <select
            id="parcel-picker"
            className="parcel-select-dropdown"
            value={selectedParcelId}
            onChange={(e) => setSelectedParcelId(e.target.value)}
            data-testid="parcel-picker-dropdown"
          >
            {parcels.map((p) => (
              <option key={p._id} value={p._id}>
                {p.parcelName} ({p.cropType} - {p.areaHectares} Ha)
              </option>
            ))}
          </select>
        </div>

        <div className="parcel-meta-chips">
          <span className="meta-chip">Zone: <strong>{activeParcel.agroEcologicalZone}</strong></span>
          <span className="meta-chip">Soil: <strong>{activeParcel.soilClassification}</strong></span>
          <span className="meta-chip">Irrigation: <strong>{activeParcel.irrigationType}</strong></span>
        </div>
      </section>

      {/* Anomaly Alerts Banner */}
      {anomalies.length > 0 && (
        <section className="anomaly-alerts-banner" data-testid="anomaly-alerts-banner">
          <div className="anomaly-banner-header">
            <AlertTriangleIcon size={18} color="#991b1b" />
            <h4 className="anomaly-banner-title">Phenological Anomaly Alerts ({anomalies.length} Flagged)</h4>
          </div>
          <div className="anomaly-cards-grid">
            {anomalies.map((alt, idx) => (
              <div key={idx} className={`anomaly-card ${alt.severity?.toLowerCase() || 'warning'}`}>
                <div className="anomaly-card-top">
                  <span className="anomaly-type">{alt.alertType}</span>
                  <span className="anomaly-date">{alt.date}</span>
                </div>
                <p className="anomaly-hypothesis">{alt.rootCauseHypothesis}</p>
                <div className="anomaly-recommendation">
                  <strong>Action:</strong> {alt.recommendation}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Multi-Spectral Band Selector */}
      <SpectralBandSelector
        activeBand={activeBand}
        onSelectBand={(band) => setActiveBand(band)}
      />

      {/* Main Grid: Canvas Map & Zonal Metrics Card */}
      <div className="cockpit-dashboard-grid">
        <div className="grid-col map-col">
          <SatelliteCanopyVigorMap
            parcel={activeParcel}
            cells={gridCells}
            activeBand={activeBand}
            rows={12}
            cols={12}
            selectedDate={selectedDate}
          />
        </div>

        <div className="grid-col metrics-col">
          <ZonalCropHealthMetricsCard
            metrics={currentZonalMetrics}
            cropType={activeParcel.cropType}
            totalHectares={activeParcel.areaHectares}
          />
        </div>
      </div>

      {/* Satellite Drought & Moisture Stress Radar Card */}
      <SatelliteDroughtRiskCard
        parcelName={activeParcel.parcelName}
        cropType={activeParcel.cropType}
        zoneName={activeParcel.agroEcologicalZone}
        meanNdvi={currentZonalMetrics.meanNdvi}
        lstCelsius={32.5}
        vciPct={58.0}
        tciPct={52.0}
        tvdi={0.42}
        cwsi={0.38}
      />

      {/* Phenology Timeline Progression */}
      <PhenologyTimelineChart
        timeline={timelineData}
        selectedDate={selectedDate}
        onSelectDate={(d) => setSelectedDate(d)}
        cropType={activeParcel.cropType}
      />

      {/* Satellite Multi-Spectral Band Radiometer & Signature Inspector Modal */}
      <SatelliteBandInspectorModal
        isOpen={showBandInspectorModal}
        onClose={() => setShowBandInspectorModal(false)}
        parcelName={activeParcel.parcelName}
        mgrsTile="32NNQ"
        observationDate={selectedDate}
      />
    </div>
  );
}
