/**
 * ==============================================================================
 * 🧬 AGRILY SPRINT 22: PARASITOID BIO-FACTORY MASS-REARING & PUSH-PULL ENGINE
 * ==============================================================================
 *
 * Models regional biological control insectary production kinetics, Nicholson-Bailey
 * host-parasitoid functional response, and Khan et al. (2010) ICIPE Push-Pull
 * semiochemical companion-cropping suppression:
 *
 *  1. Nicholson-Bailey / Holling Type II Parasitoid Functional Response:
 *     N_parasitized = N_host * [ 1 - exp( -a * P * T / (1 + a * T_h * N_host) ) ]
 *  2. Factitious Host Mass-Rearing Kinetics (Corcyra cephalonica / Sitotroga cerealella)
 *     for Trichogramma & Telenomus remus egg card production scheduling.
 *  3. Push-Pull Companion Cropping (Desmodium uncinatum / D. intortum intercrop +
 *     Brachiaria cv. Mulato II border trap) semiochemical E-(beta)-ocimene &
 *     (E)-4,8-dimethyl-1,3,7-nonatriene (DMNT) oviposition deterrence + Striga
 *     hermonthica suicidal germination suppression.
 *  4. Pheromone Septa Release Kinetics (First-Order Arrhenius Volatilization)
 *     for Z9-14:Ac / Z7-12:Ac lures under tropical field temperatures.
 *
 * @module services/parasitoidBioFactoryAndPushPullEngine
 */

const PARASITOID_GUILD_CATALOG = {
  TELENOMUS_REMUS: {
    agentKey: 'TELENOMUS_REMUS',
    scientificName: 'Telenomus remus (Hymenoptera: Scelionidae)',
    targetPestKey: 'FALL_ARMYWORM',
    factitiousHostSpecies: 'Spodoptera / Corcyra sterilized egg masses',
    searchingEfficiencyAreaHaPerFemale: 0.000018,
    handlingTimeDaysPerEggTh: 0.0042,
    fecundityEggsPerFemale: 165,
    sexRatioFemaleFraction: 0.68,
    parasitoidsPerTrichoCard: 2500,
    recommendedCardsPerHaPerRelease: 24,
    releasesPerCropCycle: 3,
    optimalReleaseTempRangeC: [20, 33],
    thermalMortalityAbove38CPct: 45,
    ableToParasitizeInnerEggLayers: true,
    productionCostNgnPerCard: 850,
  },
  TRICHOGRAMMA_ACHAEAE: {
    agentKey: 'TRICHOGRAMMA_ACHAEAE',
    scientificName: 'Trichogramma achaeae (Hymenoptera: Trichogrammatidae)',
    targetPestKey: 'TUTA_ABSOLUTA',
    factitiousHostSpecies: 'Sitotroga cerealella / Ephestia kuehniella UV-sterilized eggs',
    searchingEfficiencyAreaHaPerFemale: 0.000015,
    handlingTimeDaysPerEggTh: 0.0055,
    fecundityEggsPerFemale: 95,
    sexRatioFemaleFraction: 0.72,
    parasitoidsPerTrichoCard: 3000,
    recommendedCardsPerHaPerRelease: 25,
    releasesPerCropCycle: 4,
    optimalReleaseTempRangeC: [18, 32],
    thermalMortalityAbove38CPct: 52,
    ableToParasitizeInnerEggLayers: false,
    productionCostNgnPerCard: 780,
  },
  COTESIA_FLAVIPES: {
    agentKey: 'COTESIA_FLAVIPES',
    scientificName: 'Cotesia flavipes (Hymenoptera: Braconidae)',
    targetPestKey: 'STEM_BORER',
    factitiousHostSpecies: 'Busseola fusca / Chilo partellus 3rd-4th instar larvae',
    searchingEfficiencyAreaHaPerFemale: 0.000024,
    handlingTimeDaysPerEggTh: 0.018,
    fecundityEggsPerFemale: 120,
    sexRatioFemaleFraction: 0.65,
    parasitoidsPerTrichoCard: 500,
    recommendedCardsPerHaPerRelease: 8,
    releasesPerCropCycle: 2,
    optimalReleaseTempRangeC: [19, 34],
    thermalMortalityAbove38CPct: 38,
    ableToParasitizeInnerEggLayers: false,
    productionCostNgnPerCard: 2400,
  },
  HABROBRACON_HEBETOR: {
    agentKey: 'HABROBRACON_HEBETOR',
    scientificName: 'Habrobracon hebetor (Hymenoptera: Braconidae)',
    targetPestKey: 'MILLET_HEAD_MINER_AND_BORERS',
    factitiousHostSpecies: 'Corcyra cephalonica (Rice meal moth) larvae in jute bags',
    searchingEfficiencyAreaHaPerFemale: 0.000028,
    handlingTimeDaysPerEggTh: 0.014,
    fecundityEggsPerFemale: 180,
    sexRatioFemaleFraction: 0.64,
    parasitoidsPerTrichoCard: 800,
    recommendedCardsPerHaPerRelease: 10,
    releasesPerCropCycle: 2,
    optimalReleaseTempRangeC: [22, 37],
    thermalMortalityAbove38CPct: 24,
    ableToParasitizeInnerEggLayers: false,
    productionCostNgnPerCard: 1950,
  },
  ENCARSIA_FORMOSA: {
    agentKey: 'ENCARSIA_FORMOSA',
    scientificName: 'Encarsia formosa (Hymenoptera: Aphelinidae)',
    targetPestKey: 'BEMISIA_WHITEFLY',
    factitiousHostSpecies: 'Trialeurodes / Bemisia 3rd-4th instar nymph scales',
    searchingEfficiencyAreaHaPerFemale: 0.000016,
    handlingTimeDaysPerEggTh: 0.008,
    fecundityEggsPerFemale: 110,
    sexRatioFemaleFraction: 0.92,
    parasitoidsPerTrichoCard: 1500,
    recommendedCardsPerHaPerRelease: 30,
    releasesPerCropCycle: 3,
    optimalReleaseTempRangeC: [20, 33],
    thermalMortalityAbove38CPct: 48,
    ableToParasitizeInnerEggLayers: false,
    productionCostNgnPerCard: 720,
  },
};

