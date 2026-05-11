/**
 * @file voice-manager.test.js
 * @description Tests para voice-manager.js
 * @author agent-web
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeText,
  configureVoice,
  getVoiceSettings,
  resetVoiceSettings,
  isSupported,
  startListening,
  stopListening,
  speak,
  isSpeaking,
  isListening
} from './voice-manager.js';

describe('voice-manager.js', () => {
  beforeEach(() => {
    resetVoiceSettings();
    vi.clearAllMocks();
  });

  describe('normalizeText()', () => {
    it('deberia normalizar espacios multiples', () => {
      expect(normalizeText('  Hola   mundo  ')).toBe('Hola mundo');
    });

    it('deberia normalizar saltos de linea', () => {
      expect(normalizeText('Hola\nmundo')).toBe('Hola mundo');
    });

    it('deberia eliminar caracteres especiales', () => {
      expect(normalizeText('Hola\u200Bmundo')).toBe('Holamundo');
    });

    it('deberia reemplazar comillas inteligentes', () => {
      expect(normalizeText('It\u2019s a test')).toBe('Its a test');
      expect(normalizeText('\u201CHello\u201D')).toBe('"Hello"');
    });

    it('deberia reemplazar signos multiples', () => {
      expect(normalizeText('Hola!!!')).toBe('Hola!');
      expect(normalizeText('Que???')).toBe('Que?');
      expect(normalizeText('Hola...')).toBe('Hola...');
    });

    it('NO deberia anadir punto a mensajes cortos (<20 chars)', () => {
      expect(normalizeText('Hola mundo')).toBe('Hola mundo');
      expect(normalizeText('Hola')).toBe('Hola');
      expect(normalizeText(')).toBe('');
    });

    it('deberia manejar valores nulos y vacios', () => {
      expect(normalizeText(null)).toBe('');
      expect(normalizeText(undefined)).toBe('');
      expect(normalizeText('')).toBe('');
    });
  });

  describe('configureVoice()', () => {
    it('deberia configurar rate', () => {
      configureVoice({ rate: 1.5 });
      const settings = getVoiceSettings();
      expect(settings.rate).toBe(1.5);
    });

    it('deberia configurar pitch', () => {
      configureVoice({ pitch: 1.2 });
      const settings = getVoiceSettings();
      expect(settings.pitch).toBe(1.2);
    });

    it('deberia configurar lang', () => {
      configureVoice({ lang: 'en-US' });
      const settings = getVoiceSettings();
      expect(settings.lang).toBe('en-US');
    });

    it('deberia configurar voice', () => {
      configureVoice({ voice: 'Google es-ES' });
      const settings = getVoiceSettings();
      expect(settings.voice).toBe('Google es-ES');
    });

    it('deberia validar rate dentro de rango (0.1-10)', () => {
      configureVoice({ rate: 20 });
      const settings = getVoiceSettings();
      expect(settings.rate).toBe(10); // Maximo

      configureVoice({ rate: 0 });
      const settings2 = getVoiceSettings();
      expect(settings2.rate).toBe(0.1); // Minimo
    });

    it('deberia validar pitch dentro de rango (0-2)', () => {
      configureVoice({ pitch: 5 });
      const settings = getVoiceSettings();
      expect(settings.pitch).toBe(2); // Maximo

      configureVoice({ pitch: -1 });
      const settings2 = getVoiceSettings();
      expect(settings2.pitch).toBe(0); // Minimo
    });

    it('deberia manejar configuraciones invalidas', () => {
      configureVoice(null);
      const settings1 = getVoiceSettings();
      expect(settings1.rate).toBe(1); // Valor por defecto

      configureVoice('invalid');
      const settings2 = getVoiceSettings();
      expect(settings2.rate).toBe(1); // Sin cambios

      configureVoice({});
      const settings3 = getVoiceSettings();
      expect(settings3.rate).toBe(1); // Sin cambios
    });
  });

  describe('getVoiceSettings()', () => {
    it('deberia devolver la configuracion actual', () => {
      configureVoice({ rate: 1.5, pitch: 1.2, lang: 'en-US' });
      const settings = getVoiceSettings();
      expect(settings.rate).toBe(1.5);
      expect(settings.pitch).toBe(1.2);
      expect(settings.lang).toBe('en-US');
    });

    it('deberia devolver una copia (no referencia)', () => {
      const settings1 = getVoiceSettings();
      settings1.rate = 5;
      const settings2 = getVoiceSettings();
      expect(settings2.rate).not.toBe(5);
    });
  });

  describe('resetVoiceSettings()', () => {
    it('deberia restablecer a valores por defecto', () => {
      configureVoice({ rate: 5, pitch: 2, lang: 'fr-FR', voice: 'Test' });
      resetVoiceSettings();
      const settings = getVoiceSettings();
      expect(settings.rate).toBe(1);
      expect(settings.pitch).toBe(1);
      expect(settings.lang).toBe('es-ES');
      expect(settings.voice).toBe(null);
    });
  });

  describe('isSupported()', () => {
    it('deberia devolver true cuando Web Speech API esta disponible', () => {
      global.SpeechRecognition = class {};
      global.webkitSpeechRecognition = class {};
      expect(isSupported()).toBe(true);
    });

    it('deberia devolver false cuando Web Speech API no esta disponible', () => {
      global.SpeechRecognition = undefined;
      global.webkitSpeechRecognition = undefined;
      expect(isSupported()).toBe(false);
    });
  });

  describe('startListening() y stopListening()', () => {
    it('deberia iniciar el reconocimiento de voz', () => {
      const result = startListening(() => {}, () => {}, () => {}, { lang: 'en-US' });
      expect(result).toBe(true);
      expect(isListening()).toBe(true);
      stopListening();
    });

    it('deberia detener el reconocimiento de voz', () => {
      startListening(() => {});
      expect(isListening()).toBe(true);
      stopListening();
      expect(isListening()).toBe(false);
    });

    it('deberia devolver false cuando Web Speech API no esta disponible', () => {
      global.SpeechRecognition = undefined;
      global.webkitSpeechRecognition = undefined;
      const result = startListening(() => {});
      expect(result).toBe(false);
    });
  });

  describe('speak()', () => {
    it('deberia sintetizar texto a voz', () => {
      speak('Hola mundo');
      expect(global.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('deberia normalizar el texto antes de sintetizar', () => {
      speak('  Hola   mundo  ');
      expect(global.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('no deberia hacer nada con texto vacio', () => {
      speak('');
      expect(global.speechSynthesis.speak).not.toHaveBeenCalled();
    });

    it('no deberia hacer nada con texto null', () => {
      speak(null);
      expect(global.speechSynthesis.speak).not.toHaveBeenCalled();
    });
  });

  describe('isSpeaking()', () => {
    it('deberia devolver false cuando no esta hablando', () => {
      expect(isSpeaking()).toBe(false);
    });
  });
});
