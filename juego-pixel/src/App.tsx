import React, { useCallback, useEffect, useRef, useState } from 'react';
import { otorgarCreacion } from '../../shared/juego';
import { BarraSuperior, BotonAccion, PantallaHerramienta, Seccion } from '../../shared/ui/Kit';
import { Quiosco, Tutorial, useTutorialVisto } from '../../shared/ui/Tutorial';
import { avanzar, lanzar, mover, nuevoEstado, TEXTO_FIN, type Estado, type Fin } from './juego/motor';
import { dibujar, type Imagenes } from './juego/dibujo';
import { crearTarjeta, descargar } from './juego/tarjeta';
import '../../shared/ui/somos-kit.css';
import './styles.css';

// «Hora punta» (plan docs/plans/009-juego-pixel.md): juego Pixel que reemplaza al Vagón.
const TITULO = 'Hora punta';
const MIN_PUNTOS_CREACION = 5;
const quieto = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const cargarImagen = (ruta: string) => new Promise<HTMLImageElement | null>(res => {
  const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `${import.meta.env.BASE_URL}figma/${ruta}`;
});
const leerMejor = () => { try { return Number(sessionStorage.getItem('sd:juego:mejor')) || 0; } catch { return 0; } };

// Flecha pixel para los controles (no hay íconos de flechas en el subconjunto de Material Symbols).
const Flecha: React.FC<{ giro: number }> = ({ giro }) => (
  <svg viewBox="0 0 8 8" width="22" height="22" aria-hidden="true" style={{ transform: `rotate(${giro}deg)` }} shapeRendering="crispEdges">
    <path fill="currentColor" d="M3 0h2v1h1v1h1v1h1v2h-3v3h-2v-3h-3v-2h1v-1h1v-1h1z" />
  </svg>
);

