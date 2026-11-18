import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
    // La pantalla Samsung Flip 2 (WM55R, Tizen 5.0) trae un navegador Chromium ~69: sin `?.` ni `??` el código ni
    // arranca. Se compila la sintaxis para ese navegador y el CSS se baja lo que se pueda (inset, etc.).
    target: 'chrome69',
    cssTarget: 'chrome69',
  },
  // La UI compartida vive en ../shared
  server: { fs: { allow: ['..'] } },
});
