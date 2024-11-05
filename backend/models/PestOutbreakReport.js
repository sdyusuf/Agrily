/**
 * ==============================================================================
 * 🐛 AGRILY SPRINT 22: PEST OUTBREAK & CROWD-SOURCED SCOUTING REPORT SCHEMA
 * ==============================================================================
 *
 * Captures geo-referenced field pest scouting reports across 10 major tropical
 * agricultural pests in West Africa:
 *  - Fall Armyworm (Spodoptera frugiperda)
 *  - Tomato Leafminer (Tuta absoluta)
 *  - Red-Billed Quelea Bird Flocks (Quelea quelea)
 *  - Desert / Migratory Locust (Schistocerca gregaria / Locusta migratoria)
 *  - Cassava Whitefly Vector (Bemisia tabaci)
 *  - Cowpea Pod Borer (Maruca vitrata)
 *  - Maize Stem Borer (Busseola fusca / Sesamia calamistis)
 *  - African Rice Gall Midge (Orseolia oryzivora)
 *  - Cocoa Mirid / Capsid Bug (Sahlbergella singularis)
 *  - Sorghum Midge (Stenodiplosis sorghicola)
 *
 * Includes Davis 1-9 foliar whorl damage scale, Pedigo Economic Injury Level (EIL),
 * and automatic severity tiering.
 *
 * @module models/PestOutbreakReport
 */

const mongoose = require('mongoose');

const SUPPORTED_PEST_SPECIES = [
  'FALL_ARMYWORM',
  'TUTA_ABSOLUTA',
  'QUELEA_BIRDS',
  'DESERT_LOCUST',
  'BEMISIA_WHITEFLY',
  'COWPEA_POD_BORER',
  'STEM_BORER',
  'RICE_GALL_MIDGE',
  'COCOA_MIRID_BUG',
  'SORGHUM_MIDGE',
];

const LARVAL_INSTAR_STAGES = [
  'EGG_MASS_BIOFIX',
  'L1_L2_EARLY_INSTAR',
  'L3_L4_MID_INSTAR',
  'L5_L6_LATE_BORING',
  'PUPA_SOIL',
  'ADULT_MOTH_SWARM',
];

const ScoutingProtocolSchema = new mongoose.Schema(
  {
    wPatternStationsSampled: { type: Number, min: 1, max: 20, default: 5 },
    totalPlantsInspected: { type: Number, min: 10, max: 500, default: 100 },
    infestedPlantsCount: { type: Number, min: 0, max: 500, default: 28 },
    infestedPlantsIncidencePct: {
      type: Number,
      min: 0,
      max: 100,
      default: function () {
        const total = this.totalPlantsInspected ?? 100;
        const infested = this.infestedPlantsCount ?? 28;
        return Number(((infested / Math.max(1, total)) * 100).toFixed(1));
      },
    },
    meanLarvaePerPlant: { type: Number, min: 0, max: 50, default: 1.8 },
    davisFoliarDamageScale: {
      type: Number,
      min: 1,
      max: 9,
      default: 4,
    },
    dominantInstarStage: {
      type: String,
      enum: LARVAL_INSTAR_STAGES,
      default: 'L1_L2_EARLY_INSTAR',
    },
    pheromoneTrapMothsPerNight: { type: Number, min: 0, max: 1000, default: 14 },
  },
  { _id: false }
);

const PestOutbreakReportSchema = new mongoose.Schema(
  {
    reportCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: function () {
        const rand = Math.floor(10000 + Math.random() * 90000);
        return `PST-2024-${rand}`;
      },
    },
    pestSpeciesKey: {
      type: String,
      required: true,
      enum: SUPPORTED_PEST_SPECIES,
      default: 'FALL_ARMYWORM',
    },
    scientificName: {
      type: String,
      required: true,
      default: 'Spodoptera frugiperda',
    },
    hostCropKey: {
      type: String,
      required: true,
      default: 'MAIZE',
    },
    stateCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: 'KD',
    },
    stateName: {
      type: String,
      required: true,
      trim: true,
      default: 'Kaduna',
    },
    lgaName: {
      type: String,
      required: true,
      trim: true,
      default: 'Giwa',
    },
    agroEcologicalZone: {
      type: String,
      required: true,
      default: 'NORTHERN_GUINEA_SAVANNA',
    },
    coordinates: {
      latitude: { type: Number, required: true, min: 4.0, max: 14.5, default: 11.12 },
      longitude: { type: Number, required: true, min: 2.5, max: 15.0, default: 7.72 },
    },
    scoutingProtocol: {
      type: ScoutingProtocolSchema,
      default: () => ({}),
    },
    microclimateAtScouting: {
      ambientTempC: { type: Number, default: 29.4 },
      relativeHumidityPct: { type: Number, default: 66.0 },
      windSpeedKmh: { type: Number, default: 14.5 },
      windBearingDeg: { type: Number, min: 0, max: 360, default: 45 },
      cumulativeDegreeDaysGdd: { type: Number, min: 0, default: 245 },
    },
    economicThresholdAssessment: {
      treatmentCostNgnPerHa: { type: Number, default: 38500 },
      cropMarketValueNgnPerTon: { type: Number, default: 685000 },
      expectedYieldTonsPerHa: { type: Number, default: 4.5 },
      economicInjuryLevelPct: {
        type: Number,
        default: function () {
          return 18.5;
        },
      },
      economicThresholdPct: {
        type: Number,
        default: function () {
          return 13.9;
        },
      },
      exceedsEconomicThreshold: {
        type: Boolean,
        default: function () {
          const incidence = this.scoutingProtocol?.infestedPlantsIncidencePct ?? 28;
          const et = this.economicThresholdAssessment?.economicThresholdPct ?? 13.9;
          return incidence >= et;
        },
      },
    },
    infestationSeverityTier: {
      type: String,
      enum: [
        'TRACE_ENDEMIC',
        'WATCH_EARLY_INSTAR',
        'ACTION_THRESHOLD_EXCEEDED',
        'SEVERE_OUTBREAK_SWARM',
      ],
      default: function () {
        const incidence = this.scoutingProtocol?.infestedPlantsIncidencePct ?? 28;
        const davis = this.scoutingProtocol?.davisFoliarDamageScale ?? 4;
        if (incidence >= 45 || davis >= 7) return 'SEVERE_OUTBREAK_SWARM';
        if (incidence >= 20 || davis >= 5) return 'ACTION_THRESHOLD_EXCEEDED';
        if (incidence >= 8 || davis >= 3) return 'WATCH_EARLY_INSTAR';
        return 'TRACE_ENDEMIC';
      },
    },
    verificationStatus: {
      type: String,
      enum: ['CROWD_REPORTED', 'EXTENSION_VERIFIED', 'SATELLITE_CORROBORATED'],
      default: 'EXTENSION_VERIFIED',
    },
    recommendedIpmAction: {
      type: String,
      default:
        'Release Trichogramma egg parasitoids (50,000/ha) + apply Azadirachtin 0.15% EC or Bacillus thuringiensis kurstaki while larvae remain in L1-L2 window-pane stage.',
    },
  },
  { timestamps: true }
);

module.exports = {
  PestOutbreakReport:
    mongoose.models.PestOutbreakReport ||
    mongoose.model('PestOutbreakReport', PestOutbreakReportSchema),
  SUPPORTED_PEST_SPECIES,
  LARVAL_INSTAR_STAGES,
};
