# 🧪 /tests - AGENTS.md

## 📌 Descripción

El directorio **`/tests`** contiene los **tests automatizados** para el widget **agent-web**.

Estos tests garantizan que el código funciona correctamente y ayudan a prevenir regresiones al hacer cambios.

## 🏗️ Arquitectura

```
/tests/
├── AGENTS.md              # 📄 Este archivo
├── core.test.js           # Tests de módulos core
├── ui.test.js             # Tests de UI
├── utils.test.js          # Tests de utilidades
└── integration.test.js    # Tests de integración
```

### Tipos de Tests:
- **Unit Tests**: Testean funciones individuales (ej: `isSafeSelector`)
- **Component Tests**: Testean módulos completos (ej: `voice-manager.js`)
- **Integration Tests**: Testean la interacción entre módulos
- **E2E Tests**: Testean el widget completo en un navegador (futuro)

## ✅ Responsabilidades

- [ ] **Validar el comportamiento** de cada función
- [ ] **Testear casos de borde** (edge cases)
- [ ] **Testear casos de error**
- [ ] **Documentar el propósito** de cada test
- [ ] **Ser rápidos** (ejecutar en < 1 segundo cada test)
- [ ] **Ser determinísticos** (mismo input = mismo output)

## 🤖 Notas CRÍTICAS para Agentes IA

> ⚠️ **CONTEXTO ESPECIAL PARA MODELOS DE IA**:
>
> 1. **Los tests son código**:
>    - Los archivos en `/tests` **SON JavaScript**
>    - Usan **assertions** para validar comportamiento
>    - Se ejecutan con **Node.js** (no en navegador)

> 2. **Mocking es necesario**:
>    - El widget usa **APIs del navegador** (DOM, Web Speech API, etc.)
>    - En tests, estas APIs **no están disponibles**
>    - Usar **mocks** para simular el entorno del navegador

> 3. **Tests deben ser aislados**:
>    - Cada test **no debe depender** de otros tests
>    - Limpiar **state** entre tests
>    - Usar **beforeEach/afterEach** para setup/cleanup

> 4. **No testear implementación**:
>    - Testear **comportamiento**, no implementación
>    - Si cambias la implementación pero el comportamiento es el mismo, **no cambies los tests**

## 📦 Detalle de Cada Archivo

---

### 1. **core.test.js**

**Propósito**: Testear los **módulos core** del widget.

**Módulos a testear**:
- `config.js` - Validación de configuración
- `dom-analyzer.js` - Análisis del DOM
- `voice-manager.js` - Gestión de voz
- `llm-client.js` - Cliente de LLM
- `action-engine.js` - Motor de acciones

**Contenido típico**:
```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock de APIs del navegador
global.document = {
  body: {
    textContent: 'Test content',
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => [])
  },
  createTreeWalker: vi.fn(),
  documentElement: { lang: 'es' }
};

global.window = {
  location: { href: 'http://test.com', hostname: 'test.com', pathname: '/' },
  getComputedStyle: vi.fn(() => ({ display: 'block', visibility: 'visible' }))
};

// Mock de Web Speech API
global.SpeechRecognition = class {
  constructor() {
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.continuous = false;
    this.interimResults = false;
    this.lang = 'es';
  }
  start() {}
  stop() {}
};

global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => [])
};

// Tests de config.js
import { validateConfig, DEFAULT_CONFIG } from '../src/core/config.js';

describe('config.js', () => {
  it('debería devolver la configuración por defecto sin parámetros', () => {
    const config = validateConfig({});
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('debería fusionar configuración personalizada', () => {
    const config = validateConfig({
      widgetPosition: 'top-left',
      primaryColor: '#ff0000'
    });
    expect(config.widgetPosition).toBe('top-left');
    expect(config.primaryColor).toBe('#ff0000');
    expect(config.model).toBe(DEFAULT_CONFIG.model);
  });

  it('debería validar widgetPosition', () => {
    const config = validateConfig({
      widgetPosition: 'invalid'
    });
    expect(config.widgetPosition).toBe(DEFAULT_CONFIG.widgetPosition);
  });
});

// Tests de dom-analyzer.js
import { 
  extractVisibleText,
  identifyPageType,
  createContextSummary 
} from '../src/core/dom-analyzer.js';

describe('dom-analyzer.js', () => {
  beforeEach(() => {
    // Setup mock DOM
    global.document.body.textContent = 'Test page content';
    global.document.title = 'Test Page';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('debería extraer texto visible', () => {
    const text = extractVisibleText();
    expect(text).toContain('Test page content');
  });

  it('debería identificar tipo de página', () => {
    global.document.body.textContent = 'Comprar producto Carrito';
    const pageType = identifyPageType();
    expect(pageType).toBe('e-commerce');
  });

  it('debería crear un contexto resumen', () => {
    const summary = createContextSummary();
    expect(summary).toContain('Test Page');
    expect(summary.length).toBeLessThan(3000); // Menos de 3000 caracteres
  });
});

// Tests de voice-manager.js
import { 
  isSupported,
  startListening,
  stopListening 
} from '../src/core/voice-manager.js';

describe('voice-manager.js', () => {
  it('debería detectar soporte de Web Speech API', () => {
    expect(isSupported()).toBe(true);
  });

  it('debería iniciar reconocimiento de voz', () => {
    const onResult = vi.fn();
    const success = startListening(onResult);
    expect(success).toBe(true);
    
    // Simular resultado
    const mockRecognition = global.document.querySelector('.agent-web-float-button')?.recognition;
    if (mockRecognition) {
      mockRecognition.onresult({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: 'Test' } }]
      });
    }
    
    expect(onResult).toHaveBeenCalled();
  });
});

// Tests de action-engine.js
import { executeAction, isActionSafe } from '../src/core/action-engine.js';

describe('action-engine.js', () => {
  it('debería validar acción segura', () => {
    expect(isActionSafe('click', { selector: 'button' })).toBe(true);
    expect(isActionSafe('submit-form', {})).toBe(false);
  });

  it('debería ejecutar acción de click', async () => {
    // Mock de DOM
    const mockElement = {
      tagName: 'BUTTON',
      click: vi.fn()
    };
    
    global.document.querySelector = vi.fn(() => mockElement);
    
    const result = await executeAction('click', { selector: 'button' });
    expect(result.success).toBe(true);
    expect(mockElement.click).toHaveBeenCalled();
  });
});
```

