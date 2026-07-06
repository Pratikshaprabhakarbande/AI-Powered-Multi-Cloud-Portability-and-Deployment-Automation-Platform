import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robots.txt', 'icons/*'],
      manifest: {
        name: 'CloudPortability',
        short_name: 'CloudPortability',
        description: 'AI-Powered Multi-Cloud Portability & Deployment Automation Platform',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
          { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-256.png', sizes: '256x256', type: 'image/png' },
          { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Cache static assets (JS, CSS, images, fonts) for faster loading.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        runtimeCaching: [
          {
            // Cache API health check for offline indicator.
            urlPattern: /\/api\/health$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-health', expiration: { maxEntries: 1, maxAgeSeconds: 60 } }
          },
          {
            // Cache dashboard data briefly for offline access.
            urlPattern: /\/api\/dashboard\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'api-dashboard', expiration: { maxEntries: 20, maxAgeSeconds: 300 } }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
