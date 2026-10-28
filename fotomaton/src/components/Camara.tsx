import { useState } from 'react';
import { useCamara } from '../hooks/useCamara';
import type { Cara } from '../lib/cara';
import { Lienzo } from './Lienzo';

interface Props {
  marco: string; celda: number; tinta: string;
  alFoto: (foto: HTMLCanvasElement, cara: Cara | null) => void;
  alSubir: () => void;
  cambiando: boolean; textoCambio: string;
}

export function Camara({ marco, celda, tinta, alFoto, alSubir, cambiando, textoCambio }: Props) {
  const { video, lienzo, setLado, error, personas, capturar } = useCamara({ marco, celda, tinta });
  const [cuenta, setCuenta] = useState(0), [flash, setFlash] = useState(false);

  const disparar = () => {
    if (cuenta || error) return;
    let n = 3; setCuenta(n);
    const iv = setInterval(() => {
      n--; if (n > 0) { setCuenta(n); return; }
      clearInterval(iv); setCuenta(0); setFlash(true);
      const { foto, cara } = capturar();
      setTimeout(() => alFoto(foto, cara), 380);
    }, 750);
  };

  return (
    <div>
      <video ref={video} className="oculto" playsInline muted autoPlay></video>
      <Lienzo cref={lienzo}>
        {cambiando ? <div className="carga"><span>{textoCambio}</span></div> : null}
        {cuenta ? <div className="cuenta">{cuenta}</div> : null}
        {flash ? <div className="flash"></div> : null}
        {error ? (
          <div className="error-cam">
            <p><strong>{error}</strong></p>
            <p>Puede que el navegador no tenga permiso. Igual puedes subir una foto desde tu galería.</p>
            <button className="btn primario" onClick={alSubir}>Subir una foto</button>
          </div>
        ) : null}
      </Lienzo>
      <div className="acciones">
        <button className="redondo" onClick={alSubir} aria-label="Subir una foto">↑</button>
        <button className="obturador" onClick={disparar} disabled={!!error || !!cuenta || cambiando} aria-label="Sacar foto"></button>
        <button className="redondo" onClick={() => setLado(l => (l === 'user' ? 'environment' : 'user'))} aria-label="Cambiar cámara">⟲</button>
      </div>
      <p className="nota">
        {error ? null : <span className="estado">{personas > 1 ? `Grupo de ${personas} personas ✓` : personas === 1 ? 'Cara centrada ✓' : 'Mira a la cámara, solo o en grupo'}</span>}
        Tu foto se procesa en este dispositivo y no se guarda en ningún servidor.
      </p>
    </div>
  );
}
