import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Kit v2 · manijas de transformación y gestos de deshacer (plan 012). Guía: shared/ui/README.md.

// Posición del CENTRO del objeto en unidades del lienzo (las del canvas: canvas.width × canvas.height), escala
// (1 = tamaño base `ancho` × `alto`) y giro en grados (horario).
export interface Transformacion { x: number; y: number; escala: number; giro: number }

interface PropsManijas {
  valor: Transformacion;
  // Se llama en cada movimiento (final=false) y una vez al soltar (final=true): guarda en el historial solo con final.
  onCambiar: (t: Transformacion, final: boolean) => void;
  ancho: number; alto: number;                   // tamaño del objeto con escala 1, en unidades del lienzo
  lienzo: { ancho: number; alto: number };       // tamaño del lienzo en sus unidades
  limites?: { min: number; max: number };        // lado mayor del objeto / lado menor del lienzo (por defecto 0,08 a 0,9)
  mover?: boolean; girar?: boolean; escalar?: boolean; // qué se permite (todo, por defecto)
  iman?: number;                                 // grados de imán a 0°, 90°, 180°, 270° (5 por defecto; 0 = sin imán)
  barrita?: React.ReactNode;                     // <BarritaSeleccion …/> sin ancla: se ubica sola sobre el objeto
  etiqueta?: string;                             // nombre accesible del objeto («Taco», «Stencil»)
}

const norm = (g: number) => { let a = ((g % 360) + 360) % 360; if (a > 180) a -= 360; return a; };
const conIman = (g: number, iman: number) => {
  const a = norm(g);
  for (const m of [-180, -90, 0, 90, 180]) if (Math.abs(a - m) <= iman) return m === -180 ? 180 : m;
  return a;
};
const ang = (dx: number, dy: number) => Math.atan2(dy, dx) * 180 / Math.PI;

type Tipo = 'mover' | 'girar' | 'escalar' | 'pellizco';
interface Gesto { tipo: Tipo; inicio: Transformacion; caja: DOMRect; k: number; punteros: Map<number, { x: number; y: number }>; p0: Map<number, { x: number; y: number }>; ultimo: Transformacion }

