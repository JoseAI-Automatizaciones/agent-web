/**
 * @file dom-analyzer.js
 * @description Analizador de DOM para el widget agent-web
 * Extrae y procesa informacion del DOM de la pagina host
 * @author agent-web
 */

import { 
  MAX_CONTEXT_TOKENS, 
  MAX_VISIBLE_TEXT_LENGTH,
  MAX_DEPTH 
} from '../utils/constants.js';
import { 
  isElementVisible,
  truncateText, 
  stripHtml 
} from '../utils/helpers.js';

// Cache para resultados de analisis DOM
const analysisCache = {
  visibleText: null,
  visibleTextTimestamp: 0,
  visibleTextMaxLength: 0,
  pageStructure: null,
  pageStructureTimestamp: 0,
  pageStructureMaxDepth: 0,
  interactiveElements: null,
  interactiveElementsTimestamp: 0,
  pageType: null,
  pageTypeTimestamp: 0,
  fullContext: null,
  fullContextTimestamp: 0
};

// Tiempos de expiracion del cache (en milisegundos)
const CACHE_EXPIRY = {
  visibleText: 5000,      // 5 segundos
  pageStructure: 10000,   // 10 segundos
  interactiveElements: 5000, // 5 segundos
  pageType: 30000,       // 30 segundos
  fullContext: 5000       // 5 segundos
};

/**
 * Limpia el cache
 * @private
 */
function clearCache() {
  analysisCache.visibleText = null;
  analysisCache.visibleTextTimestamp = 0;
  analysisCache.visibleTextMaxLength = 0;
  analysisCache.pageStructure = null;
  analysisCache.pageStructureTimestamp = 0;
  analysisCache.pageStructureMaxDepth = 0;
  analysisCache.interactiveElements = null;
  analysisCache.interactiveElementsTimestamp = 0;
  analysisCache.pageType = null;
  analysisCache.pageTypeTimestamp = 0;
  analysisCache.fullContext = null;
  analysisCache.fullContextTimestamp = 0;
}

/**
 * Verifica si el cache es valido
 * @private
 * @param {string} key - Clave del cache
 * @param {number} param - Parametro para validar (ej: maxLength, maxDepth)
 * @returns {boolean}
 */
function isCacheValid(key, param = null) {
  const cacheEntry = analysisCache[key];
  if (!cacheEntry) return false;
  
  const expiry = CACHE_EXPIRY[key];
  if (!expiry) return false;
  
  const now = Date.now();
  if (now - analysisCache[`${key}Timestamp`] > expiry) {
    return false;
  }
  
  // Para funciones con parametros, verificar si el parametro coincide
  if (param !== null) {
    const paramKey = `${key}Param`;
    if (analysisCache[paramKey] !== param) {
      return false;
    }
  }
  
  return true;
}

/**
 * Extrae todo el texto visible de la pagina
 * @param {number=} maxLength - Longitud maxima del texto (default: MAX_VISIBLE_TEXT_LENGTH)
 * @returns {string} - Texto visible de la pagina
 */
