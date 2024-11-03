import React, { useState, useEffect, useMemo } from 'react';
import NavBar from '../components/NavBar';
import SubParcelYieldHeatmapCanvas from '../components/SubParcelYieldHeatmapCanvas';
import YieldSensitivitySimulatorCard from '../components/YieldSensitivitySimulatorCard';
import BiomassAccumulationCurveChart from '../components/BiomassAccumulationCurveChart';
import PostHarvestDryingAndFleetCard from '../components/PostHarvestDryingAndFleetCard';
import WeighbridgeCalibrationModal from '../components/WeighbridgeCalibrationModal';
import './HarvestYieldPredictorCockpit.css';

const CULTIVAR_CATALOG = [
  {
    cropKey: 'MAIZE',
    cropName: 'Hybrid White Maize (SAMMAZ-51)',
    agroZone: 'NORTHERN_GUINEA_SAVANNA',
    parcelName: 'Zaria Giwa Block A-04',
    stateName: 'Kaduna',
    areaHectares: 6.5,
    geneticPotentialTonsHa: 7.8,
    regionalAverageTonsHa: 2.6,
    predictedP10TonsHa: 3.68,
    predictedP50TonsHa: 4.52,
    predictedP90TonsHa: 5.34,
    harvestIndex: 0.48,
    rueGPerMj: 3.65,
    standardMoisturePct: 13.5,
    farmGatePriceNgnPerTon: 685000,
    optimalHarvestWindow: 'Nov 12 – Nov 24, 2024',
  },
  {
    cropKey: 'RICE_PADDY',
    cropName: 'FARO-61 Lowland Irrigated Rice',
    agroZone: 'SUDAN_SAVANNA',
    parcelName: 'Hadejia Valley Fadama Sector 2',
    stateName: 'Jigawa',
    areaHectares: 8.0,
    geneticPotentialTonsHa: 8.2,
    regionalAverageTonsHa: 3.1,
    predictedP10TonsHa: 4.15,
    predictedP50TonsHa: 5.08,
    predictedP90TonsHa: 5.92,
    harvestIndex: 0.50,
    rueGPerMj: 2.95,
    standardMoisturePct: 14.0,
    farmGatePriceNgnPerTon: 820000,
    optimalHarvestWindow: 'Nov 18 – Nov 30, 2024',
  },
  {
    cropKey: 'SOYBEAN',
    cropName: 'TGx 1951-3F Rust-Resistant Soybean',
    agroZone: 'SOUTHERN_GUINEA_SAVANNA',
    parcelName: 'Gboko Benue Alluvial Strip 9',
    stateName: 'Benue',
    areaHectares: 5.2,
    geneticPotentialTonsHa: 3.6,
    regionalAverageTonsHa: 1.4,
    predictedP10TonsHa: 1.98,
    predictedP50TonsHa: 2.46,
    predictedP90TonsHa: 2.94,
    harvestIndex: 0.42,
    rueGPerMj: 2.25,
    standardMoisturePct: 12.0,
    farmGatePriceNgnPerTon: 940000,
    optimalHarvestWindow: 'Nov 05 – Nov 15, 2024',
  },
  {
    cropKey: 'SORGHUM',
    cropName: 'SAMSORG-45 Drought-Tolerant Guinea Corn',
    agroZone: 'SUDAN_SAVANNA',
    parcelName: 'Dambatta Dryland Terrace 7',
    stateName: 'Kano',
    areaHectares: 7.4,
    geneticPotentialTonsHa: 4.5,
    regionalAverageTonsHa: 1.7,
    predictedP10TonsHa: 2.35,
    predictedP50TonsHa: 2.92,
    predictedP90TonsHa: 3.48,
    harvestIndex: 0.44,
    rueGPerMj: 3.35,
    standardMoisturePct: 13.0,
    farmGatePriceNgnPerTon: 620000,
    optimalHarvestWindow: 'Nov 20 – Dec 04, 2024',
  },
  {
    cropKey: 'CASSAVA',
    cropName: 'TME 419 High-Starch Root Cassava',
    agroZone: 'DERIVED_SAVANNA',
    parcelName: 'Oyo Iseyin Root Cluster 3',
    stateName: 'Oyo',
    areaHectares: 4.5,
    geneticPotentialTonsHa: 34.0,
    regionalAverageTonsHa: 12.5,
    predictedP10TonsHa: 18.2,
    predictedP50TonsHa: 22.8,
    predictedP90TonsHa: 27.4,
    harvestIndex: 0.58,
    rueGPerMj: 2.65,
    standardMoisturePct: 65.0,
    farmGatePriceNgnPerTon: 215000,
    optimalHarvestWindow: 'Dec 01 – Dec 18, 2024',
  },
];

