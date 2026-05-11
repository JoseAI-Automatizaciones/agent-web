/**
 * @file index.js
 * @description Backend server para agent-web - Proxy a OpenAI API
 * Adaptado para Vercel Serverless Functions
 * @author agent-web
 */

// ===== Request Handler para Vercel Serverless Functions =====
export default async function handler(req, res) {
  try {
    // Importar dependencias de forma lazy para evitar problemas de carga
    const { PORT, NODE_ENV, CORS_ORIGIN } = await import('./config/index.js');
    const { logger, withCors, parseJsonBody } = await import('./middleware/auth.js');
    const { checkIpRateLimit } = await import('./middleware/rate-limiter.js');
    const { chatHandler, tokensHandler } = await import('./routes/chat.js');

    // Configurar CORS headers
    res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Api-Key');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Manejar OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    // Log de la peticion
    const ip = req.socket?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    logger.info(`${req.method} ${req.url} - ${ip}`);
    
    // ===== Rutas =====
    
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
      // Validar rate limiting por IP
      const rateLimit = checkIpRateLimit(ip);
      
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
      
      await chatHandler(req, res);
      return;
    }
    
    // Generar tokens efimeros (Realtime API)
    if (req.method === 'POST' && req.url === '/api/tokens') {
      await tokensHandler(req, res);
      return;
    }
    
    // ===== Ruta no encontrada =====
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      code: 'NOT_FOUND',
      availableEndpoints: [
        'POST /api/chat - Proxy a OpenAI Chat API',
        'POST /api/tokens - Generar tokens efimeros (Realtime API)',
        'GET /api/health - Health check'
      ]
    }));
    
  } catch (error) {
    // Intentar importar logger para el error, si no, usar console.error
    try {
      const { logger } = await import('./middleware/auth.js');
      logger.error(`Error inesperado: ${error.message}`);
      logger.error(error.stack);
    } catch (e) {
      console.error(`Error inesperado: ${error.message}`);
      console.error(error.stack);
    }
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: error.message || 'Internal server error',
      code: 'INTERNAL_ERROR'
    }));
  }
}
