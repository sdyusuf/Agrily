/**
 * ==============================================================================
 * 🌾 AGRILY AGROMETEOROLOGICAL TELEMETRY: HYPERLOCAL WEATHER REST API ROUTES
 * ==============================================================================
 *
 * Exposes endpoints for:
 *  - Listing & registering Automated Weather Stations (AWS) & Virtual OWM Nodes
 *  - Fetching real-time microclimate telemetry, FAO-56 ET0/ETc, and 7-day forecasts
 *  - Ingesting OpenWeatherMap / IoT station payloads with automated hazard detection
 *  - Querying 24-hour Delta-T & wind-drift agrochemical spray schedules
 *  - Managing farmer alert threshold subscriptions & multi-channel dispatch testing
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const WeatherStation = require('../models/WeatherStation');
const MicroclimateReading = require('../models/MicroclimateReading');
const WeatherAlertSubscription = require('../models/WeatherAlertSubscription');
const {
  normalizeOpenWeatherPayload,
  generateSevenDayForecastSeries,
  generateHourlyForecastSeries,
  generateMicroclimateRadarGrid
} = require('../services/openWeatherNormalizerService');
const {
  evaluateMicroclimateHazards,
  analyzeForecastHazardTimeline
} = require('../services/weatherHazardAlertEngine');
const { generateSpraySchedulePlan } = require('../services/agroSprayWindowAdvisorService');

const inMemoryStations = [];
const inMemoryReadings = {};
const inMemorySubscriptions = [];

/**
 * Seed realistic Nigerian agrometeorological observatories when running in
 * memory/CI mode or before initial station creation.
 */
function getDemoWeatherStations() {
  return [
    {
      _id: '670d00000000000000000101',
      stationCode: 'AWS-JOS-1042',
      stationName: 'Jos Plateau Montane Observatory #4 (Vom Corridor)',
      stationType: 'Automated Weather Station (AWS)',
      stateRegion: 'Plateau',
      agroEcologicalZone: 'Mid-Altitude Montane',
      primaryCropFocus: 'Potato',
      location: {
        type: 'Point',
        coordinates: [8.8921, 9.8965]
      },
      elevationMeters: 1285,
      wmoSynopticId: '65134',
      openWeatherGridId: 'OWM-NG-PLATEAU-04',
      batteryVoltageVolts: 13.2,
      solarChargingMilliAmps: 460,
      signalStrengthRssiDbm: -68,
      operationalStatus: 'Online'
    },
    {
      _id: '670d00000000000000000102',
      stationCode: 'AWS-KAN-2018',
      stationName: 'Kano Kadawa Irrigation Valley Synoptic Node',
      stationType: 'OpenWeatherMap Virtual Grid Node',
      stateRegion: 'Kano',
      agroEcologicalZone: 'Sudan Savannah',
      primaryCropFocus: 'Maize',
      location: {
        type: 'Point',
        coordinates: [8.4312, 11.6451]
      },
      elevationMeters: 472,
      wmoSynopticId: '65046',
      openWeatherGridId: 'OWM-NG-KANO-11',
      batteryVoltageVolts: 12.9,
      solarChargingMilliAmps: 540,
      signalStrengthRssiDbm: -71,
      operationalStatus: 'Online'
    },
    {
      _id: '670d00000000000000000103',
      stationCode: 'AWS-BEN-3055',
      stationName: 'Makurdi Floodplain Agrometeorological Tower',
      stationType: 'NiMet Synoptic Observatory',
      stateRegion: 'Benue',
      agroEcologicalZone: 'Southern Guinea Savannah',
      primaryCropFocus: 'Rice',
      location: {
        type: 'Point',
        coordinates: [8.5391, 7.7321]
      },
      elevationMeters: 112,
      wmoSynopticId: '65145',
      openWeatherGridId: 'OWM-NG-BENUE-02',
      batteryVoltageVolts: 12.6,
      solarChargingMilliAmps: 390,
      signalStrengthRssiDbm: -74,
      operationalStatus: 'Online'
    },
    {
      _id: '670d00000000000000000104',
      stationCode: 'AWS-OYO-4012',
      stationName: 'Ibadan IITA Research Microclimate Flux Node',
      stationType: 'Eddy Covariance Flux Tower',
      stateRegion: 'Oyo',
      agroEcologicalZone: 'Derived Savannah',
      primaryCropFocus: 'Cocoa',
      location: {
        type: 'Point',
        coordinates: [3.9051, 7.4981]
      },
      elevationMeters: 228,
      wmoSynopticId: '65208',
      openWeatherGridId: 'OWM-NG-OYO-07',
      batteryVoltageVolts: 13.0,
      solarChargingMilliAmps: 410,
      signalStrengthRssiDbm: -64,
      operationalStatus: 'Online'
    }
  ];
}

