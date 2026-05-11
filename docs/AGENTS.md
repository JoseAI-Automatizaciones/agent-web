# 📚 /docs - AGENTS.md

## 📌 Descripción

El directorio **`/docs`** contiene la **documentación para desarrolladores humanos** del proyecto **agent-web**.

Esta documentación está diseñada para ser **clara, concisa y útil** para personas que quieran:
- **Integrar** el widget en sus páginas web
- **Personalizar** el comportamiento del widget
- **Contribuir** al desarrollo del proyecto
- **Entender** cómo funciona el widget

## 🏗️ Arquitectura

```
/docs/
├── AGENTS.md              # 📄 Este archivo
├── integration.md         # Guía de integración
├── configuration.md       # Opciones de configuración
├── api-reference.md       # Referencia de la API JavaScript
└── examples/              # Ejemplos de uso
    ├── basic.html         # Ejemplo básico
    ├── ecommerce.html     # Ejemplo en tienda online
    └── custom-config.html  # Ejemplo con configuración personalizada
```

## ✅ Responsabilidades

- [ ] Proporcionar **guías claras** para la integración
- [ ] Documentar **todas las opciones de configuración**
- [ ] Mantener **ejemplos prácticos** de uso
- [ ] Explicar **la API pública** del widget
- [ ] Ser **fácil de entender** para desarrolladores de todos los niveles

## 🤖 Notas CRÍTICAS para Agentes IA

> ⚠️ **CONTEXTO ESPECIAL PARA MODELOS DE IA**:
>
> 1. **Esta documentación es para humanos**:
>    - Los archivos aquí **NO contienen código**
>    - Son **guías de texto** en formato Markdown
>    - Usan **lenguaje natural** y ejemplos prácticos

> 2. **Si necesitas entender el código**:
>    - Ve a `/src/` y sus archivos `AGENTS.md`
>    - Ve a `ARCHIVES.md` para la estructura completa
>    - Ve a `TROUBLESHOOTING.md` para errores comunes

> 3. **Si necesitas modificar la documentación**:
>    - Mantén el **mismo estilo** que los archivos existentes
>    - Usa **ejemplos de código** cuando sea relevante
>    - Documenta **todos los parámetros** de funciones/configuraciones
>    - Incluye **advertencias de seguridad** cuando sea necesario

## 📦 Detalle de Cada Archivo

---

### 1. **integration.md**

**Propósito**: Explicar **cómo integrar el widget** en diferentes tipos de páginas web.

**Contenido típico**:
- Instrucciones para **HTML estático**
- Instrucciones para **React**
- Instrucciones para **Vue**
- Instrucciones para **Angular**
- Instrucciones para **WordPress**
- Instrucciones para **Shopify**
- Instrucciones para **CMSes populares**
- Soluciones a problemas comunes de integración

**Notas para IA**:
> - Incluir ejemplos de código **completos y funcionales**
> - Explicar **donde colocar el script** (head vs body)
> - Documentar **dependencias** (si las hay)
> - Advertir sobre **conflictos potenciales**

---

### 2. **configuration.md**

**Propósito**: Documentar **todas las opciones de configuración** disponibles.

**Contenido típico**:
```markdown
## Configuración del Widget

### Opciones de UI

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| widgetPosition | string | 'bottom-right' | Posición del botón flotante |
| primaryColor | string | '#52d1b2' | Color primario |
| width | string | '360px' | Ancho del panel |

### Opciones de Voz

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| voiceRate | number | 1 | Velocidad de voz (0.1-10) |
| voicePitch | number | 1 | Tono de voz (0-2) |
| voiceLang | string | 'es-ES' | Idioma de voz |

### Opciones de LLM

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| model | string | 'gpt-3.5-turbo' | Modelo de OpenAI |
| maxTokens | number | 150 | Tokens máximos por respuesta |
| temperature | number | 0.7 | Temperatura (0-2) |
```

**Notas para IA**:
> - Mantener la tabla **actualizada** con todas las opciones
> - Incluir **valores mínimos/máximos** para números
> - Explicar **qué hace cada opción**
> - Advertir sobre **combinaciones peligrosas**

---