export function extractVisibleText(maxLength = MAX_VISIBLE_TEXT_LENGTH) {
  try {
    // Verificar cache
    if (isCacheValid('visibleText', maxLength)) {
      return analysisCache.visibleText;
    }
    
    // Obtener el body
    const body = document.body;
    if (!body) return '';
    
    // Crear un TreeWalker para recorrer solo elementos visibles
    const treeWalker = document.createTreeWalker(
      body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Aceptar nodos de texto que no esten vacios
          if (node.nodeValue && node.nodeValue.trim()) {
            // Verificar si el padre es visible
            const parent = node.parentNode;
            if (parent && parent instanceof HTMLElement && isElementVisible(parent)) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );
    
    let text = '';
    let currentNode;
    
    while ((currentNode = treeWalker.nextNode())) {
      const trimmedText = currentNode.nodeValue.trim();
      if (trimmedText) {
        text += trimmedText + ' ';
        
        // Limitar longitud
        if (text.length > maxLength) {
          text = truncateText(text, maxLength);
          break;
        }
      }
    }
    
    const result = text.trim();
    
    // Guardar en cache
    analysisCache.visibleText = result;
    analysisCache.visibleTextTimestamp = Date.now();
    analysisCache.visibleTextMaxLength = maxLength;
    
    return result;
  } catch (e) {
    console.error('Error extracting visible text:', e);
    return '';
  }
}

/**
 * Obtiene la estructura jerarquica del DOM
 * @param {number=} maxDepth - Profundidad maxima (default: MAX_DEPTH)
 * @returns {Object} - Estructura del DOM
 */
export function getPageStructure(maxDepth = MAX_DEPTH) {
  try {
    // Verificar cache
    if (isCacheValid('pageStructure', maxDepth)) {
      return analysisCache.pageStructure;
    }
    
    const body = document.body;
    if (!body) return { tag: 'body', children: [] };
    
    const result = buildStructureTree(body, 0, maxDepth);
    
    // Guardar en cache
    analysisCache.pageStructure = result;
    analysisCache.pageStructureTimestamp = Date.now();
    analysisCache.pageStructureMaxDepth = maxDepth;
    
    return result;
  } catch (e) {
    console.error('Error getting page structure:', e);
    return { tag: 'body', children: [] };
  }
}

/**
 * Construye el arbol de estructura del DOM
 * @private
 * @param {HTMLElement} element - Elemento actual
 * @param {number} currentDepth - Profundidad actual
 * @param {number} maxDepth - Profundidad maxima
 * @returns {Object} - Nodo del arbol de estructura
 */
function buildStructureTree(element, currentDepth, maxDepth) {
  if (currentDepth > maxDepth) {
    return null;
  }
  
  const node = {
    tag: element.tagName.toLowerCase(),
    id: element.id || undefined,
    classes: element.className ? element.className.split(' ') : [],
    text: stripHtml(element.textContent).trim().substring(0, 200) || undefined,
    attributes: {},
    children: []
  };
  
  // Añadir atributos importantes
  const importantAttrs = ['href', 'src', 'title', 'alt', 'aria-label', 'role', 'type', 'name'];
  for (const attr of importantAttrs) {
    if (element.hasAttribute(attr)) {
      node.attributes[attr] = element.getAttribute(attr);
    }
  }
  
  // Recorrer hijos
  for (const child of element.children) {
    if (child instanceof HTMLElement) {
      const childNode = buildStructureTree(child, currentDepth + 1, maxDepth);
      if (childNode) {
        node.children.push(childNode);
      }
    }
  }
  
  return node;
}

/**
 * Identifica el tipo de pagina
 * @returns {string} - Tipo de pagina identificado
 */
export function identifyPageType() {
  try {
    // Verificar cache
    if (isCacheValid('pageType')) {
      return analysisCache.pageType;
    }
    
    const bodyText = document.body ? document.body.textContent.toLowerCase() : '';
    const headTitle = document.title ? document.title.toLowerCase() : '';
    const combinedText = bodyText + ' ' + headTitle;
    
    // Patrones para identificar tipos de pagina
    const patterns = [
      { type: 'e-commerce', keywords: ['comprar', 'carrito', 'añadir al carrito', 'precio', 'producto', 'tienda', 'shop', 'add to cart', 'price', 'product'] },
      { type: 'blog', keywords: ['articulo', 'publicacion', 'post', 'blog', 'categoria', 'autor', 'fecha', 'article', 'posted'] },
      { type: 'news', keywords: ['noticia', 'noticias', 'actualidad', 'news', 'periodico', 'diario', 'reportaje'] },
      { type: 'forum', keywords: ['foro', 'hilo', 'respuesta', 'comentario', 'discusion', 'forum', 'thread', 'reply'] },
      { type: 'documentation', keywords: ['documentacion', 'api', 'guia', 'manual', 'tutorial', 'docs', 'documentation'] },
      { type: 'social-media', keywords: ['perfil', 'publicar', 'me gusta', 'compartir', 'seguir', 'feed', 'profile', 'post', 'like', 'share'] },
      { type: 'dashboard', keywords: ['dashboard', 'panel', 'estadisticas', 'analitica', 'metricas', 'charts'] },
      { type: 'form', keywords: ['formulario', 'enviar', 'registrarse', 'iniciar sesion', 'contacto', 'form', 'submit', 'register', 'login'] },
      { type: 'landing-page', keywords: ['bienvenido', 'empezar', 'registrate', 'descubrir', 'welcome', 'get started', 'sign up'] },
      { type: 'search', keywords: ['buscar', 'resultados', 'no se encontraron resultados', 'search', 'results', 'no results'] },
      { type: 'about', keywords: ['sobre nosotros', 'nosotros', 'equipo', 'mision', 'about us', 'team', 'mission'] },
      { type: 'contact', keywords: ['contacto', 'contactanos', 'email', 'telefono', 'direccion', 'contact us', 'email', 'phone'] }
    ];
    
    for (const pattern of patterns) {
      for (const keyword of pattern.keywords) {
        if (combinedText.includes(keyword)) {
          const result = pattern.type;
          // Guardar en cache
          analysisCache.pageType = result;
          analysisCache.pageTypeTimestamp = Date.now();
          return result;
        }
      }
    }
    
    // Verificar por elementos estructurales
    const hasProductElements = document.querySelectorAll('.product, .item, .card').length > 0;
    const hasArticleElements = document.querySelectorAll('article, .post, .article').length > 0;
    const hasFormElements = document.querySelectorAll('form').length > 0;
    
    let result = 'general';
    if (hasProductElements) result = 'e-commerce';
    else if (hasArticleElements) result = 'blog';
    else if (hasFormElements) result = 'form';
    
    // Guardar en cache
    analysisCache.pageType = result;
    analysisCache.pageTypeTimestamp = Date.now();
    
    return result;
  } catch (e) {
    console.error('Error identifying page type:', e);
    return 'general';
  }
}

/**
 * Crea un resumen inteligente del contenido de la pagina para el prompt del LLM
 * @param {number=} maxTokens - Tokens maximos para el contexto (default: MAX_CONTEXT_TOKENS)
 * @returns {string} - Resumen del contexto
 */
export function createContextSummary(maxTokens = MAX_CONTEXT_TOKENS) {
  try {
    const pageType = identifyPageType();
    const title = document.title || 'Pagina sin titulo';
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    // Extraer texto principal
    let mainText = '';
    
    // Intentar obtener el contenido principal
    const mainContentSelectors = [
      'main',
      'article',
      '.main-content',
      '.content',
      '.container',
      '#content',
      '#main'
    ];
    
    for (const selector of mainContentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        mainText = stripHtml(element.textContent).trim();
        break;
      }
    }
    
    // Si no se encontro contenido principal, usar todo el texto visible
    if (!mainText) {
      mainText = extractVisibleText(MAX_VISIBLE_TEXT_LENGTH);
    }
    
    // Limitar texto
    const textLimit = Math.min(MAX_VISIBLE_TEXT_LENGTH, maxTokens * 4); // ~4 caracteres por token
    mainText = truncateText(mainText, textLimit);
    
    // Crear resumen
    let summary = `Eres un asistente de voz util. Tu trabajo es ayudar al usuario con esta pagina web.\n\n`;
    
    summary += `Tipo de pagina: ${pageType}\n`;
    summary += `Titulo: ${title}\n`;
    
    if (description) {
      summary += `Descripcion: ${description}\n`;
    }
    
    summary += `Contenido principal:\n${mainText}\n`;
    
    // Añadir informacion estructural importante
    if (pageType === 'e-commerce') {
      summary += `Informacion adicional: Esta es una pagina de e-commerce. Busca productos, precios, botones de comprar, etc.\n`;
    }
    
    if (pageType === 'blog') {
      summary += `Informacion adicional: Esta es una pagina de blog. Busca articulos, autores, fechas, etc.\n`;
    }
    
    if (pageType === 'form') {
      summary += `Informacion adicional: Esta es una pagina con formularios. Ayuda al usuario a llenar campos (solo si son seguros), pero NUNCA envies formularios con datos sensibles.\n`;
    }
    
    // Asegurar que el summary no exceda los tokens
    // Estimar tokens (aproximadamente 4 caracteres por token)
    const estimatedTokens = Math.ceil(summary.length / 4);
    if (estimatedTokens > maxTokens) {
      summary = truncateText(summary, maxTokens * 4);
    }
    
    return summary;
  } catch (e) {
    console.error('Error creating context summary:', e);
    return 'Eres un asistente de voz util en esta pagina web.';
  }
}