// Recuadro con manijas en una capa DOM encima del canvas. Va dentro de un contenedor position:relative que mide
// exactamente lo mismo que el canvas (por ejemplo LienzoAjustado). Arrastrar el cuerpo mueve, la manija de arriba
// gira, las esquinas escalan, y con dos dedos sobre el objeto se pellizca (escala) y se gira. Teclado: flechas
// mueven, [ y ] giran 15°, + y − escalan.
export const Manijas: React.FC<PropsManijas> = ({ valor, onCambiar, ancho, alto, lienzo, limites = { min: 0.08, max: 0.9 }, mover = true, girar = true, escalar = true, iman = 5, barrita, etiqueta = 'Objeto' }) => {
  const raiz = useRef<HTMLDivElement | null>(null);
  const [tam, setTam] = useState({ w: 0, h: 0 });
  const vRef = useRef(valor); vRef.current = valor;
  const cb = useRef(onCambiar); cb.current = onCambiar;
  const gesto = useRef<Gesto | null>(null);

  useLayoutEffect(() => {
    const el = raiz.current; if (!el) return;
    const medir = () => setTam({ w: el.clientWidth, h: el.clientHeight });
    medir();
    const ro = new ResizeObserver(medir); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lado = Math.max(ancho, alto), menor = Math.min(lienzo.ancho, lienzo.alto);
  const eMin = (limites.min * menor) / lado, eMax = (limites.max * menor) / lado;
  const limitar = (t: Transformacion): Transformacion => ({
    x: Math.max(0, Math.min(lienzo.ancho, t.x)), y: Math.max(0, Math.min(lienzo.alto, t.y)),
    escala: Math.max(eMin, Math.min(eMax, t.escala)), giro: iman > 0 ? conIman(t.giro, iman) : norm(t.giro),
  });
  const lim = useRef(limitar); lim.current = limitar;

  // Un solo juego de escuchas en window por gesto: así el segundo dedo puede caer fuera del objeto.
  const empezar = (tipo: Tipo, e: React.PointerEvent) => {
    if (gesto.current) return;
    e.stopPropagation(); e.preventDefault();
    const el = raiz.current; if (!el) return;
    const caja = el.getBoundingClientRect();
    const p = { x: e.clientX, y: e.clientY };
    const g: Gesto = { tipo, inicio: { ...vRef.current }, caja, k: caja.width / lienzo.ancho, punteros: new Map([[e.pointerId, p]]), p0: new Map([[e.pointerId, p]]), ultimo: { ...vRef.current } };
    gesto.current = g;

    const centro = (t: Transformacion) => ({ x: g.caja.left + t.x * g.k, y: g.caja.top + t.y * g.k });
    const calcular = (): Transformacion => {
      const t0 = g.inicio;
      const [a, b] = [...g.punteros.keys()];
      if (g.tipo === 'pellizco' && b !== undefined) {
        const A0 = g.p0.get(a)!, B0 = g.p0.get(b)!, A = g.punteros.get(a)!, B = g.punteros.get(b)!;
        const d0 = Math.hypot(B0.x - A0.x, B0.y - A0.y) || 1, d = Math.hypot(B.x - A.x, B.y - A.y);
        const m0 = { x: (A0.x + B0.x) / 2, y: (A0.y + B0.y) / 2 }, m = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
        return {
          x: mover ? t0.x + (m.x - m0.x) / g.k : t0.x, y: mover ? t0.y + (m.y - m0.y) / g.k : t0.y,
          escala: escalar ? t0.escala * d / d0 : t0.escala,
          giro: girar ? t0.giro + ang(B.x - A.x, B.y - A.y) - ang(B0.x - A0.x, B0.y - A0.y) : t0.giro,
        };
      }
      const P0 = g.p0.get(a)!, P = g.punteros.get(a)!, c = centro(t0);
      if (g.tipo === 'mover') return { ...t0, x: t0.x + (P.x - P0.x) / g.k, y: t0.y + (P.y - P0.y) / g.k };
      if (g.tipo === 'girar') return { ...t0, giro: t0.giro + ang(P.x - c.x, P.y - c.y) - ang(P0.x - c.x, P0.y - c.y) };
      const d0 = Math.hypot(P0.x - c.x, P0.y - c.y) || 1;
      return { ...t0, escala: t0.escala * Math.hypot(P.x - c.x, P.y - c.y) / d0 };
    };

    const abajo = (ev: PointerEvent) => {
      if (g.punteros.size !== 1 || g.punteros.has(ev.pointerId) || ev.pointerType !== 'touch' || !(escalar || girar)) return;
      ev.stopPropagation(); ev.preventDefault();
      const q = { x: ev.clientX, y: ev.clientY };
      g.punteros.set(ev.pointerId, q);
      // el pellizco parte desde donde quedó el objeto
      g.inicio = { ...g.ultimo }; g.tipo = 'pellizco';
      g.p0 = new Map([...g.punteros].map(([id, v]) => [id, { ...v }]));
    };
    const mueve = (ev: PointerEvent) => {
      if (!g.punteros.has(ev.pointerId)) return;
      ev.preventDefault();
      g.punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      g.ultimo = lim.current(calcular());
      cb.current(g.ultimo, false);
    };
    const fin = (ev: PointerEvent) => {
      if (!g.punteros.has(ev.pointerId)) return;
      window.removeEventListener('pointerdown', abajo, true);
      window.removeEventListener('pointermove', mueve, true);
      window.removeEventListener('pointerup', fin, true);
      window.removeEventListener('pointercancel', fin, true);
      gesto.current = null;
      cb.current(g.ultimo, true);
    };
    window.addEventListener('pointerdown', abajo, true);
    window.addEventListener('pointermove', mueve, { capture: true, passive: false });
    window.addEventListener('pointerup', fin, true);
    window.addEventListener('pointercancel', fin, true);
  };

  const tecla = (e: React.KeyboardEvent) => {
    const v = vRef.current, paso = (e.shiftKey ? 0.05 : 0.01) * menor;
    const m: Record<string, Partial<Transformacion>> = {
      ArrowLeft: { x: v.x - paso }, ArrowRight: { x: v.x + paso }, ArrowUp: { y: v.y - paso }, ArrowDown: { y: v.y + paso },
      '[': { giro: v.giro - 15 }, ']': { giro: v.giro + 15 }, '+': { escala: v.escala * 1.1 }, '=': { escala: v.escala * 1.1 }, '-': { escala: v.escala / 1.1 },
    };
    const c = m[e.key]; if (!c) return;
    if ((('x' in c || 'y' in c) && !mover) || ('giro' in c && !girar) || ('escala' in c && !escalar)) return;
    e.preventDefault();
    cb.current(limitar({ ...v, ...c }), true);
  };

  const k = tam.w && lienzo.ancho ? tam.w / lienzo.ancho : 0;
  const bw = ancho * valor.escala * k, bh = alto * valor.escala * k;
  const cx = valor.x * k, cy = valor.y * k;
  // radio del recuadro girado + la manija de giro: la barrita va por fuera
  const r = Math.hypot(bw, bh) / 2 + (girar ? 40 : 8);

  return (
    <div ref={raiz} className="h-manijas" data-h-sin-gestos="">
      {k > 0 && (
        <div className="h-caja" role="group" tabIndex={0} aria-label={`${etiqueta}: flechas para mover, [ y ] para girar, + y − para cambiar el tamaño`}
          style={{ width: bw, height: bh, transform: `translate(${cx - bw / 2}px, ${cy - bh / 2}px) rotate(${valor.giro}deg)`, cursor: mover ? 'move' : 'default' }}
          onPointerDown={e => mover || escalar || girar ? empezar(mover ? 'mover' : 'pellizco', e) : undefined} onKeyDown={tecla}>
          {girar && (<>
            <span className="h-tallo" style={{ top: -32, height: 32 }} aria-hidden="true" />
            <span className="h-manija giro" style={{ left: '50%', top: -36 }} aria-hidden="true" onPointerDown={e => empezar('girar', e)} />
          </>)}
          {escalar && [[0, 0], [100, 0], [100, 100], [0, 100]].map(([x, y], i) => (
            <span key={i} className={'h-manija esq-' + i} style={{ left: x + '%', top: y + '%' }} aria-hidden="true" onPointerDown={e => empezar('escalar', e)} />
          ))}
        </div>
      )}
      {k > 0 && barrita && <Anclado x={cx} y={cy - r} abajo={cy + r}>{barrita}</Anclado>}
    </div>
  );
};

// Ubica a sus hijos centrados sobre (x, y) dentro de su contenedor posicionado; si no caben arriba, van bajo `abajo`.
const Anclado: React.FC<{ x: number; y: number; abajo: number; children: React.ReactNode }> = ({ x, y, abajo, children }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current, padre = el?.offsetParent as HTMLElement | null;
    if (!el || !padre) return;
    const W = padre.clientWidth, H = padre.clientHeight, w = el.offsetWidth, h = el.offsetHeight, m = 6;
    let top = y - h - 4;
    if (top < m) top = Math.min(H - h - m, abajo + 4);
    setPos({ left: Math.max(m, Math.min(W - w - m, x - w / 2)), top: Math.max(m, top) });
  }, [x, y, abajo]);
  return <div ref={ref} className="h-anclada" style={pos ? pos : { left: 0, top: 0, visibility: 'hidden' }} onPointerDown={e => e.stopPropagation()}>{children}</div>;
};

