import React, { useCallback, useEffect, useRef, useState } from 'react';
import { jugador, otorgarCreacion } from '../../shared/juego';
import { publicar } from '../../shared/datos';
import { Quiosco, Tutorial, useTutorialVisto } from '../../shared/ui/Tutorial';
import { Llevatela } from '../../shared/ui/Llevatela';
import { avanzarCruce, META, mover, nuevoCruce, type Cruce } from './juego/cruce';
import { avanzarAnden, bajar, lanzarA, nuevoAnden, saltar, VIDAS, type Anden } from './juego/anden';
import { avanzarJefe, bajarJ, COLORES_JEFE, GOLPES_JEFE, lanzarJ, nuevoJefe, proximoColor, saltarJ, type Jefe } from './juego/jefe';
import { HUESO, NOMBRE_PINTURA, TIROS_POR_LATA, type Pieza } from './juego/comun';
import { dibujarCruce, type Imagenes } from './juego/dibujoCruce';
import { dibujarAnden } from './juego/dibujoAnden';
import { dibujarInacapin, dibujarJefe } from './juego/dibujoJefe';
import { dibujarMural, miniaturaMural } from './juego/mural';
import { crearTarjeta, type Resumen } from './juego/tarjeta';
import '../../shared/ui/somos-kit.css';
import './styles.css';

// «Hora punta» (plan docs/plans/009-juego-pixel.md, ronda 2): juego Pixel que reemplaza al Vagón.
// Nivel 1, El cruce (isométrico): juntas latas de pintura. Nivel 2, El andén: con esa pintura atrapas Grises y juntas
// piezas. Jefe, el Inacapín Pixel: le devuelves el color con bolas de Grises. Lo que te llevas es tu mural.
const TITULO = 'Hora punta';
const MIN_PUNTOS_CREACION = 5;
const ESPERA_FIN = 1200; // ms entre el final del cruce y su tarjeta
type Nivel = 'cruce' | 'anden' | 'jefe';
type Etapa = Nivel | 'paso' | 'paso2' | 'fin';
type Accion = 'arriba' | 'abajo' | 'izq' | 'der' | 'lanzar';
const NOMBRE_NIVEL: Record<Nivel, string> = { cruce: 'Nivel 1 · El cruce', anden: 'Nivel 2 · El andén', jefe: 'Jefe · El Inacapín Pixel' };

const movimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const quieto = () => movimiento?.matches ?? false; // se consulta en cada cuadro: la consulta se crea una vez
const cargarImagen = (ruta: string) => new Promise<HTMLImageElement | null>(res => {
  const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `${import.meta.env.BASE_URL}figma/${ruta}`;
});
// `?nivel=2` parte en el andén con 3 latas y `?nivel=3` en el jefe con 3 latas y 4 piezas (para probar y mostrarlo).
const NIVEL = Number(new URLSearchParams(location.search).get('nivel')) || 1;
const LATAS_PRUEBA = ['#FF8FB1', '#FFC20E', '#7FC8F8'];
const PIEZAS_PRUEBA: Pieza[] = [{ color: '#00A651', forma: 'corazon' }, { color: '#FF8FB1', forma: 'estrella' }, { color: '#FFC20E', forma: 'rayo' }, { color: '#00A651', forma: 'gota' }];
const andenDePrueba = () => Object.assign(nuevoAnden(LATAS_PRUEBA), NIVEL === 3 ? { juntadas: PIEZAS_PRUEBA, limpio: true } : {});
const coloresJefe = (latas: string[], piezas: Pieza[]) => [...latas, ...piezas.map(p => p.color)];
const plural = (n: number, uno: string, varios = uno + 's') => `${n} ${n === 1 ? uno : varios}`;
const leerMejor = () => { try { return Number(sessionStorage.getItem('sd:juego:mejor')) || 0; } catch { return 0; } };

