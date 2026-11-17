import React, { useCallback, useEffect, useRef, useState } from 'react';
import { otorgarCreacion } from '../../../shared/juego';
import { archivosColor, escalaInicial, limitarEscala, pieza } from '../escenario/piezas';
import { cargarLote } from '../escenario/recursos';
import { ESCENARIOS, escenario, posicionNueva } from '../escenario/escenarios';
import { sorprendeme } from '../escenario/sorprendeme';
import { miniaturaDe, useCarga } from '../escenario/carga';
import { cargarFuentesTarjeta, dibujarTarjetaMotion, exportarTarjetaMotion } from '../lib/exportarTarjeta';
import { duracionLoop, grabarLoop, puedeGrabar } from '../lib/grabarLoop';
import type { VideoLoop } from './ModalExportar';
import { LineaDeTiempo } from './LineaDeTiempo';
import { Carga } from './Carga';
import { BarraSuperior, BotonAccion, Confirmar, Paleta, PantallaHerramienta, Seccion, Segmentado } from '../../../shared/ui/Kit';
import {
  ASA, ESCENARIO, cajaItem, quieto, dibujarEscenario, dibujarSeleccion,
  posicionItem, DURACION_TRAYECTO, type Item,
} from '../escenario/dibujar';

interface Props {
  onExportar: (canvas: HTMLCanvasElement) => void;
  onVideo: (tarjetaPng: Blob, video: VideoLoop) => void;
  onGrabando?: (grabando: boolean) => void;
}

type Gesto =
  | { tipo: 'mover'; uid: number; dx: number; dy: number; movido: boolean }
  | { tipo: 'escalar'; uid: number; d0: number; e0: number; movido: boolean }
  | { tipo: 'destino'; uid: number; movido: boolean };
type Mapa = Record<string, Item[]>;

// Tope de piezas por escena (plan 008, D4): mantiene legible la línea de tiempo y acota el costo de dibujo.
export const MAX_PIEZAS = 8;

const durDe = (it: Item) => {
  const p = pieza(it.tipo);
  return p.variantes?.[it.variante ?? 0]?.durMs ?? p.durMs;
};

const DURACION_LOOP = DURACION_TRAYECTO;
const RESOLUCION_CANVAS = 1080;
// Diagnóstico (`?diag` en la URL): cuenta cuadros dibujados y su costo en `window.teatroDiag`.
const DIAG: { cuadros: number; msDibujo: number } | null = new URLSearchParams(location.search).has('diag')
  ? ((window as unknown as { teatroDiag: { cuadros: number; msDibujo: number } }).teatroDiag = { cuadros: 0, msDibujo: 0 })
  : null;
const ICONO_ESC: Record<string, string> = { cordillera: 'landscape', mar: 'water', bosque: 'forest', desierto: 'wb_sunny' };

