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
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        globIgnores: [
          '**/*.map',
          '**/assets/vendor-monaco-*.js',
          '**/assets/vendor-pdfjs-*.js',
          '**/assets/vendor-three-*.js',
          '**/assets/*wasm*',
          '**/assets/*worker*',
          '**/assets/*.woff2',
        ],
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => request.destination === 'script' && /\/assets\/vendor-(monaco|pdfjs|three)-/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'vendor-heavy-runtime',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
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
          if (id.includes('/@etherea/ui/')) return 'vendor-ui';
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
