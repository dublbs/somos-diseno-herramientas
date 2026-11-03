import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useCamara } from '../hooks/useCamara';
import type { Cara } from '../lib/cara';
import { Lienzo } from './Lienzo';
import { BarraSuperior, BotonAccion, PantallaHerramienta } from '../../../shared/ui/Kit';

interface Props {
  marco: string; celda: number; tinta: string;
  alFoto: (foto: HTMLCanvasElement, cara: Cara | null) => void;
  alSubir: () => void;
  cambiando: boolean; textoCambio: string;
  volver: string; acciones: ReactNode; lateral: ReactNode; carrete: ReactNode;
}

export function Camara({ marco, celda, tinta, alFoto, alSubir, cambiando, textoCambio, volver, acciones, lateral, carrete }: Props) {
  const { video, lienzo, setLado, error, personas, capturar } = useCamara({ marco, celda, tinta });
  const [cuenta, setCuenta] = useState(0), [flash, setFlash] = useState(false);
  // Timers de la cuenta regresiva: se limpian si la persona sale (Inicio) antes de que termine.
  const intervalo = useRef<number | undefined>(undefined), espera = useRef<number | undefined>(undefined);
  useEffect(() => () => { window.clearInterval(intervalo.current); window.clearTimeout(espera.current); }, []);

  const disparar = () => {
    if (cuenta || error) return;
    let n = 3; setCuenta(n);
    intervalo.current = window.setInterval(() => {
      n--; if (n > 0) { setCuenta(n); return; }
      window.clearInterval(intervalo.current); setCuenta(0); setFlash(true);
      const { foto, cara } = capturar();
      espera.current = window.setTimeout(() => alFoto(foto, cara), 380);
    }, 750);
  };

  const estado = error ? 'Sin cámara: puedes subir una foto' : personas > 1 ? `Grupo de ${personas} personas ✓` : personas === 1 ? 'Cara centrada ✓' : 'Mira a la cámara, solo o en grupo';
  return (
    <PantallaHerramienta
      anchoLateral={300}
      superior={<BarraSuperior titulo="Fotomatón" bajada={`${estado} · Tu foto se procesa en este dispositivo`} volver={volver}>{acciones}</BarraSuperior>}
      lateral={lateral}
      inferior={<>
        {carrete}
        <div className="k-grupo disparo">
          <BotonAccion icono="ios_share" etiqueta="Subir una foto" onClick={alSubir} />
          <button type="button" className="obturador" onClick={disparar} disabled={!!error || !!cuenta || cambiando} aria-label="Sacar foto"></button>
          <BotonAccion icono="flip" etiqueta="Cambiar cámara" onClick={() => setLado(l => (l === 'user' ? 'environment' : 'user'))} />
        </div>
      </>}
    >
      <video ref={video} className="oculto" playsInline muted autoPlay></video>
      <div className="escenario-fit">
      <Lienzo cref={lienzo} className="lienzo-fit">
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
      </div>
    </PantallaHerramienta>
  );
}
