import React, { useCallback, useEffect, useRef, useState } from 'react';
import { otorgarCreacion } from '../../shared/juego';
import {
  COLS, FILAS, HEX, MODELOS, STICKERS, anchoTag, baseDe, cargar, dibujarAnden, dibujarCarro, dibujarTren, disenoVacio,
  escribir, pintar, pngDelCarro, rellenar, srcSticker, type Diseno, type IdModelo, type IdSticker, type NombreColor,
} from './lib/vagon';
import { descargar, tarjeta } from './lib/archivos';
import { BarraHerramientas, BarraSuperior, BotonAccion, Confirmar, Paleta, PantallaHerramienta, Seccion, Segmentado } from '../../shared/ui/Kit';
import { Quiosco, Tutorial, useTutorialVisto } from '../../shared/ui/Tutorial';
import '../../shared/ui/somos-kit.css';
import './styles.css';

// Vagón · experiencia Pixel. Piloto de las barras fijas (propuesta 005): lienzo grande, barra inferior con las
// herramientas y la paleta, y barra derecha con la biblioteca (modelo, carros) y las opciones de la herramienta activa.
type Herramienta = 'lapiz' | 'balde' | 'borrar' | 'sticker' | 'tag';
const HERRAMIENTAS: { id: Herramienta; nombre: string; icono: string; ayuda: string }[] = [
  { id: 'lapiz', nombre: 'Lápiz', icono: 'draw', ayuda: 'Arrastra sobre el carro para pintar pixel a pixel.' },
  { id: 'balde', nombre: 'Balde', icono: 'format_color_fill', ayuda: 'Toca una zona: se rellena todo lo que tenga el mismo color.' },
  { id: 'borrar', nombre: 'Borrar', icono: 'ink_eraser', ayuda: 'Devuelve los pixeles al diseño original del carro.' },
  { id: 'sticker', nombre: 'Sticker', icono: 'add_reaction', ayuda: 'Elige un sticker y toca el carro para pegarlo.' },
  { id: 'tag', nombre: 'Tag', icono: 'text_fields', ayuda: 'Escribe tu tag y toca el carro donde quieres que empiece.' },
];
const QUIETO = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const SALIDA_MS = 4800;
const TAM_STICKER = { Chico: 8, Grande: 13 } as const;

