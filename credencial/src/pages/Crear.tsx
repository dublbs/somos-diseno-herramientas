import React, { useEffect, useState } from 'react';
import { porId, VISUALES } from '../../../shared/marcos';
import { MarcoVivo } from '../components/Pixel';
import { useImagenes } from '../lib/imagenes';
import { leerFoto } from '../lib/foto';
import { crear, limpiarNombre, guardarMiCredencial, guardarFoto } from '../lib/store';
import { PERSONAJES, TEMAS, MARCO_INICIAL, type IdPersonaje } from '../temas';
import type { Retrato } from '../pixel/render';
import type { Ir, PonerTema } from '../App';

type Pestana = 'marco' | 'retrato';
const ID_VISUAL = { Pixel: 'pixel', Geométrica: 'geometrica', Orgánica: 'organica' } as const;

export const Crear: React.FC<{ ir: Ir; ponerTema: PonerTema }> = ({ ir, ponerTema }) => {
  const [marco, setMarco] = useState(MARCO_INICIAL);
  const [modo, setModo] = useState<Retrato['retrato']>('personaje');
  const [personaje, setPersonaje] = useState<IdPersonaje>(ID_VISUAL[porId(MARCO_INICIAL).visual]);
  const [elegido, setElegido] = useState(false); // si la persona ya eligió personaje, no lo cambiamos al cambiar de marco
  const [foto, setFoto] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>('marco');
  const [nombre, setNombre] = useState('');
  const [aviso, setAviso] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => { ponerTema(marco); }, [marco, ponerTema]);
  const srcPersonaje = PERSONAJES.find(p => p.id === personaje)!.src;
  const [imPersonaje, imFoto, ...miniaturas] = useImagenes([srcPersonaje, foto, ...PERSONAJES.map(p => p.src)]);
  const retrato = modo === 'foto' ? imFoto : imPersonaje;

  const elegirMarco = (id: string) => {
    setMarco(id);
    if (!elegido) setPersonaje(ID_VISUAL[porId(id).visual]);
  };
  const alElegirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setAviso('');
    try { setFoto(await leerFoto(archivo)); setModo('foto'); } catch (err) { setAviso((err as Error).message); }
  };

  const emitir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modo === 'foto' && !foto) { setPestana('retrato'); setAviso('Sácate la foto o elige un personaje.'); return; }
    if (!limpiarNombre(nombre)) { setAviso('Escribe tu nombre para la credencial.'); return; }
    setCreando(true);
    try {
      const receta: Retrato = modo === 'foto' ? { retrato: 'foto' } : { retrato: 'personaje', id: personaje };
      const codigo = await crear({ nombre, receta, marco });
      if (modo === 'foto' && foto) guardarFoto(codigo, foto);
      guardarMiCredencial(codigo);
      ir(`#/c/${codigo}`, { aviso: 'Credencial lista. Consigue los 4 timbres en la sede.' });
    } catch (err) {
      setAviso('No se pudo crear: ' + (err as Error).message);
      setCreando(false);
    }
  };

  const m = porId(marco);
  return (
    <main className="pantalla crear">
      <section className="vista-previa" aria-label="Tu credencial en su marco">
        <MarcoVivo marco={marco} retrato={retrato} modo={modo} className="marco-vivo" />
        <p className="vista-info"><span className="etq">{m.visual}</span> {m.code} · {m.name}</p>
      </section>

      <section className="panel-movil" aria-label="Arma tu credencial">
        <div className="pestanas-grilla dos" role="tablist" aria-label="Pasos">
          <button type="button" role="tab" id="tab-marco" aria-selected={pestana === 'marco'} aria-controls="pag-crear" onClick={() => setPestana('marco')}>1 · Marco</button>
          <button type="button" role="tab" id="tab-retrato" aria-selected={pestana === 'retrato'} aria-controls="pag-crear" onClick={() => setPestana('retrato')}>2 · Foto o personaje</button>
        </div>

        <div className="pagina-movil" role="tabpanel" id="pag-crear" aria-labelledby={`tab-${pestana}`}>
          {pestana === 'marco' && (
            <div className="marcos-mvp" role="radiogroup" aria-label="Marco">
              {VISUALES.map(v => (
                <div key={v} className="fila-marcos">
                  <span className="etq">{v}</span>
                  {TEMAS.filter(t => t.visual === v).map(t => {
                    const mm = porId(t.marco);
                    return (
                      <button key={t.marco} type="button" role="radio" aria-checked={marco === t.marco} aria-label={`${v} ${mm.name}`} title={mm.name}
                        className="marco-opcion" style={{ '--c': t.banda } as React.CSSProperties} onClick={() => elegirMarco(t.marco)}>
                        <MarcoVivo marco={t.marco} retrato={retrato} modo={modo} animado={false} className="marco-mini" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {pestana === 'retrato' && (
            <>
              <div className="seg-movil dos" role="radiogroup" aria-label="Qué va en el marco">
                <button type="button" role="radio" aria-checked={modo === 'personaje'} onClick={() => setModo('personaje')}>Personaje</button>
                <button type="button" role="radio" aria-checked={modo === 'foto'} onClick={() => setModo('foto')}>Foto</button>
              </div>
              {modo === 'personaje' ? (
                <div className="personajes" role="radiogroup" aria-label="Personaje">
                  {PERSONAJES.map((p, i) => (
                    <button key={p.id} type="button" role="radio" aria-checked={personaje === p.id} className="personaje-opcion"
                      onClick={() => { setPersonaje(p.id); setElegido(true); }}>
                      {miniaturas[i] ? <img src={miniaturas[i]!.src} alt="" /> : <span className="img-vacia" />}
                      <span className="nombre">{p.nombre}</span>
                      <span className="etq">{p.visual}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="foto-paso">
                  <p>Fotomatón sin efectos: tu selfie queda dentro del marco.</p>
                  <label className={'btn' + (foto ? '' : ' primario')}>
                    <input type="file" accept="image/*" capture="user" hidden onChange={alElegirFoto} aria-label="Sacar foto" />
                    <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>{foto ? 'Otra foto' : 'Sacar foto'}
                  </label>
                </div>
              )}
            </>
          )}
          {aviso && <p className="aviso-movil" role="alert">{aviso}</p>}
        </div>

        <form className="pie-movil" onSubmit={emitir}>
          <input id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} maxLength={20} autoComplete="off" placeholder="Tu nombre" aria-label="Nombre en la credencial" />
          <button className="btn primario" disabled={creando}>{creando ? 'Creando…' : 'Crear'}</button>
        </form>
      </section>
    </main>
  );
};
