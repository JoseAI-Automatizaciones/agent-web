# 🎨 /src/ui - AGENTS.md

## 📌 Descripción

El directorio **`/src/ui`** contiene **todos los componentes de interfaz de usuario** del widget **agent-web**.

Este es el **rosto visible** del agente: el botón flotante, el panel de conversación y todos los elementos visuales con los que interactúa el usuario final.

## 🏗️ Arquitectura

```
/src/ui/
├── AGENTS.md              # 📄 Este archivo
├── widget.html            # 📄 Estructura HTML del widget
├── widget.css             # 🎭 Estilos CSS
└── widget.js              # 💻 Lógica de la interfaz
```

### Flujo de la UI:
```
┌─────────────────────────────────────────────────────────────────┐
│                         WIDGET UI                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐                                                 │
│  │  Botón      │ ← Siempre visible (flotante)                     │
│  │  Flotante   │   - Al hacer clic: abre/ciierra el panel           │
│  └──────┬──────┘   - Muestra estado (escuchando, procesando, etc.) │
│         │                                                          │
│         ▼                                                          │
│  ┌─────────────────────────────────────┐                            │
│  │           Panel Principal           │ ← Se muestra al abrir      │
│  │  ┌───────────────────────────────┐ │                            │
│  │  │        Header                 │ │  - Título + botón cerrar  │
│  │  │  ┌──────────┐  ┌─────────────┐│ │                            │
│  │  │  │  Estado   │  │  Config     ││ │                            │
│  │  │  │  (Pill)   │  │  (Opcional)  ││ │                            │
│  │  │  └──────────┘  └─────────────┘│ │                            │
│  │  └───────────────────────────────┘ │                            │
│  │                                                   │                            │
│  │  ┌───────────────────────────────┐ │  - Historial de conversación│
│  │  │        Chat Area               │ ← Scrollable               │
│  │  │  ┌─────────────────────────┐  │  - Mensajes del usuario     │
│  │  │  │    Mensaje               │  │  - Respuestas del agente   │
│  │  │  │  (con timestamp)          │  │  - Estados intermedios     │
│  │  │  └─────────────────────────┘  │                            │
│  │  │                                │  │                            │
│  │  │  ┌─────────────────────────┐  │                            │
│  │  │  │    Input Area             │  │  - Campo de texto           │
│  │  │  │  ┌─────────────────────┐  │  - Botón de enviar          │
│  │  │  │  │  Input + Micrófono    │  │  - Botón de voz             │
│  │  │  │  └─────────────────────┘  │  │                            │
│  │  │  └─────────────────────────┘  │                            │
│  │  └───────────────────────────────┘ │                            │
│  └─────────────────────────────────────┘                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

## ✅ Responsabilidades

El módulo UI es responsable de:

- [ ] **Mostrar/ocultar** el widget (botón + panel)
- [ ] **Capturar entrada del usuario** (voz y texto)
- [ ] **Mostrar respuestas** del agente (texto y voz)
- [ ] **Gestionar el estado** (escuchando, procesando, error, etc.)
- [ ] **Mantener el historial** de la conversación
- [ ] **Permitir configuración** básica (opcional)
- [ ] **Ser accesible** (teclado, screen readers)
- [ ] **Ser responsive** (funcionar en móvil y desktop)

## 🤖 Notas CRÍTICAS para Agentes IA

> ⚠️ **CONTEXTO ESPECIAL PARA MODELOS DE IA**:
>
> 1. **Este módulo NO contiene lógica de negocio**: 
>    - La lógica está en `/src/core/`
>    - Este módulo **solo** controla la interfaz
>    - Usa los módulos core como servicios
>
> 2. **El widget debe ser no intrusivo**:
>    - No bloquear el contenido de la página
>    - No interferir con los eventos de la página
>    - Poder ser cerrado fácilmente
>
> 3. **Estados del widget**:
>    ```
>    IDLE → Listo para recibir entrada
>    LISTENING → Reconociendo voz
>    PROCESSING → Esperando respuesta del LLM
>    SPEAKING → Reproduciendo voz
>    ERROR → Hubo un error
>    ```
>
> 4. **Accesibilidad**:
>    - Todos los elementos interactivos deben tener `aria-*` attributes
>    - El foco debe manejarse correctamente
>    - Debe funcionar sin ratón (solo teclado)
>
> 5. **Rendimiento**:
>    - El panel NO debe re-renderizarse innecesariamente
>    - Usar `requestAnimationFrame` para animaciones
>    - Limitar el tamaño del historial en memoria

## 📦 Detalle de los Archivos

---

### 1. **widget.html**

**Propósito**: Definir la **estructura HTML** del widget.

**Contenido**:
```html
<!-- Botón flotante (siempre visible) -->
<div class="agent-web-float-button">
  <svg class="agent-web-icon" viewBox="0 0 24 24">...</svg>
  <span class="agent-web-status-pill">Idle</span>
