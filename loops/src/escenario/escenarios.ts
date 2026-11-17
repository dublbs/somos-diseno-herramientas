import { FONDO, FONDO_BOSQUE, FONDO_DESIERTO, FONDO_MAR, pieza, type Capa } from './piezas';
import { ESCENARIO, cajaItem, quieto, type Item } from './dibujar';

// Cada escenario tiene su fondo fijo y las piezas que hacen sentido ahí.
// `zona` dice dónde vive cada pieza para «Sorpréndeme»: cielo, suelo o agua.
export type Zona = 'cielo' | 'suelo' | 'agua';

export interface Escenario {
  id: string;
  nombre: string;
  detalle: string;
  fondo: { dur: number; capas: Capa[] };
  piezas: Record<string, Zona>;
}

// Elenco estandarizado (plan 004): cada escenario tiene su astro, su ave, su animal, su planta emblema, su planta chica,
// su fruto o hallazgo y su artesanía. Donde hay dos opciones (Chagual/Cochayuyo, Carpintero/Chucao, Luna/Lluvia)
// van las dos para compararlas. Las piezas nuevas son bocetos (scripts/generar-bocetos.py).
export const ESCENARIOS: Escenario[] = [
  {
    id: 'cordillera', nombre: 'Cordillera', detalle: 'Montañas y cielo',
    fondo: FONDO,
    piezas: { sol: 'cielo', condor: 'cielo', huemul: 'suelo', araucaria: 'suelo', helecho: 'suelo', pina: 'suelo', kisa: 'suelo' },
  },
  {
    id: 'mar', nombre: 'Mar', detalle: 'Olas y costa',
    fondo: FONDO_MAR,
    piezas: { sol: 'cielo', gaviota: 'cielo', pinguino: 'suelo', pez: 'agua', cochayuyo: 'agua', chagual: 'suelo', doca: 'suelo', concha: 'suelo', canasto: 'suelo' },
  },
  {
    id: 'desierto', nombre: 'Desierto', detalle: 'Dunas y quiscos',
    fondo: FONDO_DESIERTO,
    piezas: { sol: 'cielo', picaflor: 'cielo', guanaco: 'suelo', quisco: 'suelo', ananuca: 'suelo', chanar: 'suelo', cantaro: 'suelo' },
  },
  {
    id: 'bosque', nombre: 'Bosque', detalle: 'Lluvia y alerces',
    fondo: FONDO_BOSQUE,
    piezas: { luna: 'cielo', lluvia: 'cielo', carpintero: 'cielo', copihue: 'cielo', pudu: 'suelo', chucao: 'suelo', alerce: 'suelo', maqui: 'suelo', telar: 'suelo' },
  },
];
export const escenario = (id: string) => ESCENARIOS.find(e => e.id === id)!;

// Alturas de cada zona en el escenario (0..240): el centro de la pieza cae dentro de este rango.
export const ZONAS: Record<Zona, [number, number]> = { cielo: [38, 82], agua: [118, 150], suelo: [150, 196] };
// Línea del suelo: las piezas de suelo se apoyan aquí (su borde de abajo).
export const PISO = 216;
const MARGEN = 4;

// Caja (centro y tamaño) de una pieza que cabe entera en el escenario.
export function dentro(tipo: string, escala: number, x: number, y: number) {
  const [, , bw, bh] = pieza(tipo).caja, w = bw * escala, h = bh * escala;
  const cx = (v: number, m: number) => (m * 2 >= ESCENARIO - 2 * MARGEN ? ESCENARIO / 2 : Math.min(ESCENARIO - m - MARGEN, Math.max(m + MARGEN, v)));
  return { x: cx(x, w / 2), y: cx(y, h / 2), w, h };
}

// Altura natural de una pieza en su zona: las de suelo se apoyan en el piso; las de agua, al medio; las de cielo, arriba.
export function alturaEnZona(escId: string, tipo: string, escala: number, azar = 0) {
  const zona = escenario(escId).piezas[tipo] ?? 'suelo';
  const [y0, y1] = ZONAS[zona], h = pieza(tipo).caja[3] * escala;
  if (zona === 'suelo') return PISO - h / 2 - azar * 18;
  if (zona === 'agua') return (y0 + y1) / 2 + (azar - 0.5) * (y1 - y0);
  return y0 + azar * (y1 - y0);
}

// Dónde cae una pieza nueva al tocarla en la biblioteca (plan 008, T-010): dentro de su zona, en la columna
// que menos se pisa con las piezas que ya están. Arrastrarla sigue dejándola donde se suelta.
export function posicionNueva(escId: string, tipo: string, escala: number, items: Item[]): { x: number; y: number } {
  const { w, h, y } = dentro(tipo, escala, ESCENARIO / 2, alturaEnZona(escId, tipo, escala));
  const cajas = items.map(it => cajaItem(quieto(it)));
  const xMin = Math.min(ESCENARIO / 2, w / 2 + MARGEN), xMax = Math.max(ESCENARIO / 2, ESCENARIO - w / 2 - MARGEN);
  let mejor = { x: ESCENARIO / 2, choque: Infinity, centro: Infinity };
  for (let x = xMin; x <= xMax + 0.01; x += 6) {
    let choque = 0;
    for (const b of cajas) {
      const ix = Math.min(x + w / 2, b.x + b.w) - Math.max(x - w / 2, b.x);
      const iy = Math.min(y + h / 2, b.y + b.h) - Math.max(y - h / 2, b.y);
      if (ix > 0 && iy > 0) choque += ix * iy;
    }
    const centro = Math.abs(x - ESCENARIO / 2);
    if (choque < mejor.choque - 1 || (Math.abs(choque - mejor.choque) <= 1 && centro < mejor.centro)) mejor = { x, choque, centro };
  }
  return { x: Math.round(mejor.x), y: Math.round(y) };
}
