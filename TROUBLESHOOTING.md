# 🚨 TROUBLESHOOTING.md - Registro de Errores y Soluciones

> **📌 Propósito**: Documentar cada error encontrado durante el desarrollo y su solución.
> Esto permite que cualquier **agente de IA** (o desarrollador) **evite repetir errores** y **entienda decisiones técnicas** tomadas durante el proyecto.

---

## 🔍 Cómo usar este archivo:

1. **Antes de modificar código**: 
   - Busca en este archivo si el cambio que quieres hacer ya causó problemas antes
   - Ejemplo: Si quieres usar `innerHTML`, busca "innerHTML" en este documento

2. **Al encontrar un error**: 
   - **DOCUMENTA ANTES DE SOLUCIONAR**: Crea una entrada con el error, contexto y causa
   - Luego aplica el fix y actualiza el estado a "✅ Resuelto"

3. **Al hacer cambios importantes**: 
   - Verifica que no estás introduciendo errores ya documentados
   - Si el cambio podría afectar algo, documéntalo aquí

4. **Para agentes IA**: 
   - Este archivo es tu **memoria histórica** del proyecto
   - Si encuentras un error, **busca aquí primero** antes de intentar solucionarlo

---

## 📋 Registro de Errores

### 🔴 [ERROR-001] - Web Speech API no funciona en Safari
**Fecha**: [Por documentar al ocurrir]
**Contexto**: Al probar el widget en Safari iOS/macOS
**Error**: `ReferenceError: SpeechRecognition is not defined`
**Causa**: Safari usa el prefijo `webkitSpeechRecognition` en lugar de `SpeechRecognition`
**Solución aplicada**: 
```javascript
// En src/core/voice-manager.js
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
```
**Archivos afectados**: `src/core/voice-manager.js`
**Estado**: ⚠️ Pendiente de verificar
**Notas**: Necesita testing en Safari para confirmar

---

### 🔴 [ERROR-002] - CORS al conectar directamente a OpenAI API
**Fecha**: [Por documentar al ocurrir]
**Contexto**: Llamada directa desde el navegador a OpenAI Chat API
**Error**: `Access to fetch at 'https://api.openai.com/...' from origin '...' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header`
**Causa**: OpenAI API no permite CORS desde navegadores por seguridad
**Soluciones posibles**:
1. **Recomendada**: Usar un backend proxy (ver `/backend/server.js`)
2. **Alternativa**: Que el dueño de la página configure CORS en su servidor
3. **No recomendada**: Exponer la API key en el frontend (riesgo de seguridad)
**Archivos afectados**: `src/core/llm-client.js`
**Estado**: ⚠️ Pendiente - Se implementará backend opcional
**Notas**: Para desarrollo local, se puede usar la extensión CORS Unblock o similar

---

### 🔴 [ERROR-003] - DOM Analyzer es muy lento en páginas grandes
**Fecha**: [Por documentar al ocurrir]
**Contexto**: Páginas con mucho contenido (ej: e-commerce con 1000+ productos)
**Error**: El análisis del DOM tarda varios segundos, bloqueando la UI
**Causa**: Recorrido de todo el DOM sin optimización
**Solución aplicada**: 
```javascript
// En src/core/dom-analyzer.js
// - Solo analizar elementos visibles (usando IntersectionObserver)
// - Limitar profundidad del análisis
// - Usar requestIdleCallback para no bloquear el thread principal
// - Implementar caching del contexto
```
**Archivos afectados**: `src/core/dom-analyzer.js`
**Estado**: ⚠️ Pendiente de implementar optimizaciones
**Notas**: Prioridad alta para producción

---

### 🔴 [ERROR-004] - Voice Manager no detiene correctamente el reconocimiento
**Fecha**: [Por documentar al ocurrir]
**Contexto**: Al hacer clic en "Detener" durante el reconocimiento de voz
**Error**: El reconocimiento continúa en segundo plano
**Causa**: No se limpian correctamente los event listeners
**Solución aplicada**: 
```javascript
// En src/core/voice-manager.js
stopListening() {
  if (this.recognition) {
    this.recognition.stop();
    this.recognition = null;
    // Limpiar todos los event listeners
    this.removeAllListeners();
  }
}
```
**Archivos afectados**: `src/core/voice-manager.js`
**Estado**: ⚠️ Pendiente
**Notas**: Verificar que no haya memory leaks

