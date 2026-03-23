/**
 * proxy.js — Zero-dependency Anthropic API proxy
 * Node built-ins only: http, https
 *
 * Usage:
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   node proxy.js
 *
 * Listens on http://localhost:3131/api/claude
 */

import http  from 'http';
import https from 'https';

const PORT    = 3131;
const API_KEY = process.env.ANTHROPIC_API_KEY || '';

if (!API_KEY) {
  console.warn('\n⚠️  ANTHROPIC_API_KEY is not set.');
  console.warn('   export ANTHROPIC_API_KEY=sk-ant-api03-...\n');
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const server = http.createServer((req, res) => {

  // ── CORS preflight ──────────────────────────────────
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  // ── Health check ────────────────────────────────────
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, hasKey: !!API_KEY }));
  }

  // ── Proxy POST /api/claude ───────────────────────────
  if (req.method === 'POST' && req.url === '/api/claude') {
    if (!API_KEY) {
      res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set on proxy server.' }));
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const options = {
        hostname: 'api.anthropic.com',
        path:     '/v1/messages',
        method:   'POST',
        headers: {
          'Content-Type':      'application/json',
          'Content-Length':    Buffer.byteLength(body),
          'x-api-key':         API_KEY,
          'anthropic-version': '2023-06-01',
        },
      };

      const proxy = https.request(options, (upstream) => {
        let data = '';
        upstream.on('data', chunk => { data += chunk; });
        upstream.on('end', () => {
          res.writeHead(upstream.statusCode, {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          });
          res.end(data);
        });
      });

      proxy.on('error', (err) => {
        console.error('[proxy] upstream error:', err.message);
        res.writeHead(502, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      proxy.write(body);
      proxy.end();
    });

    return;
  }

  // ── 404 ─────────────────────────────────────────────
  res.writeHead(404, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`\n✅  Proxy running  →  http://localhost:${PORT}/api/claude`);
  console.log(`   API key : ${API_KEY ? '✓ set (' + API_KEY.slice(0,12) + '...)' : '✗ MISSING'}`);
  console.log(`   Health  →  http://localhost:${PORT}/health\n`);
});
