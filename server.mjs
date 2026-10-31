import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from current directory or parent directory if present (zero dependencies)
function loadDotEnv() {
  const candidates = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env'),
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx <= 0) continue;
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) {
          process.env[key] = val;
        }
      }
    } catch {
      // Ignore .env parse errors
    }
  }
}

loadDotEnv();

const PORT = Number(process.env.PORT || 8787);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 250_000) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > maxBytes) {
        reject(new Error('Request payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // 1. Gemini Agent Status endpoint
    if (req.method === 'GET' && pathname === '/api/gemini/status') {
      const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
      return sendJson(res, 200, {
        ok: true,
        model: GEMINI_MODEL,
        configured: hasServerKey,
        hasServerKey,
      });
    }

    // 2. Gemini Agent Generate endpoint
    if (req.method === 'POST' && pathname === '/api/gemini/generate') {
      const body = await readJsonBody(req);
      const apiKey = (body.apiKey || process.env.GEMINI_API_KEY || '').trim();
      if (!apiKey) {
        return sendJson(res, 400, {
          error: 'Missing GEMINI_API_KEY. Set GEMINI_API_KEY in .env or provide an API key in the workspace modal.',
        });
      }

      const promptText = String(body.userPrompt || body.prompt || '');
      const geminiBody = {
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: typeof body.temperature === 'number' ? body.temperature : 0.15,
          responseMimeType: body.responseMimeType || 'application/json',
        },
      };
      if (body.systemInstruction) {
        geminiBody.systemInstruction = { parts: [{ text: String(body.systemInstruction) }] };
      }
      if (body.responseSchema) {
        geminiBody.generationConfig.responseSchema = body.responseSchema;
      }

      const upstream = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      });

      const upstreamData = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return sendJson(res, upstream.status, {
          error: upstreamData?.error?.message || `Gemini API returned HTTP ${upstream.status}`,
        });
      }

      const text = upstreamData?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      return sendJson(res, 200, {
        ok: true,
        model: GEMINI_MODEL,
        source: `${GEMINI_MODEL} (server)`,
        text,
        data,
      });
    }

    // 3. Static file server from repository root
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return sendJson(res, 405, { error: 'Method not allowed' });
    }

    const safeRel = pathname.replace(/^\/+/, '');
    let targetPath = path.resolve(__dirname, safeRel);
    if (!targetPath.startsWith(__dirname)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(302, { Location: `${pathname}/` });
        res.end();
        return;
      }
      targetPath = path.join(targetPath, 'index.html');
    }

    if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(targetPath).pipe(res);
  } catch (err) {
    sendJson(res, 500, { error: err?.message || 'Internal server error' });
  }
});

server.listen(PORT, () => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  console.log(`\n======================================================================`);
  console.log(`  WHO Pandemic Agreement · PABS Simulation & Gemini 2.5 Flash Agent`);
  console.log(`======================================================================`);
  console.log(`  Landing page:              http://localhost:${PORT}/`);
  console.log(`  Unified v2 Workspace:      http://localhost:${PORT}/demo-v2/`);
  console.log(`  Original Negotiator App:   http://localhost:${PORT}/app/`);
  console.log(`  Original Minister's Brief: http://localhost:${PORT}/minister/`);
  console.log(`  12-Slide Proposal Deck:    http://localhost:${PORT}/proposal/`);
  console.log(`  Gemini 2.5 Flash API Key:  ${hasKey ? 'Configured (.env / env)' : 'Browser key or deterministic fallback mode'}`);
  console.log(`======================================================================\n`);
});
