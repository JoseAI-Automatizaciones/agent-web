/**
 * @file llm-client.js
 * @description Cliente de LLM para el widget agent-web
 * Se conecta a OpenAI Chat API para obtener respuestas inteligentes
 * Opcionalmente usa backend proxy para evitar CORS
 * Soporta API keys de proyectos de OpenAI (sk-proj-*)
 * @author agent-web
 */

import { 
  DEFAULT_MODEL, 
  DEFAULT_MAX_TOKENS, 
  DEFAULT_TEMPERATURE, 
  STORAGE_KEYS,
  ERROR_MESSAGES
} from '../utils/constants.js';
import { 
  getSessionStorage, 
  setSessionStorage, 
  removeSessionStorage, 
  getLocalStorage, 
  setLocalStorage, 
  removeLocalStorage
} from '../utils/helpers.js';
import { createContextSummary } from './dom-analyzer.js';

// ===== Configuracion del Backend Proxy =====
// URL del backend proxy (puede ser configurado por el usuario)
let backendUrl = null;

/**
 * Configura la URL del backend proxy
 * @param {string} url - URL del backend (ej: 'http://localhost:3002')
 */
export function setBackendUrl(url) {
  if (!url) {
    backendUrl = null;
    removeSessionStorage(STORAGE_KEYS.BACKEND_URL);
    return;
  }
  
  // Validar URL
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
    backendUrl = parsed.href;
    setSessionStorage(STORAGE_KEYS.BACKEND_URL, backendUrl);
  } catch (e) {
    console.error('Invalid backend URL:', e.message);
    backendUrl = null;
  }
}

/**
 * Obtiene la URL del backend proxy
 * @returns {string|null}
 */
export function getBackendUrl() {
  return backendUrl || getSessionStorage(STORAGE_KEYS.BACKEND_URL) || null;
}

// Estado
let apiKey = null;
let currentRequest = null;

/**
 * @typedef {Object} ChatMessage
 * @property {string} role - Rol del mensaje (system, user, assistant)
 * @property {string} content - Contenido del mensaje
 */

/**
 * @typedef {Object} ChatOptions
 * @property {string} model - Modelo a usar
 * @property {number} maxTokens - Tokens maximos
 * @property {number} temperature - Temperatura
 * @property {number} topP - Top P
 * @property {number} frequencyPenalty - Penalizacion de frecuencia
 * @property {number} presencePenalty - Penalizacion de presencia
 * @property {boolean} stream - Si usar streaming
 * @property {boolean} includeHistory - Incluir historial de conversacion (default: true)
 * @property {number} historyLength - Numero de mensajes del historial a incluir (default: todos)
 */

// ===== Contexto de Conversacion =====

/**
 * @typedef {Object} ConversationContext
 * @property {Array<ChatMessage>} history - Historial de mensajes
 * @property {string} contextId - ID unico de la conversacion
 * @property {number} createdAt - Timestamp de creacion
 */

let conversationContext = {
  history: [],
  contextId: generateContextId(),
  createdAt: Date.now()
};

/**
 * Genera un ID unico para la conversacion
 * @private
 * @returns {string}
 */
