/**
 * @file index.js
 * @description Punto de entrada principal del widget agent-web
 * Este archivo inicializa y exporta el widget para su uso en paginas web
 * @author agent-web
 */

import { init as initWidget, destroy } from './ui/widget.js';
import { setApiKey, getApiKey, clearApiKey, setBackendUrl, getBackendUrl } from './core/llm-client.js';
import { validateConfig } from './core/config.js';

/**
 * @typedef {Object} WebAgent
 * @property {Function} init - Inicializa el widget
 * @property {Function} destroy - Destruye el widget
 * @property {Function} open - Abre el panel del widget
 * @property {Function} close - Cierra el panel del widget
 * @property {Function} toggle - Alterna el panel
 * @property {Function} setApiKey - Configura la API key de OpenAI
 * @property {Function} getApiKey - Obtiene la API key actual
 * @property {Function} clearApiKey - Limpia la API key
 * @property {Function} setBackendUrl - Configura la URL del backend proxy
 * @property {Function} getBackendUrl - Obtiene la URL del backend proxy
 * @property {Function} setConfig - Configura el widget
 * @property {Function} sendMessage - Envía un mensaje al LLM
 * @property {Function} startListening - Inicia reconocimiento de voz
 * @property {Function} stopListening - Detiene reconocimiento de voz
 * @property {Function} addMessage - Añade un mensaje manualmente al chat
 */

// Instancia del widget
let widgetInstance = null;

/**
 * Inicializa el widget agent-web
 * @param {Object} config - Configuracion del widget
 * @param {string} config.apiKey - API key de OpenAI
 * @param {string=} config.backendUrl - URL del backend proxy (opcional, evita CORS)
 * @param {string=} config.widgetPosition - Posicion del boton flotante
 * @param {Function=} onOpen - Callback cuando se abre el widget
 * @param {Function=} onClose - Callback cuando se cierra el widget
 * @param {Function=} onError - Callback cuando hay un error
 * @returns {WebAgent} - Instancia del widget
 */
function init(config = {}, onOpen = null, onClose = null, onError = null) {
  try {
    // Validar configuracion
    const validatedConfig = validateConfig(config);
    
    // Configurar API key si se proporciona
    if (validatedConfig.apiKey) {
      setApiKey(validatedConfig.apiKey);
    }
    
    // Configurar backend URL si se proporciona
    if (validatedConfig.backendUrl) {
      setBackendUrl(validatedConfig.backendUrl);
    }
    
    // Inicializar el widget
    widgetInstance = initWidget(validatedConfig, onOpen, onClose, onError);
    
    // Devolver la API publica
    return {
      /**
       * Abre el panel del widget
       */
      open: () => {
        if (widgetInstance) widgetInstance.open();
      },
      
      /**
       * Cierra el panel del widget
       */
      close: () => {
        if (widgetInstance) widgetInstance.close();
      },
      
      /**
       * Alterna el panel (abre/ciierra)
       */
      toggle: () => {
        if (widgetInstance) widgetInstance.toggle();
      },
      
      /**
       * Configura la API key de OpenAI
       * @param {string} key - API key de OpenAI
       */
      setApiKey: (key) => {
        setApiKey(key);
      },
      
      /**
       * Configura la URL del backend proxy
       * @param {string} url - URL del backend (ej: 'http://localhost:3002')
       */
      setBackendUrl: (url) => {
        setBackendUrl(url);
      },
      
      /**
       * Obtiene la API key actual
       * @returns {string|null}
       */
      getApiKey: () => {
        return getApiKey();
      },
      
      /**
       * Obtiene la URL del backend proxy
       * @returns {string|null}
       */
      getBackendUrl: () => {
        return getBackendUrl();
      },
      
      /**
       * Limpia la API key
       */
      clearApiKey: () => {
        clearApiKey();
      },
      
      /**
       * Configura el widget
       * @param {Object} newConfig - Nueva configuracion
       */
      setConfig: (newConfig) => {
        if (widgetInstance) {
          widgetInstance.setConfig(newConfig);
        }
      },
      
      /**
       * Envía un mensaje al LLM
       * @param {string} message - Mensaje a enviar
       */
      sendMessage: (message) => {
        if (widgetInstance) {
          widgetInstance.sendMessage(message);
        }
      },
      
      /**
       * Inicia el reconocimiento de voz
       */
      startListening: () => {
        if (widgetInstance) {
          widgetInstance.startListening();
        }
      },
      
      /**
       * Detiene el reconocimiento de voz
       */
      stopListening: () => {
        if (widgetInstance) {
          widgetInstance.stopListening();
        }
      },
      
      /**
       * Obtiene el estado actual del widget
       * @returns {Object}
       */
      getState: () => {
        if (widgetInstance) {
          return widgetInstance.getState();
        }
        return {};
      },
      
      /**
       * Añade un mensaje manualmente al chat
       * @param {string} role - Rol del mensaje (user, agent, system)
       * @param {string} content - Contenido del mensaje
       */
      addMessage: (role, content) => {
        if (widgetInstance) {
          widgetInstance.addMessage(role, content);
        }
      },
      
      /**
       * Destruye el widget
       */
      destroy: () => {
        destroyWidget();
      }
    };
  } catch (e) {
    console.error('Error initializing WebAgent:', e);
    throw e;
  }
}

/**
 * Inicializa el widget automaticamente si el script tiene atributos data-
 * @private
 * @returns {void}
 */
function autoInit() {
  try {
    // Verificar si el script tiene atributos data-
    const scripts = document.querySelectorAll('script[data-agent-web], script[src*="agent-web"]');
    
    for (const script of scripts) {
      const config = {};
      
      // Obtener atributos data-
      for (const attr of script.attributes) {
        if (attr.name.startsWith('data-')) {
          const key = attr.name.substring(5); // Remover 'data-'
          config[key] = attr.value;
        }
      }
      
      // Si hay configuracion, inicializar automaticamente
      if (Object.keys(config).length > 0) {
        init(config);
        return;
      }
    }
  } catch (e) {
    console.error('Error in auto-init:', e);
  }
}

/**
 * Destruye el widget
 * @returns {void}
 */
function destroyWidget() {
  try {
    if (widgetInstance) {
      widgetInstance.destroy();
      widgetInstance = null;
    }
    clearApiKey();
  } catch (e) {
    console.error('Error destroying WebAgent:', e);
  }
}

// API publica
export default {
  init,
  destroy: destroyWidget,
  setApiKey,
  getApiKey,
  clearApiKey,
  setBackendUrl,
  getBackendUrl
};

// Inicializar automaticamente si el DOM esta listo
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
  
  // Exponer WebAgent en window para uso directo
  window.WebAgent = {
    init,
    destroy: destroyWidget,
    setApiKey,
    getApiKey,
    clearApiKey,
    setBackendUrl,
    getBackendUrl
  };
}
