/**
 * @file action-engine.js
 * @description Motor de acciones para el widget agent-web
 * Ejecuta acciones seguras en el DOM basado en comandos del usuario
 * @author agent-web
 */

import { ACTION_TYPES } from '../utils/constants.js';
import { 
  getElement,
  getAllElements,
  isElementVisible,
  smoothScrollTo
} from '../utils/helpers.js';
import { 
  isSafeSelector, 
  isSafeElement, 
  isSafeUrl, 
  validateAction 
} from '../utils/security.js';
import { analyzeAction } from './llm-client.js';
import { getInteractiveElements, findElementByText } from './dom-analyzer.js';

/**
 * @typedef {Object} ActionResult
 * @property {boolean} success - Indica si la accion fue exitosa
 * @property {string=} message - Mensaje de resultado
 * @property {*=} data - Datos adicionales
 */

// Estado
let actionHistory = [];

/**
 * Ejecuta una accion validada
 * @param {string} actionType - Tipo de accion (click, scroll, search, etc.)
 * @param {Object} params - Parametros de la accion
 * @returns {Promise<ActionResult>} - Promesa con el resultado de la accion
 */
export async function executeAction(actionType, params = {}) {
  try {
    // Validar la accion
    const action = { type: actionType, params };
    const validation = validateAction(action);
    
    if (!validation.isSafe) {
      return {
        success: false,
        message: `Accion no permitida: ${validation.reason || 'Desconocido'}`
      };
    }
    
    // Ejecutar la accion correspondiente
    switch (actionType) {
      case ACTION_TYPES.CLICK:
        return await clickAction(params);
      
      case ACTION_TYPES.SCROLL:
        return await scrollAction(params);
      
      case ACTION_TYPES.FILL_INPUT:
        return await fillInputAction(params);
      
      case ACTION_TYPES.SEARCH:
        return await searchAction(params);
      
      case ACTION_TYPES.NAVIGATE:
        return await navigateAction(params);
      
      default:
        return { success: false, message: `Accion desconocida: ${actionType}` };
    }
  } catch (e) {
    console.error(`Error executing action ${actionType}:`, e);
    return {
      success: false,
      message: `Error al ejecutar la accion: ${e.message}`
    };
  }
}

/**
 * Ejecuta accion de click
 * @private
 * @param {Object} params - Parametros de la accion
 * @param {string} params.selector - Selector CSS del elemento
 * @param {string=} params.text - Texto del elemento para buscar
 * @returns {Promise<ActionResult>} - Resultado de la accion
 */
