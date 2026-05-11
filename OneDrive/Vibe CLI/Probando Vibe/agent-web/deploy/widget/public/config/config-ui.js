/**
 * @file config-ui.js
 * @description Logica de la interfaz de configuracion del widget agent-web
 * @author agent-web
 */

// ===== DOM Elements =====
const elements = {
    // Form inputs
    apiKey: document.getElementById('apiKey'),
    backendUrl: document.getElementById('backendUrl'),
    model: document.getElementById('model'),
    widgetPosition: document.getElementById('widgetPosition'),
    language: document.getElementById('language'),
    primaryColor: document.getElementById('primaryColor'),
    primaryColorText: document.getElementById('primaryColorText'),
    secondaryColor: document.getElementById('secondaryColor'),
    secondaryColorText: document.getElementById('secondaryColorText'),
    textColor: document.getElementById('textColor'),
    textColorText: document.getElementById('textColorText'),
    width: document.getElementById('width'),
    maxHeight: document.getElementById('maxHeight'),
    voiceLang: document.getElementById('voiceLang'),
    voiceRate: document.getElementById('voiceRate'),
    voiceRateValue: document.getElementById('voiceRateValue'),
    voicePitch: document.getElementById('voicePitch'),
    voicePitchValue: document.getElementById('voicePitchValue'),
    autoListenOnOpen: document.getElementById('autoListenOnOpen'),
    maxTokens: document.getElementById('maxTokens'),
    temperature: document.getElementById('temperature'),
    temperatureValue: document.getElementById('temperatureValue'),
    systemPrompt: document.getElementById('systemPrompt'),
    autoOpen: document.getElementById('autoOpen'),
    showTimestamp: document.getElementById('showTimestamp'),
    rememberHistory: document.getElementById('rememberHistory'),
    maxHistoryLength: document.getElementById('maxHistoryLength'),
    
    // Buttons
    copyCodeBtn: document.getElementById('copyCodeBtn'),
    copyWithConfigBtn: document.getElementById('copyWithConfigBtn'),
    previewButton: document.getElementById('previewButton'),
    toggleVisibility: document.querySelector('.toggle-visibility'),
    
    // Display
    embedCode: document.getElementById('embedCode'),
    copyNotification: document.getElementById('copyNotification'),
    previewWidget: document.getElementById('previewWidget'),
    
    // Range display values
    rangeDisplays: {
        voiceRate: document.getElementById('voiceRateValue'),
        voicePitch: document.getElementById('voicePitchValue'),
        temperature: document.getElementById('temperatureValue')
    }
};

// ===== Default Configuration =====
const DEFAULT_CONFIG = {
    apiKey: '',
    backendUrl: 'https://agent-web-backend.vercel.app',
    model: 'gpt-4o',
    widgetPosition: 'bottom-right',
    language: 'es',
    primaryColor: '#52d1b2',
    secondaryColor: '#07111f',
    textColor: '#ebf4ff',
    width: '360px',
    maxHeight: '600px',
    voiceLang: 'es-ES',
    voiceRate: 1,
    voicePitch: 1,
    autoListenOnOpen: false,
    maxTokens: 150,
    temperature: 0.7,
    systemPrompt: 'Eres un asistente de voz amigable y util. Tu trabajo es ayudar al usuario a interactuar con la pagina web actual. Puedes responder preguntas sobre el contenido de la pagina y realizar acciones seguras como hacer clic en botones, desplazarte o buscar informacion. SIMPRE responde en el idioma del usuario. NO inventes informacion que no este en la pagina. SI no estas seguro de algo, di que no lo sabes.',
    autoOpen: true,
    showTimestamp: true,
    rememberHistory: true,
    maxHistoryLength: 50
};

// ===== Valid Models =====
const VALID_MODELS = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-4-32k',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
    'gpt-3.5-turbo-0613',
    'gpt-3.5-turbo-1106'
];

// ===== State =====
let widgetInstance = null;

// ===== Initialize =====
function initConfigUI() {
    loadSavedConfig();
    setupEventListeners();
    updateEmbedCode();
    updatePreview();
}