/**
 * Obtiene todos los elementos interactivos de la pagina
 * @returns {Array<Object>} - Array de elementos interactivos
 */
export function getInteractiveElements() {
  try {
    // Verificar cache
    if (isCacheValid('interactiveElements')) {
      return analysisCache.interactiveElements;
    }
    
    const interactiveSelectors = [
      'button',
      'a[href]',
      'input:not([type="hidden"])',
      'textarea',
      'select',
      '[role="button"]',
      '[role="link"]',
      '[onclick]',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    const elements = [];
    
    for (const selector of interactiveSelectors) {
      const foundElements = document.querySelectorAll(selector);
      for (const element of foundElements) {
        if (element instanceof HTMLElement && isElementVisible(element)) {
          elements.push({
            tag: element.tagName.toLowerCase(),
            type: element.type || undefined,
            text: stripHtml(element.textContent).trim().substring(0, 100) || element.value || '',
            selector: getElementSelector(element),
            id: element.id || undefined,
            classes: element.className ? element.className.split(' ') : [],
            href: element.href || undefined,
            ariaLabel: element.getAttribute('aria-label') || undefined,
            role: element.getAttribute('role') || undefined
          });
        }
      }
    }
    
    // Guardar en cache
    analysisCache.interactiveElements = elements;
    analysisCache.interactiveElementsTimestamp = Date.now();
    
    return elements;
  } catch (e) {
    console.error('Error getting interactive elements:', e);
    return [];
  }
}

/**
 * Genera un selector CSS unico para un elemento
 * Usa ID, clases, tag + jerarquia con nth-child para garantizar unicidad
 * @private
 * @param {HTMLElement} element - Elemento del DOM
 * @returns {string} - Selector CSS unico
 */
function getElementSelector(element) {
  try {
    // Si tiene ID, usar ID (garantiza unicidad)
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }
    
    // Construir path completo con nth-child para garantizar unicidad
    const path = [];
    let current = element;
    
    while (current && current !== document.body && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();
      
      // Añadir ID si existe
      if (current.id) {
        selector = `#${CSS.escape(current.id)}`;
        path.unshift(selector);
        break; // Un ID es suficiente para garantizar unicidad
      }
      
      // Añadir clases si existen
      if (current.className && current.className.trim()) {
        const classes = current.className.split('\s+').filter(c => c.trim());
        if (classes.length > 0) {
          selector = `.${classes.map(c => CSS.escape(c)).join('.')}`;
        }
      }
      
      // Añadir nth-child para garantizar unicidad
      const parent = current.parentNode;
      if (parent && parent.children && parent.children.length > 1) {
        // Contar elementos hermanos con la misma tag
        const sameTagSiblings = Array.from(parent.children).filter(
          child => child.tagName === current.tagName
        );
        
        if (sameTagSiblings.length > 1) {
          // Obtener el indice entre hermanos con la misma tag
          const index = Array.from(parent.children).filter(
            child => child.tagName === current.tagName
          ).indexOf(current) + 1;
          
          selector += `:nth-of-type(${index})`;
        }
      }
      
      path.unshift(selector);
      current = parent;
    }
    
    // Añadir el body al inicio si llegamos hasta el
    if (current === document.body || current === document.documentElement) {
      path.unshift('body');
    }
    
    // Unir con > para mayor especificidad
    return path.join(' > ');
  } catch (e) {
    console.error('Error generating element selector:', e);
    // Fallback: usar tag + indice
    if (element.tagName) {
      return `${element.tagName.toLowerCase()}:nth-of-type(${Array.from(element.parentNode?.children || []).indexOf(element) + 1})`;
    }
    return '*';
  }
}

