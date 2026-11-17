import React, { useCallback, useEffect, useRef, useState } from 'react';
import { jugador, otorgarCreacion } from '../../shared/juego';
import { publicar } from '../../shared/datos';
import { BarraSuperior, BotonAccion, PantallaHerramienta, Seccion } from '../../shared/ui/Kit';
import { Quiosco, Tutorial, useTutorialVisto } from '../../shared/ui/Tutorial';
import { avanzarCruce, META, mover, nuevoCruce, type Cruce } from './juego/cruce';
import { avanzarAnden, bajar, lanzarA, nuevoAnden, saltar, type Anden } from './juego/anden';
import { HUESO, NOMBRE_PINTURA, TIROS_POR_LATA } from './juego/comun';
import { dibujarCruce, type Imagenes } from './juego/dibujoCruce';
import { dibujarAnden } from './juego/dibujoAnden';
import { avanzarPared, bajarPaso, girar, moverPar, muralDePared, nuevaPared, soltarPar, tusColores, type Pared } from './juego/pared';
import { dibujarPared } from './juego/dibujoPared';
import { dibujarMural, miniaturaMural } from './juego/mural';
import { crearTarjeta, type Resumen } from './juego/tarjeta';
import { Llevatela } from '../../shared/ui/Llevatela';
import '../../shared/ui/somos-kit.css';
import './styles.css';

// «Hora punta» (plan docs/plans/009-juego-pixel.md): juego Pixel por niveles que reemplaza al Vagón.
// Nivel 1, El cruce: juntas latas de pintura. Nivel 2, El andén: con esa pintura atrapas Grises y juntas piezas.
// Nivel 3, La pared: con tus colores borras grupos que pintan la pared. Lo que te llevas es tu mural.
const TITULO = 'Hora punta';
const MIN_PUNTOS_CREACION = 5;
type Etapa = 'cruce' | 'paso' | 'anden' | 'paso2' | 'pared' | 'fin';
type Accion = 'arriba' | 'abajo' | 'izq' | 'der' | 'lanzar';

const quieto = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const cargarImagen = (ruta: string) => new Promise<HTMLImageElement | null>(res => {
  const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `${import.meta.env.BASE_URL}figma/${ruta}`;
});
// `?nivel=2` parte en el andén con 3 latas y `?nivel=3` en la pared (para probar y para mostrarlo), como `?quiosco=`.
const NIVEL = Number(new URLSearchParams(location.search).get('nivel')) || 1;
const LATAS_PRUEBA = ['#FF8FB1', '#FFC20E', '#7FC8F8'];
const PIEZAS_PRUEBA = [{ color: '#00A651', forma: 'corazon' as const }, { color: '#FF8FB1', forma: 'estrella' as const }, { color: '#FFC20E', forma: 'rayo' as const }, { color: '#00A651', forma: 'gota' as const }];
const andenDePrueba = () => Object.assign(nuevoAnden(LATAS_PRUEBA), NIVEL === 3 ? { juntadas: PIEZAS_PRUEBA, limpio: true } : {});
const plural = (n: number, uno: string, varios = uno + 's') => `${n} ${n === 1 ? uno : varios}`;
const leerMejor = () => { try { return Number(sessionStorage.getItem('sd:juego:mejor')) || 0; } catch { return 0; } };

// Flecha pixel para los controles (no hay íconos de flechas en el subconjunto de Material Symbols).
const Flecha: React.FC<{ giro: number }> = ({ giro }) => (
  <svg viewBox="0 0 8 8" width="22" height="22" aria-hidden="true" style={{ transform: `rotate(${giro}deg)` }} shapeRendering="crispEdges">
    <path fill="currentColor" d="M3 0h2v1h1v1h1v1h1v2h-3v3h-2v-3h-3v-2h1v-1h1v-1h1z" />
  </svg>
);
const Lata: React.FC<{ color: string; tam?: number }> = ({ color, tam = 18 }) => (
  <svg viewBox="0 0 8 8" width={tam} height={tam} aria-hidden="true" shapeRendering="crispEdges">
    <path fill="#000" d="M1 0h6v1h1v6h-1v1h-6v-1h-1v-6h1z" /><path fill="#B9B9B3" d="M1 1h6v1h-6zM1 6h6v1h-6z" />
    <path fill={color} d="M1 2h6v4h-6z" /><path fill="#fff" d="M2 3h1v2h-1z" />
  </svg>
);