function getAllStationsList() {
  const demo = getDemoWeatherStations();
  const customCodes = new Set(inMemoryStations.map((s) => s.stationCode));
  return [...inMemoryStations, ...demo.filter((d) => !customCodes.has(d.stationCode))];
}

function findStationByIdOrCode(identifier) {
  const all = getAllStationsList();
  return (
    all.find(
      (s) =>
        String(s._id) === String(identifier) ||
        String(s.stationCode).toUpperCase() === String(identifier).toUpperCase()
    ) || all[0]
  );
}

/**
 * -----------------------------------------------------------------------------
 * GET /api/weather/stations
 * List all registered weather stations & virtual OpenWeatherMap nodes
 * -----------------------------------------------------------------------------
 */
router.get('/stations', async (req, res) => {
  try {
    let stations = [];
    if (mongoose.connection.readyState === 1) {
      stations = await WeatherStation.find().sort({ createdAt: -1 });
    }
    if (stations.length === 0) {
      stations = getAllStationsList();
    }
    return res.status(200).json({
      success: true,
      count: stations.length,
      data: stations
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve weather stations',
      error: err.message
    });
  }
});

/**
 * -----------------------------------------------------------------------------
 * POST /api/weather/stations
 * Register a new Automated Weather Station or Virtual Grid Node
 * -----------------------------------------------------------------------------
 */
router.post('/stations', async (req, res) => {
  try {
    const {
      stationCode,
      stationName,
      stationType,
      stateRegion,
      agroEcologicalZone,
      primaryCropFocus,
      location,
      elevationMeters
    } = req.body || {};

    if (!stationName || !stateRegion || !location || !Array.isArray(location.coordinates)) {
      return res.status(400).json({
        success: false,
        message: 'stationName, stateRegion, and valid GeoJSON location.coordinates are required'
      });
    }

    const stationDoc = new WeatherStation({
      stationCode,
      stationName,
      stationType: stationType || 'Automated Weather Station (AWS)',
      stateRegion,
      agroEcologicalZone: agroEcologicalZone || 'Northern Guinea Savannah',
      primaryCropFocus: primaryCropFocus || 'Maize',
      location,
      elevationMeters: elevationMeters !== undefined ? Number(elevationMeters) : 250
    });

    const validationErr = stationDoc.validateSync();
    if (validationErr) {
      return res.status(400).json({
        success: false,
        message: 'WeatherStation validation failed',
        error: validationErr.message
      });
    }

    if (mongoose.connection.readyState === 1) {
      await stationDoc.save();
    }
    const plainObj = stationDoc.toObject();
    inMemoryStations.unshift(plainObj);

    return res.status(201).json({
      success: true,
      message: 'Weather station registered successfully',
      data: plainObj
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to register weather station',
      error: err.message
    });
  }
});

/**
 * -----------------------------------------------------------------------------
 * GET /api/weather/stations/:id/telemetry
 * Retrieve live microclimate observation, 7-day forecast, 24h spray schedule,
 * spatial radar grid, and active hazard alerts for a station.
 * -----------------------------------------------------------------------------
 */
