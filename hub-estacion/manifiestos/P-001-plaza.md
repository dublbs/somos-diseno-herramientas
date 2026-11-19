# Manifiesto de arte · P-001 (plaza Orgánica y escaleras)

Arte nuevo del HUB autorizado por D-002 (`docs/equipo/bitacora.md`). No hay archivos de imagen nuevos: todo se dibuja
por código en el canvas (`hub-estacion/src/estacion/escena.ts`), en el lenguaje Orgánico: formas suaves, papel recortado
y línea a mano, con la paleta Línea azul y tonos naturales derivados (greda, madera, maicillo).

| Pieza | Función | Notas |
|---|---|---|
| Nubes de papel | `nube` | Se pinta una vez y avanza muy lento |
| Cordillera con nieve y cerros verdes | `fondoPlaza` | Papel recortado. De tarde (desde las 17:00) la cordillera pasa a lila |
| Árboles nativos de copa redonda (peumo, quillay) | `fondoPlaza` (`arbol`) | Tres capas de verde con brillos de papel |
| Pasto con borde ondulado y matas, piso de maicillo con piedrecitas y solera | `fondoPlaza` | — |
| Boca del metro: hueco con luz cálida, techo de vidrio curvo, pilares, letrero «METRO», baranda y tótem «ESTACION» | `fondoPlaza` | Reemplaza al acceso anterior |
| Maceteros de greda con plantas, bancas de madera, faroles con luz (más fuerte de tarde) | `fondoPlaza` | — |
| Escaleras: sombra sobre el muro, remaches, brillo del vidrio, borde amarillo en cada peldaño, brillo del pasamanos | `escaleras` | Siguen siendo las mismas escaleras mecánicas animadas |

Se reusan los SVG de `public/figma/plaza/` (araucaria, helecho, quisco, flor y sol).
Lo quieto de la plaza se guarda en una capa (`capaPlaza`), que se rehace al cambiar el tamaño de la pantalla o al pasar
de día a tarde.
