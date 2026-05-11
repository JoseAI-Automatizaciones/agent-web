/**
 * @file vite.config.js
 * @description Configuracion de Vite para el widget agent-web
 * @author agent-web
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';
<<<<<<< HEAD
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';

// Funcion para copiar directorio recursivamente
function copyDir(src, dest) {
  if (!existsSync(src)) return;
  
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  
  const entries = readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name);
    const destPath = resolve(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}
=======
>>>>>>> ae6283b41c385eac28f3a606c41b780c14ea6553

export default defineConfig({
  // Configuracion base para desarrollo y produccion
  base: './',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  
  build: {
    // Configuracion para bundle de produccion
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, './src/index.js')
      },
      output: {
        // Salida como IIFE (Immediately Invoked Function Expression)
        format: 'iife',
        // Nombre de la variable global
<<<<<<< HEAD
        name: 'WebAgent',
        // Entry file name - Cambiado a widget.js para Vercel
        entryFileNames: 'widget.js',
=======
        name: 'AgentWeb',
        // Entry file name
        entryFileNames: 'agent-web.js',
>>>>>>> ae6283b41c385eac28f3a606c41b780c14ea6553
        // Chunk file names
        chunkFileNames: 'chunks/[name]-[hash].js',
        // Asset file names
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    // Tamanos de chunk
    chunkSizeWarningLimit: 500,
<<<<<<< HEAD
    // Limite de tamano del bundle
    reportCompressedSize: true
  },
  
  // Plugin para copiar archivos estaticos (public folder)
  plugins: [
    {
      name: 'copy-public-to-dist',
      closeBundle() {
        const publicDir = resolve(__dirname, './public');
        const distDir = resolve(__dirname, './dist');
        
        // Copiar el contenido de public a dist
        if (existsSync(publicDir)) {
          copyDir(publicDir, distDir);
          console.log('✅ Public folder copied to dist/');
        }
      }
    }
  ],
=======
    // Limite de tamaño del bundle
    reportCompressedSize: true
  },
  
  // Configuracion para testing con Vitest
  test: {
    // Entorno de testing (jsdom para tests del DOM)
    environment: 'jsdom',
    
    // Habilitar globales (describe, it, expect, etc.)
    globals: true,
    
    // Setup file para configuracion global
    setupFiles: './tests/setup.js',
    
    // Incluir todos los archivos de test
    include: ['src/**/*.{test,spec}.js'],
    
    // Excluir node_modules y otros directorios
    exclude: ['node_modules', 'dist', 'coverage'],
    
    // Cobertura de codigo
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        '**/*.test.js',
        '**/*.spec.js'
      ]
    },
    
    // Timeout para tests
    testTimeout: 10000,
    
    // Retry para tests fallidos
    retries: 1,
    
    // Output para tests
    outputFile: {
      junit: './test-results.xml'
    },
    
    // Mock de CSS para tests
    css: {
      modules: {
        classNameStrategy: 'non-scoped'
      }
    }
  },
>>>>>>> ae6283b41c385eac28f3a606c41b780c14ea6553
  
  // Configuracion para desarrollo
  server: {
    port: 5173,
    open: false,
    cors: true,
    proxy: {
      // Proxy para OpenAI API durante desarrollo
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true
      }
    }
  },
  
  // Configuracion para preview de produccion
  preview: {
    port: 4173,
    open: false
<<<<<<< HEAD
  }
=======
  },
  
  // Plugins (pueden anadirse plugins adicionales si es necesario)
  plugins: [
    // Plugin para compressao
    {
      name: 'compress',
      apply: 'build',
      transformIndexHtml: {
        order: 'post',
        handler: async (html, { filename }) => {
          // Compresion minima para mantener legibilidad
          return html.replace(/\s+/g, ' ').trim();
        }
      }
    }
  ],
  
  // Optimizaciones
  optimizeDeps: {
    include: [
      // Dependencias que deben ser pre-bundleadas
    ],
    exclude: [
      // Dependencias que NO deben ser pre-bundleadas
    ]
  },
  
  // Cache
  cacheDir: 'node_modules/.vite-cache'
>>>>>>> ae6283b41c385eac28f3a606c41b780c14ea6553
});
