import React, { useState, useEffect, useCallback } from 'react';
import RootZoneDepletionBucketCanvas from '../components/RootZoneDepletionBucketCanvas';
import SmartPumpRelayControlCard from '../components/SmartPumpRelayControlCard';
import SevenDayEvapotranspirationLedgerCard from '../components/SevenDayEvapotranspirationLedgerCard';
import SalinityLeachingAndAwdSimulatorCard from '../components/SalinityLeachingAndAwdSimulatorCard';
import ManualValveOverrideModal from '../components/ManualValveOverrideModal';
import './IrrigationSchedulingAdvisorCockpit.css';

const FALLBACK_ZONES = [
  {
    zoneCode: 'IRR-ZN-1001',
    zoneName: 'Hadejia-Jama’are Sector B — Drip Irrigated Roma Tomato',
    stateName: 'Kano',
    lgaName: 'Kura',
    riverBasinAuthority: 'Hadejia-Jama’are RBDA',
    cropKey: 'TOMATO_IRRIGATED',
    soilTextureKey: 'SANDY_LOAM',
    irrigationMethod: 'SUBSURFACE_DRIP_TAPE',
    commandAreaHectares: 14.5,
    matricSuctionKpa: 46.0,
    referenceEt0MmDay: 6.4,
    effectiveRainMmDay: 0.0,
    scheduleEvaluation: {
      cropName: 'Irrigated Roma Tomato',
      textureName: 'Sandy Loam',
      tawMm: 108.0,
      rawMm: 45.4,
      currentMoistureVolPct: 15.8,
      currentDepletionDrMm: 52.3,
      depletionOfTawPct: 48.4,
      waterStressCoeffKs: 0.88,
      actualCropEtcMmDay: 6.5,
      netIrrigationDepthMm: 52.3,
      grossIrrigationDepthMm: 58.1,
      grossWaterVolumeM3: 842,
      daysToNextIrrigationTrigger: 0,
      triggerDecision: 'IRRIGATE_IMMEDIATELY_RAW_EXCEEDED',
    },
  },
  {
    zoneCode: 'IRR-ZN-1002',
    zoneName: 'Kadawa Wheat Belt Block 4 — Center Pivot Durum Wheat',
    stateName: 'Kano',
    lgaName: 'Garun Mallam',
    riverBasinAuthority: 'Hadejia-Jama’are RBDA',
    cropKey: 'WHEAT_IRRIGATED',
    soilTextureKey: 'LOAM',
    irrigationMethod: 'CENTER_PIVOT_SPRINKLER',
    commandAreaHectares: 42.0,
    matricSuctionKpa: 28.0,
    referenceEt0MmDay: 5.9,
    effectiveRainMmDay: 0.0,
    scheduleEvaluation: {
      cropName: 'Irrigated Durum / Bread Wheat',
      textureName: 'Silt / Medium Loam',
      tawMm: 165.0,
      rawMm: 90.8,
      currentMoistureVolPct: 24.2,
      currentDepletionDrMm: 41.8,
      depletionOfTawPct: 25.3,
      waterStressCoeffKs: 1.0,
      actualCropEtcMmDay: 6.7,
      netIrrigationDepthMm: 0.0,
      grossIrrigationDepthMm: 0.0,
      grossWaterVolumeM3: 0,
      daysToNextIrrigationTrigger: 7,
      triggerDecision: 'ADEQUATE_MOISTURE_NO_IRRIGATION',
    },
  },
];

const FALLBACK_PUMPS = [
  {
    relayNodeCode: 'PMP-RLY-1001',
    stationName: 'Kura Solar-MPPT Submersible Pump Station #1',
    stateName: 'Kano',
    powerSourceType: 'SOLAR_PV_HYBRID_MPPT',
    pipeInnerDiameterMm: 110.0,
    filterDifferentialPressureBar: 0.24,
    boreholeDrawdownOk: true,
    contactorState: 'ENERGIZED_PUMPING',
    hydraulics: {
      flowRateM3PerHour: 68.0,
      totalFrictionHeadLossM: 5.14,
      totalDynamicHeadMeters: 50.15,
      hydraulicPowerKw: 9.29,
      electricalInputPowerKw: 13.79,
      recommendedSolarPvArrayKwp: 17.65,
      pumpingDurationHours: 9.41,
      totalEnergyKwh: 129.8,
      dieselFuelCostSavedNgn: 49064,
    },
  },
];

