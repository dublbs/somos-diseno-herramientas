import React, { useState } from 'react';
import { sellar, miCredencial, encontrarAfiche, AFICHE_SELLO } from '../lib/store';
import { interpretar, useLectorQR } from '../lib/lector';
import { SELLOS } from '../pixel/render';
import { ESTACIONES } from '../../../shared/juego';
import type { Ir } from '../App';

// Timbrar: lee el QR de un sello o de un afiche con la cámara (BarcodeDetector o jsQR, ver lib/lector.ts),
// o se escribe el código que está bajo el QR. En la estación 3 (Portales) el código es el del afiche.
export const Escanear: React.FC<{ ir: Ir }> = ({ ir }) => {
  const [sello, setSello] = useState(2);
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const esAfiche = sello === AFICHE_SELLO;

  const { video, estado } = useLectorQR(texto => {
    const l = interpretar(texto);
    if (l.tipo === 'sello') ir(l.ruta);
    else if (l.tipo === 'afiche') ir(`#/afiche/${l.secreto}`);
    else setAviso('Ese QR no es de un timbre ni de un afiche.');
  });

  const sellarConCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    const mia = miCredencial();
    if (!mia) { ir('#/crear'); return; }
    const limpio = codigo.trim().toUpperCase();
    if (esAfiche ? limpio.length < 4 : limpio.length !== 4) { setAviso(esAfiche ? 'Escribe el código que está bajo el QR del afiche.' : 'El código tiene 4 letras o números.'); return; }
    setEnviando(true); setAviso('');
    try {
      if (esAfiche) {
        const r = await encontrarAfiche(mia, limpio);
        if (r.nuevo) ir(`#/c/${mia}`, { timbre: AFICHE_SELLO });
        else ir('#/juego', { aviso: r.repetido ? 'Ya tenías ese afiche.' : `¡Afiche encontrado! ${r.pasos} de ${r.meta}` });
        return;
      }
      const r = await sellar(mia, sello, limpio);
      if (r.nuevo) ir(`#/c/${mia}`, { timbre: sello });
      else if (!r.otorgado) ir(`#/c/${mia}`, { aviso: `${r.pasos} de ${r.meta} para el timbre ${sello}.` });
      else ir(`#/c/${mia}`, { aviso: 'Ese timbre ya está en tu credencial.' });
    } catch (err) {
      setAviso((err as Error).message);
      setEnviando(false);
    }
  };

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
         'No pudimos cargar el lector. Elige la estación y escribe el código que está bajo el QR.'}
      </p>
      <form className="codigo-sello" onSubmit={sellarConCodigo}>
        <div className="seg-movil cuatro" role="radiogroup" aria-label="Número de estación">
          {Array.from({ length: SELLOS }, (_, i) => i + 1).map(n => (
            <button key={n} type="button" role="radio" aria-checked={sello === n} disabled={!ESTACIONES[n - 1].activa} aria-label={`Estación ${n}: ${ESTACIONES[n - 1].nombre}`} onClick={() => setSello(n)}>{n}</button>
          ))}
        </div>
        <p className="estacion-elegida"><b>{ESTACIONES[sello - 1].nombre}</b> · {ESTACIONES[sello - 1].como}</p>
        <div className="pie-movil">
          <input id="codigo-sello" value={codigo} onChange={e => setCodigo(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, esAfiche ? 6 : 4))}
            autoComplete="off" autoCapitalize="characters" placeholder={esAfiche ? 'Código del afiche' : 'Código'} aria-label={esAfiche ? 'Código del afiche' : 'Código del timbre'} />
          <button className="btn primario" disabled={enviando}>{enviando ? 'Timbrando…' : 'Timbrar'}</button>
        </div>
        {aviso && <p className="aviso-movil" role="alert">{aviso}</p>}
      </form>
      <div className="acciones-movil">
        <button type="button" className="btn" onClick={() => ir('#/juego')}>Volver al juego</button>
      </div>
    </main>
  );
};
