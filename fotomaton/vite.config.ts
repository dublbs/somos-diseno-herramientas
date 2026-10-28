import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

// mkcert solo en `npm run dev:tablet`: la cámara necesita HTTPS fuera de localhost.
export default defineConfig(({ command, mode }) => ({
  base: './',
  plugins: [react(), ...(command === 'serve' && process.argv.includes('--host') ? [mkcert()] : [])],
  build: { chunkSizeWarningLimit: 2000 },
}));
