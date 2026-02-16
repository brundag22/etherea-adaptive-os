import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

const analyze = process.env.ANALYZE === '1';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        globIgnores: [
          '**/*.map',
          '**/assets/*monaco*',
          '**/assets/*pdf*',
          '**/assets/*pdfjs*',
          '**/assets/*three*',
          '**/assets/*wasm*',
          '**/assets/*worker*',
        ],
      },
      manifest: {
        name: 'Etherea Adaptive OS',
        short_name: 'Etherea',
        theme_color: '#090b1a',
        background_color: '#090b1a',
        display: 'standalone',
        start_url: '/',
        icons: [],
      },
    }),
    ...(analyze
      ? [
          visualizer({
            filename: 'dist/bundle-report.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('/react/') || id.includes('/scheduler/')) return 'vendor-react';
          if (id.includes('/react-dom/')) return 'vendor-react-dom';
          if (id.includes('/monaco-editor/')) return 'vendor-monaco';
          if (id.includes('/pdfjs-dist/')) return 'vendor-pdfjs';
          if (id.includes('/three/')) return 'vendor-three';
          if (id.includes('/workbox-') || id.includes('/vite-plugin-pwa/')) return 'vendor-pwa';

          return 'vendor-core';
        },
      },
    },
  },
});