**Responsabilidades**:
- [ ] Testear **todos los módulos core**
- [ ] Mockear **APIs del navegador**
- [ ] Validar **comportamiento esperado**
- [ ] Testear **casos de error**

**Dependencias**:
- Vitest o Jest
- Mocks de APIs del navegador

**Notas para IA**:
> - Usar **Vitest** (más rápido para ES Modules)
> - Mockear **todo lo del navegador** (document, window, etc.)
> - Testear **funciones puras** primero
> - Testear **interacciones complejas** después

---

### 2. **ui.test.js**

**Propósito**: Testear la **lógica de la UI** del widget.

**Contenido típico**:
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de módulos core
vi.mock('../src/core/voice-manager.js', () => ({
  startListening: vi.fn(() => true),
  stopListening: vi.fn(),
  isListening: vi.fn(() => false)
}));

vi.mock('../src/core/llm-client.js', () => ({
  chat: vi.fn(() => Promise.resolve('Test response')),
  setApiKey: vi.fn(),
  getApiKey: vi.fn(() => 'test-key')
}));

// Mock de DOM
beforeEach(() => {
  global.document.body.innerHTML = `
    <div id="agent-web-container">
      <div class="agent-web-float-button"></div>
      <div class="agent-web-panel">
        <div class="agent-web-chat"></div>
        <textarea class="agent-web-text-input"></textarea>
        <button class="agent-web-send-button"></button>
      </div>
    </div>
  `;
});

// Tests de widget.js
import { 
  init,
  addMessage,
  openPanel,
  closePanel 
} from '../src/ui/widget.js';

describe('widget.js', () => {
  it('debería inicializar el widget', () => {
    const agent = init({ apiKey: 'test-key' });
    expect(agent).toBeDefined();
    expect(agent.open).toBeDefined();
    expect(agent.close).toBeDefined();
  });

  it('debería añadir mensajes al chat', () => {
    const agent = init({ apiKey: 'test-key' });
    addMessage('user', 'Test message');
    
    const messages = global.document.querySelectorAll('.agent-web-message');
    expect(messages.length).toBeGreaterThan(0);
  });

  it('debería abrir y cerrar el panel', () => {
    const agent = init({ apiKey: 'test-key' });
    
    // Panel debería estar cerrado inicialmente
    const panel = global.document.querySelector('.agent-web-panel');
    expect(panel.classList.contains('active')).toBe(false);
    
    // Abrir panel
    openPanel();
    expect(panel.classList.contains('active')).toBe(true);
    
    // Cerrar panel
    closePanel();
    expect(panel.classList.contains('active')).toBe(false);
  });
});
```

**Responsabilidades**:
- [ ] Testear **lógica de la UI**
- [ ] Mockear **módulos core**
- [ ] Testear **interacciones con el DOM**
- [ ] Testear **manejadores de eventos**

**Notas para IA**:
> - Mockear **módulos que dependen de APIs del navegador**
> - Testear **lógica, no estilos**
> - Usar **jsdom** para simular DOM
> - Testear **comportamiento de usuario**

---

### 3. **utils.test.js**

**Propósito**: Testear las **funciones utilitarias**.

**Contenido típico**:
```javascript
import { describe, it, expect } from 'vitest';

