# 📦 /src - AGENTS.md

## 📌 Descripción

El directorio **`/src`** contiene **todo el código fuente** del widget **agent-web**. 

Este es el **corazón del proyecto**, organizado en módulos independientes que trabajan juntos para proporcionar la funcionalidad completa del agente de voz.

## 🏗️ Arquitectura

```
/src/
├── index.js               # 🚀 Punto de entrada principal
├── core/                  # 🧠 Módulos nucleares de lógica
├── ui/                    # 🎨 Componentes de interfaz de usuario
└── utils/                 # 🔧 Utilidades compartidas
```

### Flujo de Datos:
```
index.js (Entrada)
    │
    ├─► core/ (Lógica)
    │     ├─► dom-analyzer.js    → Extrae contexto de la página
    │     ├─► voice-manager.js    → Maneja voz (entrada/salida)
    │     ├─► llm-client.js      → Consulta a OpenAI
    │     └─► action-engine.js   → Ejecuta acciones en el DOM
    │
    └─► ui/ (Interfaz)
          ├─► widget.js          → Controla la UI
          ├─► widget.html       → Estructura HTML
          └─► widget.css        → Estilos

    └─► utils/ (Utilidades)
          ├─► helpers.js         → Funciones auxiliares
          ├─► security.js        → Validación de seguridad
          └─► constants.js       → Constantes globales
```

## ✅ Responsabilidades

- [ ] **Proporcionar toda la funcionalidad** del widget
- [ ] **Mantener modularidad**: Cada componente tiene una responsabilidad clara
- [ ] **Ser auto-contenido**: No depende de librerías externas (excepto APIs nativas)
- [ ] **Funcionar en cualquier página web**: Sin importar el framework o CMS
- [ ] **Ser eficiente**: Mínimo impacto en el rendimiento de la página host

## 🤖 Notas CRÍTICAS para Agentes IA

> ⚠️ **CONTEXTO ESPECIAL PARA MODELOS DE IA**:
>
> 1. **Este directorio es autónomo**: No importa en qué página se integre, el código en `/src` debe funcionar igual.
>
> 2. **No asumir frameworks**: El código NO puede depender de React, Angular, Vue, jQuery, etc. Usar solo **Vanilla JavaScript**.
>
> 3. **ES Modules**: Todos los archivos usan `import/export` (ES6 Modules).
>
> 4. **Sin Node.js en client-side**: No usar `require()`, `__dirname`, `process.env`, etc. Todo es para navegador.
>
> 5. **Seguridad**: Cualquier acción que modifique el DOM debe validarse en `action-engine.js` usando `security.js`.
>
> 6. **Compatibilidad**: El código DEBE funcionar en:
>    - Chrome (última versión)
>    - Firefox (última versión)
>    - Edge (última versión)
>    - Safari (última versión, con polyfills si necesario)
>
> 7. **Tamaño**: Optimizar para mantener el bundle final **< 50KB minificado**.

## 🔗 Relación con otros componentes

| **Componente** | **Depende de** | **Es requerido por** | **Comunicación** |
|---------------|---------------|---------------------|------------------|
| `index.js` | `core/*`, `ui/*`, `utils/*` | Ninguno (es el entry point) | Exporta API pública |
| `core/dom-analyzer.js` | `utils/helpers.js` | `llm-client.js`, `action-engine.js` | Devuelve objetos de contexto |
| `core/voice-manager.js` | Web Speech API | `ui/widget.js` | Callbacks con texto |
| `core/llm-client.js` | `core/dom-analyzer.js`, Fetch API | `ui/widget.js`, `core/action-engine.js` | Promesas con respuestas |
| `core/action-engine.js` | `core/dom-analyzer.js`, `utils/security.js` | `ui/widget.js` | Ejecuta acciones en DOM |
| `ui/widget.js` | `core/*` | Ninguno | Controla la interfaz |
| `utils/*` | Ninguna | Todos los módulos | Funciones reutilizables |

## 📚 Convenciones del Código

### Import/Export
```javascript
// ✅ CORRECTO - ES Modules
import { function1 } from './module.js';
export { myFunction };

// ❌ INCORRECTO - CommonJS
const module = require('./module');
module.exports = { ... };
```

### Estructura de Archivos
```javascript
// 1. Encabezado obligatorio (JSDoc)
/**
 * @file Nombre del módulo
 * @description Breve descripción del propósito
 * @author agent-web
 */

// 2. Imports (agrupados por tipo)
import { helper1 } from '../utils/helpers.js';
import { securityCheck } from '../utils/security.js';

// 3. Constantes
const CONSTANT_NAME = 'value';

// 4. Clases/Funciones (con JSDoc)
/**
 * Describe qué hace la función
 * @param {type} param1 - Descripción
 * @param {type} param2 - Descripción
 * @returns {type} Descripción del retorno
 */
function functionName(param1, param2) { ... }

// 5. Exports
export { functionName };
```

### Nombres de Archivos
| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Módulo | lowercase-con-dashes | `dom-analyzer.js` |
| Utilidad | lowercase-con-dashes | `security-check.js` |
| Configuración | lowercase | `config.js` |
| Constantes | lowercase | `constants.js` |

## 🎯 Buenas Prácticas

1. **Documentación**: TODA función exportada debe tener JSDoc
2. **Tipado**: Usar JSDoc types para mejor autocompletado
3. **Error Handling**: Manejar errores explícitamente
4. **Performance**: Evitar operaciones costosas en el thread principal
5. **Memory**: Limpiar event listeners y recursos cuando ya no se usen

## 🚨 Advertencias

- **NO usar `eval()`**: Nunca, bajo ninguna circunstancia
- **NO usar `innerHTML` directamente**: Usar `textContent` o DOM methods
- **NO almacenar datos sensibles**: API keys, tokens, etc. en client-side
- **NO asumir estructura de DOM**: La página host puede tener cualquier estructura

---

**📝 Nota final para agentes IA**:
> - Para entender un módulo específico, ve a su AGENTS.md
> - Para entender cómo se comunican los módulos, ve ARCHIVES.md
> - Para ver errores comunes, ve TROUBLESHOOTING.md
> - **Siempre pregunta**: "¿Esta modificación afecta la seguridad o compatibilidad?"
