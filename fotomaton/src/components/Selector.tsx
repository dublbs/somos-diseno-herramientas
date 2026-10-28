import { MARCOS, VISUALES, type Visual } from '../data/marcos';

interface Props {
  visual: Visual; elegirVisual: (v: Visual) => void;
  marcoId: string; setMarcoId: (id: string) => void;
  miniaturas: Record<string, string>;
}

export function Selector({ visual, elegirVisual, marcoId, setMarcoId, miniaturas }: Props) {
  const lista = MARCOS.filter(m => m.visual === visual);
  return (
    <div>
      <p className="label">Lenguaje</p>
      <div className="seg" role="group" aria-label="Lenguaje">
        {VISUALES.map(v => <button key={v} aria-pressed={v === visual} onClick={() => elegirVisual(v)}>{v}</button>)}
      </div>
      <p className="label" style={{ marginTop: 20 }}>Marco</p>
      <div className="thumbs">
        {lista.map(m => (
          <button key={m.id} className="thumb" aria-pressed={m.id === marcoId} onClick={() => setMarcoId(m.id)}>
            <img src={miniaturas[m.id]} alt="" /><span>{m.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
