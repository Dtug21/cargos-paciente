import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// El repo es github.com/Dtug21/cargos-paciente, así que la app queda servida
// desde https://dtug21.github.io/cargos-paciente/ — con esta base todas las
// rutas de assets y del service worker apuntan al lugar correcto en GitHub Pages.
const base = '/cargos-paciente/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Cargos paciente',
        short_name: 'Cargos',
        description: 'Carga rápida de insumos por paciente en la unidad',
        theme_color: '#0C3866',
        background_color: '#F4F6F8',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
