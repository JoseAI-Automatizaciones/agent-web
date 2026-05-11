/**
 * @file security.js
 * @description Validacion de seguridad para el widget agent-web
 * CRITICO: Este archivo contiene todas las validaciones de seguridad
 * @author agent-web
 */

// ===== Patrones Peligrosos =====
// Selectores que NUNCA deben ser objetivo de acciones

// Selectores CSS peligrosos (que pueden afectar elementos sensibles)
export const DANGEROUS_SELECTORS = [
  // Campos de contraseña
  'input[type="password"]',
  'input[name*="password"]',
  'input[id*="password"]',
  '[type="password"]',
  
  // Informacion financiera
  'input[name*="credit"]',
  'input[name*="card"]',
  'input[name*="cvv"]',
  'input[name*="ssn"]',
  'input[name*="social"]',
  'input[name*="security"]',
  'input[name*="pin"]',
  'input[name*="bank"]',
  'input[name*="account"]',
  '[name*="credit"]',
  '[name*="card"]',
  '[name*="cvv"]',
  
  // Formularios sensibles - usar atributos que contengan estas palabras
  'form[action*="login"]',
  'form[action*="signup"]',
  'form[action*="register"]',
  'form[action*="checkout"]',
  'form[action*="payment"]',
  'form[action*="billing"]',
  'form[action*="subscribe"]',
  'form[action*="purchase"]',
  'form[action*="auth"]',
  'form[action*="token"]',
  
  // Enlaces externos peligrosos
  'a[href^="javascript:"]',
  'a[href^="data:"]',
  'a[href^="vbscript:"]',
  'a[href^="about:"]'
];

// Palabras clave peligrosas en selectores (case insensitive)
export const DANGEROUS_KEYWORDS = [
  /password/i,
  /credit.*card/i,
  /debit.*card/i,
  /ssn/i,
  /social.*security/i,
  /cvv/i,
  /pin/i,
  /login/i,
  /signup/i,
  /register/i,
  /checkout/i,
  /payment/i,
  /billing/i,
  /subscribe/i,
  /purchase/i,
  /delete/i,
  /remove/i,
  /submit/i,
  /confirm/i,
  /verify/i,
  /auth/i,
  /token/i,
  /bank/i,
  /account/i,
  /secret/i,
  /private/i
];

// Acciones bloqueadas
export const BLOCKED_ACTIONS = [
  'submit-form',
  'fill-password',
  'click-external-link',
  'modify-content',
  'execute-script',
  'access-local-storage',
  'access-session-storage',
  'access-cookies',
  'download-file',
  'upload-file',
  'navigate-external',
  'clear-data',
  'reset-form',
  'delete-data'
];

// Tags HTML peligrosos
export const DANGEROUS_TAGS = [
  'iframe',
  'script',
  'object',
  'embed',
  'form',
  'input'
];

// Atributos HTML peligrosos
export const DANGEROUS_ATTRS = [
  'onclick',
  'onload',
  'onerror',
  'onmouseover',
  'onmouseout',
  'onkeydown',
  'onkeyup',
  'onmousedown',
  'onmouseup',
  'javascript:',
  'vbscript:',
  'data:',
  'about:'
];

// Dominios permitidos para navegacion (solo misma origen por defecto)
let allowedDomains = null;

/**
 * Configura dominios permitidos para navegacion
 * @param {Array<string>} domains - Lista de dominios permitidos
 */
export function setAllowedDomains(domains) {
  allowedDomains = domains;
}

/**
 * Obtiene los dominios permitidos
 * @returns {Array<string>}
 */
export function getAllowedDomains() {
  return allowedDomains || [];
}

// ===== Funciones de Validacion =====

/**
 * Valida si un selector CSS es seguro
 * @param {string} selector - Selector CSS a validar
 * @returns {boolean} - True si es seguro, False si no lo es
 */
