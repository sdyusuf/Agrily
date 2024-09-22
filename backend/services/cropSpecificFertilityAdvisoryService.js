/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - CROP-SPECIFIC FERTILITY ADVISORY SERVICE
 * ==============================================================================
 * 
 * Architecture Overview:
 * Phenological stage-by-stage macro and micronutrient uptake partitioning,
 * visual deficiency symptom diagnostics (interveinal chlorosis, blossom-end rot,
 * anthocyanin purpling, marginal necrosis), and emergency foliar chelate rescue
 * protocol formulator for the 10 core Nigerian food security staples.
 * 
 * Mathematical Formulation:
 * 1. Stage-Specific Nutrient Partitioning:
 *    N_{req}(stage) = N_{total\_removal}(Y) \times \Phi_{N}(stage)
 *    where $\Phi_N(stage)$ represents the stage fraction of total crop uptake.
 * 
 * 2. Visual Symptom Diagnoser:
 *    Calculates matching affinity $S_d = \frac{\sum w_i \cdot \mathbb{I}(s_i \in obs)}{\sum w_i}$
 *    for mobile vs immobile nutrient transport pathways in plant phloem.
 * 
 * 3. Foliar Chelate Rescue Dosage:
 *    Dose_{total} = \text{Acreage} \times \text{Rate}_{per\_ha} \times \text{Dilution}_{factor}
 * 
 * @module services/cropSpecificFertilityAdvisoryService
 * @version 1.0.0
 * @author Agrily Agronomy Core Team
 */

'use strict';

/**
 * Stage-by-stage nutrient partition curves for the 10 Nigerian food security staples
 */
