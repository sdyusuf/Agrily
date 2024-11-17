import React, { useState, useMemo } from 'react';
import NavBar from '../components/NavBar';
import PestSpatialHeatmapCanvas from '../components/PestSpatialHeatmapCanvas';
import EconomicInjuryThresholdCalculatorCard from '../components/EconomicInjuryThresholdCalculatorCard';
import IpmBiocontrolMatrixCard from '../components/IpmBiocontrolMatrixCard';
import SwarmTrajectoryAndUlvDriftCard from '../components/SwarmTrajectoryAndUlvDriftCard';
import CrowdScoutingReportModal from '../components/CrowdScoutingReportModal';
import './PestInfestationHeatmapCockpit.css';

const PEST_SPECIES_OPTIONS = [
  {
    pestKey: 'FALL_ARMYWORM',
    commonName: 'Fall Armyworm (Spodoptera frugiperda)',
    hostCrop: 'Hybrid White Maize',
    epicenterState: 'Kaduna / Kano Belt',
    baselineIncidencePct: 34.5,
    baseTempC: 12.2,
    eggToAdultGdd: 495,
    mothsPerNight7d: 164,
    windDispersal72hKm: 118.5,
  },
  {
    pestKey: 'TUTA_ABSOLUTA',
    commonName: 'Tomato Leafminer (Tuta absoluta)',
    hostCrop: 'Irrigated Tomato & Solanaceae',
    epicenterState: 'Kano / Plateau Irrigated Valleys',
    baselineIncidencePct: 41.2,
    baseTempC: 10.0,
    eggToAdultGdd: 410,
    mothsPerNight7d: 183,
    windDispersal72hKm: 96.4,
  },
  {
    pestKey: 'QUELEA_BIRDS',
    commonName: 'Red-Billed Quelea Bird Swarm (Quelea quelea)',
    hostCrop: 'Lowland Paddy Rice & Sorghum',
    epicenterState: 'Hadejia-Nguru Wetlands (Jigawa)',
    baselineIncidencePct: 46.8,
    baseTempC: 15.0,
    eggToAdultGdd: 520,
    mothsPerNight7d: 240,
    windDispersal72hKm: 154.0,
  },
  {
    pestKey: 'DESERT_LOCUST',
    commonName: 'Desert & Migratory Locust (Schistocerca gregaria)',
    hostCrop: 'Pearl Millet, Sorghum & Cowpea',
    epicenterState: 'Lake Chad Basin (Borno / Yobe)',
    baselineIncidencePct: 38.0,
    baseTempC: 16.0,
    eggToAdultGdd: 560,
    mothsPerNight7d: 210,
    windDispersal72hKm: 178.0,
  },
  {
    pestKey: 'BEMISIA_WHITEFLY',
    commonName: 'Silverleaf Whitefly Vector (Bemisia tabaci)',
    hostCrop: 'Starch Cassava & Cowpea',
    epicenterState: 'Benue / Oyo Root Crop Belt',
    baselineIncidencePct: 29.4,
    baseTempC: 11.0,
    eggToAdultGdd: 325,
    mothsPerNight7d: 92,
    windDispersal72hKm: 74.2,
  },
];

const INITIAL_SCOUTING_REPORTS = [
  {
    reportCode: 'PST-2024-88201',
    pestSpeciesKey: 'FALL_ARMYWORM',
    stateName: 'Kaduna',
    lgaName: 'Giwa',
    hostCropKey: 'MAIZE',
    infestedPlantsIncidencePct: 36.0,
    davisFoliarDamageScale: 6,
    dominantInstarStage: 'L1_L2_EARLY_INSTAR',
    pheromoneTrapMothsPerNight: 29,
    infestationSeverityTier: 'ACTION_THRESHOLD_EXCEEDED',
  },
  {
    reportCode: 'PST-2024-88144',
    pestSpeciesKey: 'TUTA_ABSOLUTA',
    stateName: 'Kano',
    lgaName: 'Kura',
    hostCropKey: 'TOMATO',
    infestedPlantsIncidencePct: 48.0,
    davisFoliarDamageScale: 7,
    dominantInstarStage: 'L3_L4_MID_INSTAR',
    pheromoneTrapMothsPerNight: 42,
    infestationSeverityTier: 'SEVERE_OUTBREAK_SWARM',
  },
  {
    reportCode: 'PST-2024-87990',
    pestSpeciesKey: 'BEMISIA_WHITEFLY',
    stateName: 'Benue',
    lgaName: 'Gboko',
    hostCropKey: 'CASSAVA',
    infestedPlantsIncidencePct: 22.0,
    davisFoliarDamageScale: 4,
    dominantInstarStage: 'L1_L2_EARLY_INSTAR',
    pheromoneTrapMothsPerNight: 16,
    infestationSeverityTier: 'ACTION_THRESHOLD_EXCEEDED',
  },
];