// ===== Load Saved Configuration =====
function loadSavedConfig() {
    try {
        const savedConfig = localStorage.getItem('agentWebConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            populateForm(config);
        } else {
            // Load from URL parameters if available
            const urlParams = new URLSearchParams(window.location.search);
            const configFromUrl = {};
            
            for (const [key, value] of urlParams.entries()) {
                if (key in DEFAULT_CONFIG) {
                    // Handle boolean values
                    if (value === 'true') configFromUrl[key] = true;
                    else if (value === 'false') configFromUrl[key] = false;
                    // Handle numeric values
                    else if (!isNaN(value)) configFromUrl[key] = Number(value);
                    else configFromUrl[key] = value;
                }
            }
            
            if (Object.keys(configFromUrl).length > 0) {
                populateForm(configFromUrl);
                saveConfig(configFromUrl);
            }
        }
    } catch (e) {
        console.error('Error loading saved config:', e);
    }
}

// ===== Populate Form =====
function populateForm(config) {
    for (const key in config) {
        if (key in elements && elements[key]) {
            const element = elements[key];
            const value = config[key];
            
            if (element.type === 'checkbox') {
                element.checked = Boolean(value);
            } else {
                element.value = value;
            }
        }
    }
    
    // Special handling for color text inputs
    if (config.primaryColor) {
        elements.primaryColorText.value = config.primaryColor;
    }
    if (config.secondaryColor) {
        elements.secondaryColorText.value = config.secondaryColor;
    }
    if (config.textColor) {
        elements.textColorText.value = config.textColor;
    }
    
    // Update range display values
    updateRangeDisplays();
    
    // Update embed code
    updateEmbedCode();
}

// ===== Setup Event Listeners =====
function setupEventListeners() {
    // API Key visibility toggle
    if (elements.toggleVisibility) {
        elements.toggleVisibility.addEventListener('click', toggleApiKeyVisibility);
    }
    
    // Color pickers
    elements.primaryColor.addEventListener('input', (e) => {
        elements.primaryColorText.value = e.target.value;
        updateEmbedCode();
        saveConfig();
    });
    
    elements.primaryColorText.addEventListener('input', (e) => {
        const value = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
            elements.primaryColor.value = value;
            updateEmbedCode();
            saveConfig();
        }
    });
    
    elements.secondaryColor.addEventListener('input', (e) => {
        elements.secondaryColorText.value = e.target.value;
        updateEmbedCode();
        saveConfig();
    });
    
    elements.secondaryColorText.addEventListener('input', (e) => {
        const value = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
            elements.secondaryColor.value = value;
            updateEmbedCode();
            saveConfig();
        }
    });
    
    elements.textColor.addEventListener('input', (e) => {
        elements.textColorText.value = e.target.value;
        updateEmbedCode();
        saveConfig();
    });
    
    elements.textColorText.addEventListener('input', (e) => {
        const value = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
            elements.textColor.value = value;
            updateEmbedCode();
            saveConfig();
        }
    });
    
    // Range inputs with display
    setupRangeListener('voiceRate', 'voiceRateValue');
    setupRangeListener('voicePitch', 'voicePitchValue');
    setupRangeListener('temperature', 'temperatureValue');
    
    // Regular inputs
    const regularInputs = [
        'apiKey', 'backendUrl', 'model', 'widgetPosition', 'language',
        'width', 'maxHeight', 'voiceLang', 'maxTokens', 'systemPrompt',
        'maxHistoryLength'
    ];
    
    regularInputs.forEach(id => {
        if (elements[id]) {
            elements[id].addEventListener('input', () => {
                updateEmbedCode();
                saveConfig();
                updatePreview();
            });
        }
    });
    
    // Checkbox inputs
    const checkboxInputs = ['autoListenOnOpen', 'autoOpen', 'showTimestamp', 'rememberHistory'];
    checkboxInputs.forEach(id => {
        if (elements[id]) {
            elements[id].addEventListener('change', () => {
                updateEmbedCode();
                saveConfig();
                updatePreview();
            });
        }
    });
    
    // Copy buttons
    if (elements.copyCodeBtn) {
        elements.copyCodeBtn.addEventListener('click', () => copyCode(false));
    }
    
    if (elements.copyWithConfigBtn) {
        elements.copyWithConfigBtn.addEventListener('click', () => copyCode(true));
    }
    
    // Preview button
    if (elements.previewButton) {
        elements.previewButton.addEventListener('click', testWidget);
    }
}

// ===== Setup Range Listener =====
function setupRangeListener(inputId, displayId) {
    if (elements[inputId] && elements.rangeDisplays[displayId]) {
        elements[inputId].addEventListener('input', (e) => {
            elements.rangeDisplays[displayId].textContent = e.target.value;
            updateEmbedCode();
            saveConfig();
        });
    }
}

