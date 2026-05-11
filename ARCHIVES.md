# 🗃️ ARCHIVES.md - Infraestructura Completa del Proyecto agent-web

> **📌 Propósito**: Este archivo proporciona una **visión completa y detallada** de la estructura de archivos y directorios del proyecto **agent-web**, diseñada específicamente para que **agentes de IA** puedan entender rápidamente la organización, propósito y relaciones entre todos los componentes.

---

## 📁 Estructura de Directorios Completa

```
agent-web/
├── AGENTS.md                  # 🎯 Contexto global para agentes IA (este repositorio)
├── ARCHIVES.md                # 🗃️ Este archivo - estructura completa de archivos
├── TROUBLESHOOTING.md         # 🐞 Registro global de errores y soluciones
├── README.md                  # 📖 Documentación para desarrolladores humanos
│
├── src/                       # 📦 Código fuente principal (ES Modules)
│   ├── index.js               # 🚀 Punto de entrada principal del widget
│   │                          #    - Inicializa todos los módulos
│   │                          #    - Inyecta el widget en la página
│   │                          #    - Exporta API pública (WebAgent)
│   │
│   ├── core/                  # 🧠 Lógica principal del agente (Módulos nucleares)
│   │   ├── AGENTS.md          # Contexto específico del core para agentes IA
│   │   │
│   │   ├── dom-analyzer.js    # 🔍 Analizador de DOM
│   │   │                     #    - Extrae texto visible de la página
│   │   │                     #    - Crea resumen inteligente del contenido
│   │   │                     #    - Identifica tipo de página (e-commerce, blog, etc.)
│   │   │                     #    - Genera contexto para el LLM
│   │   │
│   │   ├── voice-manager.js    # 🎤 Gestor de voz
│   │   │                     #    - Entrada: Web Speech API (SpeechRecognition)
│   │   │                     #    - Salida: Web Speech API (SpeechSynthesis)
│   │   │                     #    - Manejo de errores y compatibilidad
│   │   │                     #    - Normalización de texto
│   │   │
│   │   ├── llm-client.js      # 🤖 Cliente de LLM (OpenAI Chat API)
│   │   │                     #    - Conexión directa a OpenAI
│   │   │                     #    - Construcción de prompts con contexto
│   │   │                     #    - Manejo de rate limiting
│   │   │                     #    - Streaming de respuestas
│   │   │
│   │   ├── action-engine.js   # ⚡ Motor de acciones
│   │   │                     #    - Definición de acciones seguras
│   │   │                     #    - Validación de seguridad
│   │   │                     #    - Ejecución de acciones en el DOM
│   │   │                     #    - Historial de acciones
│   │   │
│   │   └── config.js          # ⚙️ Configuración por defecto
│   │                         #    - Valores predefinidos
│   │                         #    - Opciones de personalización
│   │                         #    - Validación de configuración
│   │
│   ├── ui/                    # 🎨 Interfaz de usuario
│   │   ├── AGENTS.md          # Contexto específico de la UI para agentes IA
│   │   │
│   │   ├── widget.html        # 📄 Estructura HTML del widget
│   │   │                     #    - Botón flotante
│   │   │                     #    - Panel de conversación
│   │   │                     #    - Indicadores de estado
│   │   │
│   │   ├── widget.css         # 🎭 Estilos CSS
│   │   │                     #    - Diseño moderno y minimalista
│   │   │                     #    - Posicionamiento flotante
│   │   │                     #    - Animaciones
│   │   │                     #    - Responsive design
│   │   │
│   │   └── widget.js          # 💻 Lógica de la interfaz
│   │                         #    - Control del botón flotante
│   │                         #    - Gestión del panel
│   │                         #    - Renderizado del historial
│   │                         #    - Event listeners
│   │
│   └── utils/                 # 🔧 Utilidades compartidas
│       ├── AGENTS.md          # Contexto de utilidades para agentes IA
│       ├── helpers.js         # Funciones auxiliares
│       ├── security.js        # Validaciones de seguridad
│       └── constants.js       # Constantes globales
│
├── dist/                      # 📦 Archivos compilados para producción
│   ├── agent-web.min.js       # Bundle minificado (UMD)
│   ├── agent-web.esm.js       # Bundle ESM (para import dinámico)
│   └── styles.min.css         # CSS minificado
│
├── backend/                   # 🖥️ Backend opcional (para producción)
│   ├── AGENTS.md              # Contexto del backend para agentes IA
│   ├── server.js              # Servidor Node.js para tokens efímeros
│   ├── routes/                # Rutas API
│   │   └── tokens.js          # Generación de tokens para OpenAI
│   └── package.json           # Dependencias del backend
│
├── docs/                      # 📚 Documentación
│   ├── AGENTS.md              # Contexto de docs para agentes IA
│   ├── integration.md         # Guía de integración
│   ├── configuration.md       # Opciones de configuración
│   ├── api-reference.md       # Referencia de la API JavaScript
│   └── examples/              # Ejemplos de uso
│       ├── basic.html         # Ejemplo básico
│       ├── ecommerce.html     # Ejemplo en tienda online
│       └── custom-config.html  # Ejemplo con configuración personalizada
│
├── tests/                     # 🧪 Pruebas (opcional para desarrollo)
│   ├── core.test.js           # Pruebas de módulos core
│   └── ui.test.js             # Pruebas de UI
│
├── .gitignore                 # Archivos ignorados por Git
├── package.json               # Configuración del proyecto npm
├── vite.config.js             # Configuración de Vite (bundler)
└── LICENSE                    # Licencia del proyecto
```

