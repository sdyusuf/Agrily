/**
 * ==============================================================================
 * 🧪 AGRILY SPRINT 24: HYBRID RAG KNOWLEDGE GRAPH (RECIPROCAL RANK FUSION RRF)
 *    & CROSS-MODULE TELEMETRY SYNTHESIS UNIT TESTS
 * ==============================================================================
 */

const assert = require('assert');
const {
  AUTHORITATIVE_EXTENSION_BULLETIN_CORPUS,
  cosineSimilarity,
  retrieveHybridRagBulletins,
  synthesizeCrossModuleAgronomyAdvisory,
} = require('../services/ragAgronomyKnowledgeGraphEngine');

console.log(
  '🧪 Starting Sprint 24 Hybrid RAG Reciprocal Rank Fusion (RRF) & Cross-Module Synthesis Tests...'
);

// 1. Test Cosine Similarity & Authoritative Bulletin Corpus Integrity
{
  assert.strictEqual(AUTHORITATIVE_EXTENSION_BULLETIN_CORPUS.length, 12);
  const simIdentical = cosineSimilarity([1, 0, 1], [1, 0, 1]);
  const simOrthogonal = cosineSimilarity([1, 0, 0], [0, 1, 0]);
  assert.ok(Math.abs(simIdentical - 1.0) < 1e-6);
  assert.strictEqual(simOrthogonal, 0);
  console.log('  ✓ Dense vector cosine similarity & 12-bulletin extension corpus verified');
}

// 2. Test Hybrid BM25 + Dense Vector Reciprocal Rank Fusion (RRF)
{
  const fawRag = retrieveHybridRagBulletins({
    queryText: 'Tsutsar masara fall armyworm caterpillar whorl spray',
    agroEcologicalZone: 'SUDAN_SAVANNA',
    topK: 3,
  });

  assert.strictEqual(fawRag.topBulletins.length, 3);
  assert.strictEqual(fawRag.topBulletins[0].bulletinId, 'IITA-IPM-FAW-2024-01');
  assert.ok(
    fawRag.topBulletins[0].rrfScore >= fawRag.topBulletins[1].rrfScore
  );

  const picsRag = retrieveHybridRagBulletins({
    queryText: 'Cowpea wake weevil storage inside hermetic PICS bag',
    agroEcologicalZone: 'SUDAN_SAVANNA',
    topK: 3,
  });
  assert.strictEqual(picsRag.topBulletins[0].bulletinId, 'NSPRI-PICS-2024-03');
  console.log('  ✓ Hybrid BM25 + Dense Cosine Reciprocal Rank Fusion (RRF) verified');
}

// 3. Test Cross-Module Phase 3 Telemetry Context Synthesis
{
  const synthesis = synthesizeCrossModuleAgronomyAdvisory({
    utteranceText: 'Tsutsar masara da bushewar kasa a gonata a Kano',
    preferredLocale: 'ha-NG',
    parcelTelemetry: {
      ndviScore: 0.68,
      soilPh: 6.1,
      matricSuctionKpa: 52.0,
      deltaTCelsius: 4.8,
      larvalIncidencePct: 19.0,
    },
  });

  assert.strictEqual(
    synthesis.crossModuleTelemetryFlags.sprayWindowOptimal,
    true
  );
  assert.strictEqual(
    synthesis.crossModuleTelemetryFlags.irrigationRefillUrgent,
    true
  );
  assert.strictEqual(
    synthesis.crossModuleTelemetryFlags.ndviHealthStatus,
    'VIGOROUS_CANOPY'
  );
  assert.strictEqual(synthesis.rag.topBulletins.length, 3);
  console.log('  ✓ Cross-module Phase 3 telemetry context synthesis verified');
}

console.log(
  '✅ All Sprint 24 Hybrid RAG Reciprocal Rank Fusion (RRF) & Cross-Module Synthesis tests passed!'
);