const CROP_PHENOLOGY_NUTRIENT_CURVES = Object.freeze({
  MAIZE: {
    cropName: 'Zea mays (Maize / Corn)',
    lifeCycleDays: 110,
    stages: [
      {
        stageKey: 'VEGETATIVE_EARLY',
        stageName: 'Seedling to V4 (Early Vegetative)',
        daysRange: [0, 20],
        partitionPct: { N: 10, P2O5: 8, K2O: 12, S: 8, Zn: 10 },
        criticalVulnerabilities: ['Zinc deficiency', 'Phosphorus early root stunt'],
        advisory: 'Basal placement of NPK 15-15-15 + Zinc near seed furrows ensures robust seedling vigor.'
      },
      {
        stageKey: 'RAPID_VEGETATIVE',
        stageName: 'V6 to V12 (Knee-high to Rapid Elongation)',
        daysRange: [21, 45],
        partitionPct: { N: 45, P2O5: 35, K2O: 45, S: 35, Zn: 40 },
        criticalVulnerabilities: ['Nitrogen chlorosis', 'Potassium marginal firing'],
        advisory: 'First split top-dressing of Urea (46-0-0) applied 5-7 cm from plant base before weeding.'
      },
      {
        stageKey: 'TASSELING_SILKING',
        stageName: 'VT to R1 (Tasseling and Pollination)',
        daysRange: [46, 70],
        partitionPct: { N: 30, P2O5: 35, K2O: 30, S: 35, Zn: 35 },
        criticalVulnerabilities: ['Boron poor kernel set', 'Nitrogen cannibalization'],
        advisory: 'Peak water and nutrient uptake. Second split urea top-dress if split-application is practiced.'
      },
      {
        stageKey: 'GRAIN_FILLING_MATURATION',
        stageName: 'R2 to R6 (Blister, Dough, Black Layer Maturation)',
        daysRange: [71, 110],
        partitionPct: { N: 15, P2O5: 22, K2O: 13, S: 22, Zn: 15 },
        criticalVulnerabilities: ['Premature stalk lodging', 'Tip-abort from stress'],
        advisory: 'Nutrients translocated from stalks to cobs. Maintain weed-free stand.'
      }
    ]
  },
  RICE: {
    cropName: 'Oryza sativa (Lowland / Upland Rice)',
    lifeCycleDays: 125,
    stages: [
      {
        stageKey: 'TRANSPLANT_EARLY_TILLERING',
        stageName: 'Establishment & Active Tillering',
        daysRange: [0, 30],
        partitionPct: { N: 25, P2O5: 35, K2O: 20, S: 25, Zn: 40 },
        criticalVulnerabilities: ['Zinc deficiency (Khaira disease)', 'Phosphorus cold stunt'],
        advisory: 'Incorporate basal NPK and zinc sulfate prior to puddling or transplanting.'
      },
      {
        stageKey: 'PANICLE_INITIATION',
        stageName: 'Maximum Tillering to Panicle Primordium',
        daysRange: [31, 65],
        partitionPct: { N: 45, P2O5: 35, K2O: 45, S: 45, Zn: 35 },
        criticalVulnerabilities: ['Nitrogen spike required', 'Potassium blast resistance'],
        advisory: 'Apply mid-season urea top-dressing into 2-3 cm standing water film.'
      },
      {
        stageKey: 'BOOTING_HEADING',
        stageName: 'Booting to 50% Flowering',
        daysRange: [66, 90],
        partitionPct: { N: 20, P2O5: 20, K2O: 25, S: 20, Zn: 15 },
        criticalVulnerabilities: ['Grain sterility from Boron/Zinc shortage'],
        advisory: 'Foliar spray of micronutrients if deficiency symptoms were detected in vegetative flush.'
      },
      {
        stageKey: 'RIPENING',
        stageName: 'Milky to Dough and Hard Grain Ripening',
        daysRange: [91, 125],
        partitionPct: { N: 10, P2O5: 10, K2O: 10, S: 10, Zn: 10 },
        criticalVulnerabilities: ['Lodging under panicle weight'],
        advisory: 'Drain paddy 10-14 days before harvest to promote uniform golden ripening.'
      }
    ]
  },
  CASSAVA: {
    cropName: 'Manihot esculenta (Cassava)',
    lifeCycleDays: 330,
    stages: [
      {
        stageKey: 'SPROUT_ESTABLISHMENT',
        stageName: 'Cutting Sprouting to Canopy Establishment',
        daysRange: [0, 60],
        partitionPct: { N: 20, P2O5: 30, K2O: 15, S: 15, Zn: 25 },
        criticalVulnerabilities: ['Root knot damage', 'Phosphorus early rooting stunt'],
        advisory: 'Basal placement of NPK 12-12-17 + 2MgO compound around cuttings at planting.'
      },
      {
        stageKey: 'TUBER_INITIATION',
        stageName: 'Fibrous Root Tuberization & Storage Root Bulking',
        daysRange: [61, 150],
        partitionPct: { N: 40, P2O5: 40, K2O: 50, S: 45, Zn: 45 },
        criticalVulnerabilities: ['Potassium starvation reducing starch synthase'],
        advisory: 'High potash top-dressing (MOP 0-0-60 or NPK 12-12-17) ring-applied during second weeding.'
      },
      {
        stageKey: 'STORAGE_BULKING_STAGE',
        stageName: 'Active Root Bulking & Starch Accumulation',
        daysRange: [151, 270],
        partitionPct: { N: 30, P2O5: 20, K2O: 30, S: 30, Zn: 20 },
        criticalVulnerabilities: ['Excessive nitrogen leading to vegetative leafy overgrowth at tuber expense'],
        advisory: 'Avoid nitrogenous top-dress; rely on residual soil fertility and potassium translocation.'
      },
      {
        stageKey: 'DORMANCY_MATURITY',
        stageName: 'Leaf Shedding & Final Starch Condensation',
        daysRange: [271, 330],
        partitionPct: { N: 10, P2O5: 10, K2O: 5, S: 10, Zn: 10 },
        criticalVulnerabilities: ['Post-harvest deterioration if unharvested past physiological peak'],
        advisory: 'Harvest tubers cleanly when starch density reaches commercial maturity.'
      }
    ]
  },
  YAM: {
    cropName: 'Dioscorea rotundata (White Guinea Yam)',
    lifeCycleDays: 240,
    stages: [
      {
        stageKey: 'SETT_SPROUTING',
        stageName: 'Sett Emergence & Vine Wandering',
        daysRange: [0, 60],
        partitionPct: { N: 15, P2O5: 30, K2O: 15, S: 15, Zn: 20 },
        criticalVulnerabilities: ['Sett rot', 'Nematode galling'],
        advisory: 'Apply well-cured organic compost in planting mounds and basal NPK band 15 cm from mound crest.'
      },
      {
        stageKey: 'CANOPY_DEVELOPMENT',
        stageName: 'Full Staking & Foliage Expansion',
        daysRange: [61, 120],
        partitionPct: { N: 50, P2O5: 35, K2O: 40, S: 45, Zn: 45 },
        criticalVulnerabilities: ['Yam anthracnose', 'Magnesium deficiency on older leaves'],
        advisory: 'Apply split NPK 15-15-15 + Magnesium Sulfate into mound shoulders.'
      },
      {
        stageKey: 'TUBER_BULKING',
        stageName: 'Primary Tuber Expansion & Starch Translocation',
        daysRange: [121, 180],
        partitionPct: { N: 25, P2O5: 25, K2O: 40, S: 30, Zn: 25 },
        criticalVulnerabilities: ['Potassium deficiency resulting in small fibrous tubers'],
        advisory: 'Supplement with MOP (0-0-60) to drive glucose condensation into yam starch.'
      },
      {
        stageKey: 'SENESCENCE_MATURITY',
        stageName: 'Vine Dieback & Corky Periderm Formation',
        daysRange: [181, 240],
        partitionPct: { N: 10, P2O5: 10, K2O: 5, S: 10, Zn: 10 },
        criticalVulnerabilities: ['Sun scorch of exposed tuber heads'],
        advisory: 'Cap mounds with straw mulch to prevent sun-bake before lifting.'
      }
    ]
  },
  TOMATO: {
    cropName: 'Solanum lycopersicum (Fresh Tomato)',
    lifeCycleDays: 95,
    stages: [
      {
        stageKey: 'NURSERY_TRANSPLANT',
        stageName: 'Nursery to Field Transplant Recovery',
        daysRange: [0, 20],
        partitionPct: { N: 15, P2O5: 25, K2O: 10, S: 15, Zn: 25 },
        criticalVulnerabilities: ['Damping off', 'Phosphorus purple stunting'],
        advisory: 'Drench transplant roots with Soluble High-P starter solution + Trichoderma.'
      },
      {
        stageKey: 'FLOWERING_FIRST_FRUIT',
        stageName: 'Rapid Branching & First Fruit Cluster Set',
        daysRange: [21, 45],
        partitionPct: { N: 35, P2O5: 35, K2O: 40, S: 35, Zn: 35 },
        criticalVulnerabilities: ['Calcium deficiency blossom-end rot', 'Boron flower drop'],
        advisory: 'Side-dress with Calcium Nitrate (15.5-0-0 + 19% Ca) and spray Solubor (0.1%).'
      },
      {
        stageKey: 'FRUIT_BULKING_COLORING',
        stageName: 'Peak Fruit Sizing & Breaker Color Turn',
        daysRange: [46, 75],
        partitionPct: { N: 35, P2O5: 25, K2O: 40, S: 35, Zn: 25 },
        criticalVulnerabilities: ['Potassium yellow shoulder / greenback', 'Magnesium interveinal chlorosis'],
        advisory: 'Fertigate or foliar feed Potassium Nitrate (13-0-45) weekly to enhance brix and firmness.'
      },
      {
        stageKey: 'HARVEST_FLUSH',
        stageName: 'Continuous Harvest & Final Pickings',
        daysRange: [76, 95],
        partitionPct: { N: 15, P2O5: 15, K2O: 10, S: 15, Zn: 15 },
        criticalVulnerabilities: ['Premature vine collapse'],
        advisory: 'Maintain steady drip moisture to avoid fruit cracking during hot harvest flushes.'
      }
    ]
  },
  SORGHUM: {
    cropName: 'Sorghum bicolor (Guinea Corn)',
    lifeCycleDays: 120,
    stages: [
      {
        stageKey: 'SEEDLING_ESTABLISHMENT',
        stageName: 'Emergence to 5-Leaf Stage',
        daysRange: [0, 25],
        partitionPct: { N: 15, P2O5: 25, K2O: 15, S: 15, Zn: 25 },
        criticalVulnerabilities: ['Shoot fly', 'Phosphorus seedling stunt'],
        advisory: 'Apply basal NPK 15-15-15 in planting pocket.'
      },
      {
        stageKey: 'RAPID_GROWTH_BOOTING',
        stageName: 'Stem Elongation to Flag Leaf / Boot',
        daysRange: [26, 60],
        partitionPct: { N: 50, P2O5: 45, K2O: 45, S: 45, Zn: 45 },
        criticalVulnerabilities: ['Nitrogen leaf firing', 'Striga parasitism under low N'],
        advisory: 'Split side-dress Urea at 30 days after sowing before booting.'
      },
      {
        stageKey: 'HEADING_GRAIN_FILL',
        stageName: 'Panicle Exsertion to Hard Dough',
        daysRange: [61, 95],
        partitionPct: { N: 25, P2O5: 20, K2O: 30, S: 30, Zn: 20 },
        criticalVulnerabilities: ['Grain mold under late rains'],
        advisory: 'Ensure optimal potassium balance to reinforce stalk rigidity against wind lodging.'
      },
      {
        stageKey: 'PHYSIOLOGICAL_MATURITY',
        stageName: 'Black Layer & Panicle Drying',
        daysRange: [96, 120],
        partitionPct: { N: 10, P2O5: 10, K2O: 10, S: 10, Zn: 10 },
        criticalVulnerabilities: ['Bird damage'],
        advisory: 'Scout for black layer at base of grains and plan mechanical or manual harvest.'
      }
    ]
  },
  COWPEA: {
    cropName: 'Vigna unguiculata (Cowpea / Beans)',
    lifeCycleDays: 75,
    stages: [
      {
        stageKey: 'VEGETATIVE_NODULATION',
        stageName: 'Emergence to Active N2 Fixation',
        daysRange: [0, 20],
        partitionPct: { N: 15, P2O5: 35, K2O: 20, S: 25, Zn: 30 },
        criticalVulnerabilities: ['Phosphorus deficiency starving Rhizobia nodules', 'Molybdenum deficiency'],
        advisory: 'Apply Single Superphosphate (SSP 0-18-0) to fuel nodulation. Avoid high nitrogen.'
      },
      {
        stageKey: 'FLOWERING_POD_FORMATION',
        stageName: 'Floral Bud Induction to Pod Setting',
        daysRange: [21, 45],
        partitionPct: { N: 55, P2O5: 45, K2O: 50, S: 45, Zn: 45 },
        criticalVulnerabilities: ['Boron flower abortion', 'Maruca pod borer damage'],
        advisory: 'Foliar spray with Boron + Zinc chelate at flower onset to maximize flower retention.'
      },
      {
        stageKey: 'POD_FILLING_DRYING',
        stageName: 'Pod Expansion to Desiccation',
        daysRange: [46, 75],
        partitionPct: { N: 30, P2O5: 20, K2O: 30, S: 30, Zn: 25 },
        criticalVulnerabilities: ['Premature pod shattering'],
        advisory: 'Harvest dry pods promptly in early morning to prevent shattering losses.'
      }
    ]
  },
  SOYBEAN: {
    cropName: 'Glycine max (Soybean)',
    lifeCycleDays: 100,
    stages: [
      {
        stageKey: 'EMERGENCE_VEGETATIVE',
        stageName: 'VE to V4 Vegetative Growth',
        daysRange: [0, 25],
        partitionPct: { N: 15, P2O5: 30, K2O: 20, S: 25, Zn: 30 },
        criticalVulnerabilities: ['Failed nodulation on virgin soils'],
        advisory: 'Inoculate seed with Bradyrhizobium japonicum and apply basal SSP.'
      },
      {
        stageKey: 'R1_R3_FLOWERING_POD_SET',
        stageName: 'Beginning Bloom to Pod Development',
        daysRange: [26, 60],
        partitionPct: { N: 50, P2O5: 45, K2O: 45, S: 45, Zn: 45 },
        criticalVulnerabilities: ['Potassium deficiency marginal yellowing'],
        advisory: 'Ensure adequate soil moisture and sulfur supply for high protein synthesis.'
      },
      {
        stageKey: 'R4_R6_POD_BULKING',
        stageName: 'Full Pod Sizing to Seed Fill',
        daysRange: [61, 85],
        partitionPct: { N: 25, P2O5: 20, K2O: 25, S: 20, Zn: 15 },
        criticalVulnerabilities: ['Rust infection under humid conditions'],
        advisory: 'Translocation of leaf proteins into beans. Scout pod pests.'
      },
      {
        stageKey: 'R7_R8_MATURATION',
        stageName: 'Leaf Yellowing, Defoliation & Pod Drying',
        daysRange: [86, 100],
        partitionPct: { N: 10, P2O5: 5, K2O: 10, S: 10, Zn: 10 },
        criticalVulnerabilities: ['Pod shattering if field drying exceeds 13% moisture'],
        advisory: 'Harvest when 95% of pods turn mature brown.'
      }
    ]
  },
  MILLET: {
    cropName: 'Pennisetum glaucum (Pearl Millet)',
    lifeCycleDays: 85,
    stages: [
      {
        stageKey: 'EMERGENCE_TILLERING',
        stageName: 'Germination & Basal Tillering',
        daysRange: [0, 20],
        partitionPct: { N: 20, P2O5: 30, K2O: 20, S: 20, Zn: 30 },
        criticalVulnerabilities: ['Sand burial by Harmattan dust storms'],
        advisory: 'Micro-dose NPK 15-15-15 (6g per planting hill) at planting or thinning.'
      },
      {
        stageKey: 'STEM_ELONGATION_BOOTING',
        stageName: 'Culm Elongation to Panicle Emergence',
        daysRange: [21, 50],
        partitionPct: { N: 55, P2O5: 45, K2O: 50, S: 50, Zn: 45 },
        criticalVulnerabilities: ['Severe nitrogen deficiency on sandy arenosols'],
        advisory: 'Top-dress with small pinch of Urea (3g per hill) after first weeding.'
      },
      {
        stageKey: 'PANICLE_GRAIN_FILL',
        stageName: 'Flowering & Grain Bulking',
        daysRange: [51, 75],
        partitionPct: { N: 20, P2O5: 20, K2O: 25, S: 25, Zn: 20 },
        criticalVulnerabilities: ['Drought terminal stress'],
        advisory: 'Stall tillers to channel moisture and assimilates into primary candle head.'
      },
      {
        stageKey: 'MATURATION',
        stageName: 'Desiccation & Harvest',
        daysRange: [76, 85],
        partitionPct: { N: 5, P2O5: 5, K2O: 5, S: 5, Zn: 5 },
        criticalVulnerabilities: ['Bird predation on standing candles'],
        advisory: 'Cut heads and dry on raised platforms to avoid ground insect damage.'
      }
    ]
  },
  GROUNDNUT: {
    cropName: 'Arachis hypogaea (Groundnut / Peanut)',
    lifeCycleDays: 110,
    stages: [
      {
        stageKey: 'VEGETATIVE_EMERGENCE',
        stageName: 'Emergence to Lateral Branching',
        daysRange: [0, 25],
        partitionPct: { N: 15, P2O5: 30, K2O: 20, S: 25, Zn: 25 },
        criticalVulnerabilities: ['Phosphorus deficiency limiting root tap growth'],
        advisory: 'Apply basal Single Superphosphate (SSP) to supply both P and vital calcium/sulfur.'
      },
      {
        stageKey: 'FLOWERING_PEGGING',
        stageName: 'Bloom to Geotropic Peg Penetration into Soil',
        daysRange: [26, 55],
        partitionPct: { N: 45, P2O5: 45, K2O: 45, S: 45, Zn: 50 },
        criticalVulnerabilities: ['Calcium deficiency causing "pops" (empty pods)'],
        advisory: 'Top-dress agricultural Gypsum (CaSO4) directly over pegging zone at peak flowering.'
      },
      {
        stageKey: 'POD_FILLING_KERNEL_DEVELOPMENT',
        stageName: 'Subterranean Pod Expansion & Oil Accumulation',
        daysRange: [56, 90],
        partitionPct: { N: 30, P2O5: 20, K2O: 30, S: 25, Zn: 20 },
        criticalVulnerabilities: ['Boron hollow heart defect in kernels'],
        advisory: 'Foliar spray of 0.1% Boron chelate if soils are known to be boron deficient.'
      },
      {
        stageKey: 'MATURATION_LIFTING',
        stageName: 'Foliage Yellowing & Physiological Shell Darkening',
        daysRange: [91, 110],
        partitionPct: { N: 10, P2O5: 5, K2O: 5, S: 5, Zn: 5 },
        criticalVulnerabilities: ['Aflatoxin accumulation if lifted in damp weather'],
        advisory: 'Lift plants cleanly, shake free of soil, and invert pods to sun-dry quickly.'
      }
    ]
  }
});

