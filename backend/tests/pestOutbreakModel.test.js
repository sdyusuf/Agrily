const assert = require('assert');
const { PestOutbreakReport } = require('../models/PestOutbreakReport');
const { PheromoneTrapStation } = require('../models/PheromoneTrapStation');
const { IpmBiocontrolGuide } = require('../models/IpmBiocontrolGuide');

console.log('🧪 Starting Sprint 22 PestOutbreakReport, PheromoneTrapStation & IpmBiocontrolGuide Schema Tests...');

// 1. Validate PestOutbreakReport synchronous defaults & severity classification
const outbreak = new PestOutbreakReport({
  pestSpeciesKey: 'FALL_ARMYWORM',
  scientificName: 'Spodoptera frugiperda',
  hostCropKey: 'MAIZE',
  stateCode: 'KD',
  stateName: 'Kaduna',
  lgaName: 'Zaria',
  scoutingProtocol: {
    wPatternStationsSampled: 5,
    totalPlantsInspected: 100,
    infestedPlantsCount: 48,
    meanLarvaePerPlant: 3.1,
    davisFoliarDamageScale: 7,
    dominantInstarStage: 'L3_L4_MID_INSTAR',
    pheromoneTrapMothsPerNight: 32,
  },
});

const outbreakErr = outbreak.validateSync();
assert.strictEqual(outbreakErr, undefined, 'Expected PestOutbreakReport to validate cleanly');
assert(outbreak.reportCode.startsWith('PST-2024-'), 'Expected PST-2024- reportCode prefix');
assert.strictEqual(outbreak.scoutingProtocol.infestedPlantsIncidencePct, 48.0);
assert.strictEqual(outbreak.infestationSeverityTier, 'SEVERE_OUTBREAK_SWARM');
assert.strictEqual(outbreak.economicThresholdAssessment.exceedsEconomicThreshold, true);
console.log('  ✓ PestOutbreakReport computes plant incidence %, EIL trigger, and SEVERE_OUTBREAK_SWARM tier');

// 2. Validate PheromoneTrapStation cumulative moth flight and surge alert state
const trap = new PheromoneTrapStation({
  stationName: 'Makurdi Alluvial Funnel Trap #04',
  targetPestKey: 'FALL_ARMYWORM',
  stateCode: 'BN',
  lgaName: 'Gboko',
  nightlyCatchSeries7Days: [14, 18, 22, 26, 30, 35, 42],
});

const trapErr = trap.validateSync();
assert.strictEqual(trapErr, undefined, 'Expected PheromoneTrapStation to validate cleanly');
assert(trap.trapCode.startsWith('TRP-NG-'), 'Expected TRP-NG- trapCode prefix');
assert.strictEqual(trap.sevenDayCumulativeMoths, 187);
assert.strictEqual(trap.trapAlertState, 'MASS_FLIGHT_CRITICAL');
console.log('  ✓ PheromoneTrapStation computes 7-day moth sum and MASS_FLIGHT_CRITICAL state');

// 3. Validate IpmBiocontrolGuide multi-tier biocontrol & IRAC rotation groups
const ipmGuide = new IpmBiocontrolGuide({
  pestSpeciesKey: 'TUTA_ABSOLUTA',
  pestCommonName: 'Tomato Leafminer (Tuta absoluta)',
  developmentalBaseTempC: 10.0,
  eggToAdultDegreeDaysGdd: 410,
  biologicalControlAgents: [
    {
      agentName: 'Trichogramma achaeae',
      guildType: 'EGG_PARASITOID',
      releaseRatePerHa: '75,000 parasitoid cards/ha',
      targetInstar: 'EGG_MASS_BIOFIX',
      expectedKnockdownPct: 78,
      costNgnPerHa: 24500,
    },
  ],
  iracChemicalRotationGroups: [
    {
      iracGroupCode: 'IRAC Group 5 (Spinosyns)',
      activeIngredient: 'Spinetoram 120 g/L SC',
      modeOfActionName: 'Nicotinic acetylcholine receptor allosteric modulator',
      dosagePerHa: '250 mL/ha',
      preHarvestIntervalDays: 3,
      reEntryIntervalHours: 12,
      beeToxicityTier: 'MODERATE_EVENING_ONLY',
      expectedEfficacyPct: 91,
    },
  ],
});

const ipmErr = ipmGuide.validateSync();
assert.strictEqual(ipmErr, undefined, 'Expected IpmBiocontrolGuide to validate cleanly');
assert.strictEqual(ipmGuide.biologicalControlAgents.length, 1);
assert.strictEqual(ipmGuide.iracChemicalRotationGroups.length, 1);
console.log('  ✓ IpmBiocontrolGuide validates biological agents and IRAC rotation groups');

console.log('✅ All Sprint 22 PestOutbreakReport, PheromoneTrapStation & IpmBiocontrolGuide schema tests passed!');
