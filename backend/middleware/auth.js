/**
 * @file middleware/auth.js
 * @description Middleware de autenticacion para el backend agent-web
 * @author agent-web
 */

import { VALID_CLIENT_KEYS, LOG_LEVEL } from '../config/index.js';

// ===== Estado de Rate Limiting =====
const rateLimitStore = new Map(); // clientKey -> { count: number, resetTime: number }

// ===== Logger Simple =====
const logger = {
  debug: (message) => LOG_LEVEL === 'debug' && console.log(`[DEBUG] ${message}`),
  info: (message) => (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') && console.log(`[INFO] ${message}`),
  warn: (message) => (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info' || LOG_LEVEL === 'warn') && console.warn(`[WARN] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`)
};

/**
 * Valida si un cliente esta autorizado
 * @param {string} clientKey - API key del cliente
 * @returns {boolean}
 */
export function isValidClient(clientKey) {
  if (!clientKey) return false;
  
  // Si no hay keys validas configuradas, permitir todas (modo desarrollo)
  if (VALID_CLIENT_KEYS.length === 0) {
    logger.warn(`No VALID_CLIENT_KEYS configuradas. Permitiendo cliente: ${clientKey.substring(0, 8)}...`);
    return true;
  }
  
  return VALID_CLIENT_KEYS.includes(clientKey);
}

/**
 * Valida rate limiting para un cliente
 * @param {string} clientKey - API key del cliente
 * @returns {boolean}
 */
export function checkRateLimit(clientKey) {
  const now = Date.now();
  const { RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW } = await import('../config/index.js');
  
  const clientData = rateLimitStore.get(clientKey) || { count: 0, resetTime: now };
  
  // Reiniciar si el tiempo ha pasado
  if (now > clientData.resetTime) {
    rateLimitStore.set(clientKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  // Verificar limite
  if (clientData.count >= RATE_LIMIT_REQUESTS) {
    logger.warn(`Rate limit excedido para cliente: ${clientKey.substring(0, 8)}...`);
    return false;
  }
  
  // Incrementar contador
  rateLimitStore.set(clientKey, { 
    count: clientData.count + 1, 
    resetTime: clientData.resetTime 
  });
  
  return true;
}

/**
 * Resetea el rate limit para un cliente
 * @param {string} clientKey - API key del cliente
 */
export function resetRateLimit(clientKey) {
  rateLimitStore.delete(clientKey);
}

/**
 * Middleware de autenticacion y rate limiting
 * @param {Function} handler - Handler a proteger
 * @returns {Function}
 */
export function withAuth(handler) {
  return async (req, res) => {
    try {
      // Extraer API key del cliente
      const clientKey = req.headers['x-client-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
      
      if (!clientKey) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Client API key required',
          code: 'NO_API_KEY'
        }));
        return;
      }
      
      // Validar cliente
      if (!isValidClient(clientKey)) {
        logger.warn(`Intento de acceso con API key invalida: ${clientKey.substring(0, 8)}...`);
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Invalid client API key',
          code: 'INVALID_API_KEY'
        }));
        return;
      }
      
      // Validar rate limiting
      if (!checkRateLimit(clientKey)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((rateLimitStore.get(clientKey)?.resetTime - Date.now()) / 1000)
        }));
        return;
      }
      
      // Añadir cliente al request para uso posterior
      req.clientKey = clientKey;
      
      // Llamar al handler original
      await handler(req, res);
      
    } catch (error) {
      logger.error(`Error en autenticacion: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }));
    }
  };
}

/**
 * Middleware para CORS
 * @returns {Function}
 */
export function withCors(handler) {
  return async (req, res) => {
    const { CORS_ORIGIN, CORS_METHODS, CORS_HEADERS } = await import('../config/index.js');
    
    // Configurar headers CORS
    res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', CORS_METHODS);
    res.setHeader('Access-Control-Allow-Headers', CORS_HEADERS);
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
    
    // Manejar OPTIONS
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    // Llamar al handler original
    await handler(req, res);
  };
}

/**
 * Middleware para parsing JSON body
 * @returns {Function}
 */
export async function parseJsonBody(req) {
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

export { logger };
