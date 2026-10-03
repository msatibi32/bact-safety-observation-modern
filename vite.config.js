import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  build: { sourcemap: false },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo/favicon-32.png', 'logo/favicon-192.png', 'logo/web-white.png'],
      manifest: {
        name: 'BACT Safety Observation Card',
        short_name: 'BACT SOC',
        description: 'Pelaporan observasi keselamatan PT. BACT',
        theme_color: '#F37021',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/logo/favicon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo/favicon-192.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
        globIgnores: [
          '**/BACT Logo_*.png',
          '**/bact-logo*.png',
          '**/favicon.png',
          '**/jspdf*.js',
          '**/html2canvas*.js',
          '**/xlsx*.js',
          '**/purify.es*.js',
          '**/index.es-*.js',
          '**/pdfFlowchart*.js',
          '**/PdfReviewModal*.js',
          '**/analytics-*.js',
          '**/Admin*.js',
          '**/QrPoster*.js',
          '**/BarChart*.js',
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
            options: { cacheName: 'supabase-api' },
          },
          {
            urlPattern: /\/logo\/web-.*\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bact-logo-web',
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
