/**
 * @file cropOutbreakContagionService.js
 * @description Regional Crop Disease Contagion & Outbreak Telemetry Service.
 * Aggregates spatial contagion clusters across 36 Nigerian states and the FCT,
 * evaluates environmental spore transmission risk factors, enforces quarantine buffers,
 * and alerts haulage corridors of phytosanitary transit interdictions.
 */

const crypto = require('crypto');
const { NIGERIAN_STATES, OUTBREAK_STATUSES } = require('../models/DiseaseOutbreakTelemetry');

/**
 * Baseline Climatological and Pathology Telemetry per Nigerian Agro-Zone
 */
const BASELINE_REGIONAL_OUTBREAK_DATA = [
  {
    state: 'KANO',
    primaryCrop: 'TOMATO',
    activePathogenCode: 'TOM-EB-001',
    pathogenName: 'Tomato Early Blight',
    riskStatus: 'MODERATE_SPREAD_WATCH',
    reportedCases: 38,
    affectedAcreageHectares: 145.0,
    quarantineRadiusKm: 8.0,
    lgasAffected: ['Kura', 'Bunkure', 'Bagwai'],
    sporeFavorableIndex: 0.72,
    transitInterdicted: false
  },
  {
    state: 'PLATEAU',
    primaryCrop: 'TOMATO',
    activePathogenCode: 'TOM-LB-002',
    pathogenName: 'Tomato Late Blight',
    riskStatus: 'CRITICAL_QUARANTINE_LOCKDOWN',
    reportedCases: 84,
    affectedAcreageHectares: 320.0,
    quarantineRadiusKm: 25.0,
    lgasAffected: ['Barkin Ladi', 'Mangu', 'Bokkos', 'Jos South'],
    sporeFavorableIndex: 0.94,
    transitInterdicted: true
  },
  {
    state: 'BENUE',
    primaryCrop: 'YAM',
    activePathogenCode: 'YAM-ANT-001',
    pathogenName: 'Yam Anthracnose',
    riskStatus: 'MODERATE_SPREAD_WATCH',
    reportedCases: 29,
    affectedAcreageHectares: 95.0,
    quarantineRadiusKm: 8.0,
    lgasAffected: ['Gboko', 'Katsina-Ala', 'Zaki Biam'],
    sporeFavorableIndex: 0.68,
    transitInterdicted: false
  },
  {
    state: 'OYO',
    primaryCrop: 'CASSAVA',
    activePathogenCode: 'CAS-CMD-001',
    pathogenName: 'Cassava Mosaic Disease',
    riskStatus: 'LOCALIZED_SPORADIC',
    reportedCases: 14,
    affectedAcreageHectares: 45.0,
    quarantineRadiusKm: 5.0,
    lgasAffected: ['Iseyin', 'Saki West'],
    sporeFavorableIndex: 0.58,
    transitInterdicted: false
  },
  {
    state: 'ONDO',
    primaryCrop: 'COCOA',
    activePathogenCode: 'COC-BP-001',
    pathogenName: 'Cocoa Black Pod Disease',
    riskStatus: 'EPIDEMIC_SURGE_WARNING',
    reportedCases: 56,
    affectedAcreageHectares: 210.0,
    quarantineRadiusKm: 15.0,
    lgasAffected: ['Idanre', 'Ondo West', 'Ile-Oluji'],
    sporeFavorableIndex: 0.88,
    transitInterdicted: false
  },
  {
    state: 'KADUNA',
    primaryCrop: 'MAIZE',
    activePathogenCode: 'MAIZ-FAW-001',
    pathogenName: 'Fall Armyworm Infestation',
    riskStatus: 'MODERATE_SPREAD_WATCH',
    reportedCases: 42,
    affectedAcreageHectares: 175.0,
    quarantineRadiusKm: 8.0,
    lgasAffected: ['Giwa', 'Zaria', 'Soba'],
    sporeFavorableIndex: 0.74,
    transitInterdicted: false
  },
  {
    state: 'KEBBI',
    primaryCrop: 'RICE',
    activePathogenCode: 'RIC-BLAST-001',
    pathogenName: 'Rice Leaf Blast',
    riskStatus: 'LOCALIZED_SPORADIC',
    reportedCases: 18,
    affectedAcreageHectares: 80.0,
    quarantineRadiusKm: 5.0,
    lgasAffected: ['Suru', 'Argungu'],
    sporeFavorableIndex: 0.62,
    transitInterdicted: false
  }
];

