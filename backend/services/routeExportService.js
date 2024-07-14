/**
 * ==============================================================================
 * AGRILY AGRICULTURAL LOGISTICS - ROUTE & MANIFEST EXPORT SERVICE
 * ==============================================================================
 * 
 * Module Description:
 * This module provides export and serialization utilities for optimized routes,
 * dispatch manifests, and GIS geospatial waypoints.
 * 
 * Capabilities:
 *  1. GeoJSON FeatureCollection Serialization:
 *     Transforms route waypoints and connecting polyline geometries into standard
 *     RFC 7946 GeoJSON FeatureCollections for GIS analysis and GPS device import.
 *  2. Consignment Waybill CSV Export:
 *     Generates RFC 4180 compliant CSV tables for state agricultural revenue boards,
 *     border quarantine authorities, and produce wholesale markets.
 *  3. Turn-by-Turn Driver Navigation Itinerary:
 *     Compiles plain-text and structured step-by-step driving cues with road surface
 *     notices and farmer contact details for low-connectivity rural offline access.
 * 
 * @module services/routeExportService
 */

/**
 * Serializes an optimized route instance into standard RFC 7946 GeoJSON.
 * 
 * @param {Object} route Route model or plain object
 * @returns {Object} GeoJSON FeatureCollection with points and route line
 */
function exportRouteToGeoJSON(route) {
  if (!route) throw new Error('Route data is required for GeoJSON export.');

  const features = [];

  // 1. Origin Depot Point Feature
  if (route.originDepot && route.originDepot.location) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: route.originDepot.location.coordinates
      },
      properties: {
        featureType: 'ORIGIN_DEPOT',
        name: route.originDepot.depotName,
        facilityCode: route.originDepot.facilityCode,
        address: route.originDepot.address,
        contactPerson: route.originDepot.contactPerson,
        contactPhone: route.originDepot.contactPhone,
        markerColor: '#1b4332'
      }
    });
  }

  // 2. Intermediate Farm Collection Stop Points
  const stopCoordinates = [];
  if (route.originDepot && route.originDepot.location) {
    stopCoordinates.push(route.originDepot.location.coordinates);
  }

  if (Array.isArray(route.stops)) {
    route.stops.forEach((stop, index) => {
      const coords = stop.location?.coordinates || [0, 0];
      stopCoordinates.push(coords);

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coords
        },
        properties: {
          featureType: 'FARM_STOP',
          stopSequence: index + 1,
          stopId: stop.stopId,
          farmName: stop.locationName,
          farmerName: stop.contactName,
          farmerPhone: stop.contactPhone,
          address: stop.address,
          roadSurface: stop.roadSurface || 'SECONDARY_ASPHALT',
          produceName: stop.producePayload?.produceName || '',
          weightKg: stop.producePayload?.weightKg || 0,
          cratesCount: stop.producePayload?.volumeCrates || 0,
          perishabilityTier: stop.producePayload?.perishabilityTier || 'MEDIUM',
          estimatedArrival: stop.estimatedArrival || null,
          status: stop.status || 'PENDING',
          markerColor: '#2d6a4f'
        }
      });
    });
  }

  // 3. Destination Terminal Point Feature
  if (route.destinationHub && route.destinationHub.location) {
    stopCoordinates.push(route.destinationHub.location.coordinates);
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: route.destinationHub.location.coordinates
      },
      properties: {
        featureType: 'DESTINATION_HUB',
        name: route.destinationHub.depotName,
        facilityCode: route.destinationHub.facilityCode,
        address: route.destinationHub.address,
        contactPerson: route.destinationHub.contactPerson,
        contactPhone: route.destinationHub.contactPhone,
        markerColor: '#bc6c25'
      }
    });
  }

  // 4. Connecting Route LineString Feature
  if (stopCoordinates.length >= 2) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: stopCoordinates
      },
      properties: {
        featureType: 'ROUTE_TRAJECTORY',
        routeCode: route.routeCode || '',
        routeName: route.routeName || '',
        totalDistanceKm: route.metrics?.totalDistanceKm || 0,
        estimatedDurationMinutes: route.metrics?.estimatedDurationMinutes || 0,
        strokeColor: '#2d6a4f',
        strokeWidth: 4
      }
    });
  }

  return {
    type: 'FeatureCollection',
    metadata: {
      generatedAt: new Date().toISOString(),
      routeCode: route.routeCode || '',
      serviceRegion: route.serviceRegion || '',
      totalStops: route.stops ? route.stops.length : 0
    },
    features
  };
}

/**
 * Compiles route consignment data into a CSV string.
 * Conforms to standard agricultural revenue and quarantine audit guidelines.
 * 
 * @param {Object} route Route model or object
 * @returns {string} RFC 4180 formatted CSV string
 */
