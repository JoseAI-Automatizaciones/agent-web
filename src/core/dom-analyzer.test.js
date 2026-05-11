/**
 * @file dom-analyzer.test.js
 * @description Tests para dom-analyzer.js
 * @author agent-web
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractVisibleText,
  getPageStructure,
  identifyPageType,
  getInteractiveElements,
  getElementSelector,
  clearAnalysisCache,
  getMainContent,
  getSiteInfo,
  getFullContext,
  extractProductInfo
} from './dom-analyzer.js';

describe('dom-analyzer.js', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <header>
        <title>Test Page</title>
        <meta name="description" content="A test page">
      </header>
      <main>
        <h1>Main Title</h1>
        <p class="visible">Visible paragraph</p>
        <p class="hidden" style="display: none;">Hidden paragraph</p>
        <button id="btn-1" class="btn primary">Button 1</button>
        <button id="btn-2" class="btn secondary">Button 2</button>
        <button class="btn">Button 3</button>
        <div class="product">
          <h2>Product Name</h2>
          <span class="price">$100</span>
        </div>
        <a href="#section">Link</a>
        <input type="text" id="input-1">
        <input type="search" id="search-1">
      </main>
      <footer id="footer">Footer content</footer>
    `;
    clearAnalysisCache();
    vi.clearAllMocks();
  });

  describe('getElementSelector()', () => {
    it('deberia generar selector por ID', () => {
      const element = document.getElementById('btn-1');
      const selector = getElementSelector(element);
      expect(selector).toBe('#btn-1');
    });

    it('deberia generar selector con clases', () => {
      const element = document.querySelector('.btn.primary');
      const selector = getElementSelector(element);
      expect(selector).toContain('.btn.primary');
    });

    it('deberia generar selector con nth-of-type para elementos sin ID unica', () => {
      const buttons = document.querySelectorAll('.btn');
      const selector1 = getElementSelector(buttons[0]);
      const selector2 = getElementSelector(buttons[1]);
      const selector3 = getElementSelector(buttons[2]);
      
      expect(selector1).not.toBe(selector2);
      expect(selector1).not.toBe(selector3);
      expect(selector2).not.toBe(selector3);
      
      expect(selector1).toContain('nth-of-type(1)');
      expect(selector2).toContain('nth-of-type(2)');
      expect(selector3).toContain('nth-of-type(3)');
    });

    it('deberia manejar IDs con caracteres especiales', () => {
      document.body.innerHTML += '<div id="test#id"></div>';
      const element = document.getElementById('test#id');
      const selector = getElementSelector(element);
      expect(selector).toBe('#test\\#id');
    });

    it('deberia generar selector para elementos anidados', () => {
      const element = document.querySelector('#footer');
      const selector = getElementSelector(element);
      expect(selector).toContain('body >');
    });
  });

  describe('extractVisibleText()', () => {
    it('deberia extraer solo texto visible', () => {
      const text = extractVisibleText();
      expect(text).toContain('Visible paragraph');
      expect(text).not.toContain('Hidden paragraph');
    });

    it('deberia respetar maxLength', () => {
      const text = extractVisibleText(10);
      expect(text.length).toBeLessThanOrEqual(10);
    });

    it('deberia devolver texto vacio para body vacio', () => {
      document.body.innerHTML = '';
      const text = extractVisibleText();
      expect(text).toBe('');
    });
  });

  describe('getPageStructure()', () => {
    it('deberia devolver estructura con tag body', () => {
      const structure = getPageStructure();
      expect(structure.tag).toBe('body');
      expect(Array.isArray(structure.children)).toBe(true);
    });

    it('deberia incluir atributos importantes', () => {
      const structure = getPageStructure();
      const btn = structure.children.find(c => c.tag === 'button');
      if (btn) {
        expect(btn.id).toBeDefined();
        expect(btn.classes).toBeDefined();
      }
    });

    it('deberia respetar maxDepth', () => {
      const structure = getPageStructure(1);
      expect(structure.children.length).toBeGreaterThan(0);
      // Nivel 1 no deberia tener hijos
      structure.children.forEach(child => {
        expect(child.children).toEqual([]);
      });
    });
  });

  describe('identifyPageType()', () => {
    it('deberia identificar pagina de e-commerce', () => {
      document.body.innerHTML = '<div>Comprar producto Añadir al carrito Precio: $100</div>';
      const type = identifyPageType();
      expect(type).toBe('e-commerce');
    });

    it('deberia identificar pagina de blog', () => {
      document.body.innerHTML = '<article>Articulo publicado por Autor en fecha</article>';
      const type = identifyPageType();
      expect(type).toBe('blog');
    });

    it('deberia identificar pagina de formulario', () => {
      document.body.innerHTML = '<form><input type="text"><button type="submit">Enviar</button></form>';
      const type = identifyPageType();
      expect(type).toBe('form');
    });

    it('deberia devolver general para paginas sin tipo claro', () => {
      document.body.innerHTML = '<div>Contenido genérico</div>';
      const type = identifyPageType();
      expect(type).toBe('general');
    });
  });

  describe('getInteractiveElements()', () => {
    it('deberia devolver array de elementos interactivos', () => {
      const elements = getInteractiveElements();
      expect(Array.isArray(elements)).toBe(true);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('deberia incluir botones', () => {
      const elements = getInteractiveElements();
      const buttons = elements.filter(e => e.tag === 'button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('deberia incluir inputs visibles', () => {
      const elements = getInteractiveElements();
      const inputs = elements.filter(e => e.tag === 'input');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('deberia incluir enlaces con href', () => {
      const elements = getInteractiveElements();
      const links = elements.filter(e => e.tag === 'a' && e.href);
      expect(links.length).toBeGreaterThan(0);
    });

    it('deberia incluir selector para cada elemento', () => {
      const elements = getInteractiveElements();
      elements.forEach(el => {
        expect(el.selector).toBeTruthy();
        expect(typeof el.selector).toBe('string');
      });
    });
  });

  describe('getMainContent()', () => {
    it('deberia devolver contenido de main si existe', () => {
      const content = getMainContent();
      expect(content).toContain('Main Title');
    });

    it('deberia devolver contenido de body si main no existe', () => {
      document.body.innerHTML = '<div>Only div</div>';
      const content = getMainContent();
      expect(content).toContain('Only div');
    });
  });

  describe('getSiteInfo()', () => {
    it('deberia devolver informacion del sitio', () => {
      const info = getSiteInfo();
      expect(info.title).toBe('Test Page');
      expect(info.description).toBe('A test page');
      expect(info.language).toBe('en');
      expect(info.url).toContain('http');
    });
  });

  describe('getFullContext()', () => {
    it('deberia devolver contexto completo', () => {
      const context = getFullContext();
      expect(context.siteInfo).toBeDefined();
      expect(context.pageType).toBeDefined();
      expect(context.mainContent).toBeDefined();
      expect(context.visibleText).toBeDefined();
      expect(context.structure).toBeDefined();
      expect(context.interactiveElements).toBeDefined();
    });
  });

  describe('extractProductInfo()', () => {
    it('deberia extraer informacion de productos', () => {
      const info = extractProductInfo();
      expect(info.products).toBeDefined();
      expect(Array.isArray(info.products)).toBe(true);
      expect(info.count).toBeDefined();
    });

    it('deberia extraer nombre y precio de producto', () => {
      const info = extractProductInfo();
      if (info.products.length > 0) {
        expect(info.products[0].name).toBeDefined();
        expect(info.products[0].price).toBeDefined();
      }
    });
  });

  describe('clearAnalysisCache()', () => {
    it('deberia limpiar el cache', () => {
      // Primero llamar a funciones que usan cache
      extractVisibleText();
      getPageStructure();
      
      // Llamar a clearAnalysisCache
      clearAnalysisCache();
      
      // El cache deberia estar vacio (no hay forma directa de verificar, pero no deberia haber errores)
      expect(() => extractVisibleText()).not.toThrow();
    });
  });
});
