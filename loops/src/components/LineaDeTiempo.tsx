import React, { useRef } from 'react';
import { DURACION_TRAYECTO, LLEGADA, type Item } from '../escenario/dibujar';
import { pieza } from '../escenario/piezas';
import { BotonIcono, Interruptor, Segmento } from '../../../shared/ui/Herramienta';

// Línea de tiempo (propuesta 005, «After Effects»): play, tiempo y FPS arriba; una fila por pieza con sus keyframes.
// En las piezas que caminan, A está en 0 s y al cerrar el loop; B se arrastra para elegir cuándo llega.
interface Props {
  items: Item[];
  sel: number | null;
  tiempo: number;
  pausado: boolean;
  fps: number;
  borde: boolean;
  max?: number; // tope de piezas por escena
  disabled?: boolean; // mientras se graba el video
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
// En la fila basta la primera palabra de los nombres largos («Picaflor de Arica» → «Picaflor»), para que no se corten.
const corto = (n: string) => (n.length > 12 ? n.split(' ')[0] : n);

export const LineaDeTiempo: React.FC<Props> = p => {
  const arrastre = useRef<{ uid: number; pista: HTMLElement } | null>(null);
  const fraccion = (e: React.PointerEvent, pista: HTMLElement) => {
    const r = pista.getBoundingClientRect();
    return Math.min(MAX, Math.max(MIN, (e.clientX - r.left) / r.width));
  };
  const u = p.tiempo / DURACION_TRAYECTO;
  return (
    <div className="linea-tiempo" role="group" aria-label="Línea de tiempo" data-h-sin-gestos="">
      <div className="lt-cabeza">
        <div className="lt-controles">
          <BotonIcono variante="primario" icono={p.pausado ? 'play_arrow' : 'pause'} etiqueta={p.pausado ? 'Reproducir el loop' : 'Pausar el loop'} onClick={p.onPlay} disabled={p.disabled} />
          <span className="lt-reloj">{(p.tiempo / 1000).toFixed(1)} s</span>
        </div>
        <input type="range" className="h-rango lt-cursor" min={0} max={DURACION_TRAYECTO} step={50} value={p.tiempo}
          style={{ '--p': `${u * 100}%` } as React.CSSProperties} disabled={p.disabled}
          onChange={e => p.onTiempo(Number(e.target.value))} aria-label="Tiempo del loop" />
        <div className="lt-ajustes">
          <Segmento etiqueta="Cuadros por segundo" valor={p.fps} onCambiar={p.onFps} opciones={FPS.map(f => ({ valor: f, texto: `${f} fps`, disabled: p.disabled }))} />
          <Interruptor texto="Borde" activo={p.borde} onCambiar={p.onBorde} />
        </div>
      </div>
      <div className="lt-pistas" style={{ '--filas': Math.max(1, p.items.length) } as React.CSSProperties}>
        {!p.items.length && <p className="h-ayuda lt-vacia">Arrastra piezas al escenario: cada una tendrá aquí su fila con sus keyframes{p.max ? ` (hasta ${p.max})` : ''}.</p>}
        {[...p.items].reverse().map(it => {
          const b = it.llegada ?? LLEGADA;
          return (
            <div key={it.uid} className="lt-fila" aria-selected={p.sel === it.uid}>
              <button type="button" className="lt-nombre" aria-label={pieza(it.tipo).nombre} onClick={() => p.onElegir(it.uid)}>{corto(pieza(it.tipo).nombre)}</button>
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
