/**
 * ==============================================================================
 * 🐞 AGRILY SPRINT 22: INTEGRATED PEST MANAGEMENT (IPM) & BIOCONTROL GUIDE SCHEMA
 * ==============================================================================
 *
 * Defines multi-tier IPM intervention pyramids combining:
 *  - Tier 1: Cultural & Push-Pull Companion Cropping (Desmodium + Napier grass)
 *  - Tier 2: Augmentative Biological Control (Trichogramma, Telenomus remus, Habrobracon)
 *  - Tier 3: Biopesticides & Entomopathogens (Bt kurstaki, Beauveria bassiana, Metarhizium, Neem)
 *  - Tier 4: Selective IRAC Mode-of-Action (MoA) Chemical Rotation with Pollinator Safety
 *
 * @module models/IpmBiocontrolGuide
 */

const mongoose = require('mongoose');

const IpmBiocontrolGuideSchema = new mongoose.Schema(
  {
    guideCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: function () {
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `IPM-GUIDE-${rand}`;
      },
    },
    pestSpeciesKey: {
      type: String,
      required: true,
      unique: true,
      default: 'FALL_ARMYWORM',
    },
    pestCommonName: {
      type: String,
      required: true,
      default: 'Fall Armyworm (Spodoptera frugiperda)',
    },
    developmentalBaseTempC: {
      type: Number,
      required: true,
      default: 12.2,
    },
    eggToAdultDegreeDaysGdd: {
      type: Number,
      required: true,
      default: 495,
    },
    vulnerableBiocontrolWindowGdd: {
      minGdd: { type: Number, default: 55 },
      maxGdd: { type: Number, default: 195 },
      targetStageLabel: { type: String, default: 'Egg Mass to L1/L2 Window-Pane Instar' },
    },
    pushPullCompanionSystem: {
      intercropRepellent: {
        type: String,
        default: 'Silverleaf Desmodium (Desmodium uncinatum)',
      },
      borderTrapCrop: {
        type: String,
        default: 'Brachiaria cv. Mulato II / Napier Grass (Pennisetum purpureum)',
      },
      larvalSuppressionEfficacyPct: { type: Number, min: 0, max: 100, default: 68 },
    },
    biologicalControlAgents: [
      {
        agentName: { type: String, required: true },
        guildType: {
          type: String,
          enum: [
            'EGG_PARASITOID',
            'LARVAL_PARASITOID',
            'PREDATORY_BUG',
            'ENTOMOPATHOGENIC_FUNGUS',
            'ENTOMOPATHOGENIC_BACTERIA',
            'ENTOMOPATHOGENIC_VIRUS',
            'BOTANICAL_EXTRACT',
          ],
          required: true,
        },
        releaseRatePerHa: { type: String, required: true },
        targetInstar: { type: String, required: true },
        expectedKnockdownPct: { type: Number, min: 0, max: 100, required: true },
        costNgnPerHa: { type: Number, required: true },
      },
    ],
    iracChemicalRotationGroups: [
      {
        iracGroupCode: { type: String, required: true },
        activeIngredient: { type: String, required: true },
        modeOfActionName: { type: String, required: true },
        dosagePerHa: { type: String, required: true },
        preHarvestIntervalDays: { type: Number, required: true },
        reEntryIntervalHours: { type: Number, required: true },
        beeToxicityTier: {
          type: String,
          enum: ['LOW_POLLINATOR_SAFE', 'MODERATE_EVENING_ONLY', 'HIGH_RESTRICTED'],
          default: 'LOW_POLLINATOR_SAFE',
        },
        expectedEfficacyPct: { type: Number, min: 0, max: 100, default: 88 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = {
  IpmBiocontrolGuide:
    mongoose.models.IpmBiocontrolGuide ||
    mongoose.model('IpmBiocontrolGuide', IpmBiocontrolGuideSchema),
};
