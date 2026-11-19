// La llegada del Inacapín (B-008): una escena corta, sin controles, entre el andén limpio y la pelea. Reemplaza la
// tarjeta «¡Llegó el Inacapín!». Lógica sin dibujo (la usan el dibujo del jefe y las pruebas).
// 0–0,5 s: las luces del andén titilan. 0,5–1,25 s: el Inacapín cae desde el techo. Al caer, el andén pasa de la hora
// punta al morado y rojo del jefe (hasta 2,05 s) y el Inacapín ruge. A los 2,8 s empieza la pelea; un toque la adelanta.
// Con `prefers-reduced-motion` no hay caída, aplastón ni titileo: el Inacapín aparece de pie y el color cambia igual.
import { ALTO_A } from './anden';
import { ALTO_JEFE } from './jefe';

export const LLEGADA_MS = 2800;
const CAE_DESDE = 500, CAE_HASTA = 1250, COLOR_HASTA = 2050, RUGE_DESDE = 1400, APLASTA_MS = 220;
const entre01 = (x: number) => Math.max(0, Math.min(1, x));

export interface Llegada {
  visible: boolean; // el Inacapín ya está en escena
  cae: number;      // celdas que le faltan para tocar el piso
  aplasta: number;  // 1 normal; menos de 1 justo al caer
  cambio: number;   // 0 = andén de la hora punta, 1 = andén del jefe
  apagon: boolean;  // las luces titilan (antes de que caiga)
  ruge: boolean;    // boca abierta y cartel «¡Llegó el Inacapín!»
  aterrizo: boolean;
}

export function escenaLlegada(ms: number, quieto = false): Llegada {
  const t = entre01((ms - CAE_DESDE) / (CAE_HASTA - CAE_DESDE));
  const aterrizo = ms >= CAE_HASTA, desdeSuelo = ms - CAE_HASTA;
  return {
    visible: ms >= CAE_DESDE,
    cae: quieto ? 0 : (1 - t * t) * (ALTO_A + ALTO_JEFE), // cae acelerando, desde sobre el techo
    aplasta: !quieto && aterrizo && desdeSuelo < APLASTA_MS ? 0.78 + 0.22 * (desdeSuelo / APLASTA_MS) : 1,
    cambio: entre01((ms - CAE_HASTA) / (COLOR_HASTA - CAE_HASTA)),
    apagon: !quieto && ms < CAE_DESDE && Math.floor(ms / 90) % 3 === 0,
    ruge: ms >= RUGE_DESDE,
    aterrizo,
  };
}
