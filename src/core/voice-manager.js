/**
 * @file voice-manager.js
 * @description Gestor de voz para el widget agent-web
 * Maneja entrada y salida de voz usando Web Speech API
 * @author agent-web
 */

import { 
  DEFAULT_VOICE_RATE, 
  DEFAULT_VOICE_PITCH, 
  DEFAULT_VOICE_LANG 
} from '../utils/constants.js';

/**
 * @typedef {Object} VoiceSettings
 * @property {number} rate - Velocidad de voz (0.1 - 10)
 * @property {number} pitch - Tono de voz (0 - 2)
 * @property {string} lang - Idioma de voz
 * @property {string} voice - Voz especifica (opcional)
 */

/**
 * @typedef {Object} VoiceResult
 * @property {string} text - Texto transcrito
 * @property {boolean} isFinal - Indica si es el resultado final
 */

// Estado del reconocimiento de voz
let recognition = null;
let synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
let currentUtterance = null;
let onResultCallback = null;
let onErrorCallback = null;
let onEndCallback = null;
let voicesChangedListener = null;

// Estado por instancia (para soporte de multiples instancias)
const instanceState = new Map();

// Configuracion global de voz (valores por defecto que se aplican a todas las llamadas)
let defaultVoiceSettings = {
  rate: DEFAULT_VOICE_RATE,
  pitch: DEFAULT_VOICE_PITCH,
  lang: DEFAULT_VOICE_LANG,
  voice: null
};

/**
 * Verifica si Web Speech API esta disponible
 * @returns {boolean} - True si esta disponible
 */
export function isSupported() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Obtiene el objeto SpeechRecognition (con polyfill para Safari)
 * @private
 * @returns {SpeechRecognition|webkitSpeechRecognition|null}
 */
function getSpeechRecognition() {
  if ('SpeechRecognition' in window) {
    return window.SpeechRecognition;
  }
  if ('webkitSpeechRecognition' in window) {
    return window.webkitSpeechRecognition;
  }
  return null;
}

/**
 * Inicia el reconocimiento de voz
 * @param {Function} onResult - Callback para resultados
 * @param {Function=} onError - Callback para errores
 * @param {Function=} onEnd - Callback para cuando termina
 * @param {VoiceSettings=} settings - Configuracion de voz
 * @returns {boolean} - True si se inicio correctamente
 */
export function startListening(onResult, onError = null, onEnd = null, settings = {}) {
  try {
    // Verificar si esta disponible
    if (!isSupported()) {
      if (onError) onError(new Error('Web Speech API not supported'));
      return false;
    }
    
    // Limpiar reconocimiento anterior
    stopListening();
    
    // Configurar callbacks
    onResultCallback = onResult;
    onErrorCallback = onError;
    onEndCallback = onEnd;
    
    // Crear instancia de reconocimiento
    const SpeechRecognitionClass = getSpeechRecognition();
    recognition = new SpeechRecognitionClass();
    
    // Configurar recognition - usar configuracion global por defecto
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = settings.lang || defaultVoiceSettings.lang || DEFAULT_VOICE_LANG;
    
    // Eventos - usar funciones nombradas para poder limpiarlas
    const handleResult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Normalizar texto
      const normalizedText = normalizeText(finalTranscript || interimTranscript);
      
      if (onResultCallback) {
        onResultCallback({
          text: normalizedText,
          isFinal: event.results[event.results.length - 1].isFinal,
          interim: interimTranscript
        });
      }
    };
    
    const handleError = (event) => {
      console.error('Speech recognition error:', event.error);
      if (onErrorCallback) {
        onErrorCallback(new Error(event.error || 'Unknown error'));
      }
    };
    
    const handleEnd = () => {
      if (onEndCallback) {
        onEndCallback();
      }
      // Limpiar referencia
      recognition = null;
    };
    
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;
    
    // Iniciar reconocimiento
    recognition.start();
    
    return true;
  } catch (e) {
    console.error('Error starting speech recognition:', e);
    if (onError) onError(e);
    return false;
  }
}

/**
 * Detiene el reconocimiento de voz
 * @returns {void}
 */
export function stopListening() {
  try {
    if (recognition) {
      // Limpiar event listeners antes de detener
      if (recognition.onresult) recognition.onresult = null;
      if (recognition.onerror) recognition.onerror = null;
      if (recognition.onend) recognition.onend = null;
      
      recognition.stop();
      recognition = null;
    }
    
    // Limpiar callbacks
    onResultCallback = null;
    onErrorCallback = null;
    onEndCallback = null;
  } catch (e) {
    console.error('Error stopping speech recognition:', e);
  }
}

