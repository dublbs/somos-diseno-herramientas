import { TINTAS, coloresTinta } from '../data/tintas';
import { EFECTOS } from '../lib/trama';
import type { Visual } from '../data/marcos';

interface Props { visual: Visual; celda: number; setCelda: (n: number) => void; tinta: string; setTinta: (k: string) => void }

export function Ajustes({ visual, celda, setCelda, tinta, setTinta }: Props) {
  const fx = EFECTOS[visual];
  return (
    <>
      <div>
        <p className="label">Efecto · {fx.nombre}</p>
        <input type="range" min="1" max="4" step="0.25" value={celda} onChange={e => setCelda(+e.target.value)} aria-label={`Tamaño: ${fx.control}`} />
        <div className="rango-pie"><span>Fino</span><span>Grueso</span></div>
        <p className="ayuda">{fx.ayuda}</p>
      </div>
      <div>
        <p className="label">{fx.paleta}</p>
        <div className="tintas" role="group" aria-label={fx.paleta}>
          {Object.entries(TINTAS).map(([k, t]) => (
            <button key={k} aria-pressed={k === tinta} onClick={() => setTinta(k)}>
              <span className="tinta">{coloresTinta(t).map((c, i) => <i key={i} style={{ background: c }}></i>)}</span>{t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
