import React, { useRef } from 'react';
import { DURACION_TRAYECTO, LLEGADA, type Item } from '../escenario/dibujar';
import { pieza } from '../escenario/piezas';
import { Interruptor, Segmentado } from '../../../shared/ui/Kit';

// Línea de tiempo (propuesta 005, «After Effects»): play, tiempo y FPS arriba; una fila por pieza con sus keyframes.
// En las piezas que caminan, A está en 0 s y al cerrar el loop; B se arrastra para elegir cuándo llega.
interface Props {
  items: Item[];
  sel: number | null;
  tiempo: number;
  pausado: boolean;
  fps: number;
  borde: boolean;
  onPlay: () => void;
  onTiempo: (ms: number) => void;
  onFps: (f: number) => void;
  onBorde: (b: boolean) => void;
  onElegir: (uid: number) => void;
  onLlegadaInicio: () => void;
  onLlegada: (uid: number, t: number) => void;
}

const FPS = [8, 12, 24];
const MIN = 0.12, MAX = 0.88;

export const LineaDeTiempo: React.FC<Props> = p => {
  const arrastre = useRef<{ uid: number; pista: HTMLElement } | null>(null);
  const fraccion = (e: React.PointerEvent, pista: HTMLElement) => {
    const r = pista.getBoundingClientRect();
    return Math.min(MAX, Math.max(MIN, (e.clientX - r.left) / r.width));
  };
  const u = p.tiempo / DURACION_TRAYECTO;
  return (
    <div className="linea-tiempo">
      <div className="lt-cabeza">
        <div className="lt-controles">
          <button type="button" className="k-btn k-icono k-primario" onClick={p.onPlay} aria-label={p.pausado ? 'Reproducir el loop' : 'Pausar el loop'}>
            <span className="material-symbols-outlined" aria-hidden="true">{p.pausado ? 'play_arrow' : 'pause'}</span>
          </button>
          <span className="lt-reloj">{(p.tiempo / 1000).toFixed(1)} s</span>
        </div>
        <input type="range" className="k-rango lt-cursor" min={0} max={DURACION_TRAYECTO} step={50} value={p.tiempo}
          onChange={e => p.onTiempo(Number(e.target.value))} aria-label="Tiempo del loop" />
        <div className="lt-ajustes">
          <Segmentado etiqueta="Cuadros por segundo" valor={p.fps} onCambiar={p.onFps} opciones={FPS.map(f => ({ valor: f, texto: `${f} fps` }))} />
          <Interruptor id="borde" texto="Borde" activo={p.borde} onCambiar={p.onBorde} />
        </div>
      </div>
      <div className="lt-pistas" style={{ '--filas': Math.max(1, p.items.length) } as React.CSSProperties}>
        {!p.items.length && <p className="k-ayuda lt-vacia">Arrastra piezas al escenario: cada una tendrá aquí su fila con sus keyframes.</p>}
        {[...p.items].reverse().map(it => {
          const b = it.llegada ?? LLEGADA;
          return (
            <div key={it.uid} className="lt-fila" aria-selected={p.sel === it.uid}>
              <button type="button" className="lt-nombre" onClick={() => p.onElegir(it.uid)}>{pieza(it.tipo).nombre}</button>
              <div className={'lt-pista' + (it.destino ? ' camina' : '')} role={it.destino ? 'slider' : undefined}
                aria-label={it.destino ? `${pieza(it.tipo).nombre}: llega a B a los ${(b * DURACION_TRAYECTO / 1000).toFixed(1)} s` : undefined}
                aria-valuemin={it.destino ? MIN * DURACION_TRAYECTO : undefined} aria-valuemax={it.destino ? MAX * DURACION_TRAYECTO : undefined} aria-valuenow={it.destino ? Math.round(b * DURACION_TRAYECTO) : undefined}
                tabIndex={it.destino ? 0 : undefined}
                onKeyDown={e => {
                  if (!it.destino || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
                  e.preventDefault(); p.onLlegadaInicio();
                  p.onLlegada(it.uid, Math.min(MAX, Math.max(MIN, b + (e.key === 'ArrowRight' ? 0.05 : -0.05))));
                }}
                onPointerDown={e => {
                  p.onElegir(it.uid);
                  if (!it.destino) return;
                  const pista = e.currentTarget;
                  try { pista.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
                  arrastre.current = { uid: it.uid, pista };
                  p.onLlegadaInicio();
                  p.onLlegada(it.uid, fraccion(e, pista));
                }}
                onPointerMove={e => { const a = arrastre.current; if (a && a.uid === it.uid) p.onLlegada(it.uid, fraccion(e, a.pista)); }}
                onPointerUp={() => { arrastre.current = null; }}
                onPointerCancel={() => { arrastre.current = null; }}>
                {it.destino ? (<>
                  <span className="lt-tramo ida" style={{ left: 0, width: `${b * 100}%` }} />
                  <span className="lt-tramo vuelta" style={{ left: `${b * 100}%`, width: `${(1 - b) * 100}%` }} />
                  <span className="lt-key" style={{ left: 0 }}>A</span>
                  <span className="lt-key b" style={{ left: `${b * 100}%` }}>B</span>
                  <span className="lt-key" style={{ left: '100%' }}>A</span>
                </>) : <span className="lt-tramo fijo" style={{ left: 0, width: '100%' }} />}
              </div>
            </div>
          );
        })}
        <span className="lt-cabezal" style={{ '--u': u } as React.CSSProperties} aria-hidden="true" />
      </div>
    </div>
  );
};
