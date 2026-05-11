# 🧠 /src/core - AGENTS.md

## 📌 Descripción

El directorio **`/src/core`** contiene los **módulos nucleares** de la lógica del agente. 

Estos módulos son el **cerebro** del widget: analizan la página, manejan la voz, consultan al LLM y ejecutan acciones.

## 🏗️ Arquitectura

```
/src/core/
├── AGENTS.md              # 📄 Este archivo
├── config.js              # ⚙️  Configuración por defecto
├── dom-analyzer.js        # 🔍 Analizador de DOM
├── voice-manager.js        # 🎤 Gestor de voz
├── llm-client.js          # 🤖 Cliente de LLM (OpenAI)
└── action-engine.js       # ⚡ Motor de acciones seguras
```

### Flujo de Datos:
```
Página Web (DOM)
    ↓
┌─────────────────────┐
│   dom-analyzer.js    │ ← Extrae contexto (texto, estructura, elementos)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   llm-client.js      │ ← Construye prompt + consulta OpenAI
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  action-engine.js    │ ← Valida y ejecuta acciones
└──────────┬──────────┘
           ↓
    Página Web (DOM)

    ↑
┌─────────────────────┐
│  voice-manager.js    │ ← Entrada de voz (Web Speech API)
└──────────┬──────────┘
           ↓
    llm-client.js
    action-engine.js
```

## ✅ Responsabilidades por Módulo

| **Módulo** | **Responsabilidad** | **Entradas** | **Salidas** |
|-----------|-------------------|--------------|-------------|
| `config.js` | Configuración por defecto | Ninguna | Objeto de configuración |
| `dom-analyzer.js` | Analizar DOM de la página | DOM de la página | Objeto de contexto |
| `voice-manager.js` | Manejar voz | Audio del micrófono | Texto transcrito, voz sintetizada |
| `llm-client.js` | Consultar LLM | Prompt + contexto | Respuesta del LLM |
| `action-engine.js` | Ejecutar acciones | Comando + contexto | Acción en el DOM |

## 🤖 Notas CRÍTICAS para Agentes IA

> ⚠️ **CONTEXTO ESPECIAL PARA MODELOS DE IA**:
>
> 1. **Separación de responsabilidades**: Cada módulo hace UNA cosa y la hace bien.
>    - `dom-analyzer.js` → **SOLO lee** el DOM, **NUNCA lo modifica**
>    - `voice-manager.js` → **SOLO maneja voz**, no sabe nada del DOM
>    - `llm-client.js` → **SOLO habla con OpenAI**, no sabe cómo se usa la respuesta
>    - `action-engine.js` → **SOLO ejecuta acciones**, valida seguridad antes
>
> 2. **Dependencias entre módulos**:
>    ```
>    dom-analyzer.js → No depende de nadie
>    voice-manager.js → No depende de nadie (solo Web Speech API)
>    llm-client.js → Depende de dom-analyzer.js (para contexto)
>    action-engine.js → Depende de dom-analyzer.js (para buscar elementos) y security.js
>    ```
>
> 3. **Seguridad en action-engine.js**:
>    - **SIEMPRE** validar acciones con `security.js` ANTES de ejecutar
>    - **NUNCA** permitir modificaciones a formularios sensibles
>    - **NUNCA** permitir clicks en enlaces externos
>    - Ver `src/utils/security.js` para reglas detalladas
>
> 4. **Web Speech API**:
>    - No todos los navegadores la soportan igual
>    - Safari usa `webkitSpeechRecognition`
>    - Ver `TROUBLESHOOTING.md` para issues conocidos
>
> 5. **OpenAI API**:
>    - Requiere API key válida
>    - Tiene rate limiting (por minuto y por día)
>    - Las respuestas pueden variar (no determinísticas)

## 📦 Detalle de Cada Módulo

---

### 1. **config.js**

**Propósito**: Centralizar todas las configuraciones por defecto del widget.

**Contenido típico**:
```javascript
// Valores por defecto
export const DEFAULT_CONFIG = {
  // UI
  widgetPosition: 'bottom-right',
  primaryColor: '#52d1b2',
  language: 'es',
  
  // Voz
  voiceRate: 1,
  voicePitch: 1,
  voiceLang: 'es-ES',
  
  // LLM
  model: 'gpt-3.5-turbo',
  maxTokens: 150,
  temperature: 0.7,
  
  // Seguridad
  allowedActions: ['click', 'scroll', 'search'],
  blockedSelectors: []
};
```

