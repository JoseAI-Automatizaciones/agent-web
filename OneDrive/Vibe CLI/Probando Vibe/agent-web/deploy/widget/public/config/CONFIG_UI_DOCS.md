# 🎛️ Configuration UI - Documentación

## 📍 **URL de Acceso**
La interfaz de configuración está disponible en:
- **URL Principal:** https://agent-web-widget.vercel.app/config/

## 📋 **Funcionalidades**

La interfaz permite configurar visualmente todos los parámetros del widget agent-web.

### **1. Configuración de API**
- **API Key de OpenAI** (obligatorio): Campo para ingresar la API key
- **URL del Backend Proxy** (opcional): Permite sobrescribir el backend por defecto
  - Default: `https://agent-web-backend.vercel.app`
- **Modelo de IA**: Selector con opciones:
  - GPT-4o (Recomendado)
  - GPT-4o Mini (Más rápido, más barato)
  - GPT-4 Turbo
  - GPT-4
  - GPT-3.5 Turbo (Económico)
  - GPT-3.5 Turbo 16K

### **2. Personalización de UI**
- **Posición del Widget**:
  - Abajo a la Derecha
  - Abajo a la Izquierda
  - Arriba a la Derecha
  - Arriba a la Izquierda
- **Idioma**: Español, Inglés, Francés, Alemán, Portugués, Italiano
- **Colores**:
  - Color Principal (default: #52d1b2)
  - Color Secundario (default: #07111f)
  - Color de Texto (default: #ebf4ff)
- **Dimensiones**:
  - Ancho del Widget (default: 360px)
  - Altura Máxima (default: 600px)

### **3. Configuración de Voz**
- **Idioma de la Voz**:
  - Español (España)
  - Español (México)
  - Inglés (EE.UU.)
  - Inglés (Reino Unido)
  - Francés
  - Alemán
  - Portugués (Brasil)
  - Italiano
  - Japonés
  - Coreano
- **Velocidad de la Voz**: Slider (0.1 - 10, default: 1)
- **Tono de la Voz**: Slider (0 - 2, default: 1)
- **Escuchar automáticamente al abrir**: Checkbox

### **4. Configuración de IA**
- **Máximo de Tokens**: Input numérico (1 - 4000, default: 150)
- **Temperatura**: Slider (0 - 2, default: 0.7)
  - 0 = Más determinista
  - 2 = Más creativo
- **Prompt del Sistema**: Textarea para personalizar el comportamiento del asistente
  - Default: Prompt en español para asistente de voz

### **5. Comportamiento**
- **Abrir automáticamente al cargar**: Checkbox (default: checked)
- **Mostrar hora de los mensajes**: Checkbox
- **Recordar historial de chat**: Checkbox
- **Máximo de mensajes en historial**: Input numérico (1 - 100, default: 50)

### **6. Vista Previa**
- Muestra una vista previa del widget con mensajes de ejemplo
- Botón "Probar Widget" para interactuar con la vista previa

### **7. Generador de Código**
- Genera automáticamente el código HTML para integrar el widget
- **Botón "Copiar Código"**: Copia el snippet básico
  ```html
  <script src="https://agent-web-widget.vercel.app/widget.js" 
    data-api-key="TU_API_KEY"></script>
  ```
- **Botón "Copiar con Configuración"**: Copia el código con todos los parámetros configurados

## 🔗 **Cómo Usar**

1. Ve a: https://agent-web-widget.vercel.app/config/
2. Configura todos los parámetros según tus necesidades
3. Copia el código generado en la sección "Código para tu Página Web"
4. Pega el código en el `<body>` de tu página web
5. ¡Listo! El widget estará activo con tu configuración

## 📁 **Estructura de Archivos**

```
deploy/widget/public/config/
├── index.html      # Página de configuración (13KB)
├── config-ui.css   # Estilos (12KB)
└── config-ui.js    # Lógica (25KB)
```

## 🎯 **Características Clave**

- ✅ Diseño responsive y amigable
- ✅ Validación de formularios
- ✅ Vista previa del widget
- ✅ Generación automática de código de integración
- ✅ Documentación integrada con enlaces útiles
- ✅ Soporte para todos los modelos de OpenAI
- ✅ Personalización completa de colores y posición
- ✅ Interfaz en español con soporte para múltiples idiomas

## 🔒 **Seguridad**

- ⚠️ **IMPORTANTE**: La API key **NUNCA** se envía a través de nuestro backend
- 🔐 La API key se usa directamente en el navegador del usuario
- 🛡️ El backend proxy solo actúa como intermedio para evitar problemas CORS
- ✅ Todas las validaciones de seguridad del widget se mantienen
- 🔒 No se almacenan ni registran las API keys ingresadas en la configuración

## 🔧 **Requisitos Técnicos**

- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Conexión a Internet
- API Key de OpenAI válida

## 📞 **Soporte**

- **Documentación:** https://github.com/JoseAI-Automatizaciones/agent-web
- **Email:** soporte@joseai.cl
- **Deploy:** https://vercel.com/joseai-automatizaciones/agent-web-widget

---

**Versión:** 1.0.0  
**Última actualización:** 2026-05-11  
**Autor:** JoseAI-Automatizaciones
