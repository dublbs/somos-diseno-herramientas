import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PIEZAS, pieza } from '../escenario/piezas';
import { ESCENARIOS, escenario } from '../escenario/escenarios';
import { sorprendeme } from '../escenario/sorprendeme';
import { cargarFuentesTarjeta, dibujarTarjetaMotion, exportarTarjetaMotion } from '../lib/exportarTarjeta';
import { duracionLoop, grabarLoop, puedeGrabar } from '../lib/grabarLoop';
import type { VideoLoop } from './ModalExportar';
import {
  ASA, ESCENARIO, cajaItem, cargarTodo, dibujarEscenario, dibujarPieza, dibujarSeleccion, type Item,
} from '../escenario/dibujar';

interface Props {
  onExportar: (canvas: HTMLCanvasElement) => void;
  onVideo: (tarjetaPng: Blob, video: VideoLoop) => void;
}

type Gesto =
  | { tipo: 'mover'; uid: number; dx: number; dy: number; movido: boolean }
  | { tipo: 'escalar'; uid: number; d0: number; e0: number; movido: boolean };
type Mapa = Record<string, Item[]>;

const ESCALA_INICIAL: Record<string, number> = {
  pudu: 0.75, paloma: 0.6, sol: 1, araucaria: 1, pina: 0.7, helecho: 0.8, quisco: 0.8, flor: 0.7,
  pez: 0.7, pinguino: 0.55, cantaro: 0.5, canasto: 0.5, kisa: 0.7,
};
const durDe = (it: Item) => {
  const p = pieza(it.tipo);
  return p.variantes?.[it.variante ?? 0]?.durMs ?? p.durMs;
};
// Se puede achicar hasta casi un adorno (la piña de araucaria, por ejemplo) y agrandar hasta cuatro veces.
const ESCALA_MIN = 0.08, ESCALA_MAX = 4;
const limitar = (n: number) => Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, n));
const FPS = [8, 12, 24];