</div>

<!-- Panel principal (oculto por defecto) -->
<div class="agent-web-panel">
  <!-- Header -->
  <div class="agent-web-header">
    <h3>Asistente de Voz</h3>
    <button class="agent-web-close" aria-label="Cerrar panel">×</button>
  </div>
  
  <!-- Área de chat -->
  <div class="agent-web-chat" role="log" aria-live="polite">
    <div class="agent-web-message agent-web-message--user">
      <span class="agent-web-timestamp">14:30</span>
      <p>¿Qué hay en esta página?</p>
    </div>
    <div class="agent-web-message agent-web-message--agent">
      <span class="agent-web-timestamp">14:30</span>
      <p>Esta página es sobre...</p>
    </div>
  </div>
  
  <!-- Área de input -->
  <div class="agent-web-input-area">
    <textarea 
      class="agent-web-text-input" 
      placeholder="Escribe o habla..."
      aria-label="Entrada de texto"
    ></textarea>
    <button class="agent-web-voice-button" aria-label="Grabar voz">🎤</button>
    <button class="agent-web-send-button" aria-label="Enviar">→</button>
  </div>
</div>
```

**Responsabilidades**:
- [ ] Definir la estructura HTML semántica
- [ ] Incluir atributos de accesibilidad (`aria-*`)
- [ ] Usar clases CSS consistentes (BEM-like)
- [ ] No incluir lógica JavaScript

**Dependencias**: Ninguna

**Usado por**: `widget.js` (para inyectar en la página)

**Notas para IA**:
> - Usar **clases específicas** con prefijo `agent-web-` para evitar conflictos
> - NO usar IDs (para permitir múltiples instancias en el futuro)
> - Mantener la estructura **simple y minimalista**

---

### 2. **widget.css**

**Propósito**: Definir los **estilos visuales** del widget.

**Estructura**:
```css
/* ===== Variables CSS ===== */
:root {
  --agent-web-primary: #52d1b2;
  --agent-web-secondary: #07111f;
  --agent-web-text: #ebf4ff;
  --agent-web-muted: #9db5d3;
  --agent-web-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --agent-web-border-radius: 16px;
}

/* ===== Botón Flotante ===== */
.agent-web-float-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--agent-web-primary);
  border: none;
  cursor: pointer;
  box-shadow: var(--agent-web-shadow);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.agent-web-float-button:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

/* ===== Panel Principal ===== */
.agent-web-panel {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 360px;
  max-height: 600px;
  background: var(--agent-web-secondary);
  border-radius: var(--agent-web-border-radius);
  box-shadow: var(--agent-web-shadow);
  z-index: 9999;
  display: none; /* Oculto por defecto */
  flex-direction: column;
  overflow: hidden;
}

.agent-web-panel.active {
  display: flex;
}

/* ===== Estados ===== */
.agent-web-float-button.listening {
  animation: pulse 1s infinite;
}

.agent-web-float-button.processing {
  animation: spin 1s linear infinite;
}

.agent-web-status-pill {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff7b72;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
}
```

**Responsabilidades**:
- [ ] Definir estilos para todos los componentes del widget
- [ ] Usar **variables CSS** para fácil personalización
- [ ] Ser **responsive** (funcionar en móvil)
- [ ] Incluir animaciones para estados (escuchando, procesando)
- [ ] Soporte para temas (claros/oscuros)

**Dependencias**: Ninguna

**Usado por**: `widget.html`

**Notas para IA**:
> - Usar **CSS moderno** (Flexbox, Grid, custom properties)
> - Evitar `!important`
> - Minimizar el uso de `@media queries` (usar unidades relativas)
> - El widget debe verse bien **sobre cualquier página** (cualquier color de fondo)

---

### 3. **widget.js**

**Propósito**: Controlar la **lógica de la interfaz** del widget.

**Funciones principales**:
```javascript
// Inicializa el widget
export function init(config = {}) { ... }

// Inyecta el HTML del widget en la página
export function injectWidget() { ... }

// Alterna la visibilidad del panel
export function togglePanel() { ... }

// Abre el panel
export function openPanel() { ... }

// Cierra el panel
export function closePanel() { ... }

// Añade un mensaje al historial
export function addMessage(role, content) { ... }

// Actualiza el estado del widget
export function updateStatus(status) { ... }

// Configura event listeners
export function setupEventListeners() { ... }

// Maneja el envío de mensajes
export function handleSendMessage() { ... }

