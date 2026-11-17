import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jugador, otorgarCreacion } from '../../shared/juego';
import { miniatura, publicar } from '../../shared/datos';
import { COLS, FILAS, GOTEO, MAX_HISTORIAL, MUROS, PALETA, SECADO, SPRAY_CONTINUO_MS, STICKERS, TAMANOS, TAMANOS_RODILLO, type NivelGoteo, type Tamano, type TamanoRodillo } from './data/config';
import { PLANTILLAS } from './data/stencils';
import { cargar } from './lib/imagenes';
import { borrar, copiar, gotear, linea, mascaraDe, medidas, nacerChorro, nuevoDibujo, plumon, rociar, rodillo, tintaRodillo, type Chorro, type Dibujo, type Estampa, type Puesta } from './lib/pintura';
import { dibujarMuro, dibujarPlacaStencil, dibujarSticker, medidaSticker } from './lib/dibujar';
import { crearTarjeta } from './lib/exportar';
import { Lienzo } from './components/Lienzo';
import { PreviaPincel } from './components/PreviaPincel';
import { Llevatela } from '../../shared/ui/Llevatela';
import { Confirmar } from '../../shared/ui/Kit';
import {
  BarraFlotante, BarritaSeleccion, Boton, GrillaBiblioteca, LienzoAjustado, Manijas, MarcoHerramienta, Muestra, SeccionPanel, Segmento,
  useAviso, useGestosHistorial, type DefHerramienta, type Transformacion,
} from '../../shared/ui/Herramienta';
import { Quiosco, Tutorial, useTutorialVisto } from '../../shared/ui/Tutorial';
import './styles.css';

type Herramienta = 'spray' | 'rodillo' | 'plumon' | 'stencil' | 'sticker' | 'borrar';
const HERRAMIENTAS: (DefHerramienta<Herramienta> & { ayuda: string; detalle: string })[] = [
  { id: 'spray', nombre: 'Spray', icono: 'blur_on', ayuda: 'Pinta con el dedo. Lento, chorrea.', detalle: 'Borde difuso que se acumula. Mientras más lento pintes, más chorrea.' },
  { id: 'rodillo', nombre: 'Rodillo', icono: 'format_paint', ayuda: 'Pasa el rodillo; levanta para recargar.', detalle: 'Franja ancha con vetas que se va quedando sin pintura: levanta y vuelve a pasar.' },
  { id: 'plumon', nombre: 'Plumón', icono: 'ink_highlighter', ayuda: 'Borde duro para firmar tu tag.', detalle: 'Trazo parejo de borde duro, con tinta extra al apoyar y al levantar.' },
  { id: 'stencil', nombre: 'Stencil', icono: 'content_cut', ayuda: 'Mueve, gira y escala la plantilla.', detalle: 'Ubica la plantilla con las manijas y toca ✓. Después pinta encima: la pintura pasa solo por los huecos.' },
  { id: 'sticker', nombre: 'Sticker', icono: 'add_reaction', ayuda: 'Ponlo, gíralo y tócale ✓ para pegarlo.', detalle: 'Toca el muro para ponerlo. Arrastra para moverlo, la manija de arriba lo gira y las esquinas lo escalan. ✓ lo pega.' },
  { id: 'borrar', nombre: 'Borrar', icono: 'ink_eraser', ayuda: 'Quita la pintura del muro.', detalle: 'Quita la pintura y deja el muro a la vista. Los stickers pegados se quedan.' },
];
const SRC_PLANTILLA = (id: string) => `${import.meta.env.BASE_URL}figma/stencils/${id}.svg`;
const RAD = Math.PI / 180;

