/**
 * @file routes/chat.js
 * @description Proxy a OpenAI Chat API para evitar CORS
 * @author agent-web
 */

import { OPENAI_API_KEY, OPENAI_ORGANIZATION, OPENAI_BASE_URL, MAX_TOKENS_PER_REQUEST } from '../config/index.js';
import { parseJsonBody } from '../middleware/auth.js';
import { logger } from '../middleware/auth.js';

/**
 * Handler para POST /api/chat - Proxy a OpenAI Chat API
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
export async function chatHandler(req, res) {
  try {
    // Solo permitir POST
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }));
      return;
    }
    
    // Parsear body
    const body = await parseJsonBody(req);
    
    // Validar body
    if (!body || !body.messages || !Array.isArray(body.messages)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Invalid request body: messages array required',
        code: 'INVALID_BODY'
      }));
      return;
    }
    
    // Validar que no exceda el limite de tokens
    const messages = body.messages || [];
    const estimatedTokens = messages.reduce((total, msg) => {
      // Estimacion aproximada: 4 caracteres = 1 token
      return total + Math.ceil((msg.content || '').length / 4);
    }, 0);
    
    if (estimatedTokens > MAX_TOKENS_PER_REQUEST) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: `Request exceeds maximum tokens: ${MAX_TOKENS_PER_REQUEST}`,
        code: 'TOKEN_LIMIT_EXCEEDED'
      }));
      return;
    }
    
    // Validar model
    const validModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'];
    if (body.model && !validModels.includes(body.model)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: `Invalid model. Allowed: ${validModels.join(', ')}`,
        code: 'INVALID_MODEL'
      }));
      return;
    }
    
    // Configurar request a OpenAI
    const openaiUrl = `${OPENAI_BASE_URL}/v1/chat/completions`;
    
    const openaiRequest = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...(OPENAI_ORGANIZATION && { 'OpenAI-Organization': OPENAI_ORGANIZATION })
      },
      body: JSON.stringify({
        model: body.model || 'gpt-3.5-turbo',
        messages: body.messages,
        max_tokens: body.max_tokens || 150,
        temperature: body.temperature || 0.7,
        top_p: body.top_p || 1,
        frequency_penalty: body.frequency_penalty || 0,
        presence_penalty: body.presence_penalty || 0,
        stream: body.stream || false
      })
    };
    
    logger.info(`Proxy request a OpenAI: model=${body.model || 'gpt-3.5-turbo'}, messages=${messages.length}`);
    
    // Hacer request a OpenAI
    const response = await fetch(openaiUrl, openaiRequest);
    
    // Manejar errores de OpenAI
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || errorData.message || 'Unknown OpenAI error';
      
      logger.error(`OpenAI error: ${response.status} - ${errorMessage}`);
      
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: errorMessage,
        code: 'OPENAI_ERROR',
        status: response.status
      }));
      return;
    }
    
    // Si es streaming, proxy el stream
    if (body.stream) {
      // Configurar headers para streaming
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
      
      res.end();
      return;
    }
    
    // Si no es streaming, devolver respuesta completa
    const data = await response.json();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    
  } catch (error) {
    logger.error(`Error en chat proxy: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: error.message,
      code: 'INTERNAL_ERROR'
    }));
  }
}

/**
 * Handler para POST /api/tokens - Generar tokens efimeros (para Realtime API)
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
export async function tokensHandler(req, res) {
  try {
    // Solo permitir POST
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }));
      return;
    }
    
    // Parsear body
    const body = await parseJsonBody(req);
    
    // Para tokens efimeros, necesitamos la API key del cliente
    // que sera usada para identificar al usuario en OpenAI
    const clientApiKey = req.headers['x-client-api-key'];
    
    if (!clientApiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Client API key required for token generation',
        code: 'NO_API_KEY'
      }));
      return;
    }
    
    // Generar token efimero usando la API de OpenAI
    // Nota: Esto requiere OpenAI Realtime API access
    const tokenResponse = await fetch(`${OPENAI_BASE_URL}/v1/realtime/client_secrets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...(OPENAI_ORGANIZATION && { 'OpenAI-Organization': OPENAI_ORGANIZATION })
      },
      body: JSON.stringify({
        session: {
          user_id: `client-${clientApiKey.substring(0, 8)}`,
          ...body
        }
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'Failed to generate token';
      
      logger.error(`Token generation error: ${tokenResponse.status} - ${errorMessage}`);
      
      res.writeHead(tokenResponse.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: errorMessage,
        code: 'TOKEN_GENERATION_FAILED'
      }));
      return;
    }
    
    const tokenData = await tokenResponse.json();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tokenData));
    
  } catch (error) {
    logger.error(`Error generando token: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: error.message,
      code: 'INTERNAL_ERROR'
    }));
  }
}