async function clickAction(params) {
  try {
    const selector = params.selector;
    const text = params.text;
    
    if (!selector && !text) {
      return { success: false, message: 'No se proporciono un selector ni texto para buscar' };
    }
    
    let element = null;
    
    // Intentar encontrar por selector
    if (selector) {
      if (!isSafeSelector(selector)) {
        return { success: false, message: 'Selector no seguro' };
      }
      
      element = getElement(selector);
    }
    
    // Intentar encontrar por texto si no se encontró por selector
    if (!element && text) {
      const elementsByText = findElementByText(text);
      
      // Filtrar elementos seguros y visibles
      const safeElements = elementsByText.filter(el => 
        isSafeElement(el) && isElementVisible(el)
      );
      
      if (safeElements.length > 0) {
        // Usar el primer elemento seguro
        element = safeElements[0];
      }
    }
    
    if (!element) {
      return { 
        success: false, 
        message: `Elemento no encontrado: ${selector || text}` 
      };
    }
    
    // Validar elemento
    if (!isSafeElement(element)) {
      return { success: false, message: 'Elemento no seguro para hacer clic' };
    }
    
    // Validar que es visible
    if (!isElementVisible(element)) {
      return { success: false, message: 'Elemento no visible' };
    }
    
    // Hacer scroll al elemento antes de hacer clic (para que sea visible)
    await smoothScrollTo(element);
    
    // Hacer clic
    element.click();
    
    // Guardar en historial
    actionHistory.push({
      type: ACTION_TYPES.CLICK,
      selector: selector || getElementSelectorForHistory(element),
      text,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      message: `Se hizo clic en: ${selector || text || element.tagName}`,
      data: { selector, text, element }
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Genera un selector simple para el historial de acciones
 * @private
 * @param {HTMLElement} element - Elemento del DOM
 * @returns {string} - Selector simple
 */
function getElementSelectorForHistory(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  if (element.className) {
    return `.${element.className.split(' ').join('.')}`;
  }
  return element.tagName.toLowerCase();
}

/**
 * Ejecuta accion de scroll
 * @private
 * @param {Object} params - Parametros de la accion
 * @param {string} params.selector - Selector CSS del elemento (opcional)
 * @param {string} params.direction - Direccion (up, down, left, right)
 * @param {number} params.amount - Cantidad de pixels (opcional)
 * @returns {Promise<ActionResult>} - Resultado de la accion
 */
async function scrollAction(params) {
  try {
    // Scroll a un elemento
    if (params.selector) {
      const selector = params.selector;
      
      if (!isSafeSelector(selector)) {
        return { success: false, message: 'Selector no seguro' };
      }
      
      const element = getElement(selector);
      
      if (!element) {
        return { success: false, message: `Elemento no encontrado: ${selector}` };
      }
      
      if (!isSafeElement(element)) {
        return { success: false, message: 'Elemento no seguro para scroll' };
      }
      
      await smoothScrollTo(element);
      
      actionHistory.push({
        type: ACTION_TYPES.SCROLL,
        selector,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        message: `Se desplazo a: ${selector}`,
        data: { selector, element }
      };
    }
    
    // Scroll en una direccion
    if (params.direction) {
      const direction = params.direction.toLowerCase();
      const amount = params.amount || 200;
      
      let scrollX = 0;
      let scrollY = 0;
      
      switch (direction) {
        case 'up':
          scrollY = -amount;
          break;
        case 'down':
          scrollY = amount;
          break;
        case 'left':
          scrollX = -amount;
          break;
        case 'right':
          scrollX = amount;
          break;
        case 'top':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          actionHistory.push({
            type: ACTION_TYPES.SCROLL,
            target: 'top',
            timestamp: Date.now()
          });
          return {
            success: true,
            message: 'Se desplazo a la parte superior',
            data: { target: 'top' }
          };
        case 'bottom':
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          actionHistory.push({
            type: ACTION_TYPES.SCROLL,
            target: 'bottom',
            timestamp: Date.now()
          });
          return {
            success: true,
            message: 'Se desplazo a la parte inferior',
            data: { target: 'bottom' }
          };
        default:
          return { success: false, message: `Direccion desconocida: ${direction}` };
      }
      
      window.scrollBy({
        left: scrollX,
        top: scrollY,
        behavior: 'smooth'
      });
      
      actionHistory.push({
        type: ACTION_TYPES.SCROLL,
        direction,
        amount,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        message: `Se desplazo ${direction} ${amount}px`,
        data: { direction, amount }
      };
    }
    
    // Scroll a la parte superior
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    actionHistory.push({
      type: ACTION_TYPES.SCROLL,
      target: 'top',
      timestamp: Date.now()
    });
    
    return {
      success: true,
      message: 'Se desplazo a la parte superior',
      data: { target: 'top' }
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Ejecuta accion de llenar input
 * @private
 * @param {Object} params - Parametros de la accion
 * @param {string} params.selector - Selector CSS del input
 * @param {string} params.value - Valor a ingresar
 * @returns {Promise<ActionResult>} - Resultado de la accion
 */
async function fillInputAction(params) {
  try {
    const selector = params.selector;
    const value = params.value;
    
    if (!selector) {
      return { success: false, message: 'No se proporciono un selector' };
    }
    
    if (!value) {
      return { success: false, message: 'No se proporciono un valor' };
    }
    
    // Validar selector
    if (!isSafeSelector(selector)) {
      return { success: false, message: 'Selector no seguro' };
    }
    
    // Buscar el elemento
    const element = getElement(selector);
    
    if (!element) {
      return { success: false, message: `Elemento no encontrado: ${selector}` };
    }
    
    // Validar que es un input seguro
    if (element.tagName.toLowerCase() === 'input') {
      if (element.type === 'password') {
        return { success: false, message: 'No se pueden llenar campos de contraseña' };
      }
      
      // Validar que no es un campo sensible
      const sensitiveTypes = ['password', 'creditcard', 'cvc', 'ssn'];
      const type = element.type.toLowerCase();
      const name = (element.name || '').toLowerCase();
      const id = (element.id || '').toLowerCase();
      
      if (sensitiveTypes.some(t => type.includes(t)) ||
          sensitiveTypes.some(t => name.includes(t)) ||
          sensitiveTypes.some(t => id.includes(t))) {
        return { success: false, message: 'No se pueden llenar campos sensibles' };
      }
    }
    
    if (element.tagName.toLowerCase() === 'textarea') {
      // OK
    } else if (element.tagName.toLowerCase() === 'select') {
      // OK
    } else {
      return { success: false, message: 'Elemento no es un input valido' };
    }
    
    // Validar elemento
    if (!isSafeElement(element)) {
      return { success: false, message: 'Elemento no seguro para llenar' };
    }
    
    // Llenar el input
    if (element.tagName.toLowerCase() === 'select') {
      // Para selects, buscar la opcion con el valor
      const option = getElement(`option[value="${value}"]`, element);
      if (option) {
        element.value = value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // Intentar con texto
        const textOption = Array.from(element.options).find(opt => 
          opt.text.trim().toLowerCase() === value.trim().toLowerCase()
        );
        if (textOption) {
          element.value = textOption.value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          return { success: false, message: `Opcion no encontrada: ${value}` };
        }
      }
    } else {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Guardar en historial
    actionHistory.push({
      type: ACTION_TYPES.FILL_INPUT,
      selector,
      value,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      message: `Se lleno el input: ${selector} con: ${value}`,
      data: { selector, value, element }
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Ejecuta accion de busqueda
 * @private
 * @param {Object} params - Parametros de la accion
 * @param {string} params.query - Termino de busqueda
 * @returns {Promise<ActionResult>} - Resultado de la accion
 */
async function searchAction(params) {
  try {
    const query = params.query;
    
    if (!query) {
      return { success: false, message: 'No se proporciono un termino de busqueda' };
    }
    
    // Buscar inputs de busqueda
    const searchInputs = getAllElements('input[type="search"], input[type="text"][name*="search"], input[type="text"][placeholder*="search"], input[type="text"][placeholder*="Search"]');
    
    if (searchInputs.length === 0) {
      return { success: false, message: 'No se encontraron inputs de busqueda' };
    }
    
    // Usar el primer input de busqueda seguro
    const safeInputs = searchInputs.filter(el => isSafeElement(el) && isElementVisible(el));
    
    if (safeInputs.length === 0) {
      return { success: false, message: 'No se encontraron inputs de busqueda seguros' };
    }
    
    const searchInput = safeInputs[0];
    
    // Validar elemento
    if (!isSafeElement(searchInput)) {
      return { success: false, message: 'Input de busqueda no seguro' };
    }
    
    // Llenar el input
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Intentar enviar el formulario
    const form = searchInput.closest('form');
    if (form) {
      if (isSafeElement(form)) {
        // No enviar automaticamente, solo informar
        actionHistory.push({
          type: ACTION_TYPES.SEARCH,
          query,
          form: true,
          timestamp: Date.now()
        });
        
        return {
          success: true,
          message: `Se busco: ${query}. Presiona Enter para enviar el formulario.`,
          data: { query, input: searchInput, form }
        };
      }
    }
    
    // Guardar en historial
    actionHistory.push({
      type: ACTION_TYPES.SEARCH,
      query,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      message: `Se busco: ${query}`,
      data: { query, input: searchInput }
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Ejecuta accion de navegacion
 * @private
 * @param {Object} params - Parametros de la accion
 * @param {string} params.url - URL a la que navegar
 * @returns {Promise<ActionResult>} - Resultado de la accion
 */
async function navigateAction(params) {
  try {
    const url = params.url;
    
    if (!url) {
      return { success: false, message: 'No se proporciono una URL' };
    }
    
    // Validar URL (solo misma origen)
    if (!isSafeUrl(url)) {
      return { success: false, message: 'Solo se permite navegar dentro del mismo sitio' };
    }
    
    // Navegar
    window.location.href = url;
    
    // Guardar en historial
    actionHistory.push({
      type: ACTION_TYPES.NAVIGATE,
      url,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      message: `Se navego a: ${url}`,
      data: { url }
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Busca un elemento por texto visible
 * @param {string} text - Texto a buscar
 * @param {string=} tag - Tag HTML a filtrar (opcional)
 * @returns {Array<HTMLElement>} - Array de elementos encontrados
 */
export function findElementsByText(text, tag = '*') {
  return findElementByText(text, tag);
}

/**
 * Ejecuta una accion basada en texto usando el LLM para analizar
 * @param {string} actionText - Texto de la accion (ej: "Haz clic en el boton")
 * @param {Object=} context - Contexto adicional para el LLM
 * @returns {Promise<ActionResult>} - Resultado de la accion
 */
export async function executeTextAction(actionText, context = {}) {
  try {
    // Usar el LLM para analizar la accion
    const analysis = await analyzeAction(actionText, context);
    
    if (!analysis.action || analysis.action === 'none') {
      return {
        success: false,
        message: analysis.response || 'No puedo realizar esa accion'
      };
    }
    
    // Si el analisis incluye una respuesta para el usuario, guardarla
    const userResponse = analysis.response || '';
    
    // Ejecutar la accion con los parametros analizados
    const result = await executeAction(analysis.action, analysis.params);
    
    // Si fue exitosa, mantener el mensaje
    if (result.success) {
      return {
        ...result,
        message: userResponse || result.message
      };
    }
    
    // Si fallo, devolver el mensaje de error
    return {
      ...result,
      message: analysis.response || result.message
    };
  } catch (e) {
    console.error('Error in executeTextAction:', e);
    return { 
      success: false, 
      message: `Error al analizar la accion: ${e.message}` 
    };
  }
}

/**
 * Obtiene el historial de acciones
 * @returns {Array<Object>} - Historial de acciones
 */
export function getActionHistory() {
  return [...actionHistory];
}

/**
 * Limpia el historial de acciones
 * @returns {void}
 */
export function clearActionHistory() {
  actionHistory = [];
}

/**
 * Verifica si una accion es segura (wrapper para seguridad)
 * @param {string} actionType - Tipo de accion
 * @param {Object} params - Parametros de la accion
 * @returns {boolean} - True si es segura
 */
export function isActionSafe(actionType, params = {}) {
  const action = { type: actionType, params };
  const validation = validateAction(action);
  return validation.isSafe;
}

/**
 * Obtiene una lista de acciones disponibles
 * @returns {Array<string>} - Lista de tipos de acciones
 */
export function getAvailableActions() {
  return Object.values(ACTION_TYPES);
}

/**
 * Limpia recursos
 * @returns {void}
 */
export function cleanup() {
  try {
    actionHistory = [];
  } catch (e) {
    console.error('Error cleaning up action engine:', e);
  }
}

// Limpiar al descargar la pagina
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}
