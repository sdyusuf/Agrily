/**
 * ==============================================================================
 * 🧪 AGRILY SPRINT 24: MULTILINGUAL AGRONOMY CHATBOT REST API ROUTES UNIT TESTS
 * ==============================================================================
 */

const assert = require('assert');
const express = require('express');
const http = require('http');
const agronomyChatbotRoutes = require('../routes/agronomyChatbotRoutes');

console.log(
  '🧪 Starting Sprint 24 Multilingual Agronomy Chatbot REST API Route Tests...'
);

const app = express();
app.use(express.json());
app.use('/api/agronomy-chatbot', agronomyChatbotRoutes);

function requestJson(server, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  const server = app.listen(0);
  try {
    // 1. GET /api/agronomy-chatbot/sessions
    const sesRes = await requestJson(
      server,
      'GET',
      '/api/agronomy-chatbot/sessions'
    );
    assert.strictEqual(sesRes.status, 200);
    assert.strictEqual(sesRes.data.success, true);
    assert.ok(sesRes.data.sessions.length >= 2);
    console.log('  ✓ GET /api/agronomy-chatbot/sessions verified');

    // 2. GET /api/agronomy-chatbot/glossary
    const glsRes = await requestJson(
      server,
      'GET',
      '/api/agronomy-chatbot/glossary'
    );
    assert.strictEqual(glsRes.status, 200);
    assert.strictEqual(glsRes.data.success, true);
    assert.ok(glsRes.data.glossary.length >= 3);
    console.log('  ✓ GET /api/agronomy-chatbot/glossary verified');

    // 3. POST /api/agronomy-chatbot/message
    const msgRes = await requestJson(
      server,
      'POST',
      '/api/agronomy-chatbot/message',
      {
        utteranceText: 'Tsutsar masara tana cin ganyen masara a Kano',
        preferredLocale: 'ha-NG',
      }
    );
    assert.strictEqual(msgRes.status, 200);
    assert.strictEqual(msgRes.data.success, true);
    assert.strictEqual(
      msgRes.data.nluResponse.detectedIntent,
      'PEST_IPM_AND_FALL_ARMYWORM'
    );
    console.log('  ✓ POST /api/agronomy-chatbot/message verified');

    // 4. POST /api/agronomy-chatbot/voice-transcribe
    const voiceRes = await requestJson(
      server,
      'POST',
      '/api/agronomy-chatbot/voice-transcribe',
      {
        localeCode: 'yo-NG',
        audioDurationSeconds: 12.0,
        signalToNoiseRatioDb: 22.0,
      }
    );
    assert.strictEqual(voiceRes.status, 200);
    assert.strictEqual(voiceRes.data.success, true);
    assert.strictEqual(voiceRes.data.voiceResult.localeCode, 'yo-NG');
    console.log('  ✓ POST /api/agronomy-chatbot/voice-transcribe verified');

    // 5. POST /api/agronomy-chatbot/ussd-session
    const ussdRes = await requestJson(
      server,
      'POST',
      '/api/agronomy-chatbot/ussd-session',
      {
        serviceCode: '*347*24#',
        sessionId: 'USSD-TEST-01',
        text: '1*1',
      }
    );
    assert.strictEqual(ussdRes.status, 200);
    assert.strictEqual(ussdRes.data.ussdResult.sessionState, 'END');
    assert.strictEqual(ussdRes.data.ussdResult.localeCode, 'ha-NG');
    console.log('  ✓ POST /api/agronomy-chatbot/ussd-session verified');

    console.log(
      '✅ All Sprint 24 Multilingual Agronomy Chatbot REST API route tests passed!'
    );
  } finally {
    server.close();
  }
})();
