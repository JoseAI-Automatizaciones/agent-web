/**
 * @file config/index.js
 * @description Configuracion del backend server
 * @author agent-web
 */

export const PORT = process.env.PORT || 3002;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
export const CORS_METHODS = process.env.CORS_METHODS || 'GET, POST, OPTIONS, PUT, DELETE';
export const CORS_HEADERS = process.env.CORS_HEADERS || 'Content-Type, Authorization, X-Client-Api-Key';

// OpenAI / OpenRouter Configuration
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
export const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION || null;
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

// Rate Limiting
export const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW) || 60; // segundos
export const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

// Token limits
export const MAX_TOKENS_PER_REQUEST = parseInt(process.env.MAX_TOKENS_PER_REQUEST) || 4000;

// Clientes autorizados (API keys de usuarios del frontend)
// En produccion, esto deberia venir de una base de datos
export const VALID_CLIENT_KEYS = process.env.VALID_CLIENT_KEYS?.split(',') || [];

// Logging
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
