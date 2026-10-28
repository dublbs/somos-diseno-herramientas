import React, { useEffect, useRef, useState } from 'react';
import type { Ir } from '../App';

// Lector de QR con la API nativa BarcodeDetector (Chrome/Android). Si el navegador no la tiene,
// se explica cómo usar la cámara del teléfono: el QR del sello es un enlace y abre esta misma app.
interface Detector { detect: (fuente: CanvasImageSource) => Promise<{ rawValue: string }[]> }
declare global { interface Window { BarcodeDetector?: new (opciones: { formats: string[] }) => Detector } }

export const Escanear: React.FC<{ ir: Ir }> = ({ ir }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [estado, setEstado] = useState<'iniciando' | 'buscando' | 'sin-soporte' | 'sin-camara'>('iniciando');

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
      {(estado === 'iniciando' || estado === 'buscando') && (
        <div className="visor">
          <video ref={video} playsInline muted autoPlay />
          <span className="mira" aria-hidden="true" />
        </div>
      )}
      <p className="progreso" role="status">
        {estado === 'buscando' ? 'Apunta al QR del sello' :
         estado === 'iniciando' ? 'Abriendo la cámara…' :
         estado === 'sin-camara' ? 'No pudimos abrir la cámara. Revisa el permiso del navegador.' :
         'Abre la cámara de tu teléfono y apunta al QR del sello: se abrirá tu credencial con el sello puesto.'}
      </p>
      <div className="acciones-movil">
        <button type="button" className="btn" onClick={() => ir('#/')}>Volver a mi credencial</button>
      </div>
    </main>
  );
};