**Responsabilidades**:
- [ ] Proporcionar valores por defecto para todo el widget
- [ ] Validar configuración proporcionada por el usuario
- [ ] Exportar configuración procesada

**Dependencias**: Ninguna

**Usado por**: Todos los módulos que necesitan configuración

---

### 2. **dom-analyzer.js**

**Propósito**: Analizar el DOM de la página host y extraer información útil para el LLM.

**Funciones principales**:
```javascript
// Extrae todo el texto visible de la página
export function extractVisibleText() { ... }

// Obtiene la estructura jerárquica del DOM
export function getPageStructure() { ... }

// Identifica el tipo de página (e-commerce, blog, etc.)
export function identifyPageType() { ... }

// Crea un resumen optimizado para el prompt del LLM
export function createContextSummary(maxTokens = 2000) { ... }

// Obtiene todos los elementos interactivos (botones, links, inputs)
export function getInteractiveElements() { ... }

// Obtiene información de productos (para e-commerce)
export function extractProductInfo() { ... }

// Obtiene el contenido principal de la página
export function getMainContent() { ... }
```

**Responsabilidades**:
- [ ] **LEER** el DOM de la página host
- [ ] Extraer información relevante para el contexto
- [ ] **NUNCA MODIFICAR** el DOM
- [ ] Optimizar el contenido para que quepa en el prompt del LLM
- [ ] Identificar elementos clave (títulos, descripciones, precios, etc.)

**Dependencias**: Ninguna (solo APIs nativas del DOM)

**Usado por**: `llm-client.js`, `action-engine.js`

**Notas para IA**:
> - Este módulo es de **solo lectura**
> - Debe ser **eficiente** (no bloquear el navegador)
> - Debe manejar **páginas dinámicas** (SPAs como React, Angular)
> - Ver `TROUBLESHOOTING.md` para optimizaciones de performance

---

### 3. **voice-manager.js**

**Propósito**: Manejar la entrada y salida de voz usando Web Speech API.

**Funciones principales**:
```javascript
// Inicia el reconocimiento de voz
export function startListening(onResult, onError) { ... }

// Detiene el reconocimiento
export function stopListening() { ... }

// Sintetiza texto a voz
export function speak(text, onEnd) { ... }

// Verifica si el navegador soporta Web Speech API
export function isSupported() { ... }

// Obtiene la lista de voces disponibles
export function getVoices() { ... }

// Configura parámetros de voz
export function setVoiceSettings(rate, pitch, lang) { ... }
```

**Responsabilidades**:
- [ ] **Entrada**: Capturar audio del micrófono y convertirlo a texto
- [ ] **Salida**: Convertir texto a voz y reproducirlo
- [ ] Manejar errores de la API
- [ ] Normalizar el texto (limpiar, formatear)
- [ ] Verificar soporte del navegador

**Dependencias**: Web Speech API (navegador)

**Usado por**: `ui/widget.js`

**Notas para IA**:
> - Web Speech API **no es 100% preciso**
> - En Safari usa `webkitSpeechRecognition`
> - Puede haber limitaciones en móviles
> - Ver `TROUBLESHOOTING.md` para issues de compatibilidad

---

### 4. **llm-client.js**

**Propósito**: Comunicarse con OpenAI Chat API para obtener respuestas inteligentes.

**Funciones principales**:
```javascript
// Configura la API key
export function setApiKey(apiKey) { ... }

// Envía un mensaje al LLM
export async function chat(messages, options = {}) { ... }

// Streaming de respuestas
export async function streamChat(messages, options = {}) { ... }

// Construye un prompt con contexto de la página
export function buildPrompt(userQuery, pageContext) { ... }

// Obtiene el contexto actual de la página
export function getCurrentContext() { ... }
```

**Responsabilidades**:
- [ ] **Consultar** a OpenAI Chat API
- [ ] Construir **prompts efectivos** con contexto de la página
- [ ] Manejar **errores de API** (rate limiting, invalid key, etc.)
- [ ] Gestionar **streaming** de respuestas
- [ ] Optimizar **uso de tokens**

**Dependencias**: 
- `dom-analyzer.js` (para obtener contexto)
- Fetch API (navegador)
- OpenAI Chat API

**Usado por**: `ui/widget.js`, `action-engine.js`

**Notas para IA**:
> - **NUNCA** exponer la API key en logs o errores
> - Las respuestas pueden ser **no determinísticas**
> - Considerar **cache** de respuestas para optimizar costos
> - Ver `TROUBLESHOOTING.md` para issues de CORS

---

### 5. **action-engine.js**

