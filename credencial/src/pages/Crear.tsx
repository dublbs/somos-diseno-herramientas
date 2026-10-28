import React, { useMemo, useState } from 'react';
import { MARCOS, VISUALES, porId, type Visual } from '../../../shared/marcos';
import { MarcoVivo, Miniatura } from '../components/Pixel';
import { PARTES, RANURAS, type IdRanura } from '../pixel/parts';
import { recetaAlAzar, coloresUsados, parte, tieneZona, cabeEnPaleta, type LlaveColor, type Receta } from '../pixel/generator';
import { HEX, COLORES_PIEL, COLORES_ELEGIBLES, MAX_COLORES } from '../pixel/palette';
import { crear, limpiarNombre, guardarMiCredencial } from '../lib/store';
import type { Ir } from '../App';

type Pestana = IdRanura | 'marco';

export const Crear: React.FC<{ ir: Ir }> = ({ ir }) => {
  const [receta, setReceta] = useState<Receta>(() => recetaAlAzar(Date.now()));
  const [marco, setMarco] = useState('PM05');
  const [visual, setVisual] = useState<Visual>(porId('PM05').visual);
  const [pestana, setPestana] = useState<Pestana>('cabeza');
  const [nombre, setNombre] = useState('');
  const [aviso, setAviso] = useState('');
  const [creando, setCreando] = useState(false);
  const usados = useMemo(() => coloresUsados(receta), [receta]);

  const elegirColor = (llave: LlaveColor, color: (typeof COLORES_ELEGIBLES)[number]) => {
    if (!cabeEnPaleta(receta, llave, color)) {
      setAviso(`Máximo ${MAX_COLORES} colores contando el Negro del contorno. Usa uno de los que ya tienes.`);
      return;
    }
    setAviso('');
    setReceta({ ...receta, colores: { ...receta.colores, [llave]: color } });
  };

  const emitir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limpiarNombre(nombre)) { setAviso('Escribe tu nombre para la credencial.'); return; }
    setCreando(true);
    try {
      const codigo = await crear({ nombre, receta, marco });
      guardarMiCredencial(codigo);
      ir(`#/c/${codigo}`, { aviso: 'Credencial lista. Busca los 4 sellos en la sede.' });
    } catch (err) {
      setAviso('No se pudo crear: ' + (err as Error).message);
      setCreando(false);
    }
  };

  const ranura = pestana === 'marco' ? null : RANURAS.find(r => r.id === pestana)!;
  const filasColor = ranura ? ranura.colores.filter(c => !c.soloSi || tieneZona(ranura.id, receta[ranura.id], c.soloSi)) : [];
  const PESTANAS: { id: Pestana; nombre: string }[] = [...RANURAS.map(r => ({ id: r.id, nombre: r.id === 'pelo' ? 'Pelo' : r.nombre })), { id: 'marco', nombre: 'Marco' }];

  return (
    <main className="pantalla crear">
      <section className="vista-previa" aria-label="Tu personaje en su marco">
        <MarcoVivo marco={marco} receta={receta} className="marco-vivo" />
        <div className="vista-info">
          <span>{porId(marco).visual} · {porId(marco).name}</span>
          <span>{usados.length}/{MAX_COLORES} colores</span>
          <button type="button" className="btn-mini" onClick={() => { setAviso(''); setReceta(recetaAlAzar(Date.now())); }}>
            <span className="material-symbols-outlined" aria-hidden="true">shuffle</span>Al azar
          </button>
        </div>
      </section>

      <section className="panel-movil" aria-label="Personaliza">
        <div className="pestanas-grilla" role="tablist" aria-label="Características">
          {PESTANAS.map(p => (
            <button key={p.id} type="button" role="tab" id={`tab-${p.id}`} aria-selected={pestana === p.id} aria-controls="pag-crear" onClick={() => { setPestana(p.id); setAviso(''); }}>
              {p.nombre}
            </button>
          ))}
        </div>

        <div className="pagina-movil" role="tabpanel" id="pag-crear" aria-labelledby={`tab-${pestana}`}>
          {ranura && (
            <>
              <div className="opciones" role="radiogroup" aria-label={`Forma de ${ranura.nombre.toLowerCase()}`}>
                {PARTES[ranura.id].map(p => (
                  <button key={p.id} type="button" role="radio" aria-checked={receta[ranura.id] === p.id} aria-label={p.nombre} title={p.nombre} className="opcion"
                    onClick={() => { setAviso(''); setReceta({ ...receta, [ranura.id]: p.id }); }}>
                    <Miniatura receta={{ ...receta, [ranura.id]: p.id }} recorte={ranura.recorte} tam={44} />
                  </button>
                ))}
              </div>
              <p className="nombre-parte">{parte(ranura.id, receta[ranura.id]).nombre}</p>
              {filasColor.map(fc => {
                const llave = fc.id as LlaveColor;
                const opciones = llave === 'cabeza' ? COLORES_PIEL : COLORES_ELEGIBLES;
                return (
                  <div key={fc.id} className="fila-color">
                    <span className="etq">{fc.nombre}</span>
                    <div className="chips" role="radiogroup" aria-label={`${fc.nombre} de ${ranura.nombre.toLowerCase()}`}>
                      {opciones.map(c => {
                        const cabe = cabeEnPaleta(receta, llave, c);
                        return (
                          <button key={c} type="button" role="radio" aria-checked={receta.colores[llave] === c}
                            aria-label={cabe ? c : `${c}, superaría ${MAX_COLORES} colores`}
                            className={'chip' + (cabe ? '' : ' fuera')} style={{ '--c': HEX[c] } as React.CSSProperties}
                            onClick={() => elegirColor(llave, c)} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {pestana === 'marco' && (
            <>
              <div className="seg-movil" role="radiogroup" aria-label="Lenguaje">
                {VISUALES.map(v => (
                  <button key={v} type="button" role="radio" aria-checked={visual === v} onClick={() => setVisual(v)}>{v}</button>
                ))}
              </div>
              <div className="marcos-grilla" role="radiogroup" aria-label="Marco">
                {MARCOS.filter(m => m.visual === visual).map(m => (
                  <button key={m.id} type="button" role="radio" aria-checked={marco === m.id} aria-label={`${m.visual} ${m.name}`} className="marco-opcion" onClick={() => setMarco(m.id)}>
                    <MarcoVivo marco={m.id} receta={receta} animado={false} className="marco-mini" />
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {aviso && <p className="aviso-movil" role="alert">{aviso}</p>}
        </div>

        <form className="pie-movil" onSubmit={emitir}>
          <input value={nombre} onChange={e => setNombre(e.target.value)} maxLength={20} autoComplete="off" placeholder="Tu nombre" aria-label="Nombre en la credencial" />
          <button className="btn primario" disabled={creando}>{creando ? 'Creando…' : 'Crear credencial'}</button>
        </form>
      </section>
    </main>
  );
};