function exportConsignmentsToCSV(route) {
  if (!route || !Array.isArray(route.stops)) {
    throw new Error('Valid route with stops array is required for CSV export.');
  }

  const headers = [
    'Stop Sequence',
    'Stop ID',
    'Farm / Collection Name',
    'Farmer Full Name',
    'Farmer Phone',
    'Produce Commodity',
    'Produce Category',
    'Harvest Weight (kg)',
    'Crates Count',
    'Perishability Tier',
    'Cold Chain Required',
    'Road Surface',
    'State',
    'Stop Status'
  ];

  const rows = [headers.join(',')];

  route.stops.forEach((stop, idx) => {
    const payload = stop.producePayload || {};
    const row = [
      idx + 1,
      `"${stop.stopId || ''}"`,
      `"${(stop.locationName || '').replace(/"/g, '""')}"`,
      `"${(stop.contactName || '').replace(/"/g, '""')}"`,
      `"${stop.contactPhone || ''}"`,
      `"${(payload.produceName || '').replace(/"/g, '""')}"`,
      `"${payload.produceCategory || ''}"`,
      payload.weightKg || 0,
      payload.volumeCrates || 0,
      `"${payload.perishabilityTier || 'MEDIUM'}"`,
      payload.requiresRefrigeration ? 'YES' : 'NO',
      `"${stop.roadSurface || 'SECONDARY_ASPHALT'}"`,
      `"${stop.state || ''}"`,
      `"${stop.status || 'PENDING'}"`
    ];
    rows.push(row.join(','));
  });

  return rows.join('\r\n');
}

/**
 * Formats a plain-text turn-by-turn dispatch itinerary for driver SMS or offline printout.
 * 
 * @param {Object} route Route model or object
 * @returns {string} Plain-text itinerary
 */
function generateDriverManifestText(route) {
  if (!route) return '';

  const lines = [];
  lines.push('=============================================================');
  lines.push('       🌾 AGRILY COMMERCIAL LOGISTICS DRIVER DISPATCH        ');
  lines.push('=============================================================');
  lines.push(`ROUTE CODE:      ${route.routeCode || 'N/A'}`);
  lines.push(`TITLE:           ${route.routeName || 'Untitled Route'}`);
  lines.push(`SERVICE REGION:  ${route.serviceRegion || 'Regional Corridor'}`);
  lines.push(`DEPARTURE:       ${route.departureScheduledAt ? new Date(route.departureScheduledAt).toUTCString() : 'Immediate'}`);
  lines.push('-------------------------------------------------------------');
  lines.push(`VEHICLE:         ${route.assignedVehicle?.registrationNumber || 'UNASSIGNED'} (${route.assignedVehicle?.vehicleType || 'Truck'})`);
  lines.push(`MAX PAYLOAD:     ${route.assignedVehicle?.maxPayloadKg || 3500} kg`);
  lines.push('-------------------------------------------------------------');
  lines.push(`ORIGIN DEPOT:    ${route.originDepot?.depotName || 'Depot Hub'}`);
  lines.push(`                 ${route.originDepot?.address || ''}, ${route.originDepot?.city || ''}`);
  lines.push(`                 Manager: ${route.originDepot?.contactPerson || ''} (${route.originDepot?.contactPhone || ''})`);
  lines.push('-------------------------------------------------------------');
  lines.push('COLLECTION WAYPOINTS:');

  if (Array.isArray(route.stops)) {
    route.stops.forEach((stop, i) => {
      const p = stop.producePayload || {};
      lines.push(`  [${i + 1}] ${stop.locationName}`);
      lines.push(`      Farmer:   ${stop.contactName} (${stop.contactPhone})`);
      lines.push(`      Address:  ${stop.address}, ${stop.state}`);
      lines.push(`      Road:     ${stop.roadSurface || 'Asphalt'}`);
      lines.push(`      Cargo:    ${p.weightKg || 0} kg ${p.produceName || ''} (${p.volumeCrates || 0} crates)`);
      lines.push(`      Tier:     ${p.perishabilityTier || 'MEDIUM'} Perishability`);
      lines.push('');
    });
  }

  lines.push('-------------------------------------------------------------');
  lines.push(`DESTINATION:     ${route.destinationHub?.depotName || 'Terminal Market'}`);
  lines.push(`                 ${route.destinationHub?.address || ''}, ${route.destinationHub?.city || ''}`);
  lines.push('=============================================================');

  return lines.join('\n');
}

module.exports = {
  exportRouteToGeoJSON,
  exportConsignmentsToCSV,
  generateDriverManifestText
};
