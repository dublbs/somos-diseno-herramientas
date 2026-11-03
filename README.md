# Experiencias Interactivas · Somos Diseño

Estaciones interactivas de Somos Diseño para la Semana del Diseño (INACAP Santiago Centro):
- tablets en horizontal en las mesas;
- la credencial en el celular de cada persona;
- la pantalla del stand (HUB «Estación»).

Las reglas para agentes están en [`AGENTS.md`](AGENTS.md), y el estado y los pendientes en [`docs/ESTADO_DEL_HUB.md`](docs/ESTADO_DEL_HUB.md).

## Arquitectura
```
index.html            Hub: tarjetas que llevan a cada experiencia (<app>/dist/)
shared/               Lo común a todas las apps
  somos-tokens.css    Tokens de los 3 lenguajes (data-visual: Pixel · Geométrica · Orgánica)
  somos-ui.css        Pantalla fija para portadas y Telar
  somos-fonts.css     Fuentes locales (sin internet)
  somos-icons.css     Subconjunto de Material Symbols
  ui/                 Kit de interfaz por lenguaje (barras fijas, controles), Tutorial, Quiosco y modo juego
  marcos.ts           Los 15 marcos de Figma (Fotomatón y Credencial)
  datos.ts            Lo que las apps mandan al HUB (local o Supabase)
  juego.ts            Estaciones de timbres y PIN del staff
  supabase/           SQL de la capa de datos
<app>/                Una app Vite independiente por experiencia (React 18.3.1 · TypeScript 7.0.2 · Vite 8.3.5)
  src/  public/figma/ dist/
docs/                 Estado, planes (docs/plans/NNN-*), tareas (docs/tasks/), kit y guía de Supabase
scripts/              Generadores (marcos desde Figma, muestra del kit, artifact del hub)
```

`dist/` **está versionado**, porque el hub enlaza a `<app>/dist/` y Vercel publica la carpeta tal cual (`vercel.json`, sin build). Por eso hay que reconstruir la app que se toque antes de hacer commit.

## Experiencias
Todas compilan (`npm run build`, verificado el 2026-11-03).

| Carpeta | Experiencia | Lenguaje | Estado |
|---|---|---|---|
| [`fotomaton/`](fotomaton/) | Fotomatón | los tres | Vigente. Cámara → efecto (trama CMYK, CRT, mosaico) → marco → tarjeta 1080×1350 y QR de descarga. Placas C, M, Y, K. |
| [`taller-mosaicos/`](taller-mosaicos/) | Taller de Mosaicos | Geométrica | Vigente. Módulos, paletas, multiplicar (repetir, simetría), formatos; deshacer y rehacer. |
| [`loops/`](loops/) | Teatro de Papel | Orgánica | Vigente. Escenarios, piezas animadas, línea de tiempo con keyframes A→B; video o PNG. *Lo edita la persona del equipo que lo trabaja.* |
| [`graffiti/`](graffiti/) | Graffiti y Tags | Pixel | Vigente. Spray con goteo, rodillo, plumón, stencil de 2 capas, stickers y muros; tarjeta PNG. |
| [`vagon/`](vagon/) | Vagón | Pixel | Vigente. Diseña el carro de metro; «sale a la vía» y pasa por el HUB. |
| [`audioreactiva/`](audioreactiva/) | Estación Audioreactiva | Geométrica | Vigente. 5 escenas que reaccionan al micrófono, consola de canales y graba un loop. |
| [`grabado/`](grabado/) | Taller de Grabado | Orgánica | Vigente (elegido sobre Telar). Tacos, tintas que se mezclan y registro corrido. |
| [`credencial/`](credencial/) | Credencial | los tres | Vigente, en el celular. Marco, foto o personaje, timbres por estación, canje con PIN. |
| [`hub-estacion/`](hub-estacion/) | HUB «Estación» | los tres | Vigente, para la pantalla del stand. Andén Pixel, mezanine Geométrico y plaza Orgánica con las personas y sus creaciones. |
| [`telar/`](telar/) | Telar | Orgánica | En pausa («en proceso»). |
| — | Jardín de Papel | Orgánica | Reemplazado por Grabado y Telar. |
| — | Taller de Píxeles | Pixel | Descartado. Su código vive en la rama `archive/taller-de-pixeles` y ya no está en el hub. |

## Comandos
Desde la raíz:
```bash
npm run build              # compila las 10 apps (deja cada <app>/dist/ listo para el hub)
npm run dev                # sirve la raíz en http://localhost:8080 (igual que dev:hub)
npm run dev:hub
```
Por experiencia, después de `npm --prefix <carpeta> install`:
```bash
npm run dev:fotomaton      # también: dev:mosaicos, dev:loops, dev:graffiti, dev:audioreactiva,
                           # dev:credencial, dev:hub-estacion, dev:telar, dev:grabado, dev:vagon
npm run dev:fotomaton:tablet   # abre la app en la red para probarla desde la tablet
                               # (existe para fotomaton, mosaicos, loops, graffiti y audioreactiva)
npm run dev:credencial:movil   # la credencial desde el celular
npm run build:graffiti         # compilar una sola app (build:<app>)
```

## Datos y secretos
- Sin variables de entorno, todo funciona **en modo local**: cada equipo guarda en su navegador.
- Con Supabase, el HUB recibe en vivo lo de todas las mesas. Guía en [`docs/supabase.md`](docs/supabase.md).
- Las claves van en `.env.local` dentro de cada app (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y, opcional, `VITE_STAFF_PIN_SHA256`). **Nunca en git.**
- El PIN del staff se configura en cada mesa con `?staff`. Sin PIN definido, el de demo es `0000`.

## Flujo de trabajo: local y nube con GitHub
- **Ramas:**
  - los agentes trabajan en ramas propias (`claude/…`, `ag/…`) o de rescate (`rescate/…`);
  - nadie hace push directo a `main`: todo entra por Pull Request.
- **Local:**
  - clonar, `npm --prefix <app> install` y `npm run dev:<app>`;
  - antes de cada commit, `npm --prefix <app> run build` en verde y el `dist/` reconstruido incluido en el commit;
  - commits convencionales: `tipo(app): descripción`.
- **Nube (Claude Code en la web):**
  - la sesión clona el repo en un contenedor y trabaja en su rama;
  - lo que no se sube con push se pierde al cerrar el contenedor;
  - hay que revisar que la rama tenga PR hacia `main`.
- **Vista previa sin hosting:** `node scripts/artifact-hub.mjs` arma `artifact-hub/` (ignorado por git), que se publica como Artifact de claude.ai para verlo en el celular.
- **Publicación:** Vercel sirve la raíz con los `dist/` versionados.
  - Proyecto de Vercel y dominio: **Pendiente de definir**.
  - Proyecto de Supabase del evento: **Pendiente de definir**.

## Más
- Propuesta de herramientas con barras fijas: [`docs/plans/005-herramientas-de-diseno.md`](docs/plans/005-herramientas-de-diseno.md)
- Muestra del kit de interfaz: [`docs/kit/muestra.html`](docs/kit/muestra.html)
- Figma ↔ código: [`FIGMA_SYNC.md`](FIGMA_SYNC.md)
