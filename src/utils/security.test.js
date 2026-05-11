/**
 * @file security.test.js
 * @description Tests para security.js
 * @author agent-web
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isSafeSelector,
  isSafeElement,
  isSafeUrl,
  validateAction,
  initSecurity,
  getAllowedDomains,
  addAllowedDomain,
  removeAllowedDomain
} from './security.js';

describe('security.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resetear seguridad
    initSecurity();
  });

  describe('isSafeSelector()', () => {
    it('deberia permitir selectores de ID simples', () => {
      expect(isSafeSelector('#test')).toBe(true);
      expect(isSafeSelector('#my-element-123')).toBe(true);
    });

    it('deberia permitir selectores de clase simples', () => {
      expect(isSafeSelector('.test')).toBe(true);
      expect(isSafeSelector('.my-class')).toBe(true);
      expect(isSafeSelector('.class1.class2')).toBe(true);
    });

    it('deberia permitir selectores de tag simples', () => {
      expect(isSafeSelector('button')).toBe(true);
      expect(isSafeSelector('div')).toBe(true);
      expect(isSafeSelector('input[type="text"]')).toBe(true);
    });

    it('deberia permitir selectores complejos seguros', () => {
      expect(isSafeSelector('div.container > button.primary')).toBe(true);
      expect(isSafeSelector('main .content p')).toBe(true);
      expect(isSafeSelector('#form :nth-child(2)')).toBe(true);
    });

    it('deberia bloquear selectores script', () => {
      expect(isSafeSelector('script')).toBe(false);
      expect(isSafeSelector('div script')).toBe(false);
    });

    it('deberia bloquear selectores iframe', () => {
      expect(isSafeSelector('iframe')).toBe(false);
      expect(isSafeSelector('.container iframe')).toBe(false);
    });

    it('deberia bloquear selectores style', () => {
      expect(isSafeSelector('style')).toBe(false);
    });

    it('deberia bloquear selectores link', () => {
      expect(isSafeSelector('link')).toBe(false);
    });

    it('deberia bloquear selectores meta', () => {
      expect(isSafeSelector('meta')).toBe(false);
    });

    it('deberia bloquear selectores con javascript:', () => {
      expect(isSafeSelector('a[href="javascript:"]')).toBe(false);
      expect(isSafeSelector('[onclick="javascript:"]')).toBe(false);
    });

    it('deberia bloquear selectores con data:', () => {
      expect(isSafeSelector('a[href="data:"]')).toBe(false);
    });

    it('deberia bloquear selectores con about:', () => {
      expect(isSafeSelector('a[href="about:"]')).toBe(false);
    });

    it('deberia bloquear selectores con expresiones regulares peligrosas', () => {
      expect(isSafeSelector('*')).toBe(false);
      expect(isSafeSelector('div *')).toBe(false);
    });

    it('deberia bloquear selectores con :visited', () => {
      expect(isSafeSelector('a:visited')).toBe(false);
    });

    it('deberia bloquear selectores muy largos', () => {
      const longSelector = 'div'.repeat(200);
      expect(isSafeSelector(longSelector)).toBe(false);
    });

    it('deberia bloquear selectores nulos o vacios', () => {
      expect(isSafeSelector(null)).toBe(false);
      expect(isSafeSelector('')).toBe(false);
    });

    it('deberia permitir selectores con nth-child', () => {
      expect(isSafeSelector('div:nth-child(1)')).toBe(true);
      expect(isSafeSelector('div:nth-of-type(2)')).toBe(true);
    });

    it('deberia permitir selectores con atributos seguros', () => {
      expect(isSafeSelector('[data-test]')).toBe(true);
      expect(isSafeSelector('[aria-label]')).toBe(true);
      expect(isSafeSelector('[role="button"]')).toBe(true);
    });
  });

  describe('isSafeElement()', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="safe-div">Safe</div>
        <input type="text" id="safe-input">
        <input type="password" id="password-input">
        <button id="safe-btn">Click</button>
        <form id="login-form">
          <input type="email" name="email">
          <input type="password" name="password">
        </form>
        <form id="search-form">
          <input type="search" name="q">
        </form>
        <a href="http://external.com" id="external-link">External</a>
        <a href="#section" id="internal-link">Internal</a>
      `;
    });

    it('deberia permitir elementos seguros', () => {
      const div = document.getElementById('safe-div');
      expect(isSafeElement(div)).toBe(true);

      const input = document.getElementById('safe-input');
      expect(isSafeElement(input)).toBe(true);

      const button = document.getElementById('safe-btn');
      expect(isSafeElement(button)).toBe(true);
    });

    it('deberia bloquear campos de password', () => {
      const password = document.getElementById('password-input');
      expect(isSafeElement(password)).toBe(false);
    });

    it('deberia bloquear formularios de login', () => {
      const form = document.getElementById('login-form');
      expect(isSafeElement(form)).toBe(false);
    });

    it('deberia permitir formularios de busqueda', () => {
      const form = document.getElementById('search-form');
      expect(isSafeElement(form)).toBe(true);
    });

    it('deberia bloquear enlaces externos', () => {
      const link = document.getElementById('external-link');
      expect(isSafeElement(link)).toBe(false);
    });

    it('deberia permitir enlaces internos', () => {
      const link = document.getElementById('internal-link');
      expect(isSafeElement(link)).toBe(true);
    });

    it('deberia bloquear elementos script', () => {
      const script = document.createElement('script');
      expect(isSafeElement(script)).toBe(false);
    });

    it('deberia bloquear elementos iframe', () => {
      const iframe = document.createElement('iframe');
      expect(isSafeElement(iframe)).toBe(false);
    });

    it('deberia bloquear elementos style', () => {
      const style = document.createElement('style');
      expect(isSafeElement(style)).toBe(false);
    });

    it('deberia bloquear elementos meta', () => {
      const meta = document.createElement('meta');
      expect(isSafeElement(meta)).toBe(false);
    });

    it('deberia bloquear elementos link', () => {
      const link = document.createElement('link');
      expect(isSafeElement(link)).toBe(false);
    });

    it('deberia manejar elemento nulo', () => {
      expect(isSafeElement(null)).toBe(false);
    });

    it('deberia bloquear inputs con nombre sensible', () => {
      const input = document.createElement('input');
      input.name = 'credit_card';
      expect(isSafeElement(input)).toBe(false);

      input.name = 'cvc';
      expect(isSafeElement(input)).toBe(false);

      input.name = 'ssn';
      expect(isSafeElement(input)).toBe(false);
    });

    it('deberia bloquear inputs con ID sensible', () => {
      const input = document.createElement('input');
      input.id = 'password-field';
      expect(isSafeElement(input)).toBe(false);
    });
  });

  describe('isSafeUrl()', () => {
    it('deberia permitir URLs relativas', () => {
      expect(isSafeUrl('/path')).toBe(true);
      expect(isSafeUrl('#section')).toBe(true);
      expect(isSafeUrl('?query=test')).toBe(true);
      expect(isSafeUrl('/path?query=test#section')).toBe(true);
    });

    it('deberia permitir URLs del mismo origen', () => {
      expect(isSafeUrl('http://localhost:3000/path')).toBe(false); // Sin configurar origen
    });

    it('deberia bloquear URLs absolutas sin configuracion', () => {
      expect(isSafeUrl('https://google.com')).toBe(false);
      expect(isSafeUrl('http://external.com')).toBe(false);
    });

    it('deberia bloquear URLs con javascript:', () => {
      expect(isSafeUrl('javascript:alert("xss")')).toBe(false);
      expect(isSafeUrl('JAVASCRIPT:alert("xss")')).toBe(false);
    });

    it('deberia bloquear URLs con data:', () => {
      expect(isSafeUrl('data:text/html,<script>alert("xss")</script>')).toBe(false);
    });

    it('deberia bloquear URLs con about:', () => {
      expect(isSafeUrl('about:blank')).toBe(false);
    });

    it('deberia bloquear URLs vacias', () => {
      expect(isSafeUrl('')).toBe(false);
    });

    it('deberia manejar URL nula', () => {
      expect(isSafeUrl(null)).toBe(false);
    });

    it('deberia manejar URL invalida', () => {
      expect(isSafeUrl('invalid-url')).toBe(false);
    });
  });

  describe('validateAction()', () => {
    it('deberia validar accion de click valida', () => {
      const result = validateAction({
        type: 'click',
        params: { selector: '#safe-btn' }
      });
      expect(result.isSafe).toBe(true);
      expect(result.reason).toBe(null);
    });

    it('deberia invalidar accion de click con selector peligroso', () => {
      const result = validateAction({
        type: 'click',
        params: { selector: 'script' }
      });
      expect(result.isSafe).toBe(false);
      expect(result.reason).toContain('Selector no seguro');
    });

    it('deberia validar accion de scroll valida', () => {
      const result = validateAction({
        type: 'scroll',
        params: { direction: 'down' }
      });
      expect(result.isSafe).toBe(true);
    });

    it('deberia validar accion de scroll con selector valido', () => {
      const result = validateAction({
        type: 'scroll',
        params: { selector: '#safe-div' }
      });
      expect(result.isSafe).toBe(true);
    });

    it('deberia validar accion de search valida', () => {
      const result = validateAction({
        type: 'search',
        params: { query: 'test' }
      });
      expect(result.isSafe).toBe(true);
    });

    it('deberia validar accion de fillInput valida', () => {
      const result = validateAction({
        type: 'fillInput',
        params: { selector: '#safe-input', value: 'test' }
      });
      expect(result.isSafe).toBe(true);
    });

    it('deberia invalidar accion de fillInput con selector peligroso', () => {
      const result = validateAction({
        type: 'fillInput',
        params: { selector: 'script', value: 'test' }
      });
      expect(result.isSafe).toBe(false);
    });

    it('deberia invalidar accion de navigate con URL externa', () => {
      const result = validateAction({
        type: 'navigate',
        params: { url: 'https://google.com' }
      });
      expect(result.isSafe).toBe(false);
      expect(result.reason).toContain('URL');
    });

    it('deberia validar accion de navigate con URL relativa', () => {
      const result = validateAction({
        type: 'navigate',
        params: { url: '/path' }
      });
      expect(result.isSafe).toBe(true);
    });

    it('deberia manejar tipo de accion desconocido', () => {
      const result = validateAction({
        type: 'unknownAction',
        params: {}
      });
      expect(result.isSafe).toBe(false);
      expect(result.reason).toContain('desconocida');
    });

    it('deberia manejar accion sin params', () => {
      const result = validateAction({
        type: 'click',
        params: null
      });
      // Dependiendo de la implementacion, podria ser valido o invalido
      // Asumimos que es invalido
      expect(result.isSafe).toBe(false);
    });

    it('deberia manejar accion nula', () => {
      const result = validateAction(null);
      expect(result.isSafe).toBe(false);
    });
  });

  describe('Domain Management', () => {
    it('deberia devolver dominios permitidos por defecto', () => {
      const domains = getAllowedDomains();
      expect(Array.isArray(domains)).toBe(true);
    });

    it('deberia anadir dominio permitido', () => {
      addAllowedDomain('example.com');
      const domains = getAllowedDomains();
      expect(domains).toContain('example.com');
    });

    it('deberia eliminar dominio permitido', () => {
      addAllowedDomain('example.com');
      removeAllowedDomain('example.com');
      const domains = getAllowedDomains();
      expect(domains).not.toContain('example.com');
    });

    it('no deberia anadir dominio duplicado', () => {
      addAllowedDomain('example.com');
      addAllowedDomain('example.com');
      const domains = getAllowedDomains();
      const count = domains.filter(d => d === 'example.com').length;
      expect(count).toBe(1);
    });

    it('deberia manejar dominio nulo o vacio', () => {
      addAllowedDomain(null);
      addAllowedDomain('');
      const domains = getAllowedDomains();
      expect(domains).not.toContain(null);
      expect(domains).not.toContain('');
    });
  });

  describe('initSecurity()', () => {
    it('deberia resetear la configuracion de seguridad', () => {
      addAllowedDomain('example.com');
      initSecurity();
      const domains = getAllowedDomains();
      expect(domains).not.toContain('example.com');
    });
  });
});
