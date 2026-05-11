/**
 * @file index.js
 * @description Backend HTTP nativo para Vercel
 * @author agent-web
 */

const http = require('http');

// Config
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

// Rate limit
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const data = rateLimitStore.get(ip) || { count: 0, resetTime: now };
  if (now > data.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + 60000 });
    return { allowed: true };
  }
  if (data.count >= 100) {
    return { allowed: false, retryAfter: Math.ceil((data.resetTime - now) / 1000) };
  }
  rateLimitStore.set(ip, { count: data.count + 1, resetTime: data.resetTime });
  return { allowed: true };
}

function getApiKey(req) {
  const h = req.headers || {};
  for (const k in h) {
    if (k.toLowerCase().includes('x-client-api-key')) {
      return h[k]?.trim();
    }
  }
  return process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
}

// Crear servidor HTTP
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Client-Api-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Parse body
  let bodyString = '';
  req.on('data', (chunk) => {
    bodyString += chunk;
  });
  
  req.on('end', async () => {
    try {
      console.log('Raw body:', bodyString);
      
      // Handle Vercel body wrapping: remove surrounding single quotes if present
      let cleanBody = bodyString.trim();
      if (cleanBody.startsWith("'") && cleanBody.endsWith("'")) {
        cleanBody = cleanBody.slice(1, -1);
      }
      
      const body = cleanBody ? JSON.parse(cleanBody) : {};
      console.log('Parsed body:', body);
      
      // Health check
      if (req.method === 'GET' && req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          backend: 'agent-web',
          supportsClientApiKey: true
        }));
        return;
      }
      
      // Chat
      if (req.method === 'POST' && req.url === '/api/chat') {
        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        const rateLimit = checkRateLimit(ip);
        if (!rateLimit.allowed) {
          res.setHeader('Retry-After', rateLimit.retryAfter);
          res.writeHead(429, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Rate limit exceeded', code: 'IP_RATE_LIMIT_EXCEEDED' }));
          return;
        }
        
        if (!body || !body.messages || !Array.isArray(body.messages)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'messages array required', code: 'INVALID_BODY' }));
          return;
        }
        
        const apiKey = getApiKey(req);
        if (!apiKey) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No API key provided', code: 'NO_API_KEY' }));
          return;
        }
        
        if (!/^(sk-|pk-|sk-proj-)[a-zA-Z0-9_-]{32,}$/.test(apiKey)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid API key format', code: 'INVALID_API_KEY_FORMAT' }));
          return;
        }
        
        const response = await fetch(`${OPENAI_BASE_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: body.model || 'gpt-3.5-turbo',
            messages: body.messages,
            max_tokens: body.max_tokens || 150,
            temperature: body.temperature || 0.7,
            top_p: body.top_p || 1,
            frequency_penalty: body.frequency_penalty || 0,
            presence_penalty: body.presence_penalty || 0,
            stream: body.stream || false
          })
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: error.error?.message || 'OpenAI error', 
            code: 'OPENAI_ERROR',
            status: response.status
          }));
          return;
        }
        
        if (body.stream) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          });
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(decoder.decode(value, { stream: true }));
          }
          res.end();
          return;
        }
        
        const data = await response.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
      }
      
      // 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found', code: 'NOT_FOUND' }));
      
    } catch (error) {
      console.error('ERROR:', error.message);
      console.error('Body string was:', bodyString);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: error.message, 
        code: 'INTERNAL_ERROR',
        rawBody: bodyString.substring(0, 200) // Include first 200 chars for debugging
      }));
    }
  });
  
  req.on('error', (error) => {
    console.error('Request error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Request error', code: 'REQUEST_ERROR' }));
  });
});

// Export para Vercel
module.exports = server;
