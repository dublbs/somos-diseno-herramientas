import React, { useEffect, useRef, useState } from 'react';
import { leerFoto } from '../lib/foto';

// Selfie con la cámara frontal abierta dentro de la app (getUserMedia). Si el teléfono o el navegador no la dan
// (permiso negado, claude.ai, escritorio sin cámara), queda el selector de archivos como respaldo.
const MAX = 720;

export const Camara: React.FC<{ onFoto: (dataUrl: string) => void; onCerrar: () => void }> = ({ onFoto, onCerrar }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [estado, setEstado] = useState<'abriendo' | 'lista' | 'sin-camara'>('abriendo');
  const [aviso, setAviso] = useState('');
  const [flash, setFlash] = useState(false);
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
    const url = c.toDataURL('image/jpeg', 0.85);
    // Destello corto, como en una app de cámara (sin destello con «reducir movimiento»).
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { onFoto(url); return; }
    setFlash(true);
    try { navigator.vibrate?.(15); } catch { /* sin vibración */ }
    setTimeout(() => onFoto(url), 180);
  };
  const alElegirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    try { onFoto(await leerFoto(archivo)); } catch (err) { setAviso((err as Error).message); }
  };

  return (
    <div className="camara" role="dialog" aria-modal="true" aria-label="Cámara para tu selfie">
      <div className={'camara-visor' + (estado === 'lista' ? ' lista' : '')}>
        {estado !== 'sin-camara'
          ? <video ref={video} playsInline muted autoPlay />
          : <p className="camara-msj">No pudimos abrir la cámara. Revisa el permiso del navegador o elige una foto de tu galería.</p>}
        {estado === 'abriendo' && <p className="camara-msj camara-abriendo" role="status">Abriendo la cámara…</p>}
        {estado === 'lista' && (
          <>
            {/* Máscara suave alrededor del círculo y el aro con el color del lenguaje */}
            <span className="camara-velo" aria-hidden="true" />
            <span className="camara-guia" aria-hidden="true" />
            <p className="camara-pista">Tu cara dentro del círculo</p>
          </>
        )}
        {flash && <span className="camara-flash" aria-hidden="true" />}
      </div>
      {aviso && <p className="aviso-movil" role="alert">{aviso}</p>}
      <div className="camara-acciones">
        <button type="button" className="camara-lado" onClick={onCerrar}>
          <span className="material-symbols-outlined" aria-hidden="true">close</span>Cancelar
        </button>
        {estado === 'lista'
          ? <button type="button" className="disparador" onClick={disparar} disabled={flash} aria-label="Sacar foto"><span className="disparador-centro" aria-hidden="true" /></button>
          : <span className="disparador-hueco" aria-hidden="true" />}
        <label className="camara-lado">
          <input type="file" accept="image/*" hidden onChange={alElegirArchivo} aria-label="Elegir una foto de la galería" />
          <span className="material-symbols-outlined" aria-hidden="true">image</span>Galería
        </label>
      </div>
    </div>
  );
};