export const App: React.FC = () => {
  const [visto, marcarVisto] = useTutorialVisto('juego');
  const lienzo = useRef<HTMLCanvasElement>(null);
  const estado = useRef<Estado>(nuevoEstado());
  const camara = useRef(0);
  const img = useRef<Imagenes>({ personaje: null, metro: null });
  const [puntos, setPuntos] = useState(0);
  const [fin, setFin] = useState<Fin>(null);
  const [pausa, setPausa] = useState(false);
  const [mejor, setMejor] = useState(leerMejor);
  const [tarjeta, setTarjeta] = useState<string | null>(null);
  const [sumado, setSumado] = useState(false);

  useEffect(() => { document.documentElement.dataset.visual = 'Pixel'; }, []);
  useEffect(() => {
    Promise.all([cargarImagen('personaje.svg'), cargarImagen('metro-lateral.svg')]).then(([personaje, metro]) => { img.current = { personaje, metro }; });
  }, []);

  const terminar = useCallback((e: Estado) => {
    setFin(e.fin);
    setMejor(m => { const n = Math.max(m, e.puntos); try { sessionStorage.setItem('sd:juego:mejor', String(n)); } catch { /* nada */ } return n; });
    // Una partida con puntaje cuenta como una de las 4 experiencias del timbre Creación (plan 009).
    if (e.puntos >= MIN_PUNTOS_CREACION) { otorgarCreacion('juego'); setSumado(true); }
  }, []);

  // Bucle del juego: avanza la lógica y dibuja; la cámara se desliza suave hacia la fila del jugador.
  useEffect(() => {
    if (!visto) return;
    let vivo = true, previo = performance.now(), ultimoPuntaje = -1;
    const cuadro = (t: number) => {
      if (!vivo) return;
      const c = lienzo.current, e = estado.current, dt = t - previo;
      previo = t;
      if (!pausa && !e.fin) {
        avanzar(e, dt);
        if (e.fin) terminar(e);
      }
      camara.current += (e.camara - camara.current) * (quieto() ? 1 : Math.min(1, dt / 120));
      if (c && c.width) dibujar(c.getContext('2d')!, c.width, c.height, e, camara.current, img.current, t);
      if (e.puntos !== ultimoPuntaje) { ultimoPuntaje = e.puntos; setPuntos(e.puntos); }
      requestAnimationFrame(cuadro);
    };
    requestAnimationFrame(cuadro);
    return () => { vivo = false; };
  }, [visto, pausa, terminar]);

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

  const accion = useCallback((a: 'arriba' | 'abajo' | 'izq' | 'der' | 'lanzar') => {
    const e = estado.current;
    if (pausa || e.fin) return;
    if (a === 'lanzar') lanzar(e);
    else mover(e, a === 'izq' ? -1 : a === 'der' ? 1 : 0, a === 'arriba' ? 1 : a === 'abajo' ? -1 : 0);
    if (e.fin) terminar(e);
  }, [pausa, terminar]);

  // Teclado (para probar en el computador): flechas o WASD y espacio.
  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => {
      const m: Record<string, 'arriba' | 'abajo' | 'izq' | 'der' | 'lanzar'> = { ArrowUp: 'arriba', w: 'arriba', ArrowDown: 'abajo', s: 'abajo', ArrowLeft: 'izq', a: 'izq', ArrowRight: 'der', d: 'der', ' ': 'lanzar' };
      const a = m[ev.key];
      if (a) { ev.preventDefault(); accion(a); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [accion]);

  // En el lienzo: tocar avanza; deslizar mueve hacia ese lado.
  const toque = useRef<{ x: number; y: number } | null>(null);
  const alBajar = (ev: React.PointerEvent) => { toque.current = { x: ev.clientX, y: ev.clientY }; };
  const alSoltar = (ev: React.PointerEvent) => {
    const t = toque.current; toque.current = null;
    if (!t) return;
    const dx = ev.clientX - t.x, dy = ev.clientY - t.y;
    if (Math.hypot(dx, dy) < 24) accion('arriba');
    else if (Math.abs(dx) > Math.abs(dy)) accion(dx > 0 ? 'der' : 'izq');
    else accion(dy < 0 ? 'arriba' : 'abajo');
  };

  const reiniciar = () => { estado.current = nuevoEstado(); camara.current = 0; setFin(null); setPausa(false); setPuntos(0); setTarjeta(null); setSumado(false); };
  const llevarTarjeta = async () => {
    const blob = await crearTarjeta(estado.current, img.current.personaje);
    setTarjeta(URL.createObjectURL(blob));
    descargar(blob, 'hora-punta-somos-diseno.png');
  };

  if (!visto) return (
    <Tutorial etiqueta="Pixel · juego" titulo={TITULO}
      pasos={[
        { icono: 'route', texto: 'Cruza la ciudad fila por fila: esquiva autos, micros y el metro.' },
        { icono: 'format_paint', texto: 'Lanza pintura a los Grises: con 3 golpes quedan en una bola.' },
        { icono: 'swap_horiz', texto: 'Empuja la bola para llevarte a los otros Grises. ¡No te quedes quieto!' },
      ]}
      acciones={[{ texto: 'Jugar', icono: 'play_arrow', alTocar: marcarVisto }]} />
  );

  const e = estado.current;
  return (
    <>
      <PantallaHerramienta
        anchoLateral={250}
        superior={
          <BarraSuperior titulo={TITULO} bajada="Cruza la ciudad y devuélvele el color">
            <BotonAccion icono={pausa ? 'play_arrow' : 'pause'} texto={pausa ? 'Seguir' : 'Pausa'} onClick={() => setPausa(p => !p)} disabled={!!fin} />
            <BotonAccion icono="restart_alt" texto="Otra vez" onClick={reiniciar} />
          </BarraSuperior>
        }
        lateral={<>
          <Seccion titulo="Puntaje">
            <p className="puntaje" aria-live="polite">{puntos}</p>
            <p className="k-etq">Mejor de la sesión: {Math.max(mejor, puntos)}</p>
          </Seccion>
          <Seccion titulo="Cómo se juega" crece>
            <ul className="reglas">
              <li><b>Avanza</b> fila por fila: cada fila nueva es un punto.</li>
              <li><b>Lanza pintura</b> a los Grises: 3 golpes y quedan en una bola (+2).</li>
              <li><b>Empuja la bola</b> caminando hacia ella: se lleva a los Grises (+5, ×2, ×3…).</li>
              <li>Si te quedas quieto, se te pasa la hora punta.</li>
            </ul>
          </Seccion>
        </>}
        inferior={
          <div className="controles" role="group" aria-label="Controles">
            <button type="button" className="k-btn control" aria-label="Izquierda" onClick={() => accion('izq')}><Flecha giro={-90} /></button>
            <button type="button" className="k-btn control" aria-label="Avanzar" onClick={() => accion('arriba')}><Flecha giro={0} /></button>
            <button type="button" className="k-btn control" aria-label="Retroceder" onClick={() => accion('abajo')}><Flecha giro={180} /></button>
            <button type="button" className="k-btn control" aria-label="Derecha" onClick={() => accion('der')}><Flecha giro={90} /></button>
            <button type="button" className="k-btn k-primario lanzar" onClick={() => accion('lanzar')}>
              <span className="material-symbols-outlined" aria-hidden="true">format_paint</span>Lanzar pintura
            </button>
          </div>
        }
      >
        <div className="tablero">
          <canvas ref={lienzo} className="juego" role="img" aria-label={`${TITULO}: tablero de juego. Puntaje ${puntos}.`}
            onPointerDown={alBajar} onPointerUp={alSoltar} onPointerCancel={() => { toque.current = null; }} />
          {pausa && !fin && <div className="capa"><div className="k-panel caja"><h2>Pausa</h2><BotonAccion icono="play_arrow" texto="Seguir" primario onClick={() => setPausa(false)} /></div></div>}
          {fin && (
            <div className="capa" role="dialog" aria-modal="true" aria-labelledby="fin-t">
              <div className="k-panel caja">
                <h2 id="fin-t">{TEXTO_FIN[fin]}</h2>
                <p className="puntaje">{e.puntos}</p>
                <p className="k-etq">{e.maxY} filas · {e.bolas} bolas · {e.arrastrados} Grises</p>
                {sumado && <p className="k-ayuda">Si estás jugando con tu credencial, esta partida suma al timbre Creación.</p>}
                {tarjeta && <img className="tarjeta-mini" src={tarjeta} alt={`Tarjeta de Hora punta con ${e.puntos} puntos`} />}
                <div className="acciones">
                  <BotonAccion icono="download" texto="Llévate tu tarjeta" onClick={llevarTarjeta} />
                  <BotonAccion icono="restart_alt" texto="Otra vez" primario onClick={reiniciar} />
                </div>
              </div>
            </div>
          )}
        </div>
      </PantallaHerramienta>
      <Quiosco app="juego" alReiniciar={reiniciar} />
    </>
  );
};
