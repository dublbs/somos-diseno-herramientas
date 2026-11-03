import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { otorgarCreacion } from '../../shared/juego';
import { BOQUILLAS, GOTEO, MAX_HISTORIAL, MUROS, PALETA, SECADO, SPRAY_CONTINUO_MS, STICKERS, COLS, FILAS, type NivelGoteo } from './data/config';
import { PLANTILLAS } from './data/stencils';
import { cargar } from './lib/imagenes';
import { borrar, copiar, gotear, linea, mascaraDe, nacerChorro, nuevoDibujo, plantilla, plumon, rociar, rodillo, type Chorro, type Dibujo, type Puesta } from './lib/pintura';
import { dibujarMuro, dibujarPlacaStencil } from './lib/dibujar';
import { crearTarjeta, descargar } from './lib/exportar';
import { Lienzo } from './components/Lienzo';
import { ModalExportar } from './components/ModalExportar';
import { BarraHerramientas, BarraSuperior, BotonAccion, Confirmar, Deslizador, Paleta, PantallaHerramienta, Seccion, Segmentado, type DefHerramienta } from '../../shared/ui/Kit';
import { Quiosco, Tutorial, useTutorialVisto } from '../../shared/ui/Tutorial';
import '../../shared/ui/somos-kit.css';
import './styles.css';

