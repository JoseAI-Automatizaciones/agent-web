# agent-web 🎤

> **Un widget embeddable de agente de voz con IA para cualquier página web**

**agent-web** es un **widget de código abierto** que permite a cualquier dueño de página web integrar un **asistente de voz inteligente** que:

- ✅ **Responde preguntas** sobre el contenido de la página
- ✅ **Realiza acciones seguras** (clicks, scroll, búsqueda)
- ✅ **Funciona con voz** (entrada y salida)
- ✅ **Es fácil de integrar** (un solo script)
- ✅ **Funciona en cualquier página web**

---

## 🚀 Inicio Rápido

### Opción 1: Usar desde CDN (Recomendado para producción)

```html
<!-- Añadir al final del <body> -->
<script 
  src="https://cdn.jsdelivr.net/gh/tu-usuario/agent-web@latest/dist/agent-web.min.js"
  data-api-key="sk-tu-api-key-de-openai"
></script>
```

### Opción 2: Usar desde archivo local

1. **Clona el repositorio:**
```bash
git clone https://github.com/tu-usuario/agent-web.git
cd agent-web
```

2. **Instala dependencias:**
```bash
npm install
```

3. **Construye el widget:**
```bash
npm run build
```

4. **Incluye en tu página:**
```html
<script src="./dist/agent-web.min.js"></script>
<script>
  WebAgent.init({
    apiKey: 'sk-tu-api-key-de-openai'
  });
</script>
```

---

## 📦 Instalación

### Requisitos

- **Navegadores soportados:** Chrome, Firefox, Edge, Safari (últimas versiones)
- **API de OpenAI:** Necesitas una **API key válida** de OpenAI
- **Web Speech API:** Habilitada por defecto en la mayoría de navegadores modernos

### Instalación Manual

1. **Añade el script a tu página:**
```html
<script src="ruta/a/agent-web.min.js"></script>
```

2. **Inicializa el widget:**
```javascript
WebAgent.init({
  apiKey: 'sk-tu-api-key-de-openai'
});
```

---

## 🎛️ Configuración

### Opciones de Configuración

```javascript
WebAgent.init({
  // API de OpenAI
  apiKey: 'sk-...',
  
  // Configuración de LLM
  model: 'gpt-3.5-turbo',      // Modelo a usar
  maxTokens: 150,              // Tokens máximos por respuesta
  temperature: 0.7,            // Temperatura (0-2)
  
  // Configuración de Voz
  voiceRate: 1,               // Velocidad de voz (0.1-10)
  voicePitch: 1,              // Tono de voz (0-2)
  voiceLang: 'es-ES',          // Idioma de voz
  
  // Configuración de UI
  widgetPosition: 'bottom-right', // Posición del botón
  primaryColor: '#52d1b2',    // Color primario
  secondaryColor: '#07111f',  // Color secundario
  textColor: '#ebf4ff',        // Color de texto
  width: '360px',             // Ancho del panel
  maxHeight: '600px',         // Altura máxima del panel
  
  // Configuración de Comportamiento
  autoOpen: false,            // Abrir automáticamente
  showTimestamp: true,        // Mostrar timestamp en mensajes
  rememberHistory: true,     // Recordar historial de conversación
  maxHistoryLength: 50        // Longitud máxima del historial
});
```

### Posiciones del Widget

- `bottom-right` (default)
- `bottom-left`
- `top-right`
- `top-left`

---

## 🔧 API de JavaScript

### Métodos Disponibles

```javascript
const agent = WebAgent.init({ apiKey: 'sk-...' });

// Control del widget
agent.open();        // Abre el panel
agent.close();       // Cierra el panel
agent.toggle();      // Alterna el panel
agent.destroy();     // Destruye el widget

// API Key
agent.setApiKey('sk-...');     // Configura API key
agent.getApiKey();              // Obtiene API key actual
agent.clearApiKey();            // Limpia API key

// Configuración
agent.setConfig({ 
  widgetPosition: 'top-left',
  primaryColor: '#ff0000'
});

// Mensajes
agent.sendMessage('Hola');    // Envía mensaje al LLM
agent.startListening();       // Inicia reconocimiento de voz
agent.stopListening();        // Detiene reconocimiento de voz

// Estado
agent.getState();              // Obtiene estado actual

// Mensajes manuales
agent.addMessage('user', 'Hola');    // Añade mensaje manualmente
agent.addMessage('agent', '¡Hola!'); // Añade respuesta del agente
```

---

## 🛡️ Seguridad

El widget **agent-web** implementa múltiples capas de seguridad:

### 🔒 Protección contra Acciones Peligrosas