/**
 * Obtiene informacion especificamente para e-commerce
 * @returns {Object} - Informacion de productos
 */
export function extractProductInfo() {
  try {
    const products = [];
    const productSelectors = [
      '.product',
      '.item',
      '.card',
      '[data-product]',
      '[itemprop="item"]'
    ];
    
    for (const selector of productSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element instanceof HTMLElement && isElementVisible(element)) {
          const product = {
            name: getProductName(element),
            price: getProductPrice(element),
            description: getProductDescription(element),
            image: getProductImage(element),
            url: getProductUrl(element),
            selector: getElementSelector(element)
          };
          
          if (product.name) {
            products.push(product);
          }
        }
      }
    }
    
    return { products, count: products.length };
  } catch (e) {
    console.error('Error extracting product info:', e);
    return { products: [], count: 0 };
  }
}

/**
 * Obtiene el nombre de un producto
 * @private
 * @param {HTMLElement} element - Elemento del producto
 * @returns {string} - Nombre del producto
 */
function getProductName(element) {
  const nameSelectors = [
    '.name',
    '.title',
    'h1',
    'h2',
    'h3',
    '[itemprop="name"]',
    '[data-name]',
    '.product-name',
    '.item-name'
  ];
  
  for (const selector of nameSelectors) {
    const nameElement = element.querySelector(selector);
    if (nameElement) {
      return stripHtml(nameElement.textContent).trim();
    }
  }
  
  return stripHtml(element.textContent).trim().substring(0, 100);
}

