import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PIEZAS, pieza } from '../escenario/piezas';
import { ESCENARIOS, escenario } from '../escenario/escenarios';
import { sorprendeme } from '../escenario/sorprendeme';
import { cargarFuentesTarjeta, dibujarTarjetaMotion, exportarTarjetaMotion } from '../lib/exportarTarjeta';
import { duracionLoop, grabarLoop, puedeGrabar } from '../lib/grabarLoop';
import type { VideoLoop } from './ModalExportar';
import {
  ASA, ESCENARIO, cajaItem, cargarTodo, dibujarEscenario, dibujarPieza, dibujarSeleccion,
  posicionItem, type Item,
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
  pudu: 0.75, paloma: 0.6, sol: 1, araucaria: 1, pina: 0.65, helecho: 0.75, quisco: 0.8, flor: 0.65,
  pez: 0.7, pinguino: 0.6, cantaro: 0.5, canasto: 0.5, kisa: 0.7,
};

// Límites de escala mínimos y máximos específicos para mantener proporciones creíbles frente a los fondos
const LIMITES_ESCALA: Record<string, [number, number]> = {
  pudu: [0.38, 1.3],
  pinguino: [0.38, 1.3],
  paloma: [0.32, 1.2],
  pez: [0.32, 1.3],
  araucaria: [0.55, 2.0],
  quisco: [0.45, 1.8],
  sol: [0.55, 1.7],
  helecho: [0.3, 1.4],
  flor: [0.28, 1.3],
  pina: [0.25, 1.1],
  canasto: [0.28, 1.2],
  cantaro: [0.28, 1.2],
  kisa: [0.32, 1.3],
};

const limitar = (tipo: string, n: number) => {
  const [min, max] = LIMITES_ESCALA[tipo] ?? [0.3, 1.5];
  return Math.min(max, Math.max(min, n));
};

const durDe = (it: Item) => {
  const p = pieza(it.tipo);
  return p.variantes?.[it.variante ?? 0]?.durMs ?? p.durMs;
};

const FPS = [8, 12, 24];
const DURACION_LOOP = 4000;
const RESOLUCION_CANVAS = 1080;

