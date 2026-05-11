# 🔧 /src/utils - AGENTS.md

## 📌 Descripción

El directorio **`/src/utils`** contiene **funciones utilitarias compartidas** que son usadas por múltiples módulos del proyecto **agent-web**.

Estas utilidades proporcionan **funcionalidad común** como helpers, validación de seguridad, constantes y otras funciones que no pertenecen específicamente a un módulo core o de UI.

## 🏗️ Arquitectura

```
/src/utils/
├── AGENTS.md              # 📄 Este archivo
├── helpers.js             # 🛠️ Funciones auxiliares generales
├── security.js            # 🔒 Validación de seguridad
└── constants.js           # 📊 Constantes globales
```

### Flujo de Uso:
```
Cualquier módulo
    ↓
┌─────────────────────────────────────────────┐
│              /src/utils/ (Utilidades)            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  helpers.js  │  │ security.js   │  │constants.js │ │
│  │  (Helpers)   │  │ (Seguridad)   │  │ (Constantes)│ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────┘
    ↓
Resultados reutilizables
```

## ✅ Responsabilidades

- [ ] Proporcionar **funciones reutilizables** para todo el proyecto
- [ ] Centralizar **lógica de seguridad** en un solo lugar
- [ ] Mantener **constantes globales** consistentes
- [ ] Ser **independientes** (sin dependencias externas entre sí)
- [ ] Ser **determinísticas** (mismo input = mismo output)
- [ ] Ser **eficientes** (mínimo overhead)

## 🤖 Notas CRÍTICAS para Agentes IA

> ⚠️ **CONTEXTO ESPECIAL PARA MODELOS DE IA**:
>
> 1. **Estas son funciones de bajo nivel**:
>    - Deben ser **genéricas** y reutilizables
>    - NO deben contener lógica específica de negocio
>    - NO deben depender de módulos core o UI
>
> 2. **Seguridad es la prioridad**:
>    - El archivo `security.js` es **CRÍTICO** para la seguridad del widget
>    - Cualquier validación de acciones debe pasar por aquí
>    - **NUNCA** omitir las validaciones de seguridad
>
> 3. **Constantes**:
>    - Todas las constantes globales deben estar en `constants.js`
>    - NO duplicar constantes en diferentes módulos
>    - Usar `UPPER_SNAKE_CASE` para nombres de constantes
>
> 4. **Helpers**:
>    - Funciones puras cuando sea posible
>    - Documentar el propósito de cada helper
>    - Evitar efectos secundarios

## 📦 Detalle de Cada Archivo

---

### 1. **constants.js**

**Propósito**: Centralizar **todas las constantes globales** del proyecto.

**Contenido típico**:
```javascript
// ===== Configuración por defecto =====
export const DEFAULT_MODEL = 'gpt-3.5-turbo';
export const DEFAULT_MAX_TOKENS = 150;
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_LANGUAGE = 'es';

// ===== Voice Settings =====
export const DEFAULT_VOICE_RATE = 1;
export const DEFAULT_VOICE_PITCH = 1;
export const DEFAULT_VOICE_LANG = 'es-ES';

// ===== UI Settings =====
export const DEFAULT_POSITION = 'bottom-right';
export const DEFAULT_WIDTH = '360px';
export const DEFAULT_MAX_HEIGHT = '600px';

// ===== DOM Analysis =====
export const MAX_CONTEXT_TOKENS = 2000;
export const MAX_VISIBLE_TEXT_LENGTH = 10000;
export const MAX_DEPTH = 10; // Profundidad máxima de análisis del DOM

// ===== Action Types =====
export const ACTION_TYPES = {
  CLICK: 'click',
  SCROLL: 'scroll',
  FILL_INPUT: 'fillInput',
  SEARCH: 'search',
  NAVIGATE: 'navigate'
};

// ===== Status Types =====
export const STATUS_TYPES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error'
};

// ===== Message Roles =====
export const MESSAGE_ROLES = {
  USER: 'user',
  AGENT: 'agent',
  SYSTEM: 'system'
};
```

**Responsabilidades**:
- [ ] Definir constantes **globales** para todo el proyecto
- [ ] Agrupar constantes por **categoría lógica**
- [ ] Usar nombres **descriptivos** y en `UPPER_SNAKE_CASE`
- [ ] Documentar el propósito de cada constante

