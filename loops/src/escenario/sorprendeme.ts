import { type Item } from './dibujar';
import { alturaEnZona, dentro, escenario } from './escenarios';
import { escalaInicial, limitarEscala, pieza } from './piezas';

// «Sorpréndeme»: arma una escena sola con las piezas del escenario, repartidas por zonas
// (cielo arriba, agua al medio, suelo abajo). La persona la retoca después.
// Los tamaños salen del perfil de cada pieza (piezas.ts), con una variación chica.
const ASTROS = ['sol', 'luna', 'lluvia'];
const azar = (a: number, b: number) => a + Math.random() * (b - a);
const barajar = <T,>(l: T[]) => l.map(v => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(p => p[1]);

export function sorprendeme(escId: string, primerUid: number, max = 8): Item[] {
  const esc = escenario(escId);
  const ids = Object.keys(esc.piezas);
  const elegidas: string[] = [];
  // Un solo astro por escena (plan 008, T-015): nunca Luna y Lluvia juntas.
  const astros = barajar(ids.filter(i => ASTROS.includes(i)));
  if (astros.length) elegidas.push(astros[0]);
  // al menos una pieza de suelo, una de cielo y el resto al azar; una pieza puede repetirse una vez
  const suelo = barajar(ids.filter(i => esc.piezas[i] === 'suelo' || esc.piezas[i] === 'agua'));
  const cielo = barajar(ids.filter(i => esc.piezas[i] === 'cielo' && !ASTROS.includes(i)));
  elegidas.push(suelo[0], ...cielo.slice(0, 1));
  const resto = barajar([...suelo.slice(1), ...cielo.slice(1), ...suelo.slice(0, 2)]);
  const cuantas = Math.min(max, 5 + Math.floor(Math.random() * 3)); // 5 a 7 piezas
  for (const id of resto) { if (elegidas.length >= cuantas) break; elegidas.push(id); }

  // repartir en columnas para que no se pisen todas en el mismo lugar; cada pieza cabe entera (T-015)
  const n = elegidas.length, cols = barajar(Array.from({ length: n }, (_, i) => i));
  const items: Item[] = elegidas.map((tipo, i) => {
    const escala = +limitarEscala(tipo, escalaInicial(tipo) * azar(0.85, 1.1)).toFixed(3);
    const x0 = ((cols[i] + 0.5) / n) * 240 + azar(-8, 8);
    const pos = dentro(tipo, escala, x0, alturaEnZona(escId, tipo, escala, Math.random()));
    return {
      uid: 0, tipo, espejo: Math.random() < 0.5,
      variante: Math.floor(Math.random() * (pieza(tipo).variantes?.length ?? 1)),
      escala, x: Math.round(pos.x), y: Math.round(pos.y),
    };
  });
  // lo de abajo se dibuja al final: lo de más abajo en el escenario queda al frente
  items.sort((a, b) => (a.y + pieza(a.tipo).caja[3] * a.escala / 2) - (b.y + pieza(b.tipo).caja[3] * b.escala / 2));
  return items.map((it, i) => ({ ...it, uid: primerUid + i }));
}