export const EscenarioOrganico: React.FC<Props> = ({ onExportar, onVideo }) => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [escId, setEscId] = useState(ESCENARIOS[0].id);
  const [mapa, setMapa] = useState<Mapa>({});
  const [sel, setSel] = useState<number | null>(null);
  const [fps, setFps] = useState(12);
  const [pausado, setPausado] = useState(false);
  const [borde, setBorde] = useState(true);
  const [listo, setListo] = useState(false);
  const [grabando, setGrabando] = useState<number | null>(null);
  const [errorVideo, setErrorVideo] = useState('');
  const [puedeDeshacer, setPuedeDeshacer] = useState(false);
  const [miniaturas, setMiniaturas] = useState<Record<string, string>>({});
  const [tiempoVisual, setTiempoVisual] = useState(0);
  const [pestana, setPestana] = useState<'escena' | 'pieza'>('escena');

  const esc = escenario(escId);
  const items = mapa[escId] ?? [];

  const relojRef = useRef(0);
  const vivo = useRef({ items, sel, fps, pausado, fondo: esc.fondo, mapa, escId, borde, reloj: 0 });
  vivo.current = { items, sel, fps, pausado, fondo: esc.fondo, mapa, escId, borde, reloj: relojRef.current };
  const gesto = useRef<Gesto | null>(null);
  const antesDelGesto = useRef<Mapa | null>(null);
  const historial = useRef<Mapa[]>([]);
  const uidSig = useRef(1);

  const registrar = useCallback((m: Mapa = vivo.current.mapa) => {
    historial.current.push(m);
    if (historial.current.length > 40) historial.current.shift();
    setPuedeDeshacer(true);
  }, []);

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

  // Loop de dibujo a alta definición (1080p)
  useEffect(() => {
    const c = lienzo.current;
    if (!c || !listo) return;
    const ctx = c.getContext('2d')!;
    let raf = 0, anterior = performance.now();
    let ultimoSegundoUI = 0;

    const tick = (ahora: number) => {
      raf = requestAnimationFrame(tick);
      const v = vivo.current;
      if (!v.pausado) {
        relojRef.current += ahora - anterior;
      }
      anterior = ahora;
      const paso = 1000 / v.fps;
      const ms = Math.floor(relojRef.current / paso) * paso;

      // Actualizar indicador de línea de tiempo con un throttle suave
      if (ahora - ultimoSegundoUI > 60) {
        setTiempoVisual(relojRef.current % DURACION_LOOP);
        ultimoSegundoUI = ahora;
      }

      dibujarEscenario(ctx, c.width, v.items, ms, v.fondo, v.borde);
      const it = v.items.find(i => i.uid === v.sel);
      if (it) dibujarSeleccion(ctx, c.width, it, ms);
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
    const msActual = relojRef.current;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    antesDelGesto.current = vivo.current.mapa;

    // 1. Tirador de escala de la pieza elegida
    const elegido = lista.find(i => i.uid === actual);
    if (elegido) {
      const b = cajaItem(elegido, msActual);
      if (Math.hypot(p.x - (b.x + b.w), p.y - (b.y + b.h)) <= ASA * 2.2) {
        const pos = posicionItem(elegido, msActual);
        gesto.current = { tipo: 'escalar', uid: elegido.uid, d0: Math.hypot(p.x - pos.x, p.y - pos.y) || 1, e0: elegido.escala, movido: false };
        return;
      }
    }
    // 2. La pieza bajo el dedo
    for (let i = lista.length - 1; i >= 0; i--) {
      const b = cajaItem(lista[i], msActual);
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
        setSel(lista[i].uid);
        const pos = posicionItem(lista[i], msActual);
        gesto.current = { tipo: 'mover', uid: lista[i].uid, dx: pos.x - p.x, dy: pos.y - p.y, movido: false };
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
      return { ...it, escala: limitar(it.tipo, g.e0 * (Math.hypot(p.x - it.x, p.y - it.y) / g.d0)) };
    }));
  };

  const alSoltar = () => { gesto.current = null; };

  const agregar = (tipo: string) => {
    registrar();
    const n = vivo.current.items.length, uid = uidSig.current++;
    const zona = esc.piezas[tipo];
    const it: Item = {
      uid, tipo, escala: ESCALA_INICIAL[tipo] ?? 1, espejo: false, variante: 0,
      x: ESCENARIO / 2 + ((n * 23) % 70) - 35, y: zona === 'cielo' ? 70 : zona === 'agua' ? 128 : 172,
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
    actualizar(l => [...l, { ...it, uid, x: Math.min(ESCENARIO - 10, it.x + 14), y: Math.min(ESCENARIO - 10, it.y + 8) }]);
    setSel(uid);
  };

  const alFrente = () => { registrar(); actualizar(l => { const it = l.find(i => i.uid === vivo.current.sel); return it ? [...l.filter(i => i !== it), it] : l; }); };
  const alFondo = () => { registrar(); actualizar(l => { const it = l.find(i => i.uid === vivo.current.sel); return it ? [it, ...l.filter(i => i !== it)] : l; }); };
  const vaciar = () => { registrar(); actualizar(() => []); setSel(null); };

  const ES_MOVIL = (tipo: string) => ['pudu', 'pinguino', 'paloma', 'pez'].includes(tipo);

  const sorprender = () => {
    registrar();
    const nuevas: Item[] = sorprendeme(vivo.current.escId, uidSig.current).map(it => {
      const movil = ES_MOVIL(it.tipo);
      return {
        ...it,
        destino: movil ? { x: Math.max(30, Math.min(210, it.x + (it.espejo ? -60 : 60))), y: it.y } : undefined,
      };
    });
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

  const cambiarTiempoManual = (ms: number) => {
    relojRef.current = ms;
    setTiempoVisual(ms);
  };

  const exportar = () => {
    const c = document.createElement('canvas');
    c.width = c.height = RESOLUCION_CANVAS;
    dibujarEscenario(c.getContext('2d')!, RESOLUCION_CANVAS, vivo.current.items, relojRef.current, vivo.current.fondo, vivo.current.borde);
    onExportar(c);
  };

  const grabar = async () => {
    const { items: lista, fps: f, fondo, borde: conBorde } = vivo.current;
    if (!lista.length || grabando !== null) return;
    setErrorVideo(''); setGrabando(0);
    try {
      await cargarFuentesTarjeta();
      const escena = document.createElement('canvas');
      escena.width = escena.height = RESOLUCION_CANVAS;
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
          dibujarEscenario(ectx, RESOLUCION_CANVAS, lista, ms, fondo, conBorde);
          dibujarTarjetaMotion(tctx, escena, titulo, 'Lenguaje Orgánica', pie);
        },
      });
      dibujarEscenario(ectx, RESOLUCION_CANVAS, lista, 0, fondo, conBorde);
      const png = (await exportarTarjetaMotion(escena, titulo, 'Lenguaje Orgánica')) ?? blob;
      onVideo(png, { blob, ext, seg });
    } catch (e) {
      setErrorVideo(e instanceof Error ? e.message : 'No se pudo grabar el loop.');
    } finally {
      setGrabando(null);
    }
  };

  const elegido = items.find(i => i.uid === sel) ?? null;

  // Al tocar una pieza se abre su pestaña de ajustes; al soltarla se vuelve a la escena.
  useEffect(() => { setPestana(sel != null ? 'pieza' : 'escena'); }, [sel]);
  const ocupado = grabando !== null;
  const ayuda = !listo ? 'Cargando piezas…'
    : items.length === 0 ? 'Toca una pieza de la bandeja o prueba «Sorpréndeme»'
    : elegido ? `Seleccionado: ${pieza(elegido.tipo).nombre} · Arrastra para mover o tira de la esquina amarilla para tamaño`
    : 'Toca cualquier figura del escenario para seleccionarla';


  return (
    <main className="cuerpo-pantalla">
      <section className="zona-escenario" aria-label="Escenario">
        <div className="escenario-fit">
        <div className="lienzo-wrap lienzo-fit">
          <canvas
            ref={lienzo}
            width={RESOLUCION_CANVAS}
            height={RESOLUCION_CANVAS}
            className="canvas-escenario"
            onPointerDown={alBajar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
            aria-label={`Escenario ${esc.nombre}: toca una pieza para moverla`}
          />
        </div>
        </div>

        {/* Línea de tiempo interactiva */}
        <div className="linea-tiempo">
          <div className="linea-tiempo-controles">
            <button
              type="button"
              className="btn-icono-tiempo"
              onClick={() => setPausado(p => !p)}
              title={pausado ? 'Reanudar loop' : 'Pausar loop'}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {pausado ? 'play_arrow' : 'pause'}
              </span>
            </button>
            <span className="tiempo-texto">
              {(tiempoVisual / 1000).toFixed(1)}s / {(DURACION_LOOP / 1000).toFixed(1)}s
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={DURACION_LOOP}
            step={50}
            value={tiempoVisual}
            onChange={(e) => {
              setPausado(true);
              cambiarTiempoManual(Number(e.target.value));
            }}
            className="timeline-slider"
            aria-label="Línea de tiempo del loop"
          />

          <div className="tiempo-ajustes">
            <div className="seg chico-seg" role="group" aria-label="Velocidad">
              {FPS.map(f => (
                <button key={f} type="button" aria-pressed={fps === f} onClick={() => setFps(f)}>
                  {f} FPS
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-tiempo-opcion"
              aria-pressed={borde}
              onClick={() => setBorde(b => !b)}
              title="Activar o desactivar borde de papel recortado"
            >
              <span className="material-symbols-outlined" aria-hidden="true">layers</span>
              Borde
            </button>
            <button
              type="button"
              className="btn-tiempo-opcion"
              disabled={!puedeDeshacer}
              onClick={deshacer}
              title="Deshacer última acción"
            >
              <span className="material-symbols-outlined" aria-hidden="true">undo</span>
            </button>
          </div>
        </div>

        <p className="nota" role="status">{ayuda}</p>
      </section>

      <aside className="panel-app panel-teatro" aria-label="Controles">
        <div className="pestanas" role="tablist" aria-label="Secciones">
          <button type="button" role="tab" id="tab-escena" aria-selected={pestana === 'escena'} aria-controls="pag-escena" onClick={() => setPestana('escena')}>
            <span className="material-symbols-outlined" aria-hidden="true">landscape</span>
            Escena
          </button>
          <button type="button" role="tab" id="tab-pieza" aria-selected={pestana === 'pieza'} aria-controls="pag-pieza" onClick={() => setPestana('pieza')}>
            <span className="material-symbols-outlined" aria-hidden="true">pets</span>
            {elegido ? pieza(elegido.tipo).nombre : 'Pieza'}
          </button>
        </div>

        {pestana === 'escena' && (
        <div className="panel-pagina" role="tabpanel" id="pag-escena" aria-labelledby="tab-escena">
        <div className="bloque">
          <p className="label">Escenario</p>
          <div className="seg seg-escenarios" role="group" aria-label="Escenario">
            {ESCENARIOS.map(e => (
              <button
                key={e.id}
                type="button"
                aria-pressed={e.id === escId}
                onClick={() => { setEscId(e.id); setSel(null); }}
                className="btn-escenario"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {e.id === 'cordillera' ? 'landscape' : e.id === 'mar' ? 'water' : 'wb_sunny'}
                </span>
                <span>{e.nombre}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bandeja de piezas */}
        <div className="bloque bloque-bandeja">
          <div className="etiqueta-fila">
            <p className="label">Personajes y piezas</p>
            <button
              type="button"
              className="btn-sorprende-link"
              disabled={!listo}
              onClick={sorprender}
              title="Generar composición al azar"
            >
              <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
              Sorpréndeme
            </button>
          </div>
          <div className="bandeja">
            {PIEZAS.filter(p => p.id in esc.piezas).map(p => (
              <button
                key={p.id}
                type="button"
                className="pieza-btn"
                onClick={() => agregar(p.id)}
                disabled={!listo}
                title={`Añadir ${p.nombre}`}
              >
                {miniaturas[p.id] ? <img src={miniaturas[p.id]} alt="" /> : <span className="pieza-vacia" />}
                <span>{p.nombre}</span>
              </button>
            ))}
          </div>
        </div>

        </div>
        )}

        {pestana === 'pieza' && (
        <div className="panel-pagina" role="tabpanel" id="pag-pieza" aria-labelledby="tab-pieza">
        {!elegido && <p className="ayuda vacio-pieza">Toca una figura del escenario para moverla, cambiar su tamaño o su animación.</p>}
        {elegido && (
          <div className="bloque bloque-ajustes">

            {/* Trayecto de desplazamiento en el espacio (solo para seres móviles: pudú, pingüino, paloma, pez) */}
            {ES_MOVIL(elegido.tipo) && (
              <div className="seccion-trayecto">
                <span className="sublabel">Trayecto en el escenario</span>
                <div className="seg seg-trayecto" role="group" aria-label="Trayecto de movimiento">
                  <button
                    type="button"
                    aria-pressed={!elegido.destino}
                    onClick={() => cambiarElegida(i => ({ ...i, destino: undefined }))}
                    className="btn-trayecto"
                    title="Mantener en su lugar fijo"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">place</span>
                    <span>En su lugar</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={!!elegido.destino}
                    onClick={() => {
                      if (!elegido.destino) {
                        const offset = elegido.espejo ? -70 : 70;
                        const destX = Math.max(25, Math.min(215, Math.round(elegido.x + offset)));
                        cambiarElegida(i => ({ ...i, destino: { x: destX, y: elegido.y } }));
                      }
                    }}
                    className="btn-trayecto"
                    title="Crear recorrido de desplazamiento de punto A a punto B"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">route</span>
                    <span>Caminar A ➔ B</span>
                  </button>
                </div>
                {elegido.destino && (
                  <div className="acciones-trayecto">
                    <button
                      type="button"
                      className="btn chico"
                      onClick={() => cambiarElegida(i => i.destino ? ({
                        ...i,
                        x: i.destino.x,
                        y: i.destino.y,
                        destino: { x: i.x, y: i.y },
                        espejo: !i.espejo,
                      }) : i)}
                      title="Invertir dirección del trayecto"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">swap_horiz</span>
                      Invertir
                    </button>
                    <button
                      type="button"
                      className="btn chico"
                      onClick={() => cambiarElegida(i => ({ ...i, destino: undefined }))}
                      title="Quitar trayecto y dejar en su lugar"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">close</span>
                      Fijar punto
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Animaciones y poses orgánicas (para todas las piezas que tengan estilos de movimiento) */}
            {(pieza(elegido.tipo).variantes?.length ?? 0) > 1 && (
              <div className="seccion-animacion">
                <span className="sublabel">Animación</span>
                <div className="seg seg-animaciones" role="group" aria-label="Pose / Animación">
                  {pieza(elegido.tipo).variantes!.map((v, n) => (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={(elegido.variante ?? 0) === n}
                      onClick={() => cambiarElegida(i => ({ ...i, variante: n }))}
                    >
                      {v.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Herramientas de transformación */}
            <div className="herramientas">
              <button
                type="button"
                className="btn chico"
                onClick={() => cambiarElegida(i => ({ ...i, escala: limitar(i.tipo, i.escala * 1.15) }))}
                title="Agrandar tamaño"
              >
                <span className="material-symbols-outlined" aria-hidden="true">zoom_in</span>
                Más grande
              </button>
              <button
                type="button"
                className="btn chico"
                onClick={() => cambiarElegida(i => ({ ...i, escala: limitar(i.tipo, i.escala / 1.15) }))}
                title="Reducir tamaño"
              >
                <span className="material-symbols-outlined" aria-hidden="true">zoom_out</span>
                Más chica
              </button>
              <button
                type="button"
                className="btn chico"
                onClick={() => cambiarElegida(i => ({ ...i, espejo: !i.espejo }))}
                title="Voltear orientación horizontal"
              >
                <span className="material-symbols-outlined" aria-hidden="true">flip</span>
                Voltear
              </button>
              <button type="button" className="btn chico" onClick={alFrente} title="Traer al frente">
                <span className="material-symbols-outlined" aria-hidden="true">flip_to_front</span>
                Al frente
              </button>
              <button type="button" className="btn chico" onClick={alFondo} title="Enviar al fondo">
                <span className="material-symbols-outlined" aria-hidden="true">flip_to_back</span>
                Al fondo
              </button>
              <button type="button" className="btn chico" onClick={duplicar} title="Duplicar pieza">
                <span className="material-symbols-outlined" aria-hidden="true">content_copy</span>
                Duplicar
              </button>
              <button type="button" className="btn chico peligro" onClick={quitar} title="Eliminar pieza seleccionada">
                <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                Quitar
              </button>
            </div>
          </div>
        )}

        </div>
        )}

        {/* Acciones fijas al pie */}
        <div className="panel-pie cierre">
          {puedeGrabar() && (
            <button
              type="button"
              className="btn primario btn-grabar-loop"
              disabled={items.length === 0 || ocupado}
              onClick={grabar}
            >
              <span className="material-symbols-outlined" aria-hidden="true">movie</span>
              {grabando === null ? 'Generar loop animado (Video)' : `Grabando tu loop… ${Math.round(grabando * 100)} %`}
            </button>
          )}

          <div className="acciones-secundarias-teatro">
            <button
              type="button"
              className="btn secundario"
              disabled={items.length === 0 || ocupado}
              onClick={exportar}
            >
              <span className="material-symbols-outlined" aria-hidden="true">download</span>
              Tarjeta PNG
            </button>
            <button
              type="button"
              className="btn secundario"
              disabled={items.length === 0 || ocupado}
              onClick={vaciar}
            >
              <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>
              Vaciar
            </button>
          </div>

          {errorVideo && <p className="ayuda ayuda-error" role="alert">{errorVideo}</p>}
        </div>
      </aside>
    </main>
  );
};