**Dependencias**: Ninguna

**Usado por**: Todos los módulos del proyecto

**Notas para IA**:
> - Si una constante solo se usa en **un módulo**, NO la pongas aquí
> - Si una constante se usa en **múltiples módulos**, SÍ debe estar aquí
> - Las constantes deben ser **inmutables**

---

### 2. **security.js**

**Propósito**: Centralizar **toda la lógica de validación de seguridad** del widget.

**Este es el archivo MÁS IMPORTANTE para la seguridad del proyecto.**

**Contenido típico**:
```javascript
// ===== Patrones Peligrosos =====
// Selectores que NUNCA deben ser objetivo de acciones
export const DANGEROUS_SELECTORS = [
  // Campos de contraseña
  'input[type="password"]',
  'input[name*="password"]',
  'input[id*="password"]',
  
  // Información financiera
  'input[name*="credit"]',
  'input[name*="card"]',
  'input[name*="cvv"]',
  'input[name*="ssn"]',
  'input[name*="social"]',
  
  // Formularios sensibles
  'form[action*="login"]',
  'form[action*="signup"]',
  'form[action*="register"]',
  'form[action*="checkout"]',
  'form[action*="payment"]',
  'form[action*="billing"]',
  
  // Enlaces externos
  'a[href^="http://"]',
  'a[href^="https://"]',
  'a[target="_blank"]'
];

// Palabras clave peligrosas en selectores
export const DANGEROUS_KEYWORDS = [
  /password/i,
  /credit.*card/i,
  /ssn/i,
  /cvv/i,
  /login/i,
  /signup/i,
  /register/i,
  /checkout/i,
  /payment/i,
  /billing/i,
  /delete/i,
  /remove/i,
  /submit/i,
  /purchase/i
];

// Acciones bloqueadas
export const BLOCKED_ACTIONS = [
  'submit-form',
  'fill-password',
  'click-external-link',
  'modify-content',
  'execute-script',
  'access-local-storage',
  'access-session-storage',
  'access-cookies',
  'download-file',
  'upload-file'
];

// ===== Funciones de Validación =====

/**
 * Valida si un selector CSS es seguro
 * @param {string} selector - Selector CSS a validar
 * @returns {boolean} - True si es seguro, False si no lo es
 */
export function isSafeSelector(selector) {
  // Validar contra patrones peligrosos
  for (const pattern of DANGEROUS_SELECTORS) {
    if (selector.includes(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) {
      return false;
    }
  }
  
  // Validar contra palabras clave
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (keyword.test(selector)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Valida si una acción es segura
 * @param {Object} action - Objeto de acción a validar
 * @param {string} action.type - Tipo de acción
 * @param {Object} action.params - Parámetros de la acción
 * @returns {boolean} - True si es seguro, False si no lo es
 */
export function isSafeAction(action) {
  // Validar tipo de acción
  if (BLOCKED_ACTIONS.includes(action.type)) {
    return false;
  }
  
  // Validar selectores en los parámetros
  if (action.params?.selector) {
    if (!isSafeSelector(action.params.selector)) {
      return false;
    }
  }
  
  // Validar URLs (solo misma origen)
  if (action.params?.url) {
    try {
      const url = new URL(action.params.url);
      if (url.origin !== window.location.origin) {
        return false; // No permitir navegación a otros dominios
      }
    } catch (e) {
      return false; // URL inválida
    }
  }
  
  return true;
}

/**
 * Valida si un elemento DOM es seguro para interactuar
 * @param {HTMLElement} element - Elemento DOM a validar
 * @returns {boolean} - True si es seguro, False si no lo es
 */
export function isSafeElement(element) {
  // Validar tag name
  const dangerousTags = ['iframe', 'script', 'object', 'embed'];
  if (dangerousTags.includes(element.tagName.toLowerCase())) {
    return false;
  }
  
  // Validar attributes
  const dangerousAttrs = ['onclick', 'onload', 'onerror', 'javascript:'];
  for (const attr of dangerousAttrs) {
    for (const elementAttr of element.attributes) {
      if (elementAttr.value.includes(attr)) {
        return false;
      }
    }
  }
  
  // Validar si el elemento está en un formulario peligroso
  const form = element.closest('form');
  if (form) {
    const formText = form.innerText + form.id + form.className;
    for (const keyword of DANGEROUS_KEYWORDS) {
      if (keyword.test(formText)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Saneo de texto para prevenir XSS
 * @param {string} text - Texto a sanear
 * @returns {string} - Texto saneado
 */
export function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

**Responsabilidades**:
- [ ] **Validar selectores CSS** antes de usarlos
- [ ] **Validar acciones** antes de ejecutarlas
- [ ] **Validar elementos DOM** antes de interactuar con ellos
- [ ] **Sanear texto** para prevenir XSS
- [ ] Mantener **listas actualizadas** de patrones peligrosos

**Dependencias**: Ninguna

**Usado por**: `../core/action-engine.js`, `../core/dom-analyzer.js`

**⚠️ ADVERTENCIA PARA AGENTES IA**:
> **ESTE ARCHIVO ES CRÍTICO PARA LA SEGURIDAD**
> - Cualquier modificación debe ser **revisada cuidadosamente**
> - **NUNCA** debilitar las validaciones de seguridad
> - **NUNCA** eliminar patrones de la lista de peligrosos
> - **SIEMPRE** testear las modificaciones con casos de borde
> - Ver `TROUBLESHOOTING.md` para errores de seguridad anteriores

---

### 3. **helpers.js**

**Propósito**: Proporcionar **funciones utilitarias generales** reutilizables en todo el proyecto.

**Contenido típico**:
```javascript
// ===== DOM Helpers =====

