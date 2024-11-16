/**
 * ==============================================================================
 * 🐞 AGRILY SPRINT 22: MULTI-TIER IPM BIOCONTROL & IRAC ROTATION MATRIX CARD
 * ==============================================================================
 *
 * Displays the 4-tier FAO/IITA Integrated Pest Management (IPM) pyramid:
 *  - Tier 1: Cultural & Push-Pull Companion Cropping (Desmodium + Brachiaria)
 *  - Tier 2: Augmentative Parasitoids & Predators (Trichogramma, Telenomus, Weaver Ants)
 *  - Tier 3: Entomopathogenic Biopesticides (Bt, Beauveria bassiana, Metarhizium, SfMNPV)
 *  - Tier 4: Selective IRAC Mode-of-Action (MoA) Chemical Rotation & PHI Safety
 * ==============================================================================
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './IpmBiocontrolMatrixCard.css';

const IPM_SPECIES_PRESETS = {
  FALL_ARMYWORM: {
    pushPullIntercrop: 'Silverleaf Desmodium (Desmodium uncinatum) — Volatile Sesquiterpene Repellent',
    pushPullBorderTrap: 'Brachiaria cv. Mulato II / Napier Grass — Arrestant Oviposition Sink (68% larval drop)',
    biocontrolAgents: [
      { agentName: 'Telenomus remus (Scelionid Egg Parasitoid)', guild: 'EGG_PARASITOID', releaseRate: '60,000 parasitoids/ha', targetStage: 'EGG_MASS_BIOFIX', knockdownPct: 84, costNgnHa: 22500 },
      { agentName: 'Spodoptera frugiperda Nucleopolyhedrovirus (SfMNPV)', guild: 'BACULOVIRUS', releaseRate: '200 mL/ha SC at dusk', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 86, costNgnHa: 26000 },
      { agentName: 'Bacillus thuringiensis subsp. aizawai (Strain GC-91)', guild: 'BIOPESTICIDE', releaseRate: '1.0 kg/ha WP into whorl', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 82, costNgnHa: 24500 },
      { agentName: 'Azadirachtin 0.15% EC + Sand-Ash Whorl Granules', guild: 'BOTANICAL', releaseRate: '2.5 L/ha foliar', targetStage: 'L3_L4_MID_INSTAR', knockdownPct: 71, costNgnHa: 18500 },
    ],
    iracRotations: [
      { iracGroup: 'IRAC Group 28 (Diamides)', activeIngredient: 'Chlorantraniliprole 200 g/L SC', dose: '150 mL/ha', phiDays: 14, reiHours: 4, beeSafety: 'LOW_POLLINATOR_SAFE' },
      { iracGroup: 'IRAC Group 6 (Avermectins)', activeIngredient: 'Emamectin benzoate 5% SG', dose: '200 g/ha', phiDays: 7, reiHours: 12, beeSafety: 'MODERATE_EVENING_ONLY' },
      { iracGroup: 'IRAC Group 5 (Spinosyns)', activeIngredient: 'Spinetoram 120 g/L SC', dose: '200 mL/ha', phiDays: 3, reiHours: 6, beeSafety: 'MODERATE_EVENING_ONLY' },
    ],
  },
  TUTA_ABSOLUTA: {
    pushPullIntercrop: 'Coriander / French Marigold (Tagetes patula) Volatile Masking Strip',
    pushPullBorderTrap: 'Solanum nigrum Trap Border + Mass Pheromone Water Pan Traps (30 traps/ha)',
    biocontrolAgents: [
      { agentName: 'Trichogramma achaeae + Nesidiocoris tenuis', guild: 'EGG_PARASITOID', releaseRate: '75,000 cards/ha + 1.5 mirids/m²', targetStage: 'EGG_MASS_BIOFIX', knockdownPct: 86, costNgnHa: 31000 },
      { agentName: 'Beauveria bassiana Strain GHA (1×10⁹ CFU/mL)', guild: 'MYCOINSECTICIDE', releaseRate: '1.5 L/ha abaxial mist', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 79, costNgnHa: 27500 },
    ],
    iracRotations: [
      { iracGroup: 'IRAC Group 28 (Diamides)', activeIngredient: 'Cyantraniliprole 100 g/L OD', dose: '600 mL/ha', phiDays: 3, reiHours: 6, beeSafety: 'LOW_POLLINATOR_SAFE' },
      { iracGroup: 'IRAC Group 22A (Oxadiazines)', activeIngredient: 'Indoxacarb 150 g/L EC', dose: '300 mL/ha', phiDays: 3, reiHours: 12, beeSafety: 'MODERATE_EVENING_ONLY' },
    ],
  },
  DESERT_LOCUST: {
    pushPullIntercrop: 'Early-Maturing Bristled Pearl Millet Cultivar Buffer',
    pushPullBorderTrap: 'Trench Hopper Barrier + Neem Seed Cake Bait Corridor',
    biocontrolAgents: [
      { agentName: 'Metarhizium acridum (Green Muscle™ IITA/FAO Spores)', guild: 'MYCOINSECTICIDE', releaseRate: '50 g spores in 1.0 L ULV oil/ha', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 89, costNgnHa: 28000 },
      { agentName: 'Nosema locustae Microsporidian Bran Bait', guild: 'PROTOZOAN_BIOCONTROL', releaseRate: '1.5 kg/ha ahead of hopper band', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 77, costNgnHa: 23000 },
    ],
    iracRotations: [
      { iracGroup: 'IRAC Group 15 (Chitin Synthesis Inhibitor)', activeIngredient: 'Diflubenzuron 240 g/L ULV Strip', dose: '250 mL/ha barrier', phiDays: 14, reiHours: 12, beeSafety: 'LOW_POLLINATOR_SAFE' },
    ],
  },
};

const IpmBiocontrolMatrixCard = ({
  pestKey = 'FALL_ARMYWORM',
  pestCommonName = 'Fall Armyworm (Spodoptera frugiperda)',
}) => {
  const [activeTab, setActiveTab] = useState('BIOCONTROL_PYRAMID');
  const preset =
    IPM_SPECIES_PRESETS[String(pestKey).toUpperCase()] ||
    IPM_SPECIES_PRESETS.FALL_ARMYWORM;

  return (
    <section
      className="ipm-matrix-card"
      data-testid="ipm-biocontrol-matrix-card"
      aria-label="Integrated Pest Management Biocontrol and IRAC Rotation Guide"
    >
      <header className="ipm-matrix-header">
        <div>
          <span className="ipm-matrix-eyebrow">
            FAO / IITA INTEGRATED PEST MANAGEMENT • POLLINATOR-SAFE PROTOCOL
          </span>
          <h3 className="ipm-matrix-title">
            Multi-Tier Biological Control, Push-Pull &amp; IRAC Mode-of-Action Matrix
          </h3>
          <p className="ipm-matrix-subtitle">
            Target Pest: <strong>{pestCommonName}</strong>
          </p>
        </div>

        <div className="ipm-tab-group" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'BIOCONTROL_PYRAMID'}
            className={`ipm-tab-btn ${activeTab === 'BIOCONTROL_PYRAMID' ? 'active' : ''}`}
            onClick={() => setActiveTab('BIOCONTROL_PYRAMID')}
            data-testid="ipm-tab-biocontrol"
          >
            Biocontrol &amp; Push-Pull
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'IRAC_ROTATION'}
            className={`ipm-tab-btn ${activeTab === 'IRAC_ROTATION' ? 'active' : ''}`}
            onClick={() => setActiveTab('IRAC_ROTATION')}
            data-testid="ipm-tab-irac"
          >
            IRAC Chemical Rotation &amp; PHI
          </button>
        </div>
      </header>

      <div className="ipm-pushpull-banner">
        <div>
          <span className="pushpull-tag">PUSH-PULL INTERCROP REPELLENT</span>
          <strong>{preset.pushPullIntercrop}</strong>
        </div>
        <div>
          <span className="pushpull-tag">PERIMETER TRAP CROP SINK</span>
          <strong>{preset.pushPullBorderTrap}</strong>
        </div>
      </div>

      {activeTab === 'BIOCONTROL_PYRAMID' ? (
        <div className="ipm-agents-grid">
          {preset.biocontrolAgents.map((agent) => (
            <article key={agent.agentName} className="ipm-agent-card">
              <div className="agent-card-top">
                <span className="agent-guild-pill">{agent.guild}</span>
                <span className="agent-knockdown-badge">
                  {agent.knockdownPct}% Knockdown
                </span>
              </div>
              <h4 className="agent-name">{agent.agentName}</h4>
              <p className="agent-meta">
                <strong>Field Rate:</strong> {agent.releaseRate}
              </p>
              <p className="agent-meta">
                <strong>Target Stage:</strong> {agent.targetStage} •{' '}
                <strong>Cost:</strong> ₦{agent.costNgnHa.toLocaleString()}/ha
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="ipm-irac-table-wrap">
          <table className="ipm-irac-table">
            <thead>
              <tr>
                <th>IRAC MoA Group</th>
                <th>Active Ingredient</th>
                <th>Dosage / ha</th>
                <th>PHI (Days)</th>
                <th>REI (Hours)</th>
                <th>Pollinator Safety</th>
              </tr>
            </thead>
            <tbody>
              {preset.iracRotations.map((row) => (
                <tr key={row.activeIngredient}>
                  <td>
                    <strong>{row.iracGroup}</strong>
                  </td>
                  <td>{row.activeIngredient}</td>
                  <td>{row.dose}</td>
                  <td>{row.phiDays} d</td>
                  <td>{row.reiHours} h</td>
                  <td>
                    <span className="bee-safe-pill">{row.beeSafety}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

IpmBiocontrolMatrixCard.propTypes = {
  pestKey: PropTypes.string,
  pestCommonName: PropTypes.string,
};

export default IpmBiocontrolMatrixCard;
