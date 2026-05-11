/**
 * @file helpers.js
 * @description Funciones utilitarias generales para el widget agent-web
 * @author agent-web
 */

// ===== DOM Helpers =====

/**
 * Obtiene un elemento del DOM de forma segura
 * @param {string} selector - Selector CSS
 * @param {HTMLElement=} context - Contexto (default: document)
 * @returns {HTMLElement|null} - Elemento encontrado o null
 */
export function getElement(selector, context = document) {
  if (!selector || typeof selector !== 'string') {
    return null;
  }
  
  try {
    const element = context.querySelector(selector);
    return element || null;
  } catch (e) {
    console.error(`Error getting element with selector: ${selector}`, e);
    return null;
  }
}

/**
 * Obtiene todos los elementos del DOM de forma segura
 * @param {string} selector - Selector CSS
 * @param {HTMLElement=} context - Contexto (default: document)
 * @returns {Array<HTMLElement>} - Array de elementos (vacio si no hay)
 */
export function getAllElements(selector, context = document) {
  if (!selector || typeof selector !== 'string') {
    return [];
  }
  
  try {
    const elements = context.querySelectorAll(selector);
    return Array.from(elements);
  } catch (e) {
    console.error(`Error getting elements with selector: ${selector}`, e);
    return [];
  }
}

/**
 * Verifica si un elemento existe y es visible
 * @param {HTMLElement} element - Elemento a verificar
 * @returns {boolean} - True si existe y es visible
 */
export function isElementVisible(element) {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }
  
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
}

/**
 * Espera a que un elemento este disponible en el DOM
 * @param {string} selector - Selector CSS
 * @param {number=} timeout - Timeout en ms (default: 5000)
 * @returns {Promise<HTMLElement>} - Promesa que resuelve con el elemento
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (!selector || typeof selector !== 'string') {
      reject(new Error('Invalid selector'));
      return;
    }
    
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = getElement(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`Element not found: ${selector}`));
      } else {
        requestAnimationFrame(checkElement);
      }
    };
    
    checkElement();
  });
}

/**
 * Verifica si un elemento esta en el viewport
 * @param {HTMLElement} element - Elemento a verificar
 * @returns {boolean} - True si esta en el viewport
 */
