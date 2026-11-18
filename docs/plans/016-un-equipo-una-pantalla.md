# 016 · Un equipo, una pantalla

Pedido del 18 nov: «que las tablets solo tengan las experiencias, el celular solo la credencial y la Flip el HUB».

## Qué cambia en el código
| Equipo | Qué ve | Qué se quita (vuelve con `?staff`) |
|---|---|---|
| Tablets (Lenovo TB128FU) | El menú de experiencias (`…/`) y cada experiencia | En el menú: la tarjeta «Credencial» y el enlace «Pantalla HUB» |
| Celular | La credencial (`…/credencial/dist/`) | La flecha ← que llevaba al menú de las tablets |
| Flip | El HUB (`…/hub-estacion/dist/?prueba=0` o `?galeria`) | La flecha ← que llevaba al menú de las tablets |

- `?staff` es el mismo interruptor que ya usan las tablets para su configuración: el staff abre `…/?staff` y ve todo.
- Lo que cruza de un equipo a otro sigue funcionando: el QR de «Llévatela» abre la descarga en el celular, el QR del
  encargado timbra en la credencial y el HUB recibe lo que pasa en tablets y celulares.

## Cómo bloquear cada equipo (staff, antes de abrir)
El código quita los enlaces, pero cualquiera podría escribir otra dirección en el navegador. Para eso:

### Tablets Lenovo TB128FU (Android)
1. Abrir Chrome en `https://dublbs.github.io/somos-diseno-herramientas/` (el menú) y ponerlo en pantalla completa.
2. **Fijar la app:** Ajustes → Seguridad → Más ajustes de seguridad → **Fijar aplicaciones** → activar, con «Pedir PIN
   para dejar de fijar». Luego, en Recientes, tocar el ícono de Chrome → **Fijar**. Así no se sale de Chrome.
3. La barra de direcciones de Chrome sigue a la vista. Si se quiere quitar del todo, la alternativa es un navegador de
   quiosco (ej. Fully Kiosk Browser) con la URL del menú como inicio: queda a decisión del equipo.
4. El quiosco de cada experiencia vuelve sola al inicio a los 90 s sin uso.

### Celulares de las personas
- Nada que configurar: el QR de la entrada abre la credencial y desde ahí no hay salida hacia las experiencias.

### Pantalla Flip (Samsung Flip 2)
- Abrir en su navegador `https://dublbs.github.io/somos-diseno-herramientas/hub-estacion/dist/?prueba=0` en pantalla
  completa. Respaldo: `…/hub-estacion/dist/?galeria` (plan 014 §3).
- Sin la flecha ←, un toque accidental ya no saca el HUB de la pantalla.
