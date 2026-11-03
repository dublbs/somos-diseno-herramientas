import React, { useEffect, useState } from 'react';
import { MarcoVivo } from '../components/Pixel';
import { obtener, miCredencial, fotoDe, guardarFoto, avatarHub, guardarAvatarHub, type AvatarHub } from '../lib/store';
import { cargarImagen } from '../lib/foto';
import { Camara } from '../components/Camara';
import type { DatosCarta } from '../pixel/render';
import type { Ir, PonerTema } from '../App';

// Fotomatón sin efectos: cambiar la selfie que va dentro del marco de tu credencial.
// La cámara frontal se abre dentro de la app (components/Camara.tsx); si no se puede, queda la galería.
// Miniatura de la cara para el avatar del HUB: recorte cuadrado del centro alto de la selfie, 96 px.
function cara(im: HTMLImageElement): string {
  const w = im.naturalWidth, h = im.naturalHeight, lado = Math.min(w, h) * 0.7;
  const c = document.createElement('canvas'); c.width = c.height = 96;
  c.getContext('2d')!.drawImage(im, (w - lado) / 2, Math.max(0, h * 0.42 - lado / 2), lado, lado, 0, 0, 96, 96);
  return c.toDataURL('image/jpeg', 0.8);
}

export const Foto: React.FC<{ ir: Ir; ponerTema: PonerTema }> = ({ ir, ponerTema }) => {
  const codigo = miCredencial();
  const [datos, setDatos] = useState<DatosCarta | null>(null);
  const [nueva, setNueva] = useState<string | null>(null);
  const [imagen, setImagen] = useState<HTMLImageElement | null>(null);
  const [aviso, setAviso] = useState('');
  const [camara, setCamara] = useState(false);
  const [avatar, setAvatar] = useState<AvatarHub>(() => (codigo ? avatarHub(codigo) : 'personaje'));

  useEffect(() => {
    if (!codigo) return;
    obtener(codigo).then(d => { setDatos(d); ponerTema(d.marco); }).catch(e => setAviso((e as Error).message));
  }, [codigo, ponerTema]);
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

  const alTomar = (url: string) => { setAviso(''); setNueva(url); setCamara(false); };
  const listo = () => {
    if (nueva) guardarFoto(codigo, nueva);
    guardarAvatarHub(codigo, imagen ? avatar : 'personaje', datos ?? undefined, imagen && avatar === 'foto' ? cara(imagen) : undefined);
    ir(`#/c/${codigo}`, { aviso: nueva ? 'Foto lista en tu credencial.' : undefined });
  };

  return (
    <main className="pantalla foto">
      <section className="vista-foto" aria-label="Tu foto en el marco">
        {datos && <MarcoVivo marco={datos.marco} retrato={imagen} modo="foto" className="marco-vivo" />}
      </section>
      <p className="progreso" role="status">
        {aviso || (imagen ? 'Así queda en tu credencial.' : 'Fotomatón: sácate una selfie y queda dentro de tu marco.')}
      </p>
      {imagen && (
        <label className="consentimiento">
          <input type="checkbox" checked={avatar === 'foto'} onChange={e => setAvatar(e.target.checked ? 'foto' : 'personaje')} />
          <span>Quiero aparecer en la pantalla del HUB con mi foto. Si no, aparece mi personaje. Puedes cambiarlo cuando quieras.</span>
        </label>
      )}
      <div className="acciones-movil">
        <button type="button" className={'btn' + (imagen ? '' : ' primario')} onClick={() => setCamara(true)}>
          <span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>{imagen ? 'Otra foto' : 'Sacar foto'}
        </button>
        <button type="button" className={'btn' + (imagen ? ' primario' : '')} onClick={listo}>
          <span className="material-symbols-outlined" aria-hidden="true">check</span>{nueva ? 'Usar foto' : 'Volver'}
        </button>
      </div>
      {camara && <Camara onFoto={alTomar} onCerrar={() => setCamara(false)} />}
    </main>
  );
};
