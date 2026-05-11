/**
 * @file middleware/rate-limiter.js
 * @description Rate limiting basado en IP para el backend agent-web
 * @author agent-web
 */

import { RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW } from '../config/index.js';

// ===== Estado de Rate Limiting por IP =====
const ipRateLimitStore = new Map(); // ip -> { count: number, resetTime: number }

/**
 * Limpia IPs antiguas del store
 */
function cleanupOldEntries() {
  const now = Date.now();
  const ipsToDelete = [];
  
  for (const [ip, data] of ipRateLimitStore) {
    if (now > data.resetTime) {
      ipsToDelete.push(ip);
    }
  }
  
  for (const ip of ipsToDelete) {
    ipRateLimitStore.delete(ip);
  }
}

/**
 * Verifica rate limiting para una IP
 * @param {string} ip - Direccion IP del cliente
 * @returns {Object} - { allowed: boolean, retryAfter?: number }
 */
export function checkIpRateLimit(ip) {
  const now = Date.now();
  
  // Limpiar entradas antiguas periodicamente
  if (Math.random() < 0.01) { // 1% de probabilidad de cleanup
    cleanupOldEntries();
  }
  
  const ipData = ipRateLimitStore.get(ip) || { count: 0, resetTime: now };
  
  // Reiniciar si el tiempo ha pasado
  if (now > ipData.resetTime) {
    ipRateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  
  // Verificar limite
  if (ipData.count >= RATE_LIMIT_REQUESTS) {
    const retryAfter = Math.ceil((ipData.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Incrementar contador
  ipRateLimitStore.set(ip, { 
    count: ipData.count + 1, 
    resetTime: ipData.resetTime 
  });
  
  return { allowed: true };
}

/**
 * Middleware de rate limiting por IP
 * @param {Function} handler - Handler a proteger
 * @returns {Function}
 */
export function withIpRateLimit(handler) {
  return async (req, res) => {
    try {
      // Extraer IP del cliente
      const ip = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
      
      const result = checkIpRateLimit(ip);
      
      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter);
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Rate limit exceeded',
          code: 'IP_RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter
        }));
        return;
      }
      
      // Llamar al handler original
      await handler(req, res);
      
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }));
    }
  };
}
