import { TINTAS, coloresTinta } from '../data/tintas';

interface Props { celda: number; setCelda: (n: number) => void; tinta: string; setTinta: (k: string) => void }

export function Ajustes({ celda, setCelda, tinta, setTinta }: Props) {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <p className="label">Trama</p>
        <input type="range" min="1" max="4" step="0.25" value={celda} onChange={e => setCelda(+e.target.value)} aria-label="Tamaño de la trama" />
        <div className="rango-pie"><span>Fina</span><span>Gruesa</span></div>
        <p className="ayuda">Con la trama fina se reconoce mejor la cara.</p>
      </div>
      <div>
        <p className="label">Tinta</p>
        <div className="tintas" role="group" aria-label="Tinta">
          {Object.entries(TINTAS).map(([k, t]) => (
            <button key={k} aria-pressed={k === tinta} onClick={() => setTinta(k)}>
              <span className="tinta">{coloresTinta(t).map((c, i) => <i key={i} style={{ background: c }}></i>)}</span>{t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
