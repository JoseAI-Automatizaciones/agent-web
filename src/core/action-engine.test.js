/**
 * @file action-engine.test.js
 * @description Tests para action-engine.js
 * @author agent-web
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  executeAction,
  executeTextAction,
  isActionSafe,
  getAvailableActions,
  getActionHistory,
  clearActionHistory,
  findElementsByText
} from './action-engine.js';
import { ACTION_TYPES } from '../utils/constants.js';

// Mock de analizeAction de llm-client
vi.mock('./llm-client.js', () => ({
  analyzeAction: vi.fn(() => Promise.resolve({
    action: 'click',
    params: { selector: '#test-btn', text: 'Test Button' },
    response: 'Voy a hacer clic en el boton',
    confidence: 0.95
  }))
}));

// Mock de funciones de helpers y security
vi.mock('../utils/helpers.js', () => ({
  getElement: vi.fn((selector, parent) => {
    if (selector === '#test-btn') {
      return document.getElementById('test-btn');
    }
    if (selector === '#hidden-btn') {
      return document.getElementById('hidden-btn');
    }
    if (selector === '#password-input') {
      return document.getElementById('password-input');
    }
    if (selector === '#search-input') {
      return document.getElementById('search-input');
    }
    if (selector === '#test-input') {
      return document.getElementById('test-input');
    }
    return null;
  }),
  getAllElements: vi.fn((selector) => {
    if (selector.includes('search')) {
      return [document.getElementById('search-input')];
    }
    return [];
  }),
  isElementVisible: vi.fn((element) => {
    if (!element) return false;
    return element.id !== 'hidden-btn';
  }),
  smoothScrollTo: vi.fn(() => Promise.resolve())
}));

vi.mock('../utils/security.js', () => ({
  isSafeSelector: vi.fn((selector) => {
    return !selector.includes('script') && !selector.includes('iframe');
  }),
  isSafeElement: vi.fn((element) => {
    if (!element) return false;
    return element.id !== 'password-input';
  }),
  isSafeUrl: vi.fn((url) => {
    return !url.includes('http://') && !url.includes('https://');
  }),
  validateAction: vi.fn((action) => {
    if (action.params?.selector?.includes('script')) {
      return { isSafe: false, reason: 'Selector no seguro' };
    }
    return { isSafe: true };
  })
}));

vi.mock('./dom-analyzer.js', () => ({
  findElementByText: vi.fn((text) => {
    const element = document.querySelector(`[data-test="${text}"]`);
    return element ? [element] : [];
  })
}));

describe('action-engine.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearActionHistory();
    
    // Setup DOM
    document.body.innerHTML = `
      <button id="test-btn">Test Button</button>
      <button id="hidden-btn" style="display: none;">Hidden Button</button>
      <input type="text" id="test-input">
      <input type="password" id="password-input">
      <input type="search" id="search-input">
      <a href="#section">Link</a>
      <div data-test="Click me">Click me text</div>
    `;
  });

  describe('getAvailableActions()', () => {
    it('deberia devolver array de tipos de acciones', () => {
      const actions = getAvailableActions();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions).toContain(ACTION_TYPES.CLICK);
      expect(actions).toContain(ACTION_TYPES.SCROLL);
      expect(actions).toContain(ACTION_TYPES.FILL_INPUT);
      expect(actions).toContain(ACTION_TYPES.SEARCH);
      expect(actions).toContain(ACTION_TYPES.NAVIGATE);
    });
  });

  describe('isActionSafe()', () => {
    it('deberia devolver true para acciones seguras', () => {
      expect(isActionSafe('click', { selector: '#test-btn' })).toBe(true);
      expect(isActionSafe('scroll', { direction: 'down' })).toBe(true);
      expect(isActionSafe('search', { query: 'test' })).toBe(true);
    });

    it('deberia devolver false para acciones peligrosas', () => {
      expect(isActionSafe('click', { selector: 'script' })).toBe(false);
    });
  });

  describe('executeAction() - Click', () => {
    it('deberia ejecutar clic con selector valido', async () => {
      const result = await executeAction(ACTION_TYPES.CLICK, { selector: '#test-btn' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('test-btn');
    });

    it('deberia ejecutar clic con texto', async () => {
      const result = await executeAction(ACTION_TYPES.CLICK, { text: 'Click me' });
      expect(result.success).toBe(true);
    });

    it('deberia fallar con selector invalido', async () => {
      const result = await executeAction(ACTION_TYPES.CLICK, { selector: 'script' });
      expect(result.success).toBe(false);
    });

    it('deberia fallar con elemento no encontrado', async () => {
      const result = await executeAction(ACTION_TYPES.CLICK, { selector: '#no-exists' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('no encontrado');
    });

    it('deberia fallar con elemento oculto', async () => {
      const result = await executeAction(ACTION_TYPES.CLICK, { selector: '#hidden-btn' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('no visible');
    });

    it('deberia fallar sin selector ni texto', async () => {
      const result = await executeAction(ACTION_TYPES.CLICK, {});
      expect(result.success).toBe(false);
      expect(result.message).toContain('selector ni texto');
    });
  });

  describe('executeAction() - Scroll', () => {
    it('deberia ejecutar scroll a elemento', async () => {
      const result = await executeAction(ACTION_TYPES.SCROLL, { selector: '#test-btn' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('desplazo');
    });

    it('deberia ejecutar scroll en direccion', async () => {
      const result = await executeAction(ACTION_TYPES.SCROLL, { direction: 'down' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('down');
    });

    it('deberia ejecutar scroll a la parte superior', async () => {
      const result = await executeAction(ACTION_TYPES.SCROLL, { direction: 'top' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('parte superior');
    });

    it('deberia ejecutar scroll a la parte inferior', async () => {
      const result = await executeAction(ACTION_TYPES.SCROLL, { direction: 'bottom' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('parte inferior');
    });

    it('deberia fallar con direccion invalida', async () => {
      const result = await executeAction(ACTION_TYPES.SCROLL, { direction: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('executeAction() - Fill Input', () => {
    it('deberia llenar input de texto', async () => {
      const result = await executeAction(ACTION_TYPES.FILL_INPUT, {
        selector: '#test-input',
        value: 'Hola mundo'
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain('test-input');
    });

    it('deberia fallar con campo de password', async () => {
      const result = await executeAction(ACTION_TYPES.FILL_INPUT, {
        selector: '#password-input',
        value: '123456'
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain('contraseña');
    });

    it('deberia fallar sin selector', async () => {
      const result = await executeAction(ACTION_TYPES.FILL_INPUT, { value: 'test' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('selector');
    });

    it('deberia fallar sin valor', async () => {
      const result = await executeAction(ACTION_TYPES.FILL_INPUT, { selector: '#test-input' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('valor');
    });

    it('deberia fallar con selector invalido', async () => {
      const result = await executeAction(ACTION_TYPES.FILL_INPUT, {
        selector: 'script',
        value: 'test'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('executeAction() - Search', () => {
    it('deberia buscar en input de busqueda', async () => {
      const result = await executeAction(ACTION_TYPES.SEARCH, { query: 'test query' });
      expect(result.success).toBe(true);
      expect(result.message).toContain('test query');
    });

    it('deberia fallar sin query', async () => {
      const result = await executeAction(ACTION_TYPES.SEARCH, {});
      expect(result.success).toBe(false);
      expect(result.message).toContain('termino');
    });
  });

  describe('executeAction() - Navigate', () => {
    it('deberia fallar con URL externa', async () => {
      const result = await executeAction(ACTION_TYPES.NAVIGATE, { url: 'https://google.com' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('mismo sitio');
    });

    it('deberia fallar sin URL', async () => {
      const result = await executeAction(ACTION_TYPES.NAVIGATE, {});
      expect(result.success).toBe(false);
      expect(result.message).toContain('URL');
    });
  });

  describe('executeTextAction()', () => {
    it('deberia analizar y ejecutar accion desde texto', async () => {
      const result = await executeTextAction('Haz clic en el boton');
      expect(result.success).toBe(true);
      expect(result.message).toContain('clic');
    });

    it('deberia manejar error de analisis', async () => {
      // Mock analyzeAction para que falle
      vi.doMock('./llm-client.js', () => ({
        analyzeAction: vi.fn(() => Promise.reject(new Error('Error de analisis')))
      }));
      
      const result = await executeTextAction('Test');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Error');
    });
  });

  describe('findElementsByText()', () => {
    it('deberia encontrar elementos por texto', () => {
      const elements = findElementsByText('Click me');
      expect(elements).toHaveLength(1);
      expect(elements[0].id).toBe('');
      expect(elements[0].dataset.test).toBe('Click me');
    });

    it('deberia devolver array vacio si no encuentra', () => {
      const elements = findElementsByText('No existe');
      expect(elements).toEqual([]);
    });
  });

  describe('Action History', () => {
    it('deberia guardar acciones en el historial', async () => {
      await executeAction(ACTION_TYPES.CLICK, { selector: '#test-btn' });
      const history = getActionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe(ACTION_TYPES.CLICK);
    });

    it('deberia limpiar el historial', async () => {
      await executeAction(ACTION_TYPES.CLICK, { selector: '#test-btn' });
      clearActionHistory();
      expect(getActionHistory()).toEqual([]);
    });
  });

  describe('Action Types', () => {
    it('deberia manejar tipo de accion desconocido', async () => {
      const result = await executeAction('INVALID_ACTION', {});
      expect(result.success).toBe(false);
      expect(result.message).toContain('desconocida');
    });
  });
});
