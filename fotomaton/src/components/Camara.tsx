import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { useCamara, type Lado } from '../hooks/useCamara';
import type { Cara } from '../lib/cara';
import { Lienzo } from './Lienzo';
import { Disparador } from './Disparador';
import { Boton, LienzoAjustado, MarcoHerramienta } from '../../../shared/ui/Herramienta';

interface Props {
  lado: Lado; marco: string; celda: number; tinta: string; apagadas: readonly string[];
  vivo: MutableRefObject<{ c: HTMLCanvasElement; cara: Cara | null } | null>;
  alFoto: (foto: HTMLCanvasElement, cara: Cara | null) => void;
  alSubir: () => void;
  cambiando: boolean; textoCambio: string;
  volver: string; acciones: ReactNode; panel: ReactNode; aviso?: ReactNode;
}

// Cámara sobre el kit v2 (plan 014): barra superior, la vista en vivo como lienzo, abajo solo el disparador y todo lo
// demás en el panel derecho (con su propio scroll).
export function Camara({ lado, marco, celda, tinta, apagadas, vivo, alFoto, alSubir, cambiando, textoCambio, volver, acciones, panel, aviso }: Props) {
  const { video, lienzo, error, personas, capturar } = useCamara({ lado, marco, celda, tinta, apagadas, vivo });
  const [cuenta, setCuenta] = useState(0), [flash, setFlash] = useState(false);
  // Timers de la cuenta regresiva: se limpian si la persona sale (Restablecer) antes de que termine.
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
    <MarcoHerramienta titulo="Fotomatón" volver={volver} ayuda="Tu foto se procesa en este dispositivo y no se guarda"
      acciones={acciones} anchoPanel={320} panel={panel} aviso={aviso}
      herramientas={<div className="pie-foto"><p className="estado-foto" role="status">{estado}</p>
        <Disparador texto="Foto" etiqueta="Sacar foto" onClick={disparar} disabled={!!error || !!cuenta || cambiando} /><span /></div>}>
      <video ref={video} className="oculto" playsInline muted autoPlay></video>
      <LienzoAjustado proporcion={1} className="foto-lienzo">
        <Lienzo cref={lienzo}>
          {cambiando ? <div className="carga"><span>{textoCambio}</span></div> : null}
          {cuenta ? <div className="cuenta">{cuenta}</div> : null}
          {flash ? <div className="flash"></div> : null}
          {error ? (
            <div className="error-cam">
              <p><strong>{error}</strong></p>
              <p>Puede que el navegador no tenga permiso. Igual puedes subir una foto desde tu galería.</p>
              <Boton icono="image" texto="Subir una foto" variante="primario" onClick={alSubir} />
            </div>
          ) : null}
        </Lienzo>
      </LienzoAjustado>
    </MarcoHerramienta>
  );
}