---

## 🎯 Propósito de Cada Directorio

| **Directorio** | **Propósito** | **Contenido** | **Dependencias** |
|---------------|--------------|---------------|------------------|
| `/` (raíz) | Configuración y documentación global | AGENTS.md, ARCHIVES.md, TROUBLESHOOTING.md, README.md, package.json | Ninguna |
| `/src` | Código fuente principal | Todos los módulos del widget | Ninguna (auto-contenido) |
| `/src/core` | Lógica principal del agente | Módulos nucleares (DOM, voz, LLM, acciones) | APIs nativas + OpenAI |
| `/src/ui` | Interfaz de usuario | Componentes visuales | /src/core |
| `/src/utils` | Utilidades compartidas | Funciones reutilizables | Ninguna |
| `/dist` | Archivos de producción | Bundles minificados | /src |
| `/backend` | Backend opcional | Servidor para tokens efímeros | Node.js, Express |
| `/docs` | Documentación | Guías y ejemplos | Ninguna |
| `/tests` | Pruebas | Tests unitarios | Jest/Vitest |

---

## 🔗 Diagrama de Dependencias entre Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                         agent-web (Proyecto)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    /src/index.js (Entrada)                     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐  │ │
│  │  │   Config    │  │    Utils     │  │         UI              │  │ │
│  │  │  (config.js)│  │  (utils/)    │  │   (widget.js/html/css)   │  │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────────┘  │ │
│  │         │                │                   │                 │ │
│  └─────────┼────────────────┼───────────────────┼─────────────────┘ │
│            │                │                   │                   │
│  ┌─────────▼────────────────▼───────────────────▼─────────────┐  │
│  │                     /src/core/ (Lógica)                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │  │
│  │  │ DOM Analyzer │  │ Voice Manager │  │    LLM Client    │    │  │
│  │  │ (dom-analyzer)│  │ (voice-manager)│  │  (llm-client)    │    │  │
│  │  └──────────────┘  └──────────────┘  └─────────┬─────────┘    │  │
│  │                                                  ↓            │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │                   Action Engine (action-engine.js)         │  │  │
│  │  │  - Recibe comandos del LLM Client                         │  │  │
│  │  │  - Valida seguridad                                          │  │  │
│  │  │  - Ejecuta en el DOM                                         │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌───────────────────┐
                    │  Página Web Host  │
                    │  (DOM + APIs)     │
                    └───────────────────┘
