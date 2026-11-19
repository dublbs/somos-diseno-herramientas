# Cola de Felipe (Pipe) · Teatro y HUB

Felipe también ejecuta con su agente. Zona: `loops/` (Teatro, suyo) y `hub-estacion/` (HUB y Flip).
Para la mañana, el HUB pasa del carril de Basti al de Felipe, porque Basti tiene la credencial y parte de Hora punta.
Reglas y pipeline: [`README.md`](README.md). Plan del día: [`manana.md`](manana.md).

**Assets:** para el HUB, Amaro autorizó crear arte nuevo sin Figma (D-002). La vara: que se vea terminado, como un
producto real. Respeta la paleta Línea azul y los tres lenguajes: plaza Orgánica, mezanina Geométrica y andén Pixel.

**Esta noche Felipe hace la lista completa de [`manana.md`](manana.md)**, no solo esta cola. Aquí van las tareas del HUB, que no tienen otro dueño. Orden dentro del HUB: P-005 → P-002 → P-001 → P-003 → P-004.

## P-005 · «Mezanina» en todo el HUB
- Estado: El cambio ya viene en #55 (ronda-3b). Solo hay que revisar que no quede ninguno.
- Cambio: `grep -rn "Mezanine" hub-estacion/src` no debe encontrar nada, tampoco en los carteles ni en el README.
- Aceptación: en pantalla se lee «Mezanina · Geométrica».

## P-002 · Andén con detalle y el metro nuevo
- Estado: Mañana
- Origen: F-003
- Archivos: `hub-estacion/src/estacion/escena.ts` (andén) y los sprites que use.
- Referencias: `docs/equipo/referencias/metro-web-pixel.png` (manda esta) y las fotos de Línea 1.
- Cambio:
  - El **metro** pasa al Pixel detallado de la web: cuerpo hueso con franja roja y línea morada, ventanas moradas con
    brillo celeste, bogies.
  - **No se ven las puertas abriéndose:** las puertas se abren del lado del andén, que no se ve. El tren llega, se
    detiene y la gente aparece o desaparece por detrás del tren.
  - **Andén con detalle:** línea amarilla del borde, baldosas, pilares, bancas, letrero de estación, mapa, luces,
    basurero y extintor, en Pixel y sin recargar.
  - **Stickers del plumón y de la zapatilla:** que se vean pegados de verdad en el escenario (en un pilar o un letrero,
    con su borde y su ángulo), o se quitan si no encajan.
- Verificar: 1920×1080 y 3840×2160, en modo demo, sin Supabase.
- Aceptación: capturas antes y después en el PR. Se ve terminado.

## P-001 · Plaza Orgánica y escaleras refinadas
- Estado: Mañana
- Origen: F-003, D-002
- Cambio:
  - La plaza deja de verse simple: suelo con textura, vegetación (árboles nativos, maceteros), bancas, faroles, la boca
    del metro con su letrero y luz cálida, todo en el lenguaje Orgánico (formas suaves, papel, línea a mano).
  - Las **escaleras** que bajan a la mezanina y al andén van con barandas, peldaños y sombras.
  - Se dibuja por código o con SVG nuevos en `hub-estacion/public/`. Anota los SVG en un manifiesto.
- Aceptación: capturas antes y después. Se ve como un producto real.

## P-003 · Personajes con cuerpo al estilo Terraria
- Estado: Mañana
- Origen: F-003 (propuesta de Felipe), D-002
- Cambio:
  - Cuerpo de los personajes al estilo Terraria: proporción chica, cabeza grande, brazos y piernas que se mueven al
    caminar.
  - Tres variantes según el lenguaje de la persona:
    - **Geométrica:** cuerpo de formas rectas.
    - **Orgánica:** cuerpo de curvas.
    - **Pixel:** cuerpo de pixel duro.
  - La cara se mantiene: la miniatura con consentimiento o la inicial.
- Aceptación: GIF o tira de cuadros con los tres caminando.

## P-004 · «En vivo»: loops del Teatro y de la Audioreactiva
- Estado: Mañana
- Origen: F-003
- Cambio:
  - Donde hoy va la Audioreactiva en vivo, se reproducen **siempre** loops del Teatro y de la Audioreactiva.
  - Lo más simple que funcione sin red: animaciones generadas por código con los mismos estilos (sin micrófono, con un
    pulso simulado) o videos cortos en `hub-estacion/public/loops/`, de menos de 2 MB cada uno.
  - Si llegan piezas nuevas por `escuchar`, pueden entrar a la rotación. Si no, la rotación base no se detiene nunca.
- Aceptación: 10 min corriendo sin cortes ni pantalla vacía, sin Supabase.
