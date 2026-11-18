# 014 · Jugar en una mesa escaneando un QR

**Fecha:** 18 nov 2026 · **Pide:** Pipe · **Reemplaza:** escribir el código SD-XXXXX en la tablet (queda como plan B) y el «timbre a mano» del encargado (queda escondido en el botón).

## Flujo
1. La tablet muestra un QR para jugar: en la pantalla de entrada del modo juego y en el botón QR de arriba («Jugar con mi credencial»), para quien ya está jugando.
2. La persona lo escanea:
   - con su credencial (**Timbrar**), o
   - con la cámara del celular: si no tiene credencial, la crea y la mesa se asocia sola al terminar.
3. La credencial llama a `emparejar_mesa()`; la tablet pregunta cada 2,5 s con `leer_emparejamiento()` y, al ver el código, la persona queda como jugadora de esa mesa.
4. Al exportar su creación suma al timbre Creación (como con el código escrito). Si exportó **antes** de asociarse, suma al asociarse.
5. La asociación dura hasta que la experiencia vuelve al inicio (quiosco): la mesa queda libre para la siguiente persona.

## Piezas
- Base: `shared/supabase/migraciones/009-jugar-con-qr.sql` (tabla `emparejamientos`, sin acceso directo; dos funciones). El QR lleva la mesa y un número de un solo uso: el primero que lo escanea se queda con la mesa.
- Tablets: `QrJugar` en `shared/ui/QrEncargado.tsx`; `nuevoNonce`, `enlaceJugar`, `leerEmparejamiento` y lo creado sin jugador en `shared/juego.ts`.
- Credencial: ruta `#/mesa?m=&n=&a=` (`pages/Mesa.tsx`), el lector la reconoce, y el pedido pendiente se completa al crear la credencial (30 min).
- Una persona asociada suma su creación aunque el modo juego esté apagado: se asoció a propósito.

## Probado
- Pantalla de entrada en 1024 × 768 y 768 × 1024, sin scroll; el QR decodifica a `credencial/dist/#/mesa?m=…&n=…&a=graffiti`.
- Con la base simulada: al responder un código, la tablet entra sola a la experiencia con esa credencial.
- Falta: probarlo con Supabase y celulares reales (la migración 009 debe estar corrida).
