import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { subirCreacion } from '../llevatela';
import { BotonAccion } from './Kit';

// «Llévatela» (plan docs/plans/011-llevatela-qr.md): ventana encima de la herramienta, igual en todas las experiencias.
// Vista previa y aviso → «Generar QR» (recién ahí sale de la tablet) → QR grande → «Terminar». Con o sin credencial.
// Para importarlo, la app suma 'qrcode' a `resolve.dedupe` (vite.config.ts) y a `paths` (tsconfig.json), como React.

interface Props {
  blob: Blob;
  app: string;            // carpeta de la experiencia (va en la ruta y en el enlace)
  titulo: string;         // «Tu muro está listo»
  conCredencial?: boolean; // si hay una persona jugando con su código (el texto lo menciona)
  alSubida?: () => void;   // después de aceptar el aviso (ej. mandar al inventario)
  alCerrar: () => void;    // volver a la herramienta
  alTerminar?: () => void; // después del QR (por defecto, alCerrar)
}

type Fase = { f: 'aviso' } | { f: 'subiendo' } | { f: 'listo'; qr: string; enServidor: boolean } | { f: 'error' };

export const Llevatela: React.FC<Props> = ({ blob, app, titulo, conCredencial, alSubida, alCerrar, alTerminar }) => {
  const [fase, setFase] = useState<Fase>({ f: 'aviso' });
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  const video = blob.type.startsWith('video/');
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape' && fase.f !== 'subiendo') alCerrar(); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [alCerrar, fase.f]);

  const subir = async () => {
    setFase({ f: 'subiendo' });
    try {
      const s = await subirCreacion(blob, app);
      alSubida?.();
      const qr = await QRCode.toDataURL(s.enlace, { width: 640, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#141414', light: '#FFFFFF' } });
      setFase({ f: 'listo', qr, enServidor: s.enServidor });
    } catch (e) { console.warn(e); setFase({ f: 'error' }); }
  };

  return (
    <div className="k-quiosco" role="dialog" aria-modal="true" aria-labelledby="llevatela-t">
      <div className="k-panel k-llevatela">
        {fase.f === 'listo' ? (<>
          <h2 id="llevatela-t">Escanea y te la llevas</h2>
          <div className="k-llevatela-qr"><img src={fase.qr} alt="Código QR para descargar tu creación en el celular" /></div>
          <p className="k-ayuda">Apunta la cámara del celular al código. Queda disponible 24 horas y después se borra.</p>
          {!fase.enServidor && <p className="k-ayuda">Sin conexión al servidor: este QR solo abre en esta tablet.</p>}
          <div className="k-llevatela-acciones"><BotonAccion icono="check" texto="Terminar" primario onClick={alTerminar ?? alCerrar} /></div>
        </>) : (<>
          <h2 id="llevatela-t">{fase.f === 'error' ? 'No pudimos prepararla' : fase.f === 'subiendo' ? 'Preparando tu QR…' : titulo}</h2>
          {video
            ? <video className="k-llevatela-previa" src={url} autoPlay loop muted playsInline />
            : <img className="k-llevatela-previa" src={url} alt={titulo} />}
          <p className="k-ayuda">
            {fase.f === 'error'
              ? 'Revisa la conexión e inténtalo de nuevo. Tu creación sigue solo en esta tablet.'
              : conCredencial
                ? 'Llévatela al celular con un QR. Queda disponible 24 horas y después se borra. También llega al inventario de tu credencial.'
                : 'Llévatela al celular con un QR. Queda disponible 24 horas y después se borra.'}
          </p>
          <div className="k-llevatela-acciones">
            <BotonAccion icono={fase.f === 'error' ? 'restart_alt' : 'ios_share'} texto={fase.f === 'error' ? 'Reintentar' : 'Generar QR'} primario onClick={subir} disabled={fase.f === 'subiendo'} />
            <BotonAccion icono="arrow_back" texto="Seguir creando" onClick={alCerrar} disabled={fase.f === 'subiendo'} />
          </div>
        </>)}
      </div>
    </div>
  );
};
