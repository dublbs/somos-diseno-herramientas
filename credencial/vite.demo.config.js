// Construye la app en un solo HTML (modo demo, sin Supabase) para revisarla como vista previa.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  define: {
    "import.meta.env.VITE_SUPABASE_URL": "undefined",
    "import.meta.env.VITE_SUPABASE_ANON_KEY": "undefined",
  },
  build: { outDir: "demo", emptyOutDir: true },
});
