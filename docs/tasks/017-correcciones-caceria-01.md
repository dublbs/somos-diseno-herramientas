# 017 · Correcciones · Cacería: afiche 01 (Tejido)

Salen de la bitácora [`docs/qa/caceria-afiche-01.md`](../qa/caceria-afiche-01.md) (19 nov). Rama `claude/caceria-afiche-01`.

## T-001 · Vuelve el afiche 01 a la cacería
- Archivo: `credencial/src/lib/afiches.ts`, `credencial/public/figma/afiches/af01.webp` (nuevo), `docs/plans/010-caceria/assets.manifest.md`.
- Cambio: `AF01 · Tejido · Geométrica` con la miniatura del A3 de Figma (`1306:17020`, 300 × 424).
- Aceptación: el banco simulado reconoce el 01 y deja de darlo por el pingüino.
- [x] Hecha

## T-002 · Comparar la miniatura como papel impreso
- Archivo: `credencial/src/lib/reconocer-afiche.ts` (`NEGRO_PAPEL`, `comoPapel()`, `prepararAfiches()`).
- Cambio: el negro de la miniatura sube a 20 antes de armar las plantillas.
- Aceptación: el 01 pasa de 28 a 34 de 40 en el banco 1, sin empeorar los otros cinco ni dejar pasar no-afiches nuevos (salvo una foto del Sol viejo).
- [x] Hecha

## T-003 · El álbum muestra los 6 afiches en una fila
- Archivo: `credencial/src/styles.css` (`.ranuras-afiche`), `credencial/src/pages/Juego.tsx` (comentario).
- Aceptación: `#/juego` sin scroll en 390 × 844, 412 × 915 y 360 × 740.
- [x] Hecha

## No aplicadas
- **Suavizar la grilla de forma (cámara y miniatura):** sube el 01 un poco más (35 de 40), pero deja pasar 1–2 capturas de pantallas como Ven a ver. No vale el riesgo durante el evento.
- **Subir el negro a 30 o 40:** igual o peor para el 01 y deja pasar más fotos del Sol viejo.
- **Bajar `MARGEN` o `UMBRAL`:** reconocería más el 01 con luz fría fuerte, pero también abre la puerta a confusiones con el pingüino. Mejor que no se dé ninguno a que se dé el equivocado.
- **Cambios en la base:** no hacen falta. Solo verificar (T-004).

## Pendiente (personas)
## T-004 · Verificar el 01 en la base
- Dónde: SQL Editor de `somos-diseno`.
- Cambio: `select id, nombre, activo from public.afiches order by id;` Si `AF01` está apagado: `update public.afiches set activo = true where id = 'AF01';`. Opcional: `update public.afiches set nombre = 'Diseño con raíces' where id = 'AF03';` (la credencial usa su propio nombre; es solo para el PC madre).
- [ ] Hecha

## T-005 · Probar con el A3 impreso
- Dónde: en la sede, con `#/afiches?ver`, iPhone y Android, de frente y con la luz del lugar.
- Aceptación: el 01 se anota como Tejido; si con luz fría queda «sin reconocer», acercarse hasta que el afiche llene la guía.
- [ ] Hecha
