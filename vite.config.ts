/**
 * Vite Configuration with PWA Support
 *
 * This configuration sets up Vite for building a Progressive Web App (PWA).
 * PWAs are web apps that can be installed on devices and work offline.
 *
 * Key features enabled:
 * - React with fast refresh (instant updates during development)
 * - Service worker for offline support (caches assets so app works without internet)
 * - Web app manifest (tells the OS how to install and display the app)
 * - HTTPS required in production (PWAs require secure connections)
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Auto-update strategy: app updates automatically when new version is deployed
      registerType: 'autoUpdate',

      // Include these assets in the service worker cache
      includeAssets: ['icon-192.png', 'icon-512.png'],

      // Web App Manifest - tells mobile OS how to install the app
      manifest: {
        name: 'Food Journal',
        short_name: 'Food Journal',
        description: 'Track meals and digestive symptoms to identify food triggers',
        theme_color: '#10b981',  // Green - shows in OS task switcher
        background_color: '#ffffff',
        display: 'standalone',  // Hides browser UI when installed
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',  // Best for mobile food logging
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'  // Allows icon to adapt to different device shapes
          }
        ]
      },

      // Workbox configuration - controls what gets cached for offline use
      workbox: {
        // Cache all JS, CSS, HTML, images, and SVG files
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],

        // Runtime caching strategies for external resources
        runtimeCaching: [
          {
            // Cache Google Fonts (used if we add custom fonts later)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',  // Serve from cache first, then network
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365  // Cache for 1 year
              }
            }
          }
        ]
      }
    })
  ]
})
