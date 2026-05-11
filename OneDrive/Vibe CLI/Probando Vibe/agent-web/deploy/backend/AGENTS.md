# 🖥️ /backend - AGENTS.md

## 📌 Descripción

El directorio **`/backend`** contiene el **servidor opcional** para el widget **agent-web**.

Este backend **NO es obligatorio** para el funcionamiento básico del widget (que es client-side puro), pero proporciona:
- **Generación de tokens efímeros** para OpenAI API (mejor seguridad)
- **Proxy para evitar problemas de CORS**
- **Log de uso** para monitoreo
- **Control de rate limiting** por cliente
- **Autenticación** centralizada

## 🏗️ Arquitectura

```
/backend/
├── AGENTS.md              # 📄 Este archivo
├── server.js              # 🖥️  Servidor principal
├── routes/                # 🛣️  Rutas API
│   └── tokens.js          # Generación de tokens
├── middleware/            # 🔧 Middlewares
│   └── auth.js            # Autenticación
├── config/                # ⚙️  Configuración
│   └── index.js           # Configuración centralizada
└── package.json           # Dependencias
```

### Flujo de Datos:
```
Pagina Web (con widget)
    ↓
  Fetch a /api/tokens
    ↓
┌─────────────────────┐
│   backend/server.js  │
└─────────┬───────────┘
          ↓
┌─────────────────────┐
│  routes/tokens.js    │ ← Genera token efímero
└─────────┬───────────┘
          ↓
    OpenAI API
    (con API key del servidor)
    ↓
  Token efímero
    ↓
  Widget (client-side)
```

## ✅ Responsabilidades

- [ ] **Generar tokens efímeros** para OpenAI API
- [ ] **Proxear peticiones** a OpenAI para evitar CORS
- [ ] **Autenticar clientes** (opcional)
- [ ] **Limitar tasa de peticiones** (rate limiting)
- [ ] **Loguear uso** para monitoreo
- [ ] **Ser opcional** (el widget funciona sin backend)

## 🤖 Notas CRÍTICAS para Agentes IA

> ⚠️ **CONTEXTO ESPECIAL PARA MODELOS DE IA**:
>
> 1. **Este backend es OPCIONAL**:
>    - El widget **funciona sin backend** (client-side puro)
>    - Este backend **mejora la seguridad** y proporciona funcionalidades adicionales
>    - **NO bloquear** el funcionamiento del widget si el backend no está disponible

> 2. **Seguridad es crítica**:
>    - **NUNCA** exponer la API key de OpenAI en el código
>    - Usar **variables de entorno** para secretos
>    - Validar **todos los inputs** de los clientes
>    - Implementar **rate limiting** para prevenir abusos

> 3. **Rendimiento**:
>    - Los tokens efímeros tienen **tiempo de vida limitado** (usar cache)
>    - Las peticiones a OpenAI pueden ser **lentas** (usar timeouts)
>    - Considerar **colas** para peticiones concurrentes

> 4. **Compatibilidad**:
>    - El backend debe funcionar con **Node.js 18+**
>    - Usar **ES Modules** (no CommonJS)
>    - Soporte para **CORS** (permitir múltiples orígenes)

## 📦 Detalle de Cada Archivo

---

### 1. **server.js**

**Propósito**: Servidor principal que maneja peticiones del widget.

**Contenido típico**:
```javascript
import http from 'node:http';
import { createTokenHandler } from './routes/tokens.js';
import { applyMiddleware } from './middleware/auth.js';

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/api/tokens') {
    createTokenHandler(req, res);
    return;
  }
  
  // Proxy a OpenAI (opcional)
  if (req.method === 'POST' && req.url.startsWith('/api/openai')) {
    proxyToOpenAI(req, res);
    return;
  }
  
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
```

**Responsabilidades**:
- [ ] Crear servidor HTTP
- [ ] Configurar **headers CORS**
- [ ] Enrutar peticiones a los handlers apropiados
- [ ] Manejar errores globales
- [ ] Configurar **rate limiting**

**Dependencias**:
- `node:http` (nativo)
- `routes/tokens.js`
- `middleware/`

**Notas para IA**:
> - Usar **ES Modules** (`import/export`)
> - **NO usar** `express` para mantener el bundle ligero
> - Manejar **CORS** correctamente
> - Validar **Content-Type** de las peticiones

---

### 2. **routes/tokens.js**