// Flecha pixel para los controles (no hay íconos de flechas en el subconjunto de Material Symbols).
const Flecha: React.FC<{ giro: number; tam?: number }> = ({ giro, tam = 28 }) => (
  <svg viewBox="0 0 8 8" width={tam} height={tam} aria-hidden="true" style={{ transform: `rotate(${giro}deg)` }} shapeRendering="crispEdges">
    <path fill="currentColor" d="M3 0h2v1h1v1h1v1h1v2h-3v3h-2v-3h-3v-2h1v-1h1v-1h1z" />
  </svg>
);
const Lata: React.FC<{ color: string; tam?: number }> = ({ color, tam = 18 }) => (
  <svg viewBox="0 0 8 8" width={tam} height={tam} aria-hidden="true" shapeRendering="crispEdges">
    <path fill="#000" d="M1 0h6v1h1v6h-1v1h-6v-1h-1v-6h1z" /><path fill="#B9B9B3" d="M1 1h6v1h-6zM1 6h6v1h-6z" />
    <path fill={color} d="M1 2h6v4h-6z" /><path fill="#fff" d="M2 3h1v2h-1z" />
  </svg>
);
const Corazon: React.FC<{ lleno: boolean }> = ({ lleno }) => (
  <svg viewBox="0 0 7 7" width="20" height="20" aria-hidden="true" shapeRendering="crispEdges">
    <path fill="#000" d="M1 0h2v1h1v-1h2v1h1v3h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-3h1z" />
    <path fill={lleno ? '#FF8FB1' : '#4A453E'} d="M1 1h2v1h1v-1h2v3h-1v1h-1v1h-1v-1h-1v-1h-1z" />
  </svg>
);

// Mural en un canvas chico (pantalla final).
const MuralVivo: React.FC<{ r: Resumen; ancho: number }> = ({ r, ancho }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    c.width = ancho * d; c.height = ancho * 0.75 * d;
    dibujarMural(c.getContext('2d')!, 0, 0, ancho * d, r);
  }, [r, ancho]);
  return <canvas ref={ref} className="mural" style={{ width: ancho, height: ancho * 0.75 }} role="img"
    aria-label={`Tu mural: ${r.trofeo ? 'el trofeo, ' : ''}${plural(r.piezas.length, 'pieza')} y ${plural(r.latas.length, 'lata')}`} />;
};
// Retrato del Inacapín para la tarjeta de entrada al jefe.
const Retrato: React.FC<{ partes: number; tam: number }> = ({ partes, tam }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    c.width = c.height = 64;
    const x = c.getContext('2d')!; x.clearRect(0, 0, 64, 64);
    dibujarInacapin(x, 0, 0, 64, partes);
  }, [partes]);
  return <canvas ref={ref} className="retrato" style={{ width: tam, height: tam }} aria-hidden="true" />;
};

// «Cómo se juega» de cada nivel: va en la tarjeta de entrada y en la pausa.
const Reglas: React.FC<{ nivel: Nivel }> = ({ nivel }) => nivel === 'jefe' ? (
  <ul className="reglas">
    <li>El Inacapín <b>lanza Grises</b>: 2 golpes de pintura y quedan en una bola.</li>
    <li><b>Empuja la bola contra él</b>: cada golpe le devuelve un color. Son 6.</li>
    <li><b>Salta las manchas</b> y sal de las columnas marcadas: caen gotas.</li>
  </ul>
) : nivel === 'anden' ? (
  <ul className="reglas">
    <li><b>◀ ▶</b> caminar, <b>Saltar</b> o <b>▲</b> salta, <b>▼</b> bajas de la viga.</li>
    <li><b>Lanza pintura</b>: 3 golpes de color y el Gris queda en una bola. Sin latas, la pintura hueso necesita 5.</li>
    <li><b>Camina contra la bola</b> y rueda. Cada Gris suelta una <b>pieza</b>: ve a buscarla.</li>
  </ul>
) : (
  <ul className="reglas">
    <li><b>Avanza</b> fila por fila hasta el metro ({META} filas). Toca el lienzo o el botón Avanzar.</li>
    <li><b>Junta latas</b>: cada una son {TIROS_POR_LATA} tiros de color en el andén.</li>
    <li>Esquiva autos, micros y el metro. No te quedes quieto.</li>
  </ul>
);

