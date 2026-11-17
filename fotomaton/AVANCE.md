# Avance A5 · Fotomatón ronda 2 (borrar en el último commit)
- Hecho: barra inferior solo con el disparador («Foto» / «Otra foto»); todo lo demás en el panel derecho con scroll propio (components/Panel.tsx); «Restablecer» (en el editor pide confirmar); sin reflejar ni compartir/guardar; cámara frontal/trasera y «Subir una foto» dentro del panel.
- Hecho: placas C/M/Y/K (o Sombras/Medios, o Tinta) que se apagan y prenden; solo con la trama (Orgánica); en la cámara siguen la vista en vivo; se aplican al lienzo, a la vista en vivo y a la tarjeta.
- Hecho: miniaturas de marcos 3 por fila con nombre; paleta con muestras grandes.
- Hecho: personaje de muestra generado por lenguaje (lib/demo.ts) y mosaico de triángulos adaptativo con juntas (lib/trama.ts).
- Falta, en orden: (3) marcos generados en shared/marcos-generados.ts con generador en scripts/ (Diamante GM06, Estallido GM02 recorte, Vinilo PM02, Ventana PM04, Metro PM05, Señal PM06) + manifiesto docs/plans/012-ui-herramientas/assets-fotomaton.manifest.md; (4) hoja de contacto antes/después, tarjetas, tsc de credencial; (5) dist de producción de fotomaton.
- Pruebas: Playwright con cámara falsa en las 6 resoluciones sin scroll de página ni controles fuera, 0 errores de consola.
