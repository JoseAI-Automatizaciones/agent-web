# 🎨 Config UI - Documentation

## 📌 Overview

This is the **Configuration UI** for the agent-web widget. It provides a user-friendly interface for configuring the widget settings.

**URL:** https://agent-web-widget.vercel.app/config

## ✨ Features

- ✅ **API Configuration**: Set OpenAI API Key (required)
- ✅ **Backend URL**: Configure proxy backend URL (optional, defaults to https://agent-web-backend.vercel.app)
- ✅ **Model Selection**: Choose from various OpenAI models (GPT-4o, GPT-4o-mini, GPT-4-turbo, etc.)
- ✅ **UI Customization**: Colors, position, width, height
- ✅ **Voice Settings**: Language, rate, pitch
- ✅ **AI Parameters**: Max tokens, temperature, creativity
- ✅ **Behavior Settings**: Auto-open, timestamps, history
- ✅ **Live Preview**: See how the widget looks with your configuration
- ✅ **Auto Code Generation**: Embed code is generated automatically
- ✅ **One-Click Copy**: Copy to clipboard with a single click
- ✅ **Persistent Storage**: Configuration is saved in localStorage
- ✅ **Export/Import**: Save and load configurations as JSON files

## 📁 File Structure

```
deploy/widget/
├── public/
│   ├── config.html      ← Main HTML page
│   ├── config-ui.js     ← JavaScript logic
│   └── config-ui.css    ← CSS styles
```

## 🎛️ Available Configuration Options

### API Settings
| Option | Description | Default Value |
|--------|-------------|---------------|
| apiKey | OpenAI API Key | - |
| backendUrl | Backend proxy URL | https://agent-web-backend.vercel.app |
| model | AI Model | gpt-4o |

### UI Settings
| Option | Description | Default Value |
|--------|-------------|---------------|
| widgetPosition | Widget position | bottom-right |
| primaryColor | Primary color | #52d1b2 |
| secondaryColor | Secondary color | #07111f |
| textColor | Text color | #ebf4ff |
| width | Widget width | 360px |
| maxHeight | Maximum height | 600px |
| language | Interface language | es |

### Voice Settings
| Option | Description | Default Value |
|--------|-------------|---------------|
| voiceLang | Voice language | es-ES |
| voiceRate | Voice speed | 1 |
| voicePitch | Voice pitch | 1 |
| autoListenOnOpen | Listen on open | false |

### AI Settings
| Option | Description | Default Value |
|--------|-------------|---------------|
| maxTokens | Max tokens per response | 150 |
| temperature | Creativity (0-2) | 0.7 |
| systemPrompt | System prompt | Default prompt |

### Behavior Settings
| Option | Description | Default Value |
|--------|-------------|---------------|
| autoOpen | Auto-open on load | true |
| showTimestamp | Show message timestamps | true |
| rememberHistory | Remember chat history | true |
| maxHistoryLength | Max history length | 50 |

## 🚀 How to Use

### Step 1: Open the Configuration Page
Go to: https://agent-web-widget.vercel.app/config

### Step 2: Configure Your Settings
Fill in the form with your preferences:
- Enter your OpenAI API Key
- Select your preferred model
- Customize colors, position, and other UI settings
- Configure voice settings
- Set AI parameters

### Step 3: Preview
See a live preview of how your widget will look with the current configuration.

### Step 4: Copy the Code
Click either:
- **"Copiar Código"** - Copies only the script tag with API Key
- **"Copiar con Configuración"** - Copies the full script tag with all your settings as data attributes

### Step 5: Paste in Your Website
Paste the copied code into the `<body>` of your website.

## 📋 Example Generated Code

### Simple Code (API Key only)
```html
<script src="https://agent-web-widget.vercel.app/widget.js"
  data-api-key="TU_API_KEY">
</script>
```

### Full Code (With all configuration)
```html
<script src="https://agent-web-widget.vercel.app/widget.js"
  data-api-key="TU_API_KEY"
  data-backend-url="https://agent-web-backend.vercel.app"
  data-model="gpt-4o"
  data-widget-position="bottom-right"
  data-primary-color="#52d1b2"
  data-secondary-color="#07111f"
  data-text-color="#ebf4ff"
  data-width="360px"
  data-max-height="600px"
  data-voice-lang="es-ES"
  data-voice-rate="1"
  data-voice-pitch="1"
  data-max-tokens="150"
  data-temperature="0.7"
  data-auto-open="true"
  data-show-timestamp="true"
  data-remember-history="true">
</script>
```

## 💡 Tips

1. **API Key Security**: Never share your API Key. The configuration UI saves it in your browser's localStorage, not on any server.

2. **Testing**: Use the "Probar Widget" button to test your configuration before copying the code.

3. **Persistence**: Your configuration is automatically saved. When you return to the page, your settings will be restored.

4. **Export**: Use the export feature to save your configuration as a JSON file for backup or sharing.

5. **Import**: Use the import feature to load a previously saved configuration.

## 🔧 Technical Details

### Color Validation
Colors are validated to ensure they are valid hex codes (3 or 6 digits). You can use either:
- `#RGB` format (e.g., `#52d`)
- `#RRGGBB` format (e.g., `#52d1b2`)

### Range Values
- **voiceRate**: 0.1 to 10 (default: 1)
- **voicePitch**: 0 to 2 (default: 1)
- **temperature**: 0 to 2 (default: 0.7)
- **maxTokens**: 1 to 4000 (default: 150)
- **maxHistoryLength**: 1 to 100 (default: 50)

### Supported Models
- GPT-4o (Recommended)
- GPT-4o-mini (Faster, cheaper)
- GPT-4-turbo
- GPT-4
- GPT-4-32k
- GPT-3.5-turbo (Economical)
- GPT-3.5-turbo-16k

### Supported Voice Languages
- es-ES (Spanish - Spain)
- es-MX (Spanish - Mexico)
- en-US (English - US)
- en-GB (English - UK)
- fr-FR (French)
- de-DE (German)
- pt-BR (Portuguese - Brazil)
- it-IT (Italian)
- ja-JP (Japanese)
- ko-KR (Korean)

### Widget Positions
- bottom-right (Default)
- bottom-left
- top-right
- top-left

## 📝 Changelog

### 📅 2025-01-XX - Configuration UI v1.0.0
**Descripción:** Primera versión de la interfaz de configuración visual
**Archivos afectados:** 
- `deploy/widget/public/config.html`
- `deploy/widget/public/config-ui.js`
- `deploy/widget/public/config-ui.css`
- `deploy/widget/vercel.json`
- `deploy/widget/package.json`
- `deploy/widget/vite.config.js`
**Impacto:** Los usuarios ahora pueden configurar el widget visualmente sin necesidad de editar código
**Autor:** JoseAI-Automatizaciones

## 🤝 Contributing

If you find any issues or have suggestions for the Configuration UI, please:
1. Open an issue at: https://github.com/JoseAI-Automatizaciones/agent-web
2. Or submit a pull request with your improvements

## 📄 License

This Configuration UI is part of the agent-web project and is licensed under the MIT License.