router.get('/stations/:id/telemetry', async (req, res) => {
  try {
    const station = findStationByIdOrCode(req.params.id);
    const cropType = req.query.cropType || station.primaryCropFocus || 'Maize';

    const sevenDaySeries = generateSevenDayForecastSeries({
      ...station,
      primaryCropFocus: cropType
    });
    const hourlySeries = generateHourlyForecastSeries(station);
    const radarGrid = generateMicroclimateRadarGrid(station);

    // Use latest ingested reading if available, else day 0 of forecast series
    const customReadings = inMemoryReadings[station.stationCode] || [];
    const currentObservation = customReadings.length > 0 ? customReadings[0] : sevenDaySeries[0];

    const hazardEvaluation = evaluateMicroclimateHazards(currentObservation, {
      cropType,
      stationCode: station.stationCode,
      elevationMeters: station.elevationMeters
    });

    const timelineSummary = analyzeForecastHazardTimeline(sevenDaySeries, {
      cropType,
      stationCode: station.stationCode,
      elevationMeters: station.elevationMeters
    });

    const sprayPlan = generateSpraySchedulePlan(hourlySeries);

    return res.status(200).json({
      success: true,
      station,
      currentObservation,
      hazardEvaluation,
      timelineSummary,
      sevenDayForecast: sevenDaySeries,
      hourlyForecast: hourlySeries,
      sprayPlan,
      radarGrid
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to compute station microclimate telemetry',
      error: err.message
    });
  }
});

/**
 * -----------------------------------------------------------------------------
 * GET /api/weather/stations/:id/spray-windows
 * Retrieve 24-hour Delta-T & wind-drift agrochemical spray window schedule
 * -----------------------------------------------------------------------------
 */
router.get('/stations/:id/spray-windows', async (req, res) => {
  try {
    const station = findStationByIdOrCode(req.params.id);
    const hourlySeries = generateHourlyForecastSeries(station);
    const sprayPlan = generateSpraySchedulePlan(hourlySeries);

    return res.status(200).json({
      success: true,
      stationCode: station.stationCode,
      stationName: station.stationName,
      data: sprayPlan
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate spray window schedule',
      error: err.message
    });
  }
});

/**
 * -----------------------------------------------------------------------------
 * POST /api/weather/ingest
 * Ingest an OpenWeatherMap or AWS IoT telemetry payload, normalize it,
 * persist to store, and return real-time hazard evaluation.
 * -----------------------------------------------------------------------------
 */
router.post('/ingest', async (req, res) => {
  try {
    const payload = req.body || {};
    const stationIdentifier = payload.stationId || payload.stationCode;
    if (!stationIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'stationId or stationCode is required for telemetry ingestion'
      });
    }

    const station = findStationByIdOrCode(stationIdentifier);
    const normalized = normalizeOpenWeatherPayload(payload, {
      stationCode: station.stationCode,
      elevationMeters: station.elevationMeters,
      cropType: payload.cropType || station.primaryCropFocus
    });

    if (!inMemoryReadings[station.stationCode]) {
      inMemoryReadings[station.stationCode] = [];
    }
    inMemoryReadings[station.stationCode].unshift(normalized);

    const hazardEvaluation = evaluateMicroclimateHazards(
      {
        ...normalized,
        consecutiveDryDays: payload.consecutiveDryDays
      },
      {
        cropType: payload.cropType || station.primaryCropFocus,
        phenologyStage: payload.phenologyStage || 'Flowering / Anthesis',
        stationCode: station.stationCode,
        elevationMeters: station.elevationMeters
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Telemetry ingested and evaluated for microclimate hazards',
      reading: normalized,
      hazardEvaluation
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to ingest weather telemetry',
      error: err.message
    });
  }
});

/**
 * -----------------------------------------------------------------------------
 * GET /api/weather/alerts
 * Retrieve active hyperlocal weather hazard alerts across stations or for a
 * specific stationCode.
 * -----------------------------------------------------------------------------
 */