import {
  getElement,
  getAllElements,
  isElementVisible,
  truncateText,
  formatTime,
  isPlainObject,
  setLocalStorage,
  getLocalStorage
} from '../src/utils/helpers.js';

import {
  isSafeSelector,
  isSafeAction,
  isSafeElement,
  sanitizeText
} from '../src/utils/security.js';

describe('helpers.js', () => {
  describe('DOM Helpers', () => {
    beforeEach(() => {
      global.document.body.innerHTML = `
        <div id="test">Test</div>
        <div class="item">Item 1</div>
        <div class="item">Item 2</div>
      `;
    });

    it('debería obtener un elemento por selector', () => {
      const element = getElement('#test');
      expect(element).not.toBeNull();
      expect(element.id).toBe('test');
    });

    it('debería obtener todos los elementos por selector', () => {
      const elements = getAllElements('.item');
      expect(elements.length).toBe(2);
    });
  });

  describe('String Helpers', () => {
    it('debería truncar texto', () => {
      const text = truncateText('Hello world', 5);
      expect(text).toBe('Hello...');
    });

    it('debería formatear tiempo', () => {
      const date = new Date('2024-01-01T12:30:00');
      const time = formatTime(date);
      expect(time).toContain('12');
      expect(time).toContain('30');
    });
  });

  describe('Type Checking', () => {
    it('debería detectar objetos planos', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
    });
  });
});