**Propósito**: Generar **tokens efímeros** para OpenAI API.

**Contenido típico**:
```javascript
import { OPENAI_API_KEY } from '../config/index.js';

// Cache de tokens (para evitar generar uno nuevo cada vez)
const tokenCache = new Map();

/**
 * Genera un token efímero para OpenAI Realtime API
 * @param {Object} sessionConfig - Configuración de la sesión
 * @returns {Promise<Object>} - Token generado
 */
async function generateEphemeralToken(sessionConfig) {
  const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ session: sessionConfig })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate token');
  }
  
  return response.json();
}

/**
 * Handler para /api/tokens
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
export async function createTokenHandler(req, res) {
  try {
    // Validar API key del cliente (opcional)
    const clientApiKey = req.headers['x-client-api-key'];
    
    if (!clientApiKey) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Client API key required' }));
      return;
    }
    
    // Validar que el cliente tiene permiso
    if (!isValidClient(clientApiKey)) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Invalid client API key' }));
      return;
    }
    
    // Leer body de la petición
    const body = await readBody(req);
    const sessionConfig = body;
    
    // Validar configuración de la sesión
    if (!isValidSessionConfig(sessionConfig)) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Invalid session configuration' }));
      return;
    }
    
    // Generar token (usar cache si existe)
    const cacheKey = JSON.stringify(sessionConfig);
    let token = tokenCache.get(cacheKey);
    
    if (!token) {
      token = await generateEphemeralToken(sessionConfig);
      tokenCache.set(cacheKey, token);
      
      // Eliminar del cache después de 5 minutos
      setTimeout(() => tokenCache.delete(cacheKey), 5 * 60 * 1000);
    }
    
    res.writeHead(200);
    res.end(JSON.stringify(token));
  } catch (error) {
    console.error('Error generating token:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  }
}

/**
 * Lee el body de una petición
 * @param {http.IncomingMessage} req
 * @returns {Promise<Object>}
 */
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}

/**
 * Valida la configuración de la sesión
 * @param {Object} config
 * @returns {boolean}
 */
function isValidSessionConfig(config) {
  // Validaciones básicas
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  // Validar campos requeridos
  if (!config.model) {
    return false;
  }
  
  // Validar modelo
  const validModels = ['gpt-realtime-2', 'gpt-realtime', 'gpt-3.5-turbo'];
  if (!validModels.includes(config.model)) {
    return false;
  }
  
  return true;
}
```

**Responsabilidades**:
- [ ] Generar tokens efímeros para OpenAI API
- [ ] Validar configuración de sesiones
- [ ] Implementar **cache de tokens**
- [ ] Manejar errores de generación de tokens

**Dependencias**:
- `node:http`
- `config/index.js` (para OPENAI_API_KEY)

**Notas para IA**:
> - Los tokens efímeros **expiran** después de cierto tiempo
> - Usar **cache** para evitar generar tokens repetidamente
> - Validar **todos los inputs** antes de usarlos
> - Manejar **rate limiting** de OpenAI

---

### 3. **middleware/auth.js**

**Propósito**: Middleware para **autenticación de clientes**.

**Contenido típico**:
```javascript
// Clientes autorizados (en producción, usar base de datos)
const VALID_CLIENTS = new Set([
  'client-1-key',
  'client-2-key'
]);

/**
 * Valida si un cliente está autorizado
 * @param {string} clientKey - API key del cliente
 * @returns {boolean}
 */
export function isValidClient(clientKey) {
  return VALID_CLIENTS.has(clientKey);
}

/**
 * Añade un cliente autorizado
 * @param {string} clientKey - API key del cliente
 * @returns {void}
 */
export function addValidClient(clientKey) {
  VALID_CLIENTS.add(clientKey);
}

/**
 * Elimina un cliente autorizado
 * @param {string} clientKey - API key del cliente
 * @returns {void}
 */
export function removeValidClient(clientKey) {
  VALID_CLIENTS.delete(clientKey);
}

/**
 * Middleware de autenticación
 * @param {Function} handler - Handler a proteger
 * @returns {Function} - Handler con autenticación
 */
export function withAuth(handler) {
  return async (req, res) => {
    const clientKey = req.headers['x-client-api-key'];
    
    if (!clientKey) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Client API key required' }));
      return;
    }
    
    if (!isValidClient(clientKey)) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Invalid client API key' }));
      return;
    }
    
    // Añadir cliente al request para uso posterior
    req.clientKey = clientKey;
    
    // Llamar al handler original
    await handler(req, res);
  };
}
```

