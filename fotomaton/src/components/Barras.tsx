import { useEffect, useRef, type CSSProperties } from 'react';
import { MARCOS, VISUALES, type Visual } from '../data/marcos';
import { TINTAS, coloresTinta } from '../data/tintas';
import { EFECTOS, dibujarPlaca, placasDe } from '../lib/trama';
import type { FotoEditable } from './Editor';
import { Deslizador, Seccion, Segmentado } from '../../../shared/ui/Kit';

// Barras fijas del Fotomatón (propuesta 005): abajo el carrete de marcos y el disparo; a la derecha el efecto,
// la paleta y las placas de impresión de la foto.

interface CarreteProps {
  visual: Visual; elegirVisual: (v: Visual) => void;
  marcoId: string; setMarcoId: (id: string) => void;
  miniaturas: Record<string, string>;
}
export function Carrete({ visual, elegirVisual, marcoId, setMarcoId, miniaturas }: CarreteProps) {
  return (
    <div className="k-grupo carrete">
      <Segmentado etiqueta="Lenguaje" valor={visual} onCambiar={elegirVisual} opciones={VISUALES.map(v => ({ valor: v, texto: v }))} />
      <div className="k-grupo marcos" role="radiogroup" aria-label="Marco">
        {MARCOS.filter(m => m.visual === visual).map(m => (
          <button key={m.id} type="button" role="radio" aria-checked={m.id === marcoId} aria-label={m.name} title={m.name} className="k-color miniatura" onClick={() => setMarcoId(m.id)}>
            <img src={miniaturas[m.id]} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Placa({ foto, celda, tinta, canal, nombre, color }: { foto: FotoEditable | null; celda: number; tinta: string; canal: string; nombre: string; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const lado = c.width = c.height = 120, x = c.getContext('2d')!;
    if (!foto) { x.fillStyle = TINTAS[tinta].papel; x.fillRect(0, 0, lado, lado); return; }
    dibujarPlaca(x, lado, foto.c, celda, TINTAS[tinta], foto.cara, canal);
  }, [foto, celda, tinta, canal]);
  return (
    <figure className="placa" style={{ '--c': color } as CSSProperties}>
      <canvas ref={ref} role="img" aria-label={`Placa ${nombre}`} />
      <figcaption>{nombre}</figcaption>
    </figure>
  );
}

interface LateralProps { visual: Visual; celda: number; setCelda: (n: number) => void; tinta: string; setTinta: (k: string) => void; foto: FotoEditable | null }
export function Lateral({ visual, celda, setCelda, tinta, setTinta, foto }: LateralProps) {
  const fx = EFECTOS[visual], placas = placasDe(TINTAS[tinta]);
  return (<>
    <Seccion titulo={`Efecto · ${fx.nombre}`}>
      <Deslizador id="celda" etiqueta={`Tamaño: ${fx.control}`} min={1} max={4} paso={0.25} valor={celda} onCambiar={setCelda} extremos={['Fino', 'Grueso']} />
      <p className="k-ayuda">{fx.ayuda}</p>
    </Seccion>
    <Seccion titulo={fx.paleta}>
      <div className="tintas" role="radiogroup" aria-label={fx.paleta}>
        {Object.entries(TINTAS).map(([k, t]) => (
          <button key={k} type="button" role="radio" aria-checked={k === tinta} className="k-btn" onClick={() => setTinta(k)}>
            <span className="tinta">{coloresTinta(t).map((c, i) => <i key={i} style={{ background: c }}></i>)}</span>{t.label}
          </button>
        ))}
      </div>
    </Seccion>
    <Seccion titulo="Placas de impresión" crece>
      <div className="placas" data-n={placas.length}>
        {placas.map(p => <Placa key={p.canal} foto={foto} celda={celda} tinta={tinta} {...p} />)}
      </div>
      <p className="k-ayuda">{foto ? 'Cada tinta se imprime por separado; juntas arman tu foto.' : 'Al sacar la foto verás aquí cada tinta por separado.'}</p>
    </Seccion>
  </>);
}
