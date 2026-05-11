/**
 * @file widget.js
 * @description Logica de la interfaz de usuario del widget agent-web
 * @author agent-web
 */

import { 
  DEFAULT_POSITION,
  CSS_SELECTORS,
  STATE_CLASSES,
  MESSAGE_ROLES,
  STORAGE_KEYS
} from '../utils/constants.js';
import { 
  formatTime, 
  isNonEmptyString, 
  addSafeEventListener,
  safeHtml,
  clearAllStorage
} from '../utils/helpers.js';
import { validateConfig } from '../core/config.js';
import { 
  startListening, 
  stopListening, 
  isListening, 
  speak, 
  isSpeaking, 
  cleanup as voiceCleanup,
  getVoices
} from '../core/voice-manager.js';
import { 
  chat, 
  setApiKey, 
  getApiKey, 
  clearApiKey, 
  isValidApiKey, 
  cancelRequest, 
  isRequesting,
  setBackendUrl,
  getBackendUrl,
  analyzeAction
} from '../core/llm-client.js';
import { 
  executeAction,
  executeTextAction,

} from '../core/action-engine.js';
import { findElementByText } from '../core/dom-analyzer.js';

// ===== Clase WebAgentWidget =====
// Para soportar multiples instancias
class WebAgentWidget {
  constructor(config = {}, onOpen = null, onClose = null, onError = null) {
    // Validar y fusionar configuracion
    this.config = validateConfig(config);
    
    // Callbacks
    this.onOpenCallback = onOpen;
    this.onCloseCallback = onClose;
    this.onErrorCallback = onError;
    
    // Estado del widget
    this.state = {
      isOpen: false,
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
      hasError: false,
      errorMessage: null,
      isMinimized: false
    };
    
    // Elementos del DOM
    this.elements = {};
    
    // Historial de mensajes
    this.messageHistory = [];
    
    // Queue de mensajes para procesamiento secuencial
    this.messageQueue = [];
    this.isProcessingQueue = false;
    
    // Event listeners registrados (para limpieza)
    this.eventListeners = [];
    
    // Inicializar
    this.init();
  }
  
  /**
   * Inicializa el widget
   */
  init() {
    try {
      // Configurar API key si se proporciona
      if (this.config.apiKey) {
        setApiKey(this.config.apiKey);
      }
      
      // Configurar backend URL si se proporciona
      if (this.config.backendUrl) {
        setBackendUrl(this.config.backendUrl);
      }
      
      // Inyectar el widget en la pagina
      this.injectWidget();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      // Marcar como cargado
      document.body.classList.add('agent-web-loaded');
      
      // Configurar posicion inicial
      this.updatePosition();
      
      // Auto-abrir si esta configurado
      if (this.config.autoOpen) {
        this.openPanel();
      }
      
    } catch (e) {
      console.error('Error initializing WebAgentWidget:', e);
      this.handleError(e);
    }
  }
  
  /**
   * Inyecta el HTML y CSS del widget en la pagina
   */
  injectWidget() {
    try {
      // Crear contenedor para el widget
      const container = document.createElement('div');
      container.id = 'agent-web-container';
      container.innerHTML = this.getWidgetHtml();
      
      // Añadir al body
      document.body.appendChild(container);
      
      // Obtener referencias a los elementos
      this.cacheElements();
      
      // Añadir los estilos
      this.injectStyles();
    } catch (e) {
      console.error('Error injecting widget:', e);
      throw e;
    }
  }
  
  /**
   * Obtiene el HTML del widget
   * @returns {string}
   */
  getWidgetHtml() {
    return `
      <div class="agent-web-float-button" role="button" aria-label="Abrir asistente de voz" tabindex="0">
        <svg class="agent-web-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
          <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="currentColor" opacity="0.5"/>
          <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z" fill="currentColor"/>
        </svg>
        <span class="agent-web-status-pill agent-web-status-pill--idle">Idle</span>
      </div>
      
      <div class="agent-web-panel" role="dialog" aria-labelledby="agent-web-title" aria-modal="false">
        <div class="agent-web-header">
          <h3 id="agent-web-title">Asistente de Voz</h3>
          <div class="agent-web-header-actions">
            <button class="agent-web-minimize" aria-label="Minimizar panel" tabindex="0">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M20 14H4V12H20V14Z" fill="currentColor"/>
              </svg>
            </button>
            <button class="agent-web-close" aria-label="Cerrar panel" tabindex="0">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M18.364 6.63604L12 12.9999L5.63604 6.63604L4.36404 7.90804L10.636 14.1799L4.36404 20.4518L5.63604 21.7238L12 15.3618L18.364 21.7238L19.636 20.4518L13.364 14.1799L19.636 7.90804L18.364 6.63604Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="agent-web-chat" role="log" aria-live="polite">
          <div class="agent-web-message agent-web-message--system">
            <p>Hola, soy tu asistente de voz. ¿En qué puedo ayudarte con esta página?</p>
          </div>
        </div>
        
        <div class="agent-web-input-area">
          <div class="agent-web-input-wrapper">
            <textarea 
              class="agent-web-text-input" 
              placeholder="Escribe o habla..."
              aria-label="Entrada de texto"
              tabindex="0"
            ></textarea>
            <button class="agent-web-voice-button" aria-label="Grabar voz" tabindex="0">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 10V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 19V23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 23H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <button class="agent-web-send-button" aria-label="Enviar mensaje" tabindex="0">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Inyecta los estilos CSS
   */
  injectStyles() {
    try {
      const styleElement = document.createElement('style');
      styleElement.id = 'agent-web-styles';
      styleElement.textContent = this.getStyles();
      document.head.appendChild(styleElement);
    } catch (e) {
      console.error('Error injecting styles:', e);
    }
  }
  
  /**
   * Obtiene los estilos CSS
   * @returns {string}
   */
  getStyles() {
    return `
      .agent-web-float-button,
      .agent-web-panel {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        user-select: none;
      }
      
      .agent-web-float-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #52d1b2 0%, #b9ffde 100%);
        border: none;
        cursor: pointer;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        outline: none;
      }
      