/**
 * Visual Symptom Pathology Diagnostic Catalog
 */
const VISUAL_DEFICIENCY_SYMPTOM_CATALOG = Object.freeze({
  NITROGEN_DEFICIENCY: {
    element: 'N',
    elementName: 'Nitrogen',
    mobilityInPlant: 'HIGHLY_MOBILE',
    affectedLeaves: 'OLDER_LOWER_LEAVES_FIRST',
    primarySymptoms: [
      'V-shaped chlorosis (yellowing) starting at tip of oldest lower leaves progressing down midrib',
      'Stunted spindly stems and pale yellowish-green entire canopy',
      'Premature senescence and firing of basal foliage'
    ],
    distinguishingMarks: 'Chlorosis strictly begins on the lower older foliage because nitrogen is mobilized to feed younger expanding leaves.',
    rescueProtocol: {
      type: 'SOIL_OR_FOLIAR',
      product: 'Low-Biuret Soluble Urea (Foliar) or CAN (Soil Side-dress)',
      dilutionConcentration: '1.5% to 2.0% w/v foliar solution (15-20g / L water)',
      applicationRatePerHaKg: 20.0,
      safetyIntervalHours: 48,
      guidelines: 'Spray in cool early morning or late dusk to prevent leaf scorch. Add non-ionic wetting agent.'
    }
  },
  PHOSPHORUS_DEFICIENCY: {
    element: 'P',
    elementName: 'Phosphorus',
    mobilityInPlant: 'MOBILE',
    affectedLeaves: 'OLDER_LOWER_LEAVES_FIRST',
    primarySymptoms: [
      'Intense reddish-purple anthocyanin coloration on lower leaf margins and leaf sheaths',
      'Severe root development stunting and delayed flowering',
      'Erect, stiff, dark green leaves with purplish veins'
    ],
    distinguishingMarks: 'Anthocyanin pigment accumulation due to impeded sugar translocation in vascular bundles.',
    rescueProtocol: {
      type: 'FOLIAR_CHELATE',
      product: 'Mono-Potassium Phosphate (MKP 0-52-34)',
      dilutionConcentration: '1.0% w/v (10g / L water)',
      applicationRatePerHaKg: 8.0,
      safetyIntervalHours: 24,
      guidelines: 'Provides rapidly absorbed orthophosphate anions directly through leaf cuticle.'
    }
  },
  POTASSIUM_DEFICIENCY: {
    element: 'K',
    elementName: 'Potassium',
    mobilityInPlant: 'HIGHLY_MOBILE',
    affectedLeaves: 'OLDER_LOWER_LEAVES_FIRST',
    primarySymptoms: [
      'Marginal chlorosis quickly turning into necrotic scorched leaf edges on older leaves',
      'Weak stalks highly prone to wind lodging and brittle stems',
      'Small, pinched grain kernels and poor tuber starch bulking'
    ],
    distinguishingMarks: 'Distinct "fired" or burnt leaf margins while the center of the leaf remains green.',
    rescueProtocol: {
      type: 'FOLIAR_OR_SOIL',
      product: 'Potassium Sulfate (SOP 0-0-50 + 18% S) or Potassium Nitrate',
      dilutionConcentration: '1.5% w/v (15g / L water)',
      applicationRatePerHaKg: 15.0,
      safetyIntervalHours: 24,
      guidelines: 'Avoid high-chloride MOP on chloride-sensitive crops like tomato during foliar application.'
    }
  },
  CALCIUM_DEFICIENCY: {
    element: 'Ca',
    elementName: 'Calcium',
    mobilityInPlant: 'IMMOBILE',
    affectedLeaves: 'YOUNGEST_UPPER_LEAVES_AND_FRUITS',
    primarySymptoms: [
      'Blossom-end rot (sunken water-soaked leathery black spot on tomato/pepper fruit bases)',
      'Hooked, distorted young leaves with necrotic tips ("cupping")',
      'Bud and growing point death ("dieback")'
    ],
    distinguishingMarks: 'Occurs exclusively in growing points and developing fruits because calcium moves strictly with transpiration stream.',
    rescueProtocol: {
      type: 'TARGETED_FOLIAR_WASH',
      product: 'Calcium Chloride (CaCl2) or Chelated Calcium EDTA',
      dilutionConcentration: '0.5% w/v (5g / L water) or 250ml chelate / 100L',
      applicationRatePerHaKg: 5.0,
      safetyIntervalHours: 12,
      guidelines: 'Direct spray at developing fruit clusters and young shoot tips. Maintain steady soil irrigation.'
    }
  },
  MAGNESIUM_DEFICIENCY: {
    element: 'Mg',
    elementName: 'Magnesium',
    mobilityInPlant: 'MOBILE',
    affectedLeaves: 'OLDER_LOWER_LEAVES_FIRST',
    primarySymptoms: [
      'Interveinal chlorosis where veins remain prominently green while tissue between veins turns yellow, orange, or bronze',
      'In brassicas and cotton, leaves develop striking reddish-purple interveinal tinting',
      'Upward curling of leaf margins'
    ],
    distinguishingMarks: 'Classic herringbone pattern on mature leaves; green veins contrasting with bleached interveinal tissue.',
    rescueProtocol: {
      type: 'FOLIAR_CHELATE',
      product: 'Magnesium Sulfate Heptahydrate (Epsom Salt, 16% MgO, 13% S)',
      dilutionConcentration: '2.0% w/v (20g / L water)',
      applicationRatePerHaKg: 12.0,
      safetyIntervalHours: 24,
      guidelines: 'Rapid greening occurs within 3-5 days after application.'
    }
  },
  SULFUR_DEFICIENCY: {
    element: 'S',
    elementName: 'Sulfur',
    mobilityInPlant: 'MODERATELY_IMMOBILE',
    affectedLeaves: 'YOUNGEST_UPPER_LEAVES_FIRST',
    primarySymptoms: [
      'Uniform pale yellow chlorosis of young upper leaves while older leaves remain green',
      'Stunted growth with thin woody stems',
      'Delayed maturity and reduced protein/oil content in legumes and oilseeds'
    ],
    distinguishingMarks: 'Easily confused with nitrogen deficiency, but sulfur chlorosis manifests on YOUNG leaves first.',
    rescueProtocol: {
      type: 'SOIL_OR_FOLIAR',
      product: 'Ammonium Sulfate or Micronized Elemental Sulfur / MgSO4',
      dilutionConcentration: '1.0% w/v (10g / L water)',
      applicationRatePerHaKg: 10.0,
      safetyIntervalHours: 24,
      guidelines: 'Sulfur is essential for methionine and cysteine synthesis.'
    }
  },
  ZINC_DEFICIENCY: {
    element: 'Zn',
    elementName: 'Zinc',
    mobilityInPlant: 'MODERATELY_IMMOBILE',
    affectedLeaves: 'YOUNG_AND_MIDDLE_CANOPY_LEAVES',
    primarySymptoms: [
      'Broad white or bleached bands on either side of the midrib in maize ("white bud")',
      'Little leaf or rosetting caused by failure of internodes to elongate',
      'Interveinal chlorosis with small mottled necrotic spots ("bronzing") in rice ("Khaira")'
    ],
    distinguishingMarks: 'Distinct bleached band in maize between leaf edge and midrib; shortened internodes.',
    rescueProtocol: {
      type: 'CHELATED_FOLIAR_SPRAY',
      product: 'Zinc EDTA Chelate (14% Zn) or Zinc Sulfate Monohydrate (35% Zn)',
      dilutionConcentration: '0.2% w/v EDTA (2g / L) or 0.5% ZnSO4 + 0.25% Lime buffer',
      applicationRatePerHaKg: 2.5,
      safetyIntervalHours: 48,
      guidelines: 'Apply at 3-4 leaf stage or early tillering. Highly effective in alkaline or sandy soils.'
    }
  },
  BORON_DEFICIENCY: {
    element: 'B',
    elementName: 'Boron',
    mobilityInPlant: 'IMMOBILE',
    affectedLeaves: 'GROWING_POINTS_FLOWERS_AND_ROOTS',
    primarySymptoms: [
      'Severe flower abortion and failure of fruit/pod set',
      'Hollow heart in groundnut kernels and internal brown corky spotting in tubers',
      'Thickened, brittle, curled leaves with cracking stems'
    ],
    distinguishingMarks: 'Critical failure of reproductive biology, pollen tube germination, and cell wall cross-linking.',
    rescueProtocol: {
      type: 'PRECISION_FOLIAR_SPRAY',
      product: 'Disodium Octaborate Tetrahydrate (Solubor 20.5% B) or Boric Acid',
      dilutionConcentration: '0.1% w/v (1.0g / L water)',
      applicationRatePerHaKg: 1.2,
      safetyIntervalHours: 72,
      guidelines: 'Exercise extreme precision! Narrow margin between boron deficiency and toxicity.'
    }
  }
});