// Stencil: el lado mayor nunca baja de ~14 celdas, y la plantilla girada nunca tapa más del 60 % del alto de la
// pared ni del 90 % de su ancho (plan 012 §4: tamaño máximo relativo a la pared).
const LADO_MIN = 14, MAX_ALTO = 0.6, MAX_ANCHO = 0.9;
const escalaMaxStencil = (id: string, giro: number) => {
  const { w, h } = medidas(id), c = Math.abs(Math.cos(giro * RAD)), s = Math.abs(Math.sin(giro * RAD));
  return Math.min((MAX_ALTO * FILAS) / (w * s + h * c), (MAX_ANCHO * COLS) / (w * c + h * s));
};
// Al ponerla, la plantilla ocupa cerca del 45 % del alto de la pared.
const escalaInicial = (id: string) => Math.min(escalaMaxStencil(id, 0), (0.45 * FILAS) / medidas(id).h);
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const App: React.FC = () => {
  const [muro, setMuro] = useState(MUROS[0].id);
  const [color, setColor] = useState(1); // índice en PALETA + 1
  const [tamano, setTamano] = useState<Tamano>(2); // «Grande» (el antiguo «medio», el de entrada)
  const [tamRodillo, setTamRodillo] = useState<TamanoRodillo>(1);
  const [herr, setHerr] = useState<Herramienta>('spray');
  const [sticker, setSticker] = useState(STICKERS[0].id);
  const [goteo, setGoteo] = useState<NivelGoteo>('poco'); // plan 009: el spray parte con poco goteo
  const [puesta, setPuesta] = useState<Puesta | null>(null);
  const [nuevo, setNuevo] = useState<Estampa | null>(null); // sticker puesto, aún sin pegar (con manijas)
  const [moviendo, setMoviendo] = useState(false);
  const [version, setVersion] = useState(0);
  const [pasos, setPasos] = useState({ atras: 0, adelante: 0 });
  const [tarjeta, setTarjeta] = useState<Blob | null>(null);
  const [aviso, avisar] = useAviso();
  const [visto, marcarVisto] = useTutorialVisto('graffiti');

  const dibujo = useRef<Dibujo>(nuevoDibujo());
  const atras = useRef<Dibujo[]>([]), adelante = useRef<Dibujo[]>([]);
  const chorros = useRef<Chorro[]>([]);
  const pos = useRef<[number, number] | null>(null); // celda bajo el dedo mientras pinta
  // Carga de pintura por celda: el spray la suma, se seca sola y donde pasa el umbral nace un chorro.
  const carga = useRef(new Float32Array(COLS * FILAS));
  const secadoEn = useRef(performance.now()), ultimoChorro = useRef(0);
  const rodar = useRef({ ux: 1, uy: 0, s: 0 }); // eje del rodillo y distancia recorrida
  const suave = useRef<[number, number] | null>(null); // el plumón sigue al dedo suavizado (como el suavizado de Photoshop)
  const trazoGuardo = useRef(false); // el trazo en curso ya guardó su paso (para descartarlo si resulta ser un gesto)
  const lienzoRef = useRef<HTMLDivElement | null>(null);
  const redibujar = () => setVersion(v => v + 1);

  const mascara = useMemo(() => mascaraDe(puesta), [puesta]);
  // Los bucles de animación leen siempre lo último elegido.
  const radioSpray = TAMANOS[tamano].spray, radioPlumon = TAMANOS[tamano].plumon, radioBorrar = TAMANOS[tamano].borrar, mitad = TAMANOS_RODILLO[tamRodillo].mitad;
  const actual = useRef({ herr, color, radioSpray, tamano, goteo, mascara });
  actual.current = { herr, color, radioSpray, tamano, goteo, mascara };

  useEffect(() => { document.documentElement.dataset.visual = 'Pixel'; }, []);
  useEffect(() => { cargar([...MUROS.map(m => m.src), ...STICKERS.map(s => s.src)]).then(redibujar); }, []);

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
    const g = GOTEO[a.goteo], r = Math.ceil(a.radioSpray) + 1;
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
    if (nacerChorro(dibujo.current, chorros.current, mx, cy, r, a.color, g.largo, a.tamano === 3 ? g.anchoDoble : 0)) {
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
      if (t - ultimo >= SPRAY_CONTINUO_MS) { rociar(dibujo.current, p[0], p[1], a.radioSpray, a.color, a.mascara, carga.current); ultimo = t; redibujar(); revisarGoteo(p[0], p[1]); }
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
  };

  // ---------------------------------------------------------------- historial (el dibujo es mutable: se copia por paso)
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
  const deshacer = () => { setNuevo(null); moverHistorial(atras, adelante); };
  const rehacer = () => { setNuevo(null); moverHistorial(adelante, atras); };
  // Con 2 dedos se deshace y con 3 se rehace (kit v2): lo que alcanzó a pintar el primer dedo se descarta.
  const anularTrazo = () => {
    pos.current = null; suave.current = null;
    if (!trazoGuardo.current) return;
    trazoGuardo.current = false;
    const d = atras.current.pop();
    if (d) { chorros.current = []; dibujo.current = d; setPasos({ atras: atras.current.length, adelante: adelante.current.length }); redibujar(); }
  };
  useGestosHistorial(lienzoRef, { onDeshacer: deshacer, onRehacer: rehacer, alMultitoque: anularTrazo, activo: visto });

  // ---------------------------------------------------------------- pinceles
  const pintar = (x: number, y: number) => {
    if (herr === 'borrar') borrar(dibujo.current, x, y, radioBorrar);
    else if (herr === 'plumon') plumon(dibujo.current, x, y, radioPlumon, color, mascara);
    else rociar(dibujo.current, x, y, radioSpray, color, mascara, carga.current);
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
      rodillo(dibujo.current, Math.round(x0 + ((x1 - x0) * t) / d), Math.round(y0 + ((y1 - y0) * t) / d), r.ux, r.uy, r.s, mitad, color, mascara, tintaRodillo(r.s));
    }
  };

  // ---------------------------------------------------------------- stencil y sticker
  const ponerPlantilla = (id: string) => setPuesta(p => {
    const escala = p ? Math.min(escalaMaxStencil(id, p.giro), Math.max(p.escala * medidas(p.id).h / medidas(id).h, LADO_MIN / Math.max(medidas(id).w, medidas(id).h))) : escalaInicial(id);
    return { id, capa: p?.capa ?? 1, x: p?.x ?? COLS / 2, y: p?.y ?? FILAS / 2, escala, giro: p?.giro ?? 0 };
  });
  const pegarSticker = (s: Estampa | null = nuevo) => {
    if (!s) return;
    guardarHistorial();
    dibujo.current.stickers.push(s);
    setNuevo(null);
    redibujar();
  };
  const ponerSticker = (id: string, x = COLS / 2, y = FILAS / 2) => setNuevo(n => n ? { ...n, id } : { id, x, y, escala: 1, giro: 0 });

  const elegirHerramienta = (h: Herramienta) => {
    if (h !== 'sticker' && nuevo) pegarSticker(); // lo que quedó puesto no se pierde
    setHerr(h);
    if (h === 'stencil' && !puesta) ponerPlantilla(PLANTILLAS[0].id);
    if (h === 'sticker' && !nuevo) ponerSticker(sticker);
  };

  const alBajar = (x: number, y: number, fx: number, fy: number) => {
    trazoGuardo.current = false;
    if (herr === 'stencil') { // tocar fuera de la plantilla la lleva ahí
      setPuesta(p => p ? { ...p, x: fx, y: fy } : { id: PLANTILLAS[0].id, capa: 1, x: fx, y: fy, escala: escalaInicial(PLANTILLAS[0].id), giro: 0 });
      return;
    }
    if (herr === 'sticker') { // tocar fuera del sticker puesto lo lleva ahí (o pone uno nuevo)
      setNuevo(n => n ? { ...n, x: fx, y: fy } : { id: sticker, x: fx, y: fy, escala: 1, giro: 0 });
      return;
    }
    guardarHistorial();
    trazoGuardo.current = true;
    pos.current = [x, y];
    if (herr === 'rodillo') { rodar.current.s = 0; rodillo(dibujo.current, x, y, rodar.current.ux, rodar.current.uy, 0, mitad, color, mascara); }
    else if (herr === 'plumon') { suave.current = [x, y]; plumon(dibujo.current, x, y, radioPlumon + 1, color, mascara); } // la tinta se acumula al apoyar
    else pintar(x, y);
    redibujar();
    if (herr === 'spray') bucleSpray();
  };

  const alMover = (x: number, y: number) => {
    if (!pos.current) return;
    const [x0, y0] = pos.current;
    if (herr === 'rodillo') rodarHasta(x0, y0, x, y);
    else if (herr === 'plumon' && suave.current) {
      // Suavizado: la punta sigue al dedo a mitad de camino, así el tag sale con curvas limpias.
      const [sx, sy] = suave.current, nx = sx + (x - sx) * 0.45, ny = sy + (y - sy) * 0.45;
      linea(Math.round(sx), Math.round(sy), Math.round(nx), Math.round(ny), pintar);
      suave.current = [nx, ny];
    }
    else linea(x0, y0, x, y, pintar);
    pos.current = [x, y];
    if (herr === 'spray') revisarGoteo(x, y);
    redibujar();
    animarChorros();
  };

  const alSoltar = () => {
    // El plumón termina donde quedó el dedo y deja una gota de tinta al levantar.
    if (herr === 'plumon' && suave.current && pos.current) {
      const [sx, sy] = suave.current, [x, y] = pos.current;
      linea(Math.round(sx), Math.round(sy), x, y, pintar);
      plumon(dibujo.current, x, y, radioPlumon + 0.6, color, mascara);
      redibujar();
    }
    suave.current = null; pos.current = null; trazoGuardo.current = false;
  };

  const vaciar = () => { setNuevo(null); guardarHistorial(); chorros.current = []; carga.current.fill(0); dibujo.current = nuevoDibujo(); redibujar(); };
  const exportar = async () => {
    if (nuevo) pegarSticker();
    try { setTarjeta(await crearTarjeta(muro, dibujo.current)); otorgarCreacion('graffiti'); enviarAlInventario(); }
    catch { avisar('No se pudo crear la tarjeta. Inténtalo de nuevo.'); }
  };
  // Con una persona jugando en la mesa, la miniatura del muro llega al inventario de su credencial (plan 010 §2b).
  // Sin código no se manda nada: el HUB no muestra graffiti.
  const enviarAlInventario = () => {
    const codigo = jugador()?.codigo;
    if (!codigo) return;
    const c = document.createElement('canvas');
    c.width = 240; c.height = 120;
    dibujarMuro(c.getContext('2d')!, 240, 120, muro, dibujo.current);
    publicar('graffiti', { png: miniatura(c, 160) }, codigo).catch(() => { /* sin red: queda el timbre */ });
  };

  const dibujar = useCallback((ctx: CanvasRenderingContext2D, ancho: number, alto: number) => {
    dibujarMuro(ctx, ancho, alto, muro, dibujo.current);
    if (puesta && mascara) dibujarPlacaStencil(ctx, ancho, alto, puesta, mascara, moviendo);
    if (nuevo) dibujarSticker(ctx, ancho / COLS, nuevo);
  }, [muro, puesta, mascara, moviendo, nuevo]);

  const vacio = !dibujo.current.pintura.some(Boolean) && !dibujo.current.stickers.length && !nuevo;
  const activa = HERRAMIENTAS.find(h => h.id === herr)!;
  const nombreMuro = MUROS.find(m => m.id === muro)!.nombre;
  const pinta = herr === 'spray' || herr === 'rodillo' || herr === 'plumon';

  if (!visto) return (
    <Tutorial etiqueta="Pixel · ilustración y lettering" titulo="Graffiti y Tags"
      pasos={[
        { icono: 'wallpaper', texto: 'Elige muro y color.' },
        { icono: 'blur_on', texto: 'Pinta con spray, rodillo o plumón: mientras más lento el spray, más chorrea.' },
        { icono: 'content_cut', texto: 'Pon stencils y stickers: muévelos, gíralos y cámbiales el tamaño. Firma tu tag.' },
      ]}
      acciones={[{ texto: 'Empezar a pintar', icono: 'format_paint', alTocar: marcarVisto }]} />
  );

  // ---------------------------------------------------------------- panel
  const puntoTam = (r: number) => <i className="punto" aria-hidden="true" style={{ '--d': Math.round(5 + r * 1.4) + 'px' } as React.CSSProperties} />;
  const segTamano = herr === 'rodillo'
    ? <Segmento etiqueta="Ancho del rodillo" valor={tamRodillo} onCambiar={setTamRodillo}
        opciones={TAMANOS_RODILLO.map((t, i) => ({ valor: i as TamanoRodillo, texto: <span className="tam">{puntoTam(t.mitad / 2)}{t.nombre}</span> }))} />
    : <Segmento etiqueta={herr === 'borrar' ? 'Tamaño del borrador' : 'Tamaño del pincel'} valor={tamano} onCambiar={setTamano}
        opciones={TAMANOS.map((t, i) => ({ valor: i as Tamano, texto: <span className="tam">{puntoTam(herr === 'plumon' ? t.plumon * 2 : t.spray)}{t.nombre}</span> }))} />;
  const segCapa = puesta && (
    <Segmento etiqueta="Capa del stencil" valor={puesta.capa} onCambiar={c => setPuesta(p => p && { ...p, capa: c })}
      opciones={[{ valor: 1 as const, texto: 'Capa 1 · silueta' }, { valor: 2 as const, texto: 'Capa 2 · detalle' }]} />
  );
  const girarStencil = () => setPuesta(p => p && { ...p, giro: (p.giro + 90) % 360, escala: Math.min(p.escala, escalaMaxStencil(p.id, p.giro + 90)) });

  const seccionHerramienta = (
    <SeccionPanel titulo={activa.nombre} ayuda={activa.detalle}>
      {pinta && <PreviaPincel pincel={herr as 'spray' | 'rodillo' | 'plumon'} tamano={herr === 'rodillo' ? tamRodillo : tamano} color={PALETA[color - 1].hex} />}
      {(pinta || herr === 'borrar') && segTamano}
      {herr === 'spray' && (
        <Segmento etiqueta="Goteo" valor={goteo} onCambiar={setGoteo}
          opciones={[{ valor: 'nada' as NivelGoteo, texto: 'Sin goteo' }, { valor: 'poco' as NivelGoteo, texto: 'Poco' }, { valor: 'mucho' as NivelGoteo, texto: 'Mucho' }]} />
      )}
      {herr === 'stencil' && (<>
        <GrillaBiblioteca etiqueta="Plantilla" columnas={4} elegido={puesta?.id ?? null} onElegir={ponerPlantilla}
          elementos={PLANTILLAS.map(t => ({ id: t.id, nombre: t.nombre, contenido: <img src={SRC_PLANTILLA(t.id)} alt="" /> }))} />
        {segCapa}
        <div className="fila-botones">
          <Boton icono="rotate_right" texto="Girar 90°" onClick={girarStencil} disabled={!puesta} />
          <Boton icono="delete" texto="Quitar" variante="peligro" onClick={() => setPuesta(null)} disabled={!puesta} />
        </div>
      </>)}
      {herr === 'sticker' && (<>
        <GrillaBiblioteca etiqueta="Sticker" columnas={4} elegido={nuevo?.id ?? sticker} onElegir={id => { setSticker(id); ponerSticker(id); }}
          elementos={STICKERS.map(s => ({ id: s.id, nombre: s.nombre, contenido: <img src={s.src} alt="" /> }))} />
        <div className="fila-botones">
          <Boton icono="rotate_right" texto="Girar 90°" onClick={() => setNuevo(n => n && { ...n, giro: (n.giro + 90) % 360 })} disabled={!nuevo} />
          <Boton icono="check" texto="Pegar" variante="primario" onClick={() => pegarSticker()} disabled={!nuevo} />
        </div>
      </>)}
    </SeccionPanel>
  );
  const seccionColor = (pinta || herr === 'stencil') && (
    <SeccionPanel titulo="Color">
      <div className="h-muestras colores" role="radiogroup" aria-label="Color">
        {PALETA.map((c, i) => <Muestra key={c.id} color={c.hex} nombre={c.nombre} activa={color === i + 1}
          onClick={() => { setColor(i + 1); if (herr === 'stencil') setHerr('spray'); }} />)}
      </div>
    </SeccionPanel>
  );
  const seccionStencilPuesto = puesta && herr !== 'stencil' && (
    <SeccionPanel titulo={`Stencil · ${PLANTILLAS.find(t => t.id === puesta.id)!.nombre}`}>
      {segCapa}
      <div className="fila-botones">
        <Boton icono="content_cut" texto="Mover" onClick={() => elegirHerramienta('stencil')} />
        <Boton icono="delete" texto="Quitar" variante="peligro" onClick={() => setPuesta(null)} />
      </div>
    </SeccionPanel>
  );
  const seccionMuro = (
    <SeccionPanel titulo="Muro">
      <GrillaBiblioteca etiqueta="Muro" columnas={2} elegido={muro} onElegir={setMuro}
        elementos={MUROS.map(m => ({ id: m.id, nombre: m.nombre, contenido: <img src={m.src} alt="" /> }))} />
      <Confirmar texto="Vaciar el muro" disabled={vacio} onConfirmar={vaciar} />
    </SeccionPanel>
  );

  // ---------------------------------------------------------------- manijas
  const mStencil = puesta && medidas(puesta.id);
  const manijasStencil = herr === 'stencil' && puesta && mStencil && (
    <Manijas etiqueta="Stencil" valor={{ x: puesta.x, y: puesta.y, escala: puesta.escala, giro: puesta.giro }} ancho={mStencil.w} alto={mStencil.h}
      lienzo={{ ancho: COLS, alto: FILAS }}
      limites={{ min: LADO_MIN / FILAS, max: (escalaMaxStencil(puesta.id, puesta.giro) * Math.max(mStencil.w, mStencil.h)) / FILAS }}
      onCambiar={(t: Transformacion, final) => { setPuesta(p => p && { ...p, ...t }); setMoviendo(!final); }}
      barrita={<BarritaSeleccion etiqueta="Stencil"
        acciones={[
          { icono: 'layers', etiqueta: puesta.capa === 1 ? 'Pasar a la capa 2 · detalle' : 'Volver a la capa 1 · silueta', onClick: () => setPuesta(p => p && { ...p, capa: p.capa === 1 ? 2 : 1 }) },
          { icono: 'delete', etiqueta: 'Quitar plantilla', peligro: true, onClick: () => setPuesta(null) },
        ]}
        onConfirmar={() => { setHerr('spray'); avisar('Listo: pinta encima del stencil.'); }} />} />
  );
  const mSticker = nuevo && medidaSticker(nuevo.id);
  const manijasSticker = herr === 'sticker' && nuevo && mSticker && (
    <Manijas etiqueta="Sticker" valor={nuevo} ancho={mSticker.w} alto={mSticker.h} lienzo={{ ancho: COLS, alto: FILAS }}
      limites={{ min: 0.12, max: 0.8 }}
      onCambiar={(t: Transformacion) => setNuevo(n => n && { ...n, ...t })}
      barrita={<BarritaSeleccion etiqueta="Sticker" acciones={[]} onCancelar={() => setNuevo(null)} onConfirmar={() => pegarSticker()} />} />
  );

  return (
    <>
      <MarcoHerramienta
        titulo="Graffiti y Tags"
        ayuda={activa.ayuda}
        historia={{ deshacer, rehacer, puedeDeshacer: pasos.atras > 0, puedeRehacer: pasos.adelante > 0 }}
        primario={{ texto: 'Llévatelo', icono: 'ios_share', onClick: exportar, disabled: vacio }}
        herramientas={<BarraFlotante herramientas={HERRAMIENTAS} activa={herr} onElegir={elegirHerramienta} />}
        panel={<>{seccionHerramienta}{seccionColor}{seccionStencilPuesto}{seccionMuro}</>}
        aviso={aviso}
      >
        <LienzoAjustado ref={lienzoRef} proporcion={COLS / FILAS} className="pared">
          <Lienzo
            version={version}
            dibujar={dibujar}
            alBajar={alBajar}
            alMover={alMover}
            alSoltar={alSoltar}
            clase={'herr-' + herr}
            etiqueta={`Muro de ${nombreMuro}. ${activa.detalle}`}
          />
          {manijasStencil}
          {manijasSticker}
        </LienzoAjustado>
      </MarcoHerramienta>

      {tarjeta && (
        <Llevatela blob={tarjeta} app="graffiti" titulo="Tu muro está listo" conCredencial={!!jugador()?.codigo}
          alCerrar={() => setTarjeta(null)} />
      )}
      <Quiosco app="graffiti" />
    </>
  );
};
