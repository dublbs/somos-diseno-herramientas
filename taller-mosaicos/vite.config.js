// Construye el taller en un solo HTML autocontenido (sirve como artifact o abierto directo en el navegador).
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({ plugins: [viteSingleFile()], build: { outDir: "dist", emptyOutDir: true } });