```

---

## 📦 Módulos Core (Detalle Técnico)

### 1. **dom-analyzer.js**

**Propósito**: Analizar el DOM de la página host y extraer información relevante para el LLM.

**Funciones principales**:
- `extractVisibleText()`: Extrae todo el texto visible de la página
- `getPageStructure()`: Obtiene la estructura jerárquica del DOM
- `identifyPageType()`: Detecta si es e-commerce, blog, etc.
- `createContextSummary(maxTokens)`: Crea un resumen optimizado para el prompt
- `getInteractiveElements()`: Identifica botones, enlaces, inputs

**Dependencias**: Ninguna (APIs nativas del DOM)

**Salidas**: Objetos de contexto para el LLM

---

### 2. **voice-manager.js**

**Propósito**: Manejar la entrada y salida de voz usando Web Speech API.

**Funciones principales**:
- `startListening(callback)`: Inicia reconocimiento de voz
- `stopListening()`: Detiene reconocimiento
- `speak(text)`: Sintetiza voz a partir de texto
- `isSupported()`: Verifica si el navegador soporta Web Speech API
- `getVoices()`: Obtiene voces disponibles

**Dependencias**: Web Speech API (navegador)

**Salidas**: Textos transcritos y voz sintetizada

---

### 3. **llm-client.js**

**Propósito**: Comunicarse con OpenAI Chat API para obtener respuestas inteligentes.

**Funciones principales**:
- `chat(messages, options)`: Envía mensajes al LLM
- `streamChat(messages, options)`: Streaming de respuestas
- `buildPrompt(context, query)`: Construye prompts con contexto de la página
- `setApiKey(key)`: Configura la API key de OpenAI

**Dependencias**: Fetch API, OpenAI Chat API

**Salidas**: Respuestas del LLM en formato texto

---

### 4. **action-engine.js**

**Propósito**: Ejecutar acciones seguras en el DOM basado en comandos del usuario.

**Funciones principales**:
- `executeAction(actionType, params)`: Ejecuta una acción válida
- `validateAction(action)`: Valida que la acción es segura
- `findElement(selector)`: Encuentra elementos en el DOM
- `clickElement(selector)`: Haz clic en un elemento
- `scrollTo(selector)`: Desplaza a un elemento
- `fillInput(selector, value)`: Llena un input
- `search(query)`: Busca en la página

**Dependencias**: /src/core/dom-analyzer.js, /src/utils/security.js

**Salidas**: Ejecución de acciones en el DOM

---

### 5. **widget.js** (UI)

**Propósito**: Controlar la interfaz de usuario del widget.

**Funciones principales**:
- `init(config)`: Inicializa el widget
- `toggleWidget()`: Muestra/oculta el widget
- `addMessage(role, content)`: Añade mensaje al historial
- `render()`: Renderiza el widget
- `updateStatus(status)`: Actualiza el estado (escuchando, procesando, etc.)

**Dependencias**: /src/core/* (todos los módulos core)

---

## 📊 Estadísticas del Proyecto

| **Métrica** | **Valor** | **Notas** |
|-------------|----------|-----------|
| Lenguaje principal | JavaScript (ES6+) | Sin transpilación necesaria |
| Framework | Vanilla JS | Sin dependencias de frameworks |
| Bundler | Vite | Para producción |
| Tamaño objetivo | < 50KB minificado | Sin dependencias externas |
| Compatibilidad | Chrome, Firefox, Edge, Safari | Con polyfills si necesario |
| Modularidad | ES Modules | Import/export nativo |

---

## 🏷️ Convenciones de Nomenclatura

| **Tipo** | **Convención** | **Ejemplo** |
|----------|---------------|-------------|
| Archivos JS | lowercase-con-dashes.js | `dom-analyzer.js` |
| Archivos CSS | lowercase-con-dashes.css | `widget.css` |
| Archivos HTML | lowercase-con-dashes.html | `widget.html` |
| Funciones | camelCase | `extractVisibleText()` |
| Variables | camelCase | `currentPageContext` |
| Constantes | UPPER_SNAKE_CASE | `MAX_TOKENS` |
| Clases | PascalCase | `class Widget {}` |
| Selectores CSS | BEM-like | `.widget__button` |

---

## 🔍 How to Navigate (Para Agentes IA)

Si eres un **agente de IA** que está modificando este código:

1. **Para entender el proyecto completo**: Lee primero este archivo (ARCHIVES.md) + AGENTS.md
2. **Para modificar un módulo específico**: Lee el AGENTS.md de esa carpeta
3. **Para resolver un error**: Consulta TROUBLESHOOTING.md
4. **Para añadir una nueva funcionalidad**:
   - Identifica en qué módulo encaja (core, ui, utils)
   - Lee el AGENTS.md de ese módulo
   - Sigue las convenciones de nomenclatura
   - Documenta en el AGENTS.md correspondiente

---

## 📝 Notas Adicionales

- **Todos los archivos de código** deben tener un **encabezado con su propósito** en comentarios JSDoc
- **Toda función exportada** debe tener **documentación JSDoc**
- **Los cambios significativos** deben documentarse en **TROUBLESHOOTING.md** antes de aplicarse
- **La configuración por defecto** está en `/src/core/config.js`

---

**💡 Consejos para Agentes IA**:
> - El archivo `AGENTS.md` en cada carpeta contiene el **contexto específico** de esa parte
> - El archivo `ARCHIVES.md` (este) contiene la **visión global** de todo el proyecto
> - El archivo `TROUBLESHOOTING.md` contiene **lecciones aprendidas** de errores pasados
> - **Siempre verifica** si tu modificación afecta la seguridad o compatibilidad
