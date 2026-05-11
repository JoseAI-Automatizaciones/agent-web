/**
 * @file config.js
 * @description Configuracion por defecto del widget agent-web
 * @author agent-web
 */

// ===== Errores de Configuracion =====
export const CONFIG_ERRORS = {
  INVALID_WIDGET_POSITION: 'widgetPosition debe ser uno de: bottom-right, bottom-left, top-right, top-left',
  INVALID_VOICE_RATE: 'voiceRate debe estar entre 0.1 y 10',
  INVALID_VOICE_PITCH: 'voicePitch debe estar entre 0 y 2',
  INVALID_MAX_TOKENS: 'maxTokens debe estar entre 1 y 4000',
  INVALID_TEMPERATURE: 'temperature debe estar entre 0 y 2',
  INVALID_MODEL: 'model no es valido',
  INVALID_MAX_HISTORY_LENGTH: 'maxHistoryLength debe estar entre 1 y 100',
  INVALID_COLOR: 'color no tiene formato valido',
  INVALID_WIDTH: 'width no tiene formato valido (ej: "360px" o "80%")',
  INVALID_HEIGHT: 'maxHeight no tiene formato valido (ej: "600px" o "80vh")'
};

// ===== Configuracion General =====
export const DEFAULT_CONFIG = {
  // UI Settings
  widgetPosition: 'bottom-right',
  primaryColor: '#52d1b2',
  secondaryColor: '#07111f',
  textColor: '#ebf4ff',
  mutedColor: '#9db5d3',
  width: '360px',
  maxHeight: '600px',
  borderRadius: '16px',
  shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  
  // Voice Settings
  voiceRate: 1,
  voicePitch: 1,
  voiceLang: 'es-ES',
  autoListenOnOpen: false,
  
  // LLM Settings
  model: 'gpt-3.5-turbo',
  maxTokens: 150,
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  
  // Contexto
  language: 'es',
  systemPrompt: `Eres un asistente de voz amigable y util. 
  Tu trabajo es ayudar al usuario a interactuar con la pagina web actual. 
  Puedes responder preguntas sobre el contenido de la pagina y realizar acciones seguras 
  como hacer clic en botones, desplazarte o buscar informacion. 
  SIMPRE responde en el idioma del usuario. 
  NO inventes informacion que no este en la pagina. 
  SI no estas seguro de algo, di que no lo sabes.`,
  
  // Seguridad
  allowedActions: ['click', 'scroll', 'search'],
  blockedSelectors: [],
  allowedDomains: [], // Dominios permitidos para navegacion
  
  // Comportamiento
  autoOpen: false,
  showTimestamp: true,
  rememberHistory: true,
  maxHistoryLength: 50
};

// Modelos validos
export const VALID_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-4-32k',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-16k',
  'gpt-3.5-turbo-0613',
  'gpt-3.5-turbo-1106'
];

// Posiciones validas
export const VALID_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];

/**
 * Valida un color hexadecimal o rgb/rgba
 * @param {string} color - Color a validar
 * @returns {boolean}
 */
function isValidColor(color) {
  if (!color || typeof color !== 'string') return false;
  
  // Validar hex (3 o 6 digitos)
  const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
  if (hexRegex.test(color)) return true;
  
  // Validar rgb
  const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
  if (rgbRegex.test(color)) {
    const matches = color.match(rgbRegex);
    return matches && 
           parseInt(matches[1]) <= 255 &&
           parseInt(matches[2]) <= 255 &&
           parseInt(matches[3]) <= 255;
  }
  
  // Validar rgba
  const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/i;
  if (rgbaRegex.test(color)) {
    const matches = color.match(rgbaRegex);
    return matches &&
           parseInt(matches[1]) <= 255 &&
           parseInt(matches[2]) <= 255 &&
           parseInt(matches[3]) <= 255 &&
           parseFloat(matches[4]) >= 0 &&
           parseFloat(matches[4]) <= 1;
  }
  
  // Validar nombres de colores
  const validColorNames = ['transparent', 'inherit', 'currentColor'];
  if (validColorNames.includes(color.toLowerCase())) return true;
  
  return false;
}

/**
 * Valida un valor de dimension (px, %, vh, vw, etc.)
 * @param {string} value - Valor a validar
 * @returns {boolean}
 */
