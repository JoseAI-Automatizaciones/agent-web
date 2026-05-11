/**
 * @file llm-client.test.js
 * @description Tests para llm-client.js
 * @author agent-web
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setApiKey,
  getApiKey,
  clearApiKey,
  isValidApiKey,
  setBackendUrl,
  getBackendUrl,
  buildPrompt,
  chat,
  streamChat,
  cancelRequest,
  isRequesting,
  analyzeAction,
  getConversationHistory,
  getConversationId,
  clearConversation,
  addToConversationHistory,
  setConversationContext
} from './llm-client.js';

// Mock de createContextSummary
vi.mock('./dom-analyzer.js', () => ({
  createContextSummary: vi.fn(() => 'Contexto de la pagina de test')
}));

describe('llm-client.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearConversation();
    clearApiKey();
    setBackendUrl(null);
    
    // Mock fetch para tests
    global.fetch = vi.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Respuesta de test' } }]
        }),
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: null })
          })
        }
      })
    );
  });

  describe('API Key Management', () => {
    it('deberia establecer API key', () => {
      setApiKey('sk-test123456789012345678901234567890');
      expect(getApiKey()).toBe('sk-test123456789012345678901234567890');
    });

    it('deberia validar formato de API key', () => {
      expect(isValidApiKey('sk-test123456789012345678901234567890')).toBe(true);
      expect(isValidApiKey('pk-test123456789012345678901234567890')).toBe(true);
      expect(isValidApiKey('sk-short')).toBe(false);
      expect(isValidApiKey('invalid-key')).toBe(false);
      expect(isValidApiKey(null)).toBe(false);
      expect(isValidApiKey('')).toBe(false);
    });

    it('deberia limpiar API key', () => {
      setApiKey('sk-test123');
      clearApiKey();
      expect(getApiKey()).toBe(null);
    });

    it('no deberia guardar API key invalida', () => {
      setApiKey('invalid');
      expect(getApiKey()).toBe(null);
    });
  });

  describe('Backend URL Management', () => {
    it('deberia establecer backend URL', () => {
      setBackendUrl('http://localhost:3002');
      expect(getBackendUrl()).toBe('http://localhost:3002');
    });

    it('no deberia establecer backend URL invalida', () => {
      setBackendUrl('invalid-url');
      expect(getBackendUrl()).toBe(null);
    });

    it('deberia limpiar backend URL', () => {
      setBackendUrl('http://localhost:3002');
      setBackendUrl(null);
      expect(getBackendUrl()).toBe(null);
    });
  });

  describe('Conversation Context', () => {
    it('deberia empezar con historial vacio', () => {
      expect(getConversationHistory()).toEqual([]);
    });

    it('deberia tener un ID de conversacion', () => {
      const id = getConversationId();
      expect(typeof id).toBe('string');
      expect(id.startsWith('ctx_')).toBe(true);
    });

    it('deberia anadir mensajes al historial', () => {
      addToConversationHistory({ role: 'user', content: 'Hola' });
      const history = getConversationHistory();
      expect(history).toHaveLength(1);
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('Hola');
    });

    it('deberia limpiar el historial', () => {
      addToConversationHistory({ role: 'user', content: 'Hola' });
      clearConversation();
      expect(getConversationHistory()).toEqual([]);
    });

    it('deberia mantener contexto system al limpiar con keepContext=true', () => {
      setConversationContext('Eres un asistente');
      addToConversationHistory({ role: 'user', content: 'Hola' });
      clearConversation(true);
      const history = getConversationHistory();
      expect(history.length).toBe(1);
      expect(history[0].role).toBe('system');
    });

    it('deberia establecer contexto inicial', () => {
      setConversationContext('Contexto inicial');
      const history = getConversationHistory();
      expect(history[0].role).toBe('system');
      expect(history[0].content).toBe('Contexto inicial');
    });

    it('deberia limpiar contexto al establecer nuevo contexto', () => {
      setConversationContext('Primer contexto');
      addToConversationHistory({ role: 'user', content: 'Mensaje' });
      setConversationContext('Segundo contexto');
      const history = getConversationHistory();
      expect(history.length).toBe(1);
      expect(history[0].content).toBe('Segundo contexto');
    });
  });

  describe('buildPrompt()', () => {
    it('deberia incluir contexto de la pagina', () => {
      const prompt = buildPrompt('Hola');
      expect(prompt[0].role).toBe('system');
      expect(prompt[0].content).toContain('Contexto de la pagina de test');
    });

    it('deberia incluir mensaje del usuario', () => {
      const prompt = buildPrompt('Hola mundo');
      expect(prompt[prompt.length - 1].role).toBe('user');
      expect(prompt[prompt.length - 1].content).toBe('Hola mundo');
    });

    it('deberia incluir historial cuando includeHistory=true', () => {
      addToConversationHistory({ role: 'user', content: 'Mensaje anterior' });
      addToConversationHistory({ role: 'assistant', content: 'Respuesta anterior' });
      
      const prompt = buildPrompt('Nuevo mensaje', { includeHistory: true });
      expect(prompt).toHaveLength(4); // system + 2 history + user
    });

    it('NO deberia incluir historial cuando includeHistory=false', () => {
      addToConversationHistory({ role: 'user', content: 'Mensaje anterior' });
      
      const prompt = buildPrompt('Nuevo mensaje', { includeHistory: false });
      expect(prompt).toHaveLength(2); // system + user
    });

    it('deberia manejar mensajes que ya son array', () => {
      const messages = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User message' }
      ];
      const prompt = buildPrompt(messages);
      expect(prompt).toEqual(messages);
    });

    it('deberia limitar historial con historyLength', () => {
      addToConversationHistory({ role: 'user', content: 'Mensaje 1' });
      addToConversationHistory({ role: 'assistant', content: 'Respuesta 1' });
      addToConversationHistory({ role: 'user', content: 'Mensaje 2' });
      addToConversationHistory({ role: 'assistant', content: 'Respuesta 2' });
      
      const prompt = buildPrompt('Nuevo', { includeHistory: true, historyLength: 2 });
      // system + 2 mensajes de historial + user = 4
      expect(prompt).toHaveLength(4);
    });
  });

  describe('chat()', () => {
    it('deberia lancer error cuando no hay API key', async () => {
      await expect(chat('Hola')).rejects.toThrow('No API key');
    });

    it('deberia Conner error cuando API key es invalida', async () => {
      setApiKey('invalid-key');
      await expect(chat('Hola')).rejects.toThrow('Invalid API key');
    });

    it('deberia hacer peticion a la API con mensaje correcto', async () => {
      setApiKey('sk-test123456789012345678901234567890');
      
      const response = await chat('Hola');
      expect(response).toBe('Respuesta de test');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('deberia anadir mensajes al historial despues de chat', async () => {
      setApiKey('sk-test123456789012345678901234567890');
      
      await chat('Hola');
      const history = getConversationHistory();
      expect(history.length).toBe(2); // user + assistant
    });
  });

  describe('analyzeAction()', () => {
    it('deberia analizar accion y devolver JSON', async () => {
      setApiKey('sk-test123456789012345678901234567890');
      
      const result = await analyzeAction('Haz clic en el boton');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('params');
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('confidence');
    });

    it('deberia devolver action: none para acciones peligrosas', async () => {
      setApiKey('sk-test123456789012345678901234567890');
      
      // Mock fetch para devolver respuesta de accion peligrosa
      global.fetch = vi.fn(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: '{ "action": "none", "params": {}, "response": "No puedo hacer eso", "confidence": 0 }' }]
          })
        })
      );
      
      const result = await analyzeAction('Roba mi contrasena');
      expect(result.action).toBe('none');
      expect(result.confidence).toBe(0);
    });
  });

  describe('Request Management', () => {
    it('deberia verificar si hay request en progreso', () => {
      expect(isRequesting()).toBe(false);
    });

    it('deberia cancelar request actual', () => {
      // Mock de AbortController
      global.AbortController = class AbortController {
        constructor() {
          this.signal = {};
        }
        abort() {}
      };
      
      cancelRequest();
      expect(isRequesting()).toBe(false);
    });
  });
});