/**
 * Pausa el reconocimiento de voz
 * @returns {void}
 */
export function pauseListening() {
  try {
    if (recognition) {
      recognition.stop();
    }
  } catch (e) {
    console.error('Error pausing speech recognition:', e);
  }
}

/**
 * Reanuda el reconocimiento de voz
 * @returns {boolean} - True si se reanudo correctamente
 */
export function resumeListening() {
  try {
    if (recognition) {
      recognition.start();
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error resuming speech recognition:', e);
    return false;
  }
}

/**
 * Sintetiza texto a voz
 * @param {string} text - Texto a sintetizar
 * @param {Function=} onEnd - Callback para cuando termina
 * @param {VoiceSettings=} settings - Configuracion de voz
 * @returns {void}
 */
export function speak(text, onEnd = null, settings = {}) {
  try {
    // Cancelar cualquier reproduccion actual
    cancelSpeak();
    
    if (!text || typeof text !== 'string') {
      return;
    }
    
    // Verificar si synthesis esta disponible
    if (!synthesis) {
      console.error('Speech synthesis not available');
      return;
    }
    
    // Normalizar texto
    const normalizedText = normalizeText(text);
    
    // Crear utterance
    const utterance = new SpeechSynthesisUtterance(normalizedText);
    
    // Configurar voz - usar configuracion global por defecto
    utterance.rate = settings.rate !== undefined ? settings.rate : defaultVoiceSettings.rate;
    utterance.pitch = settings.pitch !== undefined ? settings.pitch : defaultVoiceSettings.pitch;
    utterance.lang = settings.lang || defaultVoiceSettings.lang || DEFAULT_VOICE_LANG;
    
    // Si hay una voz especifica configurada globalmente, intentarla usar
    if (defaultVoiceSettings.voice && !settings.voice) {
      // Esperar a que las voces esten disponibles y buscar la voz
      const applyVoice = () => {
        const voices = synthesis.getVoices();
        const voice = voices.find(v => v.name === defaultVoiceSettings.voice || v.lang === defaultVoiceSettings.voice);
        if (voice) {
          utterance.voice = voice;
        }
      };
      
      if (synthesis.onvoiceschanged === null) {
        // Voces ya cargadas
        applyVoice();
      } else {
        // Esperar a que se carguen
        const tryApply = () => {
          try {
            applyVoice();
          } catch (e) {
            console.warn('Could not apply default voice:', e);
          }
        };
        synthesis.onvoiceschanged = tryApply;
      }
    }
    
    // Configurar callback
    if (onEnd) {
      utterance.onend = () => {
        currentUtterance = null;
        onEnd();
      };
    } else {
      utterance.onend = () => {
        currentUtterance = null;
      };
    }
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      currentUtterance = null;
    };
    
    // Guardar referencia
    currentUtterance = utterance;
    
    // Reproducir
    synthesis.speak(utterance);
  } catch (e) {
    console.error('Error speaking:', e);
  }
}

/**
 * Cancela la reproduccion de voz actual
 * @returns {void}
 */
export function cancelSpeak() {
  try {
    if (currentUtterance) {
      // Limpiar event listeners
      if (currentUtterance.onend) currentUtterance.onend = null;
      if (currentUtterance.onerror) currentUtterance.onerror = null;
      
      synthesis.cancel();
      currentUtterance = null;
    }
  } catch (e) {
    console.error('Error canceling speech:', e);
  }
}

/**
 * Pausa la reproduccion de voz
 * @returns {void}
 */
export function pauseSpeak() {
  try {
    if (synthesis) {
      synthesis.pause();
    }
  } catch (e) {
    console.error('Error pausing speech:', e);
  }
}

/**
 * Reanuda la reproduccion de voz
 * @returns {void}
 */
export function resumeSpeak() {
  try {
    if (synthesis) {
      synthesis.resume();
    }
  } catch (e) {
    console.error('Error resuming speech:', e);
  }
}

/**
 * Verifica si esta hablando actualmente
 * @returns {boolean} - True si esta hablando
 */
export function isSpeaking() {
  return synthesis?.speaking || !!currentUtterance;
}

/**
 * Verifica si esta escuchando actualmente
 * @returns {boolean} - True si esta escuchando
 */
export function isListening() {
  return !!recognition;
}

/**
 * Obtiene la lista de voces disponibles
 * @returns {Promise<Array<SpeechSynthesisVoice>>} - Promesa con la lista de voces
 */