const PUSH_PULL_ARCHITECTURES = {
  CLIMATE_SMART_PUSH_PULL: {
    systemKey: 'CLIMATE_SMART_PUSH_PULL',
    systemName: 'Climate-Smart Push-Pull (Drought-Tolerant Greenleaf Desmodium + Brachiaria Mulato II)',
    intercropSpecies: 'Desmodium intortum / D. incanum',
    borderTrapSpecies: 'Brachiaria brizantha cv. Mulato II',
    borderAreaRatioPct: 12.0,
    volatileTerpenoidFluxIndex: 0.92,
    fawOvipositionRepellencyPct: 76.0,
    stemBorerSuppressionPct: 82.0,
    strigaSeedbankSuicidalGerminationPct: 88.0,
    biologicalN2FixationKgHaYear: 85.0,
    highProteinForageDryMatterTonsHaYear: 4.8,
    establishmentCostNgnHa: 68000,
    annualMaintenanceCostNgnHa: 22000,
  },
  CONVENTIONAL_PUSH_PULL: {
    systemKey: 'CONVENTIONAL_PUSH_PULL',
    systemName: 'Conventional Push-Pull (Silverleaf Desmodium + Napier Grass Bana)',
    intercropSpecies: 'Desmodium uncinatum',
    borderTrapSpecies: 'Pennisetum purpureum (Napier Grass)',
    borderAreaRatioPct: 14.0,
    volatileTerpenoidFluxIndex: 0.85,
    fawOvipositionRepellencyPct: 68.0,
    stemBorerSuppressionPct: 78.0,
    strigaSeedbankSuicidalGerminationPct: 84.0,
    biologicalN2FixationKgHaYear: 72.0,
    highProteinForageDryMatterTonsHaYear: 5.4,
    establishmentCostNgnHa: 62000,
    annualMaintenanceCostNgnHa: 19500,
  },
  LEGUME_TRAP_STRIP_INTERCROP: {
    systemKey: 'LEGUME_TRAP_STRIP_INTERCROP',
    systemName: 'Maize–Cowpea / Soybean 2:4 Strip Intercrop + Sunnhemp Perimeter',
    intercropSpecies: 'Vigna unguiculata / Glycine max',
    borderTrapSpecies: 'Crotalaria juncea (Sunnhemp)',
    borderAreaRatioPct: 8.0,
    volatileTerpenoidFluxIndex: 0.54,
    fawOvipositionRepellencyPct: 42.0,
    stemBorerSuppressionPct: 46.0,
    strigaSeedbankSuicidalGerminationPct: 48.0,
    biologicalN2FixationKgHaYear: 52.0,
    highProteinForageDryMatterTonsHaYear: 2.6,
    establishmentCostNgnHa: 34000,
    annualMaintenanceCostNgnHa: 14000,
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
 * Simulates Holling Type II / Nicholson-Bailey host-parasitoid suppression dynamics
 * and bio-factory card production logistics for a target farm cluster.
 */
function simulateParasitoidHollingSuppression(params = {}) {
  const agentKey = String(params.agentKey || 'TELENOMUS_REMUS').toUpperCase();
  const agent =
    PARASITOID_GUILD_CATALOG[agentKey] || PARASITOID_GUILD_CATALOG.TELENOMUS_REMUS;

  const hostEggDensityPerHa = Math.max(
    1000,
    Number(params.hostEggDensityPerHa ?? 85000)
  );
  const releaseCardsPerHa = clamp(
    Number(params.releaseCardsPerHa ?? agent.recommendedCardsPerHaPerRelease),
    2,
    80
  );
  const ambientFieldTempC = clamp(Number(params.ambientFieldTempC ?? 28.5), 12.0, 44.0);
  const clusterAreaHectares = Math.max(1, Number(params.clusterAreaHectares ?? 120));

  const totalReleasedAdultsPerHa = releaseCardsPerHa * agent.parasitoidsPerTrichoCard;
  const activeSearchingFemalesPerHa =
    totalReleasedAdultsPerHa * agent.sexRatioFemaleFraction;

  // Thermal survival modifier
  const [optMin, optMax] = agent.optimalReleaseTempRangeC;
  let thermalFitness = 1.0;
  if (ambientFieldTempC > 38.0) {
    thermalFitness = 1 - agent.thermalMortalityAbove38CPct / 100;
  } else if (ambientFieldTempC > optMax) {
    thermalFitness = 1 - (ambientFieldTempC - optMax) * 0.06;
  } else if (ambientFieldTempC < optMin) {
    thermalFitness = 1 - (optMin - ambientFieldTempC) * 0.05;
  }
  thermalFitness = clamp(thermalFitness, 0.25, 1.0);

  const effectiveFemalesPerHa = activeSearchingFemalesPerHa * thermalFitness;
  const foragingDurationDays = 5.5;

  // Holling Type II disc equation inside Nicholson-Bailey exponential survival:
  // Encounter rate E = (a * P * T) / (1 + a * T_h * N_0 * 0.0001)
  const attackRateA = agent.searchingEfficiencyAreaHaPerFemale;
  const handlingDenominator =
    1 + attackRateA * agent.handlingTimeDaysPerEggTh * hostEggDensityPerHa * 0.08;
  const effectiveEncounterExponent =
    (attackRateA * effectiveFemalesPerHa * foragingDurationDays * 0.38) /
    handlingDenominator;

  const multiLayerBonus = agent.ableToParasitizeInnerEggLayers ? 1.12 : 0.88;
  const parasitismFraction = clamp(
    (1 - Math.exp(-effectiveEncounterExponent)) * multiLayerBonus,
    0.05,
    0.96
  );

  const parasitizedHostEggsPerHa = Math.round(hostEggDensityPerHa * parasitismFraction);
  const survivingPestLarvaePerHa = Math.max(
    0,
    Math.round(hostEggDensityPerHa - parasitizedHostEggsPerHa)
  );

  // Bio-factory batch sizing across full crop cycle
  const totalCardsPerHaPerSeason = releaseCardsPerHa * agent.releasesPerCropCycle;
  const totalClusterCardsRequired = Math.ceil(
    totalCardsPerHaPerSeason * clusterAreaHectares
  );
  const factitiousHostGramsRequired = roundTo(
    (totalClusterCardsRequired * agent.parasitoidsPerTrichoCard) / 18500,
    1
  );
  const totalProgramCostNgn = Math.round(
    totalClusterCardsRequired * agent.productionCostNgnPerCard
  );

  return {
    agentKey: agent.agentKey,
    scientificName: agent.scientificName,
    targetPestKey: agent.targetPestKey,
    releaseCardsPerHa,
    totalReleasedAdultsPerHa,
    effectiveFemalesPerHa: Math.round(effectiveFemalesPerHa),
    thermalFitness: roundTo(thermalFitness, 2),
    parasitismEfficiencyPct: roundTo(parasitismFraction * 100, 1),
    parasitizedHostEggsPerHa,
    survivingPestLarvaePerHa,
    totalClusterCardsRequired,
    factitiousHostGramsRequired,
    totalProgramCostNgn,
  };
}

/**
 * Evaluates ICIPE Push-Pull Companion Cropping suppression of Fall Armyworm,
 * Stem Borer, and Striga hermonthica parasitic weed, plus livestock fodder & N2 credits.
 */
function evaluatePushPullCompanionCropping(params = {}) {
  const systemKey = String(
    params.systemKey || 'CLIMATE_SMART_PUSH_PULL'
  ).toUpperCase();
  const sys =
    PUSH_PULL_ARCHITECTURES[systemKey] ||
    PUSH_PULL_ARCHITECTURES.CLIMATE_SMART_PUSH_PULL;

  const areaHectares = Math.max(0.5, Number(params.areaHectares ?? 5.0));
  const baselinePestIncidencePct = clamp(
    Number(params.baselinePestIncidencePct ?? 42.0),
    2.0,
    95.0
  );
  const strigaInfestedSoil = params.strigaInfestedSoil !== false;
  const ureaPriceNgnPerKgN = Math.max(500, Number(params.ureaPriceNgnPerKgN ?? 1450));
  const forageValueNgnPerTon = Math.max(
    40000,
    Number(params.forageValueNgnPerTon ?? 125000)
  );

  const residualFawIncidencePct = roundTo(
    baselinePestIncidencePct * (1 - sys.fawOvipositionRepellencyPct / 100),
    1
  );
  const residualStemBorerIncidencePct = roundTo(
    baselinePestIncidencePct * (1 - sys.stemBorerSuppressionPct / 100),
    1
  );

  // Economic credits from N2 fixation, fodder sales, and grain yield recovery
  const nitrogenCreditValueNgnHa = Math.round(
    sys.biologicalN2FixationKgHaYear * ureaPriceNgnPerKgN
  );
  const forageHarvestValueNgnHa = Math.round(
    sys.highProteinForageDryMatterTonsHaYear * forageValueNgnPerTon
  );
  const strigaYieldRecoveryTonsHa = strigaInfestedSoil ? 1.35 : 0.35;
  const pestYieldRecoveryTonsHa =
    ((baselinePestIncidencePct - residualFawIncidencePct) / 100) * 1.85;
  const totalGrainYieldUpliftTonsHa = roundTo(
    strigaYieldRecoveryTonsHa + pestYieldRecoveryTonsHa,
    2
  );
  const grainUpliftValueNgnHa = Math.round(totalGrainYieldUpliftTonsHa * 685000);

  const grossAnnualBenefitNgnHa =
    nitrogenCreditValueNgnHa + forageHarvestValueNgnHa + grainUpliftValueNgnHa;
  const netAnnualMarginNgnHa =
    grossAnnualBenefitNgnHa - sys.annualMaintenanceCostNgnHa;

  return {
    systemKey: sys.systemKey,
    systemName: sys.systemName,
    intercropSpecies: sys.intercropSpecies,
    borderTrapSpecies: sys.borderTrapSpecies,
    areaHectares,
    baselinePestIncidencePct,
    residualFawIncidencePct,
    residualStemBorerIncidencePct,
    strigaSeedbankReductionPct: sys.strigaSeedbankSuicidalGerminationPct,
    biologicalN2FixationKgHaYear: sys.biologicalN2FixationKgHaYear,
    totalGrainYieldUpliftTonsHa,
    nitrogenCreditValueNgnHa,
    forageHarvestValueNgnHa,
    grainUpliftValueNgnHa,
    grossAnnualBenefitNgnHa,
    netAnnualMarginNgnHa,
    totalClusterNetBenefitNgn: Math.round(netAnnualMarginNgnHa * areaHectares),
  };
}

/**
 * Models first-order Arrhenius thermal volatilization of rubber septa sex pheromone lures
 * to determine remaining field attraction radius and replacement schedule.
 */
function evaluatePheromoneLureVolatilization(params = {}) {
  const initialLoadingMg = Math.max(0.5, Number(params.initialLoadingMg ?? 3.0));
  const daysExposedInField = clamp(Number(params.daysExposedInField ?? 14), 0, 90);
  const meanAmbientTempC = clamp(Number(params.meanAmbientTempC ?? 30.0), 10.0, 45.0);
  const meanWindSpeedKmh = clamp(Number(params.meanWindSpeedKmh ?? 14.0), 1.0, 45.0);

  // Arrhenius temperature acceleration relative to 25°C reference
  const referenceDecayRatePerDay = 0.036;
  const tempAccelerationFactor = Math.exp(0.052 * (meanAmbientTempC - 25.0));
  const windVentilationFactor = 1 + (meanWindSpeedKmh - 10.0) * 0.012;
  const effectiveDecayConstantK =
    referenceDecayRatePerDay * tempAccelerationFactor * windVentilationFactor;

  const remainingPheromoneMg = roundTo(
    initialLoadingMg * Math.exp(-effectiveDecayConstantK * daysExposedInField),
    3
  );
  const currentReleaseRateUgPerHour = roundTo(
    ((initialLoadingMg * 1000 * effectiveDecayConstantK) / 24) *
      Math.exp(-effectiveDecayConstantK * daysExposedInField),
    2
  );

  // Minimum threshold for male moth anemotaxis plume tracking ~ 0.65 mg remaining
  const minEffectiveThresholdMg = 0.65;
  const totalEffectiveLifespanDays = Math.max(
    7,
    Math.floor(Math.log(initialLoadingMg / minEffectiveThresholdMg) / effectiveDecayConstantK)
  );
  const remainingServiceDays = Math.max(
    0,
    totalEffectiveLifespanDays - daysExposedInField
  );

  return {
    initialLoadingMg,
    daysExposedInField,
    remainingPheromoneMg,
    currentReleaseRateUgPerHour,
    totalEffectiveLifespanDays,
    remainingServiceDays,
    replacementRequiredNow: remainingServiceDays <= 3,
  };
}

/**
 * ==============================================================================
 * 🧬 HARDY-WEINBERG IRAC RESISTANCE ALLELE FREQUENCY & REFUGE EVOLUTION ENGINE
 * ==============================================================================
 *
 * Models multi-generation evolution of target-site resistance alleles (R vs. S)
 * under Continuous Single-MoA Chemical Selection vs. IRAC Multi-Group Rotation +
 * Unsprayed Biocontrol Refuge strips:
 *
 *   Genotype Fitnesses in Treated Zone:
 *     W_SS = 1 - s_kill (susceptible homozygote mortality)
 *     W_RS = W_SS + h * (W_RR - W_SS) (partial dominance h)
 *     W_RR = 1 - c_fitness (pleiotropic fitness cost of resistance allele)
 *
 *   Effective Fitness with Unsprayed Refuge Fraction (f_ref):
 *     W_eff(G) = (1 - f_ref) * W_treated(G) + f_ref * W_refuge(G)
 */
const IRAC_MOA_RESISTANCE_PROFILES = {
  IRAC_3A_PYRETHROIDS: {
    iracGroupCode: 'IRAC_3A_PYRETHROIDS',
    groupName: 'Group 3A Pyrethroids (Lambda-cyhalothrin / Cypermethrin)',
    mutationMechanism: 'kdr Voltage-Gated Sodium Channel (L1014F) Mutation',
    initialResistanceAlleleFreqQ0: 0.045,
    dominanceCoefficientH: 0.42,
    susceptibleKillRateS: 0.88,
    pleiotropicFitnessCostC: 0.04,
    criticalFieldFailureFreqThreshold: 0.50,
  },
  IRAC_1B_ORGANOPHOSPHATES: {
    iracGroupCode: 'IRAC_1B_ORGANOPHOSPHATES',
    groupName: 'Group 1B Organophosphates (Chlorpyrifos / Dimethoate)',
    mutationMechanism: 'Ace-1 Acetylcholinesterase (G119S) Insensitivity',
    initialResistanceAlleleFreqQ0: 0.032,
    dominanceCoefficientH: 0.38,
    susceptibleKillRateS: 0.86,
    pleiotropicFitnessCostC: 0.06,
    criticalFieldFailureFreqThreshold: 0.50,
  },
  IRAC_28_DIAMIDES: {
    iracGroupCode: 'IRAC_28_DIAMIDES',
    groupName: 'Group 28 Ryanodine Receptor Diamides (Chlorantraniliprole)',
    mutationMechanism: 'RyR (G4946E / I4790M) Point Mutation',
    initialResistanceAlleleFreqQ0: 0.004,
    dominanceCoefficientH: 0.18,
    susceptibleKillRateS: 0.94,
    pleiotropicFitnessCostC: 0.09,
    criticalFieldFailureFreqThreshold: 0.50,
  },
  IRAC_5_SPINOSYNS: {
    iracGroupCode: 'IRAC_5_SPINOSYNS',
    groupName: 'Group 5 Spinosyns (Spinetoram / Spinosad)',
    mutationMechanism: 'nAChR alpha-6 Subunit Truncation',
    initialResistanceAlleleFreqQ0: 0.003,
    dominanceCoefficientH: 0.14,
    susceptibleKillRateS: 0.93,
    pleiotropicFitnessCostC: 0.11,
    criticalFieldFailureFreqThreshold: 0.50,
  },
  IRAC_6_AVERMECTINS: {
    iracGroupCode: 'IRAC_6_AVERMECTINS',
    groupName: 'Group 6 Avermectins (Emamectin Benzoate)',
    mutationMechanism: 'GluCl Glutamate-Gated Chloride Channel Allosteric Shift',
    initialResistanceAlleleFreqQ0: 0.005,
    dominanceCoefficientH: 0.20,
    susceptibleKillRateS: 0.92,
    pleiotropicFitnessCostC: 0.08,
    criticalFieldFailureFreqThreshold: 0.50,
  },
};

function simulateHardyWeinbergIracResistanceTrajectory(params = {}) {
  const iracGroupCode = String(
    params.iracGroupCode || 'IRAC_28_DIAMIDES'
  ).toUpperCase();
  const profile =
    IRAC_MOA_RESISTANCE_PROFILES[iracGroupCode] ||
    IRAC_MOA_RESISTANCE_PROFILES.IRAC_28_DIAMIDES;

  const generationsSimulated = clamp(
    Math.round(Number(params.generationsSimulated ?? 15)),
    1,
    40
  );
  const unsprayedRefugeFraction = clamp(
    Number(params.unsprayedRefugeFraction ?? 0.20),
    0.0,
    0.65
  );
  const rotateMoaEveryGeneration = Boolean(params.rotateMoaEveryGeneration);
  const biocontrolCoApplication = Boolean(params.biocontrolCoApplication);

  let q = clamp(
    Number(params.initialAlleleFreqQ0 ?? profile.initialResistanceAlleleFreqQ0),
    0.0005,
    0.95
  );

  const trajectory = [];
  let generationsToFieldFailure = generationsSimulated + 1;

  for (let gen = 1; gen <= generationsSimulated; gen++) {
    const p = 1 - q;

    // If rotating MoA on even generations or co-applying non-selective parasitoids/baculovirus,
    // selection pressure on this specific target-site allele drops and fitness cost acts against R
    const activeSelectionThisGen = !rotateMoaEveryGeneration || gen % 2 === 1;
    const effectiveKillS = activeSelectionThisGen
      ? profile.susceptibleKillRateS * (biocontrolCoApplication ? 0.55 : 1.0)
      : 0.0;

    // Treated zone fitnesses
    const wSSTreated = 1 - effectiveKillS;
    const wRRTreated = 1 - profile.pleiotropicFitnessCostC;
    const wRSTreated =
      wSSTreated + profile.dominanceCoefficientH * (wRRTreated - wSSTreated);

    // Refuge zone fitnesses (no chemical selection; RR pays pleiotropic cost)
    const wSSRefuge = 1.0;
    const wRRRefuge = 1 - profile.pleiotropicFitnessCostC;
    const wRSRefuge = 1 - 0.5 * profile.pleiotropicFitnessCostC;

    // Landscape-weighted genotype fitnesses
    const fRef = unsprayedRefugeFraction;
    const wSS = (1 - fRef) * wSSTreated + fRef * wSSRefuge;
    const wRS = (1 - fRef) * wRSTreated + fRef * wRSRefuge;
    const wRR = (1 - fRef) * wRRTreated + fRef * wRRRefuge;

    const meanPopulationFitnessWBar =
      p * p * wSS + 2 * p * q * wRS + q * q * wRR;

    const nextQ = clamp(
      (q * q * wRR + p * q * wRS) / Math.max(1e-6, meanPopulationFitnessWBar),
      0.0001,
      0.999
    );
    q = nextQ;

    const resistantPhenotypePct = roundTo(
      (q * q + 2 * p * q * profile.dominanceCoefficientH) * 100,
      2
    );

    if (
      q >= profile.criticalFieldFailureFreqThreshold &&
      generationsToFieldFailure > generationsSimulated
    ) {
      generationsToFieldFailure = gen;
    }

    trajectory.push({
      generation: gen,
      resistanceAlleleFreqQ: roundTo(q, 4),
      susceptibleAlleleFreqP: roundTo(1 - q, 4),
      resistantPhenotypePct,
      fieldControlEfficacyPct: roundTo(
        Math.max(12, (1 - resistantPhenotypePct / 100) * profile.susceptibleKillRateS * 100),
        1
      ),
    });
  }

  return {
    iracGroupCode: profile.iracGroupCode,
    groupName: profile.groupName,
    mutationMechanism: profile.mutationMechanism,
    unsprayedRefugeFraction: roundTo(unsprayedRefugeFraction, 2),
    rotateMoaEveryGeneration,
    biocontrolCoApplication,
    initialAlleleFreqQ0: profile.initialResistanceAlleleFreqQ0,
    finalAlleleFreqQ: trajectory[trajectory.length - 1].resistanceAlleleFreqQ,
    finalControlEfficacyPct:
      trajectory[trajectory.length - 1].fieldControlEfficacyPct,
    generationsToFieldFailure,
    fieldFailureReached: generationsToFieldFailure <= generationsSimulated,
    trajectory,
  };
}

module.exports = {
  PARASITOID_GUILD_CATALOG,
  PUSH_PULL_ARCHITECTURES,
  IRAC_MOA_RESISTANCE_PROFILES,
  simulateParasitoidHollingSuppression,
  evaluatePushPullCompanionCropping,
  evaluatePheromoneLureVolatilization,
  simulateHardyWeinbergIracResistanceTrajectory,
};