export function isInViewport(element) {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Desplaza suavemente a un elemento
 * @param {HTMLElement} element - Elemento al que desplazar
 * @param {Object=} options - Opciones de scroll
 * @returns {Promise<void>} - Promesa que resuelve cuando termina
 */
export function smoothScrollTo(element, options = {}) {
  return new Promise((resolve) => {
    if (!element || !(element instanceof HTMLElement)) {
      resolve();
      return;
    }
    
    const defaultOptions = {
      behavior: 'smooth',
      block: 'start'
    };
    
    const scrollOptions = { ...defaultOptions, ...options };
    
    element.scrollIntoView(scrollOptions);
    
    // Resolver despues de un breve timeout para asegurarnos que termino
    setTimeout(resolve, 500);
  });
}

// ===== String Helpers =====

/**
 * Trunca un texto a una longitud maxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud maxima
 * @returns {string} - Texto truncado
 */
export function truncateText(text, maxLength) {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Convierte un texto a slug (URL-friendly)
 * @param {string} text - Texto a convertir
 * @returns {string} - Slug
 */
export function toSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Capitaliza la primera letra de un texto
 * @param {string} text - Texto a capitalizar
 * @returns {string} - Texto capitalizado
 */
export function capitalizeFirstLetter(text) {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convierte un texto a mayusculas iniciales (Title Case)
 * @param {string} text - Texto a convertir
 * @returns {string} - Texto en title case
 */
export function toTitleCase(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Elimina tags HTML de un texto
 * @param {string} text - Texto con tags HTML
 * @returns {string} - Texto sin tags HTML
 */
export function stripHtml(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Escapa caracteres HTML
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Formatea un texto para que sea seguro para usar como innerHTML
 * @param {string} text - Texto a formatear
 * @returns {string} - Texto seguro
 */
export function safeHtml(text) {
  return escapeHtml(text);
}

// ===== Array Helpers =====

/**
 * Divide un array en chunks
 * @param {Array} array - Array a dividir
 * @param {number} size - Tamano de cada chunk
 * @returns {Array<Array>} - Array de chunks
 */
export function chunkArray(array, size) {
  if (!Array.isArray(array) || size <= 0) return [];
  
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Elimina elementos duplicados de un array
 * @param {Array} array - Array a filtrar
 * @returns {Array} - Array sin duplicados
 */
export function removeDuplicates(array) {
  if (!Array.isArray(array)) return [];
  return [...new Set(array)];
}

/**
 * Filtra elementos nulos o indefinidos de un array
 * @param {Array} array - Array a filtrar
 * @returns {Array} - Array filtrado
 */
export function filterNullish(array) {
  if (!Array.isArray(array)) return [];
  return array.filter(item => item != null);
}

/**
 * Aplana un array anidado
 * @param {Array} array - Array a aplanar
 * @param {number=} depth - Profundidad maxima (default: 1)
 * @returns {Array} - Array aplanado
 */
export function flattenArray(array, depth = 1) {
  if (!Array.isArray(array)) return [];
  return array.flat(depth);
}

// ===== Date Helpers =====

/**
 * Formatea una fecha como hora local
 * @param {Date|number} date - Fecha a formatear
 * @param {string=} locale - Locale (default: 'es-ES')
 * @returns {string} - Hora formateada
 */
export function formatTime(date, locale = 'es-ES') {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Formatea una fecha como fecha local
 * @param {Date|number} date - Fecha a formatear
 * @param {string=} locale - Locale (default: 'es-ES')
 * @returns {string} - Fecha formateada
 */
export function formatDate(date, locale = 'es-ES') {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formatea una fecha completa
 * @param {Date|number} date - Fecha a formatear
 * @param {string=} locale - Locale (default: 'es-ES')
 * @returns {string} - Fecha y hora formateadas
 */
export function formatDateTime(date, locale = 'es-ES') {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calcula el tiempo transcurrido desde una fecha
 * @param {Date|number} date - Fecha de inicio
 * @param {string=} locale - Locale (default: 'es-ES')
 * @returns {string} - Tiempo transcurrido formateado
 */
export function timeAgo(date, locale = 'es-ES') {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return new Intl.RelativeTimeFormat(locale).format(-interval, unit);
    }
  }
  
  return 'ahora';
}

// ===== Number Helpers =====

/**
 * Formatea un numero como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Moneda (default: 'USD')
 * @param {string=} locale - Locale (default: 'es-ES')
 * @returns {string} - Cantidad formateada
 */
export function formatCurrency(amount, currency = 'USD', locale = 'es-ES') {
  if (typeof amount !== 'number' || isNaN(amount)) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Formatea un numero con separadores de miles
 * @param {number} number - Numero a formatear
 * @param {string=} locale - Locale (default: 'es-ES')
 * @returns {string} - Numero formateado
 */
export function formatNumber(number, locale = 'es-ES') {
  if (typeof number !== 'number' || isNaN(number)) return '';
  return new Intl.NumberFormat(locale).format(number);
}

/**
 * Formatea un numero como porcentaje
 * @param {number} number - Numero a formatear (0-1)
 * @param {number=} decimals - Decimales (default: 2)
 * @param {string=} locale - Locale (default: 'es-ES')
 * @returns {string} - Porcentaje formateado
 */
export function formatPercentage(number, decimals = 2, locale = 'es-ES') {
  if (typeof number !== 'number' || isNaN(number)) return '';
  const multiplier = Math.pow(10, decimals);
  const rounded = Math.round(number * multiplier * 100) / multiplier;
  return rounded.toFixed(decimals) + '%';
}

/**
 * Redondea un numero a un numero de decimales
 * @param {number} number - Numero a redondear
 * @param {number=} decimals - Decimales (default: 2)
 * @returns {number} - Numero redondeado
 */
export function roundNumber(number, decimals = 2) {
  if (typeof number !== 'number' || isNaN(number)) return 0;
  const multiplier = Math.pow(10, decimals);
  return Math.round(number * multiplier) / multiplier;
}

// ===== Type Checking =====

/**
 * Verifica si un valor es un objeto plano
 * @param {*} value - Valor a verificar
 * @returns {boolean} - True si es un objeto plano
 */
export function isPlainObject(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Verifica si un valor es una funcion
 * @param {*} value - Valor a verificar
 * @returns {boolean} - True si es una funcion
 */
export function isFunction(value) {
  return typeof value === 'function';
}

/**
 * Verifica si un valor es una promesa
 * @param {*} value - Valor a verificar
 * @returns {boolean} - True si es una promesa
 */
export function isPromise(value) {
  return value && isFunction(value.then);
}

/**
 * Verifica si un valor es nulo o indefinido
 * @param {*} value - Valor a verificar
 * @returns {boolean} - True si es nulo o indefinido
 */
export function isNullish(value) {
  return value == null;
}

/**
 * Verifica si un valor es un string no vacio
 * @param {*} value - Valor a verificar
 * @returns {boolean} - True si es un string no vacio
 */
export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Verifica si un valor es un array no vacio
 * @param {*} value - Valor a verificar
 * @returns {boolean} - True si es un array no vacio
 */
export function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}


/**
 * Guarda un valor en localStorage
 * @param {string} key - Clave
 * @param {*} value - Valor a guardar
 * @returns {boolean} - True si se guardó correctamente
 */
export function setLocalStorage(key, value) {
  if (!key || typeof key !== 'string') return false;
  
  try {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    return true;
  } catch (e) {
    console.error(`Error saving to localStorage: ${key}`, e);
    return false;
  }
}

/**
 * Obtiene un valor de localStorage
 * @param {string} key - Clave
 * @returns {*} - Valor guardado o null
 */
export function getLocalStorage(key) {
  if (!key || typeof key !== 'string') return null;
  
  try {
    const stringValue = localStorage.getItem(key);
    return stringValue ? JSON.parse(stringValue) : null;
  } catch (e) {
    console.error(`Error reading from localStorage: ${key}`, e);
    return null;
  }
}

/**
 * Elimina un valor de localStorage
 * @param {string} key - Clave
 * @returns {boolean} - True si se eliminó correctamente
 */
export function removeLocalStorage(key) {
  if (!key || typeof key !== 'string') return false;
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`Error removing from localStorage: ${key}`, e);
    return false;
  }
}
/**
 * Guarda un valor en sessionStorage (mas seguro para datos sensibles)
 * @param {string} key - Clave
 * @param {*} value - Valor a guardar
 * @returns {boolean} - True si se guardó correctamente
 */
export function setSessionStorage(key, value) {
  if (!key || typeof key !== 'string') return false;
  
  try {
    const stringValue = JSON.stringify(value);
    sessionStorage.setItem(key, stringValue);
    return true;
  } catch (e) {
    console.error(`Error saving to sessionStorage: ${key}`, e);
    return false;
  }
}

/**
 * Obtiene un valor de sessionStorage
 * @param {string} key - Clave
 * @returns {*} - Valor guardado o null
 */
export function getSessionStorage(key) {
  if (!key || typeof key !== 'string') return null;
  
  try {
    const stringValue = sessionStorage.getItem(key);
    return stringValue ? JSON.parse(stringValue) : null;
  } catch (e) {
    console.error(`Error reading from sessionStorage: ${key}`, e);
    return null;
  }
}

/**
 * Elimina un valor de sessionStorage
 * @param {string} key - Clave
 * @returns {boolean} - True si se eliminó correctamente
 */
export function removeSessionStorage(key) {
  if (!key || typeof key !== 'string') return false;
  
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`Error removing from sessionStorage: ${key}`, e);
    return false;
  }
}

/**
 * Limpia todos los datos de storage del widget
 * @returns {void}
 */
export function clearAllStorage() {
  try {
    // Limpiar sessionStorage
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('agent-web-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    // Limpiar localStorage
    const localKeysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('agent-web-')) {
        localKeysToRemove.push(key);
      }
    }
    localKeysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.error('Error clearing storage:', e);
  }
}
// ===== Event Helpers =====

/**
 * Añade un event listener de forma segura
 * @param {HTMLElement} element - Elemento
 * @param {string} event - Nombre del evento
 * @param {Function} handler - Manejador
 * @param {Object=} options - Opciones del event listener
 * @returns {Function} - Funcion para remover el listener
 */
export function addSafeEventListener(element, event, handler, options = {}) {
  if (!element || !event || !handler) {
    return () => {};
  }
  
  element.addEventListener(event, handler, options);
  return () => {
    element.removeEventListener(event, handler, options);
  };
}

/**
 * Dispatch un evento custom
 * @param {HTMLElement} element - Elemento
 * @param {string} eventName - Nombre del evento
 * @param {Object=} detail - Detalles del evento
 * @returns {boolean} - True si el evento fue dispatchado
 */
export function dispatchCustomEvent(element, eventName, detail = {}) {
  if (!element || !eventName) return false;
  
  try {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
    return true;
  } catch (e) {
    console.error(`Error dispatching custom event: ${eventName}`, e);
    return false;
  }
}

// ===== Debounce/Throttle =====

/**
 * Crea una funcion debounced
 * @param {Function} func - Funcion a debouncear
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} - Funcion debounced
 */
export function debounce(func, wait) {
  let timeoutId = null;
  
  return function(...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Crea una funcion throttled
 * @param {Function} func - Funcion a throttlear
 * @param {number} limit - Limite de tiempo en ms
 * @returns {Function} - Funcion throttled
 */
export function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  
  return function(...args) {
    const context = this;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}