const PestInfestationHeatmapCockpit = () => {
  const [selectedPestKey, setSelectedPestKey] = useState('FALL_ARMYWORM');
  const [bandwidthKm, setBandwidthKm] = useState(185);
  const [selectedKdeCell, setSelectedKdeCell] = useState(null);
  const [isScoutingModalOpen, setIsScoutingModalOpen] = useState(false);
  const [scoutingLedger, setScoutingLedger] = useState(INITIAL_SCOUTING_REPORTS);

  const activePest = useMemo(() => {
    return (
      PEST_SPECIES_OPTIONS.find((item) => item.pestKey === selectedPestKey) ||
      PEST_SPECIES_OPTIONS[0]
    );
  }, [selectedPestKey]);

  const handleAddScoutingReport = (newReport) => {
    setScoutingLedger((prev) => [newReport, ...prev]);
  };

  return (
    <div className="pest-cockpit-page" data-testid="pest-infestation-heatmap-cockpit">
      <NavBar />

      <main className="pest-cockpit-main">
        {/* Hero Banner */}
        <section className="pest-hero-banner">
          <div className="pest-hero-copy">
            <div className="pest-hero-badges">
              <span className="pest-pill-emerald">
                SPRINT 22 • 2D GAUSSIAN KDE + PEDIGO EIL/ET ENTOMOLOGY
              </span>
              <span className="pest-pill-ochre">
                PHEROMONE BIOFIX &amp; 72H WIND PLUME TELEMETRY
              </span>
            </div>
            <h1 className="pest-hero-title">
              Pest Infestation Heatmap &amp; IPM Biocontrol Surveillance Cockpit
            </h1>
            <p className="pest-hero-subtitle">
              Real-time crowd-sourced W-pattern scouting telemetry, Baskerville-Emin
              degree-day larval instar clocks, Pedigo Economic Injury Level (EIL)
              thresholds, and multi-tier biological control across Nigeria&apos;s
              agricultural corridors.
            </p>
          </div>

          <div className="pest-hero-controls">
            <div className="pest-control-item">
              <label htmlFor="pest-species-select">Target Pest Species</label>
              <select
                id="pest-species-select"
                value={selectedPestKey}
                onChange={(e) => setSelectedPestKey(e.target.value)}
                data-testid="pest-species-select"
              >
                {PEST_SPECIES_OPTIONS.map((sp) => (
                  <option key={sp.pestKey} value={sp.pestKey}>
                    {sp.commonName}
                  </option>
                ))}
              </select>
            </div>

            <div className="pest-control-item">
              <label htmlFor="pest-bandwidth-input">KDE Kernel Bandwidth (km)</label>
              <input
                id="pest-bandwidth-input"
                type="number"
                min="60"
                max="350"
                step="15"
                value={bandwidthKm}
                onChange={(e) => setBandwidthKm(Number(e.target.value) || 185)}
              />
            </div>

            <button
              type="button"
              className="pest-scouting-cta"
              onClick={() => setIsScoutingModalOpen(true)}
              data-testid="open-scouting-modal-btn"
            >
              🐛 Log W-Pattern Scouting Report
            </button>
          </div>
        </section>

        {/* Executive KPI Strip */}
        <section className="pest-kpi-grid" aria-label="Entomological Surveillance KPIs">
          <article className="pest-kpi-card primary">
            <span className="pest-kpi-tag">REGIONAL MEAN INCIDENCE</span>
            <strong className="pest-kpi-val" data-testid="kpi-pest-incidence">
              {activePest.baselineIncidencePct}% Infested
            </strong>
            <span className="pest-kpi-sub">
              Epicenter: {activePest.epicenterState} ({activePest.hostCrop})
            </span>
          </article>

          <article className="pest-kpi-card">
            <span className="pest-kpi-tag">7-DAY PHEROMONE TRAP CATCH</span>
            <strong className="pest-kpi-val">
              {activePest.mothsPerNight7d} Adults / Trap
            </strong>
            <span className="pest-kpi-sub">
              Biofix Threshold Exceeded • Base T₀ = {activePest.baseTempC}°C
            </span>
          </article>

          <article className="pest-kpi-card ochre">
            <span className="pest-kpi-tag">72H DOWNWIND SWARM PLUME</span>
            <strong className="pest-kpi-val">
              {activePest.windDispersal72hKm} km Vector
            </strong>
            <span className="pest-kpi-sub">
              Generation Cycle: {activePest.eggToAdultGdd} °C·d GDD
            </span>
          </article>

          <article className="pest-kpi-card">
            <span className="pest-kpi-tag">VERIFIED SCOUTING REPORTS</span>
            <strong className="pest-kpi-val">{scoutingLedger.length} Dispatches</strong>
            <span className="pest-kpi-sub">
              5-Station W-Pattern Field Transect Standard
            </span>
          </article>
        </section>

        {/* Two-Column Spatial Heatmap + EIL Calculator */}
        <div className="pest-workspace-grid">
          <PestSpatialHeatmapCanvas
            pestKey={selectedPestKey}
            pestCommonName={activePest.commonName}
            baselineIncidencePct={activePest.baselineIncidencePct}
            bandwidthKm={bandwidthKm}
            onSelectCell={(cell) => setSelectedKdeCell(cell)}
          />

          <EconomicInjuryThresholdCalculatorCard
            pestKey={selectedPestKey}
            pestCommonName={activePest.commonName}
          />
        </div>

        {/* Multi-Tier IPM Biocontrol & IRAC Rotation Matrix */}
        <IpmBiocontrolMatrixCard
          pestKey={selectedPestKey}
          pestCommonName={activePest.commonName}
        />

        {/* 72h Swarm Trajectory & ULV Spray Drift Optimizer */}
        <SwarmTrajectoryAndUlvDriftCard
          pestKey={selectedPestKey}
          pestCommonName={activePest.commonName}
        />

        {/* Crowd Scouting Ledger */}
        <section className="pest-ledger-card" aria-label="Field Scouting Telemetry Ledger">
          <header className="pest-ledger-header">
            <div>
              <span className="pest-ledger-eyebrow">
                CROWD-SOURCED &amp; EXTENSION-VERIFIED FIELD TRANSECTS
              </span>
              <h2 className="pest-ledger-title">
                Live Regional Pest Outbreak &amp; Pheromone Trap Dispatch Ledger
              </h2>
            </div>
            {selectedKdeCell && (
              <span className="pest-active-cell-badge">
                Focused Grid Cell: <strong>{selectedKdeCell.cellCode}</strong> (KDE{' '}
                {selectedKdeCell.kdeHotspotIndex}/100)
              </span>
            )}
          </header>

          <div className="pest-ledger-table-wrap">
            <table className="pest-ledger-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Species</th>
                  <th>Location (LGA, State)</th>
                  <th>Host Crop</th>
                  <th>Incidence (%)</th>
                  <th>Davis Scale</th>
                  <th>Dominant Instar</th>
                  <th>Severity Tier</th>
                </tr>
              </thead>
              <tbody>
                {scoutingLedger.map((row) => (
                  <tr key={row.reportCode}>
                    <td>
                      <code>{row.reportCode}</code>
                    </td>
                    <td>
                      <strong>{row.pestSpeciesKey}</strong>
                    </td>
                    <td>
                      {row.lgaName}, {row.stateName}
                    </td>
                    <td>{row.hostCropKey}</td>
                    <td>
                      <strong>{row.infestedPlantsIncidencePct}%</strong>
                    </td>
                    <td>{row.davisFoliarDamageScale} / 9</td>
                    <td>{row.dominantInstarStage}</td>
                    <td>
                      <span className="pest-tier-pill">
                        {row.infestationSeverityTier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <CrowdScoutingReportModal
        isOpen={isScoutingModalOpen}
        onClose={() => setIsScoutingModalOpen(false)}
        pestKey={selectedPestKey}
        pestCommonName={activePest.commonName}
        onSubmitScoutingReport={handleAddScoutingReport}
      />
    </div>
  );
};

export default PestInfestationHeatmapCockpit;