export const App: React.FC = () => {
  const [empezado, setEmpezado] = useTutorialVisto('vagon');
  const [modelo, setModelo] = useState<IdModelo>('l1');
  const [carros, setCarros] = useState(3);
  const [bases, setBases] = useState<Partial<Record<IdModelo, string[]>>>({});
  const [imgs, setImgs] = useState<Record<string, HTMLImageElement>>({});
  const [diseno, setDiseno] = useState<Diseno>(disenoVacio);
  const [atras, setAtras] = useState<Diseno[]>([]);
  const [adelante, setAdelante] = useState<Diseno[]>([]);
  const [herr, setHerr] = useState<Herramienta>('lapiz');
  const [color, setColor] = useState<NombreColor>('Amarillo');
  const [grosor, setGrosor] = useState(1);
  const [sticker, setSticker] = useState<IdSticker>('spray');
  const [tamSticker, setTamSticker] = useState<keyof typeof TAM_STICKER>('Chico');
  const [tag, setTag] = useState('');
  const [saliendo, setSaliendo] = useState<number | null>(null);
  const [aviso, setAviso] = useState('');
  const lienzo = useRef<HTMLCanvasElement>(null);
  const caja = useRef({ x: 0, y: 0, cel: 1 });
  const arrastre = useRef(false);
  const base = bases[modelo];

  useEffect(() => {
    MODELOS.forEach(m => baseDe(m.lateral).then(b => setBases(l => ({ ...l, [m.id]: b }))));
    Promise.all(STICKERS.map(id => cargar(srcSticker(id)).then(im => [id, im] as const))).then(l => setImgs(Object.fromEntries(l)));
  }, []);

  // ---------- dibujo ----------
  const dibujar = useCallback((ahora = performance.now()) => {
    const c = lienzo.current; if (!c || !base) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(c.clientWidth * dpr), H = Math.round(c.clientHeight * dpr);
    if (!W || !H) return;
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const ctx = c.getContext('2d')!;
    const via = H * 0.86;
    dibujarAnden(ctx, W, H, via);
    if (saliendo != null) {
      // Sale a la vía: el tren entra, se detiene un momento y se va.
      const t = (ahora - saliendo) / SALIDA_MS, cel = Math.min((via - H * 0.25) / FILAS, W / (COLS * 1.6));
      const largo = carros * COLS * cel + (carros - 1) * cel, parado = (W - largo) / 2;
      let x: number;
      if (t < 0.32) x = W + (parado - W) * (1 - Math.pow(1 - t / 0.32, 3));
      else if (t < 0.58) x = parado;
      else x = parado - (parado + largo + 20) * Math.pow((t - 0.58) / 0.42, 2.4);
      dibujarTren(ctx, x, via - FILAS * cel, cel, carros, base, diseno, imgs);
      return;
    }
    const cel = Math.min((W * 0.94) / COLS, (via - H * 0.2) / FILAS), x0 = (W - COLS * cel) / 2, y0 = via - FILAS * cel;
    caja.current = { x: x0 / dpr, y: y0 / dpr, cel: cel / dpr };
    dibujarCarro(ctx, x0, y0, cel, base, diseno, imgs, true);
  }, [base, diseno, imgs, saliendo, carros]);

  useEffect(() => { dibujar(); }, [dibujar, empezado]);
  useEffect(() => {
    const c = lienzo.current; if (!c) return;
    const ro = new ResizeObserver(() => dibujar()); ro.observe(c);
    return () => ro.disconnect();
  }, [dibujar, empezado]);
  useEffect(() => {
    if (saliendo == null) return;
    let raf = 0;
    const cuadro = (ahora: number) => {
      if (ahora - saliendo > SALIDA_MS) { setSaliendo(null); return; }
      dibujar(ahora); raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(raf);
  }, [saliendo, dibujar]);
  useEffect(() => { if (!aviso) return; const id = setTimeout(() => setAviso(''), 2600); return () => clearTimeout(id); }, [aviso]);

  // ---------- edición ----------
  const cambiar = (nuevo: Diseno, guardarHistoria = true) => {
    if (guardarHistoria) { setAtras(l => [...l.slice(-39), diseno]); setAdelante([]); }
    setDiseno(nuevo);
  };
  const celda = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const r = ev.currentTarget.getBoundingClientRect(), { x, y, cel } = caja.current;
    return { col: Math.floor((ev.clientX - r.left - x) / cel), fila: Math.floor((ev.clientY - r.top - y) / cel), fx: (ev.clientX - r.left - x) / cel, fy: (ev.clientY - r.top - y) / cel };
  };
  const dentro = (col: number, fila: number) => col >= 0 && col < COLS && fila >= 0 && fila < FILAS;
  const alTocar = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!base || saliendo != null) return;
    const { col, fila, fx, fy } = celda(ev);
    if (!dentro(col, fila)) return;
    if (herr === 'lapiz' || herr === 'borrar') {
      ev.currentTarget.setPointerCapture(ev.pointerId); arrastre.current = true;
      cambiar(pintar(diseno, col, fila, herr === 'lapiz' ? HEX[color] : null, grosor));
    } else if (herr === 'balde') cambiar(rellenar(base, diseno, col, fila, HEX[color]));
    else if (herr === 'sticker') cambiar({ ...diseno, stickers: [...diseno.stickers, { id: sticker, x: fx, y: fy, tam: TAM_STICKER[tamSticker] }] });
    else if (herr === 'tag') {
      if (!tag.trim()) { setAviso('Escribe tu tag en la barra de la derecha'); return; }
      cambiar(escribir(diseno, tag, Math.min(col, COLS - anchoTag(tag)), Math.min(fila, FILAS - 7), HEX[color]));
    }
  };
  const alMover = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!arrastre.current || !base) return;
    const { col, fila } = celda(ev);
    if (dentro(col, fila)) setDiseno(d => pintar(d, col, fila, herr === 'lapiz' ? HEX[color] : null, grosor));
  };
  const alSoltar = () => { arrastre.current = false; };
  const deshacer = () => { if (!atras.length) return; setAdelante(l => [diseno, ...l]); setDiseno(atras[atras.length - 1]); setAtras(l => l.slice(0, -1)); };
  const rehacer = () => { if (!adelante.length) return; setAtras(l => [...l, diseno]); setDiseno(adelante[0]); setAdelante(l => l.slice(1)); };

  // Sale a la vía: además, el carro queda guardado para que pase por la Estación (HUB) en este mismo equipo.
  const salir = () => {
    if (!base) return;
    try { localStorage.setItem('sd:vagon', JSON.stringify({ png: pngDelCarro(base, diseno, imgs), modelo, carros, ts: Date.now() })); } catch { /* sin almacenamiento */ }
    setAviso('Tu vagón va camino a la Estación');
    otorgarCreacion('vagon');
    if (!QUIETO) setSaliendo(performance.now());
  };
  const exportar = async () => {
    if (!base) return;
    const blob = await tarjeta((x, lado) => {
      const via = lado * 0.8;
      dibujarAnden(x, lado, lado, via);
      // el carro diseñado, grande sobre la vía
      const cel = Math.min((lado * 0.92) / COLS, (via - lado * 0.3) / FILAS);
      dibujarCarro(x, (lado - COLS * cel) / 2, via - FILAS * cel, cel, base, diseno, imgs);
    }, ['Mi vagón', 'de metro']);
    descargar(blob, `vagon-${modelo}-${carros}-carros.png`);
    otorgarCreacion('vagon');
  };

  if (!empezado) return (
    <Tutorial etiqueta="Pixel · pixel art e identidad del transporte" titulo="Vagón"
      pasos={[
        { icono: 'train', texto: 'Elige el modelo de tren y cuántos carros lleva.' },
        { icono: 'brush', texto: 'Diseña tu carro: pinta pixel a pixel, rellena, pega stickers y pon tu tag.' },
        { icono: 'route', texto: 'Hazlo salir a la vía: tu vagón pasará por la Estación.' },
      ]}
      acciones={[{ texto: 'Diseñar mi vagón', icono: 'train', alTocar: setEmpezado }]} />
  );

  const activa = HERRAMIENTAS.find(h => h.id === herr)!;
  const nombreModelo = MODELOS.find(m => m.id === modelo)!.nombre;
  return (
    <>
      <PantallaHerramienta
        anchoLateral={290}
        superior={
          <BarraSuperior titulo="Vagón" bajada={activa.ayuda}>
            <BotonAccion icono="undo" etiqueta="Deshacer" onClick={deshacer} disabled={!atras.length} />
            <BotonAccion icono="redo" etiqueta="Rehacer" onClick={rehacer} disabled={!adelante.length} />
            <BotonAccion icono="train" texto="Salir a la vía" onClick={salir} disabled={!base || saliendo != null} />
            <BotonAccion icono="download" texto="Descargar" primario onClick={exportar} disabled={!base} />
          </BarraSuperior>
        }
        lateral={<>
          <Seccion titulo="Modelo">
            <div className="modelos" role="radiogroup" aria-label="Modelo de tren">
              {MODELOS.map(m => (
                <button key={m.id} type="button" role="radio" aria-checked={modelo === m.id} className="k-btn modelo-btn" onClick={() => setModelo(m.id)}>
                  <img src={m.lateral} alt="" /><span><b>{m.nombre}</b><small>{m.detalle}</small></span>
                </button>
              ))}
            </div>
          </Seccion>
          <Seccion titulo="Carros del tren">
            <Segmentado etiqueta="Carros" valor={carros} onCambiar={setCarros} opciones={[1, 2, 3].map(n => ({ valor: n, texto: String(n) }))} />
          </Seccion>
          <Seccion titulo={activa.nombre} crece>
            {(herr === 'lapiz' || herr === 'borrar') && (
              <Segmentado etiqueta="Grosor" valor={grosor} onCambiar={setGrosor} opciones={[1, 2, 3].map(n => ({ valor: n, texto: <><i className="punto" style={{ '--n': n } as React.CSSProperties} />{n} px</> }))} />
            )}
            {herr === 'sticker' && (<>
              <div className="stickers" role="radiogroup" aria-label="Sticker">
                {STICKERS.map(id => (
                  <button key={id} type="button" role="radio" aria-checked={sticker === id} className="k-color sticker-btn" onClick={() => setSticker(id)} aria-label={id.replace('-', ' ')}>
                    <img src={srcSticker(id)} alt="" />
                  </button>
                ))}
              </div>
              <Segmentado etiqueta="Tamaño del sticker" valor={tamSticker} onCambiar={setTamSticker} opciones={(Object.keys(TAM_STICKER) as (keyof typeof TAM_STICKER)[]).map(t => ({ valor: t, texto: t }))} />
            </>)}
            {herr === 'tag' && (
              <label className="campo-tag">
                <span className="sr">Tu tag</span>
                <input id="tag" value={tag} maxLength={9} placeholder="TU TAG" autoComplete="off" onChange={e => setTag(e.target.value.toUpperCase())} />
              </label>
            )}
            <p className="k-ayuda">{activa.ayuda}</p>
          </Seccion>
          <Confirmar icono="restart_alt" texto="Empezar de nuevo" onConfirmar={() => cambiar(disenoVacio())} />
        </>}
        inferior={<>
          <BarraHerramientas herramientas={HERRAMIENTAS} activa={herr} onElegir={setHerr} />
          <Paleta colores={HEX} elegido={color} onElegir={c => setColor(c as NombreColor)} />
        </>}
      >
        <canvas ref={lienzo} className={'lienzo-vagon herr-' + herr} onPointerDown={alTocar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alSoltar}
          role="img" aria-label={`Lateral del carro ${nombreModelo}. ${activa.ayuda}`} />
      </PantallaHerramienta>
      {aviso && <div className="aviso" role="status">{aviso}</div>}
      <Quiosco app="vagon" />
    </>
  );
};
