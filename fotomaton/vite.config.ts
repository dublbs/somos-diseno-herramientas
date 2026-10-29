import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

// mkcert solo en `npm run dev:tablet`: la cámara necesita HTTPS fuera de localhost.
export default defineConfig(({ command, mode }) => ({
  base: './',
  plugins: [react(), ...(command === 'serve' && process.argv.includes('--host') ? [mkcert()] : [])],
  // El kit compartido (../shared/ui) importa React: se resuelve con el de esta app.
  resolve: { dedupe: ['react', 'react-dom'] },
  build: { chunkSizeWarningLimit: 2000 },
  // La UI compartida vive en ../shared
  server: { fs: { allow: ['..'] } },
}));
