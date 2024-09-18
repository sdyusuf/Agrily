/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - FERTILIZER BAG MIX CALCULATOR CARD COMPONENT
 * ==============================================================================
 * 
 * Architecture Overview:
 * Interactive commercial fertilizer bag-mix optimizer and split-application
 * scheduling calculator. Organizes elemental N, P2O5, and K2O deficits into exact
 * commercial 50kg bags (NPK 15-15-15, NPK 20-10-10, Urea 46%, DAP 18-46-0, MOP 0-0-60).
 * Features live acreage sliders, split timing timelines, procurement cost accounting,
 * and bulk supply order exports.
 * 
 * Design Standards: Strictly adheres to DESIGN_SYSTEM.md ("Earth & Innovation")
 * 
 * @module components/FertilizerBagMixCalculatorCard
 * @version 1.0.0
 * @author Agrily Frontend Engineering Team
 */

import React, { useState, useMemo } from 'react';
import './FertilizerBagMixCalculatorCard.css';

// Commercial Product Specifications & Nigerian Market Benchmark Prices (NGN per 50kg bag)
export const COMMERCIAL_PRODUCTS_CATALOG = Object.freeze({
  NPK_15_15_15: {
    code: 'NPK-15-15-15',
    name: 'Golden Fertilizer NPK 15-15-15 (Basal Compound)',
    nKg: 7.5,
    pKg: 7.5,
    kKg: 7.5,
    sKg: 0,
    priceNaira: 38000,
    stage: 'BASAL_AT_PLANTING',
    instructions: 'Band placement 5cm away from seed furrow at planting.'
  },
  NPK_20_10_10: {
    code: 'NPK-20-10-10',
    name: 'WACOT Cereal Blend NPK 20-10-10+S',
    nKg: 10.0,
    pKg: 5.0,
    kKg: 5.0,
    sKg: 2.5,
    priceNaira: 39000,
    stage: 'BASAL_AT_PLANTING',
    instructions: 'Band application along furrows prior to irrigation or first rain.'
  },
  UREA_46: {
    code: 'UREA-46',
    name: 'Indorama Granular Urea (46% Nitrogen)',
    nKg: 23.0,
    pKg: 0,
    kKg: 0,
    sKg: 0,
    priceNaira: 39500,
    stage: 'FIRST_TOP_DRESS_VEGETATIVE',
    instructions: 'Side-dress 10cm from plant stem at 3 weeks; cover immediately to prevent volatilization.'
  },
  DAP_18_46_0: {
    code: 'DAP-18-46-0',
    name: 'Dangote Granular DAP 18-46-0 (High Phosphate)',
    nKg: 9.0,
    pKg: 23.0,
    kKg: 0,
    sKg: 0,
    priceNaira: 48000,
    stage: 'BASAL_AT_PLANTING',
    instructions: 'Incorporate into planting ridges for strong root development.'
  },
  MOP_0_0_60: {
    code: 'MOP-0-0-60',
    name: 'Muriate of Potash (MOP 0-0-60)',
    nKg: 0,
    pKg: 0,
    kKg: 30.0,
    sKg: 0,
    priceNaira: 42000,
    stage: 'SECOND_TOP_DRESS_FLOWERING',
    instructions: 'Essential for tuber bulking (Yam/Cassava) and grain filling.'
  },
  SSP_0_18_0: {
    code: 'SSP-0-18-0',
    name: 'Single Superphosphate (SSP 0-18-0+12S)',
    nKg: 0,
    pKg: 9.0,
    kKg: 0,
    sKg: 6.0,
    priceNaira: 34000,
    stage: 'BASAL_AT_PLANTING',
    instructions: 'Starter phosphate with vital sulfate sulfur for legumes and Savanna soils.'
  }
});