function isValidDimension(value) {
  if (!value || typeof value !== 'string') return false;
  
  // Validar formatos comunes
  const dimensionRegex = /^(\d+(\.\d+)?)(px|%|vh|vw|em|rem|pt|in|cm|mm)$/i;
  return dimensionRegex.test(value);
}

/**
 * Valida y fusiona la configuracion proporcionada con los valores por defecto
 * @param {Object} userConfig - Configuracion proporcionada por el usuario
 * @returns {Object} - Configuracion validada y fusionada
 * @throws {Error} - Si hay configuraciones invalidas
 */
export function validateConfig(userConfig = {}) {
  // Crear copia de la configuracion por defecto
  const config = { ...DEFAULT_CONFIG };
  const errors = [];
  
  // Validar y fusionar configuracion de UI
  if (userConfig.widgetPosition !== undefined) {
    if (VALID_POSITIONS.includes(userConfig.widgetPosition)) {
      config.widgetPosition = userConfig.widgetPosition;
    } else {
      errors.push(CONFIG_ERRORS.INVALID_WIDGET_POSITION);
    }
  }
  
  if (userConfig.primaryColor !== undefined) {
    if (isValidColor(userConfig.primaryColor)) {
      config.primaryColor = userConfig.primaryColor;
    } else {
      errors.push(`primaryColor: ${CONFIG_ERRORS.INVALID_COLOR}`);
    }
  }
  
  if (userConfig.secondaryColor !== undefined) {
    if (isValidColor(userConfig.secondaryColor)) {
      config.secondaryColor = userConfig.secondaryColor;
    } else {
      errors.push(`secondaryColor: ${CONFIG_ERRORS.INVALID_COLOR}`);
    }
  }
  
  if (userConfig.textColor !== undefined) {
    if (isValidColor(userConfig.textColor)) {
      config.textColor = userConfig.textColor;
    } else {
      errors.push(`textColor: ${CONFIG_ERRORS.INVALID_COLOR}`);
    }
  }
  
  if (userConfig.mutedColor !== undefined) {
    if (isValidColor(userConfig.mutedColor)) {
      config.mutedColor = userConfig.mutedColor;
    } else {
      errors.push(`mutedColor: ${CONFIG_ERRORS.INVALID_COLOR}`);
    }
  }
  
  if (userConfig.width !== undefined) {
    if (isValidDimension(userConfig.width)) {
      config.width = userConfig.width;
    } else {
      errors.push(CONFIG_ERRORS.INVALID_WIDTH);
    }
  }
  
  if (userConfig.maxHeight !== undefined) {
    if (isValidDimension(userConfig.maxHeight)) {
      config.maxHeight = userConfig.maxHeight;
    } else {
      errors.push(CONFIG_ERRORS.INVALID_HEIGHT);
    }
  }
  
  // Validar y fusionar configuracion de voz
  if (userConfig.voiceRate !== undefined) {
    const rate = Number(userConfig.voiceRate);
    if (!isNaN(rate) && rate >= 0.1 && rate <= 10) {
      config.voiceRate = rate;
    } else {
      errors.push(CONFIG_ERRORS.INVALID_VOICE_RATE);
    }
  }
  
  if (userConfig.voicePitch !== undefined) {
    const pitch = Number(userConfig.voicePitch);
    if (!isNaN(pitch) && pitch >= 0 && pitch <= 2) {
      config.voicePitch = pitch;
    } else {
      errors.push(CONFIG_ERRORS.INVALID_VOICE_PITCH);
    }
  }
  
  if (userConfig.voiceLang) {
    config.voiceLang = userConfig.voiceLang;
  }
  
  if (userConfig.autoListenOnOpen !== undefined) {
    config.autoListenOnOpen = Boolean(userConfig.autoListenOnOpen);
  }
  
  // Validar y fusionar configuracion de LLM
  if (userConfig.model) {
    if (VALID_MODELS.includes(userConfig.model)) {
      config.model = userConfig.model;
    } else {
      errors.push(`${CONFIG_ERRORS.INVALID_MODEL}: ${userConfig.model}`);
    }
  }
  
  if (userConfig.maxTokens !== undefined) {
    const tokens = Number(userConfig.maxTokens);
    if (!isNaN(tokens) && tokens >= 1 && tokens <= 4000) {
      config.maxTokens = Math.round(tokens);
    } else {
      errors.push(CONFIG_ERRORS.INVALID_MAX_TOKENS);
    }
  }
  
  if (userConfig.temperature !== undefined) {
    const temp = Number(userConfig.temperature);
    if (!isNaN(temp) && temp >= 0 && temp <= 2) {
      config.temperature = temp;
    } else {
      errors.push(CONFIG_ERRORS.INVALID_TEMPERATURE);
    }
  }
  
  if (userConfig.topP !== undefined) {
    const topP = Number(userConfig.topP);
    if (!isNaN(topP) && topP >= 0 && topP <= 1) {
      config.topP = topP;
    }
  }
  
  if (userConfig.frequencyPenalty !== undefined) {
    const fp = Number(userConfig.frequencyPenalty);
    if (!isNaN(fp) && fp >= -2 && fp <= 2) {
      config.frequencyPenalty = fp;
    }
  }
  
  if (userConfig.presencePenalty !== undefined) {
    const pp = Number(userConfig.presencePenalty);
    if (!isNaN(pp) && pp >= -2 && pp <= 2) {
      config.presencePenalty = pp;
    }
  }
  
  // Validar y fusionar configuracion de contexto
  if (userConfig.language) {
    config.language = userConfig.language;
  }
  
  if (userConfig.systemPrompt) {
    config.systemPrompt = userConfig.systemPrompt;
  }
  
  // Validar y fusionar configuracion de seguridad
  if (userConfig.allowedActions) {
    if (Array.isArray(userConfig.allowedActions)) {
      config.allowedActions = userConfig.allowedActions;
    } else {
      console.warn('allowedActions debe ser un array');
    }
  }
  
  if (userConfig.blockedSelectors) {
    if (Array.isArray(userConfig.blockedSelectors)) {
      config.blockedSelectors = [
        ...config.blockedSelectors,
        ...userConfig.blockedSelectors
      ];
    } else {
      console.warn('blockedSelectors debe ser un array');
    }
  }
  
  if (userConfig.allowedDomains) {
    if (Array.isArray(userConfig.allowedDomains)) {
      config.allowedDomains = userConfig.allowedDomains;
    } else {
      console.warn('allowedDomains debe ser un array');
    }
  }
  
  // Validar y fusionar configuracion de comportamiento
  if (userConfig.autoOpen !== undefined) {
    config.autoOpen = Boolean(userConfig.autoOpen);
  }
  
  if (userConfig.showTimestamp !== undefined) {
    config.showTimestamp = Boolean(userConfig.showTimestamp);
  }
  
  if (userConfig.rememberHistory !== undefined) {
    config.rememberHistory = Boolean(userConfig.rememberHistory);
  }
  
  if (userConfig.maxHistoryLength !== undefined) {
    const maxHistory = Number(userConfig.maxHistoryLength);
    if (!isNaN(maxHistory) && maxHistory >= 1 && maxHistory <= 100) {
      config.maxHistoryLength = Math.round(maxHistory);
    } else {
      errors.push(CONFIG_ERRORS.INVALID_MAX_HISTORY_LENGTH);
    }
  }
  
  // Validar backendUrl
  if (userConfig.backendUrl !== undefined) {
    try {
      const url = new URL(userConfig.backendUrl);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        config.backendUrl = userConfig.backendUrl;
      } else {
        errors.push('backendUrl debe ser una URL valida con protocolo http o https');
      }
    } catch (e) {
      errors.push('backendUrl debe ser una URL valida');
    }
  }
  
  // Si hay errores, lanzarlos
  if (errors.length > 0) {
    const errorMessage = `Errores de configuracion:\n${errors.map(e => `  - ${e}`).join('\n')}`;
    console.error(errorMessage);
    // No lanzar error, solo loguear (para no romper el widget)
    // throw new Error(errorMessage);
  }
  
  return config;
}

/**
 * Obtiene la configuracion actual del widget
 * @returns {Object} - Configuracion actual
 */
export function getConfig() {
  return { ...DEFAULT_CONFIG };
}

/**
 * Obtiene los modelos validos
 * @returns {Array<string>}
 */
export function getValidModels() {
  return [...VALID_MODELS];
}

/**
 * Obtiene las posiciones validas
 * @returns {Array<string>}
 */
export function getValidPositions() {
  return [...VALID_POSITIONS];
}
