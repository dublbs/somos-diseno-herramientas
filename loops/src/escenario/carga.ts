import { useEffect, useState } from 'react';
import { ESCENARIOS, escenario } from './escenarios';
import { archivosDe, archivosFondo, pieza, type Pieza } from './piezas';
import { cargarLote } from './recursos';
import { dibujarPieza } from './dibujar';

// Carga por escenario con avance real: primero el escenario que se ve (fondo y sus piezas), después los otros
// en segundo plano, uno tras otro. Empieza apenas se abre la app (también mientras se lee el tutorial).
export interface EstadoCarga { hechas: number; total: number; listo: boolean }

const estados = new Map<string, EstadoCarga>();
const promesas = new Map<string, Promise<void>>();
const miniaturas = new Map<string, string>();
const avisar = new Set<() => void>();
const cambio = () => avisar.forEach(f => f());

const LADO_MINI = 144;
function miniatura(p: Pieza) {
  if (miniaturas.has(p.id)) return;
  const c = document.createElement('canvas');
  c.width = c.height = LADO_MINI;
  const x = c.getContext('2d')!, k = (LADO_MINI * 0.86) / Math.max(p.caja[2], p.caja[3]);
  x.translate(LADO_MINI / 2, LADO_MINI / 2); x.scale(k, k);
  dibujarPieza(x, p.id, p.durMs * (p.muestra ?? (p.durMs > 2000 ? 0.5 : 0.25)));
  miniaturas.set(p.id, c.toDataURL('image/png'));
}

export function cargarEscenario(id: string): Promise<void> {
  let p = promesas.get(id);
  if (p) return p;
  const esc = escenario(id);
  const piezas = Object.keys(esc.piezas).map(pieza);
  const archivos = [...archivosFondo(esc.fondo), ...piezas.flatMap(archivosDe)];
  estados.set(id, { hechas: 0, total: archivos.length, listo: false });
  p = cargarLote(archivos, (hechas, total) => { estados.set(id, { hechas, total, listo: false }); cambio(); })
    .then(() => { piezas.forEach(miniatura); estados.set(id, { ...estados.get(id)!, listo: true }); cambio(); });
  promesas.set(id, p);
  return p;
}

let precargando = false;
export function precargar(primero: string = ESCENARIOS[0].id) {
  if (precargando) return;
  precargando = true;
  cargarEscenario(primero).then(async () => {
    for (const e of ESCENARIOS) await cargarEscenario(e.id);
  });
}

export const estadoCarga = (id: string): EstadoCarga => estados.get(id) ?? { hechas: 0, total: 1, listo: false };
export const miniaturaDe = (id: string) => miniaturas.get(id);

// Se vuelve a pintar cuando cambia el avance de cualquier escenario.
export function useCarga(id: string) {
  const [, refrescar] = useState(0);
  useEffect(() => {
    const f = () => refrescar(n => n + 1);
    avisar.add(f);
    cargarEscenario(id);
    return () => { avisar.delete(f); };
  }, [id]);
  return estadoCarga(id);
}