class CropOutbreakContagionService {
  /**
   * Retrieves comprehensive 36-state + FCT outbreak heatmap and summary
   */
  static getOutbreakTelemetrySummary() {
    // Generate full dataset for all states
    const activeStateMap = new Map();
    BASELINE_REGIONAL_OUTBREAK_DATA.forEach(item => {
      activeStateMap.set(item.state, item);
    });

    const fullStateClusters = NIGERIAN_STATES.map(stateName => {
      if (activeStateMap.has(stateName)) {
        return activeStateMap.get(stateName);
      }
      return {
        state: stateName,
        primaryCrop: 'GENERAL',
        activePathogenCode: 'NONE_HEALTHY',
        pathogenName: 'No Active Contagion Cluster',
        riskStatus: 'MONITORING_NORMAL',
        reportedCases: 0,
        affectedAcreageHectares: 0,
        quarantineRadiusKm: 0,
        lgasAffected: [],
        sporeFavorableIndex: 0.25,
        transitInterdicted: false
      };
    });

    // Summary statistics
    const totalOutbreaks = fullStateClusters.filter(c => c.riskStatus !== 'MONITORING_NORMAL').length;
    const criticalLockdowns = fullStateClusters.filter(c => c.riskStatus === 'CRITICAL_QUARANTINE_LOCKDOWN').length;
    const epidemicSurges = fullStateClusters.filter(c => c.riskStatus === 'EPIDEMIC_SURGE_WARNING').length;
    const totalAffectedAcreageHectares = fullStateClusters.reduce((sum, c) => sum + c.affectedAcreageHectares, 0);

    const nationalTelemetrySeal = crypto.createHash('sha256')
      .update(`${totalOutbreaks}::${criticalLockdowns}::${totalAffectedAcreageHectares}`)
      .digest('hex');

    return {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalStatesMonitored: NIGERIAN_STATES.length,
        activeOutbreakClustersCount: totalOutbreaks,
        criticalLockdownsCount: criticalLockdowns,
        epidemicSurgeWarningsCount: epidemicSurges,
        totalHectaresUnderQuarantine: totalAffectedAcreageHectares,
        quarantineAuthority: 'Nigeria Agricultural Quarantine Service (NAQS)'
      },
      clusters: fullStateClusters,
      nationalTelemetrySeal
    };
  }

  /**
   * Evaluates if a freight route crossing a state encounters phytosanitary interdiction
   *
   * @param {string} stateName - Nigerian state name (e.g. 'PLATEAU')
   * @returns {Object} Transit safety evaluation
   */
  static checkCorridorPhytosanitaryClearance(stateName) {
    const rawState = (stateName || '').toUpperCase().trim();
    const cluster = BASELINE_REGIONAL_OUTBREAK_DATA.find(c => c.state === rawState);

    if (!cluster) {
      return {
        state: rawState,
        corridorClearance: 'UNRESTRICTED_TRANSIT_CLEARED',
        isTransitInterdicted: false,
        quarantineRadiusKm: 0,
        advisory: 'No active phytosanitary checkpoints on agricultural produce.'
      };
    }

    const isInterdicted = cluster.riskStatus === 'CRITICAL_QUARANTINE_LOCKDOWN';
    return {
      state: rawState,
      corridorClearance: isInterdicted ? 'TRANSIT_PROHIBITED_QUARANTINE_ACTIVE' : 'TRANSIT_CAUTION_INSPECTION_MANDATORY',
      isTransitInterdicted: isInterdicted,
      quarantineRadiusKm: cluster.quarantineRadiusKm,
      primaryCropAffected: cluster.primaryCrop,
      pathogenName: cluster.pathogenName,
      advisory: isInterdicted
        ? `HAULAGE ALERT: Interstate haulage of ${cluster.primaryCrop} across ${rawState} is restricted under NAQS quarantine order.`
        : `Normal haulage permitted with phytosanitary inspection seal.`
    };
  }

  /**
   * Registers a new localized outbreak incident from extension worker or farmer
   *
   * @param {Object} incident
   * @returns {Object} Created incident record
   */
  static reportOutbreakCluster(incident = {}) {
    const rawState = (incident.state || 'KANO').toUpperCase().trim();
    if (!NIGERIAN_STATES.includes(rawState)) {
      throw new Error(`Invalid Nigerian state: "${rawState}".`);
    }

    const clusterId = `OBK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const cases = Math.max(1, Number(incident.reportedCasesCount) || 1);
    const acreage = Math.max(1.0, Number(incident.confirmedAcreageHectares) || 5.0);

    let status = 'LOCALIZED_SPORADIC';
    let quarantineRadius = 5.0;
    let interdicted = false;

    if (cases >= 50 || acreage >= 200) {
      status = 'CRITICAL_QUARANTINE_LOCKDOWN';
      quarantineRadius = 25.0;
      interdicted = true;
    } else if (cases >= 25 || acreage >= 100) {
      status = 'EPIDEMIC_SURGE_WARNING';
      quarantineRadius = 15.0;
    } else if (cases >= 10 || acreage >= 30) {
      status = 'MODERATE_SPREAD_WATCH';
      quarantineRadius = 8.0;
    }

    const verificationHash = crypto.createHash('sha256')
      .update(`${clusterId}|${rawState}|${incident.cropType}|${status}|${cases}|${acreage}`)
      .digest('hex');

    return {
      success: true,
      clusterId,
      state: rawState,
      lgaCluster: incident.lgas || ['Headquarters LGA'],
      primaryCrop: (incident.cropType || 'TOMATO').toUpperCase(),
      pathogenName: incident.pathogenName || 'Foliar Pathogen Cluster',
      outbreakStatus: status,
      reportedCasesCount: cases,
      confirmedAcreageHectares: acreage,
      quarantineRadiusKm: quarantineRadius,
      isTransitInterdicted: interdicted,
      verificationHash,
      quarantineEnactedAt: interdicted ? new Date().toISOString() : null
    };
  }
}

module.exports = {
  CropOutbreakContagionService,
  BASELINE_REGIONAL_OUTBREAK_DATA
};
