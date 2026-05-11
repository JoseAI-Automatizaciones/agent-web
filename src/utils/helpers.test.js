/**
 * @file helpers.test.js
 * @description Tests para helpers.js
 * @author agent-web
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getElement,
  getAllElements,
  isElementVisible,
  truncateText,
  stripHtml,
  debounce,
  throttle,
  safeHtml,
  formatTime,
  isNonEmptyString,
  generateId,
  addSafeEventListener,
  getSessionStorage,
  setSessionStorage,
  removeSessionStorage,
  clearAllStorage
} from './helpers.js';

describe('helpers.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup DOM
    document.body.innerHTML = `
      <div id="test-div">Test content</div>
      <div class="test-class">Class content</div>
      <div style="display: none;">Hidden</div>
      <div style="visibility: hidden;">Invisible</div>
      <p>Paragraph <strong>bold</strong> text</p>
      <div>Long text that needs to be truncated for testing purposes</div>
    `;
    
    // Clear sessionStorage
    sessionStorage.clear();
  });

  describe('DOM Helpers', () => {
    describe('getElement()', () => {
      it('deberia encontrar elemento por selector', () => {
        const element = getElement('#test-div');
        expect(element).not.toBe(null);
        expect(element.id).toBe('test-div');
      });

      it('deberia encontrar elemento por clase', () => {
        const element = getElement('.test-class');
        expect(element).not.toBe(null);
        expect(element.className).toBe('test-class');
      });

      it('deberia encontrar elemento en parent especifico', () => {
        const parent = document.createElement('div');
        parent.innerHTML = '<span id="child"></span>';
        const element = getElement('#child', parent);
        expect(element).not.toBe(null);
        expect(element.id).toBe('child');
      });

      it('deberia devolver null para selector invalido', () => {
        const element = getElement('#no-exists');
        expect(element).toBe(null);
      });

      it('deberia devolver null para selector nulo', () => {
        const element = getElement(null);
        expect(element).toBe(null);
      });
    });

    describe('getAllElements()', () => {
      it('deberia encontrar multiples elementos', () => {
        document.body.innerHTML += '<div class="test-class"></div><div class="test-class"></div>';
        const elements = getAllElements('.test-class');
        expect(elements.length).toBeGreaterThanOrEqual(2);
      });

      it('deberia devolver array vacio para selector invalido', () => {
        const elements = getAllElements('#no-exists');
        expect(elements).toEqual([]);
      });

      it('deberia encontrar elementos en parent especifico', () => {
        const parent = document.createElement('div');
        parent.innerHTML = '<span class="child"></span><span class="child"></span>';
        const elements = getAllElements('.child', parent);
        expect(elements.length).toBe(2);
      });
    });

    describe('isElementVisible()', () => {
      it('deberia devolver true para elemento visible', () => {
        const element = document.getElementById('test-div');
        expect(isElementVisible(element)).toBe(true);
      });

      it('deberia devolver false para elemento con display: none', () => {
        const element = document.querySelector('[style="display: none;"]');
        expect(isElementVisible(element)).toBe(false);
      });

      it('deberia devolver false para elemento con visibility: hidden', () => {
        const element = document.querySelector('[style="visibility: hidden;"]');
        expect(isElementVisible(element)).toBe(false);
      });

      it('deberia devolver false para elemento nulo', () => {
        expect(isElementVisible(null)).toBe(false);
      });

      it('deberia devolver false para elemento sin offsetParent', () => {
        const element = document.createElement('div');
        expect(isElementVisible(element)).toBe(false);
      });
    });
  });

  describe('Text Helpers', () => {
    describe('truncateText()', () => {
      it('deberia truncar texto largo', () => {
        const text = 'This is a very long text that should be truncated';
        const truncated = truncateText(text, 20);
        expect(truncated.length).toBeLessThanOrEqual(20);
        expect(truncated).toContain('...');
      });

      it('deberia devolver texto completo si es corto', () => {
        const text = 'Short';
        const truncated = truncateText(text, 20);
        expect(truncated).toBe(text);
      });

      it('deberia manejar texto vacio', () => {
        expect(truncateText('', 10)).toBe('');
      });

      it('deberia manejar maxLength 0', () => {
        expect(truncateText('test', 0)).toBe('');
      });

      it('deberia manejar maxLength negativo', () => {
        expect(truncateText('test', -5)).toBe('');
      });
    });

    describe('stripHtml()', () => {
      it('deberia eliminar tags HTML', () => {
        const html = '<p>Paragraph <strong>bold</strong> text</p>';
        const text = stripHtml(html);
        expect(text).toBe('Paragraph bold text');
      });

      it('deberia manejar HTML anidado', () => {
        const html = '<div><p><span>Nested</span> text</p></div>';
        const text = stripHtml(html);
        expect(text).toBe('Nested text');
      });

      it('deberia manejar texto sin HTML', () => {
        const text = 'Plain text';
        expect(stripHtml(text)).toBe(text);
      });

      it('deberia manejar texto vacio', () => {
        expect(stripHtml('')).toBe('');
      });

      it('deberia manejar texto nulo', () => {
        expect(stripHtml(null)).toBe('');
      });

      it('deberia reemplazar multiples espacios', () => {
        const html = '<div>Text   with    spaces</div>';
        const text = stripHtml(html);
        expect(text).toBe('Text with spaces');
      });
    });
  });

  describe('Security Helpers', () => {
    describe('safeHtml()', () => {
      it('deberia escapear tags HTML', () => {
        const unsafe = '<script>alert("xss")</script>';
        const safe = safeHtml(unsafe);
        expect(safe).not.toContain('<script>');
        expect(safe).not.toContain('</script>');
      });

      it('deberia manejar texto seguro', () => {
        const text = 'Hello world';
        expect(safeHtml(text)).toBe(text);
      });

      it('deberia manejar texto vacio', () => {
        expect(safeHtml('')).toBe('');
      });

      it('deberia manejar texto nulo', () => {
        expect(safeHtml(null)).toBe('');
      });
    });
  });

  describe('Utility Helpers', () => {
    describe('formatTime()', () => {
      it('deberia formatear tiempo en segundos', () => {
        const time = formatTime(65);
        expect(time).toBe('1:05');
      });

      it('deberia formatear tiempo en minutos', () => {
        const time = formatTime(125);
        expect(time).toBe('2:05');
      });

      it('deberia formatear tiempo menos de 1 minuto', () => {
        const time = formatTime(45);
        expect(time).toBe('0:45');
      });

      it('deberia manejar 0 segundos', () => {
        expect(formatTime(0)).toBe('0:00');
      });

      it('deberia manejar tiempo negativo', () => {
        expect(formatTime(-10)).toBe('0:00');
      });
    });

    describe('isNonEmptyString()', () => {
      it('deberia devolver true para string no vacio', () => {
        expect(isNonEmptyString('test')).toBe(true);
        expect(isNonEmptyString(' ')).toBe(true);
      });

      it('deberia devolver false para string vacio', () => {
        expect(isNonEmptyString('')).toBe(false);
      });

      it('deberia devolver false para null', () => {
        expect(isNonEmptyString(null)).toBe(false);
      });

      it('deberia devolver false para undefined', () => {
        expect(isNonEmptyString(undefined)).toBe(false);
      });

      it('deberia devolver false para numero', () => {
        expect(isNonEmptyString(123)).toBe(false);
      });

      it('deberia devolver false para objeto', () => {
        expect(isNonEmptyString({})).toBe(false);
      });
    });

    describe('generateId()', () => {
      it('deberia generar ID unica', () => {
        const id1 = generateId();
        const id2 = generateId();
        expect(id1).not.toBe(id2);
      });

      it('deberia generar ID con prefijo', () => {
        const id = generateId('test');
        expect(id.startsWith('test-')).toBe(true);
      });

      it('deberia generar ID con timestamp', () => {
        const id = generateId();
        expect(id.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Event Helpers', () => {
    describe('addSafeEventListener()', () => {
      it('deberia anadir event listener y devolver funcion de cleanup', () => {
        const element = document.createElement('div');
        const callback = vi.fn();
        
        const cleanup = addSafeEventListener(element, 'click', callback);
        
        // Disparar evento
        element.click();
        expect(callback).toHaveBeenCalled();
        
        // Limpiar
        cleanup();
        callback.mockClear();
        element.click();
        expect(callback).not.toHaveBeenCalled();
      });

      it('deberia manejar elemento nulo', () => {
        const cleanup = addSafeEventListener(null, 'click', () => {});
        expect(typeof cleanup).toBe('function');
        cleanup();
      });
    });
  });

  describe('Storage Helpers', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    describe('sessionStorage helpers', () => {
      it('deberia establecer valor en sessionStorage', () => {
        setSessionStorage('testKey', 'testValue');
        expect(sessionStorage.getItem('testKey')).toBe('testValue');
      });

      it('deberia obtener valor de sessionStorage', () => {
        sessionStorage.setItem('testKey', 'testValue');
        const value = getSessionStorage('testKey');
        expect(value).toBe('testValue');
      });

      it('deberia devolver null para clave inexistente', () => {
        const value = getSessionStorage('no-exists');
        expect(value).toBe(null);
      });

      it('deberia eliminar valor de sessionStorage', () => {
        sessionStorage.setItem('testKey', 'testValue');
        removeSessionStorage('testKey');
        expect(sessionStorage.getItem('testKey')).toBe(null);
      });

      it('deberia manejar clave nula', () => {
        setSessionStorage(null, 'value');
        expect(getSessionStorage(null)).toBe(null);
        removeSessionStorage(null);
      });
    });

    describe('clearAllStorage()', () => {
      it('deberia limpiar sessionStorage', () => {
        sessionStorage.setItem('key1', 'value1');
        sessionStorage.setItem('key2', 'value2');
        
        clearAllStorage();
        
        expect(sessionStorage.getItem('key1')).toBe(null);
        expect(sessionStorage.getItem('key2')).toBe(null);
      });
    });
  });

  describe('Function Helpers', () => {
    describe('debounce()', () => {
      it('deberia ejecutar funcion solo una vez despues del delay', async () => {
        const callback = vi.fn();
        const debounced = debounce(callback, 100);
        
        debounced();
        debounced();
        debounced();
        
        expect(callback).not.toHaveBeenCalled();
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('deberia ejecutar funcion inmediatamente si es la primera vez con immediate=true', async () => {
        const callback = vi.fn();
        const debounced = debounce(callback, 100, true);
        
        debounced();
        expect(callback).toHaveBeenCalledTimes(1);
        
        debounced();
        debounced();
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        expect(callback).toHaveBeenCalledTimes(2);
      });
    });

    describe('throttle()', () => {
      it('deberia ejecutar funcion una vez por intervalo', async () => {
        const callback = vi.fn();
        const throttled = throttle(callback, 100);
        
        throttled();
        throttled();
        throttled();
        
        expect(callback).toHaveBeenCalledTimes(1);
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        throttled();
        expect(callback).toHaveBeenCalledTimes(2);
      });
    });
  });
});