- ❌ **No permite** enviar formularios con datos sensibles (login, pago, etc.)
- ❌ **No permite** hacer clic en enlaces externos
- ❌ **No permite** modificar contenido existente
- ❌ **No permite** acceder a almacenamiento local/sesión
- ❌ **No permite** ejecutar scripts arbitrarios

### 🛡️ Validación de Selectores

Todos los selectores CSS son validados contra una lista de patrones peligrosos antes de ser usados.

### 🔐 API Key

- La API key se guarda en **localStorage** (solo en el navegador del usuario)
- **Recomendación:** Usar tokens efímeros en producción para mayor seguridad

---

## 📁 Estructura del Proyecto

```
agent-web/
├── src/                       # Código fuente
│   ├── index.js               # Punto de entrada
│   ├── core/                  # Lógica principal
│   │   ├── config.js          # Configuración
│   │   ├── dom-analyzer.js    # Analizador de DOM
│   │   ├── voice-manager.js   # Gestor de voz
│   │   ├── llm-client.js      # Cliente de LLM
│   │   └── action-engine.js   # Motor de acciones
│   ├── ui/                    # Interfaz de usuario
│   │   ├── widget.html        # HTML
│   │   ├── widget.css         # CSS
│   │   └── widget.js          # Lógica
│   └── utils/                 # Utilidades
│       ├── constants.js       # Constantes
│       ├── helpers.js         # Funciones auxiliares
│       └── security.js        # Validación de seguridad
├── dist/                      # Build para producción
│   └── agent-web.min.js       # Widget minificado
├── AGENTS.md                  # Documentación para IA (global)
├── ARCHIVES.md                # Estructura de archivos
├── TROUBLESHOOTING.md         # Registro de errores
├── package.json
├── vite.config.js
└── .gitignore
```

---

## 🤖 Documentación para Agentes de IA

Este proyecto está diseñado con **documentación especializada para agentes de IA**:

- **`AGENTS.md`** - Contexto global del proyecto para modelos de IA
- **`ARCHIVES.md`** - Descripción completa de la infraestructura de archivos
- **`TROUBLESHOOTING.md`** - Registro de errores y soluciones
- **`AGENTS.md` en cada carpeta** - Contexto específico de cada componente

Los archivos `AGENTS.md` contienen:
- Descripción del componente
- Arquitectura y relaciones
- Responsabilidades
- Notas críticas para IA
- Advertencias y buenas prácticas

---

## 🔧 Desarrollo

### Requisitos

- Node.js 18+
- npm o yarn

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Build para Producción

```bash
npm run build
```

### Preview del Build

```bash
npm run preview
```

---

## 🧪 Pruebas

Para probar el widget localmente:

1. **Ejecuta el servidor de desarrollo:**
```bash
npm run dev
```

2. **Abre el archivo `index.html` en tu navegador:**
```bash
# En otra terminal
npx serve .
```

3. **O crea un archivo HTML de prueba:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Test agent-web</title>
</head>
<body>
  <h1>Página de Prueba</h1>
  <p>Este es un párrafo de prueba.</p>
  <button id="my-button">Haz clic aquí</button>
  
  <!-- Incluye el widget -->
  <script type="module">
    import WebAgent from './src/index.js';
    
    WebAgent.init({
      apiKey: 'sk-tu-api-key',
      widgetPosition: 'bottom-right'
    });
  </script>
</body>
</html>
```

---

## 📝 Notas

### Limitaciones Conocidas

1. **Web Speech API:**
   - No todas las voces están disponibles en todos los navegadores
   - La precisión puede variar según el idioma y acento
   - Safari usa `webkitSpeechRecognition` en lugar de `SpeechRecognition`

2. **OpenAI API:**
   - Requiere una API key válida
   - Tiene límite de peticiones por minuto
   - CORS no permite llamadas directas desde el navegador (se usa un workaround)

3. **Seguridad:**
   - La API key se guarda en localStorage (potencial riesgo si hay XSS)
   - Se recomienda usar tokens efímeros en producción

### Soluciones a Problemas Comunes

Ver `TROUBLESHOOTING.md` para una lista completa de errores y soluciones.

### Contribuir

1. **Forkea el repositorio**
2. **Crea una rama** (`git checkout -b feature/mi-nueva-funcionalidad`)
3. **Haz commit** de tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. **Push a la rama** (`git push origin feature/mi-nueva-funcionalidad`)
5. **Abre un Pull Request**

---

## 📄 Licencia

MIT © [Tu Nombre](https://github.com/tu-usuario/agent-web)

---

## 🙏 Agradecimientos

- **OpenAI** por la API de LLM
- **MDN** por la documentación de Web APIs
- **Vite** por el bundler rápido

---

**¡Gracias por usar agent-web!** 🎉

Si tienes preguntas, problemas o sugerencias, por favor abre un issue en el repositorio.
