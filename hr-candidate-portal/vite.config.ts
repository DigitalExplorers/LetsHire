import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  envDir: path.resolve(__dirname, '..'),
  plugins: [
    react(),
    {
      name: "health-check",
      configureServer(server) {
        server.middlewares.use("/health", (_, res) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end("OK");
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use("/health", (_, res) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end("OK");
        });
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Letshire – THE8800 Hiring Platform',
        short_name: 'Letshire',
        description: 'Kickstart your career with Letshire.',
        start_url: '/',
        theme_color: '#be1d2c',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            "src": "/icons/icon-48x48.png",
            "sizes": "48x48",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/icons/icon-72x72.png",
            "sizes": "72x72",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/icons/icon-96x96.png",
            "sizes": "96x96",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/icons/icon-128x128.png",
            "sizes": "128x128",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/icons/icon-144x144.png",
            "sizes": "144x144",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/icons/icon-152x152.png",
            "sizes": "152x152",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/icons/icon-256x256.png",
            "sizes": "256x256",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/icons/icon-384x384.png",
            "sizes": "384x384",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "/icons/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": '/icons/apple-touch-icon.png',
            "sizes": '180x180',
            "type": 'image/png',
            "purpose": "any"
          }
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: ["*"],
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ["*"],
  },
});
