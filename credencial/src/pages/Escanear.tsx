import React, { useEffect, useRef, useState } from 'react';
import { sellar, miCredencial } from '../lib/store';
import { SELLOS } from '../pixel/render';
import { ESTACIONES } from '../../../shared/juego';
import type { Ir } from '../App';

// Lector de QR con la API nativa BarcodeDetector (Chrome/Android). Si el navegador no la tiene,
// se explica cómo usar la cámara del teléfono: el QR del sello es un enlace y abre esta misma app.
// Siempre queda el código corto impreso bajo cada QR (sirve en iPhone y dentro de claude.ai).
interface Detector { detect: (fuente: CanvasImageSource) => Promise<{ rawValue: string }[]> }
declare global { interface Window { BarcodeDetector?: new (opciones: { formats: string[] }) => Detector } }

export const Escanear: React.FC<{ ir: Ir }> = ({ ir }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [estado, setEstado] = useState<'iniciando' | 'buscando' | 'sin-soporte' | 'sin-camara'>('iniciando');
  const [sello, setSello] = useState(2);
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const sellarConCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    const mia = miCredencial();
    if (!mia) { ir('#/crear'); return; }
    const limpio = codigo.trim().toUpperCase();
    if (limpio.length !== 4) { setAviso('El código tiene 4 letras o números.'); return; }
    setEnviando(true); setAviso('');
    try {
      await sellar(mia, sello, limpio);
      ir(`#/c/${mia}`, { timbre: sello });
    } catch (err) {
      setAviso((err as Error).message);
      setEnviando(false);
    }
  };

  useEffect(() => {
    if (!window.BarcodeDetector) { setEstado('sin-soporte'); return; }
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    let flujo: MediaStream | null = null, vivo = true, temporizador = 0;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(s => {
        flujo = s;
        if (!vivo || !video.current) return;
        video.current.srcObject = s;
        setEstado('buscando');
        const mirar = async () => {
          if (!vivo || !video.current) return;
          try {
            const [r] = await detector.detect(video.current);
            const i = r?.rawValue.indexOf('#/sello/') ?? -1;
            if (r && i >= 0) { ir(r.rawValue.slice(i)); return; }
          } catch { /* cuadro sin datos */ }
          temporizador = window.setTimeout(mirar, 250);
        };
        mirar();
      })
      .catch(() => setEstado('sin-camara'));
    return () => { vivo = false; clearTimeout(temporizador); flujo?.getTracks().forEach(t => t.stop()); };
  }, [ir]);

  return (
    <main className="pantalla escanear">
      <div className="visor">
        {(estado === 'iniciando' || estado === 'buscando') ? (
          <>
            <video ref={video} playsInline muted autoPlay />
            <span className="mira" aria-hidden="true" />
          </>
        ) : (
          <span className="material-symbols-outlined visor-icono" aria-hidden="true">highlight_alt</span>
        )}
      </div>
      <p className="progreso" role="status">
        {estado === 'buscando' ? 'Apunta al QR del timbre' :
         estado === 'iniciando' ? 'Abriendo la cámara…' :
         estado === 'sin-camara' ? 'No pudimos abrir la cámara. Revisa el permiso del navegador.' :
         'Apunta la cámara de tu teléfono al QR del timbre, o elige la estación y escribe el código que está bajo el QR.'}
      </p>
      <form className="codigo-sello" onSubmit={sellarConCodigo}>
        <div className="seg-movil cuatro" role="radiogroup" aria-label="Número de estación">
          {Array.from({ length: SELLOS }, (_, i) => i + 1).map(n => (
            <button key={n} type="button" role="radio" aria-checked={sello === n} disabled={!ESTACIONES[n - 1].activa} aria-label={`Estación ${n}: ${ESTACIONES[n - 1].nombre}`} onClick={() => setSello(n)}>{n}</button>
          ))}
        </div>
        <p className="estacion-elegida"><b>{ESTACIONES[sello - 1].nombre}</b> · {ESTACIONES[sello - 1].como}</p>
        <div className="pie-movil">
          <input id="codigo-sello" value={codigo} onChange={e => setCodigo(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 4))}
            autoComplete="off" autoCapitalize="characters" placeholder="Código" aria-label="Código del timbre" />
          <button className="btn primario" disabled={enviando}>{enviando ? 'Timbrando…' : 'Timbrar'}</button>
        </div>
        {aviso && <p className="aviso-movil" role="alert">{aviso}</p>}
      </form>
      <div className="acciones-movil">
        <button type="button" className="btn" onClick={() => ir('#/')}>Volver a mi credencial</button>
      </div>
    </main>
  );
};
