# Sprint 23 Implementation Plan: Irrigation Scheduling Advisor & Smart Pump Relay Telemetry

**Sprint Window:** Nov 18 – Dec 01, 2024  
**Branch:** `feat/sprint-23`  
**Target LOC Delta:** `+6,000+` SLOC

## 1. Architectural Scope
1. **Mongoose Hydrological & Relay Schemas (`Commit 23.1`):**
   - `backend/models/IrrigationZoneSchedule.js`: FAO-56 dual crop coefficient ($K_{cb} + K_e$) root-zone soil water balance, Total Available Water ($\text{TAW}$), Readily Available Water ($\text{RAW}$), and gross irrigation depth.
   - `backend/models/SmartPumpRelayNode.js`: Solar PV / Variable Frequency Drive (VFD) submersible & centrifugal pump relay telemetry, Hazen-Williams manifold head loss, and dry-run interlock safety.
   - `backend/models/TensiometerSensorPod.js`: Multi-depth ($15\text{ cm} - 90\text{ cm}$) tensiometer matric suction ($\text{kPa}$) and salinity leaching fraction ($\text{LF}$) pod schema.
2. **FAO-56 Root-Zone Depletion, Van Genuchten Retention & Pump Hydraulics Engine (`Commit 23.2`):**
   - `backend/services/fao56SoilWaterBalanceEngine.js`: FAO-56 daily root-zone depletion balance ($D_{r,i} = D_{r,i-1} - P_e - I_n + ET_c + DP$), Christiansen / Karmeli emitter Distribution Uniformity ($DU_{lq}$), and Rhoades salinity leaching fraction.
   - `backend/services/smartPumpHydraulicsAndRelayService.js`: Hazen-Williams pipe friction loss, pump brake horsepower ($\text{BHP}$), solar PV pump curve matching, and automated solenoid valve relay state machine.
3. **REST API Routes & Relay Actuation Pipeline (`Commit 23.3`):**
   - `backend/routes/irrigationAdvisorRoutes.js` mounted at `/api/irrigation-advisor` in `backend/app.js`.
4. **Interactive Frontend Components (`Commit 23.4`):**
   - `frontend/src/components/RootZoneDepletionBucketCanvas.jsx` & `.css`: Interactive 8×8 multi-block soil moisture depletion & tensiometer matric suction map.
   - `frontend/src/components/SmartPumpRelayControlCard.jsx` & `.css`: Real-time IoT solenoid valve & solar VFD pump relay dispatch console with Hazen-Williams pressure telemetry.
   - `frontend/src/components/ManualValveOverrideModal.jsx` & `.css`: Safety-interlocked manual fertigation & pulse-irrigation dispatch modal.
5. **Master Cockpit Page & Navigation (`Commit 23.5`):**
   - `frontend/src/components/SevenDayEvapotranspirationLedgerCard.jsx` & `.css`.
   - `frontend/src/pages/IrrigationSchedulingAdvisorCockpit.jsx` & `.css` wired at `/irrigation-advisor` and `/agronomy/irrigation`.
6. **National River Basin Command & Regulated Deficit Irrigation (RDI) Matrix (`Commit 23.6`):**
   - `backend/services/regulatedDeficitAndSalinityEngine.js` & `backend/tests/nationalIrrigationBasinPermutationMatrix.test.js`.
