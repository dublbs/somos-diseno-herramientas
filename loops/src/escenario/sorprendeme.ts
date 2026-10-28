import { ESCENARIO, type Item } from './dibujar';
import { escenario, type Zona } from './escenarios';
import { pieza } from './piezas';

// «Sorpréndeme»: arma una escena sola con las piezas del escenario, repartidas por zonas
// (cielo arriba, agua al medio, suelo abajo). La persona la retoca después.
const ESCALA: Record<string, number> = {
  pudu: 0.7, paloma: 0.5, sol: 0.8, araucaria: 0.9, pina: 0.6, helecho: 0.8, quisco: 0.8, flor: 0.6,
  pez: 0.6, pinguino: 0.55, cantaro: 0.5, canasto: 0.5, kisa: 0.65,
};
const Y: Record<Zona, [number, number]> = { cielo: [38, 82], agua: [118, 150], suelo: [150, 188] };
const azar = (a: number, b: number) => a + Math.random() * (b - a);
const barajar = <T,>(l: T[]) => l.map(v => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(p => p[1]);

export function sorprendeme(escId: string, primerUid: number): Item[] {
  const esc = escenario(escId);
  const ids = Object.keys(esc.piezas);
  const elegidas: string[] = [];
  if (ids.includes('sol')) elegidas.push('sol');
  // al menos una pieza de suelo, una de cielo y el resto al azar; una pieza puede repetirse una vez
  const suelo = barajar(ids.filter(i => esc.piezas[i] === 'suelo' || esc.piezas[i] === 'agua'));
  const cielo = barajar(ids.filter(i => esc.piezas[i] === 'cielo' && i !== 'sol'));
  elegidas.push(suelo[0], cielo[0]);
  const resto = barajar([...suelo.slice(1), ...cielo.slice(1), ...suelo.slice(0, 2)]);
  const cuantas = 5 + Math.floor(Math.random() * 3); // 5 a 7 piezas
  for (const id of resto) { if (elegidas.length >= cuantas) break; elegidas.push(id); }

  // repartir en columnas para que no se pisen todas en el mismo lugar
  const n = elegidas.length, cols = barajar(Array.from({ length: n }, (_, i) => i));
  const items: Item[] = elegidas.map((tipo, i) => {
    const [y0, y1] = Y[esc.piezas[tipo]];
    const k = ESCALA[tipo] ?? 0.6;
    return {
      uid: 0, tipo, espejo: Math.random() < 0.5,
      variante: Math.floor(Math.random() * (pieza(tipo).variantes?.length ?? 1)),
      escala: +(k * azar(0.65, 0.95)).toFixed(2),
      x: Math.round(Math.min(ESCENARIO - 26, Math.max(26, ((cols[i] + 0.5) / n) * ESCENARIO + azar(-8, 8)))),
      y: Math.round(azar(y0, y1)),
    };
  });
  // lo de abajo se dibuja al final: lo de más abajo en el escenario queda al frente
  items.sort((a, b) => a.y - b.y);
  return items.map((it, i) => ({ ...it, uid: primerUid + i }));
}
