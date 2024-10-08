/**
 * ==============================================================================
 * 🧪 SPRINT 20 UNIT TESTS: WEATHER STATION, MICROCLIMATE & SUBSCRIPTION SCHEMAS
 * ==============================================================================
 */

const assert = require('assert');
const mongoose = require('mongoose');
const WeatherStation = require('../models/WeatherStation');
const MicroclimateReading = require('../models/MicroclimateReading');
const WeatherAlertSubscription = require('../models/WeatherAlertSubscription');

console.log('🧪 Starting WeatherStation, MicroclimateReading & Subscription Schema Unit Tests...');

// 1. WeatherStation Valid Creation & GeoJSON Virtuals
{
  const station = new WeatherStation({
    stationCode: 'AWS-JOS-1042',
    stationName: 'Jos Plateau Montane Observatory #4',
    stationType: 'Automated Weather Station (AWS)',
    stateRegion: 'Plateau',
    agroEcologicalZone: 'Mid-Altitude Montane',
    primaryCropFocus: 'Potato',
    location: {
      type: 'Point',
      coordinates: [8.8921, 9.8965]
    },
    elevationMeters: 1285,
    batteryVoltageVolts: 13.1,
    signalStrengthRssiDbm: -68
  });

  const validationErr = station.validateSync();
  assert.strictEqual(validationErr, undefined, 'Valid WeatherStation should pass validation');
  assert.strictEqual(station.coordinatesLatLng.longitude, 8.8921);
  assert.strictEqual(station.coordinatesLatLng.latitude, 9.8965);

  const pressureKpa = station.computeStandardAtmosphericPressureKpa();
  // At 1285m elevation, standard barometric pressure is ~86.8 kPa
  assert.ok(pressureKpa > 85.0 && pressureKpa < 89.0, `Expected pressure ~86.8 kPa, got ${pressureKpa}`);

  const diag = station.evaluateHardwareDiagnostics();
  assert.strictEqual(diag.batteryHealth, 'Optimal');
  assert.strictEqual(diag.linkQuality, 'Strong');
  console.log('  ✓ WeatherStation validates GeoJSON Point, elevation pressure, and hardware diagnostics');
}

// 2. WeatherStation Auto-Code Generation & Degraded Diagnostics
{
  const station = new WeatherStation({
    stationName: 'Kano Kadawa Irrigation Node',
    stateRegion: 'Kano',
    location: {
      type: 'Point',
      coordinates: [8.4312, 11.6451]
    },
    batteryVoltageVolts: 11.2,
    signalStrengthRssiDbm: -108
  });

  const err = station.validateSync();
  assert.strictEqual(err, undefined);
  assert.ok(station.stationCode.startsWith('AWS-KAN-'), `Auto stationCode should start with AWS-KAN-, got ${station.stationCode}`);

  const diag = station.evaluateHardwareDiagnostics();
  assert.strictEqual(diag.batteryHealth, 'Critical Low');
  assert.strictEqual(diag.linkQuality, 'Weak');
  console.log('  ✓ WeatherStation auto-generates stationCode and detects critical battery/signal states');
}

// 3. WeatherStation Invalid Coordinates Rejection
{
  const badStation = new WeatherStation({
    stationCode: 'AWS-BAD-01',
    stationName: 'Invalid Coords Station',
    stateRegion: 'Lagos',
    location: {
      type: 'Point',
      coordinates: [220.5, 95.2] // Out of bounds
    }
  });

  const err = badStation.validateSync();
  assert.ok(err, 'Out-of-bounds GeoJSON coordinates must trigger validation error');
  assert.ok(err.errors['location.coordinates']);
  console.log('  ✓ WeatherStation rejects out-of-bounds GeoJSON coordinates');
}

// 4. MicroclimateReading Thermodynamic Pre-Validate Hook (VPD, Dew Point, Wet Bulb, Delta-T)
{
  const stationId = new mongoose.Types.ObjectId();
  const reading = new MicroclimateReading({
    stationId,
    stationCode: 'AWS-KAN-2024',
    airTempCelsius: 32.0,
    relativeHumidityPct: 40.0,
    windSpeedKmh: 11.5,
    solarIrradianceWm2: 790
  });

  const err = reading.validateSync();
  assert.strictEqual(err, undefined, 'Valid MicroclimateReading must validate cleanly');
  assert.ok(reading.vaporPressureDeficitKpa > 2.5 && reading.vaporPressureDeficitKpa < 3.2, `Expected VPD ~2.85 kPa, got ${reading.vaporPressureDeficitKpa}`);
  assert.ok(reading.dewPointCelsius > 15.5 && reading.dewPointCelsius < 18.0, `Expected Dew Point ~16.8C, got ${reading.dewPointCelsius}`);
  assert.ok(reading.wetBulbCelsius > 20.5 && reading.wetBulbCelsius < 23.5, `Expected Wet Bulb ~22C, got ${reading.wetBulbCelsius}`);
  assert.ok(reading.deltaTCelsius > 8.5 && reading.deltaTCelsius < 11.5, `Expected Delta-T ~10C, got ${reading.deltaTCelsius}`);

  const summary = reading.getMicroclimateSummary();
  assert.strictEqual(summary.stationCode, 'AWS-KAN-2024');
  assert.strictEqual(summary.airTempCelsius, 32.0);
  console.log('  ✓ MicroclimateReading computes VPD, Dew Point, Wet-Bulb, and Delta-T automatically');
}

// 5. WeatherAlertSubscription Channel & Dispatch Audit History
{
  const sub = new WeatherAlertSubscription({
    subscriberEmail: 'amina.bello@agrily.ng',
    farmerName: 'Hajiya Amina Bello',
    phoneNumber: '+2348031234567',
    stationCode: 'AWS-JOS-1042',
    cropType: 'Potato',
    phenologyStage: 'Vegetative',
    channels: {
      pushNotification: true,
      smsGateway: true,
      whatsappBot: true,
      emailDigest: false
    },
    thresholds: {
      frostTemperatureThresholdCelsius: 2.5,
      heatwaveTemperatureThresholdCelsius: 35.0
    }
  });

  const err = sub.validateSync();
  assert.strictEqual(err, undefined);
  const activeChannels = sub.getActiveChannelsList();
  assert.deepStrictEqual(activeChannels, ['Push', 'SMS', 'WhatsApp']);

  const logEntry = sub.recordAlertDispatch({
    alertId: 'ALT-FROST-901',
    hazardType: 'RADIATIVE_FROST',
    severity: 'Critical Emergency',
    headline: 'Nocturnal radiative frost risk (1.4°C) forecasted at 04:00 WAT'
  });

  assert.strictEqual(logEntry.alertId, 'ALT-FROST-901');
  assert.strictEqual(sub.dispatchHistory.length, 1);
  assert.strictEqual(sub.dispatchHistory[0].hazardType, 'RADIATIVE_FROST');
  console.log('  ✓ WeatherAlertSubscription manages threshold rules, active channels, and dispatch audit logs');
}

console.log('✅ All WeatherStation, MicroclimateReading & Subscription Schema tests passed!');
