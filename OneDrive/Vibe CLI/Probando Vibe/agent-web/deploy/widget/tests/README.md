# 🧪 Tests para Agent-Web Widget

Este directorio contiene todos los tests para el widget Agent-Web.

## 📁 Estructura de Tests

```
tests/
├── README.md              # Este archivo
├── setup.js               # Configuracion global para Vitest
└── src/
    ├── core/
    │   ├── voice-manager.test.js    # Tests de gestor de voz
    │   ├── dom-analyzer.test.js     # Tests de analizador de DOM
    │   ├── llm-client.test.js       # Tests de cliente LLM
    │   ├── action-engine.test.js    # Tests de motor de acciones
    │   └── config.test.js           # Tests de configuracion
    └── utils/
        ├── helpers.test.js         # Tests de helpers
        └── security.test.js         # Tests de seguridad
```

## 🚀 Ejecución de Tests

### Instalar dependencias

```bash
# Navegar al directorio del proyecto
cd agent-web

# Instalar dependencias (incluyendo Vitest)
npm install
```

### Ejecutar todos los tests

```bash
# Ejecutar todos los tests una vez
npm test

# Ejecutar tests en modo watch (se ejecutan automaticamente al guardar)
npm run test:watch

# Ejecutar tests con cobertura de codigo
npm run test:coverage
```

### Ejecutar tests por categoría

```bash
# Tests de UI (widget)
npm run test:ui

# Tests de core (módulos principales)
npm run test:core

# Tests de utils (utilidades)
npm run test:utils

# Todos los tests con reporte detallado
npm run test:all
```

## 📊 Cobertura de Código

Para generar un reporte de cobertura:

```bash
npm run test:coverage
```

Esto generará un reporte en:
- Consola (texto)
- `coverage/` (HTML detallado)
- `coverage/coverage.json` (JSON para CI/CD)

### Ver reporte HTML de cobertura

Abre el archivo `coverage/index.html` en tu navegador.

## 🎯 Casos de Test

### voice-manager.js
- ✅ Normalización de texto
- ✅ Configuración de voz (rate, pitch, lang, voice)
- ✅ Validación de rangos
- ✅ Inicio/detención de reconocimiento de voz
- ✅ Síntesis de voz

### dom-analyzer.js
- ✅ Generación de selectores CSS únicos
- ✅ Extracción de texto visible
- ✅ Estructura del DOM
- ✅ Identificación de tipo de página
- ✅ Elementos interactivos
- ✅ Información de productos
- ✅ Contenido principal
- ✅ Información del sitio
- ✅ Caching de resultados

### llm-client.js
- ✅ Gestión de API key
- ✅ Validación de API key
- ✅ Configuración de backend URL
- ✅ Contexto de conversación
- ✅ Construcción de prompts
- ✅ Estimación de tokens
- ✅ Análisis de acciones

### action-engine.js
- ✅ Ejecución de acciones (click, scroll, fill, search, navigate)
- ✅ Validación de seguridad
- ✅ Búsqueda por texto
- ✅ Historial de acciones
- ✅ Acciones disponibles

### config.js
- ✅ Configuración por defecto
- ✅ Validación de posiciones
- ✅ Validación de temas
- ✅ Validación de tamaños
- ✅ Validación de colores
- ✅ Validación de dimensiones
- ✅ Validación de modelos LLM

### helpers.js
- ✅ Selectores de elementos
- ✅ Visibilidad de elementos
- ✅ Truncado de texto
- ✅ Eliminación de HTML
- ✅ Formateo de tiempo
- ✅ Validación de strings
- ✅ Generación de IDs
- ✅ Event listeners seguros
- ✅ Storage helpers
- ✅ Debounce y throttle

### security.js
- ✅ Validación de selectores seguros
- ✅ Validación de elementos seguros
- ✅ Validación de URLs seguras
- ✅ Validación de acciones
- ✅ Gestión de dominios permitidos

## 📝 Testing Manual

Además de los tests automáticos, puedes probar el widget manualmente usando la página de demo:

1. Abre el archivo `demo.html` en tu navegador
2. Haz clic en el botón flotante (abajo a la derecha)
3. Permite el acceso al micrófono
4. Prueba los comandos de voz listados en la página

### Comandos recomendados para testing manual:

| Categoría | Comando | Resultado Esperado |
|----------|---------|-------------------|
| **Navegación** | "Desplázate hacia arriba" | Scroll hacia arriba |
| | "Ve al final" | Scroll al final |
| | "Ve a Sección 1" | Scroll a sección 1 |
| **Interacción** | "Haz clic en Botón Principal" | Clic en el botón |
| | "Haz clic en Añadir al carrito" | Clic en el botón |
| **Formularios** | "Escribe Hola en Nombre" | Escribe en el input |
| | "Selecciona Opción 2" | Selecciona en el select |
| **Búsqueda** | "Busca widget de voz" | Escribe en input de búsqueda |
| **Preguntas** | "¿Qué dice el título?" | Respuesta con el título |
| | "¿Cuántos botones hay?" | Respuesta con el número |
| **Control** | "Minimiza el widget" | Minimiza el panel |

### Acciones bloqueadas (deben fallar):

| Comando | Resultado Esperado |
|---------|-------------------|
| "Haz clic en campo contraseña" | Error: Elemento no seguro |
| "Escribe 123 en el campo password" | Error: Campo de contraseña |
| "Navega a google.com" | Error: URL externa |

## 🔧 Configuración de Testing

### Variables de entorno para tests

Puedes configurar variables de entorno para tests específicos:

```bash
# Ejemplo: Testear con API key de prueba
VITE_TEST_API_KEY="sk-test123" npm test
```

### Mock de Web Speech API

Los tests usan mocks de la Web Speech API para evitar dependencias del navegador.

### Mock de fetch

Los tests que requieren llamadas a APIs usan mocks de `fetch` para evitar llamadas reales.

## ⚡ Tips para Testing

1. **Ejecuta tests frecuentemente**: Cada vez que hagas un cambio, ejecuta los tests relacionados
2. **Usa test:watch**: Para desarrollo activo, usa `npm run test:watch`
3. **Verifica la cobertura**: Ejecuta `npm run test:coverage` antes de hacer commit
4. **Tests aislados**: Cada test debe ser independiente de los demás
5. **Limpiar mocks**: Usa `vi.clearAllMocks()` en `beforeEach`

## 🛠 Solución de Problemas

### Error: "vitest is not defined"

Asegúrate de haber instalado Vitest:

```bash
npm install --save-dev vitest jsdom @vitest/browser @vitest/coverage-v8
```

### Error: "Cannot find module"

Verifica que las rutas de importación sean correctas. Usa rutas relativas o el alias `@/`.

### Error: "JSDOM is not defined"

Asegúrate de tener jsdom instalado:

```bash
npm install --save-dev jsdom
```

### Tests muy lentos

Reduce el timeout o usa mocks más simples:

```javascript
// En vite.config.js
test: {
  testTimeout: 5000, // Reducir timeout
  // ...
}
```

## 📚 Documentación Adicional

- [Vitest Documentation](https://vitest.dev/)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)
- [Testing Library](https://testing-library.com/)

## ✅ Checklist de Testing

- [ ] Todos los tests pasan (`npm test`)
- [ ] Cobertura de código > 80% (`npm run test:coverage`)
- [ ] Testing manual en Chrome, Firefox, Edge
- [ ] Testing manual en móvil (responsive)
- [ ] Testing con API key real
- [ ] Testing sin API key (modo backend)