// ---------------------------------------------------------------- gestos: 2 dedos deshace, 3 dedos rehace (Affinity)
// Escucha toques (solo `pointerType === 'touch'`) sobre `ref`. Un toque corto (< 450 ms, sin arrastrar) con 2 dedos
// llama onDeshacer; con 3, onRehacer. Dibujar con un dedo no se ve afectado. Cuando cae el segundo dedo llama
// `alMultitoque` una vez: ahí la app descarta el trazo que empezó el primer dedo (useHistorial().anular()).
// `hayVariosDedos()` sirve para ignorar el pointerdown de los dedos extra en el lienzo (o usar `e.isPrimary`).
// Lo que esté dentro de [data-h-sin-gestos] (manijas, barritas) no cuenta.
export function useGestosHistorial(ref: React.RefObject<HTMLElement | null>, opciones: { onDeshacer: () => void; onRehacer: () => void; alMultitoque?: () => void; activo?: boolean }) {
  const cb = useRef(opciones); cb.current = opciones;
  const dedos = useRef(0);
  const unido = useRef<{ el: HTMLElement; soltar: () => void } | null>(null);
  const activo = opciones.activo !== false;
  // Sin lista de dependencias: el elemento puede aparecer después (tras el tutorial) o cambiar.
  useEffect(() => {
    const el = activo ? ref.current : null;
    if (unido.current?.el === el) return;
    unido.current?.soltar(); unido.current = null;
    if (!el) return;
    let s: { inicio: number; max: number; abiertos: Map<number, { x: number; y: number }>; movio: boolean; avisado: boolean } | null = null;
    const abajo = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      if ((e.target as Element | null)?.closest?.('[data-h-sin-gestos]')) return;
      if (!s) s = { inicio: performance.now(), max: 0, abiertos: new Map(), movio: false, avisado: false };
      s.abiertos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      s.max = Math.max(s.max, s.abiertos.size); dedos.current = s.abiertos.size;
      if (s.abiertos.size >= 2 && !s.avisado) { s.avisado = true; cb.current.alMultitoque?.(); }
    };
    const mueve = (e: PointerEvent) => {
      const p = s?.abiertos.get(e.pointerId);
      if (s && p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 24) s.movio = true;
    };
    const arriba = (e: PointerEvent) => {
      if (!s || !s.abiertos.has(e.pointerId)) return;
      if (e.type === 'pointercancel') s.movio = true;
      s.abiertos.delete(e.pointerId); dedos.current = s.abiertos.size;
      if (s.abiertos.size > 0) return;
      const corto = performance.now() - s.inicio < 450 && !s.movio;
      if (corto && s.max === 2) cb.current.onDeshacer();
      else if (corto && s.max === 3) cb.current.onRehacer();
      s = null;
    };
    el.addEventListener('pointerdown', abajo, true);
    window.addEventListener('pointermove', mueve, true);
    window.addEventListener('pointerup', arriba, true);
    window.addEventListener('pointercancel', arriba, true);
    unido.current = {
      el, soltar: () => {
        el.removeEventListener('pointerdown', abajo, true);
        window.removeEventListener('pointermove', mueve, true);
        window.removeEventListener('pointerup', arriba, true);
        window.removeEventListener('pointercancel', arriba, true);
        dedos.current = 0;
      },
    };
  });
  useEffect(() => () => { unido.current?.soltar(); unido.current = null; }, []);
  return { hayVariosDedos: () => dedos.current > 1 };
}
