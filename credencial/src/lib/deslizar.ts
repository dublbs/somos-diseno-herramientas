import { useEffect, useRef } from 'react';

// Gesto horizontal entre la credencial y la vista Juego (plan 010).
// Dedo hacia la derecha (+1) abre Juego; hacia la izquierda (-1) vuelve. Para invertirlo, cambia este signo.
export const HACIA_JUEGO: 1 | -1 = 1;

const MIN_PX = 56; // recorrido mínimo
const PROPORCION = 1.6; // más horizontal que vertical
const MAX_MS = 900; // un deslizamiento, no un arrastre lento

// La pantalla que entra sabe desde qué lado llega (para animarla); se consume una sola vez.
let entrada: 'izquierda' | 'derecha' | null = null;
export function tomarEntrada() { const e = entrada; entrada = null; return e; }

// Escucha en todo el documento (no en la pantalla): así el gesto funciona aunque la pantalla esté entrando animada.
export function useDeslizar(alDeslizar: (dir: 1 | -1) => void) {
  // Justo después de deslizar, el click que dispara el navegador se ignora (para no girar la credencial).
  const recien = useRef(false);
  const accion = useRef(alDeslizar);
  accion.current = alDeslizar;

  useEffect(() => {
    let inicio: { x: number; y: number; t: number; id: number } | null = null, temporizador = 0;
    const abajo = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if ((e.target as Element | null)?.closest?.('input, textarea, .timbrado')) return;
      inicio = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId };
    };
    const arriba = (e: PointerEvent) => {
      const i = inicio;
      inicio = null;
      if (!i || i.id !== e.pointerId) return;
      const dx = e.clientX - i.x, dy = e.clientY - i.y;
      if (Math.abs(dx) < MIN_PX || Math.abs(dx) < PROPORCION * Math.abs(dy) || e.timeStamp - i.t > MAX_MS) return;
      const dir = dx > 0 ? 1 : -1;
      recien.current = true;
      clearTimeout(temporizador);
      temporizador = window.setTimeout(() => { recien.current = false; }, 400);
      entrada = dir > 0 ? 'izquierda' : 'derecha';
      accion.current(dir);
    };
    const cancelar = () => { inicio = null; };
    document.addEventListener('pointerdown', abajo);
    document.addEventListener('pointerup', arriba);
    document.addEventListener('pointercancel', cancelar);
    return () => {
      clearTimeout(temporizador);
      document.removeEventListener('pointerdown', abajo);
      document.removeEventListener('pointerup', arriba);
      document.removeEventListener('pointercancel', cancelar);
    };
  }, []);

  return { recien };
}