/**
 * Crop Nutrient Removal Benchmarks per Metric Ton of Economic Yield
 */
const CROP_REMOVAL_FACTORS = Object.freeze({
  MAIZE: { unit: 'kg/ton grain', N: 22.0, P2O5: 9.0, K2O: 20.0, S: 3.5, Zn: 0.05, B: 0.02 },
  RICE: { unit: 'kg/ton grain', N: 20.0, P2O5: 8.5, K2O: 24.0, S: 3.0, Zn: 0.08, B: 0.015 },
  CASSAVA: { unit: 'kg/ton fresh tuber', N: 4.8, P2O5: 1.8, K2O: 7.2, S: 0.8, Zn: 0.012, B: 0.005 },
  YAM: { unit: 'kg/ton fresh tuber', N: 5.5, P2O5: 2.1, K2O: 8.5, S: 0.9, Zn: 0.015, B: 0.008 },
  TOMATO: { unit: 'kg/ton fresh fruit', N: 2.8, P2O5: 0.8, K2O: 4.5, S: 0.6, Zn: 0.008, B: 0.006 },
  SORGHUM: { unit: 'kg/ton grain', N: 21.0, P2O5: 8.0, K2O: 18.0, S: 3.0, Zn: 0.04, B: 0.018 },
  COWPEA: { unit: 'kg/ton dry seed', N: 35.0, P2O5: 9.5, K2O: 22.0, S: 4.0, Zn: 0.06, B: 0.025 },
  SOYBEAN: { unit: 'kg/ton dry seed', N: 60.0, P2O5: 14.0, K2O: 32.0, S: 5.5, Zn: 0.07, B: 0.03 },
  MILLET: { unit: 'kg/ton grain', N: 23.0, P2O5: 8.5, K2O: 19.0, S: 3.2, Zn: 0.05, B: 0.02 },
  GROUNDNUT: { unit: 'kg/ton pod', N: 42.0, P2O5: 9.0, K2O: 18.0, S: 4.5, Zn: 0.06, B: 0.028 }
});

