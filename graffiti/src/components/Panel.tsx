import React, { useEffect, useRef, useState } from 'react';
import { BOQUILLAS, MUROS, PALETA, STICKERS } from '../data/config';

export type Herramienta = 'spray' | 'borrador' | 'sticker';
type Pestana = 'pintar' | 'muro' | 'stickers';

interface Props {
  herramienta: Herramienta; setHerramienta: (h: Herramienta) => void;
  color: number; setColor: (c: number) => void;
  boquilla: number; setBoquilla: (r: number) => void;
  muro: string; setMuro: (id: string) => void;
  sticker: string; setSticker: (id: string) => void;
  puedeDeshacer: boolean; vacio: boolean;
  onDeshacer: () => void; onVaciar: () => void; onExportar: () => void;
}

const PESTANAS: { id: Pestana; label: string; icon: string }[] = [
  { id: 'pintar', label: 'Pintar', icon: 'format_paint' },
  { id: 'muro', label: 'Muro', icon: 'wallpaper' },
  { id: 'stickers', label: 'Stickers', icon: 'add_reaction' },
];

export const Panel: React.FC<Props> = p => {
  const [pestana, setPestana] = useState<Pestana>('pintar');
  const [confirmar, setConfirmar] = useState(false);
  const temporizador = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  const vaciar = () => {
    window.clearTimeout(temporizador.current);
    if (confirmar) { setConfirmar(false); p.onVaciar(); return; }
    setConfirmar(true);
    temporizador.current = window.setTimeout(() => setConfirmar(false), 3000);
  };

  return (
    <aside className="panel-app" aria-label="Herramientas">
      <div className="pestanas" role="tablist" aria-label="Secciones">
        {PESTANAS.map(t => (
          <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={pestana === t.id} aria-controls={`pag-${t.id}`} onClick={() => setPestana(t.id)}>
            <span className="material-symbols-outlined" aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {pestana === 'pintar' && (
        <div className="panel-pagina" role="tabpanel" id="pag-pintar" aria-labelledby="tab-pintar">
          <div className="seg herramienta" role="group" aria-label="Herramienta">
            <button type="button" aria-pressed={p.herramienta !== 'borrador'} onClick={() => p.setHerramienta('spray')}>
              <span className="material-symbols-outlined" aria-hidden="true">format_paint</span> Spray
            </button>
            <button type="button" aria-pressed={p.herramienta === 'borrador'} onClick={() => p.setHerramienta('borrador')}>
              <span className="material-symbols-outlined" aria-hidden="true">ink_eraser</span> Borrador
            </button>
          </div>
          <p className="label">Color</p>
          <div className="colores" role="radiogroup" aria-label="Color">
            {PALETA.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={p.herramienta === 'spray' && p.color === i + 1}
                aria-label={c.nombre}
                title={c.nombre}
                className="color"
                style={{ '--c': c.hex } as React.CSSProperties}
                onClick={() => p.setColor(i + 1)}
              />
            ))}
          </div>
          <p className="label">Boquilla</p>
          <div className="seg boquillas" role="radiogroup" aria-label="Grosor">
            {BOQUILLAS.map(b => (
              <button key={b.radio} type="button" role="radio" aria-checked={p.boquilla === b.radio} aria-pressed={p.boquilla === b.radio} onClick={() => p.setBoquilla(b.radio)}>
                <span className="punto" style={{ width: 6 + b.radio * 5, height: 6 + b.radio * 5 }} aria-hidden="true" />
                {b.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {pestana === 'muro' && (
        <div className="panel-pagina" role="tabpanel" id="pag-muro" aria-labelledby="tab-muro">
          <p className="label">Elige la pared</p>
          <div className="grilla-imagenes muros" role="radiogroup" aria-label="Muro">
            {MUROS.map(m => (
              <button key={m.id} type="button" role="radio" aria-checked={p.muro === m.id} onClick={() => p.setMuro(m.id)}>
                <img src={m.src} alt="" />
                <span>{m.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pestana === 'stickers' && (
        <div className="panel-pagina" role="tabpanel" id="pag-stickers" aria-labelledby="tab-stickers">
          <p className="label">Elige uno y toca el muro para pegarlo</p>
          <div className="grilla-imagenes stickers" role="radiogroup" aria-label="Sticker">
            {STICKERS.map(s => (
              <button key={s.id} type="button" role="radio" aria-checked={p.herramienta === 'sticker' && p.sticker === s.id} aria-label={s.nombre} title={s.nombre} onClick={() => p.setSticker(s.id)}>
                <img src={s.src} alt="" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="panel-pie">
        <button type="button" className="btn primario" onClick={p.onExportar} disabled={p.vacio}>
          <span className="material-symbols-outlined" aria-hidden="true">download</span>
          Llévate tu muro
        </button>
        <div className="pie-fila">
          <button type="button" className="btn" onClick={p.onDeshacer} disabled={!p.puedeDeshacer}>
            <span className="material-symbols-outlined" aria-hidden="true">undo</span>
            Deshacer
          </button>
          <button type="button" className="btn" onClick={vaciar} disabled={p.vacio && !confirmar}>
            <span className="material-symbols-outlined" aria-hidden="true">delete</span>
            {confirmar ? '¿Seguro?' : 'Vaciar'}
          </button>
        </div>
      </div>
    </aside>
  );
};
