/**
 * @file server.js
 * @description Servidor backend para agent-web - Proxy a OpenAI API
 * @author agent-web
 */

import http from 'node:http';
import { PORT, NODE_ENV, CORS_ORIGIN } from './config/index.js';
import { withCors, withAuth, withIpRateLimit, logger } from './middleware/auth.js';
import { chatHandler, tokensHandler } from './routes/chat.js';
import { checkIpRateLimit } from './middleware/rate-limiter.js';

// ===== Crear Servidor HTTP =====
const server = http.createServer(async (req, res) => {
  try {
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
    logger.info(`${req.method} ${req.url} - ${req.socket.remoteAddress || 'unknown'}`);
    
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
      const ip = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
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
      await withIpRateLimit(withCors(tokensHandler))(req, res);
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
    logger.error(`Error inesperado: ${error.message}`);
    logger.error(error.stack);
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }));
  }
});

// ===== Manejar errores del servidor =====
server.on('error', (error) => {
  logger.error(`Error del servidor: ${error.message}`);
  process.exit(1);
});

// ===== Manejar cierre graceful =====
process.on('SIGTERM', () => {
  logger.info('Recibida senal SIGTERM. Cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado.');
    process.exit(0);
  });
  
  // Forzar cierre despues de 30 segundos
  setTimeout(() => {
    logger.error('Cierre forzado despues de timeout.');
    process.exit(1);
  }, 30000);
});

process.on('SIGINT', () => {
  logger.info('Recibida senal SIGINT. Cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado.');
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('Cierre forzado despues de timeout.');
    process.exit(1);
  }, 30000);
});

// ===== Iniciar Servidor =====
server.listen(PORT, () => {
  logger.info(`═══════════════════════════════════════════`);
  logger.info(`🚀 Backend server de agent-web funcionando`);
  logger.info(`   Entorno: ${NODE_ENV}`);
  logger.info(`   Puerto: ${PORT}`);
  logger.info(`   URL: http://localhost:${PORT}`);
  logger.info(`═══════════════════════════════════════════`);
  logger.info('Endpoints disponibles:');
  logger.info('  POST /api/chat - Proxy a OpenAI Chat API');
  logger.info('  POST /api/tokens - Generar tokens efimeros');
  logger.info('  GET /api/health - Health check');
  logger.info(`═══════════════════════════════════════════`);
});

export default server;
