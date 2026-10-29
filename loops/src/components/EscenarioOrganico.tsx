import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PIEZAS, pieza } from '../escenario/piezas';
import { ESCENARIOS, escenario } from '../escenario/escenarios';
import { sorprendeme } from '../escenario/sorprendeme';
import { cargarFuentesTarjeta, dibujarTarjetaMotion, exportarTarjetaMotion } from '../lib/exportarTarjeta';
import { duracionLoop, grabarLoop, puedeGrabar } from '../lib/grabarLoop';
import type { VideoLoop } from './ModalExportar';
import { LineaDeTiempo } from './LineaDeTiempo';
import { BarraSuperior, BotonAccion, Confirmar, PantallaHerramienta, Seccion, Segmentado } from '../../../shared/ui/Kit';
import {
  ASA, ESCENARIO, cajaItem, quieto, cargarTodo, dibujarEscenario, dibujarPieza, dibujarSeleccion,
  posicionItem, DURACION_TRAYECTO, type Item,
} from '../escenario/dibujar';

interface Props {
  onExportar: (canvas: HTMLCanvasElement) => void;
  onVideo: (tarjetaPng: Blob, video: VideoLoop) => void;
}

type Gesto =
  | { tipo: 'mover'; uid: number; dx: number; dy: number; movido: boolean }
  | { tipo: 'escalar'; uid: number; d0: number; e0: number; movido: boolean }
  | { tipo: 'destino'; uid: number; movido: boolean };
type Mapa = Record<string, Item[]>;

const ESCALA_INICIAL: Record<string, number> = {
  pudu: 0.75, paloma: 0.6, sol: 1, araucaria: 1.1, pina: 0.65, helecho: 0.6, quisco: 0.7, flor: 0.65,
  pez: 0.7, pinguino: 0.6, cantaro: 0.5, canasto: 0.5, kisa: 0.7,
  condor: 0.6, gaviota: 0.55, picaflor: 0.45, carpintero: 0.5, chucao: 0.6, huemul: 0.7, guanaco: 0.7,
  chagual: 0.75, cochayuyo: 0.7, doca: 0.6, concha: 0.45, chanar: 0.8, alerce: 0.95, copihue: 0.6, maqui: 0.65, telar: 0.7, luna: 0.9, lluvia: 0.9,
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
  condor: [0.32, 1.3], gaviota: [0.3, 1.2], picaflor: [0.25, 1], carpintero: [0.3, 1.1], chucao: [0.3, 1.1],
  huemul: [0.38, 1.3], guanaco: [0.38, 1.3], chagual: [0.4, 1.5], cochayuyo: [0.35, 1.4], doca: [0.3, 1.2], concha: [0.25, 1],
  chanar: [0.45, 1.6], alerce: [0.5, 2], copihue: [0.3, 1.3], maqui: [0.35, 1.4], telar: [0.35, 1.3], luna: [0.5, 1.6], lluvia: [0.5, 1.6],
};

const limitar = (tipo: string, n: number) => {
  const [min, max] = LIMITES_ESCALA[tipo] ?? [0.3, 1.5];
  return Math.min(max, Math.max(min, n));
};

const durDe = (it: Item) => {
  const p = pieza(it.tipo);
  return p.variantes?.[it.variante ?? 0]?.durMs ?? p.durMs;
};

const DURACION_LOOP = DURACION_TRAYECTO;
const RESOLUCION_CANVAS = 1080;