---

### 🟡 [WARNING-001] - Web Speech API tiene limitaciones de precisión
**Fecha**: [Por documentar al ocurrir]
**Contexto**: Reconocimiento de voz en español con acentos regionales
**Problema**: Baja precisión en acentos fuertes o palabras técnicas
**Causa**: Web Speech API usa modelos genéricos sin fine-tuning
**Soluciones posibles**:
1. Usar OpenAI Realtime API para mejor precisión (requiere backend)
2. Implementar post-procesamiento del texto
3. Añadir un botón de "corrección manual"
**Archivos afectados**: `src/core/voice-manager.js`
**Estado**: ℹ️ Conocido - No es un error, es una limitación
**Notas**: Considerar para futuras versiones

---

### 🟡 [WARNING-002] - Acciones en formularios pueden ser peligrosas
**Fecha**: [Por documentar al ocurrir]
**Contexto**: Comando de voz: "Envía el formulario"
**Problema**: Podría enviar datos sensibles (login, pago)
**Causa**: No hay validación de qué formularios son seguros
**Solución implementada**: 
```javascript
// En src/core/action-engine.js
const DANGEROUS_FORM_PATTERNS = [
  /password/i,
  /credit.*card/i,
  /ssn/i,
  /cvv/i,
  /login/i,
  /signup/i,
  /checkout/i,
  /payment/i,
  /billing/i
];

function isSafeForm(form) {
  const formText = form.innerText + form.id + form.className;
  return !DANGEROUS_FORM_PATTERNS.some(pattern => pattern.test(formText));
}
```
**Archivos afectados**: `src/core/action-engine.js`, `src/utils/security.js`
**Estado**: ✅ Implementado
**Notas**: Listar más patrones según sea necesario

---

## 📌 Plantilla para Nuevos Errores

```markdown
### [TIPO-NÚMERO] - [Título descriptivo del error]
**Fecha**: DD/MM/AAAA
**Contexto**: [Descripción de cuándo ocurre el error]
**Error**: [Mensaje de error exacto o comportamiento inesperado]
**Causa**: [Explicación técnica de por qué ocurre]
**Solución aplicada**: 
```javascript
// Código de la solución
```
**Archivos afectados**: [lista de archivos]
**Estado**: [✅ Resuelto | ⚠️ Pendiente | ℹ️ Conocido]
**Notas**: [Cualquier información adicional relevante]
```

---

## 🎯 Categorías de Errores

| Prefijo | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| ERROR- | Error Crítico | Bloquea funcionalidad | `ERROR-001` |
| WARNING- | Advertencia | Limitación o comportamiento inesperado | `WARNING-001` |
| INFO- | Información | Decisiones de diseño | `INFO-001` |

---

## 🔍 Búsqueda Rápida

**¿Buscas algo específico?** Usa Ctrl+F (Cmd+F en Mac) y busca:
- Nombres de archivos: `voice-manager.js`, `dom-analyzer.js`
- APIs: `Web Speech API`, `OpenAI`, `fetch`
- Conceptos: `CORS`, `security`, `performance`
- Navegadores: `Safari`, `Chrome`, `Firefox`

---

## 📚 Recursos Útiles

- [Web Speech API - Compatibilidad](https://caniuse.com/web-speech)
- [OpenAI API - CORS](https://platform.openai.com/docs/api-reference)
- [MDN - SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)

---

**💡 Consejos para Agentes IA**:
> 1. **Antes de modificar código**: Busca en este archivo si hay errores relacionados
> 2. **Al encontrar un error**: Documenta IMMEDIATAMENTE, aunque no lo soluciones aún
> 3. **Al solucionar**: Actualiza el estado a ✅ y describe la solución
> 4. **Si no estás seguro**: Deja una nota con tus dudas para que otro agente pueda ayudar
