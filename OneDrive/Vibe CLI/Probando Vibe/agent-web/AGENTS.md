# 🎯 agent-web - AGENTS.md

## 📌 Descripción Global

**agent-web** es un **widget embeddable** que permite a cualquier dueño de página web integrar un **agente de voz inteligente** que:
- Responde preguntas sobre el contenido de la página
- Realiza acciones seguras (clicks, scroll, búsqueda)
- Funciona mediante interacción por voz (entrada y salida)

Este proyecto está diseñado para ser **fácilmente integrable** en cualquier sitio web sin requerir instalación de extensiones por parte de los usuarios finales.

## 🏗️ Arquitectura Global

```
Usuario Final → Página Web (con widget) → agent-web (client-side)
                                      ↓
                              ┌─────────────────┐
                              │   Web Speech API  │ ← Entrada de voz (gratis)
                              │   (Navegador)     │
                              └────────┬────────┘
                                       ↓
                              ┌─────────────────┐
                              │   DOM Analyzer   │ ← Analiza la página
                              │   (client-side)  │
                              └────────┬────────┘
                                       ↓
                              ┌─────────────────┐
                              │   LLM Client     │ ← OpenAI Chat API
                              │   (client-side)  │
                              └────────┬────────┘
                                       ↓
                              ┌─────────────────┐
                              │  Action Engine   │ ← Ejecuta acciones seguras
                              │   (client-side)  │
                              └────────┬────────┘
                                       ↓
                              ┌─────────────────┐
                              │   Voice Output   │ ← Web Speech API
                              │   (Navegador)     │
                              └─────────────────┘
```

### Componentes Principales:
- **DOM Analyzer** (`src/core/dom-analyzer.js`): Extrae y resume el contenido de la página
- **Voice Manager** (`src/core/voice-manager.js`): Maneja entrada/salida de voz
- **LLM Client** (`src/core/llm-client.js`): Conexión con OpenAI API
- **Action Engine** (`src/core/action-engine.js`): Ejecuta acciones seguras en el DOM
- **Widget UI** (`src/ui/`): Interfaz de usuario (botón flotante + panel)

## ✅ Responsabilidades del Proyecto

- [x] Proporcionar un widget **embeddable** y fácil de integrar
- [x] Funcionar en **cualquier página web** sin configuración previa
- [x] Permitir interacción por **voz** (entrada y salida)
- [x] **Responder preguntas** sobre el contenido de la página
- [x] **Realizar acciones seguras** (clicks, scroll, búsqueda)
- [x] Mantener **privacidad** (todo client-side, sin pasar datos por servidores externos)
- [x] Ser **extensible** y configurable por el dueño de la página

## 📝 **REGLAS OBLIGATORIAS PARA TODOS LOS COLABORADORES (HUMANOS Y IA)**

### 🔴 **REGLA #1: COMMIT Y PUSH SIEMPRE**
> **⚠️ IMPORTANTE**: **TODOS** los cambios realizados en este proyecto **DEBEN** ser commitados y puseados al repositorio remoto **INMEDIATAMENTE** después de ser implementados.
>
> **Proceso obligatorio:**
> 1. Realizar el cambio en el código o documentación
> 2. Verificar que el cambio funciona correctamente
> 3. Hacer `git add <archivos>` para stagear los cambios
> 4. Hacer `git commit -m "descripción clara del cambio"`
> 5. Hacer `git push` al repositorio **JoseAI-Automatizaciones/agent-web**
>
> **❌ NUNCA** dejes cambios sin commit/push. **❌ NUNCA** trabajes en local sin sincronizar.

