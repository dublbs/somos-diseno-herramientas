import { useEffect, useRef, type CSSProperties, type MutableRefObject } from 'react';
import { MARCOS, VISUALES, type Visual } from '../data/marcos';
import { TINTAS, coloresTinta } from '../data/tintas';
import { EFECTOS, dibujarPlaca, placasDe, tienePlacas } from '../lib/trama';
import { demoDe } from '../lib/demo';
import type { Cara } from '../lib/cara';
import type { Lado } from '../hooks/useCamara';
import type { FotoEditable } from './Editor';
import { BotonAccion, Deslizador, Seccion, Segmentado } from '../../../shared/ui/Kit';

// Panel derecho del Fotomatón (plan 012): todo lo que no es capturar vive aquí y el panel hace scroll solo.
// Es solo presentación: el estado vive en App.tsx, así la pantalla se puede pasar al marco v2 sin tocar la lógica.

export type Fuente = { c: HTMLCanvasElement; cara: Cara | null };

export interface PanelProps {
  visual: Visual; elegirVisual: (v: Visual) => void;
  marcoId: string; setMarcoId: (id: string) => void; miniaturas: Record<string, string>;
  celda: number; setCelda: (n: number) => void;
  tinta: string; setTinta: (k: string) => void;
  apagadas: string[]; alternarPlaca: (canal: string) => void;
  foto: FotoEditable | null; vivo?: MutableRefObject<Fuente | null>;
  // solo en la cámara
  camara?: { lado: Lado; setLado: (l: Lado) => void; alSubir: () => void };
}

export function Panel(p: PanelProps) {
  const fx = EFECTOS[p.visual];
  return (
    <div className="panel-foto">
      {p.camara && (
        <Seccion titulo="Foto">
          <Segmentado etiqueta="Cámara" valor={p.camara.lado} onCambiar={p.camara.setLado}
            opciones={[{ valor: 'user', texto: 'Frontal' }, { valor: 'environment', texto: 'Trasera' }]} />
          <BotonAccion icono="image" texto="Subir una foto" onClick={p.camara.alSubir} />
        </Seccion>
      )}
      <Seccion titulo="Lenguaje">
        <Segmentado etiqueta="Lenguaje" valor={p.visual} onCambiar={p.elegirVisual} opciones={VISUALES.map(v => ({ valor: v, texto: v }))} />
      </Seccion>
      <Seccion titulo="Marco">
        <div className="marcos-grilla" role="radiogroup" aria-label="Marco">
          {MARCOS.filter(m => m.visual === p.visual).map(m => (
            <button key={m.id} type="button" role="radio" aria-checked={m.id === p.marcoId} className="marco-op" onClick={() => p.setMarcoId(m.id)}>
              <img src={p.miniaturas[m.id]} alt="" />
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      </Seccion>
      <Seccion titulo={`Efecto · ${fx.nombre}`}>
        <Deslizador id="celda" etiqueta={`Tamaño de ${fx.control.toLowerCase()}`} min={1} max={4} paso={0.25} valor={p.celda} onCambiar={p.setCelda} extremos={['Fino', 'Grueso']} />
        <p className="k-ayuda">{fx.ayuda}</p>
      </Seccion>
      <Seccion titulo={fx.paleta}>
        <div className="tintas" role="radiogroup" aria-label={fx.paleta}>
          {Object.entries(TINTAS).map(([k, t]) => (
            <button key={k} type="button" role="radio" aria-checked={k === p.tinta} className="tinta-op" onClick={() => p.setTinta(k)}>
              <span className="muestra" style={{ background: t.papel }}>{coloresTinta(t).map((c, i) => <i key={i} style={{ background: c }}></i>)}</span>
              <span className="nombre">{t.label}</span>
            </button>
          ))}
        </div>
      </Seccion>
      {tienePlacas(p.visual) && <Placas {...p} />}
    </div>
  );
}

// Ojo de canal (como en Photoshop). Dibujado aquí: el subconjunto de íconos no trae «visibility».
const Ojo = ({ abierto }: { abierto: boolean }) => (
  <svg className="ojo" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 12c2.6-4.6 6-7 10-7s7.4 2.4 10 7c-2.6 4.6-6 7-10 7s-7.4-2.4-10-7Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    {abierto ? <circle cx="12" cy="12" r="3.4" fill="currentColor" /> : <path d="M4 20 20 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />}
  </svg>
);

function Placas({ foto, vivo, celda, tinta, apagadas, alternarPlaca }: PanelProps) {
  const placas = placasDe(TINTAS[tinta]);
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    const pintar = () => {
      const f: Fuente | null = foto ?? vivo?.current ?? { c: demoDe('Orgánica'), cara: null };
      placas.forEach((pl, i) => {
        const c = refs.current[i]; if (!c) return;
        c.width = c.height = 120;
        dibujarPlaca(c.getContext('2d')!, 120, f.c, celda, TINTAS[tinta], f.cara, pl.canal);
      });
    };
    pintar();
    // En la cámara las placas siguen la vista en vivo (poco a poco: es una vista de referencia).
    if (foto || !vivo) return;
    const iv = window.setInterval(pintar, 700);
    return () => window.clearInterval(iv);
  }, [foto, vivo, celda, tinta]);
  return (
    <Seccion titulo="Placas de impresión">
      <div className="placas" data-n={placas.length}>
        {placas.map((pl, i) => {
          const prendida = !apagadas.includes(pl.canal);
          return (
            <button key={pl.canal} type="button" className="placa" aria-pressed={prendida} style={{ '--c': pl.color } as CSSProperties}
              aria-label={`Placa ${pl.nombre}: ${prendida ? 'prendida' : 'apagada'}`} onClick={() => alternarPlaca(pl.canal)}>
              <canvas ref={el => { refs.current[i] = el; }} />
              <span className="placa-pie"><Ojo abierto={prendida} />{pl.nombre}</span>
            </button>
          );
        })}
      </div>
      <p className="k-ayuda">Cada tinta se imprime por separado. Toca una placa para apagarla o prenderla.</p>
    </Seccion>
  );
}