// ===== Update Range Displays =====
function updateRangeDisplays() {
    if (elements.voiceRate && elements.rangeDisplays.voiceRate) {
        elements.rangeDisplays.voiceRate.textContent = elements.voiceRate.value;
    }
    if (elements.voicePitch && elements.rangeDisplays.voicePitch) {
        elements.rangeDisplays.voicePitch.textContent = elements.voicePitch.value;
    }
    if (elements.temperature && elements.rangeDisplays.temperature) {
        elements.rangeDisplays.temperature.textContent = elements.temperature.value;
    }
}

// ===== Toggle API Key Visibility =====
function toggleApiKeyVisibility() {
    const apiKeyInput = elements.apiKey;
    if (apiKeyInput) {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            elements.toggleVisibility.innerHTML = '<span class="icon">🔒</span>';
        } else {
            apiKeyInput.type = 'password';
            elements.toggleVisibility.innerHTML = '<span class="icon">👁️</span>';
        }
    }
}

// ===== Collect Configuration =====
function collectConfig() {
    const config = {};
    
    // Collect all form values
    for (const key in DEFAULT_CONFIG) {
        if (elements[key]) {
            const element = elements[key];
            
            if (element.type === 'checkbox') {
                config[key] = element.checked;
            } else {
                config[key] = element.value;
            }
        }
    }
    
    // Special handling for color text inputs (override color picker values)
    if (elements.primaryColorText && elements.primaryColorText.value) {
        config.primaryColor = elements.primaryColorText.value;
    }
    if (elements.secondaryColorText && elements.secondaryColorText.value) {
        config.secondaryColor = elements.secondaryColorText.value;
    }
    if (elements.textColorText && elements.textColorText.value) {
        config.textColor = elements.textColorText.value;
    }
    
    return config;
}

// ===== Generate Embed Code =====
function generateEmbedCode(includeConfig = false) {
    const config = collectConfig();
    const baseUrl = 'https://agent-web-widget.vercel.app/widget.js';
    
    if (!includeConfig) {
        // Simple code with just API key
        return `<script src="${baseUrl}"\n  data-api-key="${config.apiKey || 'TU_API_KEY'}"\n></script>`;
    }
    
    // Full code with all configuration
    let attributes = [];
    
    // Required
    if (config.apiKey) {
        attributes.push(`data-api-key="${escapeHtml(config.apiKey)}"`);
    } else {
        attributes.push(`data-api-key="TU_API_KEY"`);
    }
    
    // Backend URL
    if (config.backendUrl && config.backendUrl !== DEFAULT_CONFIG.backendUrl) {
        attributes.push(`data-backend-url="${escapeHtml(config.backendUrl)}"`);
    }
    
    // Model
    if (config.model && config.model !== DEFAULT_CONFIG.model) {
        attributes.push(`data-model="${escapeHtml(config.model)}"`);
    }
    
    // UI Settings
    if (config.widgetPosition && config.widgetPosition !== DEFAULT_CONFIG.widgetPosition) {
        attributes.push(`data-widget-position="${escapeHtml(config.widgetPosition)}"`);
    }
    
    if (config.primaryColor && config.primaryColor !== DEFAULT_CONFIG.primaryColor) {
        attributes.push(`data-primary-color="${escapeHtml(config.primaryColor)}"`);
    }
    
    if (config.secondaryColor && config.secondaryColor !== DEFAULT_CONFIG.secondaryColor) {
        attributes.push(`data-secondary-color="${escapeHtml(config.secondaryColor)}"`);
    }
    
    if (config.textColor && config.textColor !== DEFAULT_CONFIG.textColor) {
        attributes.push(`data-text-color="${escapeHtml(config.textColor)}"`);
    }
    
    if (config.width && config.width !== DEFAULT_CONFIG.width) {
        attributes.push(`data-width="${escapeHtml(config.width)}"`);
    }
    
    if (config.maxHeight && config.maxHeight !== DEFAULT_CONFIG.maxHeight) {
        attributes.push(`data-max-height="${escapeHtml(config.maxHeight)}"`);
    }
    
    // Voice Settings
    if (config.voiceLang && config.voiceLang !== DEFAULT_CONFIG.voiceLang) {
        attributes.push(`data-voice-lang="${escapeHtml(config.voiceLang)}"`);
    }
    
    if (config.voiceRate && Number(config.voiceRate) !== DEFAULT_CONFIG.voiceRate) {
        attributes.push(`data-voice-rate="${escapeHtml(config.voiceRate)}"`);
    }
    
    if (config.voicePitch && Number(config.voicePitch) !== DEFAULT_CONFIG.voicePitch) {
        attributes.push(`data-voice-pitch="${escapeHtml(config.voicePitch)}"`);
    }
    
    if (config.autoListenOnOpen !== DEFAULT_CONFIG.autoListenOnOpen) {
        attributes.push(`data-auto-listen-on-open="${config.autoListenOnOpen}"`);
    }
    
    // LLM Settings
    if (config.maxTokens && Number(config.maxTokens) !== DEFAULT_CONFIG.maxTokens) {
        attributes.push(`data-max-tokens="${escapeHtml(config.maxTokens)}"`);
    }
    
    if (config.temperature && Number(config.temperature) !== DEFAULT_CONFIG.temperature) {
        attributes.push(`data-temperature="${escapeHtml(config.temperature)}"`);
    }
    
    // Behavior Settings
    if (config.autoOpen !== DEFAULT_CONFIG.autoOpen) {
        attributes.push(`data-auto-open="${config.autoOpen}"`);
    }
    
    if (config.showTimestamp !== DEFAULT_CONFIG.showTimestamp) {
        attributes.push(`data-show-timestamp="${config.showTimestamp}"`);
    }
    
    if (config.rememberHistory !== DEFAULT_CONFIG.rememberHistory) {
        attributes.push(`data-remember-history="${config.rememberHistory}"`);
    }
    
    if (config.maxHistoryLength && Number(config.maxHistoryLength) !== DEFAULT_CONFIG.maxHistoryLength) {
        attributes.push(`data-max-history-length="${escapeHtml(config.maxHistoryLength)}"`);
    }
    
    // System prompt (if different from default)
    if (config.systemPrompt && config.systemPrompt !== DEFAULT_CONFIG.systemPrompt) {
        // For long system prompts, we can't include them in data attributes
        // So we just note that it's customized
        attributes.push(`data-system-prompt="custom"`);
    }
    
    // Build the final HTML
    if (attributes.length <= 2) {
        // Simple format
        return `<script src="${baseUrl}"\n  ${attributes.join('\n  ')}></script>`;
    } else {
        // Multi-line format
        return `<script src="${baseUrl}"\n  ${attributes.join('\n  ')}>\n</script>`;
    }
}