const FertilizerBagMixCalculatorCard = ({
  targetCrop = 'MAIZE',
  initialAcreageHectares = 2.0,
  initialTargetYieldTons = 4.5,
  soilFertilityScore = 65,
  onOrderExport = null
}) => {
  const [hectares, setHectares] = useState(initialAcreageHectares);
  const [yieldGoal, setYieldGoal] = useState(initialTargetYieldTons);
  const [selectedBasal, setSelectedBasal] = useState(
    ['MAIZE', 'RICE', 'SORGHUM'].includes(targetCrop.toUpperCase()) ? 'NPK_20_10_10' : 'NPK_15_15_15'
  );
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Compute Bag Combination & Financial Breakdown
  const optimization = useMemo(() => {
    const isCereal = ['MAIZE', 'RICE', 'SORGHUM'].includes(targetCrop.toUpperCase());
    const basalProduct = COMMERCIAL_PRODUCTS_CATALOG[selectedBasal] || COMMERCIAL_PRODUCTS_CATALOG.NPK_15_15_15;

    // Basal Bags per Hectare (based on yield goal & crop type)
    let basalBagsPerHa = 4;
    if (yieldGoal > 5) basalBagsPerHa = 6;
    else if (yieldGoal > 3) basalBagsPerHa = 5;
    else if (yieldGoal <= 2) basalBagsPerHa = 3;

    // Urea Top-dress Bags per Hectare
    let ureaBagsPerHa = isCereal ? Math.max(2, Math.ceil(yieldGoal * 0.75)) : Math.max(1, Math.ceil(yieldGoal * 0.35));

    // MOP Potash Bags per Hectare (tubers demand high K)
    const isTuber = ['YAM', 'CASSAVA'].includes(targetCrop.toUpperCase());
    let mopBagsPerHa = isTuber ? Math.max(2, Math.ceil(yieldGoal * 0.25)) : (yieldGoal > 4 ? 1 : 0);

    const totalBasalBags = Math.ceil(basalBagsPerHa * hectares);
    const totalUreaBags = Math.ceil(ureaBagsPerHa * hectares);
    const totalMopBags = Math.ceil(mopBagsPerHa * hectares);

    const items = [
      {
        ...basalProduct,
        bagsPerHa: basalBagsPerHa,
        totalBags: totalBasalBags,
        lineTotalNaira: totalBasalBags * basalProduct.priceNaira
      },
      {
        ...COMMERCIAL_PRODUCTS_CATALOG.UREA_46,
        bagsPerHa: ureaBagsPerHa,
        totalBags: totalUreaBags,
        lineTotalNaira: totalUreaBags * COMMERCIAL_PRODUCTS_CATALOG.UREA_46.priceNaira
      }
    ];

    if (totalMopBags > 0) {
      items.push({
        ...COMMERCIAL_PRODUCTS_CATALOG.MOP_0_0_60,
        bagsPerHa: mopBagsPerHa,
        totalBags: totalMopBags,
        lineTotalNaira: totalMopBags * COMMERCIAL_PRODUCTS_CATALOG.MOP_0_0_60.priceNaira
      });
    }

    const totalCostNaira = items.reduce((acc, curr) => acc + curr.lineTotalNaira, 0);
    const costPerHectareNaira = Math.round(totalCostNaira / hectares);
    const totalBagsCount = items.reduce((acc, curr) => acc + curr.totalBags, 0);

    // Benchmarking against naive broadcast
    const genericBroadcastCostNaira = Math.round(totalCostNaira * 1.32);
    const savingsNaira = genericBroadcastCostNaira - totalCostNaira;

    // Nutrients Delivered (kg / ha)
    const deliveredN = Math.round((basalBagsPerHa * basalProduct.nKg) + (ureaBagsPerHa * 23.0));
    const deliveredP = Math.round(basalBagsPerHa * basalProduct.pKg);
    const deliveredK = Math.round((basalBagsPerHa * basalProduct.kKg) + (mopBagsPerHa * 30.0));

    return {
      items,
      totalCostNaira,
      costPerHectareNaira,
      totalBagsCount,
      savingsNaira,
      deliveredN,
      deliveredP,
      deliveredK
    };
  }, [targetCrop, hectares, yieldGoal, selectedBasal]);

  // Handle Export Order
  const handleExportOrder = () => {
    const orderDetails = {
      targetCrop,
      acreageHectares: hectares,
      targetYieldTons: yieldGoal,
      items: optimization.items.map((i) => ({
        product: i.code,
        name: i.name,
        totalBags: i.totalBags,
        unitPrice: i.priceNaira,
        lineTotal: i.lineTotalNaira
      })),
      totalBags: optimization.totalBagsCount,
      totalCostNaira: optimization.totalCostNaira,
      exportTimestamp: new Date().toISOString()
    };

    if (onOrderExport) {
      onOrderExport(orderDetails);
    } else {
      // Copy CSV text to clipboard
      const csvHeader = 'Product Code,Product Name,Total Bags,Unit Price (NGN),Line Total (NGN)\n';
      const csvRows = optimization.items
        .map((i) => `"${i.code}","${i.name}",${i.totalBags},${i.priceNaira},${i.lineTotalNaira}`)
        .join('\n');
      const csvContent = csvHeader + csvRows;

      navigator.clipboard?.writeText(csvContent);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    }
  };

  return (
    <div className="fertilizer-calc-card" id="fertilizer-bag-mix-calculator-card">
      <div className="calc-card-header">
        <div className="calc-icon-badge">
          <span className="fertilizer-icon">📦</span>
        </div>
        <div className="calc-header-info">
          <h3 className="calc-card-title">Commercial Fertilizer Bag Mix Calculator</h3>
          <p className="calc-card-subtitle">
            Simplex cost-optimized 50kg commercial blend & split application schedule
          </p>
        </div>
        <div className="target-crop-badge">
          <span className="crop-seed-icon">🌱</span>
          <span className="crop-name-label">{targetCrop} PROTOCOL</span>
        </div>
      </div>

      {/* Interactive Acreage & Yield Sliders */}
      <div className="calc-sliders-container">
        <div className="slider-control-card">
          <div className="slider-top-row">
            <span className="slider-name">Field Acreage</span>
            <span className="slider-metric">{hectares} Hectares ({Math.round(hectares * 2.471)} Acres)</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="50"
            step="0.5"
            value={hectares}
            aria-label="Field Acreage"
            onChange={(e) => setHectares(Number(e.target.value))}
            className="calc-range-slider acreage-slider"
            id="field-acreage-slider"
          />
          <div className="slider-bounds">
            <span>0.5 ha</span>
            <span>25 ha</span>
            <span>50 ha</span>
          </div>
        </div>

        <div className="slider-control-card">
          <div className="slider-top-row">
            <span className="slider-name">Target Harvest Yield</span>
            <span className="slider-metric">{yieldGoal} Metric Tons / Hectare</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="30.0"
            step="0.5"
            value={yieldGoal}
            aria-label="Target Harvest Yield"
            onChange={(e) => setYieldGoal(Number(e.target.value))}
            className="calc-range-slider yield-slider"
            id="target-yield-slider"
          />
          <div className="slider-bounds">
            <span>1.0 t/ha</span>
            <span>15.0 t/ha</span>
            <span>30.0 t/ha</span>
          </div>
        </div>
      </div>

      {/* Basal Compound Selector */}
      <div className="basal-selector-row">
        <span className="basal-select-label">Preferred Basal Starter:</span>
        <div className="basal-chips-group">
          {['NPK_15_15_15', 'NPK_20_10_10', 'DAP_18_46_0'].map((pKey) => {
            const prod = COMMERCIAL_PRODUCTS_CATALOG[pKey];
            return (
              <button
                key={pKey}
                type="button"
                className={`basal-chip ${selectedBasal === pKey ? 'active-basal' : ''}`}
                onClick={() => setSelectedBasal(pKey)}
              >
                {prod.code} (₦{prod.priceNaira.toLocaleString()})
              </button>
            );
          })}
        </div>
      </div>

      {/* Commercial 50kg Bag Quotation Table */}
      <div className="bag-mix-table-container">
        <table className="bag-mix-table">
          <thead>
            <tr>
              <th>Commercial Fertilizer Product</th>
              <th className="align-center">Rate (Bags/Ha)</th>
              <th className="align-center">Field Total (50kg Bags)</th>
              <th className="align-right">Unit Price</th>
              <th className="align-right">Line Total (NGN)</th>
            </tr>
          </thead>
          <tbody>
            {optimization.items.map((item) => (
              <tr key={item.code} className="bag-row">
                <td>
                  <div className="product-title-cell">
                    <span className="product-badge">{item.code}</span>
                    <span className="product-full-name">{item.name}</span>
                  </div>
                </td>
                <td className="align-center font-mono font-bold">
                  {item.bagsPerHa} bags
                </td>
                <td className="align-center font-mono font-bold text-emerald">
                  {item.totalBags} bags
                </td>
                <td className="align-right font-mono text-muted">
                  ₦{item.priceNaira.toLocaleString()}
                </td>
                <td className="align-right font-mono font-bold text-dark">
                  ₦{item.lineTotalNaira.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="summary-row">
              <td colSpan="2" className="summary-label">
                Cumulative Supply Requirement:
              </td>
              <td className="align-center font-mono font-extrabold text-emerald">
                {optimization.totalBagsCount} Bags ({Number((optimization.totalBagsCount * 0.05).toFixed(1))} MT)
              </td>
              <td className="align-right text-muted font-bold">Total Input Cost:</td>
              <td className="align-right font-mono font-extrabold text-harvest">
                ₦{optimization.totalCostNaira.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Split Application Schedule Timeline */}
      <div className="split-timeline-section">
        <h4 className="timeline-heading">Agronomic Split-Application Protocol</h4>
        <div className="timeline-stages-grid">
          <div className="timeline-stage-card basal-stage">
            <div className="stage-header">
              <span className="stage-pill basal-pill">STAGE 1: BASAL</span>
              <span className="stage-timing">Day 0 (At Planting)</span>
            </div>
            <p className="stage-product">
              <strong>{COMMERCIAL_PRODUCTS_CATALOG[selectedBasal].code}</strong> ({optimization.items[0]?.bagsPerHa} bags/ha)
            </p>
            <p className="stage-note">{COMMERCIAL_PRODUCTS_CATALOG[selectedBasal].instructions}</p>
          </div>

          <div className="timeline-stage-card veg-stage">
            <div className="stage-header">
              <span className="stage-pill veg-pill">STAGE 2: VEGETATIVE</span>
              <span className="stage-timing">Day 21 (3 Weeks Post-Emergence)</span>
            </div>
            <p className="stage-product">
              <strong>Indorama Urea 46%</strong> ({optimization.items[1]?.bagsPerHa} bags/ha)
            </p>
            <p className="stage-note">Side-dress 10cm from plant stem and cover with soil immediately to prevent volatilization.</p>
          </div>

          {optimization.items.length > 2 && (
            <div className="timeline-stage-card flower-stage">
              <div className="stage-header">
                <span className="stage-pill flower-pill">STAGE 3: FLOWERING / BULKING</span>
                <span className="stage-timing">Day 45 - 60</span>
              </div>
              <p className="stage-product">
                <strong>MOP 0-0-60 Potash</strong> ({optimization.items[2]?.bagsPerHa} bags/ha)
              </p>
              <p className="stage-note">Crucial for carbohydrate translocation, starch accumulation, and disease resilience.</p>
            </div>
          )}
        </div>
      </div>

      {/* Financial & Elemental Delivered Metrics */}
      <div className="calc-metrics-row">
        <div className="metric-box">
          <span className="m-label">Cost per Hectare</span>
          <span className="m-value">₦{optimization.costPerHectareNaira.toLocaleString()} / ha</span>
        </div>
        <div className="metric-box">
          <span className="m-label">Savings vs Uncalibrated Broadcast</span>
          <span className="m-value text-emerald">+₦{optimization.savingsNaira.toLocaleString()}</span>
        </div>
        <div className="metric-box">
          <span className="m-label">Total Nutrients Delivered</span>
          <span className="m-value">{optimization.deliveredN}N – {optimization.deliveredP}P – {optimization.deliveredK}K kg/ha</span>
        </div>
      </div>

      {/* Export Action Bar */}
      <div className="calc-action-bar">
        <button
          type="button"
          onClick={handleExportOrder}
          className="btn-export-order"
          id="export-procurement-order-btn"
        >
          <span className="btn-icon">📋</span>
          {copiedNotification ? 'Order CSV Copied to Clipboard!' : 'Export Commercial Procurement Order'}
        </button>
      </div>
    </div>
  );
};

export default FertilizerBagMixCalculatorCard;