class CropSpecificFertilityAdvisoryService {
  /**
   * Retrieves complete uptake and phenology curve for a crop
   * 
   * @param {string} crop - Crop identifier
   * @param {string} [stageKey] - Optional specific stage filter
   * @returns {Object} Phenology curve and stage recommendations
   */
  static getCropUptakeCurve(crop = 'MAIZE', stageKey = null) {
    const cropKey = crop.toUpperCase();
    const curve = CROP_PHENOLOGY_NUTRIENT_CURVES[cropKey];

    if (!curve) {
      throw new Error(`Unsupported crop: ${crop}. Must be one of: ${Object.keys(CROP_PHENOLOGY_NUTRIENT_CURVES).join(', ')}`);
    }

    if (stageKey) {
      const stage = curve.stages.find(s => s.stageKey.toUpperCase() === stageKey.toUpperCase());
      if (!stage) {
        throw new Error(`Stage "${stageKey}" not found for crop ${cropKey}. Valid stages: ${curve.stages.map(s => s.stageKey).join(', ')}`);
      }
      return {
        crop: cropKey,
        cropName: curve.cropName,
        lifeCycleDays: curve.lifeCycleDays,
        selectedStage: stage
      };
    }

    return {
      crop: cropKey,
      cropName: curve.cropName,
      lifeCycleDays: curve.lifeCycleDays,
      stages: curve.stages
    };
  }