// ===== Update Embed Code Display =====
function updateEmbedCode() {
    const code = generateEmbedCode(false);
    if (elements.embedCode) {
        elements.embedCode.innerHTML = `<code>${escapeHtmlForDisplay(code)}</code>`;
    }
}

// ===== Copy Code to Clipboard =====
async function copyCode(includeConfig) {
    try {
        const code = generateEmbedCode(includeConfig);
        await navigator.clipboard.writeText(code);
        showNotification('✅ Código copiado al portapapeles!');
    } catch (e) {
        // Fallback for older browsers
        fallbackCopyCode(generateEmbedCode(includeConfig));
        showNotification('✅ Código copiado!');
    }
}

// ===== Fallback Copy for Older Browsers =====
function fallbackCopyCode(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
    } catch (e) {
        console.error('Fallback copy failed:', e);
    }
    document.body.removeChild(textarea);
}

// ===== Show Notification =====
function showNotification(message) {
    if (elements.copyNotification) {
        elements.copyNotification.textContent = message;
        elements.copyNotification.classList.add('show');
        
        setTimeout(() => {
            elements.copyNotification.classList.remove('show');
        }, 3000);
    }
}

// ===== Test Widget =====
function testWidget() {
    // Save current configuration
    const config = collectConfig();
    saveConfig(config);
    
    // Create a test widget on the page
    if (widgetInstance) {
        widgetInstance.destroy();
        widgetInstance = null;
    }
    
    // Create a test container
    const testContainer = document.createElement('div');
    testContainer.id = 'testWidgetContainer';
    testContainer.style.position = 'fixed';
    testContainer.style.bottom = '20px';
    testContainer.style.right = '20px';
    testContainer.style.zIndex = '10000';
    
    // Add widget script dynamically
    const script = document.createElement('script');
    script.type = 'module';
    
    const configForTest = { ...config };
    // Remove API key for test to avoid exposing it
    delete configForTest.apiKey;
    
    // Create inline config
    const configStr = Object.entries(configForTest)
        .map(([key, value]) => `data-${key}="${escapeHtml(value)}"`)
        .join(' ');
    
    script.innerHTML = `
        import WebAgent from './src/index.js';
        const config = {${Object.entries(configForTest)
            .map(([key, value]) => {
                if (typeof value === 'string') return `${key}: "${escapeHtmlForJS(value)}"`;
                if (typeof value === 'boolean') return `${key}: ${value}`;
                return `${key}: ${value}`;
            })
            .join(', ')}};
        const widget = WebAgent.init(config);
        window.testWidgetInstance = widget;
    `;
    
    testContainer.appendChild(script);
    document.body.appendChild(testContainer);
    
    // Show message
    showNotification('🎯 Widget de prueba en la esquina inferior derecha!');
    
    // Remove after 30 seconds
    setTimeout(() => {
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
        if (window.testWidgetInstance) {
            window.testWidgetInstance.destroy();
            window.testWidgetInstance = null;
        }
    }, 30000);
}

