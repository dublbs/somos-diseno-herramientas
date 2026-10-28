import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
  },
  // La UI compartida vive en ../shared
  server: { fs: { allow: ['..'] } },
});