const IrrigationSchedulingAdvisorCockpit = () => {
  const [zones, setZones] = useState(FALLBACK_ZONES);
  const [selectedZone, setSelectedZone] = useState(FALLBACK_ZONES[0]);
  const [pumps, setPumps] = useState(FALLBACK_PUMPS);
  const [selectedPump, setSelectedPump] = useState(FALLBACK_PUMPS[0]);
  const [matricSuctionKpa, setMatricSuctionKpa] = useState(46);
  const [referenceEt0MmDay, setReferenceEt0MmDay] = useState(6.4);
  const [sevenDayLedger, setSevenDayLedger] = useState(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [relayToastMessage, setRelayToastMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadInitialTelemetry = async () => {
      try {
        const [zonesRes, pumpsRes] = await Promise.all([
          fetch('/api/irrigation-advisor/zones'),
          fetch('/api/irrigation-advisor/pumps'),
        ]);
        if (zonesRes.ok && isMounted) {
          const zData = await zonesRes.json();
          if (Array.isArray(zData?.zones) && zData.zones.length > 0) {
            setZones(zData.zones);
            setSelectedZone(zData.zones[0]);
          }
        }
        if (pumpsRes.ok && isMounted) {
          const pData = await pumpsRes.json();
          if (Array.isArray(pData?.pumps) && pData.pumps.length > 0) {
            setPumps(pData.pumps);
            setSelectedPump(pData.pumps[0]);
          }
        }
      } catch (_err) {
        // Offline / unit-test fallback already initialized
      }
    };
    loadInitialTelemetry();
    return () => {
      isMounted = false;
    };
  }, []);

  const recomputeRootZoneSchedule = useCallback(
    async (zone, nextSuction, nextEt0) => {
      // Optimistic local calculation first for instant responsiveness
      const tawMm = zone?.scheduleEvaluation?.tawMm || 108.0;
      const rawMm = zone?.scheduleEvaluation?.rawMm || 45.4;
      const estDepletionMm = Math.min(
        tawMm,
        Math.max(4, Math.round(nextSuction * 1.12 * 10) / 10)
      );
      const isUrgent = estDepletionMm >= rawMm;
      const updatedZone = {
        ...zone,
        matricSuctionKpa: nextSuction,
        referenceEt0MmDay: nextEt0,
        scheduleEvaluation: {
          ...(zone?.scheduleEvaluation || {}),
          tawMm,
          rawMm,
          currentDepletionDrMm: estDepletionMm,
          depletionOfTawPct: Math.round((estDepletionMm / tawMm) * 1000) / 10,
          currentMoistureVolPct: Math.max(8.5, Math.round((28 - nextSuction * 0.14) * 10) / 10),
          waterStressCoeffKs: isUrgent ? 0.78 : 1.0,
          grossIrrigationDepthMm: isUrgent ? Math.round(estDepletionMm * 1.12 * 10) / 10 : 0,
          grossWaterVolumeM3: isUrgent
            ? Math.round(estDepletionMm * 1.12 * 10 * (zone?.commandAreaHectares || 14.5))
            : 0,
          triggerDecision: isUrgent
            ? 'IRRIGATE_IMMEDIATELY_RAW_EXCEEDED'
            : 'ADEQUATE_MOISTURE_NO_IRRIGATION',
        },
      };
      setSelectedZone(updatedZone);

      try {
        const res = await fetch('/api/irrigation-advisor/evaluate-schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cropKey: zone?.cropKey || 'TOMATO_IRRIGATED',
            soilTextureKey: zone?.soilTextureKey || 'SANDY_LOAM',
            commandAreaHectares: zone?.commandAreaHectares || 14.5,
            matricSuctionKpa: nextSuction,
            referenceEt0MmDay: nextEt0,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.scheduleEvaluation) {
            setSelectedZone((prev) => ({
              ...prev,
              scheduleEvaluation: data.scheduleEvaluation,
            }));
          }
          if (data?.sevenDayLedger) {
            setSevenDayLedger(data.sevenDayLedger);
          }
        }
      } catch (_err) {
        // Keep optimistic local update
      }
    },
    []
  );

  const handleSelectZone = (zone) => {
    const nextSuction = Number(zone?.matricSuctionKpa || 46);
    const nextEt0 = Number(zone?.referenceEt0MmDay || 6.4);
    setMatricSuctionKpa(nextSuction);
    setReferenceEt0MmDay(nextEt0);
    recomputeRootZoneSchedule(zone, nextSuction, nextEt0);
  };

  const handleSuctionChange = (val) => {
    setMatricSuctionKpa(val);
    recomputeRootZoneSchedule(selectedZone, val, referenceEt0MmDay);
  };

  const handleEt0Change = (val) => {
    setReferenceEt0MmDay(val);
    recomputeRootZoneSchedule(selectedZone, matricSuctionKpa, val);
  };

  const handleDispatchRelayCommand = async (payload) => {
    const newState =
      payload.commandAction === 'EMERGENCY_STOP'
        ? 'STANDBY_READY'
        : payload.commandAction === 'FERTIGATION_PULSE'
        ? 'FERTIGATION_VENTURI_DOSING'
        : 'ENERGIZED_PUMPING';

    setSelectedPump((prev) => ({
      ...prev,
      contactorState: newState,
    }));
    setRelayToastMessage(
      `Dispatched ${payload.commandAction} to ${payload.relayNodeCode} (${payload.targetRuntimeMinutes} min cycle) → ${newState}`
    );
    setIsOverrideModalOpen(false);
  };

  return (
    <div
      className="irrigation-cockpit-page"
      data-testid="irrigation-scheduling-advisor-cockpit"
    >
      {/* Hero Banner */}
      <header className="irrigation-cockpit-hero">
        <div className="irrigation-hero-content">
          <span className="irrigation-hero-badge">
            SPRINT 23 • FAO-56 DUAL-KC WATER BALANCE &amp; SMART PUMP RELAY ADVISOR
          </span>
          <h1 className="irrigation-hero-title">
            Precision Irrigation Scheduling &amp; Pump Hydraulics Cockpit
          </h1>
          <p className="irrigation-hero-subtitle">
            Real-time Van Genuchten tensiometer matric suction, FAO-56 root-zone depletion
            thresholds (RAW/TAW), Hazen-Williams pipeline friction modeling, and solar-MPPT
            smart relay automation across Nigeria’s River Basin Development Authorities.
          </p>
        </div>

        <div className="irrigation-hero-actions">
          <button
            type="button"
            className="irrigation-hero-override-btn"
            onClick={() => setIsOverrideModalOpen(true)}
            data-testid="hero-open-valve-override-btn"
          >
            ⚡ Manual Solenoid &amp; Pump Override
          </button>
        </div>
      </header>

      {relayToastMessage && (
        <div
          className="irrigation-relay-toast"
          role="status"
          data-testid="irrigation-relay-toast-banner"
        >
          <span>✅ {relayToastMessage}</span>
          <button
            type="button"
            onClick={() => setRelayToastMessage('')}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Two-Column Grid: Root-Zone Bucket + Smart Pump Relay */}
      <section className="irrigation-cockpit-main-grid">
        <RootZoneDepletionBucketCanvas
          zones={zones}
          selectedZone={selectedZone}
          onSelectZone={handleSelectZone}
          matricSuctionKpa={matricSuctionKpa}
          onChangeMatricSuction={handleSuctionChange}
          referenceEt0MmDay={referenceEt0MmDay}
          onChangeReferenceEt0={handleEt0Change}
        />

        <SmartPumpRelayControlCard
          pumps={pumps}
          selectedPump={selectedPump}
          onSelectPump={setSelectedPump}
          onDispatchRelayCommand={handleDispatchRelayCommand}
          onOpenManualOverrideModal={() => setIsOverrideModalOpen(true)}
        />
      </section>

      {/* 7-Day Rolling Evapotranspiration & Auto-Refill Ledger */}
      <section className="irrigation-cockpit-secondary-section">
        <SevenDayEvapotranspirationLedgerCard sevenDayLedger={sevenDayLedger} />
        <SalinityLeachingAndAwdSimulatorCard />
      </section>

      <ManualValveOverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        selectedPump={selectedPump}
        onSubmitOverride={handleDispatchRelayCommand}
      />
    </div>
  );
};

export default IrrigationSchedulingAdvisorCockpit;