type Herramienta = 'spray' | 'rodillo' | 'plumon' | 'stencil' | 'sticker' | 'borrar';
const HERRAMIENTAS: (DefHerramienta<Herramienta> & { ayuda: string })[] = [
  { id: 'spray', nombre: 'Spray', icono: 'blur_on', ayuda: 'Pinta con el dedo. Mientras más lento pintes, más chorrea.' },
  { id: 'rodillo', nombre: 'Rodillo', icono: 'format_paint', ayuda: 'Una franja ancha con vetas, como un rodillo de verdad. Pasa dos veces para taparlas.' },
  { id: 'plumon', nombre: 'Plumón', icono: 'ink_highlighter', ayuda: 'Trazo parejo y nítido para firmar tu tag.' },
  { id: 'stencil', nombre: 'Stencil', icono: 'content_cut', ayuda: 'Arrastra la plantilla. Luego pinta encima: la pintura pasa solo por los huecos.' },
  { id: 'sticker', nombre: 'Sticker', icono: 'add_reaction', ayuda: 'Elige uno y toca el muro para pegarlo.' },
  { id: 'borrar', nombre: 'Borrar', icono: 'ink_eraser', ayuda: 'Quita la pintura y deja el muro a la vista.' },
];
const COLORES = Object.fromEntries(PALETA.map(c => [c.nombre, c.hex]));
const SRC_PLANTILLA = (id: string) => `${import.meta.env.BASE_URL}figma/stencils/${id}.svg`;
// Tamaño inicial: la plantilla ocupa unas 44 celdas de ancho (de 60).
const escalaInicial = (id: string) => Math.min(2.5, Math.max(1, Math.round((44 / plantilla(id).filas[0].length) * 4) / 4));
const centrada = (id: string, capa: 1 | 2, escala: number, cx = COLS / 2, cy = FILAS / 2): Puesta => {
  const t = plantilla(id);
  return { id, capa, escala, x: Math.round(cx - (t.filas[0].length * escala) / 2), y: Math.round(cy - (t.filas.length * escala) / 2) };
};
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const App: React.FC = () => {
  const [muro, setMuro] = useState(MUROS[0].id);
  const [color, setColor] = useState(1); // índice en PALETA + 1
  const [boquilla, setBoquilla] = useState(BOQUILLAS[1].radio);
  const [herr, setHerr] = useState<Herramienta>('spray');
  const [sticker, setSticker] = useState(STICKERS[0].id);
  const [goteo, setGoteo] = useState<NivelGoteo>('mucho');
  const [puesta, setPuesta] = useState<Puesta | null>(null);
  const [moviendo, setMoviendo] = useState(false);
  const [version, setVersion] = useState(0);
  const [pasos, setPasos] = useState({ atras: 0, adelante: 0 });
  const [tarjeta, setTarjeta] = useState<Blob | null>(null);
  const [aviso, setAviso] = useState('');
  const [visto, marcarVisto] = useTutorialVisto('graffiti');

  const dibujo = useRef<Dibujo>(nuevoDibujo());
  const atras = useRef<Dibujo[]>([]), adelante = useRef<Dibujo[]>([]);
  const chorros = useRef<Chorro[]>([]);
  const pos = useRef<[number, number] | null>(null); // celda bajo el dedo mientras pinta
  // Carga de pintura por celda: el spray la suma, se seca sola y donde pasa el umbral nace un chorro.
  const carga = useRef(new Float32Array(COLS * FILAS));
  const secadoEn = useRef(performance.now()), ultimoChorro = useRef(0);
  const rodar = useRef({ ux: 1, uy: 0, s: 0 }); // eje del rodillo y distancia recorrida
  const arrastre = useRef<{ dx: number; dy: number } | null>(null);
  const redibujar = () => setVersion(v => v + 1);

  const mascara = useMemo(() => mascaraDe(puesta), [puesta]);
  // Los bucles de animación leen siempre lo último elegido.
  const actual = useRef({ herr, color, boquilla, goteo, mascara });
  actual.current = { herr, color, boquilla, goteo, mascara };

  useEffect(() => { document.documentElement.dataset.visual = 'Pixel'; }, []);
  useEffect(() => { cargar([...MUROS.map(m => m.src), ...STICKERS.map(s => s.src)]).then(redibujar); }, []);
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(''), 2600); return () => clearTimeout(t); }, [aviso]);

  // Goteo: mientras haya chorros, bajan con su propio ritmo (rápido al empezar, más lento al final).
  const goteando = useRef(false);
  const animarChorros = useCallback(() => {
    if (goteando.current || !chorros.current.length) return;
    if (quieto()) { // sin animación: el chorro se pinta completo de una vez
      chorros.current = gotear(dibujo.current, chorros.current, actual.current.mascara, Infinity).siguen;
      redibujar();
      return;
    }
    goteando.current = true;
    let previo = performance.now();
    const paso = (t: number) => {
      const r = gotear(dibujo.current, chorros.current, actual.current.mascara, t - previo);
      previo = t; chorros.current = r.siguen;
      if (r.cambio) redibujar();
      if (chorros.current.length) requestAnimationFrame(paso);
      else goteando.current = false;
    };
    requestAnimationFrame(paso);
  }, []);

  // Seca la carga según el tiempo y, donde la pintura se acumuló, hace nacer un chorro (uno a la vez, cada `cada` ms).
  const revisarGoteo = (cx: number, cy: number) => {
    const a = actual.current, t = performance.now(), c = carga.current;
    const k = Math.pow(SECADO, (t - secadoEn.current) / 1000);
    secadoEn.current = t;
    for (let i = 0; i < c.length; i++) if (c[i]) c[i] *= k;
    if (a.goteo === 'nada') return;
    const g = GOTEO[a.goteo], r = a.boquilla + 1;
    if (t - ultimoChorro.current < g.cada) return;
    // Cada chorro se ve solo: no nace junto a otro que siga bajando (columna o vecinas).
    const ocupada = (x: number) => chorros.current.some(h => Math.abs(h.x - x) <= 1 + (h.ancho - 1));
    let mejor = -1, mx = 0;
    for (let y = Math.max(0, cy - r); y <= Math.min(FILAS - 1, cy + r); y++) for (let x = Math.max(0, cx - r); x <= Math.min(COLS - 1, cx + r); x++) {
      if (ocupada(x)) continue;
      const v = c[y * COLS + x];
      if (v >= g.umbral && v > mejor) { mejor = v; mx = x; }
    }
    if (mejor < 0) return;
    if (nacerChorro(dibujo.current, chorros.current, mx, cy, r, a.color, g.largo, a.boquilla === 3 ? g.anchoDoble : 0)) {
      ultimoChorro.current = t;
      // esa columna y sus vecinas ya chorrearon: vuelven a cargarse desde cero
      for (let y = Math.max(0, cy - r - 1); y <= Math.min(FILAS - 1, cy + r + 1); y++) for (let x = Math.max(0, mx - 1); x <= Math.min(COLS - 1, mx + 1); x++) c[y * COLS + x] = 0;
      animarChorros();
    }
  };

  // Mientras el dedo está abajo con el spray, la lata sigue soltando pintura: quieta o lenta, carga la pared y chorrea.
  const bucleSpray = () => {
    let ultimo = performance.now();
    const cuadro = (t: number) => {
      const p = pos.current, a = actual.current;
      if (!p || a.herr !== 'spray') return;
      if (t - ultimo >= SPRAY_CONTINUO_MS) { rociar(dibujo.current, p[0], p[1], a.boquilla, a.color, a.mascara, carga.current); ultimo = t; redibujar(); revisarGoteo(p[0], p[1]); }
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
  };

  const guardarHistorial = () => {
    atras.current.push(copiar(dibujo.current));
    if (atras.current.length > MAX_HISTORIAL) atras.current.shift();
    adelante.current = [];
    setPasos({ atras: atras.current.length, adelante: 0 });
  };
  const moverHistorial = (de: React.MutableRefObject<Dibujo[]>, a: React.MutableRefObject<Dibujo[]>) => {
    const d = de.current.pop();
    if (!d) return;
    a.current.push(dibujo.current);
    chorros.current = [];
    dibujo.current = d;
    setPasos({ atras: atras.current.length, adelante: adelante.current.length });
    redibujar();
  };

  const mitad = BOQUILLAS.find(b => b.radio === boquilla)!.mitad;
  const pintar = (x: number, y: number) => {
    if (herr === 'borrar') borrar(dibujo.current, x, y, boquilla);
    else if (herr === 'plumon') plumon(dibujo.current, x, y, boquilla, color, mascara);
    else rociar(dibujo.current, x, y, boquilla, color, mascara, carga.current);
  };
  const rodarHasta = (x0: number, y0: number, x1: number, y1: number) => {
    const d = Math.hypot(x1 - x0, y1 - y0);
    if (!d) return;
    // El rodillo queda perpendicular al avance; se suaviza para que no gire a saltos.
    const r = rodar.current;
    let nx = -(y1 - y0) / d, ny = (x1 - x0) / d;
    if (nx * r.ux + ny * r.uy < 0) { nx = -nx; ny = -ny; }
    const sx = r.ux * 0.6 + nx * 0.4, sy = r.uy * 0.6 + ny * 0.4, n = Math.hypot(sx, sy) || 1;
    r.ux = sx / n; r.uy = sy / n;
    for (let t = 0.5; t <= d; t += 0.5) {
      r.s += 0.5;
      rodillo(dibujo.current, Math.round(x0 + ((x1 - x0) * t) / d), Math.round(y0 + ((y1 - y0) * t) / d), r.ux, r.uy, r.s, mitad, color, mascara);
    }
  };

  const ponerPlantilla = (id: string, cx?: number, cy?: number) => setPuesta(p => centrada(id, p?.capa ?? 1, p && p.id === id ? p.escala : escalaInicial(id), cx, cy));
  const elegirHerramienta = (h: Herramienta) => { setHerr(h); if (h === 'stencil' && !puesta) ponerPlantilla(PLANTILLAS[0].id); };

  const alBajar = (x: number, y: number) => {
    if (herr === 'stencil') {
      const p = puesta ?? centrada(PLANTILLAS[0].id, 1, escalaInicial(PLANTILLAS[0].id), x, y);
      if (!puesta) setPuesta(p);
      arrastre.current = { dx: x - p.x, dy: y - p.y };
      setMoviendo(true);
      return;
    }
    guardarHistorial();
    if (herr === 'sticker') { dibujo.current.stickers.push({ id: sticker, x, y }); redibujar(); return; }
    pos.current = [x, y];
    if (herr === 'rodillo') { rodar.current.s = 0; rodillo(dibujo.current, x, y, rodar.current.ux, rodar.current.uy, 0, mitad, color, mascara); }
    else pintar(x, y);
    redibujar();
    if (herr === 'spray') bucleSpray();
  };

  const alMover = (x: number, y: number) => {
    if (herr === 'stencil') {
      const a = arrastre.current;
      if (a) setPuesta(p => p && (p.x !== x - a.dx || p.y !== y - a.dy) ? { ...p, x: x - a.dx, y: y - a.dy } : p);
      return;
    }
    if (!pos.current || herr === 'sticker') return;
    const [x0, y0] = pos.current;
    if (herr === 'rodillo') rodarHasta(x0, y0, x, y);
    else linea(x0, y0, x, y, pintar);
    pos.current = [x, y];
    if (herr === 'spray') revisarGoteo(x, y);
    redibujar();
    animarChorros();
  };

  const alSoltar = () => { pos.current = null; arrastre.current = null; setMoviendo(false); };

  const vaciar = () => { guardarHistorial(); chorros.current = []; carga.current.fill(0); dibujo.current = nuevoDibujo(); redibujar(); };
  const exportar = async () => {
    try { setTarjeta(await crearTarjeta(muro, dibujo.current)); otorgarCreacion('graffiti'); }
    catch { setAviso('No se pudo crear la tarjeta. Inténtalo de nuevo.'); }
  };

  const dibujar = useCallback((ctx: CanvasRenderingContext2D, lado: number) => {
    dibujarMuro(ctx, lado, muro, dibujo.current);
    if (puesta && mascara) dibujarPlacaStencil(ctx, lado, puesta, mascara, moviendo);
  }, [muro, puesta, mascara, moviendo]);

  const vacio = !dibujo.current.pintura.some(Boolean) && !dibujo.current.stickers.length;
  const activa = HERRAMIENTAS.find(h => h.id === herr)!;
  const grosor = (
    <Segmentado etiqueta={herr === 'rodillo' ? 'Ancho del rodillo' : 'Grosor'} valor={boquilla} onCambiar={setBoquilla}
      opciones={BOQUILLAS.map(b => ({ valor: b.radio, texto: <><i className="punto" style={{ '--n': b.radio } as React.CSSProperties} />{b.nombre}</> }))} />
  );
  const capa = puesta && (
    <Segmentado etiqueta="Capa del stencil" valor={puesta.capa} onCambiar={c => setPuesta(p => p && { ...p, capa: c })}
      opciones={[{ valor: 1 as const, texto: 'Capa 1 · base' }, { valor: 2 as const, texto: 'Capa 2 · detalle' }]} />
  );
  const nombreMuro = MUROS.find(m => m.id === muro)!.nombre;

  if (!visto) return (
    <Tutorial etiqueta="Pixel · ilustración y lettering" titulo="Graffiti y Tags"
      pasos={[
        { icono: 'wallpaper', texto: 'Elige muro y color.' },
        { icono: 'blur_on', texto: 'Pinta con el spray: mientras más lento pintes, más chorrea.' },
        { icono: 'content_cut', texto: 'Usa stencils de 2 capas, firma con el plumón y descarga tu muro.' },
      ]}
      acciones={[{ texto: 'Empezar a pintar', icono: 'format_paint', alTocar: marcarVisto }]} />
  );

  return (
    <>
      <PantallaHerramienta
        anchoLateral={290}
        superior={
          <BarraSuperior titulo="Graffiti y Tags" bajada={activa.ayuda}>
            <BotonAccion icono="undo" etiqueta="Deshacer" onClick={() => moverHistorial(atras, adelante)} disabled={!pasos.atras} />
            <BotonAccion icono="redo" etiqueta="Rehacer" onClick={() => moverHistorial(adelante, atras)} disabled={!pasos.adelante} />
            <BotonAccion icono="download" texto="Llévate tu muro" primario onClick={exportar} disabled={vacio} />
          </BarraSuperior>
        }
        lateral={<>
          <Seccion titulo="Muro">
            <div className="muros" role="radiogroup" aria-label="Muro">
              {MUROS.map(m => (
                <button key={m.id} type="button" role="radio" aria-checked={muro === m.id} aria-label={m.nombre} title={m.nombre} className="k-color miniatura" onClick={() => setMuro(m.id)}>
                  <img src={m.src} alt="" />
                </button>
              ))}
            </div>
          </Seccion>
          <Seccion titulo={activa.nombre} crece>
            {(herr === 'spray' || herr === 'rodillo' || herr === 'plumon' || herr === 'borrar') && grosor}
            {herr === 'spray' && (
              <Segmentado etiqueta="Goteo" valor={goteo} onCambiar={setGoteo}
                opciones={[{ valor: 'nada' as NivelGoteo, texto: 'Sin goteo' }, { valor: 'poco' as NivelGoteo, texto: 'Poco' }, { valor: 'mucho' as NivelGoteo, texto: 'Mucho' }]} />
            )}
            {herr === 'stencil' && (<>
              <div className="plantillas" role="radiogroup" aria-label="Plantilla">
                {PLANTILLAS.map(t => (
                  <button key={t.id} type="button" role="radio" aria-checked={puesta?.id === t.id} aria-label={t.nombre} title={t.nombre} className="k-color miniatura"
                    onClick={() => ponerPlantilla(t.id, puesta ? puesta.x + (plantilla(puesta.id).filas[0].length * puesta.escala) / 2 : undefined, puesta ? puesta.y + (plantilla(puesta.id).filas.length * puesta.escala) / 2 : undefined)}>
                    <img src={SRC_PLANTILLA(t.id)} alt="" />
                  </button>
                ))}
              </div>
              {capa}
              {puesta && <Deslizador id="tam-stencil" etiqueta="Tamaño" min={1} max={2.5} paso={0.25} valor={puesta.escala}
                onCambiar={e => setPuesta(p => { if (!p) return p; const t = plantilla(p.id); return centrada(p.id, p.capa, e, p.x + (t.filas[0].length * p.escala) / 2, p.y + (t.filas.length * p.escala) / 2); })} />}
            </>)}
            {herr === 'sticker' && (
              <div className="stickers" role="radiogroup" aria-label="Sticker">
                {STICKERS.map(s => (
                  <button key={s.id} type="button" role="radio" aria-checked={sticker === s.id} aria-label={s.nombre} title={s.nombre} className="k-color miniatura" onClick={() => setSticker(s.id)}>
                    <img src={s.src} alt="" />
                  </button>
                ))}
              </div>
            )}
            {puesta && herr !== 'stencil' && (
              <div className="stencil-puesto">
                <p className="k-etq">Stencil puesto · {plantilla(puesta.id).nombre}</p>
                {capa}
              </div>
            )}
            {puesta && <BotonAccion icono="close" texto="Quitar plantilla" onClick={() => setPuesta(null)} />}
            <p className="k-ayuda">{activa.ayuda}</p>
          </Seccion>
          <Confirmar texto="Vaciar el muro" disabled={vacio} onConfirmar={vaciar} />
        </>}
        inferior={<>
          <BarraHerramientas herramientas={HERRAMIENTAS} activa={herr} onElegir={elegirHerramienta} />
          <Paleta colores={COLORES} elegido={PALETA[color - 1].nombre} onElegir={n => { setColor(PALETA.findIndex(c => c.nombre === n) + 1); if (herr === 'sticker' || herr === 'borrar') setHerr('spray'); }} />
        </>}
      >
        <div className="muro-fit">
          <Lienzo
            version={version}
            dibujar={dibujar}
            alBajar={alBajar}
            alMover={alMover}
            alSoltar={alSoltar}
            clase={'herr-' + herr}
            etiqueta={`Muro de ${nombreMuro}. ${activa.ayuda}`}
          />
        </div>
      </PantallaHerramienta>

      {tarjeta && (
        <ModalExportar
          blob={tarjeta}
          onCerrar={() => setTarjeta(null)}
          onGuardar={() => { descargar(tarjeta, 'graffiti-somos-diseno.png'); setAviso('Imagen descargada'); }}
        />
      )}
      {aviso && <div className="aviso" role="status">{aviso}</div>}
      <Quiosco app="graffiti" />
    </>
  );
};