      .agent-web-float-button:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      }
      
      .agent-web-float-button:active {
        transform: scale(0.95);
      }
      
      .agent-web-float-button:focus {
        box-shadow: 0 0 0 4px rgba(82, 209, 178, 0.3);
      }
      
      .agent-web-icon {
        width: 28px;
        height: 28px;
        color: #041019;
      }
      
      .agent-web-status-pill {
        position: absolute;
        top: -4px;
        right: -4px;
        background: rgba(157, 181, 211, 0.1);
        color: #d3e3f8;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 700;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
      }
      
      .agent-web-float-button.agent-web--listening .agent-web-icon {
        animation: pulse 1s infinite;
      }
      
      .agent-web-float-button.agent-web--processing .agent-web-icon {
        animation: spin 1s linear infinite;
      }
      
      .agent-web-panel {
        position: fixed;
        bottom: calc(60px + 24px + 12px);
        right: 24px;
        width: 360px;
        max-height: 600px;
        background: rgba(10, 21, 39, 0.8);
        border: 1px solid rgba(157, 181, 211, 0.12);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        display: none;
        flex-direction: column;
        overflow: hidden;
        backdrop-filter: blur(18px);
        transition: all 0.3s ease;
      }
      
      .agent-web-panel.active {
        display: flex;
      }
      
      .agent-web-panel.minimized {
        max-height: 50px;
      }
      
      .agent-web-panel.minimized .agent-web-chat,
      .agent-web-panel.minimized .agent-web-input-area {
        display: none;
      }
      
      .agent-web-header {
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px;
        border-bottom: 1px solid rgba(157, 181, 211, 0.12);
        background: rgba(255, 255, 255, 0.03);
      }
      
      .agent-web-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #ebf4ff;
      }
      
      .agent-web-header-actions {
        display: flex;
        gap: 4px;
      }
      
      .agent-web-header-actions button {
        width: 32px;
        height: 32px;
        border-radius: 12px;
        background: transparent;
        border: 1px solid rgba(157, 181, 211, 0.18);
        color: #9db5d3;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        padding: 0;
      }
      
      .agent-web-header-actions button:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #ebf4ff;
        border-color: #52d1b2;
      }
      
      .agent-web-header-actions svg {
        width: 18px;
        height: 18px;
      }
      
      .agent-web-chat {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .agent-web-chat::-webkit-scrollbar {
        width: 6px;
      }
      
      .agent-web-chat::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .agent-web-chat::-webkit-scrollbar-thumb {
        background: rgba(157, 181, 211, 0.3);
        border-radius: 3px;
      }
      
      .agent-web-message {
        padding: 8px 12px;
        border-radius: 12px;
        max-width: 85%;
        word-wrap: break-word;
        animation: fadeIn 0.3s ease;
      }
      
      .agent-web-message--system {
        background: rgba(124, 183, 255, 0.08);
        color: #9db5d3;
        font-size: 13px;
        align-self: center;
        text-align: center;
      }
      
      .agent-web-message--user {
        background: rgba(124, 183, 255, 0.12);
        color: #ebf4ff;
        align-self: flex-end;
      }
      
      .agent-web-message--agent {
        background: rgba(82, 209, 178, 0.12);
        color: #ebf4ff;
        align-self: flex-start;
      }
      
      .agent-web-message--error {
        background: rgba(255, 123, 114, 0.14);
        color: #ffd2cd;
        align-self: center;
        text-align: center;
      }
      
      .agent-web-message--action {
        background: rgba(124, 183, 255, 0.15);
        color: #7cb7ff;
        align-self: flex-start;
        border-left: 3px solid #7cb7ff;
      }
      
      .agent-web-message p {
        margin: 0;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      
      .agent-web-input-area {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid rgba(157, 181, 211, 0.12);
        background: rgba(255, 255, 255, 0.03);
      }
      
      .agent-web-input-wrapper {
        flex: 1;
        display: flex;
        align-items: flex-end;
        background: rgba(1, 11, 24, 0.58);
        border: 1px solid rgba(157, 181, 211, 0.18);
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.2s ease;
      }
      
      .agent-web-input-wrapper:focus-within {
        border-color: #52d1b2;
        box-shadow: 0 0 0 4px rgba(82, 209, 178, 0.12);
      }
      
      .agent-web-text-input {
        flex: 1;
        border: none;
        background: transparent;
        color: #ebf4ff;
        padding: 8px 12px;
        font-size: 14px;
        line-height: 1.5;
        resize: none;
        max-height: 120px;
        outline: none;
      }
      
      .agent-web-text-input::placeholder {
        color: #9db5d3;
      }
      
      .agent-web-voice-button {
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        color: #9db5d3;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        transition: all 0.2s ease;
        border-radius: 12px;
      }
      
      .agent-web-voice-button:hover {
        color: #52d1b2;
        background: rgba(255, 255, 255, 0.06);
      }
      
      .agent-web-voice-button.agent-web--listening {
        color: #52d1b2;
        animation: pulse 1s infinite;
      }
      
      .agent-web-voice-button svg {
        width: 20px;
        height: 20px;
      }
      
      .agent-web-send-button {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, #52d1b2 0%, #b9ffde 100%);
        border: none;
        color: #041019;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .agent-web-send-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(82, 209, 178, 0.3);
      }
      
      .agent-web-send-button:active {
        transform: translateY(0);
      }
      
      .agent-web-send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      .agent-web-send-button svg {
        width: 20px;
        height: 20px;
      }
      
      .agent-web-processing-indicator {
        display: none;
        padding: 8px;
        color: #9db5d3;
        font-size: 13px;
        text-align: center;
      }
      
      .agent-web-processing-indicator.active {
        display: block;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
  }
  
  /**
   * Almacena referencias a los elementos del DOM
   */
  cacheElements() {
    try {
      this.elements = {
        container: document.getElementById('agent-web-container'),
        floatButton: document.querySelector('.agent-web-float-button'),
        panel: document.querySelector('.agent-web-panel'),
        closeButton: document.querySelector('.agent-web-close'),
        minimizeButton: document.querySelector('.agent-web-minimize'),
        chatArea: document.querySelector('.agent-web-chat'),
        textInput: document.querySelector('.agent-web-text-input'),
        voiceButton: document.querySelector('.agent-web-voice-button'),
        sendButton: document.querySelector('.agent-web-send-button'),
        statusPill: document.querySelector('.agent-web-status-pill')
      };
    } catch (e) {
      console.error('Error caching elements:', e);
    }
  }
  
  /**
   * Configura los event listeners
   */
  setupEventListeners() {
    try {
      // Boton flotante - abrir/cerrar panel
      if (this.elements.floatButton) {
        const clickListener = (e) => this.handleFloatButtonClick(e);
        const keydownListener = (e) => this.handleFloatButtonKeyDown(e);
        
        this.addEventListener(this.elements.floatButton, 'click', clickListener);
        this.addEventListener(this.elements.floatButton, 'keydown', keydownListener);
      }
      
      // Boton cerrar
      if (this.elements.closeButton) {
        const clickListener = () => this.closePanel();
        const keydownListener = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.closePanel();
          }
        };
        
        this.addEventListener(this.elements.closeButton, 'click', clickListener);
        this.addEventListener(this.elements.closeButton, 'keydown', keydownListener);
      }
      
      // Boton minimizar - AHORA MINIMIZA EN LUGAR DE CERRAR
      if (this.elements.minimizeButton) {
        const clickListener = () => this.minimizePanel();
        const keydownListener = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.minimizePanel();
          }
        };
        
        this.addEventListener(this.elements.minimizeButton, 'click', clickListener);
        this.addEventListener(this.elements.minimizeButton, 'keydown', keydownListener);
      }
      
      // Input de texto
      if (this.elements.textInput) {
        const keydownListener = (e) => this.handleInputKeyDown(e);
        const inputListener = (e) => this.handleInputChange(e);
        const pasteListener = (e) => this.handleInputPaste(e);
        
        this.addEventListener(this.elements.textInput, 'keydown', keydownListener);
        this.addEventListener(this.elements.textInput, 'input', inputListener);
        this.addEventListener(this.elements.textInput, 'paste', pasteListener);
      }
      
      // Boton de voz
      if (this.elements.voiceButton) {
        const clickListener = () => this.handleVoiceButtonClick();
        const keydownListener = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleVoiceButtonClick();
          }
        };
        
        this.addEventListener(this.elements.voiceButton, 'click', clickListener);
        this.addEventListener(this.elements.voiceButton, 'keydown', keydownListener);
      }
      
      // Boton enviar
      if (this.elements.sendButton) {
        const clickListener = () => this.handleSendMessage();
        const keydownListener = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleSendMessage();
          }
        };
        
        this.addEventListener(this.elements.sendButton, 'click', clickListener);
        this.addEventListener(this.elements.sendButton, 'keydown', keydownListener);
      }
      
      // Cerrar panel al hacer clic fuera
      const docClickListener = (e) => this.handleDocumentClick(e);
      this.addEventListener(document, 'click', docClickListener);
      
      // Cerrar panel al presionar Escape
      const docKeydownListener = (e) => this.handleDocumentKeyDown(e);
      this.addEventListener(document, 'keydown', docKeydownListener);
      
    } catch (e) {
      console.error('Error setting up event listeners:', e);
    }
  }
  
  /**
   * Añade un event listener y lo guarda para limpieza posterior
   * @param {HTMLElement} element
   * @param {string} event
   * @param {Function} handler
   */
  addEventListener(element, event, handler) {
    if (!element || !event || !handler) return;
    
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }
  
  /**
   * Remueve todos los event listeners registrados
   */
  removeAllEventListeners() {
    for (const { element, event, handler } of this.eventListeners) {
      try {
        if (element && element.removeEventListener) {
          element.removeEventListener(event, handler);
        }
      } catch (e) {
        console.error('Error removing event listener:', e);
      }
    }
    this.eventListeners = [];
  }
  
  // ===== MÉTODOS DE PANEL =====
  
  /**
   * Minimiza el panel (oculta el chat y el input, solo muestra el header)
   */
  minimizePanel() {
    try {
      if (!this.state.isOpen) return;
      
      this.state.isMinimized = !this.state.isMinimized;
      
      if (this.elements.panel) {
        if (this.state.isMinimized) {
          this.elements.panel.classList.add('minimized');
        } else {
          this.elements.panel.classList.remove('minimized');
        }
      }
      
      // Enfocar el input si semaximiza
      if (!this.state.isMinimized && this.elements.textInput) {
        setTimeout(() => {
          this.elements.textInput.focus();
        }, 100);
      }
    } catch (e) {
      console.error('Error minimizing panel:', e);
    }
  }
  
  /**
   * Alterna el panel (abre/ciierra o minimiza/maximiza)
   */
  togglePanel() {
    if (!this.state.isOpen) {
      this.openPanel();
    } else if (this.state.isMinimized) {
      this.minimizePanel();
    } else {
      this.closePanel();
    }
  }
  
  /**
   * Abre el panel
   */
  openPanel() {
    try {
      if (this.state.isOpen) {
        if (this.state.isMinimized) {
          this.minimizePanel();
        }
        return;
      }
      
      this.state.isOpen = true;
      this.state.isMinimized = false;
      
      if (this.elements.panel) {
        this.elements.panel.classList.add('active');
        this.elements.panel.classList.remove('minimized');
      }
      
      if (this.elements.floatButton) {
        this.elements.floatButton.classList.add('active');
      }
      
      // Actualizar estado del boton
      this.updateStatusPill();
      
      // Enfocar el input
      setTimeout(() => {
        if (this.elements.textInput) {
          this.elements.textInput.focus();
        }
      }, 100);
      
      // Callback
      if (this.onOpenCallback) {
        this.onOpenCallback();
      }
    } catch (e) {
      console.error('Error opening panel:', e);
    }
  }
  
  /**
   * Cierra el panel completamente
   */
  closePanel() {
    try {
      if (!this.state.isOpen) return;
      
      this.state.isOpen = false;
      this.state.isMinimized = false;
      
      // Detener reconocimiento de voz
      if (this.state.isListening) {
        this.handleStopListening();
      }
      
      // Cancelar request
      cancelRequest();
      
      if (this.elements.panel) {
        this.elements.panel.classList.remove('active', 'minimized');
      }
      
      if (this.elements.floatButton) {
        this.elements.floatButton.classList.remove('active');
      }
      
      // Actualizar estado del boton
      this.updateStatusPill();
      
      // Callback
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    } catch (e) {
      console.error('Error closing panel:', e);
    }
  }
  
  // ===== MÉTODOS DE VOZ =====
  
  /**
   * Maneja clic en el boton flotante
   * @param {Event} e - Evento de clic
   */
  handleFloatButtonClick(e) {
    e.stopPropagation();
    this.togglePanel();
  }
  
  /**
   * Maneja teclado en el boton flotante
   * @param {Event} e - Evento de teclado
   */
  handleFloatButtonKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.togglePanel();
    }
  }
  
  /**
   * Maneja clic en el boton de voz
   */
  handleVoiceButtonClick() {
    try {
      if (this.state.isListening) {
        this.handleStopListening();
      } else {
        this.handleStartListening();
      }
    } catch (e) {
      this.handleError(e);
    }
  }
  
  /**
   * Inicia el reconocimiento de voz
   */
  handleStartListening() {
    try {
      // Verificar si ya esta procesando
      if (this.state.isProcessing) {
        speak('Estoy procesando tu solicitud anterior. Espera un momento.');
        return;
      }
      
      // Verificar si esta hablando
      if (this.state.isSpeaking) {
        return;
      }
      
      // Limpiar el input
      if (this.elements.textInput) {
        this.elements.textInput.value = '';
        this.elements.textInput.placeholder = 'Escuchando...';
      }
      
      // Actualizar estado
      this.updateState({ isListening: true, isProcessing: false, hasError: false });
      
      // Iniciar reconocimiento
      const success = startListening(
        (result) => {
          // Resultado de voz
          if (result.isFinal) {
            this.handleVoiceResult(result.text);
          }
        },
        (error) => {
          this.handleError(error);
          this.updateState({ isListening: false });
        },
        () => {
          // On end
          this.updateState({ isListening: false });
          if (this.elements.textInput) {
            this.elements.textInput.placeholder = 'Escribe o habla...';
          }
        },
        {
          lang: this.config.voiceLang
        }
      );
      
      if (!success) {
        this.updateState({ isListening: false });
        this.handleError(new Error('No se pudo iniciar el reconocimiento de voz'));
      }
    } catch (e) {
      this.handleError(e);
      this.updateState({ isListening: false });
    }
  }
  
  /**
   * Detiene el reconocimiento de voz
   */
  handleStopListening() {
    try {
      stopListening();
      this.updateState({ isListening: false });
      if (this.elements.textInput) {
        this.elements.textInput.placeholder = 'Escribe o habla...';
      }
    } catch (e) {
      this.handleError(e);
    }
  }
  
  /**
   * Maneja el resultado del reconocimiento de voz
   * @param {string} text - Texto transcrito
   */
  handleVoiceResult(text) {
    try {
      if (!text || !isNonEmptyString(text)) {
        return;
      }
      
      // Detener el reconocimiento
      this.handleStopListening();
      
      // Mostrar el texto en el input
      if (this.elements.textInput) {
        this.elements.textInput.value = text;
      }
      
      // Analizar si es una accion antes de enviar
      this.analyzeAndExecute(text);
      
    } catch (e) {
      this.handleError(e);
    }
  }
  
  // ===== MÉTODOS DE MENSAJES =====
  
  /**
   * Analiza el texto y ejecuta accion si es necesario
   * @param {string} text - Texto a analizar
   */
  async analyzeAndExecute(text) {
    try {
      // Verificar si es una accion
      const analysis = await analyzeAction(text, { 
        context: this.getPageContext() 
      });
      
      if (analysis.action && analysis.action !== 'none' && analysis.confidence > 0.7) {
        // Es una accion con alta confianza, ejecutarla directamente
        this.addMessage(MESSAGE_ROLES.USER, text);
        this.addMessage(MESSAGE_ROLES.SYSTEM, analysis.response);
        
        this.executeActionWithFeedback(analysis);
      } else {
        // No es una accion clara, enviar como mensaje normal
        this.handleSendMessage();
      }
    } catch (e) {
      console.error('Error analizando accion:', e);
      // Si falla el analisis, enviar como mensaje normal
      this.handleSendMessage();
    }
  }
  
  /**
   * Ejecuta una accion con feedback visual
   * @param {Object} analysis - Resultado del analisis
   */
  async executeActionWithFeedback(analysis) {
    try {
      this.updateState({ isProcessing: true });
      
      const result = await executeAction(analysis.action, analysis.params);
      
      if (result.success) {
        this.addMessage(MESSAGE_ROLES.ACTION, result.message);
        speak(result.message);
      } else {
        this.addMessage(MESSAGE_ROLES.SYSTEM, result.message || 'No pude realizar la accion');
        speak(result.message || 'No pude realizar la accion');
      }
      
      this.updateState({ isProcessing: false });
    } catch (e) {
      this.addMessage(MESSAGE_ROLES.SYSTEM, `Error al ejecutar: ${e.message}`);
      speak(`Error al ejecutar: ${e.message}`);
      this.updateState({ isProcessing: false });
    }
  }
  
  /**
   * Envía un mensaje
   */
  async handleSendMessage() {
    try {
      // Obtener el texto del input
      const inputText = this.elements.textInput ? this.elements.textInput.value.trim() : '';
      
      if (!inputText) {
        return;
      }
      
      // Limpiar el input
      if (this.elements.textInput) {
        this.elements.textInput.value = '';
        this.elements.textInput.style.height = 'auto';
      }
      
      // Validar API key
      const apiKey = getApiKey();
      const backendUrl = getBackendUrl();
      
      // Si no hay API key y no hay backend, mostrar error
      if (!apiKey && !backendUrl) {
        this.addMessage(MESSAGE_ROLES.SYSTEM, 'Por favor, configura una API key de OpenAI o un backend proxy para usar este servicio.');
        return;
      }
      
      // Validar API key si la hay
      if (apiKey && !isValidApiKey(apiKey)) {
        this.addMessage(MESSAGE_ROLES.SYSTEM, 'La API key de OpenAI no es válida.');
        return;
      }
      
      // Añadir mensaje del usuario
      this.addMessage(MESSAGE_ROLES.USER, inputText);
      
      // Procesar en la queue
      this.messageQueue.push(inputText);
      this.processQueue();
      
    } catch (e) {
      this.handleError(e);
    }
  }
  
  /**
   * Procesa la queue de mensajes secuencialmente
   */
  async processQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    this.updateState({ isProcessing: true, hasError: false });
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      
      try {
        // Cancelar request anterior
        cancelRequest();
        
        // Enviar al LLM
        const response = await chat(message, {
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        });
        
        // Añadir respuesta
        if (response) {
          this.addMessage(MESSAGE_ROLES.AGENT, response);
          speak(response, null, {
            rate: this.config.voiceRate,
            pitch: this.config.voicePitch,
            lang: this.config.voiceLang
          });
        } else {
          this.addMessage(MESSAGE_ROLES.SYSTEM, 'No recibí una respuesta.');
        }
      } catch (e) {
        console.error('Error en chat:', e);
        this.addMessage(MESSAGE_ROLES.SYSTEM, `Error: ${e.message}`);
      }
    }
    
    this.isProcessingQueue = false;
    this.updateState({ isProcessing: false });
  }
  
  /**
   * Obtiene el contexto de la pagina para el LLM
   * @returns {string}
   */
  getPageContext() {
    try {
      // Importar dinámicamente para evitar dependencia circular
      const { createContextSummary } = require('./dom-analyzer.js');
      return createContextSummary();
    } catch (e) {
      return 'Página web actual';
    }
  }
  
  /**
   * Añade un mensaje al area de chat
   * @param {string} role - Rol del mensaje (user, agent, system, action)
   * @param {string} content - Contenido del mensaje
   */
  addMessage(role, content) {
    try {
      if (!this.elements.chatArea) return;
      
      const messageElement = document.createElement('div');
      messageElement.className = `agent-web-message agent-web-message--${role}`;
      
      // Formatear el contenido con timestamp si esta configurado
      // USAR safeHtml para prevenir XSS
      let htmlContent = '';
      if (this.config.showTimestamp && role !== MESSAGE_ROLES.SYSTEM) {
        const timestamp = safeHtml(formatTime(Date.now()));
        const contentHtml = safeHtml(content);
        htmlContent = `<span class="agent-web-timestamp">${timestamp}</span><p>${contentHtml}</p>`;
      } else {
        htmlContent = `<p>${safeHtml(content)}</p>`;
      }
      
      messageElement.innerHTML = htmlContent;
      
      // Añadir al chat
      this.elements.chatArea.appendChild(messageElement);
      
      // Guardar en historial
      if (this.config.rememberHistory) {
        this.messageHistory.push({
          role,
          content,
          timestamp: Date.now()
        });
        
        // Limitar historial
        if (this.messageHistory.length > this.config.maxHistoryLength) {
          this.messageHistory.shift();
          // Eliminar el primer mensaje del DOM
          const firstMessage = this.elements.chatArea.querySelector('.agent-web-message');
          if (firstMessage) {
            firstMessage.remove();
          }
        }
      }
      
      // Desplazar al final
      setTimeout(() => {
        if (this.elements.chatArea) {
          this.elements.chatArea.scrollTop = this.elements.chatArea.scrollHeight;
        }
      }, 50);
    } catch (e) {
      console.error('Error adding message:', e);
    }
  }
  
  // ===== MÉTODOS DE ESTADO =====
  
  /**
   * Maneja teclado en el input
   * @param {Event} e - Evento de teclado
   */
  handleInputKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!e.repeat) {
        this.handleSendMessage();
      }
    }
  }
  
  /**
   * Maneja cambio en el input
   * @param {Event} e - Evento de input
   */
  handleInputChange(e) {
    // Auto-ajustar altura del textarea
    if (this.elements.textInput) {
      this.elements.textInput.style.height = 'auto';
      this.elements.textInput.style.height = Math.min(this.elements.textInput.scrollHeight, 120) + 'px';
    }
  }
  
  /**
   * Maneja pegado en el input
   * @param {Event} e - Evento de paste
   */
  handleInputPaste(e) {
    // Permitir pegado normal
  }
  
  /**
   * Maneja clic en el documento
   * @param {Event} e - Evento de clic
   */
  handleDocumentClick(e) {
    try {
      // Verificar si el clic fue fuera del widget
      const widgetContainer = document.getElementById('agent-web-container');
      if (!widgetContainer) return;
      
      if (!widgetContainer.contains(e.target) && this.state.isOpen && !this.state.isMinimized) {
        this.closePanel();
      }
    } catch (e) {
      console.error('Error handling document click:', e);
    }
  }
  
  /**
   * Maneja teclado en el documento
   * @param {Event} e - Evento de teclado
   */
  handleDocumentKeyDown(e) {
    try {
      if (e.key === 'Escape') {
        if (this.state.isMinimized) {
          this.closePanel();
        } else if (this.state.isOpen) {
          this.closePanel();
        }
      }
    } catch (e) {
      console.error('Error handling document key down:', e);
    }
  }
  
  /**
   * Actualiza el estado del widget
   * @param {Object} newState - Nuevo estado
   */
  updateState(newState) {
    try {
      this.state = { ...this.state, ...newState };
      
      // Actualizar clases del panel
      if (this.elements.panel) {
        Object.values(STATE_CLASSES).forEach(cls => {
          this.elements.panel.classList.remove(cls);
        });
        
        if (this.state.isListening) {
          this.elements.panel.classList.add(STATE_CLASSES.LISTENING);
        }
        if (this.state.isProcessing) {
          this.elements.panel.classList.add(STATE_CLASSES.PROCESSING);
        }
        if (this.state.isSpeaking) {
          this.elements.panel.classList.add(STATE_CLASSES.SPEAKING);
        }
        if (this.state.hasError) {
          this.elements.panel.classList.add(STATE_CLASSES.ERROR);
        }
      }
      
      // Actualizar clases del boton flotante
      if (this.elements.floatButton) {
        Object.values(STATE_CLASSES).forEach(cls => {
          this.elements.floatButton.classList.remove(cls);
        });
        
        if (this.state.isListening) {
          this.elements.floatButton.classList.add(STATE_CLASSES.LISTENING);
        }
        if (this.state.isProcessing) {
          this.elements.floatButton.classList.add(STATE_CLASSES.PROCESSING);
        }
        if (this.state.isSpeaking) {
          this.elements.floatButton.classList.add(STATE_CLASSES.SPEAKING);
        }
        if (this.state.hasError) {
          this.elements.floatButton.classList.add(STATE_CLASSES.ERROR);
        }
      }
      
      // Actualizar status pill
      this.updateStatusPill();
      
      // Actualizar estado de voz
      this.state.isListening = isListening();
      this.state.isSpeaking = isSpeaking();
      this.state.isProcessing = isRequesting() || this.isProcessingQueue;
      
      // Deshabilitar botones si es necesario
      if (this.elements.sendButton) {
        this.elements.sendButton.disabled = this.state.isProcessing || this.state.isListening;
      }
      
      if (this.elements.voiceButton) {
        this.elements.voiceButton.disabled = this.state.isProcessing || this.state.isSpeaking;
      }
    } catch (e) {
      console.error('Error updating state:', e);
    }
  }
  
  /**
   * Actualiza el status pill
   */
  updateStatusPill() {
    try {
      if (!this.elements.statusPill) return;
      
      // Limpiar clases
      this.elements.statusPill.className = 'agent-web-status-pill';
      
      // Determinar estado
      let status = 'idle';
      let statusText = 'Idle';
      
      if (this.state.hasError) {
        status = 'error';
        statusText = 'Error';
      } else if (this.state.isSpeaking) {
        status = 'speaking';
        statusText = 'Hablando';
      } else if (this.state.isProcessing) {
        status = 'processing';
        statusText = 'Procesando';
      } else if (this.state.isListening) {
        status = 'listening';
        statusText = 'Escuchando';
      } else if (this.state.isMinimized) {
        status = 'minimized';
        statusText = 'Minimizado';
      }
      
      this.elements.statusPill.classList.add(`agent-web-status-pill--${status}`);
      this.elements.statusPill.textContent = statusText;
    } catch (e) {
      console.error('Error updating status pill:', e);
    }
  }
  
  /**
   * Actualiza la posicion del widget
   */
  updatePosition() {
    try {
      // Remover clases de posicion anteriores
      const positions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
      for (const pos of positions) {
        document.body.classList.remove(`agent-web-position-${pos}`);
      }
      
      // Añadir clase de posicion actual
      document.body.classList.add(`agent-web-position-${this.config.widgetPosition}`);
    } catch (e) {
      console.error('Error updating position:', e);
    }
  }
  
  /**
   * Maneja errores
   * @param {Error} error - Error a manejar
   */
  handleError(error) {
    try {
      console.error('Widget error:', error);
      
      this.updateState({ hasError: true, errorMessage: error.message });
      
      if (this.elements.chatArea) {
        this.addMessage(MESSAGE_ROLES.SYSTEM, `Error: ${error.message}`);
      }
      
      // Callback de error
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    } catch (e) {
      console.error('Error handling error:', e);
    }
  }
  
  /**
   * Configura el widget
   * @param {Object} newConfig - Nueva configuracion
   */
  setConfig(newConfig) {
    this.config = validateConfig(newConfig);
    this.updatePosition();
  }
  
  /**
   * Limpia el widget
   */
  cleanup() {
    try {
      // Limpiar recursos de voz
      voiceCleanup();
      
      // Limpiar LLM client
      clearApiKey();
      cancelRequest();
      
      // Cerrar panel
      this.closePanel();
      
      // Limpiar historial y queue
      this.messageHistory = [];
      this.messageQueue = [];
      this.isProcessingQueue = false;
      
      // Eliminar elementos
      const container = document.getElementById('agent-web-container');
      if (container) {
        container.remove();
      }
      
      const styleElement = document.getElementById('agent-web-styles');
      if (styleElement) {
        styleElement.remove();
      }
      
      // Limpiar todos los event listeners
      this.removeAllEventListeners();
      
      // Limpiar storage
      clearAllStorage();
      
      // Limpiar estado
      this.state = {
        isOpen: false,
        isListening: false,
        isProcessing: false,
        isSpeaking: false,
        hasError: false,
        errorMessage: null,
        isMinimized: false
      };
    } catch (e) {
      console.error('Error cleaning up widget:', e);
    }
  }
  
  /**
   * Obtiene el estado actual del widget
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }
  
  /**
   * Añade un mensaje manualmente (para uso externo)
   * @param {string} role - Rol del mensaje
   * @param {string} content - Contenido
   */
  addMessageExternally(role, content) {
    this.addMessage(role, content);
  }
  
  /**
   * Inicia escucha de voz (para uso externo)
   */
  startListening() {
    this.handleStartListening();
  }
  
  /**
   * Detiene escucha de voz (para uso externo)
   */
  stopListening() {
    this.handleStopListening();
  }
  
  /**
   * Envía un mensaje (para uso externo)
   * @param {string} message
   */
  sendMessage(message) {
    if (this.elements.textInput) {
      this.elements.textInput.value = message;
    }
    this.handleSendMessage();
  }
}