export function getVoices() {
  return new Promise((resolve) => {
    try {
      if (!synthesis) {
        resolve([]);
        return;
      }
      
      // Limpiar listener anterior si existe
      if (voicesChangedListener) {
        synthesis.onvoiceschanged = null;
        voicesChangedListener = null;
      }
      
      // En Chrome, las voces no estan disponibles de inmediato
      if (synthesis.onvoiceschanged === null) {
        // Las voces ya estan cargadas
        resolve(Array.from(synthesis.getVoices()));
      } else {
        // Esperar a que las voces se carguen
        voicesChangedListener = () => {
          synthesis.onvoiceschanged = null;
          voicesChangedListener = null;
          resolve(Array.from(synthesis.getVoices()));
        };
        synthesis.onvoiceschanged = voicesChangedListener;
      }
    } catch (e) {
      console.error('Error getting voices:', e);
      voicesChangedListener = null;
      resolve([]);
    }
  });
}

/**
 * Configura la voz por nombre
 * @param {string} voiceName - Nombre de la voz
 * @param {VoiceSettings=} settings - Configuracion adicional
 * @returns {Promise<VoiceSettings>} - Promesa con la configuracion aplicada
 */
export async function setVoice(voiceName, settings = {}) {
  try {
    const voices = await getVoices();
    const voice = voices.find(v => v.name === voiceName || v.lang === voiceName);
    
    if (voice) {
      return {
        ...settings,
        voice: voiceName,
        lang: voice.lang
      };
    }
    
    return settings;
  } catch (e) {
    console.error('Error setting voice:', e);
    return settings;
  }
}

/**
 * Configura los parametros de voz globales
 * Estos valores se usaran por defecto en startListening() y speak()
 * @param {VoiceSettings} settings - Configuracion de voz
 * @returns {void}
 */
export function configureVoice(settings) {
  if (!settings || typeof settings !== 'object') {
    return;
  }
  
  if (settings.rate !== undefined) {
    defaultVoiceSettings.rate = Math.min(Math.max(settings.rate, 0.1), 10);
  }
  
  if (settings.pitch !== undefined) {
    defaultVoiceSettings.pitch = Math.min(Math.max(settings.pitch, 0), 2);
  }
  
  if (settings.lang) {
    defaultVoiceSettings.lang = settings.lang;
  }
  
  if (settings.voice !== undefined) {
    defaultVoiceSettings.voice = settings.voice;
  }
}

/**
 * Obtiene la configuracion global de voz actual
 * @returns {VoiceSettings} - Configuracion actual
 */
export function getVoiceSettings() {
  return { ...defaultVoiceSettings };
}

/**
 * Resetea la configuracion de voz a los valores por defecto
 * @returns {void}
 */
export function resetVoiceSettings() {
  defaultVoiceSettings = {
    rate: DEFAULT_VOICE_RATE,
    pitch: DEFAULT_VOICE_PITCH,
    lang: DEFAULT_VOICE_LANG,
    voice: null
  };
}

/**
 * Normaliza texto para voz
 * @private
 * @param {string} text - Texto a normalizar
 * @param {boolean=} addFinalPunctuation - Si añadir puntuacion final (default: true solo para textos largos)
 * @returns {string} - Texto normalizado
 */
function normalizeText(text, addFinalPunctuation = false) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Convertir a string si no lo es
  let normalized = String(text);
  
  // Eliminar espacios multiples
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Trim
  normalized = normalized.trim();
  
  // Reemplazar caracteres especiales
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // Reemplazar comillas inteligentes
  normalized = normalized.replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  
  // Reemplazar signos de exclamacion e interrogacion multiples
  normalized = normalized.replace(/(!|\?)+/g, '$1');
  
  // Reemplazar puntos suspensivos
  normalized = normalized.replace(/\.\.+/g, '...');
  
  // Asegurar que termine con un punto si no lo hace (solo si se solicita o para oraciones largas)
  if (addFinalPunctuation && normalized && !/[.!?]$/.test(normalized)) {
    normalized += '.';
  }
  
  return normalized;
}

/**
 * Limpia recursos de voz
 * @returns {void}
 */
export function cleanup() {
  try {
    stopListening();
    cancelSpeak();
    onResultCallback = null;
    onErrorCallback = null;
    onEndCallback = null;
    
    // Limpiar listener de voiceschanged
    if (synthesis && voicesChangedListener) {
      synthesis.onvoiceschanged = null;
      voicesChangedListener = null;
    }
    
    // Limpiar estado por instancia
    instanceState.clear();
    
    // Limpiar configuracion global
    resetVoiceSettings();
  } catch (e) {
    console.error('Error cleaning up voice manager:', e);
  }
}

// Limpiar al descargar la pagina
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}
