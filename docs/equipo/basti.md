# Cola de Basti · carril Plataforma

Zona: `credencial/`, `admin/` (PC madre), `hub-estacion/` (HUB y Flip), `accesos/`, `shared/juego.ts`,
`shared/datos.ts`, `shared/ui/Juego.tsx`, `shared/supabase/`, `scripts/qa-base/`, `docs/qa/`.
Reglas y pipeline: [`README.md`](README.md).

**El orden de este archivo es la prioridad.** Se toma la primera tarea en estado «Lista».

**El agente nunca corre SQL en producción.** Escribe la migración y la prueba en local; la corre una persona.

## B-002 · Rescatar el trabajo que quedó en ramas sin PR
- Estado: Lista. **Antes de empezar**, pregunta a Amaro o Felipe si alguien sigue trabajando en `claude/escaner-afiches`:
  se movió el 19 nov.
- Origen: E-004
- Ramas:
  - `amaro/ronda-3b`: Chas de Audioreactiva y obras en los cuadros de la Mezanina del HUB.
  - `claude/escaner-afiches`: credencial.
  - `claude/pauta-prueba-grupo`: `docs/qa/`.
- Cambio, para cada rama:
  1. Créale una rama nueva desde `origin/main`, con el nombre `basti/rescate-<tema>`, y une la rama vieja a ella. Los
     conflictos en `dist/` se resuelven recompilando.
  2. Corre `npx tsc --noEmit` y el build de las apps que toca.
  3. Haz la prueba de humo: el HUB en 1920×1080 y la credencial en 390×844.
  4. Abre un PR con lo que trae, qué se probó y qué no.
  - `amaro/ronda-3b` toca `audioreactiva/`, que es del carril de Thomas: no cambies nada ahí, solo recompila. Pídele a
    Thomas que pruebe el Chas en la tablet (anótalo en el PR).
- Aceptación: tres PR abiertos y en verde, o el motivo escrito de por qué uno no tiene sentido.

## B-001 · Prueba de humo de la base en producción (solo lectura)
- Estado: Lista. El script se puede hacer ya; correrlo con sentido requiere que una persona haya corrido 008→011 (E-003).
- Origen: E-003
- Archivos: nuevo `scripts/qa-base/prod-humo.sh` (o `.mjs`) y una sección en `docs/qa/qa-base-de-datos.md`.
- Cambio:
  - Con la URL y la clave publishable del `.env.local` (nunca en el repo), llama a cada RPC que usa el código publicado
    con argumentos que no escriben: códigos que no existen, por ejemplo `SD-ZZZZZ`.
  - RPC a revisar: `config_mesas`, `verificar_pin_staff`, `emparejar_mesa`, `leer_emparejamiento`, `metas`, `sellar`,
    `sellar_flyer`, `encontrar_afiche`, `reconocer_afiche`, `canjear`, `suscribir_push`, `codigo_credencial`,
    `resumen_evento`.
  - Para cada una, el script dice «existe» (respuesta ≠ 404) o «falta (migración NNN)».
  - Prueba también `GET /functions/v1/tarjeta?id=x` (debe responder 400).
- No tocar: ningún dato. Nada de `insert`, `update` ni llamadas que creen filas.
- Aceptación: el comando imprime una tabla RPC → estado → migración, y tras correr 008→011 todo dice «existe».

## B-003 · Informe de los PR viejos (#34, #38, #48, #35)
- Estado: Lista
- Origen: E-005
- Archivos: escribe solo `docs/qa/pr-pendientes.md`.
- Cambio, para cada PR:
  - qué trae, en 3 líneas;
  - si choca con `main` (prueba el merge en una rama local, sin empujarla);
  - si `main` ya lo resolvió de otra forma (compara con #49, #51 y #53);
  - recomendación: mergear, rehacer o cerrar.
  - #35 (imgbot): revisa que las imágenes optimizadas no rompan los `dist/`.
- No tocar: los PR. No comentes, no cierres, no mergees.
- Aceptación: Amaro o Felipe pueden decidir cada PR leyendo solo ese archivo.

## B-004 · Informe de uso del evento (cifras sin datos personales)
- Estado: Lista
- Archivos: nuevo `scripts/informe-evento.mjs` y `docs/qa/informe-evento-19nov.md`.
- Cambio:
  - Script de solo lectura con la clave publishable. Cuenta:
    - credenciales creadas;
    - timbres por estación;
    - canjes;
    - eventos por experiencia y por hora;
    - afiches encontrados.
  - Usa `resumen_evento()` si la 010 está corrida; si no, `eventos` con `select`.
  - **Solo cifras**: nada de nombres, códigos ni fotos en el informe ni en el repo.
- Aceptación: el informe responde cuántas personas jugaron, cuántas completaron los 4 timbres y qué experiencia se usó
  más.

## B-005 · Qué datos personales se guardan después del evento
- Estado: Bloqueada (decisión de Amaro y Felipe: qué se borra y cuándo; va en un plan nuevo antes de construir)
- Contexto:
  - «Llévatela» ya se borra a las 24 h (cron `somos-borrar-24h` y `fotomaton-limpiar`).
  - Las credenciales (nombres, selfies de marcos) y los eventos no tienen fecha de borrado.
- Cuando se decida: migración nueva `NNN-borrado-post-evento.sql` y, si se pide, un botón en el PC madre.

## Hallazgos
<!-- El agente agrega aquí lo que encuentre fuera de su tarea: «- dd/mm · app · qué · evidencia». Amaro o Felipe lo
pasan a la bitácora. -->