### 3. **api-reference.md**

**Propósito**: Proporcionar una **referencia completa** de la API JavaScript.

**Contenido típico**:
```markdown
## API Reference

### WebAgent.init(config, callbacks)

Inicializa el widget.

**Parámetros:**
- `config` (Object): Opciones de configuración
- `callbacks.onOpen` (Function): Callback cuando se abre el widget
- `callbacks.onClose` (Function): Callback cuando se cierra el widget
- `callbacks.onError` (Function): Callback cuando hay un error

**Retorna:** Object - API del widget

**Ejemplo:**
```javascript
const agent = WebAgent.init({
  apiKey: 'sk-...',
  widgetPosition: 'bottom-left'
}, {
  onOpen: () => console.log('Widget abierto'),
  onClose: () => console.log('Widget cerrado')
});
```

### agent.open()

Abre el panel del widget.

**Retorna:** void

**Ejemplo:**
```javascript
agent.open();
```

### agent.close()

Cierra el panel del widget.

**Retorna:** void

### agent.sendMessage(message)

Envía un mensaje al LLM.

**Parámetros:**
- `message` (string): Mensaje a enviar

**Retorna:** Promise<string> - Respuesta del LLM

**Ejemplo:**
```javascript
agent.sendMessage('¿Qué hay en esta página?')
  .then(response => console.log(response))
  .catch(error => console.error(error));
```
```

**Notas para IA**:
> - Documentar **todos los métodos** de la API
> - Incluir **parámetros, tipos y valores de retorno**
> - Proporcionar **ejemplos de código** para cada método
> - Advertir sobre **comportamientos inesperados**

---

### 4. **examples/**

**Propósito**: Proporcionar **ejemplos prácticos** de uso del widget.

**Contenido típico**:
- `basic.html`: Ejemplo mínimo de integración
- `ecommerce.html`: Ejemplo en una tienda online
- `custom-config.html`: Ejemplo con configuración personalizada
- `voice-only.html`: Ejemplo usando solo voz
- `text-only.html`: Ejemplo usando solo texto
- `multiple-widgets.html`: Ejemplo con múltiples instancias

**Notas para IA**:
> - Cada ejemplo debe ser **autónomo** (funcionar sin dependencias externas)
> - Incluir **comentarios explicativos** en el código
> - Mostrar **diferentes casos de uso**
> - Mantener los ejemplos **actualizados** con la última versión

---

## 🔗 Relación con Otros Componentes

```
AGENTS.md (este archivo)
    ↓
┌─────────────────────────────────────────────────────────┐
│                    /docs/ (Documentación)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ integration  │  │ configuration│  │ api-reference│ │
│  │    .md       │  │    .md       │  │    .md       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         ↑              ↑                  ↑            │
│         └──────────────┼──────────────────┘            │
│                     Documenta el uso de                  │
│                     /src/index.js                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🚨 Advertencias Específicas

1. **No incluir código en la documentación**:
   - Los archivos en `/docs` son **solo documentación**
   - El código debe estar en `/src/`

2. **Mantener actualizada la documentación**:
   - Cada cambio en la API debe reflejarse en `api-reference.md`
   - Cada nueva opción debe documentarse en `configuration.md`

3. **Usar lenguaje claro**:
   - Evitar tecnicismos innecesarios
   - Incluir ejemplos prácticos
   - Explicar conceptos complejos

---

## 📋 Checklist para Modificaciones

Antes de modificar cualquier archivo en `/docs`:

- [ ] ¿El cambio refleja **cambios reales** en el código?
- [ ] ¿Los ejemplos de código **funcionan**?
- [ ] ¿La documentación es **clara** para desarrolladores?
- [ ] ¿Se mantiene el **mismo estilo** que los demás archivos?
- [ ] ¿Se ha **actualizado la tabla de contenidos** si es necesario?

---

**📝 Nota final para agentes IA**:
> - Esta carpeta es para **documentación humana**
> - Para entender el **código**, ve a `/src/` y sus archivos `AGENTS.md`
> - Para ver la **estructura**, ve a `ARCHIVES.md`
> - Para ver **errores comunes**, ve a `TROUBLESHOOTING.md`
