import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  COLS, FILAS, HEX, MODELOS, PALETA, STICKERS, anchoTag, baseDe, cargar, dibujarAnden, dibujarCarro, dibujarTren, disenoVacio,
  escribir, pintar, pngDelCarro, rellenar, srcSticker, type Diseno, type IdModelo, type IdSticker, type NombreColor,
} from './lib/vagon';
import { descargar, tarjeta } from './lib/archivos';
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
  const [empezado, setEmpezado] = useState(false);
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
  const [confirmar, setConfirmar] = useState(false);
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
    setConfirmar(false);
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
  };

  if (!empezado) {
    return (
      <div className="portada">
        <a className="volver" href="../../"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Experiencias</a>
        <div className="portada-cuerpo">
          <p className="etq">Pixel · pixel art e identidad del transporte</p>
          <h1>Vagón</h1>
          <ol className="pasos">
            <li><b>1</b> Elige el modelo de tren y cuántos carros lleva.</li>
            <li><b>2</b> Diseña tu carro: pinta pixel a pixel, rellena con el balde, pega stickers y pon tu tag.</li>
            <li><b>3</b> Hazlo salir a la vía: tu vagón pasará por la Estación.</li>
          </ol>
          <div className="portada-acciones">
            <button type="button" className="btn primario" onClick={() => setEmpezado(true)}>
              <span className="material-symbols-outlined" aria-hidden="true">train</span>Diseñar mi vagón
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activa = HERRAMIENTAS.find(h => h.id === herr)!;
  return (
    <div className="app-vagon">
      <header className="barra-superior">
        <div className="lado-izq">
          <a className="volver" href="../../" id="volver-hub"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Experiencias</a>
          <div className="barra-info"><h1>Vagón</h1><p className="bajada-corta">{activa.ayuda}</p></div>
        </div>
        <div className="acciones-sup">
          <button type="button" className="btn solo-icono" onClick={deshacer} disabled={!atras.length} aria-label="Deshacer"><span className="material-symbols-outlined" aria-hidden="true">undo</span></button>
          <button type="button" className="btn solo-icono" onClick={rehacer} disabled={!adelante.length} aria-label="Rehacer"><span className="material-symbols-outlined" aria-hidden="true">redo</span></button>
          <button type="button" className="btn" onClick={salir} disabled={!base || saliendo != null}><span className="material-symbols-outlined" aria-hidden="true">train</span>Salir a la vía</button>
          <button type="button" className="btn primario" onClick={exportar} disabled={!base}><span className="material-symbols-outlined" aria-hidden="true">download</span>Descargar</button>
        </div>
      </header>

      <main className="cuerpo-vagon">
        <section className="escenario-vagon" aria-label="Carro">
          <canvas ref={lienzo} className={'lienzo-vagon herr-' + herr} onPointerDown={alTocar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alSoltar}
            role="img" aria-label={`Lateral del carro ${MODELOS.find(m => m.id === modelo)!.nombre}. ${activa.ayuda}`} />
        </section>

        <aside className="barra-derecha" aria-label="Biblioteca y opciones">
          <div className="seccion">
            <p className="label">Modelo</p>
            <div className="modelos" role="radiogroup" aria-label="Modelo de tren">
              {MODELOS.map(m => (
                <button key={m.id} type="button" role="radio" aria-checked={modelo === m.id} className="modelo-btn" onClick={() => setModelo(m.id)}>
                  <img src={m.lateral} alt="" /><span><b>{m.nombre}</b><small>{m.detalle}</small></span>
                </button>
              ))}
            </div>
          </div>
          <div className="seccion">
            <p className="label">Carros del tren</p>
            <div className="seg" role="group" aria-label="Carros">
              {[1, 2, 3].map(n => <button key={n} type="button" aria-pressed={carros === n} onClick={() => setCarros(n)}>{n}</button>)}
            </div>
          </div>
          <div className="seccion opciones">
            <p className="label">{activa.nombre}</p>
            {(herr === 'lapiz' || herr === 'borrar') && (
              <div className="seg" role="group" aria-label="Grosor">
                {[1, 2, 3].map(n => <button key={n} type="button" aria-pressed={grosor === n} onClick={() => setGrosor(n)}><i className="punto" style={{ '--n': n } as React.CSSProperties} />{n} px</button>)}
              </div>
            )}
            {herr === 'sticker' && (<>
              <div className="stickers" role="radiogroup" aria-label="Sticker">
                {STICKERS.map(id => (
                  <button key={id} type="button" role="radio" aria-checked={sticker === id} className="sticker-btn" onClick={() => setSticker(id)} aria-label={id.replace('-', ' ')}>
                    <img src={srcSticker(id)} alt="" />
                  </button>
                ))}
              </div>
              <div className="seg" role="group" aria-label="Tamaño del sticker">
                {(Object.keys(TAM_STICKER) as (keyof typeof TAM_STICKER)[]).map(t => <button key={t} type="button" aria-pressed={tamSticker === t} onClick={() => setTamSticker(t)}>{t}</button>)}
              </div>
            </>)}
            {herr === 'tag' && (
              <label className="campo-tag">
                <span className="sr">Tu tag</span>
                <input id="tag" value={tag} maxLength={9} placeholder="TU TAG" autoComplete="off" onChange={e => setTag(e.target.value.toUpperCase())} />
              </label>
            )}
            <p className="ayuda">{activa.ayuda}</p>
          </div>
          <button type="button" className="btn btn-limpiar" onClick={() => { if (confirmar) { cambiar(disenoVacio()); setConfirmar(false); } else { setConfirmar(true); setTimeout(() => setConfirmar(false), 2500); } }}>
            <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>{confirmar ? '¿Seguro?' : 'Empezar de nuevo'}
          </button>
        </aside>

        <nav className="barra-inferior" aria-label="Herramientas">
          <div className="herramientas" role="radiogroup" aria-label="Herramienta">
            {HERRAMIENTAS.map(h => (
              <button key={h.id} type="button" role="radio" aria-checked={herr === h.id} className="herr-btn" onClick={() => setHerr(h.id)}>
                <span className="material-symbols-outlined" aria-hidden="true">{h.icono}</span>{h.nombre}
              </button>
            ))}
          </div>
          <div className="paleta" role="radiogroup" aria-label="Color">
            {PALETA.map(c => (
              <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} title={c} className="color-btn" style={{ '--c': HEX[c] } as React.CSSProperties} onClick={() => setColor(c)} />
            ))}
          </div>
        </nav>
      </main>
      {aviso && <div className="aviso" role="status">{aviso}</div>}
    </div>
  );
};
