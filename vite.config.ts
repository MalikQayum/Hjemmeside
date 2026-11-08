import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          parkering: path.resolve(__dirname, 'parkering/index.html'),
          nyhed: path.resolve(__dirname, 'nyhed/index.html'),
          husorden: path.resolve(__dirname, 'husorden-vedtaegter/index.html'),
          velkomstbrev: path.resolve(__dirname, 'velkomstbrev/index.html'),
          eksempler: path.resolve(__dirname, 'eksempler/index.html'),
          kontakt: path.resolve(__dirname, 'kontakt/index.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

/* Sidst opdateret: 2026-11-08 11:43 */