  /**
   * Diagnoses visual plant deficiency symptoms using biological symptom heuristics
   * 
   * @param {string} crop - Target crop
   * @param {string[]} observedKeywords - Observed symptom keywords
   * @param {string} affectedCanopyPosition - 'LOWER_OLD', 'UPPER_YOUNG', 'FRUITS_BUDS'
   * @returns {Object} Ranked diagnostic match results with emergency foliar chelate protocols
   */
  static diagnoseDeficiencySymptom(crop = 'MAIZE', observedKeywords = [], affectedCanopyPosition = 'LOWER_OLD') {
    const cropKey = crop.toUpperCase();
    const matchedDiagnoses = [];

    const lowerKeywords = observedKeywords.map(k => k.toLowerCase());
    const canopyPosUpper = affectedCanopyPosition.toUpperCase();

    for (const [key, catalogEntry] of Object.entries(VISUAL_DEFICIENCY_SYMPTOM_CATALOG)) {
      let score = 0;

      // Canopy position match
      if (canopyPosUpper.includes('LOWER') || canopyPosUpper.includes('OLD')) {
        if (catalogEntry.affectedLeaves.includes('OLDER') || catalogEntry.mobilityInPlant === 'HIGHLY_MOBILE' || catalogEntry.mobilityInPlant === 'MOBILE') {
          score += 35;
        }
      } else if (canopyPosUpper.includes('UPPER') || canopyPosUpper.includes('YOUNG')) {
        if (catalogEntry.affectedLeaves.includes('YOUNG') || catalogEntry.mobilityInPlant === 'IMMOBILE' || catalogEntry.mobilityInPlant === 'MODERATELY_IMMOBILE') {
          score += 35;
        }
      } else if (canopyPosUpper.includes('FRUIT') || canopyPosUpper.includes('BUD') || canopyPosUpper.includes('GROWING')) {
        if (catalogEntry.affectedLeaves.includes('FRUIT') || catalogEntry.affectedLeaves.includes('GROWING')) {
          score += 40;
        }
      }

      // Keyword symptom matches
      const catalogText = [
        catalogEntry.elementName,
        ...catalogEntry.primarySymptoms,
        catalogEntry.distinguishingMarks
      ].join(' ').toLowerCase();

      for (const kw of lowerKeywords) {
        if (catalogText.includes(kw)) {
          score += 15;
        }
      }

      // Crop specific nuances
      if (cropKey === 'MAIZE' && key === 'ZINC_DEFICIENCY' && (catalogText.includes('white') || lowerKeywords.some(k => k.includes('white')))) {
        score += 20;
      }
      if (cropKey === 'TOMATO' && key === 'CALCIUM_DEFICIENCY' && (catalogText.includes('blossom') || lowerKeywords.some(k => k.includes('blossom') || k.includes('rot')))) {
        score += 25;
      }
      if (cropKey === 'GROUNDNUT' && key === 'CALCIUM_DEFICIENCY' && (lowerKeywords.some(k => k.includes('pop') || k.includes('empty')))) {
        score += 25;
      }

      const confidence = Math.min(100, Math.round(score));
      if (confidence >= 25) {
        matchedDiagnoses.push({
          deficiencyKey: key,
          element: catalogEntry.element,
          elementName: catalogEntry.elementName,
          confidencePct: confidence,
          mobilityInPlant: catalogEntry.mobilityInPlant,
          affectedLeaves: catalogEntry.affectedLeaves,
          primarySymptoms: catalogEntry.primarySymptoms,
          distinguishingMarks: catalogEntry.distinguishingMarks,
          rescueProtocol: catalogEntry.rescueProtocol
        });
      }
    }

    matchedDiagnoses.sort((a, b) => b.confidencePct - a.confidencePct);

    return {
      crop: cropKey,
      queryObservations: {
        keywords: observedKeywords,
        canopyPosition: affectedCanopyPosition
      },
      topDiagnosis: matchedDiagnoses[0] || null,
      allMatches: matchedDiagnoses
    };
  }

