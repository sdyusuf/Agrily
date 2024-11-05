# Sprint 22 Implementation Plan: Pest Infestation Heatmap & IPM Biocontrol Telemetry

**Sprint Window:** Nov 04 – Nov 17, 2024  
**Branch:** `feat/sprint-22`  
**Target LOC Delta:** `+6,000+` SLOC

## 1. Architectural Scope
1. **Mongoose Entomological Schemas (`Commit 22.1`):**
   - `backend/models/PestOutbreakReport.js`: Crowd-sourced & extension-verified field scouting observations, Davis 1–9 foliar damage scale, larval instar stages, and pheromone trap catches.
   - `backend/models/PheromoneTrapStation.js`: Geo-tagged Delta/bucket pheromone & solar light trap stations tracking nightly adult moth flights and biofix degree-days.
   - `backend/models/IpmBiocontrolGuide.js`: Integrated Pest Management (IPM) biological control agents (*Trichogramma*, *Telenomus remus*, *Bt*, *Beauveria bassiana*, Neem Azadirachtin) and IRAC MoA rotation guides.
2. **Degree-Day Phenology, Pedigo EIL/ET & Wind-Plume Dispersal Engine (`Commit 22.2`):**
   - `backend/services/pestPhenologyAndEilEngine.js`: Baskerville-Emin degree-day larval instar emergence model, Pedigo (1986) Economic Injury Level ($EIL = C / (V \times I \times D \times K)$) & Economic Threshold ($ET = 0.75 \times EIL$), and Gaussian wind-advection swarm trajectory model.
   - `backend/services/pestSpatialKernelDensityService.js`: 2D Epanechnikov / Gaussian Kernel Density Estimation (KDE) spatial contagion hotspot mapper across Nigeria's 36 states + FCT.
3. **REST API Routes & Scouting Ingestion Pipeline (`Commit 22.3`):**
   - `backend/routes/pestHeatmapRoutes.js` mounted at `/api/pest-heatmap` in `backend/app.js`.
4. **Interactive Frontend Components (`Commit 22.4`):**
   - `frontend/src/components/PestSpatialHeatmapCanvas.jsx` & `.css`: Interactive 37-state & sub-corridor pest outbreak KDE radar with wind dispersal arrows.
   - `frontend/src/components/EconomicInjuryThresholdCalculatorCard.jsx` & `.css`: Interactive Pedigo EIL/ET calculator & larval degree-day instar clock.
   - `frontend/src/components/CrowdScoutingReportModal.jsx` & `.css`: Field scouting submission modal with Davis 1–9 whorl damage selector & IPM prescription generator.
5. **Master Cockpit Page & Navigation (`Commit 22.5`):**
   - `frontend/src/components/IpmBiocontrolMatrixCard.jsx` & `.css`.
   - `frontend/src/pages/PestInfestationHeatmapCockpit.jsx` & `.css` wired at `/pest-heatmap` and `/agronomy/pests`.
6. **National Entomological Epidemic Simulation & Combinatorial Matrix (`Commit 22.6`):**
   - `backend/services/migratorySwarmTrajectoryEngine.js` & `backend/tests/nationalPestOutbreakPermutationMatrix.test.js`.