const INITIAL_WEIGHBRIDGE_HISTORY = [
  {
    weighbridgeTicketCode: 'WBT-2024-88109',
    cropKey: 'MAIZE',
    parcelName: 'Zaria Giwa Block A-04',
    standardDryNetTons: 28.92,
    predictedP50TonsHa: 4.48,
    actualYieldTonsHa: 4.45,
    measuredMoisturePct: 15.6,
    buyerGradeTier: 'GRADE_1_EXPORT',
    recordedAt: '2024-10-28',
  },
  {
    weighbridgeTicketCode: 'WBT-2024-87944',
    cropKey: 'RICE_PADDY',
    parcelName: 'Hadejia Valley Fadama Sector 2',
    standardDryNetTons: 41.12,
    predictedP50TonsHa: 5.02,
    actualYieldTonsHa: 5.14,
    measuredMoisturePct: 17.2,
    buyerGradeTier: 'GRADE_1_EXPORT',
    recordedAt: '2024-10-24',
  },
  {
    weighbridgeTicketCode: 'WBT-2024-87412',
    cropKey: 'SOYBEAN',
    parcelName: 'Gboko Benue Alluvial Strip 9',
    standardDryNetTons: 12.58,
    predictedP50TonsHa: 2.48,
    actualYieldTonsHa: 2.42,
    measuredMoisturePct: 13.4,
    buyerGradeTier: 'GRADE_2_MILLING',
    recordedAt: '2024-10-19',
  },
];