export const EscenarioOrganico: React.FC<Props> = ({ onExportar, onVideo, onGrabando }) => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [escId, setEscId] = useState(ESCENARIOS[0].id);
  const [mapa, setMapa] = useState<Mapa>({});
  const [sel, setSel] = useState<number | null>(null);
  const [fps, setFps] = useState(12);
  // Parte pausado: así se arma la escena con calma; al darle play se ve el loop completo.
  const [pausado, setPausado] = useState(true);
  const [borde, setBorde] = useState(true);
  const [grabando, setGrabando] = useState<number | null>(null);
  const [errorVideo, setErrorVideo] = useState('');
  const [puedeDeshacer, setPuedeDeshacer] = useState(false);
  const [puedeRehacer, setPuedeRehacer] = useState(false);
  const [tiempoVisual, setTiempoVisual] = useState(0);
  // Pieza que se arrastra desde la biblioteca al escenario (el «fantasma» sigue al dedo).
  const [fantasma, setFantasma] = useState<{ tipo: string; x: number; y: number } | null>(null);
  const toque = useRef<{ tipo: string; x: number; y: number } | null>(null);

  const carga = useCarga(escId);
  const listo = carga.listo;
  const esc = escenario(escId);
  const items = mapa[escId] ?? [];
  const lleno = items.length >= MAX_PIEZAS;

  const relojRef = useRef(0);
  const vivo = useRef({ items, sel, fps, pausado, fondo: esc.fondo, mapa, escId, borde, grabando: false });
  vivo.current = { items, sel, fps, pausado, fondo: esc.fondo, mapa, escId, borde, grabando: grabando !== null };
  // Se redibuja solo si algo cambió (o si cambió el cuadro en play), no en cada requestAnimationFrame.
  const sucio = useRef(true);
  useEffect(() => { sucio.current = true; }, [items, sel, borde, escId, pausado, listo, carga.hechas]);
  useEffect(() => { onGrabando?.(grabando !== null); }, [grabando !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const gesto = useRef<Gesto | null>(null);
  const antesDelGesto = useRef<Mapa | null>(null);
  const historial = useRef<Mapa[]>([]);
  const adelante = useRef<Mapa[]>([]);
  const uidSig = useRef(1);

  const registrar = useCallback((m: Mapa = vivo.current.mapa) => {
    historial.current.push(m);
    if (historial.current.length > 40) historial.current.shift();
    adelante.current = [];
    setPuedeDeshacer(true);
    setPuedeRehacer(false);
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

  // Bucle de dibujo: en pausa dibuja solo cuando algo cambia; en play, solo cuando cambia el cuadro según los FPS.
  useEffect(() => {
    const c = lienzo.current;
    if (!c || !listo) return;
    const ctx = c.getContext('2d')!;
    let raf = 0, anterior = performance.now(), ultimoUI = 0, ultimoMs = -1;
    sucio.current = true;

    const tick = (ahora: number) => {
      raf = requestAnimationFrame(tick);
      const v = vivo.current;
      if (!v.pausado) relojRef.current += ahora - anterior;
      anterior = ahora;
      if (v.grabando) return; // mientras se graba, todo el tiempo de cuadro queda para el video
      const paso = 1000 / v.fps;
      const ms = Math.floor(relojRef.current / paso) * paso;
      if (!v.pausado && ahora - ultimoUI > 100) { setTiempoVisual(relojRef.current % DURACION_LOOP); ultimoUI = ahora; }
      if (ms === ultimoMs && !sucio.current) return;
      ultimoMs = ms; sucio.current = false;
      // En pausa, la pieza elegida se edita quieta en su punto A; en play, camina como en el video.
      const t0 = DIAG ? performance.now() : 0;
      dibujarEscenario(ctx, c.width, v.items, ms, v.fondo, v.borde, v.pausado ? v.sel : null, true);
      const it = v.items.find(i => i.uid === v.sel);
      if (it) dibujarSeleccion(ctx, c.width, it, ms, v.pausado);
      if (DIAG) { const d = DIAG; d.cuadros++; d.msDibujo += performance.now() - t0; }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [listo]);

  const aEscenario = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * ESCENARIO, y: ((e.clientY - r.top) / r.height) * ESCENARIO };
  };

  const alBajar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!listo) return;
    // Tocar el escenario con el loop corriendo lo pausa: en pausa se edita y nada salta (plan 008, T-016).
    if (!vivo.current.pausado) { setPausado(true); vivo.current.pausado = true; }
    const p = aEscenario(e), { items: lista, sel: actual } = vivo.current;
    const msActual = relojRef.current;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    antesDelGesto.current = vivo.current.mapa;

    const elegido = lista.find(i => i.uid === actual);
    if (elegido) {
      // 0. El punto B del trayecto (se arrastra para elegir hacia dónde camina)
      if (elegido.destino && Math.hypot(p.x - elegido.destino.x, p.y - elegido.destino.y) <= ASA * 2.2) {
        gesto.current = { tipo: 'destino', uid: elegido.uid, movido: false };
        return;
      }
      // 1. Tirador de tamaño (siempre dentro del escenario, plan 008 T-009)
      const t = posTirador(cajaItem(quieto(elegido), msActual));
      if (Math.hypot(p.x - t.x, p.y - t.y) <= ASA * 2.2) {
        const pos = posicionItem(quieto(elegido), msActual);
        gesto.current = { tipo: 'escalar', uid: elegido.uid, d0: Math.hypot(p.x - pos.x, p.y - pos.y) || 1, e0: elegido.escala, movido: false };
        return;
      }
    }
    // 2. La pieza bajo el dedo (en pausa, la pieza se toca en su punto A: ahí empieza el trayecto)
    for (let i = lista.length - 1; i >= 0; i--) {
      const it = quieto(lista[i]);
      const b = cajaItem(it, msActual);
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
        setSel(lista[i].uid);
        const pos = posicionItem(it, msActual);
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
      if (g.tipo === 'destino') {
        return { ...it, destino: { x: Math.min(ESCENARIO, Math.max(0, p.x)), y: Math.min(ESCENARIO, Math.max(0, p.y)) } };
      }
      if (g.tipo === 'mover') {
        const x = Math.min(ESCENARIO, Math.max(0, p.x + g.dx)), y = Math.min(ESCENARIO, Math.max(0, p.y + g.dy));
        // Mover la pieza lleva el trayecto completo (A y B juntos).
        const destino = it.destino && { x: Math.min(ESCENARIO, Math.max(0, it.destino.x + x - it.x)), y: Math.min(ESCENARIO, Math.max(0, it.destino.y + y - it.y)) };
        return { ...it, x, y, destino };
      }
      return { ...it, escala: limitarEscala(it.tipo, g.e0 * (Math.hypot(p.x - it.x, p.y - it.y) / g.d0)) };
    }));
  };

  const alSoltar = () => { gesto.current = null; };

  const agregar = (tipo: string, en?: { x: number; y: number }) => {
    if (vivo.current.items.length >= MAX_PIEZAS) return;
    registrar();
    const uid = uidSig.current++;
    const escala = escalaInicial(tipo);
    const pos = en ?? posicionNueva(vivo.current.escId, tipo, escala, vivo.current.items);
    const it: Item = { uid, tipo, escala, espejo: false, variante: 0, x: pos.x, y: pos.y };
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

  const alFrente = () => { registrar(); actualizar(l => { const it = l.find(i => i.uid === vivo.current.sel); return it ? [...l.filter(i => i !== it), it] : l; }); };
  const alFondo = () => { registrar(); actualizar(l => { const it = l.find(i => i.uid === vivo.current.sel); return it ? [it, ...l.filter(i => i !== it)] : l; }); };
  const vaciar = () => { registrar(); actualizar(() => []); setSel(null); };

  const sorprender = () => {
    registrar();
    const nuevas: Item[] = sorprendeme(vivo.current.escId, uidSig.current, MAX_PIEZAS).map(it => ({
      ...it,
      destino: pieza(it.tipo).movil ? { x: Math.max(30, Math.min(210, it.x + (it.espejo ? -60 : 60))), y: it.y } : undefined,
    }));
    uidSig.current += nuevas.length;
    actualizar(() => nuevas);
    setSel(null);
  };

  const deshacer = useCallback(() => {
    const previo = historial.current.pop();
    if (previo) { adelante.current.push(vivo.current.mapa); setMapa(previo); setSel(null); }
    setPuedeDeshacer(historial.current.length > 0);
    setPuedeRehacer(adelante.current.length > 0);
  }, []);
  const rehacer = useCallback(() => {
    const siguiente = adelante.current.pop();
    if (siguiente) { historial.current.push(vivo.current.mapa); setMapa(siguiente); setSel(null); }
    setPuedeDeshacer(historial.current.length > 0);
    setPuedeRehacer(adelante.current.length > 0);
  }, []);

  // Biblioteca → escenario: tocar agrega la pieza; arrastrarla la deja donde se suelta.
  const soltarFantasma = (e: React.PointerEvent) => {
    const t = toque.current;
    toque.current = null;
    if (!t) return;
    if (!fantasma) { agregar(t.tipo); return; }
    setFantasma(null);
    const r = lienzo.current?.getBoundingClientRect();
    if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      agregar(t.tipo, { x: Math.round(((e.clientX - r.left) / r.width) * ESCENARIO), y: Math.round(((e.clientY - r.top) / r.height) * ESCENARIO) });
    }
  };

  // Atajos: borrar, deshacer y rehacer. A propósito NO hay duplicar ni copiar y pegar (rompen la escena).
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && vivo.current.sel != null) { e.preventDefault(); quitar(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) rehacer(); else deshacer(); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [quitar, deshacer, rehacer]);

  const cambiarTiempoManual = (ms: number) => {
    relojRef.current = ms;
    setTiempoVisual(ms);
  };

  const exportar = () => {
    const c = document.createElement('canvas');
    c.width = c.height = RESOLUCION_CANVAS;
    dibujarEscenario(c.getContext('2d')!, RESOLUCION_CANVAS, vivo.current.items, relojRef.current, vivo.current.fondo, vivo.current.borde);
    onExportar(c);
    otorgarCreacion('teatro');
  };

  const grabar = async () => {
    const { items: lista, fps: f, fondo, borde: conBorde } = vivo.current;
    if (!lista.length || grabando !== null) return;
    setErrorVideo(''); setGrabando(0); vivo.current.grabando = true;
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
      otorgarCreacion('teatro');
    } catch (e) {
      setErrorVideo(e instanceof Error ? e.message : 'No se pudo grabar el loop.');
    } finally {
      setGrabando(null);
      sucio.current = true;
    }
  };

  const elegido = items.find(i => i.uid === sel) ?? null;
  const ocupado = grabando !== null;
  const p = elegido && pieza(elegido.tipo);
  const variantes = p?.variantes ?? [];
  // Ayuda corta en la barra superior; la instrucción completa va en el panel, donde puede ocupar dos líneas.
  const ayuda = !listo ? 'Preparando las piezas…'
    : items.length === 0 ? 'Arrastra piezas al escenario'
    : elegido ? `${p!.nombre} elegido`
    : lleno ? `Llegaste a ${MAX_PIEZAS} piezas`
    : 'Toca una figura para editarla';

  return (<>
    <PantallaHerramienta
      anchoLateral={320}
      superior={
        <BarraSuperior titulo="Teatro de Papel" bajada={ayuda}>
          <BotonAccion icono="undo" etiqueta="Deshacer" onClick={deshacer} disabled={!puedeDeshacer} />
          <BotonAccion icono="redo" etiqueta="Rehacer" onClick={rehacer} disabled={!puedeRehacer} />
          <BotonAccion icono="auto_awesome" texto="Sorpréndeme" onClick={sorprender} disabled={!listo || ocupado} />
          <BotonAccion icono="download" texto="Tarjeta" etiqueta="Descargar la tarjeta PNG" onClick={exportar} disabled={items.length === 0 || ocupado} />
          {puedeGrabar() && (
            <BotonAccion icono="movie" primario onClick={grabar} disabled={items.length === 0 || ocupado}
              texto={grabando === null ? 'Grabar loop' : `Grabando ${Math.round(grabando * 100)} %`} />
          )}
        </BarraSuperior>
      }
      lateral={<>
        <Seccion titulo="Escenario">
          <div className="k-seg escenarios" role="radiogroup" aria-label="Escenario">
            {ESCENARIOS.map(e => (
              <button key={e.id} type="button" role="radio" aria-checked={escId === e.id} disabled={ocupado}
                onClick={() => { setEscId(e.id); setSel(null); }}>
                <span className="material-symbols-outlined" aria-hidden="true">{ICONO_ESC[e.id]}</span>{e.nombre}
              </button>
            ))}
          </div>
        </Seccion>

        <Seccion titulo={lleno ? `Biblioteca · tope de ${MAX_PIEZAS}` : 'Biblioteca'}>
          {lleno && <p className="k-ayuda">Llegaste a {MAX_PIEZAS} piezas: quita una para sumar otra.</p>}
          <div className="bandeja">
            {Object.keys(esc.piezas).map(id => {
              const pz = pieza(id), mini = miniaturaDe(id);
              return (
                <button key={id} type="button" className="k-btn pieza-btn" disabled={!listo || lleno || ocupado} aria-label={`Añadir ${pz.nombre}`}
                  onClick={e => { if (e.detail === 0) agregar(id); }}
                  onPointerDown={e => { toque.current = { tipo: id, x: e.clientX, y: e.clientY }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sin captura */ } }}
                  onPointerMove={e => {
                    const t = toque.current;
                    if (t && (fantasma || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 8)) setFantasma({ tipo: t.tipo, x: e.clientX, y: e.clientY });
                  }}
                  onPointerUp={soltarFantasma}
                  onPointerCancel={() => { toque.current = null; setFantasma(null); }}>
                  {mini ? <img src={mini} alt="" draggable={false} /> : <span className="pieza-vacia" />}
                  <span className="pieza-nombre">{pz.nombre}</span>
                </button>
              );
            })}
          </div>
        </Seccion>

        <Seccion titulo={elegido ? p!.nombre : 'Pieza elegida'}>
          {!elegido && <p className="k-ayuda">Toca una figura del escenario (o su fila en la línea de tiempo) para moverla, cambiar su tamaño, su animación o su trayecto.</p>}
          {elegido && (<>
            <p className="k-ayuda">Arrástrala para moverla. Tira del círculo amarillo para cambiar su tamaño.</p>
            {variantes.length > 1 && <p className="prop-etq">Animación</p>}
            {variantes.length > 1 && (
              <Segmentado etiqueta="Animación" valor={elegido.variante ?? 0} onCambiar={n => cambiarElegida(i => ({ ...i, variante: n }))}
                opciones={variantes.map((v, n) => ({ valor: n, texto: v.nombre }))} />
            )}
            {p!.movil && <p className="prop-etq">Trayecto</p>}
            {p!.movil && (
              <Segmentado etiqueta="Trayecto" valor={elegido.destino ? 'camina' : 'fijo'}
                onCambiar={v => {
                  if (v === 'fijo') cambiarElegida(i => ({ ...i, destino: undefined }));
                  else if (!elegido.destino) cambiarElegida(i => ({ ...i, destino: { x: Math.max(25, Math.min(215, Math.round(i.x + (i.espejo ? -70 : 70)))), y: i.y } }));
                }}
                opciones={[{ valor: 'fijo', texto: 'Quieto' }, { valor: 'camina', texto: 'De A a B' }]} />
            )}
            {p!.colores && <p className="prop-etq">Color</p>}
            {p!.colores && (
              <Paleta etiqueta={`Color del ${p!.nombre.toLowerCase()}`} colores={Object.fromEntries(p!.colores.map(c => [c.nombre, c.hex]))}
                elegido={(p!.colores.find(c => c.id === elegido.color) ?? p!.colores[0]).nombre}
                onElegir={n => {
                  const c = p!.colores!.find(x => x.nombre === n);
                  // Cada color se recorta la primera vez que se elige (son pocas capas: tarda un instante).
                  const uid = elegido.uid;
                  if (c) cargarLote(archivosColor(p!, c.id)).then(() => {
                    registrar();
                    actualizar(l => l.map(it => (it.uid === uid ? { ...it, color: c.id } : it)));
                  });
                }} />
            )}
            <div className="transformar">
              <BotonEtiquetado icono="zoom_in" texto="Agrandar" onClick={() => cambiarElegida(i => ({ ...i, escala: limitarEscala(i.tipo, i.escala * 1.15) }))} />
              <BotonEtiquetado icono="zoom_out" texto="Achicar" onClick={() => cambiarElegida(i => ({ ...i, escala: limitarEscala(i.tipo, i.escala / 1.15) }))} />
              <BotonEtiquetado icono="flip" texto="Voltear" onClick={() => cambiarElegida(i => ({ ...i, espejo: !i.espejo }))} />
              {elegido.destino && <BotonEtiquetado icono="swap_horiz" texto="Invertir" etiqueta="Invertir el trayecto" onClick={() => cambiarElegida(i => i.destino ? ({ ...i, x: i.destino.x, y: i.destino.y, destino: { x: i.x, y: i.y }, espejo: !i.espejo }) : i)} />}
              <BotonEtiquetado icono="flip_to_front" texto="Al frente" onClick={alFrente} />
              <BotonEtiquetado icono="flip_to_back" texto="Al fondo" onClick={alFondo} />
              <BotonEtiquetado icono="delete" texto="Quitar" onClick={quitar} />
            </div>
            {elegido.destino && <p className="k-ayuda">Arrastra el punto verde B en el escenario. En la línea de tiempo, mueve B para elegir cuándo llega.</p>}
          </>)}
        </Seccion>
        <Confirmar icono="restart_alt" texto="Vaciar el escenario" disabled={items.length === 0 || ocupado} onConfirmar={vaciar} />
        {errorVideo && <p className="k-ayuda ayuda-error" role="alert">{errorVideo}</p>}
      </>}
      inferior={
        <LineaDeTiempo
          items={items} sel={sel} tiempo={tiempoVisual} pausado={pausado} fps={fps} borde={borde} max={MAX_PIEZAS}
          onPlay={() => setPausado(v => !v)}
          onTiempo={ms => { setPausado(true); cambiarTiempoManual(ms); }}
          onFps={setFps} onBorde={setBorde}
          onElegir={uid => setSel(uid)}
          onLlegadaInicio={() => registrar()}
          onLlegada={(uid, t) => actualizar(l => l.map(it => (it.uid === uid ? { ...it, llegada: Math.round(t * 100) / 100 } : it)))}
        />
      }
    >
      <div className="escenario-fit">
        <div className="lienzo-wrap lienzo-fit">
          <canvas
            ref={lienzo}
            width={RESOLUCION_CANVAS}
            height={RESOLUCION_CANVAS}
            className={'canvas-escenario' + (fantasma ? ' recibe' : '')}
            onPointerDown={alBajar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
            aria-label={`Escenario ${esc.nombre}: toca una pieza para moverla`}
          />
          {!listo && <Carga hechas={carga.hechas} total={carga.total} />}
          {ocupado && <div className="velo-grabando" role="status"><span className="material-symbols-outlined" aria-hidden="true">movie</span>Grabando tu loop…</div>}
        </div>
      </div>
    </PantallaHerramienta>
    {fantasma && miniaturaDe(fantasma.tipo) && (
      <img className="fantasma" src={miniaturaDe(fantasma.tipo)} alt="" style={{ left: fantasma.x, top: fantasma.y }} />
    )}
  </>);
};

// Botón de propiedades: ícono con su nombre debajo (plan 008, T-011).
const BotonEtiquetado: React.FC<{ icono: string; texto: string; etiqueta?: string; onClick: () => void }> = ({ icono, texto, etiqueta, onClick }) => (
  <button type="button" className="k-btn prop-btn" onClick={onClick} aria-label={etiqueta ?? texto}>
    <span className="material-symbols-outlined" aria-hidden="true">{icono}</span>
    <span className="prop-texto">{texto}</span>
  </button>
);

// Tirador de tamaño: la esquina de la caja, pero siempre dentro del escenario para poder tomarlo (plan 008, T-009).
export const posTirador = (b: { x: number; y: number; w: number; h: number }) => ({
  x: Math.min(ESCENARIO - ASA, Math.max(ASA, b.x + b.w)),
  y: Math.min(ESCENARIO - ASA, Math.max(ASA, b.y + b.h)),
});