**Propósito**: Ejecutar acciones seguras en el DOM basado en comandos del usuario.

**Funciones principales**:
```javascript
// Ejecuta una acción validada
export function executeAction(actionType, params) { ... }

// Valida que una acción es segura
export function validateAction(action) { ... }

// Acciones específicas
// Haz clic en un elemento
export function clickElement(selector) { ... }

// Desplázate a un elemento
export function scrollToElement(selector) { ... }

// Llena un input (solo si es seguro)
export function fillInput(selector, value) { ... }

// Busca en la página
export function search(query) { ... }

// Navega a una URL (solo misma origen)
export function navigateTo(url) { ... }
```

**Responsabilidades**:
- [ ] **Recibir** comandos del LLM o usuario
- [ ] **Validar** que la acción es segura (usando `security.js`)
- [ ] **Ejecutar** la acción en el DOM
- [ ] **Reportar** el resultado (éxito o error)

**Dependencias**:
- `dom-analyzer.js` (para encontrar elementos)
- `utils/security.js` (para validación)

**Usado por**: `ui/widget.js`

**⚠️ REGLAS DE SEGURIDAD (IMPLEMENTAR EN security.js)**:
```javascript
// NUNCA permitir:
const BLOCKED_ACTIONS = [
  'submit-form',           // Envío de formularios
  'fill-password',         // Llenar campos de contraseña
  'click-external-link',   // Clics en enlaces externos
  'modify-content',        // Modificar contenido existente
  'execute-script',        // Ejecutar código JavaScript
  'access-local-storage'  // Acceder a almacenamiento local
];

// NUNCA en estos selectores:
const DANGEROUS_SELECTORS = [
  'input[type="password"]',
  'input[name*="password"]',
  'input[name*="credit"]',
  'input[name*="card"]',
  'input[name*="ssn"]',
  'input[name*="cvv"]',
  'form[action*="login"]',
  'form[action*="signup"]',
  'form[action*="checkout"]',
  'form[action*="payment"]',
  'a[href^="http"]'        // Enlaces externos
];
```

**Notas para IA**:
> - **SIEMPRE** validar con `security.js` ANTES de ejecutar cualquier acción
> - Las acciones deben ser **reversibles** cuando sea posible
> - **NUNCA** asumir que un selector existe
> - Ver `TROUBLESHOOTING.md` para errores comunes de seguridad

---

## 🔗 Comunicación entre Módulos

```
┌──────────────────────────────────────────────────────────────────┐
│                        COMUNICACIÓN INTERNA                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. dom-analyzer → llm-client:                                    │
│     getContext() → {text: "...", structure: {...}, type: "..."}     │
│                                                                      │
│  2. voice-manager → ui/widget:                                     │
│     onResult(text) → "Hola, ¿qué hay en esta página?"                │
│     onError(error) → "No se pudo reconocer el audio"              │
│                                                                      │
│  3. ui/widget → llm-client:                                       │
│     chat(prompt) → Promise<response>                               │
│                                                                      │
│  4. llm-client → action-engine:                                  │
│     Si la respuesta es un comando → executeAction()               │
│                                                                      │
│  5. action-engine → dom-analyzer:                                  │
│     findElement(selector) → Element | null                        │
│                                                                      │
│  6. action-engine → ui/widget:                                     │
│     onActionSuccess(result) → "Acción ejecutada"                    │
│     onActionError(error) → "No se pudo ejecutar la acción"         │
│                                                                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚨 Advertencias Específicas

1. **En dom-analyzer.js**:
   - No usar `innerHTML` para extraer texto (usar `textContent`)
   - Evitar recorrer todo el DOM en páginas grandes
   - Usar `requestIdleCallback` para operaciones costosas

2. **En voice-manager.js**:
   - Manejar el caso donde Web Speech API no está disponible
   - Limpiar event listeners para evitar memory leaks
   - Considerar timeout para el reconocimiento

3. **En llm-client.js**:
   - NUNCA guardar la API key en el código
   - Validar que la API key tiene el formato correcto
   - Manejar errores de rate limiting (retry con backoff)

4. **En action-engine.js**:
   - SIEMPRE validar antes de ejecutar
   - Usar try/catch para todas las acciones
   - No bloquear la UI durante la ejecución

---

**📝 Nota final para agentes IA**:
> - Este directorio contiene la **lógica principal** del widget
> - Cada módulo tiene una **responsabilidad única**
> - La **seguridad es crítica** en action-engine.js
> - **Testea siempre** los cambios en diferentes navegadores