### 📚 **REGLA #2: DOCUMENTACIÓN DE CAMBIOS OBLIGATORIA**
> **TODOS** los cambios realizados **DEBEN** ser documentados en los archivos `.md` correspondientes del proyecto.
>
> **¿Dónde documentar?**
> - **AGENTS.md** (este archivo): Cambios en arquitectura, reglas globales, contexto para IA
> - **ARCHIVES.md**: Cambios en estructura de archivos, nueva infraestructura
> - **TROUBLESHOOTING.md**: Nuevos errores encontrados y sus soluciones
> - **README.md**: Cambios en la API pública, nuevas features, breaking changes
> - **src/**`*/AGENTS.md`: Cambios específicos de cada módulo/component
>
> **Formato para documentar cambios:**
> ```markdown
> ### 📅 [Fecha] - [Tipo de cambio]
> **Descripción:** [Qué cambió y por qué]
> **Archivos afectados:** [Lista de archivos modificados]
> **Impacto:** [Qué efecto tiene este cambio]
> **Autor:** [Quién lo hizo]
> ```
>
> **Ejemplo:**
> ```markdown
> ### 📅 2024-01-15 - Nueva feature: Soporte para GPT-4
> **Descripción:** Se añadió soporte para el modelo GPT-4 de OpenAI
> **Archivos afectados:** `src/core/llm-client.js`, `src/core/config.js`
> **Impacto:** Los usuarios pueden ahora usar modelos más potentes
> **Autor:** JoseAI-Automatizaciones
> ```

### 🔒 **REGLA #3: SEGURIDAD ANTE TODO**
> Antes de cualquier commit, **VERIFICA** que:
> 1. El cambio NO introduce vulnerabilidades de seguridad
> 2. El cambio NO permite acciones peligrosas (ver `security.js`)
> 3. El cambio NO expone datos sensibles
> 4. El cambio NO rompe las validaciones existentes

## 🤖 Notas CRÍTICAS para Agentes IA

> ⚠️ **CONTEXTO ESPECIAL PARA MODELOS DE IA**:
>
> 1. **Este NO es un proyecto de extensión de navegador**, es un **widget embeddable** que se integra como un script en páginas web.
>
> 2. **Toda la lógica funciona en client-side** (navegador del usuario final). No hay backend obligatorio.
>
> 3. **Seguridad primero**: 
>    - NUNCA permitir acciones en formularios con datos sensibles (login, pago, etc.)
>    - NUNCA permitir clics en enlaces externos
>    - NUNCA permitir modificación de contenido existente
>
> 4. **Web Speech API vs OpenAI API**:
>    - **Entrada de voz**: Usa Web Speech API (gratis, navegador)
>    - **Respuestas inteligentes**: Usa OpenAI Chat API (requiere API key del dueño de la página)
>
> 5. **Estructura modular**: Cada componente en `/src/core/` tiene un propósito específico. 
>    NO mezclar responsabilidades entre módulos.
>
> 6. **Compatibilidad**: El código DEBE funcionar en Chrome, Firefox, Edge y Safari.
>    Usar feature detection para APIs no soportadas.

## 🔗 Relación entre Componentes

```
AGENTS.md (este archivo)
    ↓
┌───────────────────────────────────────────────────────┐
│                 agent-web (Proyecto)                     │
│                                                           │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────┐  │
│  │  DOM        │    │  Voice      │    │  LLM       │  │
│  │  Analyzer   │◄──►│  Manager    │◄──►│  Client    │  │
│  └─────────────┘    └─────────────┘    └────────────┘  │
│           ▲                ▲                 ▲           │
│           │                │                 │           │
│           ▼                ▼                 ▼           │
│  ┌─────────────────────────────────────────────────┐  │
│  │              Action Engine                        │  │
│  │  (Ejecuta acciones seguras en el DOM)            │  │
│  └─────────────────────────────────────────────────┘  │
│                           ▲                              │
│                           │                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │              Widget UI                            │  │
│  │  (Botón flotante + Panel de conversación)        │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

## 📚 Referencias y Recursos

- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [OpenAI Chat API - Documentación](https://platform.openai.com/docs/api-reference/chat)
- [Patrón Module en JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [DOM Traversal API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Traversing_an_HTML_table_with_JavaScript_and_DOM_Interfaces)

## 🎯 Objetivos de Diseño

1. **Minimalismo**: El widget debe ser lo más ligero posible (< 50KB minificado)
2. **Sin dependencias**: Usar solo APIs nativas del navegador + OpenAI
3. **Fácil integración**: Un solo script tag para incluir el widget
4. **Seguridad por defecto**: Bloquear acciones peligrosas automáticamente
5. **Extensible**: Arquitectura modular para añadir nuevas funcionalidades

---

**📝 Nota final para agentes IA**: 
> Cuando modifiques este código, **siempre verifica**:
> 1. ¿La modificación afecta la seguridad?
> 2. ¿La modificación rompe la compatibilidad con algún navegador?
> 3. ¿La modificación aumenta significativamente el tamaño del bundle?
> 4. ¿Hay un error similar documentado en TROUBLESHOOTING.md?
> 5. **¿Se documentó el cambio en los archivos .md correspondientes?**
> 6. **¿Se hizo commit y push de los cambios?**
