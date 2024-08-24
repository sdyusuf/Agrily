/**
 * @file fleetMaintenanceLogService.js
 * @description Fleet Preventive Maintenance, Vehicle Roadworthiness & Reefer Servicing Service
 * Monitors component wear, compressor health, brake lining depth, and automated inspection triggers.
 */

const crypto = require('crypto');

/**
 * Standard preventative maintenance service intervals (Kilometres)
 */
const MAINTENANCE_INTERVALS_KM = {
  ENGINE_OIL_CHANGE: 10000,
  BRAKE_PAD_REPLACEMENT: 25000,
  TIRE_ROTATION_AND_PRESSURE: 15000,
  TRANSMISSION_FLUID_FLUSH: 50000,
  REEFER_COMPRESSOR_OVERHAUL: 30000,
  SUSPENSION_BUSHING_AUDIT: 35000
};

class FleetMaintenanceLogService {
  /**
   * Evaluates vehicle roadworthiness and detects pending preventative maintenance
   */
  static assessVehicleRoadworthiness({
    vehicleRegNumber,
    vehicleType = 'MEDIUM_TRUCK_8_TON',
    odometerKm = 85000,
    lastOilChangeKm = 78000,
    lastBrakeServiceKm = 65000,
    lastTireRotationKm = 72000,
    lastReeferServiceKm = 60000,
    isRefrigerated = false
  }) {
    const kmSinceOil = Math.max(0, odometerKm - lastOilChangeKm);
    const kmSinceBrakes = Math.max(0, odometerKm - lastBrakeServiceKm);
    const kmSinceTires = Math.max(0, odometerKm - lastTireRotationKm);
    const kmSinceReefer = Math.max(0, odometerKm - lastReeferServiceKm);

    const pendingActions = [];
    let roadworthinessScore = 100;

    // 1. Engine Oil Check
    if (kmSinceOil >= MAINTENANCE_INTERVALS_KM.ENGINE_OIL_CHANGE) {
      pendingActions.push({
        component: 'ENGINE_OIL',
        severity: 'HIGH_PRIORITY_DUE',
        overdueKm: kmSinceOil - MAINTENANCE_INTERVALS_KM.ENGINE_OIL_CHANGE,
        estimatedCostNgn: 45000
      });
      roadworthinessScore -= 20;
    }

    // 2. Brake Pads Check
    if (kmSinceBrakes >= MAINTENANCE_INTERVALS_KM.BRAKE_PAD_REPLACEMENT) {
      pendingActions.push({
        component: 'BRAKE_SYSTEM',
        severity: 'CRITICAL_SAFETY_ALERT',
        overdueKm: kmSinceBrakes - MAINTENANCE_INTERVALS_KM.BRAKE_PAD_REPLACEMENT,
        estimatedCostNgn: 65000
      });
      roadworthinessScore -= 35;
    }

    // 3. Tire Rotation Check
    if (kmSinceTires >= MAINTENANCE_INTERVALS_KM.TIRE_ROTATION_AND_PRESSURE) {
      pendingActions.push({
        component: 'TIRE_ASSEMBLY',
        severity: 'MODERATE_DUE',
        overdueKm: kmSinceTires - MAINTENANCE_INTERVALS_KM.TIRE_ROTATION_AND_PRESSURE,
        estimatedCostNgn: 25000
      });
      roadworthinessScore -= 10;
    }

    // 4. Reefer Compressor Check (if refrigerated)
    if (isRefrigerated && kmSinceReefer >= MAINTENANCE_INTERVALS_KM.REEFER_COMPRESSOR_OVERHAUL) {
      pendingActions.push({
        component: 'REEFER_COMPRESSOR',
        severity: 'HIGH_COLD_CHAIN_RISK',
        overdueKm: kmSinceReefer - MAINTENANCE_INTERVALS_KM.REEFER_COMPRESSOR_OVERHAUL,
        estimatedCostNgn: 120000
      });
      roadworthinessScore -= 25;
    }

    const finalScore = Math.max(10, Math.min(100, roadworthinessScore));

    let dispatchClearance = 'APPROVED_FOR_LONG_HAUL';
    if (finalScore < 50) dispatchClearance = 'GROUNDED_SAFETY_STANDSTILL';
    else if (finalScore < 75) dispatchClearance = 'RESTRICTED_SHORT_SHUTTLE_ONLY';

    const certificatePayload = [
      vehicleRegNumber,
      odometerKm,
      finalScore,
      dispatchClearance,
      pendingActions.length
    ].join('|');

    const roadworthinessSeal = crypto.createHash('sha256').update(certificatePayload).digest('hex');

    return {
      auditCertificateId: `RW-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      vehicleRegNumber,
      vehicleType,
      odometerKm,
      roadworthinessScore: finalScore,
      dispatchClearance,
      pendingMaintenanceCount: pendingActions.length,
      pendingMaintenanceActions: pendingActions,
      totalEstimatedMaintenanceCostNgn: pendingActions.reduce((acc, a) => acc + a.estimatedCostNgn, 0),
      roadworthinessSeal,
      inspectedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  FleetMaintenanceLogService,
  MAINTENANCE_INTERVALS_KM
};