export function isSafeSelector(selector) {
  if (!selector || typeof selector !== 'string') {
    return false;
  }
  
  // Convertir a minusculas para validacion case-insensitive
  const lowerSelector = selector.toLowerCase().trim();
  
  // Validar contra patrones peligrosos
  for (const pattern of DANGEROUS_SELECTORS) {
    try {
      // Crear regex para matching
      // Escapar caracteres especiales pero mantener * y []
      const regexPattern = pattern
        .replace(/[.+?^${}()|\\]/g, '\\$&') // Escapar caracteres regex
        .replace(/\*/g, '.*') // * significa "cualquier texto"
        .replace(/\x5B/g, '[') // Des-escapar [
        .replace(/\\]/g, ']'); // Des-escapar ]
      
      const regex = new RegExp(regexPattern, 'i');
      if (regex.test(lowerSelector)) {
        return false;
      }
    } catch (e) {
      // Si hay error con el regex, validar por includes simple
      if (lowerSelector.includes(pattern.toLowerCase().replace(/["']/g, ''))) {
        return false;
      }
    }
  }
  
  // Validar contra palabras clave
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (keyword.test(lowerSelector)) {
      return false;
    }
  }
  
  // Validar selectores que puedan afectar todo el documento
  const dangerousGlobalSelectors = [
    '*', // Todos los elementos
    'body',
    'html',
    'head',
    'document',
    'window'
  ];
  
  if (dangerousGlobalSelectors.some(sel => lowerSelector === sel || lowerSelector.includes(` ${sel}`))) {
    return false;
  }
  
  // Validar selectores con JavaScript
  if (/javascript:/i.test(lowerSelector)) {
    return false;
  }
  
  return true;
}

/**
 * Valida si una accion es segura
 * @param {Object} action - Objeto de accion a validar
 * @param {string} action.type - Tipo de accion
 * @param {Object} action.params - Parametros de la accion
 * @returns {boolean} - True si es seguro, False si no lo es
 */
export function isSafeAction(action) {
  if (!action || typeof action !== 'object') {
    return false;
  }
  
  // Validar tipo de accion
  if (BLOCKED_ACTIONS.includes(action.type)) {
    return false;
  }
  
  // Validar selectores en los parametros
  if (action.params && action.params.selector) {
    if (!isSafeSelector(action.params.selector)) {
      return false;
    }
  }
  
  // Validar URLs (solo misma origen o dominios permitidos)
  if (action.params && action.params.url) {
    if (!isSafeUrl(action.params.url)) {
      return false;
    }
  }
  
  // Validar valores en inputs
  if (action.params && action.params.value) {
    const dangerousValues = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /function/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    
    const valueStr = String(action.params.value);
    for (const pattern of dangerousValues) {
      if (pattern.test(valueStr)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Valida si un elemento DOM es seguro para interactuar
 * @param {HTMLElement} element - Elemento DOM a validar
 * @returns {boolean} - True si es seguro, False si no lo es
 */
export function isSafeElement(element) {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }
  
  // Validar tag name
  if (DANGEROUS_TAGS.includes(element.tagName.toLowerCase())) {
    // Permitir input si no es de tipo peligroso
    if (element.tagName.toLowerCase() === 'input') {
      const type = element.type?.toLowerCase() || '';
      const name = (element.name || '').toLowerCase();
      const id = (element.id || '').toLowerCase();
      
      // Bloquear inputs de password y campos sensibles
      if (type === 'password' || 
          type === 'file' ||
          name.includes('password') ||
          name.includes('credit') ||
          name.includes('card') ||
          name.includes('cvv') ||
          name.includes('ssn') ||
          id.includes('password') ||
          id.includes('credit') ||
          id.includes('card') ||
          id.includes('cvv')) {
        return false;
      }
    } else {
      // Bloquear otros tags peligrosos
      return false;
    }
  }
  
  // Validar attributes
  for (const attr of DANGEROUS_ATTRS) {
    for (let i = 0; i < element.attributes.length; i++) {
      const elementAttr = element.attributes[i];
      if (elementAttr.value && elementAttr.value.toLowerCase().includes(attr.toLowerCase())) {
        return false;
      }
    }
  }
  
  // Validar si el elemento esta en un formulario peligroso
  const form = element.closest('form');
  if (form) {
    const formText = (form.innerText + form.id + form.className).toLowerCase();
    for (const keyword of DANGEROUS_KEYWORDS) {
      if (keyword.test(formText)) {
        return false;
      }
    }
  }
  
  // Validar ancestors (solo 3 niveles para evitar rendimiento pobre)
  let current = element.parentElement;
  let depth = 0;
  while (current && depth < 3) {
    if (!isSafeElement(current)) {
      return false;
    }
    current = current.parentElement;
    depth++;
  }
  
  return true;
}

/**
 * Saneo de texto para prevenir XSS
 * @param {string} text - Texto a sanear
 * @returns {string} - Texto saneado
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Valida si una URL es segura (misma origen o dominios permitidos)
 * @param {string} url - URL a validar
 * @returns {boolean} - True si es segura, False si no lo es
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    // Si es URL relativa o hash, siempre es segura
    if (url.startsWith('#') || url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return true;
    }
    
    const parsedUrl = new URL(url);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    
    // Permitir misma origen
    if (parsedUrl.origin === currentOrigin) {
      return true;
    }
    
    // Permitir si esta en la lista de dominios permitidos
    const allowed = getAllowedDomains();
    if (allowed.length > 0 && allowed.includes(parsedUrl.hostname)) {
      return true;
    }
    
    // Bloquear protocolos peligrosos
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'about:'];
    if (dangerousProtocols.some(proto => url.toLowerCase().startsWith(proto))) {
      return false;
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Valida si un formulario es seguro para enviar
 * @param {HTMLFormElement} form - Formulario a validar
 * @returns {boolean} - True si es seguro, False si no lo es
 */
export function isSafeForm(form) {
  if (!form || !(form instanceof HTMLFormElement)) {
    return false;
  }
  
  const formText = (form.innerText + form.id + form.className).toLowerCase();
  
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (keyword.test(formText)) {
      return false;
    }
  }
  
  // Validar action URL
  if (form.action && !isSafeUrl(form.action)) {
    return false;
  }
  
  // Validar inputs dentro del formulario
  const inputs = form.querySelectorAll('input, textarea, select');
  for (const input of inputs) {
    if (input.type === 'password') {
      return false;
    }
    
    const name = (input.name || input.id || '').toLowerCase();
    for (const keyword of DANGEROUS_KEYWORDS) {
      if (keyword.test(name)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Valida si se puede hacer clic en un enlace
 * @param {HTMLAnchorElement} link - Enlace a validar
 * @returns {boolean} - True si es seguro, False si no lo es
 */
export function isSafeLink(link) {
  if (!link || !(link instanceof HTMLAnchorElement)) {
    return false;
  }
  
  // Validar href
  if (link.href) {
    try {
      const url = new URL(link.href);
      // Permitir misma origen o enlaces relativos
      if (!isSafeUrl(link.href)) {
        return false;
      }
    } catch (e) {
      // Si no es una URL valida, validar por prefijo
      if (link.href.startsWith('http://') || link.href.startsWith('https://')) {
        return isSafeUrl(link.href);
      }
    }
  }
  
  // Validar target
  if (link.target === '_blank' || link.target === '_new') {
    // Solo permitir _blank si es misma origen o URL segura
    if (link.href && !isSafeUrl(link.href)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Valida si un input es seguro para llenar
 * @param {HTMLInputElement|HTMLTextAreaElement} input - Input a validar
 * @returns {boolean} - True si es seguro, False si no lo es
 */
export function isSafeInput(input) {
  if (!input || !(input instanceof HTMLElement)) {
    return false;
  }
  
  // No permitir campos de contraseña
  if (input.type === 'password') {
    return false;
  }
  
  // No permitir file inputs
  if (input.type === 'file') {
    return false;
  }
  
  // Validar nombre/id/clase
  const identifier = (input.name || input.id || input.className || '').toLowerCase();
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (keyword.test(identifier)) {
      return false;
    }
  }
  
  // Validar si esta en un formulario peligroso
  const form = input.closest('form');
  if (form && !isSafeForm(form)) {
    return false;
  }
  
  return true;
}

/**
 * Funcion principal de validacion para acciones
 * @param {Object} action - Accion a validar
 * @returns {{isSafe: boolean, reason?: string}} - Resultado de la validacion
 */
export function validateAction(action) {
  const result = { isSafe: true };
  
  if (!action || typeof action !== 'object') {
    result.isSafe = false;
    result.reason = 'Accion invalida';
    return result;
  }
  
  // Validar tipo de accion
  if (BLOCKED_ACTIONS.includes(action.type)) {
    result.isSafe = false;
    result.reason = `Accion bloqueada: ${action.type}`;
    return result;
  }
  
  // Validar selector
  if (action.params && action.params.selector) {
    if (!isSafeSelector(action.params.selector)) {
      result.isSafe = false;
      result.reason = `Selector no seguro: ${action.params.selector}`;
      return result;
    }
  }
  
  // Validar URL
  if (action.params && action.params.url) {
    if (!isSafeUrl(action.params.url)) {
      result.isSafe = false;
      result.reason = `URL no segura: ${action.params.url}`;
      return result;
    }
  }
  
  // Validar valor para inputs
  if (action.params && action.params.value) {
    const dangerousValues = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /function/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    
    const valueStr = String(action.params.value);
    for (const pattern of dangerousValues) {
      if (pattern.test(valueStr)) {
        result.isSafe = false;
        result.reason = `Valor peligroso detectado`;
        return result;
      }
    }
  }
  
  return result;
}

// Inicializar dominios permitidos desde configuracion
export function initSecurity(config = {}) {
  if (config.allowedDomains && Array.isArray(config.allowedDomains)) {
    setAllowedDomains(config.allowedDomains);
  }
}