/**
 * Obtiene el precio de un producto
 * @private
 * @param {HTMLElement} element - Elemento del producto
 * @returns {string} - Precio del producto
 */
function getProductPrice(element) {
  const priceSelectors = [
    '.price',
    '.amount',
    '[itemprop="price"]',
    '[data-price]',
    '.product-price',
    '.item-price'
  ];
  
  for (const selector of priceSelectors) {
    const priceElement = element.querySelector(selector);
    if (priceElement) {
      return stripHtml(priceElement.textContent).trim();
    }
  }
  
  return '';
}

/**
 * Obtiene la descripcion de un producto
 * @private
 * @param {HTMLElement} element - Elemento del producto
 * @returns {string} - Descripcion del producto
 */
function getProductDescription(element) {
  const descSelectors = [
    '.description',
    '.desc',
    '[itemprop="description"]',
    '[data-description]',
    '.product-description',
    '.item-description',
    'p'
  ];
  
  for (const selector of descSelectors) {
    const descElement = element.querySelector(selector);
    if (descElement) {
      return stripHtml(descElement.textContent).trim().substring(0, 200);
    }
  }
  
  return '';
}

/**
 * Obtiene la imagen de un producto
 * @private
 * @param {HTMLElement} element - Elemento del producto
 * @returns {string} - URL de la imagen
 */
function getProductImage(element) {
  const imgSelectors = [
    'img',
    '.image',
    '.thumbnail',
    '[itemprop="image"]',
    '[data-image]',
    '.product-image',
    '.item-image'
  ];
  
  for (const selector of imgSelectors) {
    const imgElement = element.querySelector(selector);
    if (imgElement && imgElement instanceof HTMLImageElement) {
      return imgElement.src || imgElement.getAttribute('src') || '';
    }
  }
  
  return '';
}

/**
 * Obtiene la URL de un producto
 * @private
 * @param {HTMLElement} element - Elemento del producto
 * @returns {string} - URL del producto
 */
function getProductUrl(element) {
  const linkSelectors = [
    'a[href]',
    '[itemprop="url"]',
    '[data-url]',
    '.product-link',
    '.item-link'
  ];
  
  for (const selector of linkSelectors) {
    const linkElement = element.querySelector(selector);
    if (linkElement && linkElement instanceof HTMLAnchorElement) {
      return linkElement.href;
    }
  }
  
  return '';
}