export const EscenarioOrganico: React.FC<Props> = ({ onExportar, onVideo }) => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  // Cada escenario guarda sus propias piezas: al volver de otro escenario, lo armado sigue ahí.
  const [escId, setEscId] = useState(ESCENARIOS[0].id);
  const [mapa, setMapa] = useState<Mapa>({});
  const [sel, setSel] = useState<number | null>(null);
  const [fps, setFps] = useState(12);
  const [pausado, setPausado] = useState(false);
  const [borde, setBorde] = useState(true); // borde de papel y sombra en cada pieza
  const [listo, setListo] = useState(false);
  const [grabando, setGrabando] = useState<number | null>(null); // 0..1 mientras graba
  const [errorVideo, setErrorVideo] = useState('');
  const [puedeDeshacer, setPuedeDeshacer] = useState(false);
  const [miniaturas, setMiniaturas] = useState<Record<string, string>>({});

  const esc = escenario(escId);
  const items = mapa[escId] ?? [];

  // Estado leído por el loop de dibujo y por los manejadores sin recrearlos.
  const vivo = useRef({ items, sel, fps, pausado, fondo: esc.fondo, mapa, escId, borde });
  vivo.current = { items, sel, fps, pausado, fondo: esc.fondo, mapa, escId, borde };
  const gesto = useRef<Gesto | null>(null);
  const antesDelGesto = useRef<Mapa | null>(null);
  const historial = useRef<Mapa[]>([]);
  const uidSig = useRef(1);

  const registrar = useCallback((m: Mapa = vivo.current.mapa) => {
    historial.current.push(m);
    if (historial.current.length > 40) historial.current.shift();
    setPuedeDeshacer(true);
  }, []);
  // Cambia solo las piezas del escenario que se está viendo.
  const actualizar = useCallback((f: (l: Item[]) => Item[]) => {
    setMapa(m => {
      const id = vivo.current.escId;
      return { ...m, [id]: f(m[id] ?? []) };
    });
  }, []);
  const cambiarElegida = useCallback((f: (it: Item) => Item) => {
    registrar();
    actualizar(l => l.map(it => (it.uid === vivo.current.sel ? f(it) : it)));
  }, [actualizar, registrar]);

  useEffect(() => {
    let cancelado = false;
    cargarTodo().then(() => {
      if (cancelado) return;
      const o: Record<string, string> = {};
      for (const p of PIEZAS) {
        const c = document.createElement('canvas');
        c.width = c.height = 144;
        const x = c.getContext('2d')!, k = (144 * 0.86) / Math.max(p.caja[2], p.caja[3]);
        x.translate(72, 72); x.scale(k, k);
        dibujarPieza(x, p.id, p.durMs * (p.muestra ?? (p.durMs > 2000 ? 0.5 : 0.25)));
        o[p.id] = c.toDataURL('image/png');
      }
      setMiniaturas(o);
      setListo(true);
    });
    return () => { cancelado = true; };
  }, []);

  // Loop: el reloj avanza solo si no hay pausa y se cuantiza a los FPS elegidos (stop-motion).
  useEffect(() => {
    const c = lienzo.current;
    if (!c || !listo) return;
    const ctx = c.getContext('2d')!;
    let raf = 0, anterior = performance.now(), reloj = 0;
    const tick = (ahora: number) => {
      raf = requestAnimationFrame(tick);
      const v = vivo.current;
      if (!v.pausado) reloj += ahora - anterior;
      anterior = ahora;
      const paso = 1000 / v.fps, ms = Math.floor(reloj / paso) * paso;
      dibujarEscenario(ctx, c.width, v.items, ms, v.fondo, v.borde);
      const it = v.items.find(i => i.uid === v.sel);
      if (it) dibujarSeleccion(ctx, c.width, it);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [listo]);

  const aEscenario = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * ESCENARIO, y: ((e.clientY - r.top) / r.height) * ESCENARIO };
  };

  const alBajar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = aEscenario(e), { items: lista, sel: actual } = vivo.current;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    antesDelGesto.current = vivo.current.mapa;

    // 1. Tirador de escala de la pieza elegida (zona generosa para el dedo).
    const elegido = lista.find(i => i.uid === actual);
    if (elegido) {
      const b = cajaItem(elegido);
      if (Math.hypot(p.x - (b.x + b.w), p.y - (b.y + b.h)) <= ASA * 2) {
        gesto.current = { tipo: 'escalar', uid: elegido.uid, d0: Math.hypot(p.x - elegido.x, p.y - elegido.y) || 1, e0: elegido.escala, movido: false };
        return;
      }
    }
    // 2. La pieza de más arriba bajo el dedo.
    for (let i = lista.length - 1; i >= 0; i--) {
      const b = cajaItem(lista[i]);
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
        setSel(lista[i].uid);
        gesto.current = { tipo: 'mover', uid: lista[i].uid, dx: lista[i].x - p.x, dy: lista[i].y - p.y, movido: false };
        return;
      }
    }
    setSel(null);
  };

  const alMover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gesto.current;
    if (!g) return;
    if (!g.movido) { g.movido = true; if (antesDelGesto.current) registrar(antesDelGesto.current); }
    const p = aEscenario(e);
    actualizar(l => l.map(it => {
      if (it.uid !== g.uid) return it;
      if (g.tipo === 'mover') {
        return { ...it, x: Math.min(ESCENARIO, Math.max(0, p.x + g.dx)), y: Math.min(ESCENARIO, Math.max(0, p.y + g.dy)) };
      }
      return { ...it, escala: limitar(g.e0 * (Math.hypot(p.x - it.x, p.y - it.y) / g.d0)) };
    }));
  };
  const alSoltar = () => { gesto.current = null; };

  const agregar = (tipo: string) => {
    registrar();
    const n = vivo.current.items.length, uid = uidSig.current++;
    const zona = esc.piezas[tipo];
    const it: Item = {
      uid, tipo, escala: ESCALA_INICIAL[tipo] ?? 1, espejo: false, variante: 0,
      x: ESCENARIO / 2 + ((n * 23) % 70) - 35, y: zona === 'cielo' ? 70 : zona === 'agua' ? 128 : 165,
    };
    actualizar(l => [...l, it]);
    setSel(uid);
  };
  const quitar = useCallback(() => {
    const u = vivo.current.sel;
    if (u == null) return;
    registrar();
    actualizar(l => l.filter(i => i.uid !== u));
    setSel(null);
  }, [actualizar, registrar]);
  const duplicar = () => {
    const it = vivo.current.items.find(i => i.uid === vivo.current.sel);
    if (!it) return;
    registrar();
    const uid = uidSig.current++;
    actualizar(l => [...l, { ...it, uid, x: Math.min(ESCENARIO, it.x + 14), y: Math.min(ESCENARIO, it.y + 8) }]);
    setSel(uid);
  };
  const alFrente = () => { registrar(); actualizar(l => { const it = l.find(i => i.uid === vivo.current.sel); return it ? [...l.filter(i => i !== it), it] : l; }); };
  const alFondo = () => { registrar(); actualizar(l => { const it = l.find(i => i.uid === vivo.current.sel); return it ? [it, ...l.filter(i => i !== it)] : l; }); };
  const vaciar = () => { registrar(); actualizar(() => []); setSel(null); };
  const sorprender = () => {
    registrar();
    const nuevas = sorprendeme(vivo.current.escId, uidSig.current);
    uidSig.current += nuevas.length;
    actualizar(() => nuevas);
    setSel(null);
  };
  const deshacer = useCallback(() => {
    const previo = historial.current.pop();
    if (previo) { setMapa(previo); setSel(null); }
    setPuedeDeshacer(historial.current.length > 0);
  }, []);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && vivo.current.sel != null) { e.preventDefault(); quitar(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); deshacer(); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [quitar, deshacer]);

  // La tarjeta sale sin guías de selección.
  const exportar = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 720;
    dibujarEscenario(c.getContext('2d')!, 720, vivo.current.items, 0, vivo.current.fondo, vivo.current.borde);
    onExportar(c);
  };

  // Loop animado: graba la tarjeta completa en tiempo real, un ciclo que cierre sin salto.
  const grabar = async () => {
    const { items: lista, fps: f, fondo, borde: conBorde } = vivo.current;
    if (!lista.length || grabando !== null) return;
    setErrorVideo(''); setGrabando(0);
    try {
      await cargarFuentesTarjeta();
      const escena = document.createElement('canvas');
      escena.width = escena.height = 720;
      const ectx = escena.getContext('2d')!;
      const tarjeta = document.createElement('canvas');
      tarjeta.width = 1080; tarjeta.height = 1350;
      const tctx = tarjeta.getContext('2d')!;
      const titulo = `Teatro de Papel · ${escenario(vivo.current.escId).nombre}`;
      const pie = `Loop animado a ${f} FPS · Creado en la estación interactiva`;
      const durMs = duracionLoop([fondo.dur, ...lista.map(durDe)]);
      const { blob, ext, seg } = await grabarLoop({
        canvas: tarjeta, fps: f, durMs, alProgreso: setGrabando,
        dibujarCuadro: ms => {
          dibujarEscenario(ectx, 720, lista, ms, fondo, conBorde);
          dibujarTarjetaMotion(tctx, escena, titulo, 'Día Orgánica · Mesa 4', pie);
        },
      });
      dibujarEscenario(ectx, 720, lista, 0, fondo, conBorde);
      const png = (await exportarTarjetaMotion(escena, titulo, 'Día Orgánica · Mesa 4')) ?? blob;
      onVideo(png, { blob, ext, seg });
    } catch (e) {
      setErrorVideo(e instanceof Error ? e.message : 'No se pudo grabar el loop.');
    } finally {
      setGrabando(null);
    }
  };

  const elegido = items.find(i => i.uid === sel) ?? null;
  const ocupado = grabando !== null;
  const ayuda = !listo ? 'Cargando piezas…'
    : items.length === 0 ? 'Toca una pieza de la bandeja o prueba «Sorpréndeme»'
    : elegido ? 'Arrastra para mover · tira de la esquina amarilla para cambiar el tamaño'
    : 'Toca una pieza del escenario para elegirla';

  return (
    <main className="layout">
      <div className="zona-escenario">
        <div className="lienzo-wrap">
          <canvas
            ref={lienzo}
            width={720}
            height={720}
            className="canvas-escenario"
            onPointerDown={alBajar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
            aria-label={`Escenario ${esc.nombre}: toca una pieza para moverla`}
          />
        </div>
        <div className="barra-escenario">
          <button type="button" className="btn chico" onClick={() => setPausado(p => !p)}>
            {pausado ? '▶ Reanudar' : '⏸ Pausa'}
          </button>
          <div className="seg chico-seg" role="group" aria-label="Velocidad">
            {FPS.map(f => (
              <button key={f} type="button" aria-pressed={fps === f} onClick={() => setFps(f)}>{f} FPS</button>
            ))}
          </div>
          <button type="button" className="btn chico" aria-pressed={borde} onClick={() => setBorde(b => !b)}>
            {borde ? '✓ Borde de papel' : 'Borde de papel'}
          </button>
          <button type="button" className="btn chico" disabled={!puedeDeshacer} onClick={deshacer}>↶ Deshacer</button>
        </div>
        <p className="nota">{ayuda}</p>
      </div>

      <aside className="panel">
        <div>
          <p className="label">1 · Escenario</p>
          <div className="seg" role="group" aria-label="Escenario">
            {ESCENARIOS.map(e => (
              <button key={e.id} type="button" aria-pressed={e.id === escId} onClick={() => { setEscId(e.id); setSel(null); }}>
                {e.nombre}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label">2 · Piezas</p>
          <div className="bandeja">
            {PIEZAS.filter(p => p.id in esc.piezas).map(p => (
              <button key={p.id} type="button" className="pieza-btn" onClick={() => agregar(p.id)} disabled={!listo}>
                {miniaturas[p.id] ? <img src={miniaturas[p.id]} alt="" /> : <span className="pieza-vacia" />}
                <span>{p.nombre}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn sorprende" disabled={!listo} onClick={sorprender}>✨ Sorpréndeme</button>
        </div>

        <div>
          <p className="label">3 · {elegido ? `Ajusta · ${pieza(elegido.tipo).nombre}` : 'Ajusta la pieza elegida'}</p>
          {elegido && (pieza(elegido.tipo).variantes?.length ?? 0) > 1 && (
            <div className="movimientos" role="group" aria-label="Movimiento">
              {pieza(elegido.tipo).variantes!.map((v, n) => (
                <button key={v.id} type="button" aria-pressed={(elegido.variante ?? 0) === n}
                  onClick={() => cambiarElegida(i => ({ ...i, variante: n }))}>{v.nombre}</button>
              ))}
            </div>
          )}
          <div className="herramientas">
            <button type="button" className="btn chico" disabled={!elegido} onClick={() => cambiarElegida(i => ({ ...i, escala: limitar(i.escala * 1.2) }))}>Más grande</button>
            <button type="button" className="btn chico" disabled={!elegido} onClick={() => cambiarElegida(i => ({ ...i, escala: limitar(i.escala / 1.2) }))}>Más chica</button>
            <button type="button" className="btn chico" disabled={!elegido} onClick={() => cambiarElegida(i => ({ ...i, espejo: !i.espejo }))}>Voltear</button>
            <button type="button" className="btn chico" disabled={!elegido} onClick={alFrente}>Al frente</button>
            <button type="button" className="btn chico" disabled={!elegido} onClick={alFondo}>Al fondo</button>
            <button type="button" className="btn chico" disabled={!elegido} onClick={duplicar}>Duplicar</button>
            <button type="button" className="btn chico peligro" disabled={!elegido} onClick={quitar}>Quitar</button>
          </div>
        </div>

        <div className="cierre">
          {puedeGrabar() && (
            <button type="button" className="btn primario" disabled={items.length === 0 || ocupado} onClick={grabar}>
              {grabando === null ? '🎞 Generar loop animado' : `Grabando tu loop… ${Math.round(grabando * 100)} %`}
            </button>
          )}
          <button type="button" className="btn" disabled={items.length === 0 || ocupado} onClick={exportar}>Tarjeta en PNG</button>
          <button type="button" className="btn chico" disabled={items.length === 0 || ocupado} onClick={vaciar}>Vaciar escenario</button>
          {errorVideo && <p className="ayuda ayuda-error" role="alert">{errorVideo}</p>}
        </div>
      </aside>
    </main>
  );
};
