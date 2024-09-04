/**
 * @file RegionalDiseaseHeatmapCard.jsx
 * @description 36-State Regional Crop Pathology Outbreak Heatmap & Contagion Telemetry.
 * Visualizes spatial disease clusters across Nigerian states and agro-zones,
 * active quarantine lockdown buffers, and an interactive Interstate Haulage
 * Phytosanitary Clearance Checker.
 */

import React, { useState, useEffect } from 'react';
import './RegionalDiseaseHeatmapCard.css';

export default function RegionalDiseaseHeatmapCard() {
  const [telemetryData, setTelemetryData] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStateForClearance, setSelectedStateForClearance] = useState('PLATEAU');
  const [clearanceResult, setClearanceResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOutbreakTelemetry();
    checkClearance('PLATEAU');
  }, []);

  const fetchOutbreakTelemetry = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agronomy-vision/outbreak-telemetry');
      const data = await res.json();
      if (data.success) {
        setTelemetryData(data);
      }
    } catch (err) {
      console.error('Error fetching outbreak telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkClearance = async (state) => {
    setSelectedStateForClearance(state);
    try {
      const res = await fetch(`/api/agronomy-vision/corridor-clearance/${state}`);
      const data = await res.json();
      if (data.success) {
        setClearanceResult(data.clearance);
      }
    } catch (err) {
      console.error('Error checking corridor clearance:', err);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'CRITICAL_QUARANTINE_LOCKDOWN':
        return 'outbreak-status-badge badge-critical';
      case 'EPIDEMIC_SURGE_WARNING':
        return 'outbreak-status-badge badge-epidemic';
      case 'MODERATE_SPREAD_WATCH':
        return 'outbreak-status-badge badge-watch';
      case 'LOCALIZED_SPORADIC':
        return 'outbreak-status-badge badge-sporadic';
      case 'MONITORING_NORMAL':
      default:
        return 'outbreak-status-badge badge-normal';
    }
  };

  const filteredClusters = telemetryData && telemetryData.clusters
    ? telemetryData.clusters.filter((c) => {
        const matchesSearch = c.state.toLowerCase().includes(searchFilter.toLowerCase()) ||
                              c.primaryCrop.toLowerCase().includes(searchFilter.toLowerCase()) ||
                              c.pathogenName.toLowerCase().includes(searchFilter.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || c.riskStatus === statusFilter;
        return matchesSearch && matchesStatus;
      })
    : [];

  return (
    <div className="regional-disease-heatmap-card" data-testid="regional-disease-heatmap-card">
      <div className="heatmap-header">
        <div className="heatmap-title-group">
          <span className="heatmap-tag">🗺️ Spatial Contagion Radar</span>
          <h2 className="heatmap-title">36-State Crop Outbreak &amp; Quarantine Heatmap</h2>
          <p className="heatmap-subtitle">
            Real-time agro-ecological disease monitoring, vector transmission indexing, and NAQS phytosanitary quarantine zones.
          </p>
        </div>
        <div className="authority-seal">
          <span className="seal-icon">🏛️</span>
          <span className="seal-text">NAQS Federal Monitoring Authority</span>
        </div>
      </div>

      {/* KPI Ticker Bar */}
      {telemetryData && telemetryData.summary && (
        <div className="telemetry-kpi-bar">
          <div className="kpi-card">
            <span className="kpi-label">Monitored States</span>
            <span className="kpi-value">{telemetryData.summary.totalStatesMonitored}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Active Contagion Clusters</span>
            <span className="kpi-value kpi-warning">{telemetryData.summary.activeOutbreakClustersCount}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Quarantine Lockdowns</span>
            <span className="kpi-value kpi-danger">{telemetryData.summary.criticalLockdownsCount}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Epidemic Surges</span>
            <span className="kpi-value kpi-surge">{telemetryData.summary.epidemicSurgeWarningsCount}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Hectares Under Quarantine</span>
            <span className="kpi-value">{telemetryData.summary.totalHectaresUnderQuarantine.toLocaleString()} Ha</span>
          </div>
        </div>
      )}

      {/* Corridor Clearance Tool */}
      <div className="corridor-checker-box">
        <div className="checker-header">
          <span className="checker-title">🚚 Interstate Freight &amp; Produce Corridor Clearance Checker</span>
          <span className="checker-hint">Select a Nigerian state to inspect active haulage transit bans</span>
        </div>
        <div className="checker-controls">
          <select
            className="checker-select"
            value={selectedStateForClearance}
            onChange={(e) => checkClearance(e.target.value)}
          >
            <option value="PLATEAU">Plateau (Highland Late Blight Hotspot)</option>
            <option value="KANO">Kano (Tomato Irrigation Belt)</option>
            <option value="BENUE">Benue (Yam Belt)</option>
            <option value="ONDO">Ondo (Cocoa Rain Forest Zone)</option>
            <option value="OYO">Oyo (Cassava Hub)</option>
            <option value="KADUNA">Kaduna (Grain Belt)</option>
            <option value="LAGOS">Lagos (Metropolitan Terminal)</option>
          </select>
        </div>

        {clearanceResult && (
          <div className={`clearance-result-banner ${clearanceResult.isTransitInterdicted ? 'banner-prohibited' : 'banner-cleared'}`}>
            <div className="banner-icon">
              {clearanceResult.isTransitInterdicted ? '🛑' : '✅'}
            </div>
            <div className="banner-content">
              <span className="clearance-status-tag">
                {clearanceResult.corridorClearance.replace(/_/g, ' ')}
              </span>
              <p className="clearance-advisory">{clearanceResult.advisory}</p>
              {clearanceResult.isTransitInterdicted && (
                <span className="quarantine-buffer-tag">
                  ⚠️ Active Quarantine Buffer: <strong>{clearanceResult.quarantineRadiusKm} KM Perimeter</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="heatmap-filters">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search state, crop, or pathogen..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
        <select
          className="status-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Contagion Statuses</option>
          <option value="CRITICAL_QUARANTINE_LOCKDOWN">Critical Lockdowns Only</option>
          <option value="EPIDEMIC_SURGE_WARNING">Epidemic Surges</option>
          <option value="MODERATE_SPREAD_WATCH">Moderate Spread</option>
          <option value="LOCALIZED_SPORADIC">Localized Sporadic</option>
          <option value="MONITORING_NORMAL">Normal Monitoring</option>
        </select>
      </div>

      {/* State Outbreak Grid */}
      <div className="clusters-grid">
        {filteredClusters.map((cluster) => (
          <div
            key={cluster.state}
            className={`cluster-tile ${cluster.riskStatus === 'CRITICAL_QUARANTINE_LOCKDOWN' ? 'tile-critical' : ''}`}
            onClick={() => checkClearance(cluster.state)}
          >
            <div className="cluster-tile-header">
              <span className="state-name">{cluster.state}</span>
              <span className={getStatusBadgeClass(cluster.riskStatus)}>
                {cluster.riskStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="cluster-body">
              <p className="crop-label">Primary Crop: <strong>{cluster.primaryCrop}</strong></p>
              <p className="pathogen-label">Active: <span>{cluster.pathogenName}</span></p>
              <div className="cluster-meta-row">
                <span>Cases: <strong>{cluster.reportedCases}</strong></span>
                <span>Acreage: <strong>{cluster.affectedAcreageHectares} Ha</strong></span>
              </div>
              {cluster.quarantineRadiusKm > 0 && (
                <div className="quarantine-pill">
                  Quarantine Perimeter: {cluster.quarantineRadiusKm} KM
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tamper Seal Bar */}
      {telemetryData && telemetryData.nationalTelemetrySeal && (
        <div className="heatmap-footer">
          <span className="footer-label">National Telemetry Integrity Seal:</span>
          <code className="footer-seal">{telemetryData.nationalTelemetrySeal}</code>
        </div>
      )}
    </div>
  );
}