**Responsabilidades**:
- [ ] Validar **API keys de clientes**
- [ ] Implementar **autenticación básica**
- [ ] Proporcionar **middlewares reutilizables**
- [ ] Manejar **permiso por cliente**

**Notas para IA**:
> - En producción, usar **base de datos** en lugar de Set
> - Implementar **rate limiting por cliente**
> - Considerar **JWT** para autenticación más avanzada

---

### 4. **config/index.js**

**Propósito**: Centralizar **toda la configuración** del backend.

**Contenido típico**:
```javascript
// Configuración del servidor
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuración de OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION;

// Configuración de seguridad
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || '60'); // 60 requests/min
const MAX_TOKENS_PER_CLIENT = parseInt(process.env.MAX_TOKENS || '1000');

// Configuración de logging
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Validación
if (!OPENAI_API_KEY) {
  console.warn('⚠️  Warning: OPENAI_API_KEY not set. Backend will not work without it.');
}

export {
  PORT,
  NODE_ENV,
  OPENAI_API_KEY,
  OPENAI_ORGANIZATION,
  RATE_LIMIT,
  MAX_TOKENS_PER_CLIENT,
  LOG_LEVEL
};
```

**Responsabilidades**:
- [ ] Centralizar **toda la configuración**
- [ ] Leer de **variables de entorno**
- [ ] Proporcionar **valores por defecto**
- [ ] Validar **configuración crítica**

**Dependencias**: Ninguna (solo `process.env`)

**Notas para IA**:
> - **NUNCA** hardcodear secretos en el código
> - Usar **variables de entorno** para todo lo sensible
> - Validar **configuración requerida** al iniciar

---

## 🔗 Relación con Otros Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    /backend/ (Servidor)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐                                          │
│  │      server.js       │ ← Punto de entrada                        │
│  └──────────┬───────────┘                                          │
│             │                                                         │
│     ┌───────▼───────┐                                              │
│     │   routes/     │ ← Rutas API                                │
│     │  tokens.js    │   - Genera tokens efímeros                 │
│     └───────┬───────┘                                              │
│             │                                                         │
│     ┌───────▼───────┐                                              │
│     │  middleware/  │ ← Middlewares                              │
│     │   auth.js     │   - Autenticación de clientes              │
│     └───────┬───────┘                                              │
│             │                                                         │
│     ┌───────▼───────┐                                              │
│     │   config/     │ ← Configuración                            │
│     │   index.js    │   - Variables de entorno                  │
│     └───────────────┘                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌───────────────────┐
                    │  Widget (client)  │
                    │  (fetch a /api)   │
                    └───────────────────┘
```

---

## 🚨 Advertencias Específicas

1. **En server.js**:
   - Usar **ES Modules** (`import/export`)
   - **NO usar** frameworks pesados como Express
   - Manejar **CORS** correctamente
   - Validar **todos los inputs**

2. **En routes/tokens.js**:
   - **NUNCA** exponer la API key de OpenAI
   - Usar **cache** para tokens
   - Validar **configuración de sesiones**

3. **En middleware/auth.js**:
   - En producción, usar **base de datos**
   - Implementar **rate limiting por cliente**
   - Considerar **JWT** para mayor seguridad

4. **En config/index.js**:
   - **NUNCA** hardcodear secretos
   - Validar **configuración requerida**
   - Usar **valores por defecto sensatos**

---

## 📋 Checklist para Produccion

Antes de desplegar el backend en producción:

- [ ] ¿La API key de OpenAI está en **variables de entorno**?
- [ ] ¿Se implementó **rate limiting**?
- [ ] ¿Se configuró **CORS** correctamente?
- [ ] ¿Se validan **todos los inputs**?
- [ ] ¿Hay **logging** adecuado?
- [ ] ¿Se implementó **autenticación de clientes**?
- [ ] ¿Se configuró **HTTPS**?
- [ ] ¿Hay **monitoreo** de uso?

---

**📝 Nota final para agentes IA**:
> - Este backend es **OPCIONAL**
> - El widget funciona **sin backend** (client-side puro)
> - Este backend **mejora la seguridad** y proporciona funcionalidades adicionales
> - Para entender el **widget**, ve a `/src/` y sus archivos `AGENTS.md`
> - Para ver la **estructura**, ve a `ARCHIVES.md`
