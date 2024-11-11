const assert = require('assert');
const express = require('express');
const request = require('supertest');
const pestHeatmapRouter = require('../routes/pestHeatmapRoutes');

const app = express();
app.use(express.json());
app.use('/api/pest-heatmap', pestHeatmapRouter);

async function runTests() {
  console.log('🧪 Starting Sprint 22 Pest Infestation Heatmap REST API Integration Tests...');

  // 1. GET /api/pest-heatmap/species
  const speciesRes = await request(app).get('/api/pest-heatmap/species');
  assert.strictEqual(speciesRes.statusCode, 200);
  assert.strictEqual(speciesRes.body.success, true);
  assert.strictEqual(speciesRes.body.count, 10);
  console.log('  ✓ GET /api/pest-heatmap/species returns 10 tropical pest entomology profiles');

  // 2. GET /api/pest-heatmap/kde-surface
  const kdeRes = await request(app)
    .get('/api/pest-heatmap/kde-surface')
    .query({ pestKey: 'FALL_ARMYWORM', bandwidthKm: 185 });
  assert.strictEqual(kdeRes.statusCode, 200);
  assert.strictEqual(kdeRes.body.surface.corridorCount, 12);
  assert.strictEqual(kdeRes.body.surface.gridCells.length, 64);
  console.log('  ✓ GET /api/pest-heatmap/kde-surface returns 12 sentinel corridors and 64 KDE cells');

  // 3. GET /api/pest-heatmap/traps
  const trapsRes = await request(app).get('/api/pest-heatmap/traps');
  assert.strictEqual(trapsRes.statusCode, 200);
  assert.strictEqual(trapsRes.body.count, 4);
  assert(trapsRes.body.traps[0].phenology.activeStageCode);
  console.log('  ✓ GET /api/pest-heatmap/traps returns pheromone & light trap stations with degree-day phenology');

  // 4. POST /api/pest-heatmap/evaluate-eil
  const eilRes = await request(app)
    .post('/api/pest-heatmap/evaluate-eil')
    .send({
      pestKey: 'TUTA_ABSOLUTA',
      observedIncidencePct: 34.0,
      davisDamageScale: 6,
      expectedYieldTonsHa: 18.0,
      cropPriceNgnPerTon: 450000,
      accumulatedGddOverride: 120,
    });
  assert.strictEqual(eilRes.statusCode, 200);
  assert.strictEqual(eilRes.body.phenology.activeStageCode, 'L1_L2_EARLY_INSTAR');
  assert.strictEqual(eilRes.body.eilAnalysis.exceedsEconomicThreshold, true);
  console.log('  ✓ POST /api/pest-heatmap/evaluate-eil computes larval instar and Pedigo EIL/ET');

  // 5. POST /api/pest-heatmap/scouting-reports
  const reportRes = await request(app)
    .post('/api/pest-heatmap/scouting-reports')
    .send({
      pestSpeciesKey: 'FALL_ARMYWORM',
      hostCropKey: 'MAIZE',
      stateCode: 'KD',
      stateName: 'Kaduna',
      lgaName: 'Zaria',
      totalPlantsInspected: 100,
      infestedPlantsCount: 46,
      davisFoliarDamageScale: 7,
      dominantInstarStage: 'L1_L2_EARLY_INSTAR',
      pheromoneTrapMothsPerNight: 29,
    });
  assert.strictEqual(reportRes.statusCode, 201);
  assert.strictEqual(reportRes.body.report.scoutingProtocol.infestedPlantsIncidencePct, 46);
  assert.strictEqual(reportRes.body.report.infestationSeverityTier, 'SEVERE_OUTBREAK_SWARM');
  console.log('  ✓ POST /api/pest-heatmap/scouting-reports ingests W-pattern scouting report and computes IPM plan');

  console.log('✅ All Sprint 22 Pest Infestation Heatmap REST API integration tests passed!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