/**
 * Obtiene el contenido principal de la pagina
 * @returns {string} - Contenido principal
 */
export function getMainContent() {
  try {
    const mainSelectors = [
      'main',
      'article',
      '.main-content',
      '.content',
      '.container',
      '#content',
      '#main'
    ];
    
    for (const selector of mainSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return stripHtml(element.textContent).trim();
      }
    }
    
    // Si no se encuentra contenido principal, usar body
    return document.body ? stripHtml(document.body.textContent).trim() : '';
  } catch (e) {
    console.error('Error getting main content:', e);
    return '';
  }
}

/**
 * Obtiene informacion del sitito web
 * @returns {Object} - Informacion del sitio
 */
export function getSiteInfo() {
  try {
    return {
      title: document.title || '',
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      language: document.documentElement.lang || 'es',
      url: window.location.href,
      hostname: window.location.hostname,
      path: window.location.pathname
    };
  } catch (e) {
    console.error('Error getting site info:', e);
    return {
      title: '',
      description: '',
      language: 'es',
      url: '',
      hostname: '',
      path: ''
    };
  }
}

/**
 * Obtiene el contexto completo de la pagina
 * @returns {Object} - Contexto completo
 */
export function getFullContext() {
  try {
    // Verificar cache
    if (isCacheValid('fullContext')) {
      return analysisCache.fullContext;
    }
    
    const result = {
      siteInfo: getSiteInfo(),
      pageType: identifyPageType(),
      mainContent: getMainContent(),
      visibleText: extractVisibleText(),
      structure: getPageStructure(),
      interactiveElements: getInteractiveElements(),
      products: extractProductInfo().products
    };
    
    // Guardar en cache
    analysisCache.fullContext = result;
    analysisCache.fullContextTimestamp = Date.now();
    
    return result;
  } catch (e) {
    console.error('Error getting full context:', e);
    return {
      siteInfo: getSiteInfo(),
      pageType: 'general',
      mainContent: '',
      visibleText: '',
      structure: { tag: 'body', children: [] },
      interactiveElements: [],
      products: []
    };
  }
}

/**
 * Limpia el cache de analisis DOM
 * @returns {void}
 */
export function clearAnalysisCache() {
  clearCache();
}

/**
 * Genera un selector XPath para un elemento (alternativa a CSS selector)
 * @private
 * @param {HTMLElement} element - Elemento del DOM
 * @returns {string} - XPath del elemento
 */
function getXPath(element) {
  try {
    if (!element || !element.ownerDocument) return '';
    
    const pathSegments = [];
    let current = element;
    
    while (current && current !== document.documentElement) {
      let index = 1;
      let sibling = current.previousSibling;
      
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }
      
      pathSegments.unshift(`${current.tagName.toLowerCase()}[${index}]`);
      current = current.parentNode;
    }
    
    return `/${pathSegments.join('/')}`;
  } catch (e) {
    console.error('Error generating XPath:', e);
    return '';
  }
}

/**
 * Encuentra elementos por texto visible
 * @param {string} text - Texto a buscar
 * @param {string=} tag - Tag HTML opcional para filtrar
 * @returns {Array<HTMLElement>} - Array de elementos que contienen el texto
 */
export function findElementByText(text, tag = null) {
  if (!text || typeof text !== 'string') return [];
  
  try {
    const selector = tag ? `${tag}:contains("${CSS.escape(text)}")` : `:contains("${CSS.escape(text)}")`;
    const elements = Array.from(document.querySelectorAll(selector));
    
    // Filtrar elementos visibles
    return elements.filter(el => isElementVisible(el));
  } catch (e) {
    console.error(`Error finding elements by text: ${text}`, e);
    return [];
  }
}

// Asegurar que CSS.escape este disponible (polyfill para navegadores antiguos)
if (typeof CSS === 'undefined' || !CSS.escape) {
  CSS = CSS || {};
  CSS.escape = function(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
}