export const App: React.FC = () => {
  const [visto, marcarVisto] = useTutorialVisto('juego');
  const lienzo = useRef<HTMLCanvasElement>(null);
  const cruce = useRef<Cruce>(Object.assign(nuevoCruce(), NIVEL > 1 ? { latas: LATAS_PRUEBA } : {}));
  const anden = useRef<Anden | null>(NIVEL > 1 ? andenDePrueba() : null);
  const jefe = useRef<Jefe | null>(NIVEL === 3 ? nuevoJefe(coloresJefe(LATAS_PRUEBA, PIEZAS_PRUEBA)) : null);
  const camara = useRef(0);
  const espera = useRef(0); // ms desde que el cruce terminó (choque o llegada)
  const img = useRef<Imagenes>({ personaje: null, metro: null });
  const [etapa, setEtapa] = useState<Etapa>(NIVEL === 3 ? 'jefe' : NIVEL === 2 ? 'anden' : 'cruce');
  const [intro, setIntro] = useState(true); // tarjeta «Cómo se juega» al empezar cada nivel
  const [puntos, setPuntos] = useState(0);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [hud, setHud] = useState({ latas: [] as string[], tiros: 0, piezas: 0, vidas: VIDAS, golpes: 0, color: HUESO });
  const [motivo, setMotivo] = useState('');
  const [pausa, setPausa] = useState(false);
  const [mejor, setMejor] = useState(leerMejor);
  const [sumado, setSumado] = useState(false);
  const [llevar, setLlevar] = useState<Blob | null>(null); // «Llévatela» con QR (plan 011)

  useEffect(() => { document.documentElement.dataset.visual = 'Pixel'; }, []);
  // `?bot=1`: deja los motores a la vista de las pruebas automáticas (Playwright). No cambia el juego.
  useEffect(() => {
    if (new URLSearchParams(location.search).get('bot') === '1') Object.assign(window, { horaPunta: { cruce, anden, jefe, acciones } });
  }, []);
  useEffect(() => {
    Promise.all([cargarImagen('personaje.svg'), cargarImagen('metro-lateral.svg')]).then(([personaje, metro]) => { img.current = { personaje, metro }; });
  }, []);

  const nivel: Nivel = etapa === 'jefe' || etapa === 'paso2' || (etapa === 'fin' && resumen?.nivel === 3) ? 'jefe'
    : etapa === 'anden' || etapa === 'paso' || (etapa === 'fin' && resumen?.nivel === 2) ? 'anden' : 'cruce';
  const enJuego = etapa === 'cruce' || etapa === 'anden' || etapa === 'jefe';
  const corre = enJuego && !pausa && !intro;

  const resumir = useCallback((): Resumen => {
    const c = cruce.current, a = anden.current, j = jefe.current;
    return {
      puntos: c.puntos + (a?.puntos ?? 0) + (j?.puntos ?? 0), filas: c.maxY, latas: c.latas, bolas: (a?.bolas ?? 0) + (j?.bolas ?? 0),
      arrastrados: (a?.arrastrados ?? 0) + (j?.arrastrados ?? 0), piezas: a?.juntadas ?? [], nivel: j ? 3 : a ? 2 : 1, limpio: !!a?.limpio,
      golpes: j?.golpes ?? 0, trofeo: j?.fin === 'victoria',
    };
  }, []);

  // Fin de la partida: puntaje, timbre Creación y, con una persona jugando, su mural al inventario de la credencial.
  const terminar = useCallback((texto: string) => {
    const r = resumir();
    setMotivo(texto); setResumen(r); setEtapa('fin');
    setMejor(m => { const n = Math.max(m, r.puntos); try { sessionStorage.setItem('sd:juego:mejor', String(n)); } catch { /* nada */ } return n; });
    if (r.puntos < MIN_PUNTOS_CREACION) return;
    otorgarCreacion('juego'); setSumado(true);
    const codigo = jugador()?.codigo;
    if (codigo) publicar('juego', { png: miniaturaMural(r) }, codigo).catch(() => { /* sin red: queda el timbre */ });
  }, [resumir]);

  const bajarAlAnden = () => { anden.current = nuevoAnden(cruce.current.latas); setEtapa('anden'); setIntro(false); setPausa(false); };
  const enfrentarJefe = () => {
    jefe.current = nuevoJefe(coloresJefe(cruce.current.latas, anden.current?.juntadas ?? []));
    setEtapa('jefe'); setIntro(false); setPausa(false);
  };

  // Bucle del juego: avanza el nivel que toca y lo dibuja.
  useEffect(() => {
    if (!visto) return;
    let vivo = true, previo = performance.now(), ultimo = '';
    const cuadro = (t: number) => {
      if (!vivo) return;
      const c = lienzo.current, dt = t - previo;
      previo = t;
      const ctx = c && c.width ? c.getContext('2d')! : null;
      const a = anden.current, j = jefe.current, q = quieto();
      const mando = Math.round(240 * Math.min(window.devicePixelRatio || 1, 2)); // los controles ocupan ~240 px por esquina
      if (j && nivel === 'jefe' && etapa !== 'paso2') {
        if (corre && etapa === 'jefe') {
          avanzarJefe(j, dt);
          if (j.fin) terminar(j.fin === 'victoria' ? '¡Le devolviste el color!' : '¡El Inacapín te dejó gris!');
        }
        if (ctx) dibujarJefe(ctx, c!.width, c!.height, j, img.current, t, q, mando);
      } else if (a && (nivel === 'anden' || etapa === 'paso2')) {
        if (corre && etapa === 'anden') {
          avanzarAnden(a, dt);
          if (a.fin) terminar('¡Un Gris te borró!');
          else if (a.limpio) setEtapa('paso2');
        }
        if (ctx) dibujarAnden(ctx, c!.width, c!.height, a, img.current, t, mando);
      } else {
        const e = cruce.current;
        if (corre && etapa === 'cruce') {
          avanzarCruce(e, dt);
          // Al chocar o llegar, la tarjeta espera un momento: se ve el aplastón o la entrada al metro.
          if (e.fin || e.llego) espera.current += dt;
          if (espera.current > ESPERA_FIN) {
            espera.current = 0;
            if (e.fin) terminar(e.fin === 'atropellado' ? '¡Te atropellaron!' : e.fin === 'tren' ? '¡Pasó el metro!' : 'Se te pasó la hora punta');
            else setEtapa('paso');
          }
        }
        // Al llegar, la cámara deja ver el pórtico del metro.
        const meta = e.llego ? Math.max(e.camara, e.jugador.y - 3) : e.camara;
        camara.current += (meta - camara.current) * (q ? 1 : Math.min(1, dt / 140));
        if (ctx) dibujarCruce(ctx, c!.width, c!.height, e, camara.current, img.current, t, q);
      }
      const total = cruce.current.puntos + (a?.puntos ?? 0) + (j?.puntos ?? 0);
      const vidas = j ? j.vidas : a ? a.vidas : VIDAS;
      const color = j ? proximoColor(j) : a?.municion[0] ?? HUESO;
      const firma = `${total}|${cruce.current.latas.length}|${a?.municion.length ?? -1}|${a?.juntadas.length ?? 0}|${vidas}|${j?.golpes ?? 0}|${color}`;
      if (firma !== ultimo) {
        ultimo = firma; setPuntos(total);
        setHud({ latas: [...cruce.current.latas], tiros: a ? a.municion.length : cruce.current.latas.length * TIROS_POR_LATA, piezas: a?.juntadas.length ?? 0, vidas, golpes: j?.golpes ?? 0, color });
      }
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
    return () => { vivo = false; };
  }, [visto, corre, etapa, nivel, terminar]);

  // El canvas toma la resolución de su caja (hasta 2× en pantallas densas).
  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const ro = new ResizeObserver(() => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(c.clientWidth * d); c.height = Math.round(c.clientHeight * d);
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [visto]);

  // Apretar y soltar: en el cruce cada toque es un paso; en el andén y el jefe ◀ ▶ se mantienen para caminar.
  const apretar = useCallback((x: Accion) => {
    if (!corre) return;
    if (etapa === 'cruce') {
      const e = cruce.current;
      if (x === 'lanzar') return;
      mover(e, x === 'izq' ? -1 : x === 'der' ? 1 : 0, x === 'arriba' ? 1 : x === 'abajo' ? -1 : 0); // el bucle ve si chocaste
    } else if (etapa === 'anden' && anden.current) {
      const a = anden.current;
      if (x === 'izq') a.teclas.izq = true;
      else if (x === 'der') a.teclas.der = true;
      else if (x === 'arriba') saltar(a);
      else if (x === 'abajo') bajar(a);
      else lanzarA(a);
    } else if (etapa === 'jefe' && jefe.current) {
      const j = jefe.current;
      if (x === 'izq') j.teclas.izq = true;
      else if (x === 'der') j.teclas.der = true;
      else if (x === 'arriba') saltarJ(j);
      else if (x === 'abajo') bajarJ(j);
      else lanzarJ(j);
    }
  }, [corre, etapa, terminar]);
  const soltar = useCallback((x: Accion) => {
    for (const t of [anden.current?.teclas, jefe.current?.teclas]) {
      if (t && x === 'izq') t.izq = false;
      if (t && x === 'der') t.der = false;
    }
  }, []);
  const acciones = useRef({ apretar, soltar });
  acciones.current = { apretar, soltar };

  // Teclado (para probar en el computador): flechas o WASD y espacio.
  useEffect(() => {
    const m: Record<string, Accion> = { ArrowUp: 'arriba', w: 'arriba', ArrowDown: 'abajo', s: 'abajo', ArrowLeft: 'izq', a: 'izq', ArrowRight: 'der', d: 'der', ' ': 'lanzar' };
    const baja = (ev: KeyboardEvent) => {
      const x = m[ev.key]; if (!x || !corre) return;
      ev.preventDefault(); if (ev.repeat && etapa !== 'cruce') return; apretar(x);
    };
    const sube = (ev: KeyboardEvent) => { const x = m[ev.key]; if (x) soltar(x); };
    window.addEventListener('keydown', baja); window.addEventListener('keyup', sube);
    return () => { window.removeEventListener('keydown', baja); window.removeEventListener('keyup', sube); };
  }, [apretar, soltar, etapa, corre]);

  // En el lienzo. Cruce: tocar avanza; deslizar mueve hacia ese lado. Andén y jefe: tocar salta; deslizar hacia abajo baja.
  const toque = useRef<{ x: number; y: number } | null>(null);
  const alBajar = (ev: React.PointerEvent) => { toque.current = { x: ev.clientX, y: ev.clientY }; };
  const alSoltar = (ev: React.PointerEvent) => {
    const t = toque.current; toque.current = null;
    if (!t) return;
    const dx = ev.clientX - t.x, dy = ev.clientY - t.y;
    if (etapa !== 'cruce') { apretar(dy > 40 && Math.abs(dy) > Math.abs(dx) ? 'abajo' : 'arriba'); return; }
    if (Math.hypot(dx, dy) < 24) apretar('arriba');
    else if (Math.abs(dx) > Math.abs(dy)) apretar(dx > 0 ? 'der' : 'izq');
    else apretar(dy < 0 ? 'arriba' : 'abajo');
  };

  // Botón de control: responde al apretar (no al soltar), suelta al levantar el dedo, y cada dedo es independiente.
  const control = (x: Accion) => ({
    onPointerDown: (ev: React.PointerEvent<HTMLButtonElement>) => {
      ev.preventDefault();
      try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch { /* sin captura */ }
      apretar(x);
    },
    onPointerUp: () => soltar(x), onPointerCancel: () => soltar(x), onLostPointerCapture: () => soltar(x),
    onClick: (ev: React.MouseEvent) => { if (ev.detail === 0) { apretar(x); soltar(x); } }, // teclado (Enter o espacio)
    onContextMenu: (ev: React.MouseEvent) => ev.preventDefault(),
  });

  const reiniciar = () => {
    cruce.current = nuevoCruce(); anden.current = null; jefe.current = null; camara.current = 0; espera.current = 0; setLlevar(null);
    setEtapa('cruce'); setIntro(true); setPausa(false); setPuntos(0); setResumen(null); setSumado(false); setMotivo('');
    setHud({ latas: [], tiros: 0, piezas: 0, vidas: VIDAS, golpes: 0, color: HUESO });
  };
  const llevarTarjeta = async () => {
    if (!resumen) return;
    setLlevar(await crearTarjeta(resumen, img.current.personaje));
  };

  if (!visto) return (
    <Tutorial etiqueta="Pixel · juego" titulo={TITULO}
      pasos={[
        { icono: 'route', texto: 'Nivel 1: cruza la ciudad hasta el metro y junta latas de pintura.' },
        { icono: 'format_paint', texto: 'Nivel 2: en el andén, encierra a los Grises en bolas de pintura y empújalas.' },
        { icono: 'auto_awesome', texto: 'Jefe: el Inacapín Pixel se quedó gris. Lánzale bolas y devuélvele el color.' },
      ]}
      acciones={[{ texto: 'Jugar', icono: 'play_arrow', alTocar: marcarVisto }]} />
  );

  const verVidas = nivel !== 'cruce';
  return (
    <div className="hp" data-nivel={nivel}>
      <header className="hp-barra">
        <a className="hp-btn hp-volver" href="../../" id="volver-hub" aria-label="Volver a las experiencias">
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span><span className="hp-ocultable">Experiencias</span>
        </a>
        <div className="hp-titulo"><h1>{TITULO}</h1><p>{NOMBRE_NIVEL[nivel]}</p></div>
        <p className="hp-puntaje" aria-live="polite"><span className="hp-etq">Puntaje</span> <b>{puntos}</b></p>
        <button type="button" className="hp-btn" onClick={() => setPausa(p => !p)} disabled={!enJuego || intro} aria-label={pausa ? 'Seguir' : 'Pausa'}>
          <span className="material-symbols-outlined" aria-hidden="true">{pausa ? 'play_arrow' : 'pause'}</span><span className="hp-ocultable">{pausa ? 'Seguir' : 'Pausa'}</span>
        </button>
        <button type="button" className="hp-btn" onClick={reiniciar} aria-label="Otra vez">
          <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span><span className="hp-ocultable">Otra vez</span>
        </button>
      </header>

      <main className="hp-lienzo">
        <canvas ref={lienzo} className="juego" role="img" aria-label={`${TITULO}: ${NOMBRE_NIVEL[nivel]}. Puntaje ${puntos}.`}
          onPointerDown={alBajar} onPointerUp={alSoltar} onPointerCancel={() => { toque.current = null; }} />

        <div className="hud" aria-label="Lo que llevas">
          {verVidas && <div className="chip" aria-label={`${plural(hud.vidas, 'vida')}`}>{Array.from({ length: VIDAS }, (_, i) => <Corazon key={i} lleno={i < hud.vidas} />)}</div>}
          <div className="chip" aria-label={plural(hud.latas.length, 'lata')}>
            <Lata color={hud.latas.at(-1) ?? HUESO} /> <b>{hud.latas.length}</b>
            {nivel === 'anden' && <span className="chip-sub">{plural(hud.tiros, 'tiro')}</span>}
          </div>
          {nivel !== 'cruce' && <div className="chip" aria-label={plural(hud.piezas, 'pieza')}><span className="pieza-ico" aria-hidden="true" /> <b>{hud.piezas}</b></div>}
          {nivel === 'jefe' && (
            <div className="chip hud-jefe" role="meter" aria-label="Color recuperado" aria-valuemin={0} aria-valuemax={GOLPES_JEFE} aria-valuenow={hud.golpes}>
              <span className="chip-sub">Color</span>
              <span className="barra-color">{COLORES_JEFE.map((col, i) => <i key={col} style={{ background: i < hud.golpes ? col : undefined }} />)}</span>
            </div>
          )}
          {nivel === 'cruce' && <div className="chip" aria-label={`Fila ${Math.min(cruce.current.maxY, META)} de ${META}`}><span className="material-symbols-outlined" aria-hidden="true">train</span> <b>{Math.min(cruce.current.maxY, META)}/{META}</b></div>}
        </div>

        {/* Controles a ambos lados: moverse a la izquierda, acciones a la derecha. */}
        {enJuego && !intro && !pausa && (
          <>
            <div className="mando izq" role="group" aria-label="Moverse">
              <button type="button" className="tecla arriba" aria-label={nivel === 'cruce' ? 'Avanzar' : 'Saltar'} {...control('arriba')}><Flecha giro={0} /></button>
              <button type="button" className="tecla izq" aria-label="Izquierda" {...control('izq')}><Flecha giro={-90} /></button>
              <button type="button" className="tecla der" aria-label="Derecha" {...control('der')}><Flecha giro={90} /></button>
              <button type="button" className="tecla abajo" aria-label={nivel === 'cruce' ? 'Retroceder' : 'Bajar'} {...control('abajo')}><Flecha giro={180} /></button>
            </div>
            <div className="mando der" role="group" aria-label="Acciones">
              {nivel === 'cruce' ? (
                <button type="button" className="tecla grande" {...control('arriba')}><Flecha giro={0} tam={34} /><span>Avanzar</span></button>
              ) : (<>
                <button type="button" className="tecla saltar" {...control('arriba')}><Flecha giro={0} /><span>Saltar</span></button>
                <button type="button" className="tecla grande" {...control('lanzar')} aria-label={`Lanzar pintura ${NOMBRE_PINTURA[hud.color]?.toLowerCase() ?? ''}`}>
                  <Lata color={hud.color} tam={34} /><span>Lanzar</span>
                </button>
              </>)}
            </div>
          </>
        )}

        {enJuego && intro && (
          <div className="capa" role="dialog" aria-modal="true" aria-labelledby="intro-t">
            <div className="caja">
              <p className="hp-etq">{NOMBRE_NIVEL[nivel]}</p>
              {nivel === 'jefe' && <Retrato partes={0} tam={88} />}
              <h2 id="intro-t">{nivel === 'cruce' ? 'Cruza hasta el metro' : nivel === 'anden' ? 'Limpia el andén' : 'Devuélvele el color'}</h2>
              <Reglas nivel={nivel} />
              <button type="button" className="hp-btn hp-primario" onClick={() => setIntro(false)} autoFocus>
                <span className="material-symbols-outlined" aria-hidden="true">play_arrow</span>¡Vamos!
              </button>
            </div>
          </div>
        )}
        {pausa && enJuego && (
          <div className="capa" role="dialog" aria-modal="true" aria-labelledby="pausa-t">
            <div className="caja">
              <h2 id="pausa-t">Pausa</h2>
              <p className="hp-etq">Cómo se juega · {NOMBRE_NIVEL[nivel]}</p>
              <Reglas nivel={nivel} />
              <button type="button" className="hp-btn hp-primario" onClick={() => setPausa(false)} autoFocus>
                <span className="material-symbols-outlined" aria-hidden="true">play_arrow</span>Seguir
              </button>
            </div>
          </div>
        )}
        {etapa === 'paso' && (
          <div className="capa" role="dialog" aria-modal="true" aria-labelledby="paso-t">
            <div className="caja">
              <h2 id="paso-t">¡Llegaste al metro!</h2>
              <div className="latas grande">{hud.latas.map((c, i) => <Lata key={i} color={c} tam={26} />)}</div>
              <p className="ayuda">
                {hud.latas.length ? `Juntaste ${plural(hud.latas.length, 'lata')}: ${hud.tiros} tiros de color. ` : 'No juntaste latas: vas a tirar pintura hueso, que necesita 5 golpes. '}
                Abajo, los Grises tienen tomado el andén.
              </p>
              <Reglas nivel="anden" />
              <button type="button" className="hp-btn hp-primario" onClick={bajarAlAnden} autoFocus>
                <span className="material-symbols-outlined" aria-hidden="true">stairs</span>Bajar al andén
              </button>
            </div>
          </div>
        )}
        {etapa === 'paso2' && (
          <div className="capa" role="dialog" aria-modal="true" aria-labelledby="paso2-t">
            <div className="caja">
              <h2 id="paso2-t">¡Llegó el Inacapín Pixel!</h2>
              <Retrato partes={0} tam={96} />
              <p className="ayuda">Limpiaste el andén, pero el Inacapín se quedó gris. Tu pintura no se acaba: sale de tus colores.</p>
              <Reglas nivel="jefe" />
              <button type="button" className="hp-btn hp-primario" onClick={enfrentarJefe} autoFocus>
                <span className="material-symbols-outlined" aria-hidden="true">format_paint</span>Devolverle el color
              </button>
            </div>
          </div>
        )}
        {etapa === 'fin' && resumen && (
          <div className="capa" role="dialog" aria-modal="true" aria-labelledby="fin-t">
            <div className="caja">
              <h2 id="fin-t">{motivo}</h2>
              <MuralVivo r={resumen} ancho={220} />
              <p className="hp-etq">Tu mural · {resumen.puntos} puntos · mejor de la sesión {Math.max(mejor, resumen.puntos)}</p>
              <p className="ayuda">
                {plural(resumen.filas, 'fila')} · {plural(resumen.latas.length, 'lata')}
                {resumen.nivel >= 2 ? ` · ${plural(resumen.arrastrados, 'Gris', 'Grises')} · ${plural(resumen.piezas.length, 'pieza')}` : ''}
                {resumen.nivel === 3 ? ` · ${resumen.golpes} de ${GOLPES_JEFE} colores` : ''}
              </p>
              {sumado && <p className="ayuda">Si juegas con tu credencial, tu mural llega a su inventario y suma al timbre Creación.</p>}
              <div className="acciones">
                <button type="button" className="hp-btn" onClick={llevarTarjeta}><span className="material-symbols-outlined" aria-hidden="true">ios_share</span>Llévate tu tarjeta</button>
                <button type="button" className="hp-btn hp-primario" onClick={reiniciar}><span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>Otra vez</button>
              </div>
            </div>
          </div>
        )}
      </main>
      {llevar && <Llevatela blob={llevar} app="juego" titulo="Tu mural está listo" conCredencial={!!jugador()?.codigo && sumado} alCerrar={() => setLlevar(null)} />}
      <Quiosco app="juego" alReiniciar={reiniciar} />
    </div>
  );
};