// ===== Update Preview =====
function updatePreview() {
    const config = collectConfig();
    const widget = elements.previewWidget;
    
    if (widget) {
        // Update preview styling based on config
        widget.style.backgroundColor = config.secondaryColor || DEFAULT_CONFIG.secondaryColor;
        widget.style.borderColor = config.primaryColor || DEFAULT_CONFIG.primaryColor;
        
        // Update message colors
        const messages = widget.querySelectorAll('.preview-message');
        messages.forEach(msg => {
            if (msg.classList.contains('user')) {
                msg.style.backgroundColor = config.primaryColor || DEFAULT_CONFIG.primaryColor;
            } else {
                msg.style.backgroundColor = config.secondaryColor || DEFAULT_CONFIG.secondaryColor;
                msg.style.color = config.textColor || DEFAULT_CONFIG.textColor;
            }
        });
    }
}

// ===== Save Configuration =====
function saveConfig(config = null) {
    try {
        const configToSave = config || collectConfig();
        localStorage.setItem('agentWebConfig', JSON.stringify(configToSave));
    } catch (e) {
        console.error('Error saving config:', e);
    }
}

// ===== Escape HTML =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Escape HTML for Display =====
function escapeHtmlForDisplay(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// ===== Escape HTML for JavaScript =====
function escapeHtmlForJS(text) {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

// ===== Reset Configuration =====
function resetConfig() {
    if (confirm('¿Estás seguro de que quieres restablecer la configuración a los valores por defecto?')) {
        localStorage.removeItem('agentWebConfig');
        populateForm(DEFAULT_CONFIG);
        updateEmbedCode();
        updatePreview();
        showNotification('✅ Configuración restablecida!');
    }
}

// ===== Export Configuration =====
function exportConfig() {
    const config = collectConfig();
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agent-web-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('✅ Configuración exportada!');
}

// ===== Import Configuration =====
async function importConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const config = JSON.parse(event.target.result);
                    populateForm(config);
                    saveConfig(config);
                    updateEmbedCode();
                    updatePreview();
                    showNotification('✅ Configuración importada!');
                } catch (e) {
                    showNotification('❌ Error al importar: Formato JSON inválido');
                    console.error('Import error:', e);
                }
            };
            reader.readAsText(file);
        }
    });
    
    input.click();
}

// ===== Validate Configuration =====
function validateConfig() {
    const config = collectConfig();
    const errors = [];
    
    // Required fields
    if (!config.apiKey || config.apiKey === 'TU_API_KEY') {
        errors.push('API Key es obligatoria');
    }
    
    // Validate API Key format
    if (config.apiKey && !/^sk-[a-zA-Z0-9]{48}$/.test(config.apiKey)) {
        errors.push('Formato de API Key inválido (debe ser sk-...)');
    }
    
    // Validate model
    if (config.model && !VALID_MODELS.includes(config.model)) {
        errors.push(`Modelo no válido: ${config.model}`);
    }
    
    // Validate URL
    if (config.backendUrl && config.backendUrl !== DEFAULT_CONFIG.backendUrl) {
        try {
            new URL(config.backendUrl);
        } catch (e) {
            errors.push('URL del backend inválida');
        }
    }
    
    if (errors.length > 0) {
        alert(`Por favor corrige los siguientes errores:\n\n${errors.join('\n')}`);
        return false;
    }
    
    return true;
}

// ===== Initialize on DOM Ready =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfigUI);
} else {
    initConfigUI();
}

// ===== Export for testing =====
if (typeof window !== 'undefined') {
    window.ConfigUI = {
        collectConfig,
        generateEmbedCode,
        saveConfig,
        loadSavedConfig,
        resetConfig,
        exportConfig,
        importConfig,
        validateConfig
    };
}
