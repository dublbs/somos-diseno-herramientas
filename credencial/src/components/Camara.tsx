import React, { useEffect, useRef, useState } from 'react';
import { leerFoto } from '../lib/foto';

// Selfie con la cámara frontal abierta dentro de la app (getUserMedia). Si el teléfono o el navegador no la dan
// (permiso negado, claude.ai, escritorio sin cámara), queda el selector de archivos como respaldo.
const MAX = 720;

export const Camara: React.FC<{ onFoto: (dataUrl: string) => void; onCerrar: () => void }> = ({ onFoto, onCerrar }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [estado, setEstado] = useState<'abriendo' | 'lista' | 'sin-camara'>('abriendo');
  const [aviso, setAviso] = useState('');
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    let flujo: MediaStream | null = null, vivo = true;
    if (!navigator.mediaDevices?.getUserMedia) { setEstado('sin-camara'); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      .then(s => {
        flujo = s;
        if (!vivo || !video.current) { s.getTracks().forEach(t => t.stop()); return; }
        video.current.srcObject = s;
        video.current.play().catch(() => null);
        setEstado('lista');
      })
      .catch(() => vivo && setEstado('sin-camara'));
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar.current(); };
    window.addEventListener('keydown', alTeclear);
    return () => { vivo = false; flujo?.getTracks().forEach(t => t.stop()); window.removeEventListener('keydown', alTeclear); };
  }, []);

  const disparar = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const k = Math.min(1, MAX / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
    const ctx = c.getContext('2d')!;
    ctx.translate(c.width, 0); ctx.scale(-1, 1); // espejo, como se ve en pantalla
    ctx.drawImage(v, 0, 0, c.width, c.height);
    onFoto(c.toDataURL('image/jpeg', 0.85));
  };
  const alElegirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    try { onFoto(await leerFoto(archivo)); } catch (err) { setAviso((err as Error).message); }
  };

  return (
    <div className="camara" role="dialog" aria-modal="true" aria-label="Cámara para tu selfie">
      <div className="camara-visor">
        {estado !== 'sin-camara'
          ? <video ref={video} playsInline muted autoPlay />
          : <p className="camara-msj">No pudimos abrir la cámara. Revisa el permiso del navegador o elige una foto de tu galería.</p>}
        {estado === 'lista' && <span className="camara-guia" aria-hidden="true" />}
      </div>
      {aviso && <p className="aviso-movil" role="alert">{aviso}</p>}
      <div className="camara-acciones">
        <button type="button" className="btn" onClick={onCerrar}><span className="material-symbols-outlined" aria-hidden="true">close</span>Cancelar</button>
        {estado === 'lista'
          ? <button type="button" className="btn primario disparador" onClick={disparar} aria-label="Sacar foto"><span className="material-symbols-outlined" aria-hidden="true">photo_camera</span>Sacar</button>
          : null}
        <label className="btn">
          <input type="file" accept="image/*" hidden onChange={alElegirArchivo} aria-label="Elegir una foto de la galería" />
          <span className="material-symbols-outlined" aria-hidden="true">image</span>Galería
        </label>
      </div>
    </div>
  );
};
