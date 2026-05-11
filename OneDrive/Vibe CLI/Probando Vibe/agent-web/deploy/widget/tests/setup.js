/**
 * @file setup.js
 * @description Configuracion global para tests con Vitest
 * @author agent-web
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Mock global de window y document para tests
const { JSDOM } = require('jsdom');

// Configurar JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;
global.SpeechRecognition = class SpeechRecognition {
  constructor() {
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.continuous = false;
    this.interimResults = false;
    this.lang = 'es-ES';
  }
  start() {}
  stop() {}
};
global.webkitSpeechRecognition = global.SpeechRecognition;
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  onvoiceschanged: null,
  speaking: false,
  pending: false
};

// Mock de fetch para tests
vi.stubGlobal('fetch', vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ choices: [{ message: { content: 'Respuesta de test' } }] }),
    body: {
      getReader: () => ({
        read: () => Promise.resolve({ done: true, value: null })
      })
    }
  })
));

// Mock de CSS.escape
if (!global.CSS) {
  global.CSS = {};
}
CSS.escape = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Limpiar DOM antes de cada test
beforeEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

// Configuracion global de Vitest
export default {};