/**
 * Obtiene un elemento del DOM de forma segura
 * @param {string} selector - Selector CSS
 * @param {HTMLElement=} context - Contexto (default: document)
 * @returns {HTMLElement|null} - Elemento encontrado o null
 */
export function getElement(selector, context = document) {
  try {
    const element = context.querySelector(selector);
    return element || null;
  } catch (e) {
    console.error(`Error getting element with selector: ${selector}`, e);
    return null;
  }
}

/**
 * Obtiene todos los elementos del DOM de forma segura
 * @param {string} selector - Selector CSS
 * @param {HTMLElement=} context - Contexto (default: document)
 * @returns {Array<HTMLElement>} - Array de elementos (vacío si no hay)
 */
export function getAllElements(selector, context = document) {
  try {
    const elements = context.querySelectorAll(selector);
    return Array.from(elements);
  } catch (e) {
    console.error(`Error getting elements with selector: ${selector}`, e);
    return [];
  }
}

/**
 * Verifica si un elemento existe y es visible
 * @param {HTMLElement} element - Elemento a verificar
 * @returns {boolean} - True si existe y es visible
 */
export function isElementVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
}

/**
 * Espera a que un elemento esté disponible en el DOM
 * @param {string} selector - Selector CSS
 * @param {number=} timeout - Timeout en ms (default: 5000)
 * @returns {Promise<HTMLElement>} - Promesa que resuelve con el elemento
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = getElement(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`Element not found: ${selector}`));
      } else {
        requestAnimationFrame(checkElement);
      }
    };
    
    checkElement();
  });
}

// ===== String Helpers =====

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado
 */
