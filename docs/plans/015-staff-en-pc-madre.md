# 015 · Las herramientas del staff, en el PC madre

Pedido del 18 nov: «dejar todas las herramientas de staff en el PC madre». Hasta hoy cada tablet se configuraba sola en
`?staff` (modo juego, código de la estación 2, PIN, reiniciar mesa) y quedaba guardado en su navegador: si alguien se
olvidaba de una tablet, seguía con el código `DEMO` (aviso «Ojo: esta tablet tiene el código de demostración»).

## Qué cambia
| Herramienta | Antes (en cada tablet, `?staff`) | Ahora |
|---|---|---|
| Modo juego | Interruptor por tablet | **PC madre → Mesas**: un interruptor para todas las tablets |
| Código de la estación 2 | Se escribía a mano en cada tablet | **Lo reparte la base** (`sellos_def`, estación 2): nadie lo escribe. El PC madre lo muestra para revisarlo con los QR impresos |
| PIN del staff | Uno por tablet (hash local) o `VITE_STAFF_PIN_SHA256` | **El PIN del canje** (PC madre → Configuración) también abre `?staff` en las tablets |
| Reiniciar mesa | Botón en la tablet | **PC madre → Mesas**: «Reiniciar todas» y «Reiniciar» por mesa. La tablet borra la sesión (código de la persona) y vuelve a pedir el código |

- Las tablets leen la configuración al abrir y cada 30 s (`config_mesas()`, migración `008-config-mesas.sql`). Con 8–10
  tablets son unas 20 consultas por minuto.
- **Sin red o sin la migración**, la tablet sigue con lo último que guardó (o con su configuración local de siempre).
  `?staff` queda como **respaldo de emergencia**: muestra lo que manda el PC madre y deja cambiarlo solo en esa tablet
  hasta que vuelva la conexión.

## Riesgo aceptado
- `config_mesas()` entrega el código de la estación 2 a cualquiera con la clave pública. Ese código ya está impreso en
  los QR de la estación y lo muestra el botón del encargado en cada tablet (#31): no es secreto en la práctica. Con él
  solo se suma un paso de Creación en una experiencia; no se obtienen premios (el canje exige el PIN en persona).
- `verificar_pin_staff()` dice si un PIN es correcto, igual que `canjear()` ya lo dice con `pin_incorrecto`. No agrega
  exposición nueva.

## Pasos para el equipo
1. Correr `shared/supabase/migraciones/008-config-mesas.sql` en el SQL Editor de `somos-diseno` y anotarlo en
   `shared/supabase/migraciones/README.md`.
2. PC madre → Configuración: definir el PIN (si no hay).
3. PC madre → Mesas: revisar que el código de la estación 2 coincida con los QR impresos y encender el modo juego.