// Mural en un canvas chico (pantalla final y barra derecha).
const MuralVivo: React.FC<{ r: Resumen; ancho: number }> = ({ r, ancho }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    c.width = ancho * d; c.height = ancho * 0.75 * d;
    dibujarMural(c.getContext('2d')!, 0, 0, ancho * d, r);
  }, [r, ancho]);
  return <canvas ref={ref} className="mural" style={{ width: ancho, height: ancho * 0.75 }} role="img"
    aria-label={r.pared ? `Tu mural: la pared pintada con ${plural(r.borradas, 'pieza')}` : `Tu mural: ${plural(r.piezas.length, 'pieza')} y ${plural(r.latas.length, 'lata')}`} />;
};

export const App: React.FC = () => {
  const [visto, marcarVisto] = useTutorialVisto('juego');
  const lienzo = useRef<HTMLCanvasElement>(null);
  const cruce = useRef<Cruce>(Object.assign(nuevoCruce(), NIVEL > 1 ? { latas: LATAS_PRUEBA } : {}));
  const anden = useRef<Anden | null>(NIVEL > 1 ? andenDePrueba() : null);
  const pared = useRef<Pared | null>(NIVEL === 3 ? nuevaPared(LATAS_PRUEBA, PIEZAS_PRUEBA) : null);
  const camara = useRef(0);
  const img = useRef<Imagenes>({ personaje: null, metro: null });
  const [etapa, setEtapa] = useState<Etapa>(NIVEL === 3 ? 'pared' : NIVEL === 2 ? 'anden' : 'cruce');
  const [puntos, setPuntos] = useState(0);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [inv, setInv] = useState({ latas: [] as string[], tiros: 0, piezas: 0, pintadas: 0 });
  const [motivo, setMotivo] = useState('');
  const [pausa, setPausa] = useState(false);
  const [mejor, setMejor] = useState(leerMejor);
  const [sumado, setSumado] = useState(false);
  const [llevar, setLlevar] = useState<Blob | null>(null); // «Llévatela» con QR (plan 011)

  useEffect(() => { document.documentElement.dataset.visual = 'Pixel'; }, []);
  useEffect(() => {
    Promise.all([cargarImagen('personaje.svg'), cargarImagen('metro-lateral.svg')]).then(([personaje, metro]) => { img.current = { personaje, metro }; });
  }, []);

  const resumir = useCallback((): Resumen => {
    const c = cruce.current, a = anden.current, p = pared.current;
    return {
      puntos: c.puntos + (a?.puntos ?? 0) + (p?.puntos ?? 0), filas: c.maxY, latas: c.latas, bolas: a?.bolas ?? 0, arrastrados: a?.arrastrados ?? 0,
      piezas: a?.juntadas ?? [], nivel: p ? 3 : a ? 2 : 1, limpio: !!a?.limpio, borradas: p?.borradas ?? 0, cadena: p?.mejorCadena ?? 0,
      pared: p ? muralDePared(p) : undefined,
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

  const bajarAlAnden = () => {
    anden.current = nuevoAnden(cruce.current.latas);
    setEtapa('anden'); setPausa(false);
  };
  const pintarLaPared = () => {
    pared.current = nuevaPared(cruce.current.latas, anden.current?.juntadas ?? []);
    setEtapa('pared'); setPausa(false);
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
      const a = anden.current, p = pared.current;
      if (p && (etapa === 'pared' || etapa === 'fin')) {
        if (!pausa && etapa === 'pared') {
          avanzarPared(p, dt);
          if (p.fin) terminar(p.fin === 'tiempo' ? '¡Pintaste la pared!' : '¡La pared se llenó!');
        }
        if (ctx) dibujarPared(ctx, c!.width, c!.height, p, t);
      } else if (a && (etapa === 'anden' || etapa === 'paso2' || etapa === 'fin')) {
        if (!pausa && etapa === 'anden') {
          avanzarAnden(a, dt);
          if (a.fin) terminar('¡Un Gris te borró!');
          else if (a.limpio) setEtapa('paso2');
        }
        if (ctx) dibujarAnden(ctx, c!.width, c!.height, a, img.current, t);
      } else {
        const e = cruce.current;
        if (!pausa && etapa === 'cruce') {
          avanzarCruce(e, dt);
          if (e.fin) terminar(e.fin === 'atropellado' ? '¡Te atropellaron!' : e.fin === 'tren' ? '¡Pasó el metro!' : 'Se te pasó la hora punta');
        }
        camara.current += (e.camara - camara.current) * (quieto() ? 1 : Math.min(1, dt / 120));
        if (ctx) dibujarCruce(ctx, c!.width, c!.height, e, camara.current, img.current, t);
      }
      const total = cruce.current.puntos + (a?.puntos ?? 0) + (p?.puntos ?? 0);
      const firma = `${total}|${cruce.current.latas.length}|${a?.municion.length ?? -1}|${a?.juntadas.length ?? 0}|${p?.borradas ?? 0}`;
      if (firma !== ultimo) {
        ultimo = firma; setPuntos(total);
        setInv({ latas: [...cruce.current.latas], tiros: a ? a.municion.length : cruce.current.latas.length * TIROS_POR_LATA, piezas: a?.juntadas.length ?? 0, pintadas: p?.borradas ?? 0 });
      }
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
    return () => { vivo = false; };
  }, [visto, pausa, etapa, terminar]);

  // Al llegar a la entrada del metro termina el nivel 1.
  useEffect(() => {
    if (etapa !== 'cruce') return;
    const t = setInterval(() => { if (cruce.current.llego) setEtapa('paso'); }, 100);
    return () => clearInterval(t);
  }, [etapa]);

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

  // Apretar y soltar: en el nivel 1 cada toque es un paso; en el nivel 2 ◀ ▶ se mantienen para caminar.
  const apretar = useCallback((x: Accion) => {
    if (pausa) return;
    if (etapa === 'cruce') {
      const e = cruce.current;
      if (x === 'lanzar') return;
      mover(e, x === 'izq' ? -1 : x === 'der' ? 1 : 0, x === 'arriba' ? 1 : x === 'abajo' ? -1 : 0);
      if (e.fin) terminar(e.fin === 'atropellado' ? '¡Te atropellaron!' : '¡Pasó el metro!');
    } else if (etapa === 'anden' && anden.current) {
      const a = anden.current;
      if (x === 'izq') a.teclas.izq = true;
      else if (x === 'der') a.teclas.der = true;
      else if (x === 'arriba') saltar(a);
      else if (x === 'abajo') bajar(a);
      else lanzarA(a);
    } else if (etapa === 'pared' && pared.current) {
      const p = pared.current;
      if (x === 'izq') moverPar(p, -1);
      else if (x === 'der') moverPar(p, 1);
      else if (x === 'arriba') girar(p);
      else if (x === 'abajo') bajarPaso(p);
      else soltarPar(p);
    }
  }, [pausa, etapa, terminar]);
  const soltar = useCallback((x: Accion) => {
    const a = anden.current;
    if (a && x === 'izq') a.teclas.izq = false;
    if (a && x === 'der') a.teclas.der = false;
  }, []);

  // Teclado (para probar en el computador): flechas o WASD y espacio.
  useEffect(() => {
    const m: Record<string, Accion> = { ArrowUp: 'arriba', w: 'arriba', ArrowDown: 'abajo', s: 'abajo', ArrowLeft: 'izq', a: 'izq', ArrowRight: 'der', d: 'der', ' ': 'lanzar' };
    const baja = (ev: KeyboardEvent) => { const x = m[ev.key]; if (!x) return; ev.preventDefault(); if (ev.repeat && etapa === 'anden') return; apretar(x); };
    const sube = (ev: KeyboardEvent) => { const x = m[ev.key]; if (x) soltar(x); };
    window.addEventListener('keydown', baja); window.addEventListener('keyup', sube);
    return () => { window.removeEventListener('keydown', baja); window.removeEventListener('keyup', sube); };
  }, [apretar, soltar, etapa]);

  // En el lienzo. Nivel 1: tocar avanza; deslizar mueve hacia ese lado. Nivel 2: tocar salta; deslizar hacia abajo baja.
  const toque = useRef<{ x: number; y: number } | null>(null);
  const alBajar = (ev: React.PointerEvent) => { toque.current = { x: ev.clientX, y: ev.clientY }; };
  const alSoltar = (ev: React.PointerEvent) => {
    const t = toque.current; toque.current = null;
    if (!t) return;
    const dx = ev.clientX - t.x, dy = ev.clientY - t.y;
    if (etapa === 'anden') { apretar(dy > 40 && Math.abs(dy) > Math.abs(dx) ? 'abajo' : 'arriba'); return; }
    if (etapa === 'pared') {
      if (Math.hypot(dx, dy) < 24) apretar('arriba'); // tocar gira
      else if (Math.abs(dx) > Math.abs(dy)) for (let k = 0; k < Math.max(1, Math.round(Math.abs(dx) / 60)); k++) apretar(dx > 0 ? 'der' : 'izq');
      else if (dy > 0) apretar('lanzar'); // deslizar hacia abajo suelta
      return;
    }
    if (Math.hypot(dx, dy) < 24) apretar('arriba');
    else if (Math.abs(dx) > Math.abs(dy)) apretar(dx > 0 ? 'der' : 'izq');
    else apretar(dy < 0 ? 'arriba' : 'abajo');
  };

  // Botón de control: responde al apretar (no al soltar) y suelta al levantar el dedo o salirse del botón.
  const control = (x: Accion) => ({
    onPointerDown: (ev: React.PointerEvent) => { ev.preventDefault(); apretar(x); },
    onPointerUp: () => soltar(x), onPointerLeave: () => soltar(x), onPointerCancel: () => soltar(x),
    onClick: (ev: React.MouseEvent) => { if (ev.detail === 0) { apretar(x); soltar(x); } }, // teclado (Enter o espacio)
    onContextMenu: (ev: React.MouseEvent) => ev.preventDefault(),
  });

  const reiniciar = () => {
    cruce.current = nuevoCruce(); anden.current = null; pared.current = null; camara.current = 0; setLlevar(null);
    setEtapa('cruce'); setPausa(false); setPuntos(0); setResumen(null); setSumado(false); setMotivo('');
    setInv({ latas: [], tiros: 0, piezas: 0, pintadas: 0 });
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
        { icono: 'palette', texto: 'Nivel 3: con tus colores pintas la pared de la estación. Esa pared es tu mural.' },
      ]}
      acciones={[{ texto: 'Jugar', icono: 'play_arrow', alTocar: marcarVisto }]} />
  );

  const enAnden = etapa === 'anden' || etapa === 'paso2' || (etapa === 'fin' && resumen?.nivel === 2);
  const enPared = etapa === 'pared' || (etapa === 'fin' && resumen?.nivel === 3);
  const colores = pared.current?.colores ?? tusColores(inv.latas, anden.current?.juntadas ?? []);
  const proxima = anden.current?.municion[0] ?? HUESO;
  return (
    <>
      <PantallaHerramienta
        anchoLateral={250}
        superior={
          <BarraSuperior titulo={TITULO} bajada={enPared ? 'Nivel 3 · La pared' : enAnden ? 'Nivel 2 · El andén' : 'Nivel 1 · El cruce'}>
            <BotonAccion icono={pausa ? 'play_arrow' : 'pause'} texto={pausa ? 'Seguir' : 'Pausa'} onClick={() => setPausa(p => !p)} disabled={etapa === 'fin' || etapa === 'paso' || etapa === 'paso2'} />
            <BotonAccion icono="restart_alt" texto="Otra vez" onClick={reiniciar} />
          </BarraSuperior>
        }
        lateral={<>
          <Seccion titulo="Puntaje">
            <p className="puntaje" aria-live="polite">{puntos}</p>
            <p className="k-etq">Mejor de la sesión: {Math.max(mejor, puntos)}</p>
          </Seccion>
          <Seccion titulo="Lo que llevas">
            <div className="latas" aria-label={`${inv.latas.length} latas de pintura`}>
              {inv.latas.length ? inv.latas.slice(-12).map((c, i) => <Lata key={i} color={c} />) : <span className="k-etq">Sin latas todavía</span>}
            </div>
            <p className="k-etq">
              {enPared ? `${plural(inv.piezas, 'pieza')} · ${plural(inv.pintadas, 'casilla')} pintadas` : enAnden ? `${plural(inv.tiros, 'tiro')} de color · ${plural(inv.piezas, 'pieza')}` : `${plural(inv.latas.length, 'lata')} = ${plural(inv.tiros, 'tiro')} para el nivel 2`}
            </p>
          </Seccion>
          <Seccion titulo="Cómo se juega" crece>
            {enPared ? (
              <ul className="reglas">
                <li><b>◀ ▶</b> mover, <b>▲</b> girar, <b>▼</b> bajar, <b>Soltar</b> lo deja caer.</li>
                <li><b>4 iguales</b> que se tocan se borran y <b>pintan la pared</b>. Si se arma otro grupo al caer: cadena.</li>
                <li>Los <b>Grises</b> se borran solo junto a un grupo de color.</li>
                <li>Tienes 90 s. La pared pintada es <b>tu mural</b>.</li>
              </ul>
            ) : enAnden ? (
              <ul className="reglas">
                <li><b>◀ ▶</b> caminar, <b>▲</b> saltar, <b>▼</b> bajar.</li>
                <li><b>Lanza pintura</b>: 3 golpes de color y el Gris queda en una bola. Sin latas, la pintura hueso necesita 5.</li>
                <li><b>Camina contra la bola</b> y rueda: se lleva a los Grises.</li>
                <li>Cada Gris suelta una <b>pieza</b> de tu mural: ve a buscarla. Tienes 3 vidas.</li>
              </ul>
            ) : (
              <ul className="reglas">
                <li><b>Avanza</b> fila por fila hasta el metro ({META} filas).</li>
                <li><b>Junta latas</b>: cada una son {TIROS_POR_LATA} tiros de color en el nivel 2.</li>
                <li>Esquiva autos, micros y el metro. No te quedes quieto.</li>
              </ul>
            )}
          </Seccion>
        </>}
        inferior={
          <div className="controles" role="group" aria-label="Controles">
            <button type="button" className="k-btn control" aria-label="Izquierda" {...control('izq')}><Flecha giro={-90} /></button>
            <button type="button" className="k-btn control" aria-label={enPared ? 'Girar' : enAnden ? 'Saltar' : 'Avanzar'} {...control('arriba')}><Flecha giro={0} /></button>
            <button type="button" className="k-btn control" aria-label={enPared || enAnden ? 'Bajar' : 'Retroceder'} {...control('abajo')}><Flecha giro={180} /></button>
            <button type="button" className="k-btn control" aria-label="Derecha" {...control('der')}><Flecha giro={90} /></button>
            {enPared ? (
              <button type="button" className="k-btn k-primario lanzar" disabled={etapa !== 'pared'} {...control('lanzar')}>
                <span className="material-symbols-outlined" aria-hidden="true">download</span>Soltar
              </button>
            ) : (
              <button type="button" className="k-btn k-primario lanzar" disabled={etapa !== 'anden'} {...control('lanzar')}>
                <Lata color={etapa === 'anden' ? proxima : HUESO} tam={20} />
                {etapa === 'anden' ? `Lanzar ${NOMBRE_PINTURA[proxima]?.toLowerCase() ?? 'pintura'}` : 'Lanzar (nivel 2)'}
              </button>
            )}
          </div>
        }
      >
        <div className="tablero">
          <canvas ref={lienzo} className="juego" role="img" aria-label={`${TITULO}: ${enPared ? 'la pared' : enAnden ? 'el andén' : 'el cruce'}. Puntaje ${puntos}.`}
            onPointerDown={alBajar} onPointerUp={alSoltar} onPointerCancel={() => { toque.current = null; }} />
          {pausa && etapa !== 'fin' && <div className="capa"><div className="k-panel caja"><h2>Pausa</h2><BotonAccion icono="play_arrow" texto="Seguir" primario onClick={() => setPausa(false)} /></div></div>}
          {etapa === 'paso' && (
            <div className="capa" role="dialog" aria-modal="true" aria-labelledby="paso-t">
              <div className="k-panel caja">
                <h2 id="paso-t">¡Llegaste al metro!</h2>
                <div className="latas grande">{inv.latas.length ? inv.latas.map((c, i) => <Lata key={i} color={c} tam={26} />) : null}</div>
                <p className="k-ayuda">
                  {inv.latas.length
                    ? `Juntaste ${inv.latas.length} ${inv.latas.length === 1 ? 'lata' : 'latas'}: ${inv.tiros} tiros de color. `
                    : 'No juntaste latas: vas a tirar pintura hueso, que necesita 5 golpes. '}
                  Abajo, los Grises tienen tomado el andén.
                </p>
                <BotonAccion icono="stairs" texto="Bajar al andén" primario onClick={bajarAlAnden} />
              </div>
            </div>
          )}
          {etapa === 'paso2' && (
            <div className="capa" role="dialog" aria-modal="true" aria-labelledby="paso2-t">
              <div className="k-panel caja">
                <h2 id="paso2-t">¡Limpiaste el andén!</h2>
                <div className="latas grande">{colores.map(c => <Lata key={c} color={c} tam={26} />)}</div>
                <p className="k-ayuda">
                  Ahora pinta la pared de la estación con tus colores ({colores.map(c => NOMBRE_PINTURA[c]?.toLowerCase()).join(', ')}).
                  Junta 4 iguales para borrarlas: lo que borras queda pintado y esa pared es tu mural.
                </p>
                <BotonAccion icono="format_paint" texto="Pintar la pared" primario onClick={pintarLaPared} />
              </div>
            </div>
          )}
          {etapa === 'fin' && resumen && (
            <div className="capa" role="dialog" aria-modal="true" aria-labelledby="fin-t">
              <div className="k-panel caja">
                <h2 id="fin-t">{motivo}</h2>
                <MuralVivo r={resumen} ancho={200} />
                <p className="k-etq">Tu mural · {resumen.puntos} puntos</p>
                <p className="k-etq">{plural(resumen.filas, 'fila')} · {plural(resumen.latas.length, 'lata')}{resumen.nivel >= 2 ? ` · ${plural(resumen.arrastrados, 'Gris', 'Grises')} · ${plural(resumen.piezas.length, 'pieza')}` : ''}{resumen.nivel === 3 ? ` · ${plural(resumen.borradas, 'pintada', 'pintadas')}` : ''}</p>
                {sumado && <p className="k-ayuda">Si juegas con tu credencial, tu mural llega a su inventario y suma al timbre Creación.</p>}
                <div className="acciones">
                  <BotonAccion icono="ios_share" texto="Llévate tu tarjeta" onClick={llevarTarjeta} />
                  <BotonAccion icono="restart_alt" texto="Otra vez" primario onClick={reiniciar} />
                </div>
              </div>
            </div>
          )}
        </div>
      </PantallaHerramienta>
      {llevar && <Llevatela blob={llevar} app="juego" titulo="Tu mural está listo" conCredencial={!!jugador()?.codigo && sumado} alCerrar={() => setLlevar(null)} />}
      <Quiosco app="juego" alReiniciar={reiniciar} />
    </>
  );
};