describe('security.js', () => {
  describe('isSafeSelector', () => {
    it('debería permitir selectores seguros', () => {
      expect(isSafeSelector('button')).toBe(true);
      expect(isSafeSelector('.my-class')).toBe(true);
      expect(isSafeSelector('#my-id')).toBe(true);
    });

    it('debería bloquear selectores peligrosos', () => {
      expect(isSafeSelector('input[type="password"]')).toBe(false);
      expect(isSafeSelector('a[href="http://external.com"]')).toBe(false);
      expect(isSafeSelector('form[action*="login"]')).toBe(false);
    });
  });

  describe('isSafeAction', () => {
    it('debería permitir acciones seguras', () => {
      expect(isSafeAction({ type: 'click', params: { selector: 'button' } })).toBe(true);
      expect(isSafeAction({ type: 'scroll', params: { direction: 'down' } })).toBe(true);
    });

    it('debería bloquear acciones peligrosas', () => {
      expect(isSafeAction({ type: 'submit-form' })).toBe(false);
      expect(isSafeAction({ type: 'click', params: { selector: 'input[type="password"]' } })).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('debería sanear texto con HTML', () => {
      const dirty = '<script>alert("xss")</script>';
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain('<script>');
    });

    it('debería devolver texto vacío para null', () => {
      expect(sanitizeText(null)).toBe('');
    });
  });
});
```

**Responsabilidades**:
- [ ] Testear **todas las funciones utilitarias**
- [ ] Testear **casos de borde**
- [ ] Validar **seguridad de funciones**
- [ ] Testear **rendimiento** de funciones costosas

**Notas para IA**:
> - Testear **cada función individualmente**
> - Incluir **casos edge** (null, undefined, valores inválidos)
> - Validar **tipo de retorno**
> - Testear **funciones de seguridad con especial cuidado**

---

### 4. **integration.test.js**

**Propósito**: Testear la **integración entre módulos**.

**Contenido típico**:
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de APIs del navegador
beforeEach(() => {
  global.document = {
    body: {
      innerHTML: '<button id="test">Click me</button>'
    },
    querySelector: vi.fn((selector) => {
      if (selector === '#test') {
        return { tagName: 'BUTTON', click: vi.fn() };
      }
      return null;
    })
  };
  
  global.window = {
    location: { href: 'http://test.com' }
  };
  
  global.SpeechRecognition = class {
    start() {}
    stop() {}
  };
});

// Tests de integración
import WebAgent from '../src/index.js';

describe('Integration Tests', () => {
  it('debería inicializar y responder a mensajes', async () => {
    // Mock de fetch para OpenAI API
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Test response' } }]
      })
    }));
    
    const agent = WebAgent.init({
      apiKey: 'test-key'
    });
    
    // Mock de chat para evitar llamada real
    const originalChat = agent.sendMessage;
    agent.sendMessage = vi.fn(() => Promise.resolve('Test response'));
    
    const response = await agent.sendMessage('Hello');
    expect(response).toBe('Test response');
  });

  it('debería manejar errores de API', async () => {
    // Mock de fetch para simular error
    global.fetch = vi.fn(() => Promise.resolve({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Invalid API key' } })
    }));
    
    const agent = WebAgent.init({
      apiKey: 'invalid-key'
    });
    
    try {
      await agent.sendMessage('Hello');
    } catch (error) {
      expect(error.message).toContain('Invalid API key');
    }
  });
});
```

**Responsabilidades**:
- [ ] Testear **integración entre módulos**
- [ ] Mockear **APIs externas** (OpenAI, etc.)
- [ ] Testear **flujo completo** de operaciones
- [ ] Testear **manejadores de errores**

**Notas para IA**:
> - Testear **flujos de usuario completos**
> - Mockear **todo lo externo** (APIs, DOM, etc.)
> - Validar **que los módulos trabajan juntos**
> - Testear **errores de integración**

---

## 🔗 Relación con Otros Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    /tests/ (Tests)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐                                          │
│  │    core.test.js      │ ← Tests de módulos core                  │
│  └─────────┬─────────────┘                                          │
│            │                                                         │
│  ┌─────────▼─────────────┐                                          │
│  │    Testea:             │                                          │
│  │  - config.js           │                                          │
│  │  - dom-analyzer.js     │                                          │
│  │  - voice-manager.js    │                                          │
│  │  - llm-client.js       │                                          │
│  │  - action-engine.js    │                                          │
│  └─────────┬─────────────┘                                          │
│            │                                                         │
│  ┌─────────────────────┐                                          │
│  │    ui.test.js         │ ← Tests de UI                             │
│  └─────────┬─────────────┘                                          │
│            │                                                         │
│  ┌─────────────────────┐                                          │
│  │    utils.test.js      │ ← Tests de utilidades                    │
│  └─────────┬─────────────┘                                          │
│            │                                                         │
│  ┌─────────────────────┐                                          │
│  │  integration.test.js │ ← Tests de integración                  │
│  └─────────────────────┘                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                    Testea /src/ (Código fuente)
```

---

## 🚨 Advertencias Específicas

1. **Mockear todo**:
   - **APIs del navegador** (document, window, navigator)
   - **APIs externas** (OpenAI, Web Speech API)
   - **Módulos con efectos secundarios**

2. **Tests deben ser rápidos**:
   - Evitar **tests lentos** (> 100ms)
   - Usar **mocks** en lugar de implementaciones reales
   - Parallelizar tests cuando sea posible

3. **Testear comportamiento, no implementación**:
   - Si refactorizas código pero el comportamiento es el mismo, **no cambies los tests**

4. **Mantener tests actualizados**:
   - Cada nuevo feature debe tener **sus tests**
   - Cada bug fix debe tener **un test que lo valide**

---

## 📋 Checklist para Nuevos Tests

Antes de añadir un nuevo test:

- [ ] ¿El test **valida comportamiento** o implementación?
- [ ] ¿Todos los **mocks necesarios** están en lugar?
- [ ] ¿El test **ejecuta en < 100ms**?
- [ ] ¿El test **no depende de tests anteriores**?
- [ ] ¿El test **cubre casos de borde**?
- [ ] ¿El test **cubre casos de error**?

---

## 🔧 Configuración de Tests

### Instalar dependencias:
```bash
npm install --save-dev vitest jsdom @vitest/coverage-v8
```

### Configurar Vite (vite.config.js):
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8'
    }
  }
});
```

### Archivo de setup (tests/setup.js):
```javascript
import { beforeEach } from 'vitest';

// Mock global de APIs del navegador
beforeEach(() => {
  global.document = {
    body: { innerHTML: '' },
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    createElement: vi.fn(),
    head: { appendChild: vi.fn() }
  };
  
  global.window = {
    location: { href: 'http://test.com', hostname: 'test.com', pathname: '/' },
    getComputedStyle: vi.fn(() => ({ display: 'block', visibility: 'visible' }))
  };
  
  global.SpeechRecognition = class {
    constructor() {
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
    }
    start() {}
    stop() {}
  };
  
  global.speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => [])
  };
});
```

### Ejecutar tests:
```bash
# Ejecutar todos los tests
npm test

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar en modo watch
npm run test:watch
```

---

**📝 Nota final para agentes IA**:
> - Los tests **validan que el código funciona**
> - Cada cambio en el código debe **mantener los tests pasando**
> - Si un test falla, **no es culpa del test**, es culpa del código
> - Para entender el **código**, ve a `/src/` y sus archivos `AGENTS.md`
> - Para ver la **estructura**, ve a `ARCHIVES.md`
