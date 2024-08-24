/**
 * @file fleetTelematicsStreamingService.js
 * @description High-Frequency Fleet Telematics Stream & Geo-Fence Ingestion Service
 * Evaluates real-time GPS pings, speed excursions, agro-market hub geo-fences,
 * and automated gate arrival/departure milestone triggers.
 */

const crypto = require('crypto');

/**
 * Key Nigerian Agro-Commercial Hub Geo-Fences (Centroid & Radius in Metres)
 */
const AGRO_HUB_GEOFENCES = [
  {
    hubId: 'HUB-KAN-DAWANAU',
    name: 'Dawanau International Grain Market, Kano',
    latitude: 12.0622,
    longitude: 8.4419,
    radiusMetres: 2500,
    hubType: 'GRAIN_AGGREGATION_DEPOT'
  },
  {
    hubId: 'HUB-LOS-MILE12',
    name: 'Mile 12 Agricultural Perishable Market, Lagos',
    latitude: 6.6085,
    longitude: 3.3982,
    radiusMetres: 1800,
    hubType: 'METROPOLITAN_CONSUMPTION_TERMINAL'
  },
  {
    hubId: 'HUB-BEN-ZAKIBIAM',
    name: 'Zaki Biam International Yam Market, Benue',
    latitude: 7.5186,
    longitude: 9.6105,
    radiusMetres: 2200,
    hubType: 'TUBER_AGGREGATION_DEPOT'
  },
  {
    hubId: 'HUB-JOS-FARIN_GADA',
    name: 'Farin Gada Tomato & Vegetable Market, Jos',
    latitude: 9.9542,
    longitude: 8.8845,
    radiusMetres: 2000,
    hubType: 'COLD_CHAIN_PERISHABLE_DEPOT'
  },
  {
    hubId: 'HUB-IBD-BODIJA',
    name: 'Bodija Central Produce Market, Ibadan',
    latitude: 7.4332,
    longitude: 3.9056,
    radiusMetres: 1500,
    hubType: 'REGIONAL_WHOLESALE_TERMINAL'
  }
];

class FleetTelematicsStreamingService {
  /**
   * Calculates Haversine distance in metres between two coordinate pairs
   */
  static calculateDistanceMetres(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Evaluates if vehicle coordinates reside inside any registered Agro Hub Geo-fence
   */
  static evaluateHubGeofences(lat, lon) {
    for (const hub of AGRO_HUB_GEOFENCES) {
      const distance = this.calculateDistanceMetres(lat, lon, hub.latitude, hub.longitude);
      if (distance <= hub.radiusMetres) {
        return {
          insideHub: true,
          hubId: hub.hubId,
          hubName: hub.name,
          hubType: hub.hubType,
          distanceFromCentroidMetres: distance
        };
      }
    }

    return {
      insideHub: false,
      hubId: null,
      hubName: null,
      hubType: null,
      distanceFromCentroidMetres: null
    };
  }

  /**
   * Processes a live telematics telemetry packet and generates trip alerts
   */
  static ingestTelematicsPing({
    vehicleRegNumber,
    latitude,
    longitude,
    speedKmh = 0,
    cargoTempCelsius = null,
    maxPermissibleSpeedKmh = 85.0,
    temperatureControlled = false,
    maxPermissibleTemp = 10.0,
    timestamp = new Date()
  }) {
    if (!vehicleRegNumber || latitude === undefined || longitude === undefined) {
      throw new Error('vehicleRegNumber, latitude, and longitude are required.');
    }

    const geofence = this.evaluateHubGeofences(latitude, longitude);
    const alerts = [];

    // 1. Overspeed Alert (> 85 km/h for heavy trucks)
    if (speedKmh > maxPermissibleSpeedKmh) {
      alerts.push({
        type: 'SPEEDING_EXCURSION',
        severity: 'HIGH_SAFETY_RISK',
        recordedSpeedKmh: speedKmh,
        thresholdKmh: maxPermissibleSpeedKmh,
        message: `Vehicle exceeded statutory haulage speed threshold (${speedKmh} km/h > ${maxPermissibleSpeedKmh} km/h)`
      });
    }

    // 2. Cold Chain Excursion Alert
    if (temperatureControlled && cargoTempCelsius !== null) {
      if (cargoTempCelsius > maxPermissibleTemp) {
        alerts.push({
          type: 'COLD_CHAIN_TEMPERATURE_BREACH',
          severity: 'CRITICAL_PERISHABLE_SPOILAGE_RISK',
          recordedTempCelsius: cargoTempCelsius,
          thresholdTempCelsius: maxPermissibleTemp,
          message: `Reefer temperature spiked above safe threshold (${cargoTempCelsius}°C > ${maxPermissibleTemp}°C)`
        });
      }
    }

    // 3. Automated Gate Arrival Milestone
    let suggestedMilestone = null;
    if (geofence.insideHub) {
      suggestedMilestone = geofence.hubType.includes('CONSUMPTION')
        ? 'GATE_IN_DESTINATION_TERMINAL'
        : 'GATE_IN_ORIGIN_AGGREGATION';
    }

    const payload = `${vehicleRegNumber}|${latitude}|${longitude}|${speedKmh}|${alerts.length}`;
    const packetHash = crypto.createHash('sha256').update(payload).digest('hex');

    return {
      streamPacketId: `TEL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      vehicleRegNumber,
      coordinates: { latitude, longitude },
      speedKmh,
      cargoTempCelsius,
      geofenceStatus: geofence,
      alertsCount: alerts.length,
      activeAlerts: alerts,
      suggestedMilestoneEvent: suggestedMilestone,
      packetHash,
      timestamp: new Date(timestamp).toISOString()
    };
  }
}

module.exports = {
  FleetTelematicsStreamingService,
  AGRO_HUB_GEOFENCES
};