function generateContextId() {
  return `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Obtiene el historial de la conversacion actual
 * @returns {Array<ChatMessage>}
 */
export function getConversationHistory() {
  return [...conversationContext.history];
}

/**
 * Obtiene el ID de la conversacion actual
 * @returns {string}
 */
export function getConversationId() {
  return conversationContext.contextId;
}

/**
 * Limpia el historial de la conversacion
 * @param {boolean=} keepContext - Si mantener el contexto de la pagina (default: false)
 * @returns {void}
 */
export function clearConversation(keepContext = false) {
  if (keepContext) {
    // Mantener solo el mensaje system con el contexto de la pagina
    conversationContext.history = conversationContext.history.filter(
      msg => msg.role === 'system'
    );
  } else {
    conversationContext = {
      history: [],
      contextId: generateContextId(),
      createdAt: Date.now()
    };
  }
}

/**
 * Anade un mensaje al historial de la conversacion
 * @param {ChatMessage} message - Mensaje a anadir
 * @returns {void}
 */
export function addToConversationHistory(message) {
  if (message && message.role && message.content) {
    conversationContext.history.push({ ...message });
  }
}

/**
 * Establece el contexto inicial de la conversacion (mensaje system)
 * @param {string} context - Contexto inicial
 * @returns {void}
 */
export function setConversationContext(context) {
  // Limpiar historial existente
  conversationContext.history = [];
  
  // Anadir nuevo contexto system
  if (context) {
    conversationContext.history.push({
      role: 'system',
      content: context
    });
  }
}

/**
 * Configura la API key de OpenAI
 * @param {string} key - API key de OpenAI
 * @returns {void}
 */
export function setApiKey(key) {
  if (key && typeof key === 'string') {
    apiKey = key.trim();
    // Guardar en sessionStorage para persistencia (mas seguro que localStorage)
    setSessionStorage(STORAGE_KEYS.API_KEY, apiKey);
  } else {
    apiKey = null;
    removeSessionStorage(STORAGE_KEYS.API_KEY);
    // Tambien limpiar localStorage por compatibilidad hacia atras
    removeLocalStorage(STORAGE_KEYS.API_KEY);
  }
}

/**
 * Obtiene la API key de OpenAI
 * @returns {string|null} - API key o null
 */
export function getApiKey() {
  // Priorizar sessionStorage, luego localStorage (compatibilidad)
  return apiKey || 
         getSessionStorage(STORAGE_KEYS.API_KEY) || 
         getLocalStorage(STORAGE_KEYS.API_KEY) || 
         null;
}

/**
 * Elimina la API key guardada
 * @returns {void}
 */
export function clearApiKey() {
  apiKey = null;
  removeSessionStorage(STORAGE_KEYS.API_KEY);
  removeLocalStorage(STORAGE_KEYS.API_KEY);
}

/**
 * Valida una API key de OpenAI
 * Soporta: sk-*, pk-*, sk-proj-* (nuevos formatos de proyectos)
 * @param {string} key - API key a validar
 * @returns {boolean} - True si la key tiene formato valido
 */
export function isValidApiKey(key) {
  if (!key || typeof key !== 'string') {
    return false;
  }
  
  // Formato tipico:
  // - sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (legacy)
  // - pk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (legacy)
  // - sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (nuevos proyectos)
  return /^(sk-|pk-|sk-proj-)[a-zA-Z0-9_-]{32,}$/.test(key.trim());
}

/**
 * Determina si usar backend proxy o API directa
 * @returns {boolean} - True si se debe usar backend
 */
function shouldUseBackend() {
  return !!getBackendUrl();
}

/**
 * Obtiene el endpoint de Chat API
 * @returns {string}
 */
function getChatEndpoint() {
  if (shouldUseBackend()) {
    return `${getBackendUrl()}/api/chat`;
  }
  return 'https://api.openai.com/v1/chat/completions';
}

/**
 * Obtiene los headers para la peticion
 * @param {string} key - API key
 * @returns {Object}
 */
function getRequestHeaders(key) {
  if (shouldUseBackend()) {
    // Al usar backend, la API key del cliente va en header personalizado
    return {
      'Content-Type': 'application/json',
      'X-Client-Api-Key': key
    };
  }
  
  // API directa a OpenAI
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
  };
}

/**
 * Obtiene el contexto de la pagina
 * @param {number=} maxTokens - Tokens maximos para el contexto
 * @returns {string} - Contexto de la pagina
 */
export function getPageContext(maxTokens) {
  return createContextSummary(maxTokens);
}

/**
 * Construye el prompt para el LLM
 * @param {string|Array<ChatMessage>} userQuery - Consulta del usuario
 * @param {Object=} options - Opciones adicionales
 * @param {number} options.maxTokens - Tokens maximos para el contexto
 * @param {boolean} options.includeHistory - Incluir historial de conversacion (default: true)
 * @param {number} options.historyLength - Numero de mensajes del historial a incluir
 * @returns {Array<ChatMessage>} - Mensajes para el LLM
 */
export function buildPrompt(userQuery, options = {}) {
  const {
    maxTokens,
    includeHistory = true,
    historyLength = null
  } = options;
  
  const context = getPageContext(maxTokens);
  
  // Si userQuery es un array, asumir que ya son mensajes
  if (Array.isArray(userQuery)) {
    return userQuery;
  }
  
  // Construir el array de mensajes
  const messages = [];
  
  // Anadir contexto de la pagina como mensaje system
  messages.push({
    role: 'system',
    content: context
  });
  
  // Anadir historial de conversacion (sin el mensaje system inicial)
  if (includeHistory && conversationContext.history.length > 0) {
    const history = conversationContext.history.filter(msg => msg.role !== 'system');
    
    // Limitar el historial si se especifica
    if (historyLength !== null) {
      const startIndex = Math.max(0, history.length - historyLength);
      messages.push(...history.slice(startIndex));
    } else {
      // Anadir todo el historial
      messages.push(...history);
    }
  }
  
  // Anadir el mensaje del usuario
  messages.push({
    role: 'user',
    content: userQuery
  });
  
  return messages;
}

/**
 * Estima el numero de tokens en un texto
 * @private
 * @param {string} text - Texto a estimar
 * @returns {number} - Numero estimado de tokens
 */
function estimateTokenCount(text) {
  // Estimacion aproximada: 4 caracteres = 1 token (para ingles/espanol)
  // Esto es una simplificacion, para mayor precision se necesitaria un tokenizer
  return Math.ceil(text.length / 4);
}

/**
 * Estima el numero de tokens en un array de mensajes
 * @private
 * @param {Array<ChatMessage>} messages - Mensajes a estimar
 * @returns {number} - Numero estimado de tokens
 */
function estimateMessagesTokenCount(messages) {
  let total = 0;
  for (const msg of messages) {
    total += estimateTokenCount(msg.content);
  }
  return total;
}

/**
 * Ajusta el historial para que quepa en el limite de tokens
 * @private
 * @param {Array<ChatMessage>} messages - Mensajes a ajustar
 * @param {number} maxTokens - Tokens maximos permitidos
 * @returns {Array<ChatMessage>} - Mensajes ajustados
 */
function adjustHistoryForTokenLimit(messages, maxTokens) {
  if (estimateMessagesTokenCount(messages) <= maxTokens) {
    return messages;
  }
  
  // El primer mensaje (system) debe mantenerse
  const systemMessage = messages[0];
  const otherMessages = messages.slice(1);
  
  let remainingTokens = maxTokens - estimateTokenCount(systemMessage.content);
  const adjustedMessages = [systemMessage];
  
  // Anadir mensajes desde el final (los mas recientes primero)
  for (let i = otherMessages.length - 1; i >= 0; i--) {
    const msg = otherMessages[i];
    const msgTokens = estimateTokenCount(msg.content);
    
    if (msgTokens <= remainingTokens) {
      adjustedMessages.unshift(msg);
      remainingTokens -= msgTokens;
    } else {
      // Si un mensaje es muy largo, truncarlo
      const truncatedContent = truncateTextByTokens(msg.content, remainingTokens);
      adjustedMessages.unshift({
        ...msg,
        content: truncatedContent
      });
      break;
    }
  }
  
  return adjustedMessages;
}

/**
 * Trunca un texto para que no exceda un numero de tokens
 * @private
 * @param {string} text - Texto a truncar
 * @param {number} maxTokens - Tokens maximos
 * @returns {string} - Texto truncado
 */
function truncateTextByTokens(text, maxTokens) {
  // 4 caracteres por token es una estimacion conservadora
  const maxChars = Math.max(0, maxTokens * 4);
  if (text.length <= maxChars) {
    return text;
  }
  return text.substring(0, maxChars - 3) + '...';
}

/**
 * Envía un mensaje al LLM
 * @param {string|Array<ChatMessage>} messages - Mensajes o consulta
 * @param {ChatOptions=} options - Opciones de la consulta
 * @returns {Promise<string>} - Promesa con la respuesta del LLM
 */
export async function chat(messages, options = {}) {
  try {
    // Validar API key
    const key = getApiKey();
    if (!key) {
      throw new Error(ERROR_MESSAGES.NO_API_KEY);
    }
    
    // Validar formato de la key
    if (!isValidApiKey(key)) {
      throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
    }
    
    // Cancelar request anterior si existe
    if (currentRequest) {
      currentRequest.abort();
      currentRequest = null;
    }
    
    // Construir el prompt
    const promptMessages = buildPrompt(messages, options);
    
    // Ajustar el historial si excede el limite de tokens
    const maxTokens = options.maxTokens || DEFAULT_MAX_TOKENS;
    const adjustedMessages = adjustHistoryForTokenLimit(promptMessages, maxTokens * 0.8); // Usar 80% para la respuesta
    
    // Opciones por defecto
    const defaultOptions = {
      model: DEFAULT_MODEL,
      max_tokens: Math.min(maxTokens, 4096), // Limite de OpenAI
      temperature: DEFAULT_TEMPERATURE,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    // Crear controller para abort
    const controller = new AbortController();
    currentRequest = controller;
    
    // Configurar endpoint y headers
    const endpoint = getChatEndpoint();
    const headers = getRequestHeaders(key);
    
    // Hacer la peticion
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: adjustedMessages,
        ...requestOptions
      }),
      signal: controller.signal
    });
    
    // Limpiar el request actual
    currentRequest = null;
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
      
      if (response.status === 401) {
        throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
      }
      if (response.status === 429) {
        throw new Error(ERROR_MESSAGES.RATE_LIMIT);
      }
      if (response.status === 400) {
        throw new Error(`Bad request: ${errorMessage}`);
      }
      
      // Si el backend devuelve error, tomar el mensaje
      if (errorData.code) {
        throw new Error(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    // Obtener el mensaje de respuesta
    if (data.choices && data.choices.length > 0) {
      const responseContent = data.choices[0].message?.content || '';
      
      // Anadir la respuesta al historial de conversacion
      addToConversationHistory({
        role: 'user',
        content: Array.isArray(messages) ? messages[messages.length - 1]?.content || '' : messages
      });
      addToConversationHistory({
        role: 'assistant',
        content: responseContent
      });
      
      return responseContent;
    }
    
    throw new Error('No response from LLM');
  } catch (e) {
    // Limpiar el request actual
    currentRequest = null;
    
    if (e.name === 'AbortError') {
      // Request fue abortado
      return '';
    }
    
    console.error('Error in LLM chat:', e);
    throw e;
  }
}

/**
 * Streaming de respuestas del LLM
 * @param {string|Array<ChatMessage>} messages - Mensajes o consulta
 * @param {Function} onChunk - Callback para cada chunk de la respuesta
 * @param {ChatOptions=} options - Opciones de la consulta
 * @returns {Promise<void>} - Promesa que resuelve cuando termina
 */
export async function streamChat(messages, onChunk, options = {}) {
  try {
    // Validar API key
    const key = getApiKey();
    if (!key) {
      throw new Error(ERROR_MESSAGES.NO_API_KEY);
    }
    
    // Validar formato de la key
    if (!isValidApiKey(key)) {
      throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
    }
    
    // Cancelar request anterior si existe
    if (currentRequest) {
      currentRequest.abort();
    }
    
    // Construir el prompt
    const promptMessages = buildPrompt(messages, options);
    
    // Ajustar el historial si excede el limite de tokens
    const maxTokens = options.maxTokens || DEFAULT_MAX_TOKENS;
    const adjustedMessages = adjustHistoryForTokenLimit(promptMessages, maxTokens * 0.8);
    
    // Opciones por defecto
    const defaultOptions = {
      model: DEFAULT_MODEL,
      max_tokens: Math.min(maxTokens, 4096),
      temperature: DEFAULT_TEMPERATURE,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: true
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    // Crear controller para abort
    const controller = new AbortController();
    currentRequest = controller;
    
    // Configurar endpoint y headers
    const endpoint = getChatEndpoint();
    const headers = getRequestHeaders(key);
    
    // Hacer la peticion a OpenAI
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: adjustedMessages,
        ...requestOptions
      }),
      signal: controller.signal
    });
    
    // Limpiar el request actual si no es OK
    if (!response.ok) {
      currentRequest = null;
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || errorData.message || 'Unknown error';
      
      if (response.status === 401) {
        throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
      }
      if (response.status === 429) {
        throw new Error(ERROR_MESSAGES.RATE_LIMIT);
      }
      
      throw new Error(errorMessage);
    }
    
    // Procesar el stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // Decodificar el chunk
      const chunk = decoder.decode(value);
      buffer += chunk;
      
      // Procesar lineas completas (para backend proxy)
      if (shouldUseBackend()) {
        // El backend devuelve el stream directo
        onChunk(chunk);
        fullResponse += chunk;
      } else {
        // OpenAI devuelve lineas con prefijo "data: "
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            const data = JSON.parse(line.substring(6)); // Remover "data: " prefix
            
            if (data.choices && data.choices.length > 0) {
              const content = data.choices[0].delta?.content || '';
              if (content) {
                onChunk(content);
                fullResponse += content;
              }
            }
          } catch (e) {
            // Ignorar lineas que no son JSON valido
          }
        }
      }
    }
    
    // Anadir al historial de conversacion
    addToConversationHistory({
      role: 'user',
      content: Array.isArray(messages) ? messages[messages.length - 1]?.content || '' : messages
    });
    addToConversationHistory({
      role: 'assistant',
      content: fullResponse
    });
    
    // Limpiar el request actual
    currentRequest = null;
  } catch (e) {
    // Limpiar el request actual
    currentRequest = null;
    
    if (e.name === 'AbortError') {
      // Request fue abortado
      return;
    }
    
    console.error('Error in LLM stream:', e);
    throw e;
  }
}

/**
 * Cancela el request actual
 * @returns {void}
 */
export function cancelRequest() {
  try {
    if (currentRequest) {
      currentRequest.abort();
      currentRequest = null;
    }
  } catch (e) {
    console.error('Error canceling request:', e);
  }
}

/**
 * Verifica si hay un request en progreso
 * @returns {boolean} - True si hay un request en progreso
 */
export function isRequesting() {
  return !!currentRequest;
}

/**
 * Analiza una accion a realizar usando el LLM
 * @param {string} userQuery - Consulta del usuario
 * @param {Object=} context - Contexto adicional
 * @returns {Promise<Object>} - Promesa con el analisis de la accion
 */
export async function analyzeAction(userQuery, context = {}) {
  try {
    const pageContext = context.context || createContextSummary(500);
    
    const prompt = `Analiza esta solicitud del usuario y determina que accion debe realizarse en la pagina web.

Contexto de la pagina:
${pageContext}

Solicitud del usuario: "${userQuery}"

Responde con un JSON en este formato:
{
  "action": "nombre de la accion",
  "params": { parametros de la accion },
  "response": "respuesta natural para el usuario",
  "confidence": 0.0 a 1.0
}

Acciones disponibles: click, scroll, fillInput, search, navigate, none

Reglas:
1. Si el usuario pide hacer clic en algo:
   - action: "click"
   - params: { "selector": "descripcion o selector del elemento", "text": "texto del elemento" }
   - response: "Voy a buscar el boton/elemento X y hacer clic"

2. Si el usuario pide desplazar o hacer scroll:
   - action: "scroll"
   - params: { "direction": "up|down|top|bottom" O "selector": "selector del elemento" }
   - response: "Voy a desplazarme hacia X"

3. Si el usuario pide buscar algo:
   - action: "search"
   - params: { "query": "termino de busqueda" }
   - response: "Voy a buscar X en la pagina"

4. Si el usuario pide navegar a otra pagina:
   - action: "navigate"
   - params: { "url": "url relativa" }
   - response: "Voy a navegar a X"

5. Si el usuario pide llenar un campo:
   - action: "fillInput"
   - params: { "selector": "descripcion del campo", "value": "valor a llenar" }
   - response: "Voy a llenar el campo X con Y"

6. Si NO es una accion valida, no puedes determinarla, o es peligroso:
   - action: "none"
   - params: {}
   - response: "Lo siento, no puedo realizar esa accion"
   - confidence: 0.0

7. SIMPRE responde SOLO con el JSON, sin texto adicional, sin explicaciones.
8. El JSON debe ser valido y parseable.
9. Si el usuario pide hacer algo peligroso (login, payment, etc.), devuelve action: "none"
10. Si no estas seguro, devuelve action: "none" con confidence: 0.0
`.trim();
    
    const response = await chat(prompt, { 
      maxTokens: 300, 
      temperature: 0.3,
      includeHistory: false // No incluir historial para este analisis
    });
    
    // Parsear el JSON de la respuesta
    try {
      // Buscar el JSON en la respuesta
      const jsonMatch = response.match(/\{[\[\]\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing action response:', e);
    }
    
    // Si no se pudo parsear, devolver respuesta por defecto
    return {
      action: 'none',
      params: {},
      response: response || 'No puedo realizar esa accion',
      confidence: 0.0
    };
  } catch (e) {
    console.error('Error analyzing action:', e);
    return {
      action: 'none',
      params: {},
      response: 'No puedo analizar tu solicitud en este momento',
      confidence: 0.0
    };
  }
}

/**
 * Limpia recursos
 * @returns {void}
 */
export function cleanup() {
  try {
    cancelRequest();
    apiKey = null;
    clearConversation();
  } catch (e) {
    console.error('Error cleaning up LLM client:', e);
  }
}

// Limpiar al descargar la pagina
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}