// Maneja el inicio de reconocimiento de voz
export function handleStartListening() { ... }

// Renderiza el widget
export function render() { ... }
```

**Responsabilidades**:
- [ ] **Inyectar** el HTML/CSS del widget en la página
- [ ] **Gestionar el estado** de la UI
- [ ] **Capturar eventos** del usuario (clicks, teclado, voz)
- [ ] **Orquestar** los módulos core (llamar a voice-manager, llm-client, etc.)
- [ ] **Mostrar resultados** al usuario
- [ ] **Mantener el historial** de la conversación

**Dependencias**:
- `widget.html` (plantilla)
- `widget.css` (estilos)
- `../core/voice-manager.js` (voz)
- `../core/llm-client.js` (LLM)
- `../core/action-engine.js` (acciones)
- `../core/config.js` (configuración)

**Usado por**: `../index.js` (punto de entrada)

**Notas para IA**:
> - Este es el **controlador** de la UI
> - NO debe contener lógica de negocio (eso va en `/src/core/`)
> - Debe ser **reactivo** a cambios de estado
> - Debe manejar errores **gracefully** (mostrar mensajes amigables)

---

## 🔗 Comunicación con Módulos Core

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMUNICACIÓN UI ↔ CORE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  UI (widget.js) → Core:                                            │
│  ─────────────────────────────                                    │
│  voice-manager.startListening()    → Inicia reconocimiento de voz   │
│  voice-manager.stopListening()     → Detiene reconocimiento        │
│  llm-client.chat(prompt)          → Envía mensaje al LLM          │
│  action-engine.executeAction()    → Ejecuta una acción            │
│                                                                     │
│  Core → UI (widget.js):                                           │
│  ─────────────────────────────                                    │
│  voice-manager.onResult(text)     → Texto transcrito               │
│  voice-manager.onError(error)     → Error de reconocimiento         │
│  llm-client.onResponse(text)      → Respuesta del LLM             │
│  action-engine.onSuccess(result) → Acción ejecutada con éxito     │
│  action-engine.onError(error)    → Error al ejecutar acción        │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Estados de la UI

| **Estado** | **Descripción** | **Representación Visual** | **Comportamiento** |
|------------|----------------|---------------------------|-------------------|
| `IDLE` | Widget listo | Botón normal | Espera entrada del usuario |
| `LISTENING` | Grabando voz | Botón con animación de pulso | Captura audio |
| `PROCESSING` | Procesando | Botón con animación de carga | Espera respuesta del LLM |
| `SPEAKING` | Hablando | Botón con animación de ondas | Reproduce voz |
| `ERROR` | Hubo un error | Botón rojo | Muestra mensaje de error |

---

## 🎨 Personalización

El widget puede ser personalizado mediante la configuración:

```javascript
WebAgent.init({
  // Posición del botón
  position: 'bottom-right',  // bottom-left | top-right | top-left
  
  // Colores
  primaryColor: '#52d1b2',
  secondaryColor: '#07111f',
  textColor: '#ebf4ff',
  
  // Tamaño
  width: '360px',
  maxHeight: '600px',
  
  // Idioma
  language: 'es',
  
  // Comportamiento
  autoOpen: false,
  showTimestamp: true
});
```

---

## 🚨 Advertencias Específicas

1. **En widget.html**:
   - NO incluir scripts inline (usar archivos externos)
   - Todos los elementos interactivos deben tener `aria-label`
   - Usar `role` appropriate para elementos semánticos

2. **En widget.css**:
   - NO usar `!important`
   - Preferir unidades relativas (em, rem, %) sobre absolutas (px)
   - Asegurar contraste adecuado para accesibilidad

3. **En widget.js**:
   - Limpiar event listeners al destruir el widget
   - Validar que los elementos existen antes de acceder a ellos
   - Usar `requestAnimationFrame` para animaciones

---

## 📋 Checklist para Modificaciones

Antes de modificar cualquier archivo en `/src/ui`:

- [ ] ¿El cambio afecta la **accesibilidad**?
- [ ] ¿El cambio funciona en **móvil**?
- [ ] ¿El cambio es **compatible** con todos los navegadores?
- [ ] ¿El cambio **no rompe** el diseño existente?
- [ ] ¿El cambio está **documentado** en el AGENTS.md correspondiente?
- [ ] ¿El cambio ha sido **testeado**?

---

**📝 Nota final para agentes IA**:
> - Este directorio es la **cara visible** del widget
> - **La experiencia de usuario** depende de este módulo
> - **Testea siempre** los cambios visualmente
> - Ver `ARCHIVES.md` para la estructura completa
> - Ver `TROUBLESHOOTING.md` para errores comunes de UI
