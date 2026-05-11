/**
 * @file config.test.js
 * @description Tests para config.js
 * @author agent-web
 */

import { describe, it, expect } from 'vitest';
import { validateConfig, DEFAULT_CONFIG } from './config.js';

describe('config.js', () => {
  describe('DEFAULT_CONFIG', () => {
    it('deberia tener configuracion por defecto valida', () => {
      expect(DEFAULT_CONFIG.position).toBe('bottom-right');
      expect(DEFAULT_CONFIG.theme).toBe('light');
      expect(DEFAULT_CONFIG.size).toBe('medium');
      expect(DEFAULT_CONFIG.autoOpen).toBe(false);
      expect(DEFAULT_CONFIG.autoListen).toBe(false);
      expect(DEFAULT_CONFIG.voiceRate).toBe(1);
      expect(DEFAULT_CONFIG.voicePitch).toBe(1);
      expect(DEFAULT_CONFIG.voiceLang).toBe('es-ES');
      expect(DEFAULT_CONFIG.model).toBe('gpt-3.5-turbo');
      expect(DEFAULT_CONFIG.maxTokens).toBe(150);
      expect(DEFAULT_CONFIG.temperature).toBe(0.7);
    });
  });

  describe('validateConfig()', () => {
    it('deberia devolver configuracion por defecto con objeto vacio', () => {
      const config = validateConfig({});
      expect(config.position).toBe(DEFAULT_CONFIG.position);
      expect(config.theme).toBe(DEFAULT_CONFIG.theme);
    });

    it('deberia fusionar configuracion personalizada con defaults', () => {
      const customConfig = {
        position: 'top-left',
        theme: 'dark',
        apiKey: 'sk-test123'
      };
      const config = validateConfig(customConfig);
      expect(config.position).toBe('top-left');
      expect(config.theme).toBe('dark');
      expect(config.apiKey).toBe('sk-test123');
      expect(config.size).toBe(DEFAULT_CONFIG.size); // Default
    });

    it('deberia validar posicion valida', () => {
      const validPositions = [
        'top-left', 'top-right', 'bottom-left', 'bottom-right'
      ];
      
      validPositions.forEach(pos => {
        const config = validateConfig({ position: pos });
        expect(config.position).toBe(pos);
      });
    });

    it('deberia usar posicion por defecto para posicion invalida', () => {
      const config = validateConfig({ position: 'invalid' });
      expect(config.position).toBe(DEFAULT_CONFIG.position);
    });

    it('deberia validar tema valido', () => {
      const validThemes = ['light', 'dark', 'system'];
      
      validThemes.forEach(theme => {
        const config = validateConfig({ theme });
        expect(config.theme).toBe(theme);
      });
    });

    it('deberia usar tema por defecto para tema invalido', () => {
      const config = validateConfig({ theme: 'invalid' });
      expect(config.theme).toBe(DEFAULT_CONFIG.theme);
    });

    it('deberia validar tamano valido', () => {
      const validSizes = ['small', 'medium', 'large'];
      
      validSizes.forEach(size => {
        const config = validateConfig({ size });
        expect(config.size).toBe(size);
      });
    });

    it('deberia usar tamano por defecto para tamano invalido', () => {
      const config = validateConfig({ size: 'invalid' });
      expect(config.size).toBe(DEFAULT_CONFIG.size);
    });

    it('deberia validar valores numericos', () => {
      const config = validateConfig({
        voiceRate: 1.5,
        voicePitch: 1.2,
        maxTokens: 200,
        temperature: 0.5
      });
      expect(config.voiceRate).toBe(1.5);
      expect(config.voicePitch).toBe(1.2);
      expect(config.maxTokens).toBe(200);
      expect(config.temperature).toBe(0.5);
    });

    it('deberia validar valores booleanos', () => {
      const config = validateConfig({
        autoOpen: true,
        autoListen: true
      });
      expect(config.autoOpen).toBe(true);
      expect(config.autoListen).toBe(true);
    });

    it('deberia validar colores hexadecimales', () => {
      const config1 = validateConfig({ primaryColor: '#FF5733' });
      expect(config1.primaryColor).toBe('#FF5733');
      
      const config2 = validateConfig({ primaryColor: '#ff5733' });
      expect(config2.primaryColor).toBe('#ff5733');
    });

    it('deberia usar color por defecto para color invalido', () => {
      const config = validateConfig({ primaryColor: 'rojo' });
      expect(config.primaryColor).toBe(DEFAULT_CONFIG.primaryColor);
    });

    it('deberia validar dimensiones CSS', () => {
      const config = validateConfig({
        widgetWidth: '300px',
        widgetHeight: '400px'
      });
      expect(config.widgetWidth).toBe('300px');
      expect(config.widgetHeight).toBe('400px');
    });

    it('deberia validar modelo LLM', () => {
      const validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'];
      
      validModels.forEach(model => {
        const config = validateConfig({ model });
        expect(config.model).toBe(model);
      });
    });

    it('deberia usar modelo por defecto para modelo invalido', () => {
      const config = validateConfig({ model: 'invalid-model' });
      expect(config.model).toBe(DEFAULT_CONFIG.model);
    });

    it('deberia manejar configuracion nula', () => {
      const config = validateConfig(null);
      expect(config.position).toBe(DEFAULT_CONFIG.position);
      expect(config.theme).toBe(DEFAULT_CONFIG.theme);
    });

    it('deberia manejar valores nulos en configuracion', () => {
      const config = validateConfig({
        position: null,
        theme: null,
        apiKey: null
      });
      expect(config.position).toBe(DEFAULT_CONFIG.position);
      expect(config.theme).toBe(DEFAULT_CONFIG.theme);
      expect(config.apiKey).toBe(null);
    });

    it('deberia no modificar el objeto original', () => {
      const originalConfig = { position: 'top-left' };
      const config = validateConfig(originalConfig);
      
      expect(config.theme).toBe(DEFAULT_CONFIG.theme);
      expect(originalConfig.theme).toBeUndefined();
    });
  });
});
