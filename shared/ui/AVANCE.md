# A0 · avance (se borra en el último commit)
- Hecho: unión de llevatela-qr; íconos nuevos en el subconjunto Material Symbols; kit v2 (`herramienta.css`,
  `Herramienta.tsx`, `Manijas.tsx`) y `README.md` con la API. Compila (tsc en taller-mosaicos).
- Falta, en orden:
  1. (hecho, falta probar funciones) Mosaicos en MarcoHerramienta; medición de pantalla en 6 resoluciones OK.
  2. Playwright en las 6 resoluciones (puerto 4201), capturas y ajustes.
  3. `tsc --noEmit` en las 11 apps que importan shared/ui (npm ci en cada una).
  4. `docs/kit/muestra-v2.html` (script `scripts/kit-muestra.py`) y «Regla de pantalla» de AGENTS.md (D6).
  5. `dist/` de producción de taller-mosaicos con su `.env.local`; borrar este archivo.
