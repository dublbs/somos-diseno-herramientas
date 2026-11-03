import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  // El kit compartido (../shared/ui) importa React: se resuelve con el de esta app.
  resolve: { dedupe: ['react', 'react-dom'] },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  // La UI compartida vive en ../shared
  server: { fs: { allow: ['..'] } },
});
