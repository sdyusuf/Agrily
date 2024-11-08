/**
 * ==============================================================================
 * 🐛 AGRILY SPRINT 22: PEST DEGREE-DAY PHENOLOGY & PEDIGO EIL/ET ENGINE
 * ==============================================================================
 *
 * Mechanistic entomological modeling service implementing:
 *  1. Baskerville-Emin (1969) single-sine degree-day (GDD) thermal accumulation
 *     and larval instar stage transitions from pheromone trap biofix.
 *  2. Pedigo, Hutchins & Higley (1986) Economic Injury Level (EIL) & Economic
 *     Threshold (ET) bio-economic decision equations:
 *       EIL = C / (V * I * D * K)
 *       ET  = 0.75 * EIL (dynamic lead-time adjustment for larval growth rate)
 *  3. Integrated Pest Management (IPM) Multi-Tier Prescription Synthesizer
 *     (Push-Pull Desmodium/Brachiaria, Augmentative Parasitoids, Biopesticides,
 *      and Pollinator-Safe IRAC Mode-of-Action Chemical Rotation).
 *
 * @module services/pestPhenologyAndEilEngine
 */

const PEST_ENTOMOLOGY_CATALOG = {
  FALL_ARMYWORM: {
    pestKey: 'FALL_ARMYWORM',
    commonName: 'Fall Armyworm (FAW)',
    scientificName: 'Spodoptera frugiperda',
    primaryHostCrops: ['MAIZE', 'SORGHUM', 'MILLET', 'RICE_PADDY'],
    baseTempC: 12.2,
    upperCutoffTempC: 35.5,
    eggToAdultGdd: 495,
    instarGddThresholds: [
      { stageCode: 'EGG_MASS_BIOFIX', minGdd: 0, maxGdd: 52, label: 'Foliar Egg Mass (100–200 eggs/cluster)', biocontrolSusceptibility: 0.96 },
      { stageCode: 'L1_L2_EARLY_INSTAR', minGdd: 53, maxGdd: 145, label: 'L1–L2 Window-Pane Leaf Scraping (Optimal Spray Window)', biocontrolSusceptibility: 0.92 },
      { stageCode: 'L3_L4_MID_INSTAR', minGdd: 146, maxGdd: 255, label: 'L3–L4 Whorl Migration & Frass Plugging', biocontrolSusceptibility: 0.64 },
      { stageCode: 'L5_L6_LATE_BORING', minGdd: 256, maxGdd: 365, label: 'L5–L6 Deep Whorl & Ear/Cob Feeding (Cryptic)', biocontrolSusceptibility: 0.28 },
      { stageCode: 'PUPA_SOIL', minGdd: 366, maxGdd: 495, label: 'Subterranean Soil Pupation (2–8 cm depth)', biocontrolSusceptibility: 0.15 },
      { stageCode: 'ADULT_MOTH_SWARM', minGdd: 496, maxGdd: 9999, label: 'Nocturnal Adult Moth Flight (40–100 km/night wind dispersal)', biocontrolSusceptibility: 0.45 },
    ],
    injuryPerUnitPestI: 0.0042, // fraction of canopy defoliated per % infested plants
    damagePerUnitInjuryD: 0.58, // fractional yield loss per unit injury
    defaultBiocontrolCostNgnHa: 28500,
    defaultChemicalCostNgnHa: 42000,
    biocontrolAgents: [
      { agent: 'Telenomus remus (Egg Parasitoid Wasp)', rate: '60,000 parasitoids/ha', targetStage: 'EGG_MASS_BIOFIX', knockdownPct: 84 },
      { agent: 'Bacillus thuringiensis subsp. aizawai / kurstaki', rate: '1.0 kg/ha WP (evening spray)', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 82 },
      { agent: 'Spodoptera frugiperda Multicapsid Nucleopolyhedrovirus (SfMNPV)', rate: '200 mL/ha SC', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 86 },
      { agent: 'Azadirachtin 0.15% EC (Cold-Pressed Neem Kernel Extract)', rate: '2.5 L/ha into whorl', targetStage: 'L3_L4_MID_INSTAR', knockdownPct: 71 },
    ],
    iracRotationOptions: [
      { iracGroup: 'Group 28 (Diamides)', activeIngredient: 'Chlorantraniliprole 200 g/L SC', dose: '150 mL/ha', phiDays: 14, beeSafety: 'LOW_POLLINATOR_SAFE' },
      { iracGroup: 'Group 6 (Avermectins)', activeIngredient: 'Emamectin benzoate 5% SG', dose: '200 g/ha', phiDays: 7, beeSafety: 'MODERATE_EVENING_ONLY' },
      { iracGroup: 'Group 5 (Spinosyns)', activeIngredient: 'Spinetoram 120 g/L SC', dose: '200 mL/ha', phiDays: 3, beeSafety: 'MODERATE_EVENING_ONLY' },
    ],
  },
  TUTA_ABSOLUTA: {
    pestKey: 'TUTA_ABSOLUTA',
    commonName: 'Tomato Leafminer (Sharoni / Ebola of Tomato)',
    scientificName: 'Phthorimaea (Tuta) absoluta',
    primaryHostCrops: ['TOMATO', 'POTATO', 'PEPPER'],
    baseTempC: 10.0,
    upperCutoffTempC: 34.5,
    eggToAdultGdd: 410,
    instarGddThresholds: [
      { stageCode: 'EGG_MASS_BIOFIX', minGdd: 0, maxGdd: 68, label: 'Creamy-Yellow Foliar/Calyx Oviposition', biocontrolSusceptibility: 0.94 },
      { stageCode: 'L1_L2_EARLY_INSTAR', minGdd: 69, maxGdd: 165, label: 'L1–L2 Mesophyll Blotch Gallery Initiation', biocontrolSusceptibility: 0.88 },
      { stageCode: 'L3_L4_MID_INSTAR', minGdd: 166, maxGdd: 285, label: 'L3–L4 Stem & Green Fruit Calyx Boring', biocontrolSusceptibility: 0.52 },
      { stageCode: 'L5_L6_LATE_BORING', minGdd: 286, maxGdd: 335, label: 'Late Pre-Pupal Exit & Fruit Rot Secondary Entry', biocontrolSusceptibility: 0.25 },
      { stageCode: 'PUPA_SOIL', minGdd: 336, maxGdd: 410, label: 'Silken Cocoon Pupation on Leaf Litter/Soil', biocontrolSusceptibility: 0.18 },
      { stageCode: 'ADULT_MOTH_SWARM', minGdd: 411, maxGdd: 9999, label: 'Crepuscular Adult Moth Emergence (Pheromone Trap Surge)', biocontrolSusceptibility: 0.65 },
    ],
    injuryPerUnitPestI: 0.0065,
    damagePerUnitInjuryD: 0.72,
    defaultBiocontrolCostNgnHa: 34000,
    defaultChemicalCostNgnHa: 48500,
    biocontrolAgents: [
      { agent: 'Trichogramma achaeae + Nesidiocoris tenuis (Mirid Predator)', rate: '75,000 cards/ha + 1.5 bugs/m²', targetStage: 'EGG_MASS_BIOFIX', knockdownPct: 86 },
      { agent: 'Beauveria bassiana Strain GHA (1×10⁹ CFU/mL)', rate: '1.5 L/ha foliar mist', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 79 },
    ],
    iracRotationOptions: [
      { iracGroup: 'Group 28 (Diamides)', activeIngredient: 'Cyantraniliprole 100 g/L OD', dose: '600 mL/ha', phiDays: 3, beeSafety: 'LOW_POLLINATOR_SAFE' },
      { iracGroup: 'Group 22A (Oxadiazines)', activeIngredient: 'Indoxacarb 150 g/L EC', dose: '300 mL/ha', phiDays: 3, beeSafety: 'MODERATE_EVENING_ONLY' },
    ],
  },
  QUELEA_BIRDS: {
    pestKey: 'QUELEA_BIRDS',
    commonName: 'Red-Billed Quelea Bird Swarm',
    scientificName: 'Quelea quelea',
    primaryHostCrops: ['RICE_PADDY', 'SORGHUM', 'MILLET'],
    baseTempC: 15.0,
    upperCutoffTempC: 40.0,
    eggToAdultGdd: 520,
    instarGddThresholds: [
      { stageCode: 'EGG_MASS_BIOFIX', minGdd: 0, maxGdd: 140, label: 'Acacia Thorn Colony Nesting & Incubation', biocontrolSusceptibility: 0.75 },
      { stageCode: 'L1_L2_EARLY_INSTAR', minGdd: 141, maxGdd: 310, label: 'Fledgling Roost Aggregation Near Wetlands', biocontrolSusceptibility: 0.80 },
      { stageCode: 'ADULT_MOTH_SWARM', minGdd: 311, maxGdd: 9999, label: 'Migratory Foraging Flock (Milk-to-Dough Grain Stripping)', biocontrolSusceptibility: 0.70 },
    ],
    injuryPerUnitPestI: 0.0055,
    damagePerUnitInjuryD: 0.68,
    defaultBiocontrolCostNgnHa: 31000,
    defaultChemicalCostNgnHa: 52000,
    biocontrolAgents: [
      { agent: 'Solar Bio-Acoustic Distress Call Emitter + Reflective Mylar Ribbon Grid', rate: '4 acoustic towers/10 ha', targetStage: 'ADULT_MOTH_SWARM', knockdownPct: 76 },
      { agent: 'Autonomous Falconry Drone Deterrence Patrol', rate: '2 sorties/dawn & dusk window', targetStage: 'ADULT_MOTH_SWARM', knockdownPct: 88 },
    ],
    iracRotationOptions: [
      { iracGroup: 'Non-Lethal Avian Repellent', activeIngredient: 'Methyl Anthranilate 20% Foliar Repellent', dose: '3.0 L/ha on heading panicles', phiDays: 5, beeSafety: 'LOW_POLLINATOR_SAFE' },
    ],
  },
  DESERT_LOCUST: {
    pestKey: 'DESERT_LOCUST',
    commonName: 'Desert & African Migratory Locust',
    scientificName: 'Schistocerca gregaria / Locusta migratoria',
    primaryHostCrops: ['MILLET', 'SORGHUM', 'MAIZE', 'COWPEA'],
    baseTempC: 16.0,
    upperCutoffTempC: 42.0,
    eggToAdultGdd: 560,
    instarGddThresholds: [
      { stageCode: 'EGG_MASS_BIOFIX', minGdd: 0, maxGdd: 130, label: 'Moist Sandy Soil Egg Pod Incubation', biocontrolSusceptibility: 0.88 },
      { stageCode: 'L1_L2_EARLY_INSTAR', minGdd: 131, maxGdd: 290, label: 'Gregarious Hopper Band (1st–3rd Nymphal Instar — Primary Target)', biocontrolSusceptibility: 0.94 },
      { stageCode: 'L3_L4_MID_INSTAR', minGdd: 291, maxGdd: 450, label: 'Late 4th–5th Hopper Band Marching Phase', biocontrolSusceptibility: 0.78 },
      { stageCode: 'ADULT_MOTH_SWARM', minGdd: 451, maxGdd: 9999, label: 'Winged Gregarious Swarm (Up to 150 km/day downwind)', biocontrolSusceptibility: 0.58 },
    ],
    injuryPerUnitPestI: 0.0072,
    damagePerUnitInjuryD: 0.80,
    defaultBiocontrolCostNgnHa: 29500,
    defaultChemicalCostNgnHa: 45000,
    biocontrolAgents: [
      { agent: 'Metarhizium acridum (Green Muscle™ Mycoinsecticide ULV)', rate: '50 g spores in 1.0 L mineral oil/ha', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 89 },
      { agent: 'Nosema locustae Protozoan Bait Bran', rate: '1.5 kg/ha along hopper marching front', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 77 },
    ],
    iracRotationOptions: [
      { iracGroup: 'Group 15 (Benzoylureas IGR)', activeIngredient: 'Diflubenzuron 240 g/L ULV Barrier Strip', dose: '250 mL/ha', phiDays: 14, beeSafety: 'LOW_POLLINATOR_SAFE' },
    ],
  },
  BEMISIA_WHITEFLY: {
    pestKey: 'BEMISIA_WHITEFLY',
    commonName: 'Silverleaf Whitefly (CMD & Begomovirus Vector)',
    scientificName: 'Bemisia tabaci',
    primaryHostCrops: ['CASSAVA', 'COWPEA', 'SOYBEAN'],
    baseTempC: 11.0,
    upperCutoffTempC: 36.0,
    eggToAdultGdd: 325,
    instarGddThresholds: [
      { stageCode: 'EGG_MASS_BIOFIX', minGdd: 0, maxGdd: 75, label: 'Abaxial Leaf Pedicel Eggs', biocontrolSusceptibility: 0.85 },
      { stageCode: 'L1_L2_EARLY_INSTAR', minGdd: 76, maxGdd: 185, label: '1st–2nd Instar Crawler & Sessile Scale Nymph', biocontrolSusceptibility: 0.91 },
      { stageCode: 'PUPA_SOIL', minGdd: 186, maxGdd: 265, label: '4th Instar Red-Eyed Pseudopupa', biocontrolSusceptibility: 0.62 },
      { stageCode: 'ADULT_MOTH_SWARM', minGdd: 266, maxGdd: 9999, label: 'Phloem-Feeding Adult Vector & Honeydew Sooty Mold', biocontrolSusceptibility: 0.74 },
    ],
    injuryPerUnitPestI: 0.0048,
    damagePerUnitInjuryD: 0.62,
    defaultBiocontrolCostNgnHa: 25000,
    defaultChemicalCostNgnHa: 37500,
    biocontrolAgents: [
      { agent: 'Encarsia formosa + Eretmocerus eremicus (Aphelinid Parasitoids)', rate: '45,000 parasitoids/ha', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 83 },
      { agent: 'Isaria fumosorosea (Cordyceps) + Potassium Silicate Foliar Soap', rate: '2.0 L/ha abaxial spray', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 78 },
    ],
    iracRotationOptions: [
      { iracGroup: 'Group 23 (Tetronic/Tetramic Acid)', activeIngredient: 'Spirotetramat 150 g/L OD (Two-Way Systemic)', dose: '500 mL/ha', phiDays: 7, beeSafety: 'LOW_POLLINATOR_SAFE' },
      { iracGroup: 'Group 9B (Pyridine Azomethines)', activeIngredient: 'Pymetrozine 50% WG (Feeding Blocker)', dose: '300 g/ha', phiDays: 7, beeSafety: 'LOW_POLLINATOR_SAFE' },
    ],
  },
  COWPEA_POD_BORER: {
    pestKey: 'COWPEA_POD_BORER',
    commonName: 'Legume Pod Borer',
    scientificName: 'Maruca vitrata',
    primaryHostCrops: ['COWPEA', 'SOYBEAN'],
    baseTempC: 11.8,
    upperCutoffTempC: 35.0,
    eggToAdultGdd: 390,
    instarGddThresholds: [
      { stageCode: 'EGG_MASS_BIOFIX', minGdd: 0, maxGdd: 58, label: 'Floral Bud & Raceme Oviposition', biocontrolSusceptibility: 0.92 },
      { stageCode: 'L1_L2_EARLY_INSTAR', minGdd: 59, maxGdd: 155, label: 'L1–L2 Floral Bud Webbing', biocontrolSusceptibility: 0.89 },
      { stageCode: 'L3_L4_MID_INSTAR', minGdd: 156, maxGdd: 280, label: 'Green Pod Entry & Seed Excavation', biocontrolSusceptibility: 0.56 },
      { stageCode: 'ADULT_MOTH_SWARM', minGdd: 281, maxGdd: 9999, label: 'Adult Maruca Moth Migration', biocontrolSusceptibility: 0.60 },
    ],
    injuryPerUnitPestI: 0.0058,
    damagePerUnitInjuryD: 0.65,
    defaultBiocontrolCostNgnHa: 26500,
    defaultChemicalCostNgnHa: 39000,
    biocontrolAgents: [
      { agent: 'Therophilus javanus (Braconid Larval Endoparasitoid) + MaviMNPV Virus', rate: 'Release + 250 mL/ha MaviMNPV', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 85 },
    ],
    iracRotationOptions: [
      { iracGroup: 'Group 28 (Diamides)', activeIngredient: 'Flubendiamide 480 g/L SC', dose: '100 mL/ha', phiDays: 7, beeSafety: 'LOW_POLLINATOR_SAFE' },
    ],
  },
  STEM_BORER: {
    pestKey: 'STEM_BORER',
    commonName: 'African Maize & Sorghum Stalk Borer',
    scientificName: 'Busseola fusca / Sesamia calamistis',
    primaryHostCrops: ['MAIZE', 'SORGHUM'],
    baseTempC: 11.5,
    upperCutoffTempC: 35.0,
    eggToAdultGdd: 540,
    instarGddThresholds: [
      { stageCode: 'EGG_MASS_BIOFIX', minGdd: 0, maxGdd: 85, label: 'Leaf Sheath Inner Margin Egg Batch', biocontrolSusceptibility: 0.90 },
      { stageCode: 'L1_L2_EARLY_INSTAR', minGdd: 86, maxGdd: 210, label: 'Whorl Shot-Hole Feeding Before Stem Tunneling', biocontrolSusceptibility: 0.88 },
      { stageCode: 'L5_L6_LATE_BORING', minGdd: 211, maxGdd: 420, label: 'Internal Pith Tunneling & Dead-Heart Symptom', biocontrolSusceptibility: 0.22 },
      { stageCode: 'ADULT_MOTH_SWARM', minGdd: 421, maxGdd: 9999, label: 'Nocturnal Stem Borer Adult Emergence', biocontrolSusceptibility: 0.50 },
    ],
    injuryPerUnitPestI: 0.0046,
    damagePerUnitInjuryD: 0.60,
    defaultBiocontrolCostNgnHa: 24000,
    defaultChemicalCostNgnHa: 38000,
    biocontrolAgents: [
      { agent: 'Cotesia flavipes (Gregarious Larval Parasitoid) + Push-Pull Desmodium', rate: '4,000 cocoons/ha', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 81 },
    ],
    iracRotationOptions: [
      { iracGroup: 'Group 28 (Diamides)', activeIngredient: 'Chlorantraniliprole 0.4% Granular Whorl Drop', dose: '10 kg/ha granules', phiDays: 14, beeSafety: 'LOW_POLLINATOR_SAFE' },
    ],
  },
  RICE_GALL_MIDGE: {
    pestKey: 'RICE_GALL_MIDGE',
    commonName: 'African Rice Gall Midge (Silver-Shoot)',
    scientificName: 'Orseolia oryzivora',
    primaryHostCrops: ['RICE_PADDY'],
    baseTempC: 13.0,
    upperCutoffTempC: 36.0,
    eggToAdultGdd: 360,
    instarGddThresholds: [
      { stageCode: 'EGG_MASS_BIOFIX', minGdd: 0, maxGdd: 60, label: 'Ligule & Leaf Blade Egg Deposition', biocontrolSusceptibility: 0.86 },
      { stageCode: 'L1_L2_EARLY_INSTAR', minGdd: 61, maxGdd: 190, label: 'Apical Meristem Entry (Pre-Gall Stage)', biocontrolSusceptibility: 0.84 },
      { stageCode: 'L5_L6_LATE_BORING', minGdd: 191, maxGdd: 360, label: 'Tubular Onion-Leaf Silver Shoot Gall Sterility', biocontrolSusceptibility: 0.24 },
    ],
    injuryPerUnitPestI: 0.0052,
    damagePerUnitInjuryD: 0.64,
    defaultBiocontrolCostNgnHa: 25500,
    defaultChemicalCostNgnHa: 39500,
    biocontrolAgents: [
      { agent: 'Platygaster diplosisae + Aprostocetus procerae (Endoparasitoid Complex)', rate: 'Conservation bund floral strips', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 79 },
    ],
    iracRotationOptions: [
      { iracGroup: 'Group 4A (Systemic Seed/Nursery Drench)', activeIngredient: 'Thiamethoxam 25% WG Nursery Root Dip', dose: '100 g/ha', phiDays: 21, beeSafety: 'MODERATE_EVENING_ONLY' },
    ],
  },
  COCOA_MIRID_BUG: {
    pestKey: 'COCOA_MIRID_BUG',
    commonName: 'Brown Cocoa Mirid / Capsid Bug',
    scientificName: 'Sahlbergella singularis',
    primaryHostCrops: ['COCOA'],
    baseTempC: 14.0,
    upperCutoffTempC: 34.0,
    eggToAdultGdd: 470,
    instarGddThresholds: [
      { stageCode: 'EGG_MASS_BIOFIX', minGdd: 0, maxGdd: 110, label: 'Pod Cortex & Chupon Bark Embedded Eggs', biocontrolSusceptibility: 0.82 },
      { stageCode: 'L1_L2_EARLY_INSTAR', minGdd: 111, maxGdd: 290, label: '1st–3rd Nymphal Instar Water-Soaked Lesion Feeding', biocontrolSusceptibility: 0.88 },
      { stageCode: 'ADULT_MOTH_SWARM', minGdd: 291, maxGdd: 9999, label: 'Adult Mirid Canker & Fusarium Dieback Complex', biocontrolSusceptibility: 0.72 },
    ],
    injuryPerUnitPestI: 0.0060,
    damagePerUnitInjuryD: 0.68,
    defaultBiocontrolCostNgnHa: 32000,
    defaultChemicalCostNgnHa: 46000,
    biocontrolAgents: [
      { agent: 'Oecophylla longinoda (African Weaver Ant Biopredation) + Beauveria bassiana', rate: '6weaver ant colonies/ha + 1.5 L/ha', targetStage: 'L1_L2_EARLY_INSTAR', knockdownPct: 83 },
    ],
    iracRotationOptions: [
      { iracGroup: 'Group 4C (Sulfoximines)', activeIngredient: 'Sulfoxaflor 240 g/L SC', dose: '150 mL/ha', phiDays: 14, beeSafety: 'MODERATE_EVENING_ONLY' },
    ],
  },
  SORGHUM_MIDGE: {
    pestKey: 'SORGHUM_MIDGE',
    commonName: 'Sorghum Panicle Midge',
    scientificName: 'Stenodiplosis sorghicola',
    primaryHostCrops: ['SORGHUM'],
    baseTempC: 12.5,
    upperCutoffTempC: 36.5,
    eggToAdultGdd: 290,
    instarGddThresholds: [
      { stageCode: 'EGG_MASS_BIOFIX', minGdd: 0, maxGdd: 45, label: 'Flowering Spikelet Glume Oviposition', biocontrolSusceptibility: 0.90 },
      { stageCode: 'L1_L2_EARLY_INSTAR', minGdd: 46, maxGdd: 165, label: 'Orange Larval Caryopsis Feeding', biocontrolSusceptibility: 0.82 },
      { stageCode: 'ADULT_MOTH_SWARM', minGdd: 166, maxGdd: 9999, label: 'Dawn Adult Midge Panicle Swarming', biocontrolSusceptibility: 0.75 },
    ],
    injuryPerUnitPestI: 0.0050,
    damagePerUnitInjuryD: 0.62,
    defaultBiocontrolCostNgnHa: 23500,
    defaultChemicalCostNgnHa: 36000,
    biocontrolAgents: [
      { agent: 'Eupelmus popa + Aprostocetus diplosidis Parasitoids + Neem Oil', rate: '2.0 L/ha at 50% anthesis', targetStage: 'EGG_MASS_BIOFIX', knockdownPct: 80 },
    ],
    iracRotationOptions: [
      { iracGroup: 'Group 5 (Spinosyns)', activeIngredient: 'Spinosad 480 g/L SC', dose: '150 mL/ha', phiDays: 7, beeSafety: 'MODERATE_EVENING_ONLY' },
    ],
  },
};

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function roundTo(val, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Computes Baskerville-Emin single-sine degree days (GDD) and predicts the current
 * larval instar stage and remaining days until cryptic late-instar boring.
 */
function evaluatePestDegreeDayPhenology(params = {}) {
  const pestKey = String(params.pestKey || 'FALL_ARMYWORM').toUpperCase();
  const spec = PEST_ENTOMOLOGY_CATALOG[pestKey] || PEST_ENTOMOLOGY_CATALOG.FALL_ARMYWORM;

  const dailyMinTempC = clamp(Number(params.dailyMinTempC ?? 21.5), 5.0, 38.0);
  const dailyMaxTempC = clamp(
    Math.max(dailyMinTempC + 1.0, Number(params.dailyMaxTempC ?? 32.5)),
    8.0,
    46.0
  );
  const daysSinceBiofix = clamp(Number(params.daysSinceBiofix ?? 9), 1, 60);

  // Single-sine / upper-cutoff thermal unit calculation
  const effectiveMaxC = Math.min(dailyMaxTempC, spec.upperCutoffTempC);
  const effectiveMinC = Math.max(dailyMinTempC, spec.baseTempC);
  const meanThermalTempC = (effectiveMaxC + effectiveMinC) / 2;
  const dailyGdd = Math.max(0.5, meanThermalTempC - spec.baseTempC);

  const accumulatedGdd =
    params.accumulatedGddOverride !== undefined
      ? Math.max(0, Number(params.accumulatedGddOverride))
      : roundTo(dailyGdd * daysSinceBiofix, 1);

  const activeStage =
    spec.instarGddThresholds.find(
      (st) => accumulatedGdd >= st.minGdd && accumulatedGdd <= st.maxGdd
    ) || spec.instarGddThresholds[spec.instarGddThresholds.length - 1];

  const generationCompletionPct = clamp(
    roundTo((accumulatedGdd / spec.eggToAdultGdd) * 100, 1),
    1,
    100
  );

  // Estimate days remaining before L5-L6 cryptic boring (256 GDD for FAW)
  const crypticThresholdGdd = 250;
  const remainingSprayWindowDays =
    accumulatedGdd >= crypticThresholdGdd
      ? 0
      : Math.max(1, Math.ceil((crypticThresholdGdd - accumulatedGdd) / dailyGdd));

  return {
    pestKey: spec.pestKey,
    commonName: spec.commonName,
    scientificName: spec.scientificName,
    baseTempC: spec.baseTempC,
    upperCutoffTempC: spec.upperCutoffTempC,
    dailyGdd: roundTo(dailyGdd, 2),
    accumulatedGdd: roundTo(accumulatedGdd, 1),
    eggToAdultGdd: spec.eggToAdultGdd,
    generationCompletionPct,
    activeStageCode: activeStage.stageCode,
    activeStageLabel: activeStage.label,
    biocontrolSusceptibility: activeStage.biocontrolSusceptibility,
    remainingSprayWindowDays,
    optimalBiocontrolWindowOpen: activeStage.biocontrolSusceptibility >= 0.75,
  };
}

/**
 * Computes Pedigo et al. (1986) Economic Injury Level (EIL) and Economic Threshold (ET),
 * comparing Biocontrol IPM vs. Synthetic Chemical intervention benefit-cost ratios.
 *
 * Equation:
 *   EIL (% infested plants) = C / (V * I * D * K)
 * where:
 *   C = Control cost per hectare (NGN/ha)
 *   V = Market value per metric ton of produce * expected yield (NGN/ha potential value)
 *   I = Injury units per % pest incidence
 *   D = Proportional yield loss per unit injury
 *   K = Proportional reduction in pest attack achieved by control measure (0..1)
 */
function calculatePedigoEconomicInjuryLevel(params = {}) {
  const pestKey = String(params.pestKey || 'FALL_ARMYWORM').toUpperCase();
  const spec = PEST_ENTOMOLOGY_CATALOG[pestKey] || PEST_ENTOMOLOGY_CATALOG.FALL_ARMYWORM;

  const observedIncidencePct = clamp(Number(params.observedIncidencePct ?? 26.0), 0, 100);
  const davisDamageScale = clamp(Math.round(Number(params.davisDamageScale ?? 4)), 1, 9);
  const expectedYieldTonsHa = Math.max(0.5, Number(params.expectedYieldTonsHa ?? 4.5));
  const cropPriceNgnPerTon = Math.max(50000, Number(params.cropPriceNgnPerTon ?? 685000));
  const controlCostNgnPerHa = Math.max(
    5000,
    Number(params.controlCostNgnPerHa ?? spec.defaultBiocontrolCostNgnHa)
  );
  const controlEfficacyK = clamp(Number(params.controlEfficacyK ?? 0.84), 0.35, 0.99);

  const grossCropValuePerHaNgn = expectedYieldTonsHa * cropPriceNgnPerTon;

  // Yield loss slope per 1% infested plants = I * D * (1 - physiologicalCanopyCompensation)
  // Healthy tropical crops compensate for ~78% of early foliar feeding
  const physiologicalNetDamageFactor = 0.22;
  const fractionalLossPerPctIncidence =
    spec.injuryPerUnitPestI * spec.damagePerUnitInjuryD * physiologicalNetDamageFactor;

  const rawEilPct =
    controlCostNgnPerHa /
    (grossCropValuePerHaNgn * fractionalLossPerPctIncidence * controlEfficacyK);

  const economicInjuryLevelPct = clamp(roundTo(rawEilPct, 2), 2.5, 65.0);
  const economicThresholdPct = roundTo(economicInjuryLevelPct * 0.75, 2);

  // Compute expected yield loss if left untreated vs. treated
  const untreatedYieldLossFraction = clamp(
    observedIncidencePct * fractionalLossPerPctIncidence * (1 + (davisDamageScale - 1) * 0.08),
    0,
    0.85
  );
  const untreatedRevenueLossNgnHa = Math.round(
    grossCropValuePerHaNgn * untreatedYieldLossFraction
  );
  const preventedRevenueLossNgnHa = Math.round(
    untreatedRevenueLossNgnHa * controlEfficacyK
  );
  const netEconomicBenefitNgnHa = preventedRevenueLossNgnHa - controlCostNgnPerHa;
  const benefitCostRatio = roundTo(
    preventedRevenueLossNgnHa / Math.max(1, controlCostNgnPerHa),
    2
  );

  let actionDecision = 'CONTINUE_WEEKLY_W_SCOUTING';
  if (observedIncidencePct >= economicInjuryLevelPct || davisDamageScale >= 6) {
    actionDecision = 'IMMEDIATE_IPM_AND_TARGETED_KNOCKDOWN';
  } else if (observedIncidencePct >= economicThresholdPct || davisDamageScale >= 4) {
    actionDecision = 'EXECUTE_BIOCONTROL_RELEASE_NOW';
  }

  return {
    pestKey: spec.pestKey,
    commonName: spec.commonName,
    observedIncidencePct: roundTo(observedIncidencePct, 1),
    davisDamageScale,
    economicInjuryLevelPct,
    economicThresholdPct,
    exceedsEconomicThreshold: observedIncidencePct >= economicThresholdPct,
    exceedsEconomicInjuryLevel: observedIncidencePct >= economicInjuryLevelPct,
    actionDecision,
    grossCropValuePerHaNgn: Math.round(grossCropValuePerHaNgn),
    controlCostNgnPerHa: Math.round(controlCostNgnPerHa),
    untreatedRevenueLossNgnHa,
    preventedRevenueLossNgnHa,
    netEconomicBenefitNgnHa,
    benefitCostRatio,
    recommendedBiocontrolAgents: spec.biocontrolAgents,
    recommendedIracRotations: spec.iracRotationOptions,
  };
}

module.exports = {
  PEST_ENTOMOLOGY_CATALOG,
  evaluatePestDegreeDayPhenology,
  calculatePedigoEconomicInjuryLevel,
};
