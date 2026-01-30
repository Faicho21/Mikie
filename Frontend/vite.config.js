import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Forzar build ESM de react-window para que exporte FixedSizeList correctamente
      'react-window': path.resolve(__dirname, 'node_modules/react-window/dist/index.esm.js')
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Mikie - Control de Stock',
        short_name: 'Mikie',
        description: 'Sistema de control de stock y ventas para drugstore',
        theme_color: '#14532d',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        // Añadir icon-192.png e icon-512.png en public/ cuando los tengas (ver ICONOS.md)
        icons: []
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
});