  /**
   * Formulates precision emergency foliar chelate prescription for field acreage
   * 
   * @param {string} crop - Target crop
   * @param {string[]} deficiencyKeys - Array of deficiency keys (e.g. ['ZINC_DEFICIENCY', 'MAGNESIUM_DEFICIENCY'])
   * @param {number} fieldAcreageHectares - Total field area in hectares (default: 1.0)
   * @returns {Object} Comprehensive procurement and spraying recipe
   */
  static formulateFoliarRescuePrescription(crop = 'MAIZE', deficiencyKeys = [], fieldAcreageHectares = 1.0) {
    const hectares = Math.max(0.1, Number(fieldAcreageHectares || 1.0));
    const items = [];

    for (const dKey of deficiencyKeys) {
      const entry = VISUAL_DEFICIENCY_SYMPTOM_CATALOG[dKey];
      if (entry && entry.rescueProtocol) {
        const proto = entry.rescueProtocol;
        const totalKg = Number((proto.applicationRatePerHaKg * hectares).toFixed(2));
        const waterVolumeLitres = Math.round(200 * hectares); // standard knapsack volume 200L/ha

        items.push({
          deficiency: dKey,
          targetElement: entry.elementName,
          chemicalProduct: proto.product,
          dilutionRate: proto.dilutionConcentration,
          totalChemicalProductRequiredKg: totalKg,
          sprayWaterVolumeLitres: waterVolumeLitres,
          safetyIntervalHours: proto.safetyIntervalHours,
          applicationTechnique: proto.guidelines
        });
      }
    }

    return {
      crop: crop.toUpperCase(),
      fieldAcreageHectares: hectares,
      recipeCount: items.length,
      prescriptionProtocols: items,
      sprayExecutionDirectives: {
        bestTimeToSpray: '06:30 - 09:30 or 16:30 - 18:30 (avoid hot midday sun exceeding 30°C)',
        dropletSpectrum: 'Medium to fine mist (150 - 250 µm) for maximum abaxial leaf stomatal absorption',
        tankMixCompatibility: 'Always perform jar test before mixing foliar fertilizers with systemic insecticides or fungicides.'
      }
    };
  }

