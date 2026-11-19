# Prueba con un grupo de personas, sin demo (18–19 nov)

Objetivo: recorrer la experiencia completa como en el evento —celulares de verdad, tablets en modo juego, Supabase
real— y ver dónde se traba la gente. Lo que salga se anota aquí y después pasa a un documento de correcciones
(`docs/tasks/NNN-correcciones-*.md`, regla de `AGENTS.md`).

Sitio: `https://dublbs.github.io/somos-diseno-herramientas/` (GitHub Pages publica `main`).

## 1. Antes de empezar (staff, 20 min)
- [ ] **Supabase → SQL Editor:** correr `shared/supabase/migraciones/008-config-mesas.sql` (las tablets siguen al PC
      madre). Confirmar que están corridas `006-timbre-flyer.sql` y `007-afiche-por-diseno.sql` (T-18): sin ellas no
      hay timbre 4 ni cacería por cámara. Anotar en `shared/supabase/migraciones/README.md`.
- [ ] **PC madre** (`…/admin/dist/`), con cuenta admin:
  - [ ] Configuración: PIN del canje (deja de valer el `0000`).
  - [ ] Canje: stock y límite diario del premio para la prueba (ej. stock 20).
  - [ ] Mesas: «Modo juego» encendido y el código de la estación 2 igual al de los QR impresos.
- [ ] **Tablets** (Lenovo TB128FU): abrir cada experiencia desde el hub (`…/`), en horizontal y pantalla completa.
      Deben pedir «Escribe el código de tu credencial» sin pasar por `?staff`. Si una muestra «Ojo: esta tablet tiene el
      código de demostración», la migración 008 no está corrida.
- [ ] **HUB** en la Flip o un Mac: `…/hub-estacion/dist/?prueba=0` (sin `?prueba=0` aparecen 40 personas inventadas
      hasta que entre el PR #34). Debe decir «En vivo» y 0 personas al partir. Respaldo: `…/hub-estacion/dist/?galeria`.
- [ ] **Afiches de la cacería** impresos (o en pantalla) pegados en distintos puntos.
- [ ] **QR de la entrada** impreso, que abre `…/credencial/dist/` en el celular.
- [ ] **Credenciales de prueba:** se borran solas a las 24 h (cron `somos-borrar-24h`). Si la prueba es el 18, las
      del grupo desaparecen antes del evento; igual conviene que usen nombres reconocibles (ej. «Prueba Ana»).

## 2. Lo que se le dice al grupo (nada más)
> «Esto es lo que va a ver la gente en el evento. Escaneen el QR de la entrada y hagan lo que les parezca. Si se
> traban, digan en voz alta qué esperaban que pasara. No les vamos a ayudar salvo que se queden pegados más de un
> minuto.»

No explicar la credencial, los timbres ni el premio: justamente queremos ver si se entiende solo.

## 3. Quién mira qué
- **Una persona del staff por cada 2–3 participantes**, con esta hoja. Mira sin intervenir.
- **Una persona en el PC madre** (Personas y Mesas): ve llegar credenciales y timbres en vivo.
- **Una persona junto al HUB:** ¿aparece la gente? ¿llegan las obras a los cuadros de la mezanina? (eso entra con
  `amaro/ronda-3b`; si aún no está en `main`, no se verá).

## 4. Qué observar (marcar con la hora)
| Momento | Pregunta | Anotar |
|---|---|---|
| Entrada | ¿Entienden para qué es la credencial antes de crearla? | Tiempo hasta crearla; dudas |
| Credencial | ¿Leen «Tu recorrido»? ¿Encuentran su código? | |
| Tablet | ¿Escriben bien el código? ¿Saben cuándo terminaron («Llévatelo»)? | Errores de código |
| Tablet | ¿Les llega la creación al celular? ¿En cuánto tiempo? | Segundos |
| Inventario | ¿Encuentran el inventario y el avance de los timbres? | Dónde lo buscaron |
| Cacería | ¿La cámara reconoce el afiche? ¿Con qué luz o distancia falla? | Afiche, intentos |
| Flyer | ¿Lo encuentran y lo guardan? | |
| Canje | ¿Saben a quién mostrar la credencial? ¿El PIN funciona? ¿Baja el stock? | |
| HUB | ¿Se ven en la pantalla? ¿Les importa? | |
| General | ¿Qué abandonaron y por qué? ¿Cuánto tardó el recorrido completo? | |

También anotar: modelo del celular (iPhone/Android), si la tablet se trabó o se recargó, y cualquier mensaje de
error tal cual.

## 5. Al terminar (10 min)
- Preguntas cortas al grupo: ¿qué fue lo más confuso? ¿qué les gustó? ¿lo harían en el evento?
- PC madre → Personas: cuántas credenciales llegaron a 4 de 4 y cuántas canjearon.
- PC madre → Mesas: «Reiniciar todas las tablets».
- Pasar lo anotado a la bitácora (abajo) y de ahí a `docs/tasks/NNN-correcciones-prueba-grupo.md`.

## 6. Bitácora de la prueba
_(llenar durante la prueba: hora · quién · qué pasó)_