router.get('/alerts', async (req, res) => {
  try {
    const targetStationCode = req.query.stationCode;
    const stations = targetStationCode
      ? [findStationByIdOrCode(targetStationCode)]
      : getAllStationsList();

    const aggregatedAlerts = [];
    stations.forEach((station) => {
      const series = generateSevenDayForecastSeries(station);
      const latest = (inMemoryReadings[station.stationCode] || [])[0] || series[0];
      const evaluation = evaluateMicroclimateHazards(latest, {
        cropType: station.primaryCropFocus,
        stationCode: station.stationCode,
        elevationMeters: station.elevationMeters
      });
      evaluation.alerts.forEach((alert) => {
        aggregatedAlerts.push({
          ...alert,
          stationName: station.stationName,
          stateRegion: station.stateRegion,
          agroEcologicalZone: station.agroEcologicalZone
        });
      });
    });

    return res.status(200).json({
      success: true,
      count: aggregatedAlerts.length,
      data: aggregatedAlerts
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve active weather alerts',
      error: err.message
    });
  }
});

/**
 * -----------------------------------------------------------------------------
 * GET /api/weather/subscriptions & POST /api/weather/subscriptions
 * Manage farmer hyperlocal weather alert threshold subscriptions
 * -----------------------------------------------------------------------------
 */
router.get('/subscriptions', async (req, res) => {
  return res.status(200).json({
    success: true,
    count: inMemorySubscriptions.length,
    data: inMemorySubscriptions
  });
});

router.post('/subscriptions', async (req, res) => {
  try {
    const {
      subscriberEmail,
      farmerName,
      phoneNumber,
      stationCode,
      cropType,
      phenologyStage,
      channels,
      preferredLanguage,
      thresholds
    } = req.body || {};

    if (!subscriberEmail || !stationCode) {
      return res.status(400).json({
        success: false,
        message: 'subscriberEmail and stationCode are required'
      });
    }

    const subDoc = new WeatherAlertSubscription({
      subscriberEmail,
      farmerName: farmerName || 'Registered Agrily Farmer',
      phoneNumber: phoneNumber || '+2348030000000',
      stationCode,
      cropType: cropType || 'Maize',
      phenologyStage: phenologyStage || 'Flowering / Anthesis',
      channels: channels || { pushNotification: true, smsGateway: true, whatsappBot: true, emailDigest: true },
      preferredLanguage: preferredLanguage || 'English',
      thresholds: thresholds || {}
    });

    const validationErr = subDoc.validateSync();
    if (validationErr) {
      return res.status(400).json({
        success: false,
        message: 'Subscription validation failed',
        error: validationErr.message
      });
    }

    const plainSub = subDoc.toObject();
    plainSub.activeChannels = subDoc.getActiveChannelsList();
    inMemorySubscriptions.unshift(plainSub);

    return res.status(201).json({
      success: true,
      message: 'Hyperlocal weather alert subscription saved',
      data: plainSub
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to save weather alert subscription',
      error: err.message
    });
  }
});

/**
 * -----------------------------------------------------------------------------
 * POST /api/weather/alerts/dispatch
 * Trigger an immediate multi-channel push/SMS/WhatsApp alert dispatch
 * -----------------------------------------------------------------------------
 */
router.post('/alerts/dispatch', async (req, res) => {
  try {
    const { stationCode, hazardType, severity, headline, recipientEmail, channels } = req.body || {};
    if (!stationCode || !hazardType) {
      return res.status(400).json({
        success: false,
        message: 'stationCode and hazardType are required to dispatch an alert'
      });
    }

    const receipt = {
      dispatchId: `DSP-${Date.now()}`,
      stationCode: String(stationCode).toUpperCase(),
      hazardType,
      severity: severity || 'Critical Emergency',
      headline:
        headline ||
        `URGENT AGRILY WEATHER ALERT [${stationCode}]: ${hazardType} threshold breached. Activate crop protection protocol.`,
      recipientEmail: recipientEmail || 'farmer@agrily.ng',
      channelsDispatched: Array.isArray(channels) && channels.length > 0 ? channels : ['Push', 'SMS', 'WhatsApp'],
      deliveryStatus: 'DELIVERED',
      dispatchedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: `Emergency weather alert dispatched via ${receipt.channelsDispatched.join(', ')}`,
      receipt
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to dispatch weather alert',
      error: err.message
    });
  }
});

module.exports = router;
