/**
 * @file index.js
 * @description Backend server para agent-web - Minimal version for Vercel
 * @author agent-web
 */

// ===== Configuration =====
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'.split(',');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS_PER_REQUEST) || 4000;

// Rate limit store
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW) || 60; // seconds
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

function checkRateLimit(ip) {
  const now = Date.now();
  const clientData = rateLimitStore.get(ip) || { count: 0, resetTime: now };
  
  if (now > clientData.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW * 1000 });
    return { allowed: true };
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000) 
    };
  }
  
  rateLimitStore.set(ip, { count: clientData.count + 1, resetTime: clientData.resetTime });
  return { allowed: true };
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString();
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

// ===== Request Handler =====
module.exports = async function handler(req, res) {
  // Configurar CORS headers
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Api-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Manejar OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  
  try {
    // ===== Routes =====
    
    // Health check
    if (req.method === 'GET' && req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        backend: 'agent-web'
      }));
      return;
    }
    
    // Proxy a OpenAI Chat API
    if (req.method === 'POST' && req.url === '/api/chat') {
      const rateLimit = checkRateLimit(ip);
      
      if (!rateLimit.allowed) {
        res.setHeader('Retry-After', rateLimit.retryAfter);
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Rate limit exceeded',
          code: 'IP_RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimit.retryAfter
        }));
        return;
      }
      
      const body = await parseJsonBody(req);
      
      if (!body || !body.messages || !Array.isArray(body.messages)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body: messages array required', code: 'INVALID_BODY' }));
        return;
      }
      
      const messages = body.messages || [];
      const estimatedTokens = messages.reduce((total, msg) => total + Math.ceil((msg.content || '').length / 4), 0);
      
      if (estimatedTokens > MAX_TOKENS) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Request exceeds maximum tokens: ${MAX_TOKENS}`, code: 'TOKEN_LIMIT_EXCEEDED' }));
        return;
      }
      
      const validModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'];
      const model = body.model || 'gpt-3.5-turbo';
      
      if (!validModels.includes(model)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Invalid model. Allowed: ${validModels.join(', ')}`, code: 'INVALID_MODEL' }));
        return;
      }
      
      if (!OPENAI_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'OpenAI API Key not configured', code: 'NO_API_KEY' }));
        return;
      }
       
      const openaiUrl = `${OPENAI_BASE_URL}/v1/chat/completions`;
      
      const openaiRequest = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: model,
          messages: body.messages,
          max_tokens: body.max_tokens || 150,
          temperature: body.temperature || 0.7,
          top_p: body.top_p || 1,
          frequency_penalty: body.frequency_penalty || 0,
          presence_penalty: body.presence_penalty || 0,
          stream: body.stream || false
        })
      };
      
      const response = await fetch(openaiUrl, openaiRequest);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || 'Unknown OpenAI error';
        
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: errorMessage, code: 'OPENAI_ERROR', status: response.status }));
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
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
        
        res.end();
        return;
      }
      
      const data = await response.json();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }
    
    // Ruta no encontrada
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      code: 'NOT_FOUND',
      availableEndpoints: [
        'POST /api/chat - Proxy a OpenAI Chat API',
        'GET /api/health - Health check'
      ]
    }));
    
  } catch (error) {
    console.error('Error:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message, code: 'INTERNAL_ERROR' }));
  }
};
