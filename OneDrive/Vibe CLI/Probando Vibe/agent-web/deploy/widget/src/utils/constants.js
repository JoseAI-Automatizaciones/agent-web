/**
 * @file constants.js
 * @description Constantes globales del proyecto agent-web
 * @author agent-web
 */

// ===== Configuracion por defecto =====
export const DEFAULT_MODEL = 'gpt-3.5-turbo';
export const DEFAULT_MAX_TOKENS = 150;
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_LANGUAGE = 'es';

// ===== Voice Settings =====
export const DEFAULT_VOICE_RATE = 1;
export const DEFAULT_VOICE_PITCH = 1;
export const DEFAULT_VOICE_LANG = 'es-ES';

// ===== UI Settings =====
export const DEFAULT_POSITION = 'bottom-right';
export const DEFAULT_WIDTH = '360px';
export const DEFAULT_MAX_HEIGHT = '600px';

// ===== DOM Analysis =====
export const MAX_CONTEXT_TOKENS = 2000;
export const MAX_VISIBLE_TEXT_LENGTH = 10000;
export const MAX_DEPTH = 10; // Profundidad maxima de analisis del DOM

// ===== Action Types =====
export const ACTION_TYPES = {
  CLICK: 'click',
  SCROLL: 'scroll',
  FILL_INPUT: 'fillInput',
  SEARCH: 'search',
  NAVIGATE: 'navigate'
};

// ===== Status Types =====
export const STATUS_TYPES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error'
};

// ===== Message Roles =====
export const MESSAGE_ROLES = {
  USER: 'user',
  AGENT: 'agent',
  SYSTEM: 'system'
};

// ===== Storage Keys =====
export const STORAGE_KEYS = {
  API_KEY: 'agent-web-api-key',
  BACKEND_URL: 'agent-web-backend-url',
  CONFIG: 'agent-web-config',
  HISTORY: 'agent-web-history'
};

// ===== Error Messages =====
export const ERROR_MESSAGES = {
  NO_API_KEY: 'No se ha proporcionado una API key de OpenAI',
  INVALID_API_KEY: 'La API key de OpenAI no es valida',
  NO_WEB_SPEECH_API: 'El navegador no soporta Web Speech API',
  NO_MICROPHONE: 'No se ha otorgado permiso para el microfono',
  NETWORK_ERROR: 'Error de conexion de red',
  RATE_LIMIT: 'Limite de peticiones alcanzado',
  UNKNOWN_ERROR: 'Error desconocido'
};

// ===== Selectores CSS =====
export const CSS_SELECTORS = {
  FLOAT_BUTTON: 'agent-web-float-button',
  PANEL: 'agent-web-panel',
  HEADER: 'agent-web-header',
  CHAT: 'agent-web-chat',
  MESSAGE: 'agent-web-message',
  MESSAGE_USER: 'agent-web-message--user',
  MESSAGE_AGENT: 'agent-web-message--agent',
  TIMESTAMP: 'agent-web-timestamp',
  INPUT_AREA: 'agent-web-input-area',
  TEXT_INPUT: 'agent-web-text-input',
  VOICE_BUTTON: 'agent-web-voice-button',
  SEND_BUTTON: 'agent-web-send-button',
  CLOSE_BUTTON: 'agent-web-close',
  STATUS_PILL: 'agent-web-status-pill'
};

// ===== Classes para estados =====
export const STATE_CLASSES = {
  LISTENING: 'agent-web--listening',
  PROCESSING: 'agent-web--processing',
  SPEAKING: 'agent-web--speaking',
  ERROR: 'agent-web--error',
  ACTIVE: 'agent-web--active'
};
