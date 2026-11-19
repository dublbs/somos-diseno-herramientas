# Manifiesto de arte · P-002 (andén Pixel y metro nuevo)

Arte nuevo del HUB autorizado por D-002 (`docs/equipo/bitacora.md`). No hay archivos de imagen nuevos: todo se dibuja
por código en el canvas, con la paleta Línea azul más el rojo de la Línea 1 (`#E2001A`) y tonos derivados.

| Pieza | Dónde | Cómo |
|---|---|---|
| Metro Pixel (carro con cabina, carro de cola, puertas dobles cerradas, ventanas con brillo celeste y pasajeros a contraluz, franja roja y línea morada, equipos de techo, bogies) | `hub-estacion/src/estacion/metro.ts` | Sprite de 32 filas a 1 px por celda, generado por código y escalado sin suavizado. Referencia: `docs/equipo/referencias/metro-web-pixel.png` |
| Muro de azulejos, luminarias, franja «ESTACION · SOMOS DISEÑO», pilares, mapa de la red, afiches (TAGS, JUEGA, PINTA), bancas, basurero, extintor, piso de baldosas, franja táctil, vía con balasto | `hub-estacion/src/estacion/escena.ts` (`fondoAnden`) | Rectángulos en grilla pixel; se pinta una vez por tamaño de pantalla |
| Stickers del plumón y la zapatilla pegados en los pilares (borde blanco, ángulo, sombra) | `escena.ts` (`fondoAnden`, `pegar`) | Reusa `public/figma/vagon/plumon.svg` y `zapatilla.svg` |
| Ilustración de los afiches | `escena.ts` (`afiche`) | Reusa `public/figma/vagon/spray.svg`, `personaje.svg` y `tarro-pintura.svg` |

Ya no se usan (quedan en el repo): `public/figma/metro/linea1-lateral.svg` y `linea4-lateral.svg`.