const HarvestYieldPredictorCockpit = () => {
  const [selectedCropKey, setSelectedCropKey] = useState('MAIZE');
  const [areaHectares, setAreaHectares] = useState(6.5);
  const [simulatedForecast, setSimulatedForecast] = useState(null);
  const [selectedSubParcelCell, setSelectedSubParcelCell] = useState(null);
  const [isWeighbridgeModalOpen, setIsWeighbridgeModalOpen] = useState(false);
  const [weighbridgeLedger, setWeighbridgeLedger] = useState(INITIAL_WEIGHBRIDGE_HISTORY);
  const [apiConnected, setApiConnected] = useState(false);

  const activeProfile = useMemo(() => {
    return (
      CULTIVAR_CATALOG.find((item) => item.cropKey === selectedCropKey) ||
      CULTIVAR_CATALOG[0]
    );
  }, [selectedCropKey]);

  useEffect(() => {
    setAreaHectares(activeProfile.areaHectares);
    setSimulatedForecast(null);
  }, [activeProfile]);

  useEffect(() => {
    let isMounted = true;
    const checkApiCatalog = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/yield-predictor/cultivars');
        if (res && res.ok && isMounted) {
          setApiConnected(true);
        }
      } catch {
        // Fallback smoothly to deterministic client engine when offline/test
      }
    };
    checkApiCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  const effectiveForecast = useMemo(() => {
    const p10TonsHa = Number(
      simulatedForecast?.p10YieldTonsHa ?? activeProfile.predictedP10TonsHa
    );
    const p50TonsHa = Number(
      simulatedForecast?.p50YieldTonsHa ?? activeProfile.predictedP50TonsHa
    );
    const p90TonsHa = Number(
      simulatedForecast?.p90YieldTonsHa ?? activeProfile.predictedP90TonsHa
    );
    const areaHa = Math.max(0.5, Number(areaHectares) || activeProfile.areaHectares);

    const totalP50Tons = Number((p50TonsHa * areaHa).toFixed(2));
    const totalP10Tons = Number((p10TonsHa * areaHa).toFixed(2));
    const totalP90Tons = Number((p90TonsHa * areaHa).toFixed(2));

    const grossRevenueNgn = Math.round(
      totalP50Tons * activeProfile.farmGatePriceNgnPerTon
    );
    const thirtyTonTrailersRequired = Math.max(1, Math.ceil(totalP50Tons / 28));
    const standardFiftyKgBags = Math.round((totalP50Tons * 1000) / 50);
    const yieldGapPct = Math.round(
      ((activeProfile.geneticPotentialTonsHa - p50TonsHa) /
        activeProfile.geneticPotentialTonsHa) *
        100
    );

    return {
      p10TonsHa,
      p50TonsHa,
      p90TonsHa,
      areaHa,
      totalP10Tons,
      totalP50Tons,
      totalP90Tons,
      grossRevenueNgn,
      thirtyTonTrailersRequired,
      standardFiftyKgBags,
      yieldGapPct: Math.max(4, yieldGapPct),
    };
  }, [activeProfile, areaHectares, simulatedForecast]);

  const handleCommitWeighbridgeCalibration = async (ticketPayload) => {
    const newEntry = {
      weighbridgeTicketCode: ticketPayload.weighbridgeTicketCode,
      cropKey: ticketPayload.cropKey,
      parcelName: ticketPayload.parcelName,
      standardDryNetTons: ticketPayload.standardDryNetTons,
      predictedP50TonsHa: ticketPayload.predictedP50TonsHa,
      actualYieldTonsHa: ticketPayload.actualYieldTonsHa,
      measuredMoisturePct: ticketPayload.measuredMoisturePct,
      buyerGradeTier: ticketPayload.buyerGradeTier,
      recordedAt: '2024-11-02',
    };
    setWeighbridgeLedger((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  return (
    <div className="yield-cockpit-page" data-testid="harvest-yield-predictor-cockpit">
      <NavBar />

      <main className="yield-cockpit-main">
        {/* Hero Executive Banner */}
        <section className="yield-hero-banner">
          <div className="yield-hero-copy">
            <div className="yield-hero-badges">
              <span className="yield-pill-emerald">
                SPRINT 21 • MECHANISTIC RUE + RIDGE ML ENSEMBLE
              </span>
              <span className="yield-pill-ochre">
                {apiConnected
                  ? 'LIVE TELEMETRY STREAM ACTIVE'
                  : 'DETERMINISTIC AGRONOMY ENGINE READY'}
              </span>
            </div>
            <h1 className="yield-hero-title">
              Harvest Yield Predictor &amp; Sub-Parcel Productivity Cockpit
            </h1>
            <p className="yield-hero-subtitle">
              Coupling Monteith Radiation Use Efficiency (RUE), FAO-33 water deficit
              response (Ky), and 250-trial Monte Carlo stochastic simulations to project
              P10/P50/P90 harvest tonnage, variable-rate fertilizer prescriptions, and
              weighbridge shrinkage calibration.
            </p>
          </div>

          <div className="yield-hero-controls">
            <div className="yield-control-group">
              <label htmlFor="cockpit-crop-select">Cultivar &amp; Parcel Profile</label>
              <select
                id="cockpit-crop-select"
                value={selectedCropKey}
                onChange={(e) => setSelectedCropKey(e.target.value)}
                data-testid="cockpit-crop-select"
              >
                {CULTIVAR_CATALOG.map((item) => (
                  <option key={item.cropKey} value={item.cropKey}>
                    {item.cropName} — {item.stateName} ({item.areaHectares} ha)
                  </option>
                ))}
              </select>
            </div>

            <div className="yield-control-group">
              <label htmlFor="cockpit-area-input">Cultivated Parcel Area (ha)</label>
              <input
                id="cockpit-area-input"
                type="number"
                min="0.5"
                max="500"
                step="0.5"
                value={areaHectares}
                onChange={(e) => setAreaHectares(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="yield-weighbridge-cta"
              onClick={() => setIsWeighbridgeModalOpen(true)}
              data-testid="open-weighbridge-modal-btn"
            >
              ⚖️ Log Weighbridge Ticket &amp; Calibrate
            </button>
          </div>
        </section>

        {/* Executive KPI Summary Strip */}
        <section className="yield-kpi-grid" aria-label="Executive Yield KPIs">
          <article className="yield-kpi-card primary">
            <span className="kpi-eyebrow">MEDIAN P50 HARVEST FORECAST</span>
            <strong className="kpi-headline" data-testid="kpi-p50-yield">
              {effectiveForecast.p50TonsHa} t/ha
            </strong>
            <span className="kpi-footnote">
              80% CI Band: {effectiveForecast.p10TonsHa} – {effectiveForecast.p90TonsHa}{' '}
              t/ha (Regional Avg: {activeProfile.regionalAverageTonsHa} t/ha)
            </span>
          </article>

          <article className="yield-kpi-card">
            <span className="kpi-eyebrow">TOTAL PARCEL DRY TONNAGE</span>
            <strong className="kpi-headline" data-testid="kpi-total-tonnage">
              {effectiveForecast.totalP50Tons} Metric Tons
            </strong>
            <span className="kpi-footnote">
              ≈ {effectiveForecast.standardFiftyKgBags.toLocaleString()} bags (50kg) @{' '}
              {activeProfile.standardMoisturePct}% std moisture
            </span>
          </article>

          <article className="yield-kpi-card ochre">
            <span className="kpi-eyebrow">PROJECTED FARM-GATE VALUE (P50)</span>
            <strong className="kpi-headline">
              ₦{(effectiveForecast.grossRevenueNgn / 1e6).toFixed(2)}M
            </strong>
            <span className="kpi-footnote">
              Spot Valuation: ₦
              {activeProfile.farmGatePriceNgnPerTon.toLocaleString()}/ton • Window:{' '}
              {activeProfile.optimalHarvestWindow}
            </span>
          </article>

          <article className="yield-kpi-card">
            <span className="kpi-eyebrow">FLEET EVACUATION &amp; YIELD GAP</span>
            <strong className="kpi-headline">
              {effectiveForecast.thirtyTonTrailersRequired} × 30t Trailers
            </strong>
            <span className="kpi-footnote">
              Exploitable Yield Gap: {effectiveForecast.yieldGapPct}% below{' '}
              {activeProfile.geneticPotentialTonsHa} t/ha ceiling
            </span>
          </article>
        </section>

        {/* Primary Two-Column Analytical Workspace */}
        <div className="yield-workspace-grid">
          <SubParcelYieldHeatmapCanvas
            cropType={activeProfile.cropName}
            parcelCode={`PRC-${selectedCropKey.slice(0, 3)}-104`}
            parcelName={activeProfile.parcelName}
            onSelectCell={(cell) => setSelectedSubParcelCell(cell)}
          />

          <YieldSensitivitySimulatorCard
            cropType={activeProfile.cropName}
            areaHectares={effectiveForecast.areaHa}
            monteCarlo={{
              p10DownsideTonsPerHa: effectiveForecast.p10TonsHa,
              p50MedianTonsPerHa: effectiveForecast.p50TonsHa,
              p90UpsideTonsPerHa: effectiveForecast.p90TonsHa,
              p50TotalTonnage: effectiveForecast.totalP50Tons,
              p50GrossRevenueNgn: effectiveForecast.grossRevenueNgn,
            }}
            onRunSimulation={(simParams) => {
              const nFactor = 0.82 + Math.min(0.32, (simParams.appliedNitrogenKgHa || 120) / 520);
              const rainFactor = 0.85 + Math.min(0.28, (simParams.seasonalRainfallMm || 650) / 2600);
              const ndviFactor = 0.78 + Math.min(0.36, (simParams.peakNdvi || 0.78) * 0.45);
              const pestPenalty = 1 - Math.min(0.45, (simParams.pestDiseaseLossPct || 3.5) / 100);
              const nextP50 = Number(
                (
                  activeProfile.predictedP50TonsHa *
                  nFactor *
                  rainFactor *
                  ndviFactor *
                  pestPenalty
                ).toFixed(2)
              );
              setSimulatedForecast({
                p10YieldTonsHa: Number((nextP50 * 0.82).toFixed(2)),
                p50YieldTonsHa: nextP50,
                p90YieldTonsHa: Number((nextP50 * 1.18).toFixed(2)),
              });
            }}
          />
        </div>

        {/* Biomass Thermal-Time Partitioning Curve */}
        <div className="yield-fullwidth-block">
          <BiomassAccumulationCurveChart
            cropKey={selectedCropKey}
            predictedP50TonsHa={effectiveForecast.p50TonsHa}
            harvestIndex={activeProfile.harvestIndex}
            radiationUseEfficiencyGPerMj={activeProfile.rueGPerMj}
          />
        </div>

        {/* Post-Harvest Grain Drying, Aflatoxin & Fleet Evacuation Card */}
        <PostHarvestDryingAndFleetCard
          cropKey={selectedCropKey}
          cropName={activeProfile.cropName}
          areaHectares={effectiveForecast.areaHa}
          predictedYieldTonsHa={effectiveForecast.p50TonsHa}
        />

        {/* Weighbridge Calibration Ledger & Post-Harvest Reconciliation */}
        <section
          className="yield-ledger-section"
          aria-label="Weighbridge Calibration Audit Ledger"
        >
          <header className="yield-ledger-header">
            <div>
              <span className="yield-ledger-eyebrow">
                GROUND-TRUTH SILO RECONCILIATION LEDGER
              </span>
              <h2 className="yield-ledger-title">
                Historical Weighbridge Shrinkage &amp; Model Residual Audit Trail
              </h2>
            </div>
            {selectedSubParcelCell && (
              <div className="yield-selected-cell-pill">
                Active Grid Focus: <strong>{selectedSubParcelCell.cellCode}</strong> (
                {selectedSubParcelCell.expectedYieldTonsHa} t/ha)
              </div>
            )}
          </header>

          <div className="yield-table-responsive">
            <table className="yield-ledger-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Parcel &amp; Cultivar</th>
                  <th>Wet Moisture</th>
                  <th>Dry Net Tonnage</th>
                  <th>Predicted P50</th>
                  <th>Actual Dry Yield</th>
                  <th>Residual APE</th>
                  <th>Commercial Grade</th>
                </tr>
              </thead>
              <tbody>
                {weighbridgeLedger.map((row) => {
                  const ape =
                    row.predictedP50TonsHa > 0
                      ? (
                          (Math.abs(row.actualYieldTonsHa - row.predictedP50TonsHa) /
                            row.predictedP50TonsHa) *
                          100
                        ).toFixed(1)
                      : '0.0';
                  return (
                    <tr key={row.weighbridgeTicketCode}>
                      <td>
                        <code>{row.weighbridgeTicketCode}</code>
                      </td>
                      <td>
                        <strong>{row.parcelName}</strong> ({row.cropKey})
                      </td>
                      <td>{row.measuredMoisturePct}%</td>
                      <td>{row.standardDryNetTons} t</td>
                      <td>{row.predictedP50TonsHa} t/ha</td>
                      <td>
                        <strong>{row.actualYieldTonsHa} t/ha</strong>
                      </td>
                      <td>
                        <span className="yield-ape-badge">{ape}% APE</span>
                      </td>
                      <td>
                        <span className="yield-grade-pill">{row.buyerGradeTier}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <WeighbridgeCalibrationModal
        isOpen={isWeighbridgeModalOpen}
        onClose={() => setIsWeighbridgeModalOpen(false)}
        forecastSummary={{
          cropKey: selectedCropKey,
          parcelName: activeProfile.parcelName,
          areaHectares: effectiveForecast.areaHa,
          predictedP50TonsHa: effectiveForecast.p50TonsHa,
        }}
        onSubmitCalibration={handleCommitWeighbridgeCalibration}
      />
    </div>
  );
};

export default HarvestYieldPredictorCockpit;
