/**
 * ==============================================================================
 * ROUTE EXPORT SERVICE - UNIT TEST SUITE
 * ==============================================================================
 */

const {
  exportRouteToGeoJSON,
  exportConsignmentsToCSV,
  generateDriverManifestText
} = require('../services/routeExportService');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  FAIL: ${message}`);
    failedTests++;
  }
}

function runExportTests() {
  console.log('\n======================================================');
  console.log('   RUNNING AGRILY ROUTE EXPORT SERVICE TESTS         ');
  console.log('======================================================\n');

  try {
    const mockRoute = {
      routeCode: 'AGR-20240702-EXPO',
      routeName: 'Northern Kaduna Produce Run',
      serviceRegion: 'Kaduna-Kano Belt',
      departureScheduledAt: new Date('2024-07-02T08:00:00Z'),
      originDepot: {
        depotName: 'Zaria Logistics Hub',
        facilityCode: 'ZAR-01',
        address: 'Old Jos Road',
        city: 'Zaria',
        contactPerson: 'Malam Ibrahim',
        contactPhone: '+2348031112233',
        location: { coordinates: [7.7198, 11.0855] }
      },
      destinationHub: {
        depotName: 'Dawanau Grain Terminal',
        facilityCode: 'KAN-01',
        address: 'Dawanau Market',
        city: 'Kano',
        contactPerson: 'Alhaji Sani',
        contactPhone: '+2348029998877',
        location: { coordinates: [8.4412, 12.0022] }
      },
      assignedVehicle: {
        registrationNumber: 'KBL-892-XA',
        vehicleType: 'box_truck',
        maxPayloadKg: 3500
      },
      stops: [
        {
          stopId: 'ST-01',
          locationName: 'Makarfi Farm Cluster',
          contactName: 'Garba Bello',
          contactPhone: '+2348011223344',
          address: 'Makarfi Gate 1',
          state: 'Kaduna',
          roadSurface: 'SECONDARY_ASPHALT',
          location: { coordinates: [7.8500, 11.3800] },
          producePayload: {
            produceName: 'Roma Plum Tomatoes',
            produceCategory: 'Vegetables',
            weightKg: 1200,
            volumeCrates: 48,
            perishabilityTier: 'HIGH',
            requiresRefrigeration: true
          },
          status: 'PENDING'
        }
      ],
      metrics: {
        totalDistanceKm: 135.5,
        estimatedDurationMinutes: 195
      }
    };

    // 1. GeoJSON Export
    const geojson = exportRouteToGeoJSON(mockRoute);
    assert(geojson.type === 'FeatureCollection', 'Exports valid GeoJSON FeatureCollection');
    assert(geojson.features.length === 4, 'Includes Origin, Farm Stop, Destination Hub, and Route LineString (4 features)');
    assert(geojson.features[0].properties.featureType === 'ORIGIN_DEPOT', 'First feature is ORIGIN_DEPOT');
    assert(geojson.features[1].properties.featureType === 'FARM_STOP', 'Second feature is FARM_STOP');
    assert(geojson.features[2].properties.featureType === 'DESTINATION_HUB', 'Third feature is DESTINATION_HUB');
    assert(geojson.features[3].geometry.type === 'LineString', 'Fourth feature is Route LineString');

    // 2. CSV Export
    const csv = exportConsignmentsToCSV(mockRoute);
    assert(csv.includes('Stop Sequence,Stop ID,Farm / Collection Name'), 'CSV includes standard column headers');
    assert(csv.includes('Makarfi Farm Cluster'), 'CSV contains farm location name');
    assert(csv.includes('Roma Plum Tomatoes'), 'CSV contains produce commodity name');
    assert(csv.includes('1200'), 'CSV contains harvest consignment weight');

    // 3. Plain Text Driver Manifest
    const manifestText = generateDriverManifestText(mockRoute);
    assert(manifestText.includes('AGR-20240702-EXPO'), 'Manifest text contains route code');
    assert(manifestText.includes('KBL-892-XA'), 'Manifest text contains vehicle plate');
    assert(manifestText.includes('Makarfi Farm Cluster'), 'Manifest text includes farm stop name');
    assert(manifestText.includes('Garba Bello'), 'Manifest text includes farmer contact name');

  } catch (err) {
    console.error('Unexpected export service test error:', err);
    failedTests++;
  }

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runExportTests();
