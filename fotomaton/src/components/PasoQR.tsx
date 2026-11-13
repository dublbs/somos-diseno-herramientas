import { useEffect, useState } from 'react';
import { generarQR, hayBackend, publicarTarjeta } from '../lib/publicar';
import { BotonAccion } from '../../../shared/ui/Kit';

interface Props {
  blob: Blob; marco: string; tinta: string;
  conCredencial: boolean; // hay una persona jugando con su código en esta mesa
  alSubida: () => void; alTerminar: () => void; alVolver: () => void;
}

type Estado = { fase: 'aviso' } | { fase: 'subiendo' } | { fase: 'listo'; qr: string; enlace: string } | { fase: 'error' };

// Llévatela: aviso de privacidad → sube solo la tarjeta final → QR grande. Se abre encima del editor, como exportar
// en las otras mesas. Con la credencial, la miniatura llega también a su inventario (solo después de aceptar el aviso).
export function PasoQR({ blob, marco, tinta, conCredencial, alSubida, alTerminar, alVolver }: Props) {
  const [estado, setEstado] = useState<Estado>({ fase: 'aviso' });
  const subir = async () => {
    setEstado({ fase: 'subiendo' });
    try {
      const { enlace } = await publicarTarjeta(blob, marco, tinta);
      alSubida();
      setEstado({ fase: 'listo', qr: await generarQR(enlace), enlace });
    } catch (e) { console.warn(e); setEstado({ fase: 'error' }); }
  };
  useEffect(() => () => setEstado({ fase: 'aviso' }), []);

  return (
    <div className="qr-wrap">
      {estado.fase === 'aviso' && <>
        <h2 id="qr-t">Llévatela al celular</h2>
        <p className="k-ayuda">
          {conCredencial
            ? 'Tu foto queda disponible 24 horas para descargarla y en el inventario de tu credencial. Después se borra.'
            : 'Tu foto queda disponible 24 horas para descargarla y después se borra.'}
        </p>
        <div className="acciones-qr">
          <BotonAccion icono="ios_share" texto="Generar QR" primario onClick={subir} />
          <BotonAccion icono="arrow_back" texto="Volver" onClick={alVolver} />
        </div>
      </>}
      {estado.fase === 'subiendo' && <h2 id="qr-t">Subiendo tu tarjeta…</h2>}
      {estado.fase === 'listo' && <>
        <h2 id="qr-t">Escanea y te la llevas</h2>
        <div className="qr-caja"><img src={estado.qr} alt={`Código QR para descargar tu tarjeta: ${estado.enlace}`} /></div>
        <p className="k-ayuda">Apunta la cámara del celular al código. Está disponible 24 horas.</p>
        {!hayBackend && <p className="k-ayuda">Modo de prueba: sin servidor conectado, este QR solo abre en este mismo equipo.</p>}
        <div className="acciones-qr"><BotonAccion icono="check" texto="Terminar" primario onClick={alTerminar} /></div>
      </>}
      {estado.fase === 'error' && <>
        <h2 id="qr-t">No pudimos subirla</h2>
        <p className="k-ayuda">Revisa la conexión e inténtalo de nuevo. Tu foto sigue solo en esta tablet.</p>
        <div className="acciones-qr">
          <BotonAccion icono="restart_alt" texto="Reintentar" primario onClick={subir} />
          <BotonAccion icono="arrow_back" texto="Volver" onClick={alVolver} />
        </div>
      </>}
    </div>
  );
}
