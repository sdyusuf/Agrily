# Sprint 21 Architectural Specification: Harvest Yield Predictor & Mechanistic-ML Ensemble

**Sprint Range:** October 21 – November 03, 2024  
**Phase:** Phase 3 — Agronomy AI & Weather Telemetry  
**Target LOC Delta:** `+6,500+` SLOC  

---

## 1. Executive Summary

Accurate pre-harvest yield estimation is essential for forward contracting, warehouse slot reservation, combine/transport fleet sizing, and agricultural input credit underwriting. Sprint 21 delivers an enterprise **Harvest Yield Predictor** that fuses:
1. **Monteith Light Interception & Radiation Use Efficiency ($RUE$) Biomass Physics**
2. **FAO-33 Doorenbos & Kassam Evapotranspiration Yield Reduction ($K_y$)**
3. **$L_2$-Regularized Ridge Regression & Feature Attribution (SHAP-style weights)**
4. **500-Iteration Monte Carlo Stochastic Confidence Intervals (`P10`, `P50`, `P90`)**
5. **Post-Harvest Grain Moisture Shrinkage & Weighbridge Calibration Loop**

---

## 2. Mathematical Formulations

### 2.1 Monteith Radiation Use Efficiency ($RUE$) & Beer-Lambert Canopy Interception
Daily dry-matter biomass accumulation ($\Delta B_t$, in $\text{g m}^{-2}\text{ day}^{-1}$) is governed by absorbed photosynthetically active radiation ($\text{APAR}_t$):

$$\text{APAR}_t = 0.48 \, R_{s,t} \left[1 - \exp\left(-k_{\text{ext}} \cdot \text{LAI}_t\right)\right]$$

$$\Delta B_t = \text{RUE}_{\text{cultivar}} \cdot \text{APAR}_t \cdot f_T(T_t) \cdot f_W(K_{s,t}) \cdot f_{\text{NPK}}(N, P, K)$$

### 2.2 FAO-33 Water Deficit Yield Response ($K_y$)
Relative yield depression due to seasonal evapotranspiration deficit is computed via:

$$1 - \frac{Y_a}{Y_m} = K_y \left(1 - \frac{ET_a}{ET_m}\right)$$

### 2.3 Commercial Grain Drying Shrinkage Formula
Harvested wet grain weight ($W_i$) at moisture percentage $M_i\%$ is standardized to safe commercial storage moisture $M_f\%$ (e.g., $13.0\%$ for maize, $12.5\%$ for paddy rice):

$$W_f = W_i \times \frac{100 - M_i}{100 - M_f}$$