export const EscenarioOrganico: React.FC<Props> = ({ onExportar, onVideo }) => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [escId, setEscId] = useState(ESCENARIOS[0].id);
  const [mapa, setMapa] = useState<Mapa>({});
  const [sel, setSel] = useState<number | null>(null);
  const [fps, setFps] = useState(12);
  // Parte pausado: así se arma la escena con calma; al darle play se ve el loop completo.
  const [pausado, setPausado] = useState(true);
  const [borde, setBorde] = useState(true);
  const [listo, setListo] = useState(false);
  const [grabando, setGrabando] = useState<number | null>(null);
  const [errorVideo, setErrorVideo] = useState('');
  const [puedeDeshacer, setPuedeDeshacer] = useState(false);
  const [miniaturas, setMiniaturas] = useState<Record<string, string>>({});
  const [puedeRehacer, setPuedeRehacer] = useState(false);
  const [tiempoVisual, setTiempoVisual] = useState(0);
  // Pieza que se arrastra desde la biblioteca al escenario (el «fantasma» sigue al dedo).
  const [fantasma, setFantasma] = useState<{ tipo: string; x: number; y: number } | null>(null);
  const toque = useRef<{ tipo: string; x: number; y: number } | null>(null);

  const esc = escenario(escId);
  const items = mapa[escId] ?? [];

  const relojRef = useRef(0);
  const vivo = useRef({ items, sel, fps, pausado, fondo: esc.fondo, mapa, escId, borde, reloj: 0 });
  vivo.current = { items, sel, fps, pausado, fondo: esc.fondo, mapa, escId, borde, reloj: relojRef.current };
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

      // En pausa, la pieza elegida se edita quieta en su punto A; en play, camina como en el video.
      dibujarEscenario(ctx, c.width, v.items, ms, v.fondo, v.borde, v.pausado ? v.sel : null);
      const it = v.items.find(i => i.uid === v.sel);
      if (it) dibujarSeleccion(ctx, c.width, it, ms, v.pausado);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [listo]);

  const aEscenario = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * ESCENARIO, y: ((e.clientY - r.top) / r.height) * ESCENARIO };
  };

  const alBajar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = aEscenario(e), { items: lista, sel: actual, pausado: enPausa } = vivo.current;
    const comoSeVe = (it: Item) => (enPausa ? quieto(it) : it);
    const msActual = relojRef.current;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    antesDelGesto.current = vivo.current.mapa;

    // 1. Tirador de escala de la pieza elegida
    const elegido = lista.find(i => i.uid === actual);
    if (elegido) {
      // 0. El punto B del trayecto (se arrastra para elegir hacia dónde camina)
      if (elegido.destino && Math.hypot(p.x - elegido.destino.x, p.y - elegido.destino.y) <= ASA * 2.2) {
        gesto.current = { tipo: 'destino', uid: elegido.uid, movido: false };
        return;
      }
      const b = cajaItem(comoSeVe(elegido), msActual);
      if (Math.hypot(p.x - (b.x + b.w), p.y - (b.y + b.h)) <= ASA * 2.2) {
        const pos = posicionItem(comoSeVe(elegido), msActual);
        gesto.current = { tipo: 'escalar', uid: elegido.uid, d0: Math.hypot(p.x - pos.x, p.y - pos.y) || 1, e0: elegido.escala, movido: false };
        return;
      }
    }
    // 2. La pieza bajo el dedo
    for (let i = lista.length - 1; i >= 0; i--) {
      // En pausa, la pieza se toca en su punto A (ahí empieza el trayecto).
      const it = comoSeVe(lista[i]);
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
      return { ...it, escala: limitar(it.tipo, g.e0 * (Math.hypot(p.x - it.x, p.y - it.y) / g.d0)) };
    }));
  };

  const alSoltar = () => { gesto.current = null; };

  const agregar = (tipo: string, en?: { x: number; y: number }) => {
    registrar();
    const n = vivo.current.items.length, uid = uidSig.current++;
    const zona = esc.piezas[tipo];
    const it: Item = {
      uid, tipo, escala: ESCALA_INICIAL[tipo] ?? 1, espejo: false, variante: 0,
      x: en?.x ?? ESCENARIO / 2 + ((n * 23) % 70) - 35, y: en?.y ?? (zona === 'cielo' ? 70 : zona === 'agua' ? 128 : 172),
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

  const ES_MOVIL = (tipo: string) => ['pudu', 'pinguino', 'paloma', 'pez', 'condor', 'gaviota', 'picaflor', 'carpintero', 'chucao', 'huemul', 'guanaco'].includes(tipo);

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

  const ocupado = grabando !== null;
  const ayuda = !listo ? 'Cargando piezas…'
    : items.length === 0 ? 'Arrastra una pieza de la biblioteca al escenario o prueba «Sorpréndeme»'
    : elegido ? `Seleccionado: ${pieza(elegido.tipo).nombre} · Arrastra para mover o tira de la esquina amarilla para tamaño`
    : 'Toca cualquier figura del escenario para seleccionarla';


  const ICONO_ESC: Record<string, string> = { cordillera: 'landscape', mar: 'water', bosque: 'forest', desierto: 'wb_sunny' };
  const p = elegido && pieza(elegido.tipo);
  const variantes = p?.variantes ?? [];

  return (<>
    <PantallaHerramienta
      anchoLateral={320}
      superior={
        <BarraSuperior titulo="Teatro de Papel" bajada={ayuda}>
          <BotonAccion icono="undo" etiqueta="Deshacer" onClick={deshacer} disabled={!puedeDeshacer} />
          <BotonAccion icono="redo" etiqueta="Rehacer" onClick={rehacer} disabled={!puedeRehacer} />
          <BotonAccion icono="auto_awesome" texto="Sorpréndeme" onClick={sorprender} disabled={!listo} />
          <BotonAccion icono="download" texto="Tarjeta" etiqueta="Descargar la tarjeta PNG" onClick={exportar} disabled={items.length === 0 || ocupado} />
          {puedeGrabar() && (
            <BotonAccion icono="movie" primario onClick={grabar} disabled={items.length === 0 || ocupado}
              texto={grabando === null ? 'Grabar loop' : `Grabando… ${Math.round(grabando * 100)} %`} />
          )}
        </BarraSuperior>
      }
      lateral={<>
        <Seccion titulo="Escenario">
          <Segmentado etiqueta="Escenario" valor={escId} onCambiar={id => { setEscId(id); setSel(null); }}
            opciones={ESCENARIOS.map(e => ({ valor: e.id, texto: <span className="esc-op"><span className="material-symbols-outlined" aria-hidden="true">{ICONO_ESC[e.id]}</span>{e.nombre}</span> }))} />
        </Seccion>

        <Seccion titulo="Biblioteca · arrastra al escenario">
          <div className="bandeja">
            {PIEZAS.filter(pz => pz.id in esc.piezas).map(pz => (
              <button key={pz.id} type="button" className="k-btn pieza-btn" disabled={!listo} aria-label={`Añadir ${pz.nombre}`} title={pz.nombre}
                onClick={e => { if (e.detail === 0) agregar(pz.id); }}
                onPointerDown={e => { toque.current = { tipo: pz.id, x: e.clientX, y: e.clientY }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sin captura */ } }}
                onPointerMove={e => {
                  const t = toque.current;
                  if (t && (fantasma || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 8)) setFantasma({ tipo: t.tipo, x: e.clientX, y: e.clientY });
                }}
                onPointerUp={soltarFantasma}
                onPointerCancel={() => { toque.current = null; setFantasma(null); }}>
                {miniaturas[pz.id] ? <img src={miniaturas[pz.id]} alt="" draggable={false} /> : <span className="pieza-vacia" />}
                <span>{pz.nombre}</span>
              </button>
            ))}
          </div>
        </Seccion>

        <Seccion titulo={elegido ? `Propiedades · ${p!.nombre}` : 'Propiedades'} crece>
          {!elegido && <p className="k-ayuda">Toca una figura del escenario (o su fila en la línea de tiempo) para moverla, cambiar su tamaño, su animación o su trayecto.</p>}
          {elegido && (<>
            {ES_MOVIL(elegido.tipo) && (
              <Segmentado etiqueta="Trayecto" valor={elegido.destino ? 'camina' : 'fijo'}
                onCambiar={v => {
                  if (v === 'fijo') cambiarElegida(i => ({ ...i, destino: undefined }));
                  else if (!elegido.destino) cambiarElegida(i => ({ ...i, destino: { x: Math.max(25, Math.min(215, Math.round(i.x + (i.espejo ? -70 : 70)))), y: i.y } }));
                }}
                opciones={[{ valor: 'fijo', texto: 'En su lugar' }, { valor: 'camina', texto: 'Camina A → B' }]} />
            )}
            {variantes.length > 1 && (
              <Segmentado etiqueta="Animación" valor={elegido.variante ?? 0} onCambiar={n => cambiarElegida(i => ({ ...i, variante: n }))}
                opciones={variantes.map((v, n) => ({ valor: n, texto: v.nombre }))} />
            )}
            <div className="transformar">
              <BotonAccion icono="zoom_in" etiqueta="Más grande" onClick={() => cambiarElegida(i => ({ ...i, escala: limitar(i.tipo, i.escala * 1.15) }))} />
              <BotonAccion icono="zoom_out" etiqueta="Más chica" onClick={() => cambiarElegida(i => ({ ...i, escala: limitar(i.tipo, i.escala / 1.15) }))} />
              <BotonAccion icono="flip" etiqueta="Voltear" onClick={() => cambiarElegida(i => ({ ...i, espejo: !i.espejo }))} />
              {elegido.destino && <BotonAccion icono="swap_horiz" etiqueta="Invertir el trayecto" onClick={() => cambiarElegida(i => i.destino ? ({ ...i, x: i.destino.x, y: i.destino.y, destino: { x: i.x, y: i.y }, espejo: !i.espejo }) : i)} />}
              <BotonAccion icono="flip_to_front" etiqueta="Al frente" onClick={alFrente} />
              <BotonAccion icono="flip_to_back" etiqueta="Al fondo" onClick={alFondo} />
              <BotonAccion icono="content_copy" etiqueta="Duplicar" onClick={duplicar} />
              <BotonAccion icono="delete" etiqueta="Quitar" onClick={quitar} />
            </div>
            {elegido.destino && <p className="k-ayuda">{pausado ? 'Arrastra el punto verde B en el escenario. En la línea de tiempo, mueve B para elegir cuándo llega.' : 'Pausa el loop para editar el trayecto.'}</p>}
          </>)}
        </Seccion>
        <Confirmar icono="restart_alt" texto="Vaciar el escenario" disabled={items.length === 0 || ocupado} onConfirmar={vaciar} />
        {errorVideo && <p className="k-ayuda ayuda-error" role="alert">{errorVideo}</p>}
      </>}
      inferior={
        <LineaDeTiempo
          items={items} sel={sel} tiempo={tiempoVisual} pausado={pausado} fps={fps} borde={borde}
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
        </div>
      </div>
    </PantallaHerramienta>
    {fantasma && miniaturas[fantasma.tipo] && (
      <img className="fantasma" src={miniaturas[fantasma.tipo]} alt="" style={{ left: fantasma.x, top: fantasma.y }} />
    )}
  </>);
};
