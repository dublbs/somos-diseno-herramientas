import React, { useEffect, useState } from 'react';
import { MarcoVivo } from '../components/Pixel';
import { obtener, miCredencial, fotoDe, guardarFoto } from '../lib/store';
import { leerFoto, cargarImagen } from '../lib/foto';
import type { DatosCarta } from '../pixel/render';
import type { Ir } from '../App';

// Fotomatón sin efectos: una selfie que queda dentro del marco de tu credencial (tercera cara).
// La cámara se abre con el selector nativo del teléfono (funciona también dentro de claude.ai).
export const Foto: React.FC<{ ir: Ir }> = ({ ir }) => {
  const codigo = miCredencial();
  const [datos, setDatos] = useState<DatosCarta | null>(null);
  const [nueva, setNueva] = useState<string | null>(null);
  const [imagen, setImagen] = useState<HTMLImageElement | null>(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    if (!codigo) return;
    obtener(codigo).then(setDatos).catch(e => setAviso((e as Error).message));
  }, [codigo]);
  const src = nueva || (codigo ? fotoDe(codigo) : null);
  useEffect(() => {
    if (!src) { setImagen(null); return; }
    let vivo = true;
    cargarImagen(src).then(im => vivo && setImagen(im)).catch(() => vivo && setImagen(null));
    return () => { vivo = false; };
  }, [src]);

  if (!codigo) {
    return (
      <main className="pantalla centrada">
        <h2>Primero crea tu credencial</h2>
        <p>La foto queda dentro del marco que elijas para tu personaje.</p>
        <button className="btn primario" onClick={() => ir('#/crear')}>Crear mi credencial</button>
      </main>
    );
  }

  const alElegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setAviso('');
    try { setNueva(await leerFoto(archivo)); } catch (err) { setAviso((err as Error).message); }
  };
  const listo = () => {
    if (nueva) guardarFoto(codigo, nueva);
    ir(`#/c/${codigo}`, { aviso: nueva ? 'Foto lista en tu credencial.' : undefined, cara: 'foto' });
  };

  return (
    <main className="pantalla foto">
      <section className="vista-foto" aria-label="Tu foto en el marco">
        {datos && <MarcoVivo marco={datos.marco} receta={datos.receta} foto={imagen} className="marco-vivo" />}
      </section>
      <p className="progreso" role="status">
        {aviso || (imagen ? 'Así queda en tu credencial.' : 'Fotomatón: sácate una selfie y queda dentro de tu marco.')}
      </p>
      <div className="acciones-movil">
        <label className={'btn' + (imagen ? '' : ' primario')}>
          <input type="file" accept="image/*" capture="user" hidden onChange={alElegir} aria-label="Sacar foto" />
          <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>{imagen ? 'Otra foto' : 'Sacar foto'}
        </label>
        <button type="button" className={'btn' + (imagen ? ' primario' : '')} onClick={listo}>
          <span className="material-symbols-outlined" aria-hidden="true">check</span>{nueva ? 'Usar foto' : 'Volver'}
        </button>
      </div>
    </main>
  );
};