// ===== API Publica =====

// Instancia global (para compatibilidad hacia atrás)
let globalInstance = null;

/**
 * Inicializa el widget agent-web
 * @param {Object} config - Configuracion del widget
 * @param {string} config.apiKey - API key de OpenAI
 * @param {string=} config.backendUrl - URL del backend proxy
 * @param {string=} config.widgetPosition - Posicion del boton flotante
 * @param {Function=} onOpen - Callback cuando se abre el widget
 * @param {Function=} onClose - Callback cuando se cierra el widget
 * @param {Function=} onError - Callback cuando hay un error
 * @returns {Object} - API publica del widget
 */
export function init(config = {}, onOpen = null, onClose = null, onError = null) {
  try {
    // Crear nueva instancia
    globalInstance = new WebAgentWidget(config, onOpen, onClose, onError);
    
    // Devolver la API publica
    return {
      /**
       * Abre el panel del widget
       */
      open: () => {
        if (globalInstance) globalInstance.openPanel();
      },
      
      /**
       * Cierra el panel del widget
       */
      close: () => {
        if (globalInstance) globalInstance.closePanel();
      },
      
      /**
       * Minimiza el panel del widget
       */
      minimize: () => {
        if (globalInstance) globalInstance.minimizePanel();
      },
      
      /**
       * Alterna el panel (abre/ciierra o minimiza/maximiza)
       */
      toggle: () => {
        if (globalInstance) globalInstance.togglePanel();
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
       * @param {string} url - URL del backend
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
       * Obtiene la URL del backend
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
        if (globalInstance) {
          globalInstance.setConfig(newConfig);
        }
      },
      
      /**
       * Envía un mensaje al LLM
       * @param {string} message - Mensaje a enviar
       */
      sendMessage: (message) => {
        if (globalInstance) {
          globalInstance.sendMessage(message);
        }
      },
      
      /**
       * Inicia el reconocimiento de voz
       */
      startListening: () => {
        if (globalInstance) {
          globalInstance.startListening();
        }
      },
      
      /**
       * Detiene el reconocimiento de voz
       */
      stopListening: () => {
        if (globalInstance) {
          globalInstance.stopListening();
        }
      },
      
      /**
       * Obtiene el estado actual del widget
       * @returns {Object}
       */
      getState: () => {
        if (globalInstance) {
          return globalInstance.getState();
        }
        return {};
      },
      
      /**
       * Añade un mensaje manualmente al chat
       * @param {string} role - Rol del mensaje (user, agent, system, action)
       * @param {string} content - Contenido del mensaje
       */
      addMessage: (role, content) => {
        if (globalInstance) {
          globalInstance.addMessageExternally(role, content);
        }
      },
      
      /**
       * Ejecuta una accion
       * @param {string} actionType - Tipo de accion
       * @param {Object} params - Parametros de la accion
       */
      executeAction: async (actionType, params) => {
        if (globalInstance) {
          return await executeAction(actionType, params);
        }
        return { success: false, message: 'Widget no inicializado' };
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
 * Destruye el widget
 * @returns {void}
 */
export function destroy() {
  try {
    if (globalInstance) {
      globalInstance.cleanup();
      globalInstance = null;
    }
    clearApiKey();
    clearAllStorage();
  } catch (e) {
    console.error('Error destroying WebAgent:', e);
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

// API publica
export default {
  init,
  destroy,
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
    destroy,
    setApiKey,
    getApiKey,
    clearApiKey,
    setBackendUrl,
    getBackendUrl
  };
}