  /**
   * Calculates total crop nutrient removal and replacement balance for targeted yield
   * 
   * @param {string} crop - Target crop
   * @param {number} targetedYieldTonsPerHa - Target harvest yield in metric tons per hectare
   * @param {number} [fieldAcreageHectares=1.0] - Area in hectares
   * @returns {Object} Mass balance elemental removal budget
   */
  static computeCriticalNutrientRemovalBalances(crop = 'MAIZE', targetedYieldTonsPerHa = 4.0, fieldAcreageHectares = 1.0) {
    const cropKey = crop.toUpperCase();
    const factors = CROP_REMOVAL_FACTORS[cropKey];

    if (!factors) {
      throw new Error(`Removal factors undefined for crop: ${crop}`);
    }

    const yieldTon = Math.max(0.1, Number(targetedYieldTonsPerHa || 1.0));
    const ha = Math.max(0.1, Number(fieldAcreageHectares || 1.0));

    const totalYieldTons = yieldTon * ha;

    const elementalBudget = {
      nitrogenKg: Number((factors.N * totalYieldTons).toFixed(2)),
      phosphateP2O5Kg: Number((factors.P2O5 * totalYieldTons).toFixed(2)),
      potashK2OKg: Number((factors.K2O * totalYieldTons).toFixed(2)),
      sulfurSKg: Number((factors.S * totalYieldTons).toFixed(2)),
      zincZnKg: Number((factors.Zn * totalYieldTons).toFixed(4)),
      boronBKg: Number((factors.B * totalYieldTons).toFixed(4))
    };

    return {
      crop: cropKey,
      targetedYieldPerHa: yieldTon,
      fieldAcreageHectares: ha,
      totalExpectedHarvestTons: totalYieldTons,
      harvestRemovalBasis: factors.unit,
      elementalRemovalBudget: elementalBudget,
      soilDepletionAdvisory: `To prevent multi-year soil mining, replenish at least ${elementalBudget.nitrogenKg} kg N, ${elementalBudget.phosphateP2O5Kg} kg P2O5, and ${elementalBudget.potashK2OKg} kg K2O through integrated commercial and organic inputs.`
    };
  }
}

module.exports = {
  CropSpecificFertilityAdvisoryService,
  CROP_PHENOLOGY_NUTRIENT_CURVES,
  VISUAL_DEFICIENCY_SYMPTOM_CATALOG,
  CROP_REMOVAL_FACTORS
};