export function truncateText(text, maxLength) {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Convierte un texto a slug (URL-friendly)
 * @param {string} text - Texto a convertir
 * @returns {string} - Slug
 */
export function toSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Capitaliza la primera letra de un texto
 * @param {string} text - Texto a capitalizar
 * @returns {string} - Texto capitalizado
 */
export function capitalizeFirstLetter(text) {
  if (!text || typeof text !== 'string') return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ===== Array Helpers =====

/**
 * Divide un array en chunks
 * @param {Array} array - Array a dividir
 * @param {number} size - Tamaño de cada chunk
 * @returns {Array<Array>} - Array de chunks
 */
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Elimina elementos duplicados de un array
 * @param {Array} array - Array a filtrar
 * @returns {Array} - Array sin duplicados
 */
export function removeDuplicates(array) {
  return [...new Set(array)];
}

// ===== Date Helpers =====

/**
 * Formatea una fecha como hora local
 * @param {Date|number} date - Fecha a formatear
 * @param {string=} locale - Locale (default: 'es-ES')
 * @returns {string} - Hora formateada
 */
export function formatTime(date, locale = 'es-ES') {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Formatea una fecha como fecha local
 * @param {Date|number} date - Fecha a formatear
 * @param {string=} locale - Locale (default: 'es-ES')
 * @returns {string} - Fecha formateada
 */
export function formatDate(date, locale = 'es-ES') {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// ===== Number Helpers =====

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Moneda (default: 'USD')
 * @param {string=} locale - Locale (default: 'es-ES')
 * @returns {string} - Cantidad formateada
 */
export function formatCurrency(amount, currency = 'USD', locale = 'es-ES') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Formatea un número con separadores de miles
 * @param {number} number - Número a formatear
 * @param {string=} locale - Locale (default: 'es-ES')
 * @returns {string} - Número formateado
 */
export function formatNumber(number, locale = 'es-ES') {
  return new Intl.NumberFormat(locale).format(number);
}

// ===== Type Checking =====

/**
 * Verifica si un valor es un objeto plano
 * @param {*} value - Valor a verificar
 * @returns {boolean} - True si es un objeto plano
 */
export function isPlainObject(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Verifica si un valor es una función
 * @param {*} value - Valor a verificar
 * @returns {boolean} - True si es una función
 */
export function isFunction(value) {
  return typeof value === 'function';
}

/**
 * Verifica si un valor es una promesa
 * @param {*} value - Valor a verificar
 * @returns {boolean} - True si es una promesa
 */
export function isPromise(value) {
  return value && isFunction(value.then);
}
```

**Responsabilidades**:
- [ ] Proporcionar **funciones reutilizables** para operaciones comunes
- [ ] Ser **genéricas** (no específicas a un módulo)
- [ ] Ser **puras** cuando sea posible (mismo input = mismo output)
- [ ] **No tener efectos secundarios**
- [ ] Estar **bien documentadas** con JSDoc

**Dependencias**: Ninguna

**Usado por**: Todos los módulos del proyecto

**Notas para IA**:
> - Añadir helpers **solo si se usan en al menos 2 módulos diferentes**
> - Mantener las funciones **pequeñas y enfocadas**
> - Evitar duplicar funcionalidad
> - Si una función crece demasiado, considerarla para un nuevo módulo

---

## 🔗 Dependencias entre Archivos

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPENDENCIAS EN /src/utils/                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  constants.js                                                       │
│      ↑                                                              │
│      │ Usado por todos los módulos                                 │
│      ↓                                                              │
│  ┌───────────┐  ┌───────────┐                                       │
│  │ security.js│  │ helpers.js│                                       │
│  │ (Seguridad)│  │ (Helpers) │                                       │
│  └───────────┘  └───────────┘                                       │
│      ↑              ↑                                               │
│      │              │                                               │
│      └──────────────┘                                               │
│            Usados por módulos core y UI                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚨 Advertencias Específicas

1. **En constants.js**:
   - NO poner constantes que solo se usan en un módulo
   - SÍ poner constantes que se usan en múltiples módulos
   - Usar `UPPER_SNAKE_CASE` para nombres de constantes

2. **En security.js**:
   - **NUNCA** debilitar las validaciones
   - **SIEMPRE** testear con casos de borde
   - Documentar el propósito de cada patrón peligroso
   - Mantener las listas actualizadas

3. **En helpers.js**:
   - Las funciones deben ser reutilizables
   - Evitar efectos secundarios
   - Documentar con JSDoc
   - Mantenerlas pequeñas y enfocadas

---

## 📋 Checklist para Añadir Nuevas Utilidades

Antes de añadir una nueva función/utilidad:

- [ ] ¿La utilidad se usa en **al menos 2 módulos diferentes**?
- [ ] ¿La utilidad es **genérica** (no específica a un caso)?
- [ ] ¿La utilidad **no duplicar** funcionalidad existente?
- [ ] ¿La utilidad está **bien documentada** con JSDoc?
- [ ] ¿La utilidad ha sido **testeada**?
- [ ] ¿La utilidad está en el **archivo correcto** (helpers, security, constants)?

---

**📝 Nota final para agentes IA**:
> - Este directorio contiene **código compartido**
> - **security.js es CRÍTICO** - Trátalo con especial cuidado
> - Las utilidades deben ser **reutilizables** y **bien documentadas**
> - Ver `ARCHIVES.md` para la estructura completa
> - Ver `TROUBLESHOOTING.md` para errores comunes
